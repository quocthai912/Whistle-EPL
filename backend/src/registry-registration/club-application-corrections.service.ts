import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import type { Prisma } from '../generated/prisma/client';
import { assertRevision, conflict, invalid, missing } from '../identity-access/accounts.dto';
import { hasSeasonRole } from '../identity-access/authority.policy';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import {
  MissingLockResource,
  type LockResource,
  type TransactionContext,
} from '../platform/transaction-context';
import type { RegulationActivationService } from '../season-regulations/regulation-activation.service';
import type {
  AffectedReferenceItemDto,
  AffectedReferenceKind,
  ClubApplicationCorrectionActionDto,
  ProposeClubApplicationCorrectionDto,
  UpdateClubApplicationCorrectionDraftDto,
} from './club-application-corrections.dto';
import {
  assertIndependentApprover,
  assertMastersAvailableForNewUse,
  discoverSeasonWithDueRules,
  requireOpenSeason,
  requireSeasonManager,
  requireSeasonRegistrationOfficer,
  requireSeasonRegistrationReader,
  resolveEffectiveRegulationWithInstant,
} from './registration-execution';
import {
  formatDateOnly,
  normalizeRepresentativePhone,
  optionalBoundedText,
  optionalSingleLineText,
  requiredBoundedText,
} from './registration-validation';

const OPEN_CORRECTION_STATES = new Set(['DRAFT', 'RECEIVED', 'PENDING_APPROVAL']);
const CANCELLABLE_CORRECTION_STATES = new Set([
  'DRAFT',
  'PENDING_APPROVAL',
  'NEEDS_SUPPLEMENTATION',
]);
const D100_ACTIONS = ['submit', 'approve', 'return', 'reject', 'withdraw', 'cancel'] as const;
type D100Action = (typeof D100_ACTIONS)[number];
const DESCRIPTIVE_FIELDS = [
  'coachName',
  'homeStadiumId',
  'representativeName',
  'representativePhone',
  'contactAddress',
  'notes',
] as const;

export type DescriptiveFieldKey = (typeof DESCRIPTIVE_FIELDS)[number];

export type DescriptiveFields = {
  coachName: string | null;
  homeStadiumId: string | null;
  representativeName: string | null;
  representativePhone: string | null;
  contactAddress: string | null;
  notes: string | null;
};

export type NormalizedDeclaredReference = {
  kind: AffectedReferenceKind;
  referenceId: string | null;
  note: string;
};

export type StoredAffectedReferences = {
  declared: NormalizedDeclaredReference[];
  discoveredRegistrationIds: string[];
  venueReviewRequired: boolean;
};

export type DescriptiveDiff = {
  changedFields: DescriptiveFieldKey[];
  before: Partial<Record<DescriptiveFieldKey, string | null>>;
  after: Partial<Record<DescriptiveFieldKey, string | null>>;
  venueReviewRequired: boolean;
};

function concealMissingCorrection(error: unknown): never {
  if (
    error instanceof MissingLockResource &&
    ['season', 'clubApplication', 'clubApplicationVersion', 'club', 'stadium'].includes(error.kind)
  ) {
    throw missing();
  }
  throw error;
}

/** Enforces D100 scope: only proven original descriptive recording errors are permitted. */
export function assertD100CorrectionScope(correctionKind?: string): void {
  if (correctionKind === undefined) return;
  const normalized = correctionKind.trim().toUpperCase();
  if (normalized === 'ORIGINAL_RECORDING_ERROR') return;
  throw invalid(
    'Quy trình đính chính D100 chỉ áp dụng cho sai sót ghi chép ban đầu ở phần thông tin mô tả BM1; không áp dụng cho thay đổi hoàn cảnh phát sinh sau này, danh sách cầu thủ dự kiến hoặc thay thế câu lạc bộ.',
  );
}

/** Normalizes optional descriptive updates for a D100 correction proposal or draft edit. */
export function normalizeDescriptiveCorrectionInput(input: {
  coachName?: string;
  homeStadiumId?: string;
  representativeName?: string;
  representativePhone?: string;
  contactAddress?: string;
  notes?: string | null;
}): Partial<DescriptiveFields> {
  const coachName =
    input.coachName === undefined ? undefined : optionalSingleLineText(input.coachName, 200);
  if (input.coachName !== undefined && !coachName) {
    throw invalid('Huấn luyện viên trưởng không được để trống.');
  }
  const representativeName =
    input.representativeName === undefined
      ? undefined
      : optionalSingleLineText(input.representativeName, 200);
  if (input.representativeName !== undefined && !representativeName) {
    throw invalid('Người đại diện không được để trống.');
  }
  const representativePhone =
    input.representativePhone === undefined
      ? undefined
      : normalizeRepresentativePhone(input.representativePhone);
  const contactAddress =
    input.contactAddress === undefined ? undefined : optionalBoundedText(input.contactAddress, 500);
  if (input.contactAddress !== undefined && !contactAddress) {
    throw invalid('Địa chỉ liên hệ không được để trống.');
  }
  const notes =
    input.notes === undefined
      ? undefined
      : input.notes === null
        ? null
        : (optionalBoundedText(input.notes, 2000) ?? null);
  const homeStadiumId =
    input.homeStadiumId === undefined ? undefined : input.homeStadiumId.toLowerCase();

  return {
    ...(coachName !== undefined ? { coachName } : {}),
    ...(homeStadiumId !== undefined ? { homeStadiumId } : {}),
    ...(representativeName !== undefined ? { representativeName } : {}),
    ...(representativePhone !== undefined ? { representativePhone } : {}),
    ...(contactAddress !== undefined ? { contactAddress } : {}),
    ...(notes !== undefined ? { notes } : {}),
  };
}

/** Validates and normalizes operator-declared affected references needing review. */
export function normalizeDeclaredReferences(
  items?: readonly AffectedReferenceItemDto[],
): NormalizedDeclaredReference[] {
  if (!items || items.length === 0) return [];
  if (items.length > 50) {
    throw invalid('Danh sách hồ sơ liên quan cần rà soát không được vượt quá 50 mục.');
  }
  return items.map((item) => ({
    kind: item.kind,
    referenceId: item.referenceId ? item.referenceId.toLowerCase() : null,
    note: requiredBoundedText(
      item.note,
      500,
      'Ghi chú cho hồ sơ liên quan cần rà soát không hợp lệ.',
    ),
  }));
}

/** Merges partial descriptive updates over a base descriptive snapshot. */
function mergeDescriptiveFields(
  base: DescriptiveFields,
  updates: Partial<DescriptiveFields>,
): DescriptiveFields {
  return {
    coachName: updates.coachName !== undefined ? updates.coachName : base.coachName,
    homeStadiumId: updates.homeStadiumId !== undefined ? updates.homeStadiumId : base.homeStadiumId,
    representativeName:
      updates.representativeName !== undefined
        ? updates.representativeName
        : base.representativeName,
    representativePhone:
      updates.representativePhone !== undefined
        ? updates.representativePhone
        : base.representativePhone,
    contactAddress:
      updates.contactAddress !== undefined ? updates.contactAddress : base.contactAddress,
    notes: updates.notes !== undefined ? updates.notes : base.notes,
  };
}

/** Ensures required D059 descriptive fields stay complete and at least one field differs from baseline. */
export function computeDescriptiveDiff(
  baseline: DescriptiveFields,
  candidate: DescriptiveFields,
): DescriptiveDiff {
  const missingFields: string[] = [];
  if (!candidate.coachName) missingFields.push('Huấn luyện viên trưởng');
  if (!candidate.homeStadiumId) missingFields.push('Sân nhà đăng ký');
  if (!candidate.representativeName) missingFields.push('Người đại diện');
  if (!candidate.representativePhone) missingFields.push('Số điện thoại đại diện');
  if (!candidate.contactAddress) missingFields.push('Địa chỉ liên hệ');
  if (missingFields.length > 0) {
    throw invalid(
      `Hồ sơ đính chính BM1 thiếu thông tin mô tả bắt buộc: ${missingFields.join(', ')}.`,
    );
  }

  const changedFields: DescriptiveFieldKey[] = [];
  const before: Partial<Record<DescriptiveFieldKey, string | null>> = {};
  const after: Partial<Record<DescriptiveFieldKey, string | null>> = {};

  for (const field of DESCRIPTIVE_FIELDS) {
    const prev = baseline[field] ?? null;
    const next = candidate[field] ?? null;
    if (prev !== next) {
      changedFields.push(field);
      before[field] = prev;
      after[field] = next;
    }
  }

  if (changedFields.length === 0) {
    throw invalid(
      'Đề xuất đính chính D100 phải có ít nhất một trường thông tin mô tả khác với phiên bản đã phê duyệt hiện hành.',
    );
  }

  return {
    changedFields,
    before,
    after,
    venueReviewRequired: changedFields.includes('homeStadiumId'),
  };
}

function readStoredDeclaredReferences(raw: Prisma.JsonValue | null): NormalizedDeclaredReference[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const declared = (raw as { declared?: unknown }).declared;
  if (!Array.isArray(declared)) return [];
  return declared
    .filter((item): item is NormalizedDeclaredReference => !!item && typeof item === 'object')
    .map((item) => ({
      kind: item.kind,
      referenceId: item.referenceId ?? null,
      note: item.note,
    }));
}

export class ClubApplicationCorrectionsService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly activation: RegulationActivationService,
    private readonly audit: AuditWriterService,
  ) {}

  private async discoverClubRegistrationIds(
    context: TransactionContext,
    seasonId: string,
    clubId: string,
  ): Promise<string[]> {
    const rows = await context.db.playerRegistration.findMany({
      where: { seasonId, clubId },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => row.id);
  }

  async list(request: Request, caseId: string) {
    try {
      return await this.execution.read(
        request,
        {
          locks: [{ kind: 'clubApplication', key: caseId, mode: 'shared' }],
          discover: async (db) => {
            const app = await db.clubApplication.findUnique({
              where: { id: caseId },
              select: { seasonId: true },
            });
            return app ? [{ kind: 'season', key: app.seasonId, mode: 'shared' }] : [];
          },
          authorize: async (context, accountId) => {
            const app = await context.db.clubApplication.findUnique({
              where: { id: caseId },
              select: { seasonId: true },
            });
            if (!app) throw missing();
            await requireSeasonRegistrationReader(context, accountId, app.seasonId);
          },
        },
        async (context, accountId) => {
          const app = await context.db.clubApplication.findUniqueOrThrow({
            where: { id: caseId },
            include: {
              season: { select: { id: true, state: true } },
              versions: {
                where: { versionKind: 'CORRECTION' },
                orderBy: { versionNumber: 'desc' },
                include: {
                  preparer: { select: { id: true, fullName: true, personnelCode: true } },
                  decider: { select: { id: true, fullName: true, personnelCode: true } },
                  editors: { select: { accountId: true } },
                  homeStadium: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      location: true,
                      discontinuedAt: true,
                    },
                  },
                },
              },
            },
          });

          const [canPrepare, canApprove] = await Promise.all([
            hasSeasonRole(context.db, accountId, ['REGISTRATION_OFFICER'], app.seasonId),
            hasSeasonRole(context.db, accountId, ['SEASON_MANAGER'], app.seasonId),
          ]);

          return {
            caseId: app.id,
            seasonId: app.seasonId,
            seasonState: app.season.state,
            currentAcceptedVersionId: app.currentAcceptedVersionId,
            items: app.versions.map((v) => ({
              id: v.id,
              versionNumber: v.versionNumber,
              versionKind: v.versionKind,
              predecessorVersionId: v.predecessorVersionId,
              baseAcceptedVersionId: v.baseAcceptedVersionId,
              revision: v.revision.toString(),
              state: v.state,
              preparedBy: v.preparedBy,
              preparer: v.preparer,
              editorIds: v.editors.map((e) => e.accountId),
              receivedAt: v.receivedAt?.toISOString() ?? null,
              receiptTimingStatus: v.receiptTimingStatus,
              receiptRegulationVersionId: v.receiptRegulationVersionId,
              submittedAt: v.submittedAt?.toISOString() ?? null,
              decidedAt: v.decidedAt?.toISOString() ?? null,
              decidedBy: v.decidedBy,
              decider: v.decider,
              decisionReason: v.decisionReason,
              coachName: v.coachName,
              homeStadiumId: v.homeStadiumId,
              homeStadium: v.homeStadium
                ? {
                    ...v.homeStadium,
                    discontinuedAt: v.homeStadium.discontinuedAt?.toISOString() ?? null,
                  }
                : null,
              representativeName: v.representativeName,
              representativePhone: v.representativePhone,
              contactAddress: v.contactAddress,
              notes: v.notes,
              correctionReason: v.correctionReason,
              correctionEvidence: v.correctionEvidence,
              affectedReferences: v.affectedReferences,
              approvalRegulationVersionId: v.approvalRegulationVersionId,
              officialSnapshot: v.officialSnapshot,
            })),
            capabilities: { canPrepare, canApprove },
          };
        },
      );
    } catch (error) {
      concealMissingCorrection(error);
    }
  }

  async propose(request: Request, caseId: string, input: ProposeClubApplicationCorrectionDto) {
    assertD100CorrectionScope(input.correctionKind);
    const baseAcceptedVersionId = input.baseAcceptedVersionId.toLowerCase();
    const descriptiveUpdates = normalizeDescriptiveCorrectionInput(input);
    const correctionReason = requiredBoundedText(
      input.correctionReason,
      2000,
      'Vui lòng nhập lý do đính chính hợp lệ.',
    );
    const correctionEvidence = requiredBoundedText(
      input.correctionEvidence,
      2000,
      'Vui lòng cung cấp căn cứ, bằng chứng chứng minh sai sót ban đầu.',
    );
    const declaredRefs = normalizeDeclaredReferences(input.affectedReferences);

    try {
      return await this.execution.execute(
        request,
        {
          locks: [
            { kind: 'clubApplication', key: caseId, mode: 'exclusive' },
            { kind: 'clubApplicationVersion', key: baseAcceptedVersionId, mode: 'shared' },
            ...(descriptiveUpdates.homeStadiumId
              ? [
                  {
                    kind: 'stadium' as const,
                    key: descriptiveUpdates.homeStadiumId,
                    mode: 'exclusive' as const,
                  },
                ]
              : []),
          ],
          discover: async (db) => {
            const app = await db.clubApplication.findUnique({
              where: { id: caseId },
              select: { seasonId: true },
            });
            return app ? [{ kind: 'season', key: app.seasonId, mode: 'shared' }] : [];
          },
          authorize: async (context, accountId) => {
            const app = await context.db.clubApplication.findUnique({
              where: { id: caseId },
              select: { seasonId: true },
            });
            if (!app) throw missing();
            await requireSeasonRegistrationOfficer(context, accountId, app.seasonId);
          },
        },
        async (context, accountId) => {
          const app = await context.db.clubApplication.findUniqueOrThrow({
            where: { id: caseId },
            include: {
              versions: {
                orderBy: { versionNumber: 'desc' },
                select: { id: true, versionNumber: true, state: true },
              },
            },
          });
          await requireOpenSeason(context, app.seasonId);

          if (!app.currentAcceptedVersionId) {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể đề xuất đính chính D100 cho hồ sơ câu lạc bộ đã được phê duyệt.',
            );
          }
          if (app.currentAcceptedVersionId !== baseAcceptedVersionId) {
            throw conflict(
              'BASIS_CHANGED',
              'Phiên bản hồ sơ đã phê duyệt hiện hành đã thay đổi; vui lòng tải lại trước khi đề xuất đính chính.',
            );
          }
          if (app.versions.some((v) => OPEN_CORRECTION_STATES.has(v.state))) {
            throw conflict(
              'STATE_CONFLICT',
              'Hồ sơ hiện đang có một phiên bản đính chính hoặc xử lý chưa hoàn tất.',
            );
          }

          const baseline = await context.db.clubApplicationVersion.findFirst({
            where: { id: baseAcceptedVersionId, caseId, state: 'APPROVED' },
            include: {
              proposedPlayers: { orderBy: { positionOrder: 'asc' } },
            },
          });
          if (!baseline) {
            throw conflict(
              'BASIS_CHANGED',
              'Không tìm thấy phiên bản phê duyệt gốc hợp lệ cho đề xuất đính chính.',
            );
          }

          const merged = mergeDescriptiveFields(baseline, descriptiveUpdates);

          const diff = computeDescriptiveDiff(baseline, merged);

          if (merged.homeStadiumId && merged.homeStadiumId !== baseline.homeStadiumId) {
            await assertMastersAvailableForNewUse(context, { stadiumId: merged.homeStadiumId });
          }

          const discoveredRegistrationIds = await this.discoverClubRegistrationIds(
            context,
            app.seasonId,
            app.clubId,
          );
          const affectedReferences: StoredAffectedReferences = {
            declared: declaredRefs,
            discoveredRegistrationIds,
            venueReviewRequired: diff.venueReviewRequired,
          };

          await context.recheckAuthority();
          const now = await context.now();
          const latest = app.versions[0];
          const versionNumber = latest ? latest.versionNumber + 1 : 1;
          const predecessorVersionId = latest ? latest.id : baseline.id;
          const versionId = randomUUID();

          await context.db.clubApplicationVersion.create({
            data: {
              id: versionId,
              seasonId: app.seasonId,
              caseId,
              versionNumber,
              versionKind: 'CORRECTION',
              preparedBy: accountId,
              predecessorVersionId,
              baseAcceptedVersionId: baseline.id,
              state: 'DRAFT',
              receivedAt: baseline.receivedAt,
              receiptRegulationVersionId: baseline.receiptRegulationVersionId,
              receiptTimingStatus: baseline.receiptTimingStatus,
              receiptWindowId: baseline.receiptWindowId,
              coachName: merged.coachName,
              homeStadiumId: merged.homeStadiumId,
              representativeName: merged.representativeName,
              representativePhone: merged.representativePhone,
              contactAddress: merged.contactAddress,
              notes: merged.notes,
              correctionReason,
              correctionEvidence,
              affectedReferences: affectedReferences as unknown as Prisma.InputJsonObject,
              createdAt: now,
              ...(baseline.proposedPlayers.length > 0
                ? {
                    proposedPlayers: {
                      create: baseline.proposedPlayers.map((item) => ({
                        id: randomUUID(),
                        playerId: item.playerId,
                        positionOrder: item.positionOrder,
                        shirtNumber: item.shirtNumber,
                        notes: item.notes,
                      })),
                    },
                  }
                : {}),
            },
          });

          const savedCase = await context.db.clubApplication.update({
            where: { id: caseId },
            data: {
              currentDraftVersionId: versionId,
              revision: { increment: 1 },
              updatedAt: now,
            },
            select: { revision: true },
          });

          await this.audit.append(context, {
            action: 'CLUB_APPLICATION_CORRECTION_DRAFT_CREATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ClubApplication',
            objectId: caseId,
            seasonId: app.seasonId,
            outcome: 'SUCCESS',
            reason: correctionReason,
            after: {
              caseId,
              versionId,
              versionNumber,
              baseAcceptedVersionId: baseline.id,
              state: 'DRAFT',
            },
          });

          return {
            caseId,
            versionId,
            versionNumber,
            versionKind: 'CORRECTION',
            predecessorVersionId,
            baseAcceptedVersionId: baseline.id,
            revision: '1',
            caseRevision: savedCase.revision.toString(),
            state: 'DRAFT',
            affectedReferences,
          };
        },
      );
    } catch (error) {
      concealMissingCorrection(error);
    }
  }

  async updateDraft(
    request: Request,
    caseId: string,
    versionId: string,
    input: UpdateClubApplicationCorrectionDraftDto,
  ) {
    assertD100CorrectionScope(input.correctionKind);
    const descriptiveUpdates = normalizeDescriptiveCorrectionInput(input);
    const correctionReason =
      input.correctionReason === undefined
        ? undefined
        : requiredBoundedText(
            input.correctionReason,
            2000,
            'Vui lòng nhập lý do đính chính hợp lệ.',
          );
    const correctionEvidence =
      input.correctionEvidence === undefined
        ? undefined
        : requiredBoundedText(
            input.correctionEvidence,
            2000,
            'Vui lòng cung cấp căn cứ, bằng chứng chứng minh sai sót ban đầu.',
          );
    const declaredRefs =
      input.affectedReferences === undefined
        ? undefined
        : normalizeDeclaredReferences(input.affectedReferences);

    try {
      return await this.execution.execute(
        request,
        {
          locks: [
            { kind: 'clubApplication', key: caseId, mode: 'exclusive' },
            { kind: 'clubApplicationVersion', key: versionId, mode: 'exclusive' },
            ...(descriptiveUpdates.homeStadiumId
              ? [
                  {
                    kind: 'stadium' as const,
                    key: descriptiveUpdates.homeStadiumId,
                    mode: 'exclusive' as const,
                  },
                ]
              : []),
          ],
          discover: async (db) => {
            const app = await db.clubApplication.findUnique({
              where: { id: caseId },
              select: { seasonId: true, currentAcceptedVersionId: true },
            });
            if (!app) return [];
            const locks: LockResource[] = [{ kind: 'season', key: app.seasonId, mode: 'shared' }];
            if (app.currentAcceptedVersionId && app.currentAcceptedVersionId !== versionId) {
              locks.push({
                kind: 'clubApplicationVersion',
                key: app.currentAcceptedVersionId,
                mode: 'shared',
              });
            }
            const ver = await db.clubApplicationVersion.findFirst({
              where: { id: versionId, caseId },
              select: { homeStadiumId: true, baseAcceptedVersionId: true },
            });
            if (ver?.baseAcceptedVersionId && ver.baseAcceptedVersionId !== versionId) {
              locks.push({
                kind: 'clubApplicationVersion',
                key: ver.baseAcceptedVersionId,
                mode: 'shared',
              });
            }
            if (
              !descriptiveUpdates.homeStadiumId &&
              ver?.homeStadiumId &&
              ver.baseAcceptedVersionId
            ) {
              const base = await db.clubApplicationVersion.findFirst({
                where: { id: ver.baseAcceptedVersionId, caseId },
                select: { homeStadiumId: true },
              });
              if (base && base.homeStadiumId !== ver.homeStadiumId) {
                locks.push({ kind: 'stadium', key: ver.homeStadiumId, mode: 'exclusive' });
              }
            }
            return locks;
          },
          authorize: async (context, accountId) => {
            const app = await context.db.clubApplication.findUnique({
              where: { id: caseId },
              select: { seasonId: true },
            });
            if (!app) throw missing();
            await requireSeasonRegistrationOfficer(context, accountId, app.seasonId);
          },
        },
        async (context, accountId) => {
          const app = await context.db.clubApplication.findUniqueOrThrow({
            where: { id: caseId },
            select: {
              id: true,
              seasonId: true,
              clubId: true,
              currentDraftVersionId: true,
              currentAcceptedVersionId: true,
            },
          });
          await requireOpenSeason(context, app.seasonId);

          const version = await context.db.clubApplicationVersion.findFirst({
            where: { id: versionId, caseId, versionKind: 'CORRECTION' },
          });
          if (!version) throw missing();
          if (version.state !== 'DRAFT' || app.currentDraftVersionId !== version.id) {
            throw conflict('STATE_CONFLICT', 'Chỉ có thể chỉnh sửa bản nháp đính chính đang mở.');
          }
          assertRevision(version.revision, input.expectedRevision);
          if (
            !version.baseAcceptedVersionId ||
            app.currentAcceptedVersionId !== version.baseAcceptedVersionId
          ) {
            throw conflict(
              'BASIS_CHANGED',
              'Phiên bản phê duyệt gốc của đề xuất đính chính này không còn là phiên bản hiện hành.',
            );
          }

          const baseline = await context.db.clubApplicationVersion.findFirst({
            where: { id: version.baseAcceptedVersionId, caseId, state: 'APPROVED' },
          });
          if (!baseline) {
            throw conflict(
              'BASIS_CHANGED',
              'Không tìm thấy phiên bản phê duyệt gốc hợp lệ cho đề xuất đính chính.',
            );
          }

          const merged = mergeDescriptiveFields(version, descriptiveUpdates);

          const diff = computeDescriptiveDiff(baseline, merged);
          if (merged.homeStadiumId && merged.homeStadiumId !== baseline.homeStadiumId) {
            await assertMastersAvailableForNewUse(context, { stadiumId: merged.homeStadiumId });
          }

          const discoveredRegistrationIds = await this.discoverClubRegistrationIds(
            context,
            app.seasonId,
            app.clubId,
          );
          const nextDeclared =
            declaredRefs ?? readStoredDeclaredReferences(version.affectedReferences);
          const affectedReferences: StoredAffectedReferences = {
            declared: nextDeclared,
            discoveredRegistrationIds,
            venueReviewRequired: diff.venueReviewRequired,
          };

          await context.recheckAuthority();
          const now = await context.now();
          const updated = await context.db.clubApplicationVersion.update({
            where: { id: version.id },
            data: {
              ...descriptiveUpdates,
              ...(correctionReason !== undefined ? { correctionReason } : {}),
              ...(correctionEvidence !== undefined ? { correctionEvidence } : {}),
              affectedReferences: affectedReferences as unknown as Prisma.InputJsonObject,
              revision: { increment: 1 },
            },
            select: { revision: true },
          });

          await context.db.clubApplicationVersionEditor.upsert({
            where: { versionId_accountId: { versionId: version.id, accountId } },
            create: { versionId: version.id, accountId, firstEditedAt: now },
            update: {},
          });

          await context.db.clubApplication.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });

          await this.audit.append(context, {
            action: 'CLUB_APPLICATION_CORRECTION_DRAFT_UPDATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ClubApplication',
            objectId: caseId,
            seasonId: app.seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              baseAcceptedVersionId: version.baseAcceptedVersionId,
              state: 'DRAFT',
              revision: updated.revision.toString(),
            },
          });

          return {
            caseId,
            versionId: version.id,
            revision: updated.revision.toString(),
            state: 'DRAFT',
            affectedReferences,
          };
        },
      );
    } catch (error) {
      concealMissingCorrection(error);
    }
  }

  async act(
    request: Request,
    caseId: string,
    versionId: string,
    action: string,
    input: ClubApplicationCorrectionActionDto,
  ) {
    if (!D100_ACTIONS.includes(action as D100Action)) {
      throw invalid('Thao tác đính chính hồ sơ không hợp lệ.');
    }
    const normalizedAction = action as D100Action;
    const reason =
      input.reason === undefined
        ? undefined
        : requiredBoundedText(input.reason, 2000, 'Lý do không hợp lệ.');
    if (['approve', 'return', 'reject', 'cancel'].includes(normalizedAction) && !reason) {
      throw invalid('Vui lòng nhập lý do thực hiện thao tác này.');
    }
    const requestedBaseId = input.baseAcceptedVersionId?.toLowerCase();
    if (normalizedAction === 'approve' && !requestedBaseId) {
      throw invalid('Vui lòng cung cấp chính xác phiên bản phê duyệt gốc cần đính chính.');
    }

    const operation = {
      locks: [
        { kind: 'clubApplication' as const, key: caseId, mode: 'exclusive' as const },
        { kind: 'clubApplicationVersion' as const, key: versionId, mode: 'exclusive' as const },
      ],
      discover: async (db: Prisma.TransactionClient) => {
        const app = await db.clubApplication.findUnique({
          where: { id: caseId },
          select: { seasonId: true, currentAcceptedVersionId: true },
        });
        if (!app) return [];
        const locks: LockResource[] =
          normalizedAction === 'approve'
            ? await discoverSeasonWithDueRules(db, app.seasonId, this.activation)
            : [{ kind: 'season', key: app.seasonId, mode: 'shared' }];

        const ver = await db.clubApplicationVersion.findFirst({
          where: { id: versionId, caseId },
          select: { baseAcceptedVersionId: true, homeStadiumId: true },
        });
        const baseIds = new Set<string>();
        if (app.currentAcceptedVersionId && app.currentAcceptedVersionId !== versionId) {
          baseIds.add(app.currentAcceptedVersionId);
        }
        if (ver?.baseAcceptedVersionId && ver.baseAcceptedVersionId !== versionId) {
          baseIds.add(ver.baseAcceptedVersionId);
        }
        for (const id of baseIds) {
          locks.push({ kind: 'clubApplicationVersion', key: id, mode: 'shared' });
        }

        if (
          (normalizedAction === 'approve' || normalizedAction === 'submit') &&
          ver?.homeStadiumId &&
          ver.baseAcceptedVersionId
        ) {
          const base = await db.clubApplicationVersion.findFirst({
            where: { id: ver.baseAcceptedVersionId, caseId },
            select: { homeStadiumId: true },
          });
          if (base && base.homeStadiumId !== ver.homeStadiumId) {
            locks.push({ kind: 'stadium', key: ver.homeStadiumId, mode: 'exclusive' });
          }
        }
        return locks;
      },
      authorize: async (context: TransactionContext, accountId: string) => {
        const app = await context.db.clubApplication.findUnique({
          where: { id: caseId },
          select: { seasonId: true },
        });
        if (!app) throw missing();
        if (['approve', 'return', 'reject'].includes(normalizedAction)) {
          await requireSeasonManager(context, accountId, app.seasonId);
          return;
        }
        await requireSeasonRegistrationOfficer(context, accountId, app.seasonId);
      },
    };

    try {
      if (normalizedAction === 'approve') {
        const critical = await this.execution.executeCritical(
          request,
          operation,
          async () => ({
            action: 'CLUB_APPLICATION_CORRECTION_APPROVED' as const,
            targetId: caseId,
            payload: {
              expectedRevision: input.expectedRevision,
              submittedVersionId: versionId,
              baseAcceptedVersionId: requestedBaseId!,
              reason: reason!,
            },
          }),
          async (context, command) => {
            const app = await context.db.clubApplication.findUniqueOrThrow({
              where: { id: caseId },
              include: {
                club: { select: { id: true, code: true, name: true, abbreviation: true } },
              },
            });
            const version = await context.db.clubApplicationVersion.findFirst({
              where: { id: versionId, caseId, versionKind: 'CORRECTION' },
              include: {
                editors: { select: { accountId: true } },
                homeStadium: { select: { id: true, code: true, name: true, location: true } },
                proposedPlayers: {
                  orderBy: { positionOrder: 'asc' },
                  include: {
                    player: {
                      select: {
                        id: true,
                        code: true,
                        fullName: true,
                        birthDate: true,
                        nationalityCode: true,
                        positionCode: true,
                      },
                    },
                  },
                },
              },
            });
            if (!version) throw missing();
            assertRevision(version.revision, input.expectedRevision);
            if (version.state !== 'PENDING_APPROVAL') {
              throw conflict(
                'STATE_CONFLICT',
                'Chỉ có thể phê duyệt phiên bản đính chính đang ở trạng thái Chờ phê duyệt.',
              );
            }
            if (
              !version.baseAcceptedVersionId ||
              version.baseAcceptedVersionId !== requestedBaseId ||
              app.currentAcceptedVersionId !== version.baseAcceptedVersionId
            ) {
              throw conflict(
                'BASIS_CHANGED',
                'Phiên bản phê duyệt gốc đã thay đổi; không thể phê duyệt đề xuất đính chính trên cơ sở cũ.',
              );
            }
            assertIndependentApprover(
              version.preparedBy,
              version.editors.map((e) => e.accountId),
              command.accountId,
            );

            const baseline = await context.db.clubApplicationVersion.findFirst({
              where: { id: version.baseAcceptedVersionId, caseId, state: 'APPROVED' },
            });
            if (!baseline) {
              throw conflict('BASIS_CHANGED', 'Không tìm thấy phiên bản phê duyệt gốc hợp lệ.');
            }
            const diff = computeDescriptiveDiff(baseline, version);

            if (version.homeStadiumId && version.homeStadiumId !== baseline.homeStadiumId) {
              await assertMastersAvailableForNewUse(context, {
                stadiumId: version.homeStadiumId,
              });
            }

            // D100: requires Open season & resolved effective regulation, WITHOUT BM1 intake window or D053 exception!
            const { regulation: effectiveRegulation, resolvedAt: now } =
              await resolveEffectiveRegulationWithInstant(context, app.seasonId, this.activation);

            const discoveredRegistrationIds = await this.discoverClubRegistrationIds(
              context,
              app.seasonId,
              app.clubId,
            );
            await context.recheckAuthority();
            const declared = readStoredDeclaredReferences(version.affectedReferences);
            const snapshotAffectedReferences: StoredAffectedReferences = {
              declared,
              discoveredRegistrationIds,
              venueReviewRequired: diff.venueReviewRequired,
            };

            const baselineSnapshot =
              baseline.officialSnapshot &&
              typeof baseline.officialSnapshot === 'object' &&
              !Array.isArray(baseline.officialSnapshot)
                ? (baseline.officialSnapshot as Record<string, unknown>)
                : null;
            const clubSnapshot =
              baselineSnapshot?.club &&
              typeof baselineSnapshot.club === 'object' &&
              !Array.isArray(baselineSnapshot.club)
                ? baselineSnapshot.club
                : {
                    id: app.club.id,
                    code: app.club.code,
                    name: app.club.name,
                    abbreviation: app.club.abbreviation,
                  };
            const homeStadiumSnapshot =
              version.homeStadiumId === baseline.homeStadiumId &&
              baselineSnapshot &&
              'homeStadium' in baselineSnapshot
                ? baselineSnapshot.homeStadium
                : version.homeStadium
                  ? {
                      id: version.homeStadium.id,
                      code: version.homeStadium.code,
                      name: version.homeStadium.name,
                      location: version.homeStadium.location,
                    }
                  : null;
            const proposedPlayersSnapshot = Array.isArray(baselineSnapshot?.proposedPlayers)
              ? baselineSnapshot.proposedPlayers
              : version.proposedPlayers.map((item) => ({
                  playerId: item.playerId,
                  code: item.player.code,
                  fullName: item.player.fullName,
                  birthDate: formatDateOnly(item.player.birthDate),
                  nationalityCode: item.player.nationalityCode,
                  positionCode: item.player.positionCode,
                  positionOrder: item.positionOrder,
                  shirtNumber: item.shirtNumber,
                  notes: item.notes,
                }));
            const originalApprovedAt =
              typeof baselineSnapshot?.originalApprovedAt === 'string'
                ? baselineSnapshot.originalApprovedAt
                : (baseline.decidedAt?.toISOString() ?? null);
            const receiptExceptionVersionId =
              typeof baselineSnapshot?.receiptExceptionVersionId === 'string'
                ? baselineSnapshot.receiptExceptionVersionId
                : null;

            const officialSnapshot = {
              club: clubSnapshot,
              homeStadium: homeStadiumSnapshot,
              coachName: version.coachName,
              representativeName: version.representativeName,
              representativePhone: version.representativePhone,
              contactAddress: version.contactAddress,
              notes: version.notes,
              receivedAt: version.receivedAt?.toISOString() ?? null,
              receiptTimingStatus: version.receiptTimingStatus,
              receiptRegulationVersionId: version.receiptRegulationVersionId,
              receiptWindowId: version.receiptWindowId,
              receiptExceptionVersionId,
              baseAcceptedVersionId: baseline.id,
              originalApprovedAt,
              correctionReason: version.correctionReason,
              correctionEvidence: version.correctionEvidence,
              affectedReferences: snapshotAffectedReferences,
              changes: {
                changedFields: diff.changedFields,
                before: diff.before,
                after: diff.after,
              },
              approvalRegulationVersionId: effectiveRegulation.id,
              approvedAt: now.toISOString(),
              proposedPlayers: proposedPlayersSnapshot,
            };

            const updated = await context.db.clubApplicationVersion.update({
              where: { id: version.id },
              data: {
                state: 'APPROVED',
                decidedAt: now,
                decidedBy: command.accountId,
                decisionReason: reason,
                approvalRegulationVersionId: effectiveRegulation.id,
                officialSnapshot: officialSnapshot as unknown as Prisma.InputJsonObject,
                revision: { increment: 1 },
              },
              select: { revision: true },
            });

            await context.db.clubApplication.update({
              where: { id: caseId },
              data: {
                currentAcceptedVersionId: version.id,
                revision: { increment: 1 },
                updatedAt: now,
              },
            });

            await this.audit.append(context, {
              action: 'CLUB_APPLICATION_CORRECTION_APPROVED',
              actor: { kind: 'ACCOUNT', accountId: command.accountId },
              objectKind: 'ClubApplication',
              objectId: caseId,
              seasonId: app.seasonId,
              outcome: 'SUCCESS',
              reason,
              before: {
                caseId,
                versionId: version.id,
                versionNumber: version.versionNumber,
                baseAcceptedVersionId: baseline.id,
                state: 'PENDING_APPROVAL',
                ...diff.before,
              },
              after: {
                caseId,
                versionId: version.id,
                versionNumber: version.versionNumber,
                baseAcceptedVersionId: baseline.id,
                state: 'APPROVED',
                approvedAt: now.toISOString(),
                approvalRegulationVersionId: effectiveRegulation.id,
                changedFields: diff.changedFields.join(','),
                correctionEvidence: version.correctionEvidence ?? null,
                affectedReferenceCount: declared.length + discoveredRegistrationIds.length,
                venueReviewRequired: diff.venueReviewRequired,
                ...diff.after,
              },
            });

            return {
              status: 200,
              data: { id: caseId, revision: updated.revision.toString(), relatedId: version.id },
            };
          },
          async (_context, outcome) => outcome,
        );

        return {
          ...critical.data,
          caseId,
          versionId: critical.data.relatedId ?? versionId,
          baseAcceptedVersionId: requestedBaseId,
          state: 'APPROVED',
        };
      }

      return await this.execution.execute(request, operation, async (context, accountId) => {
        const app = await context.db.clubApplication.findUniqueOrThrow({
          where: { id: caseId },
          select: {
            id: true,
            seasonId: true,
            currentDraftVersionId: true,
            currentAcceptedVersionId: true,
          },
        });
        const version = await context.db.clubApplicationVersion.findFirst({
          where: { id: versionId, caseId, versionKind: 'CORRECTION' },
          include: { editors: { select: { accountId: true } } },
        });
        if (!version) throw missing();
        assertRevision(version.revision, input.expectedRevision);
        const editorIds = version.editors.map((e) => e.accountId);

        if (normalizedAction === 'submit') {
          if (version.state !== 'DRAFT') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể trình duyệt bản nháp đính chính đang ở trạng thái Nháp.',
            );
          }
          await requireOpenSeason(context, app.seasonId);
          if (
            !version.baseAcceptedVersionId ||
            app.currentAcceptedVersionId !== version.baseAcceptedVersionId
          ) {
            throw conflict(
              'BASIS_CHANGED',
              'Phiên bản phê duyệt gốc đã thay đổi; vui lòng lập đề xuất đính chính mới.',
            );
          }
          const baseline = await context.db.clubApplicationVersion.findFirst({
            where: { id: version.baseAcceptedVersionId, caseId, state: 'APPROVED' },
          });
          if (!baseline) {
            throw conflict('BASIS_CHANGED', 'Không tìm thấy phiên bản phê duyệt gốc hợp lệ.');
          }
          computeDescriptiveDiff(baseline, version);
          if (version.homeStadiumId && version.homeStadiumId !== baseline.homeStadiumId) {
            await assertMastersAvailableForNewUse(context, { stadiumId: version.homeStadiumId });
          }

          await context.recheckAuthority();
          const now = await context.now();
          const updated = await context.db.clubApplicationVersion.update({
            where: { id: version.id },
            data: {
              state: 'PENDING_APPROVAL',
              submittedAt: now,
              revision: { increment: 1 },
            },
            select: { revision: true },
          });
          await context.db.clubApplicationVersionEditor.upsert({
            where: { versionId_accountId: { versionId: version.id, accountId } },
            create: { versionId: version.id, accountId, firstEditedAt: now },
            update: {},
          });
          await context.db.clubApplication.update({
            where: { id: caseId },
            data: {
              currentDraftVersionId:
                app.currentDraftVersionId === version.id ? null : app.currentDraftVersionId,
              revision: { increment: 1 },
              updatedAt: now,
            },
          });
          await this.audit.append(context, {
            action: 'CLUB_APPLICATION_CORRECTION_SUBMITTED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ClubApplication',
            objectId: caseId,
            seasonId: app.seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              baseAcceptedVersionId: version.baseAcceptedVersionId,
              state: 'PENDING_APPROVAL',
              submittedAt: now.toISOString(),
            },
          });
          return {
            caseId,
            versionId: version.id,
            baseAcceptedVersionId: version.baseAcceptedVersionId,
            revision: updated.revision.toString(),
            state: 'PENDING_APPROVAL',
            submittedAt: now.toISOString(),
          };
        }

        if (normalizedAction === 'return') {
          if (version.state !== 'PENDING_APPROVAL') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể trả lại bổ sung đối với đề xuất đính chính đang Chờ phê duyệt.',
            );
          }
          assertIndependentApprover(version.preparedBy, editorIds, accountId);
          await requireOpenSeason(context, app.seasonId);
          await context.recheckAuthority();
          const now = await context.now();
          const updated = await context.db.clubApplicationVersion.update({
            where: { id: version.id },
            data: {
              state: 'NEEDS_SUPPLEMENTATION',
              decidedAt: now,
              decidedBy: accountId,
              decisionReason: reason,
              revision: { increment: 1 },
            },
            select: { revision: true },
          });
          await context.db.clubApplication.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });
          await this.audit.append(context, {
            action: 'CLUB_APPLICATION_CORRECTION_RETURNED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ClubApplication',
            objectId: caseId,
            seasonId: app.seasonId,
            outcome: 'SUCCESS',
            reason,
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              baseAcceptedVersionId: version.baseAcceptedVersionId!,
              state: 'NEEDS_SUPPLEMENTATION',
              decidedAt: now.toISOString(),
            },
          });
          return {
            caseId,
            versionId: version.id,
            revision: updated.revision.toString(),
            state: 'NEEDS_SUPPLEMENTATION',
          };
        }

        if (normalizedAction === 'reject') {
          if (version.state !== 'PENDING_APPROVAL') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể từ chối đề xuất đính chính đang Chờ phê duyệt.',
            );
          }
          assertIndependentApprover(version.preparedBy, editorIds, accountId);
          await requireOpenSeason(context, app.seasonId);
          await context.recheckAuthority();
          const now = await context.now();
          const updated = await context.db.clubApplicationVersion.update({
            where: { id: version.id },
            data: {
              state: 'REJECTED',
              decidedAt: now,
              decidedBy: accountId,
              decisionReason: reason,
              revision: { increment: 1 },
            },
            select: { revision: true },
          });
          await context.db.clubApplication.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });
          await this.audit.append(context, {
            action: 'CLUB_APPLICATION_CORRECTION_REJECTED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ClubApplication',
            objectId: caseId,
            seasonId: app.seasonId,
            outcome: 'SUCCESS',
            reason,
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              baseAcceptedVersionId: version.baseAcceptedVersionId!,
              state: 'REJECTED',
              decidedAt: now.toISOString(),
            },
          });
          return {
            caseId,
            versionId: version.id,
            revision: updated.revision.toString(),
            state: 'REJECTED',
          };
        }

        if (normalizedAction === 'withdraw') {
          if (version.state !== 'PENDING_APPROVAL') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể rút đề xuất đính chính đang Chờ phê duyệt.',
            );
          }
          await requireOpenSeason(context, app.seasonId);
          await context.recheckAuthority();
          const now = await context.now();
          const updated = await context.db.clubApplicationVersion.update({
            where: { id: version.id },
            data: {
              state: 'WITHDRAWN',
              decidedAt: now,
              decidedBy: accountId,
              decisionReason: reason ?? null,
              revision: { increment: 1 },
            },
            select: { revision: true },
          });
          await context.db.clubApplication.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });
          await this.audit.append(context, {
            action: 'CLUB_APPLICATION_CORRECTION_WITHDRAWN',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ClubApplication',
            objectId: caseId,
            seasonId: app.seasonId,
            outcome: 'SUCCESS',
            reason,
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              baseAcceptedVersionId: version.baseAcceptedVersionId!,
              state: 'WITHDRAWN',
              decidedAt: now.toISOString(),
            },
          });
          return {
            caseId,
            versionId: version.id,
            revision: updated.revision.toString(),
            state: 'WITHDRAWN',
          };
        }

        // cancel
        if (!CANCELLABLE_CORRECTION_STATES.has(version.state)) {
          throw conflict(
            'STATE_CONFLICT',
            'Chỉ có thể hủy đề xuất đính chính chưa được phê duyệt.',
          );
        }
        await requireOpenSeason(context, app.seasonId);
        await context.recheckAuthority();
        const now = await context.now();
        const updated = await context.db.clubApplicationVersion.update({
          where: { id: version.id },
          data: {
            state: 'CANCELLED',
            decidedAt: now,
            decidedBy: accountId,
            decisionReason: reason,
            revision: { increment: 1 },
          },
          select: { revision: true },
        });
        await context.db.clubApplication.update({
          where: { id: caseId },
          data: {
            currentDraftVersionId:
              app.currentDraftVersionId === version.id ? null : app.currentDraftVersionId,
            revision: { increment: 1 },
            updatedAt: now,
          },
        });
        await this.audit.append(context, {
          action: 'CLUB_APPLICATION_CORRECTION_CANCELLED',
          actor: { kind: 'ACCOUNT', accountId },
          objectKind: 'ClubApplication',
          objectId: caseId,
          seasonId: app.seasonId,
          outcome: 'SUCCESS',
          reason,
          after: {
            caseId,
            versionId: version.id,
            versionNumber: version.versionNumber,
            baseAcceptedVersionId: version.baseAcceptedVersionId!,
            state: 'CANCELLED',
            decidedAt: now.toISOString(),
          },
        });
        return {
          caseId,
          versionId: version.id,
          revision: updated.revision.toString(),
          state: 'CANCELLED',
        };
      });
    } catch (error) {
      concealMissingCorrection(error);
    }
  }
}
