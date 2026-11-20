import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import type { BusinessHistoryService } from '../audit/business-history.service';
import type { Prisma } from '../generated/prisma/client';
import {
  assertRevision,
  conflict,
  invalid,
  listQuery,
  missing,
} from '../identity-access/accounts.dto';
import { hasSeasonRole } from '../identity-access/authority.policy';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { withPaginationMeta } from '../platform/response-envelope.interceptor';
import {
  MissingLockResource,
  type LockResource,
  type TransactionContext,
} from '../platform/transaction-context';
import type { RegulationActivationService } from '../season-regulations/regulation-activation.service';
import type {
  ClubApplicationActionDto,
  CreateClubApplicationDto,
  ProposedPlayerItemDto,
  UpdateClubApplicationDraftDto,
} from './club-applications.dto';
import {
  assertIndependentApprover,
  assertMastersAvailableForNewUse,
  discoverSeasonWithDueRules,
  requireOpenSeason,
  requireSeasonManager,
  requireSeasonRegistrationOfficer,
  requireSeasonRegistrationReader,
  resolveEffectiveRegulationForWrite,
} from './registration-execution';
import type { RegistrationIntakeService } from './registration-intake.service';
import {
  formatDateOnly,
  normalizeRepresentativePhone,
  optionalBoundedText,
  optionalSingleLineText,
  requiredBoundedText,
} from './registration-validation';

const OPEN_ROUND_STATES = new Set(['DRAFT', 'RECEIVED', 'PENDING_APPROVAL']);
const CANCELLABLE_STATES = new Set([
  'DRAFT',
  'RECEIVED',
  'PENDING_APPROVAL',
  'NEEDS_SUPPLEMENTATION',
]);
const ALLOWED_STATES = [
  'ALL',
  'DRAFT',
  'RECEIVED',
  'PENDING_APPROVAL',
  'NEEDS_SUPPLEMENTATION',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'CANCELLED',
] as const;
const LIST_SORTS = ['updatedAt:desc', 'clubName:asc', 'clubName:desc', 'id:asc'] as const;

function concealMissingApplication(error: unknown): never {
  if (
    error instanceof MissingLockResource &&
    ['season', 'clubApplication', 'clubApplicationVersion', 'club', 'stadium'].includes(error.kind)
  ) {
    throw missing();
  }
  throw error;
}

type NormalizedDraftFields = {
  coachName?: string | null;
  homeStadiumId?: string | null;
  representativeName?: string | null;
  representativePhone?: string | null;
  contactAddress?: string | null;
  notes?: string | null;
  proposedPlayers?: {
    playerId: string;
    positionOrder: number;
    shirtNumber: number | null;
    notes: string | null;
  }[];
};

function normalizeDraftFields(input: {
  coachName?: string | null;
  homeStadiumId?: string | null;
  representativeName?: string | null;
  representativePhone?: string | null;
  contactAddress?: string | null;
  notes?: string | null;
  proposedPlayers?: ProposedPlayerItemDto[];
}): NormalizedDraftFields {
  const coachName = optionalSingleLineText(input.coachName, 200);
  const representativeName = optionalSingleLineText(input.representativeName, 200);
  const representativePhone =
    input.representativePhone === undefined
      ? undefined
      : input.representativePhone === null || !input.representativePhone.trim()
        ? null
        : normalizeRepresentativePhone(input.representativePhone);
  const contactAddress = optionalBoundedText(input.contactAddress, 500);
  const notes = optionalBoundedText(input.notes, 2000);
  const homeStadiumId =
    input.homeStadiumId === undefined
      ? undefined
      : input.homeStadiumId === null
        ? null
        : input.homeStadiumId.toLowerCase();

  let proposedPlayers: NormalizedDraftFields['proposedPlayers'];
  if (input.proposedPlayers !== undefined) {
    const seen = new Set<string>();
    proposedPlayers = input.proposedPlayers.map((item, index) => {
      const playerId = item.playerId.toLowerCase();
      if (seen.has(playerId)) {
        throw invalid('Danh sách cầu thủ dự kiến không được chứa cầu thủ trùng lặp.');
      }
      seen.add(playerId);
      const itemNotes = optionalBoundedText(item.notes, 2000) ?? null;
      return {
        playerId,
        positionOrder: index + 1,
        shirtNumber: item.shirtNumber ?? null,
        notes: itemNotes,
      };
    });
  }

  return {
    ...(coachName !== undefined ? { coachName } : {}),
    ...(homeStadiumId !== undefined ? { homeStadiumId } : {}),
    ...(representativeName !== undefined ? { representativeName } : {}),
    ...(representativePhone !== undefined ? { representativePhone } : {}),
    ...(contactAddress !== undefined ? { contactAddress } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(proposedPlayers !== undefined ? { proposedPlayers } : {}),
  };
}

function assertD059Completeness(version: {
  coachName: string | null;
  homeStadiumId: string | null;
  representativeName: string | null;
  representativePhone: string | null;
  contactAddress: string | null;
  proposedPlayers: readonly unknown[];
}): void {
  const missingFields: string[] = [];
  if (!version.coachName) missingFields.push('Huấn luyện viên trưởng');
  if (!version.homeStadiumId) missingFields.push('Sân nhà đăng ký');
  if (!version.representativeName) missingFields.push('Người đại diện');
  if (!version.representativePhone) missingFields.push('Số điện thoại đại diện');
  if (!version.contactAddress) missingFields.push('Địa chỉ liên hệ');
  if (!version.proposedPlayers.length)
    missingFields.push('Danh sách cầu thủ dự kiến (ít nhất 1 cầu thủ)');
  if (missingFields.length > 0) {
    throw invalid(
      `Hồ sơ tham dự câu lạc bộ chưa đủ thông tin bắt buộc để gửi duyệt: ${missingFields.join(', ')}.`,
    );
  }
}

const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ClubApplicationsService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly activation: RegulationActivationService,
    private readonly intake: RegistrationIntakeService,
    private readonly audit: AuditWriterService,
    private readonly businessHistory: BusinessHistoryService,
  ) {}

  async references(request: Request, seasonId: string) {
    try {
      return await this.execution.read(
        request,
        {
          locks: [{ kind: 'season', key: seasonId, mode: 'shared' }],
          authorize: (context, accountId) =>
            requireSeasonRegistrationReader(context, accountId, seasonId),
        },
        async (context, accountId) => {
          const season = await context.db.season.findUnique({
            where: { id: seasonId },
            select: {
              id: true,
              code: true,
              name: true,
              state: true,
              currentRegulationVersionId: true,
            },
          });
          if (!season) throw missing();
          await this.activation.requireResolvedBasis(context, seasonId);
          const [effectiveRegulation, clubs, stadiums, players, canPrepare, canApprove] =
            await Promise.all([
              season.currentRegulationVersionId
                ? context.db.regulationVersion.findUnique({
                    where: { id: season.currentRegulationVersionId },
                    select: {
                      id: true,
                      versionNumber: true,
                      activeFrom: true,
                      registrationWindows: {
                        where: { intakeKind: 'CLUB_APPLICATION' },
                        orderBy: [{ opensAt: 'asc' }, { id: 'asc' }],
                        select: { id: true, intakeKind: true, opensAt: true, closesAt: true },
                      },
                    },
                  })
                : null,
              context.db.club.findMany({
                orderBy: [{ name: 'asc' }, { id: 'asc' }],
                select: {
                  id: true,
                  code: true,
                  name: true,
                  abbreviation: true,
                  discontinuedAt: true,
                },
              }),
              context.db.stadium.findMany({
                orderBy: [{ name: 'asc' }, { id: 'asc' }],
                select: {
                  id: true,
                  code: true,
                  name: true,
                  location: true,
                  discontinuedAt: true,
                },
              }),
              context.db.player.findMany({
                orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
                select: {
                  id: true,
                  code: true,
                  fullName: true,
                  birthDate: true,
                  nationalityCode: true,
                  positionCode: true,
                },
              }),
              hasSeasonRole(context.db, accountId, ['REGISTRATION_OFFICER'], seasonId),
              hasSeasonRole(context.db, accountId, ['SEASON_MANAGER'], seasonId),
            ]);

          return {
            season: {
              id: season.id,
              code: season.code,
              name: season.name,
              state: season.state,
            },
            effectiveRegulation: effectiveRegulation
              ? {
                  id: effectiveRegulation.id,
                  versionNumber: effectiveRegulation.versionNumber,
                  activeFrom: effectiveRegulation.activeFrom?.toISOString() ?? null,
                  windows: effectiveRegulation.registrationWindows.map((w) => ({
                    id: w.id,
                    intakeKind: w.intakeKind,
                    opensAt: w.opensAt.toISOString(),
                    closesAt: w.closesAt.toISOString(),
                  })),
                }
              : null,
            clubs: clubs.map((c) => ({
              ...c,
              discontinuedAt: c.discontinuedAt?.toISOString() ?? null,
            })),
            stadiums: stadiums.map((s) => ({
              ...s,
              discontinuedAt: s.discontinuedAt?.toISOString() ?? null,
            })),
            players: players.map((p) => ({
              ...p,
              birthDate: formatDateOnly(p.birthDate),
            })),
            capabilities: { canPrepare, canApprove },
          };
        },
      );
    } catch (error) {
      concealMissingApplication(error);
    }
  }

  async list(request: Request, seasonId: string, query: Record<string, unknown>) {
    const { values, page, pageSize, sort, skip, take } = listQuery(
      query,
      ['search', 'state', 'clubId'],
      LIST_SORTS,
    );
    const state = values.state ?? 'ALL';
    if (!ALLOWED_STATES.includes(state as (typeof ALLOWED_STATES)[number])) throw invalid();
    const rawClubId = values.clubId?.trim();
    const clubId = !rawClubId || rawClubId === 'ALL' ? undefined : rawClubId.toLowerCase();
    if (clubId && !UUID4.test(clubId)) throw invalid();
    const search = values.search?.trim();

    try {
      return await this.execution.read(
        request,
        {
          locks: [{ kind: 'season', key: seasonId, mode: 'shared' }],
          authorize: (context, accountId) =>
            requireSeasonRegistrationReader(context, accountId, seasonId),
        },
        async (context, accountId) => {
          const where: Prisma.ClubApplicationWhereInput = {
            seasonId,
            ...(clubId ? { clubId } : {}),
            ...(search
              ? {
                  OR: [
                    { club: { code: { contains: search, mode: 'insensitive' } } },
                    { club: { name: { contains: search, mode: 'insensitive' } } },
                    { club: { abbreviation: { contains: search, mode: 'insensitive' } } },
                    {
                      versions: {
                        some: {
                          OR: [
                            { coachName: { contains: search, mode: 'insensitive' } },
                            { representativeName: { contains: search, mode: 'insensitive' } },
                          ],
                        },
                      },
                    },
                  ],
                }
              : {}),
          };

          const allMatches = await context.db.clubApplication.findMany({
            where,
            include: {
              club: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  abbreviation: true,
                  discontinuedAt: true,
                },
              },
              versions: {
                orderBy: { versionNumber: 'desc' },
                take: 1,
                include: {
                  homeStadium: {
                    select: { id: true, code: true, name: true, discontinuedAt: true },
                  },
                  _count: { select: { proposedPlayers: true } },
                  receiptExceptions: {
                    where: { state: 'APPROVED' },
                    select: { id: true },
                    take: 1,
                  },
                },
              },
            },
          });

          const filtered =
            state === 'ALL'
              ? allMatches
              : allMatches.filter((item) => item.versions[0]?.state === state);

          filtered.sort((a, b) => {
            if (sort === 'clubName:asc')
              return a.club.name.localeCompare(b.club.name, 'vi') || a.id.localeCompare(b.id);
            if (sort === 'clubName:desc')
              return b.club.name.localeCompare(a.club.name, 'vi') || a.id.localeCompare(b.id);
            if (sort === 'id:asc') return a.id.localeCompare(b.id);
            return b.updatedAt.getTime() - a.updatedAt.getTime() || a.id.localeCompare(b.id);
          });

          const total = filtered.length;
          const pageItems = filtered.slice(skip, skip + take);
          const [canPrepare, canApprove] = await Promise.all([
            hasSeasonRole(context.db, accountId, ['REGISTRATION_OFFICER'], seasonId),
            hasSeasonRole(context.db, accountId, ['SEASON_MANAGER'], seasonId),
          ]);

          return withPaginationMeta(
            {
              items: pageItems.map((item) => {
                const latest = item.versions[0] ?? null;
                return {
                  id: item.id,
                  seasonId: item.seasonId,
                  revision: item.revision.toString(),
                  currentDraftVersionId: item.currentDraftVersionId,
                  currentAcceptedVersionId: item.currentAcceptedVersionId,
                  updatedAt: item.updatedAt.toISOString(),
                  club: {
                    ...item.club,
                    discontinuedAt: item.club.discontinuedAt?.toISOString() ?? null,
                  },
                  latestVersion: latest
                    ? {
                        id: latest.id,
                        versionNumber: latest.versionNumber,
                        versionKind: latest.versionKind,
                        revision: latest.revision.toString(),
                        state: latest.state,
                        coachName: latest.coachName,
                        representativeName: latest.representativeName,
                        homeStadium: latest.homeStadium
                          ? {
                              ...latest.homeStadium,
                              discontinuedAt:
                                latest.homeStadium.discontinuedAt?.toISOString() ?? null,
                            }
                          : null,
                        receivedAt: latest.receivedAt?.toISOString() ?? null,
                        receiptTimingStatus: latest.receiptTimingStatus,
                        submittedAt: latest.submittedAt?.toISOString() ?? null,
                        decidedAt: latest.decidedAt?.toISOString() ?? null,
                        proposedPlayerCount: latest._count.proposedPlayers,
                        hasApprovedException: latest.receiptExceptions.length > 0,
                      }
                    : null,
                };
              }),
              capabilities: { canPrepare, canApprove },
            },
            { page, pageSize, total },
          );
        },
      );
    } catch (error) {
      concealMissingApplication(error);
    }
  }

  async detail(request: Request, caseId: string) {
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
              season: { select: { id: true, code: true, name: true, state: true } },
              club: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  abbreviation: true,
                  discontinuedAt: true,
                },
              },
              versions: {
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
                  receiptWindow: {
                    select: { id: true, intakeKind: true, opensAt: true, closesAt: true },
                  },
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
                  receiptExceptions: {
                    orderBy: { versionNumber: 'desc' },
                    include: {
                      preparer: { select: { id: true, fullName: true, personnelCode: true } },
                      decider: { select: { id: true, fullName: true, personnelCode: true } },
                      editors: { select: { accountId: true } },
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
          const hasOpenVersion = app.versions.some((v) => OPEN_ROUND_STATES.has(v.state));
          const canStartNewRound =
            canPrepare &&
            app.season.state === 'OPEN' &&
            !app.currentAcceptedVersionId &&
            !hasOpenVersion;

          return {
            id: app.id,
            seasonId: app.seasonId,
            season: app.season,
            club: {
              ...app.club,
              discontinuedAt: app.club.discontinuedAt?.toISOString() ?? null,
            },
            revision: app.revision.toString(),
            currentDraftVersionId: app.currentDraftVersionId,
            currentAcceptedVersionId: app.currentAcceptedVersionId,
            updatedAt: app.updatedAt.toISOString(),
            versions: app.versions.map((v) => ({
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
              receiptRegulationVersionId: v.receiptRegulationVersionId,
              receiptTimingStatus: v.receiptTimingStatus,
              receiptWindow: v.receiptWindow
                ? {
                    id: v.receiptWindow.id,
                    intakeKind: v.receiptWindow.intakeKind,
                    opensAt: v.receiptWindow.opensAt.toISOString(),
                    closesAt: v.receiptWindow.closesAt.toISOString(),
                  }
                : null,
              approvalRegulationVersionId: v.approvalRegulationVersionId,
              officialSnapshot: v.officialSnapshot,
              proposedPlayers: v.proposedPlayers.map((item) => ({
                id: item.id,
                playerId: item.playerId,
                positionOrder: item.positionOrder,
                shirtNumber: item.shirtNumber,
                notes: item.notes,
                player: {
                  ...item.player,
                  birthDate: formatDateOnly(item.player.birthDate),
                },
              })),
              receiptExceptions: v.receiptExceptions.map((ex) => ({
                caseId: ex.caseId,
                id: ex.id,
                versionNumber: ex.versionNumber,
                revision: ex.revision.toString(),
                state: ex.state,
                reason: ex.reason,
                basis: ex.basis,
                preparedBy: ex.preparedBy,
                preparer: ex.preparer,
                editorIds: ex.editors.map((e) => e.accountId),
                submittedAt: ex.submittedAt?.toISOString() ?? null,
                decidedAt: ex.decidedAt?.toISOString() ?? null,
                decidedBy: ex.decidedBy,
                decider: ex.decider,
                decisionReason: ex.decisionReason,
              })),
            })),
            capabilities: { canPrepare, canApprove, canStartNewRound },
          };
        },
      );
    } catch (error) {
      concealMissingApplication(error);
    }
  }

  async history(request: Request, caseId: string, query: Record<string, unknown>) {
    const { values, page, pageSize } = listQuery(
      query,
      ['actionCode', 'occurredFrom', 'occurredBefore'],
      ['occurredAt:desc'],
    );
    const scope = {
      kind: 'ClubApplication' as const,
      id: caseId,
      locks: [{ kind: 'clubApplication' as const, key: caseId, mode: 'shared' as const }],
      discover: async (db: Prisma.TransactionClient): Promise<LockResource[]> => {
        const app = await db.clubApplication.findUnique({
          where: { id: caseId },
          select: { seasonId: true },
        });
        return app ? [{ kind: 'season', key: app.seasonId, mode: 'shared' }] : [];
      },
      authorize: async (context: TransactionContext, accountId: string) => {
        const app = await context.db.clubApplication.findUnique({
          where: { id: caseId },
          select: { seasonId: true },
        });
        if (!app) throw missing();
        await requireSeasonRegistrationReader(context, accountId, app.seasonId);
      },
    };
    try {
      return await this.execution.read(request, scope, async (context, accountId) => {
        const app = await context.db.clubApplication.findUniqueOrThrow({
          where: { id: caseId },
          select: { seasonId: true },
        });
        const historyScope = {
          ...scope,
          seasonId: app.seasonId,
          locks: [
            ...scope.locks,
            { kind: 'season' as const, key: app.seasonId, mode: 'shared' as const },
          ],
        };
        const result = await this.businessHistory.listWithin(context, accountId, historyScope, {
          page,
          pageSize,
          ...(values.actionCode !== undefined ? { actionCode: values.actionCode } : {}),
          ...(values.occurredFrom !== undefined ? { occurredFrom: values.occurredFrom } : {}),
          ...(values.occurredBefore !== undefined ? { occurredBefore: values.occurredBefore } : {}),
        });
        return withPaginationMeta({ items: result.items }, { page, pageSize, total: result.total });
      });
    } catch (error) {
      concealMissingApplication(error);
    }
  }

  async createDraft(request: Request, seasonId: string, input: CreateClubApplicationDto) {
    const clubId = input.clubId.toLowerCase();
    const fields = normalizeDraftFields(input);

    try {
      return await this.execution.execute(
        request,
        {
          locks: [
            { kind: 'masterIdentity', key: `club-app:${seasonId}:${clubId}`, mode: 'exclusive' },
            { kind: 'season', key: seasonId, mode: 'shared' },
            { kind: 'club', key: clubId, mode: 'exclusive' },
            ...(fields.homeStadiumId
              ? [
                  {
                    kind: 'stadium' as const,
                    key: fields.homeStadiumId,
                    mode: 'exclusive' as const,
                  },
                ]
              : []),
          ],
          discover: async (db) => {
            const existing = await db.clubApplication.findUnique({
              where: { seasonId_clubId: { seasonId, clubId } },
              select: { id: true },
            });
            return existing
              ? [{ kind: 'clubApplication', key: existing.id, mode: 'exclusive' }]
              : [];
          },
          authorize: (context, accountId) =>
            requireSeasonRegistrationOfficer(context, accountId, seasonId),
        },
        async (context, accountId) => {
          await requireOpenSeason(context, seasonId);
          await assertMastersAvailableForNewUse(context, {
            clubId,
            ...(fields.homeStadiumId ? { stadiumId: fields.homeStadiumId } : {}),
          });
          if (fields.proposedPlayers?.length) {
            await this.assertPlayersExist(
              context,
              fields.proposedPlayers.map((p) => p.playerId),
            );
          }

          const existing = await context.db.clubApplication.findUnique({
            where: { seasonId_clubId: { seasonId, clubId } },
            include: {
              versions: {
                orderBy: { versionNumber: 'desc' },
                select: { id: true, versionNumber: true, state: true },
              },
            },
          });

          const now = await context.now();
          let caseId: string;
          let versionNumber = 1;
          let predecessorVersionId: string | null = null;

          if (existing) {
            if (existing.currentAcceptedVersionId) {
              throw conflict(
                'STATE_CONFLICT',
                'Câu lạc bộ đã có hồ sơ đăng ký tham dự được phê duyệt cho mùa giải này.',
              );
            }
            if (existing.versions.some((v) => OPEN_ROUND_STATES.has(v.state))) {
              throw conflict(
                'STATE_CONFLICT',
                'Câu lạc bộ đã có một vòng xử lý hồ sơ đang mở cho mùa giải này.',
              );
            }
            caseId = existing.id;
            const latest = existing.versions[0];
            if (latest) {
              versionNumber = latest.versionNumber + 1;
              predecessorVersionId = latest.id;
            }
          } else {
            caseId = randomUUID();
            await context.db.clubApplication.create({
              data: { id: caseId, seasonId, clubId, createdAt: now, updatedAt: now },
            });
          }

          const versionId = randomUUID();
          await context.db.clubApplicationVersion.create({
            data: {
              id: versionId,
              seasonId,
              caseId,
              versionNumber,
              versionKind: 'INITIAL',
              preparedBy: accountId,
              predecessorVersionId,
              state: 'DRAFT',
              coachName: fields.coachName ?? null,
              homeStadiumId: fields.homeStadiumId ?? null,
              representativeName: fields.representativeName ?? null,
              representativePhone: fields.representativePhone ?? null,
              contactAddress: fields.contactAddress ?? null,
              notes: fields.notes ?? null,
              createdAt: now,
              ...(fields.proposedPlayers?.length
                ? {
                    proposedPlayers: {
                      create: fields.proposedPlayers.map((item) => ({
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
            action: 'CLUB_APPLICATION_DRAFT_CREATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ClubApplication',
            objectId: caseId,
            seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              clubId,
              versionId,
              versionNumber,
              state: 'DRAFT',
            },
          });

          return {
            id: caseId,
            caseId,
            versionId,
            versionNumber,
            revision: '1',
            caseRevision: savedCase.revision.toString(),
            state: 'DRAFT',
          };
        },
      );
    } catch (error) {
      concealMissingApplication(error);
    }
  }

  async updateDraft(request: Request, caseId: string, input: UpdateClubApplicationDraftDto) {
    const versionId = input.versionId.toLowerCase();
    const fields = normalizeDraftFields(input);

    try {
      return await this.execution.execute(
        request,
        {
          locks: [
            { kind: 'clubApplication', key: caseId, mode: 'exclusive' },
            { kind: 'clubApplicationVersion', key: versionId, mode: 'exclusive' },
            ...(fields.homeStadiumId
              ? [
                  {
                    kind: 'stadium' as const,
                    key: fields.homeStadiumId,
                    mode: 'exclusive' as const,
                  },
                ]
              : []),
          ],
          discover: async (db) => {
            const app = await db.clubApplication.findUnique({
              where: { id: caseId },
              select: { seasonId: true, clubId: true },
            });
            return app
              ? [
                  { kind: 'season', key: app.seasonId, mode: 'shared' },
                  { kind: 'club', key: app.clubId, mode: 'exclusive' },
                ]
              : [];
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
            select: { id: true, seasonId: true, clubId: true, currentDraftVersionId: true },
          });
          await requireOpenSeason(context, app.seasonId);

          const version = await context.db.clubApplicationVersion.findFirst({
            where: { id: versionId, caseId },
            select: { id: true, versionNumber: true, revision: true, state: true },
          });
          if (!version) throw missing();
          if (version.state !== 'DRAFT' || app.currentDraftVersionId !== version.id) {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể chỉnh sửa phiên bản hồ sơ đang ở trạng thái Nháp.',
            );
          }
          assertRevision(version.revision, input.expectedRevision);

          await assertMastersAvailableForNewUse(context, {
            clubId: app.clubId,
            ...(fields.homeStadiumId ? { stadiumId: fields.homeStadiumId } : {}),
          });
          if (fields.proposedPlayers?.length) {
            await this.assertPlayersExist(
              context,
              fields.proposedPlayers.map((p) => p.playerId),
            );
          }

          const now = await context.now();
          const { proposedPlayers, ...scalarUpdates } = fields;

          if (proposedPlayers !== undefined) {
            await context.db.proposedPlayerItem.deleteMany({
              where: { applicationVersionId: version.id },
            });
            if (proposedPlayers.length > 0) {
              await context.db.proposedPlayerItem.createMany({
                data: proposedPlayers.map((item) => ({
                  id: randomUUID(),
                  applicationVersionId: version.id,
                  playerId: item.playerId,
                  positionOrder: item.positionOrder,
                  shirtNumber: item.shirtNumber,
                  notes: item.notes,
                })),
              });
            }
          }

          const updatedVersion = await context.db.clubApplicationVersion.update({
            where: { id: version.id },
            data: { ...scalarUpdates, revision: { increment: 1 } },
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
            action: 'CLUB_APPLICATION_DRAFT_UPDATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ClubApplication',
            objectId: caseId,
            seasonId: app.seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              state: 'DRAFT',
              revision: updatedVersion.revision.toString(),
            },
          });

          return {
            caseId,
            versionId: version.id,
            revision: updatedVersion.revision.toString(),
            state: 'DRAFT',
          };
        },
      );
    } catch (error) {
      concealMissingApplication(error);
    }
  }

  async act(request: Request, caseId: string, action: string, input: ClubApplicationActionDto) {
    if (
      !['receive', 'submit', 'approve', 'return', 'reject', 'withdraw', 'cancel'].includes(action)
    ) {
      throw invalid('Thao tác hồ sơ đăng ký tham dự không hợp lệ.');
    }
    const normalizedAction = action as
      'receive' | 'submit' | 'approve' | 'return' | 'reject' | 'withdraw' | 'cancel';
    const versionId = input.versionId.toLowerCase();
    const reason =
      input.reason === undefined
        ? undefined
        : requiredBoundedText(input.reason, 2000, 'Lý do không hợp lệ.');

    if (['approve', 'return', 'reject', 'cancel'].includes(normalizedAction) && !reason) {
      throw invalid('Vui lòng nhập lý do thực hiện thao tác này.');
    }

    const needsRuleResolution = ['receive', 'submit', 'approve'].includes(normalizedAction);

    const operation = {
      locks: [
        { kind: 'clubApplication' as const, key: caseId, mode: 'exclusive' as const },
        { kind: 'clubApplicationVersion' as const, key: versionId, mode: 'exclusive' as const },
      ],
      discover: async (db: Prisma.TransactionClient) => {
        const app = await db.clubApplication.findUnique({
          where: { id: caseId },
          select: { seasonId: true, clubId: true },
        });
        if (!app) return [];
        const locks: LockResource[] = needsRuleResolution
          ? await discoverSeasonWithDueRules(db, app.seasonId, this.activation)
          : [{ kind: 'season', key: app.seasonId, mode: 'shared' }];
        if (normalizedAction === 'approve') {
          locks.push({ kind: 'club', key: app.clubId, mode: 'exclusive' });
          const ver = await db.clubApplicationVersion.findFirst({
            where: { id: versionId, caseId },
            select: { homeStadiumId: true },
          });
          if (ver?.homeStadiumId) {
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
        if (normalizedAction === 'approve' || normalizedAction === 'reject') {
          await requireSeasonManager(context, accountId, app.seasonId);
          return;
        }
        if (normalizedAction === 'return') {
          const ver = await context.db.clubApplicationVersion.findFirst({
            where: { id: versionId, caseId },
            select: { state: true },
          });
          if (!ver) throw missing();
          if (ver.state === 'PENDING_APPROVAL') {
            await requireSeasonManager(context, accountId, app.seasonId);
          } else {
            await requireSeasonRegistrationOfficer(context, accountId, app.seasonId);
          }
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
          async (context) => {
            const app = await context.db.clubApplication.findUnique({
              where: { id: caseId },
              select: { seasonId: true },
            });
            if (!app) throw missing();
            const approvedEx = await this.intake.findApprovedException(
              context,
              'CLUB_APPLICATION',
              app.seasonId,
              versionId,
            );
            return {
              action: 'CLUB_APPLICATION_APPROVED',
              targetId: caseId,
              payload: {
                expectedRevision: input.expectedRevision,
                submittedVersionId: versionId,
                reason: reason!,
                ...(approvedEx ? { receiptExceptionVersionId: approvedEx.id } : {}),
              },
            };
          },
          async (context, command) => {
            const app = await context.db.clubApplication.findUniqueOrThrow({
              where: { id: caseId },
              include: {
                club: { select: { id: true, code: true, name: true, abbreviation: true } },
              },
            });
            const effectiveRegulation = await resolveEffectiveRegulationForWrite(
              context,
              app.seasonId,
              this.activation,
            );
            const version = await context.db.clubApplicationVersion.findFirst({
              where: { id: versionId, caseId },
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
                'Chỉ có thể phê duyệt phiên bản đang Chờ phê duyệt.',
              );
            }
            if (app.currentAcceptedVersionId) {
              throw conflict(
                'STATE_CONFLICT',
                'Câu lạc bộ đã có hồ sơ được phê duyệt trong mùa giải này.',
              );
            }
            assertIndependentApprover(
              version.preparedBy,
              version.editors.map((e) => e.accountId),
              command.accountId,
            );
            assertD059Completeness(version);
            await assertMastersAvailableForNewUse(context, {
              clubId: app.clubId,
              stadiumId: version.homeStadiumId!,
            });
            const { receiptExceptionVersionId } =
              await this.intake.requireTimelyOrApprovedException(
                context,
                'CLUB_APPLICATION',
                app.seasonId,
                version,
              );

            const now = await context.now();
            const officialSnapshot = {
              club: {
                id: app.club.id,
                code: app.club.code,
                name: app.club.name,
                abbreviation: app.club.abbreviation,
              },
              homeStadium: version.homeStadium
                ? {
                    id: version.homeStadium.id,
                    code: version.homeStadium.code,
                    name: version.homeStadium.name,
                    location: version.homeStadium.location,
                  }
                : null,
              coachName: version.coachName,
              representativeName: version.representativeName,
              representativePhone: version.representativePhone,
              contactAddress: version.contactAddress,
              notes: version.notes,
              receivedAt: version.receivedAt?.toISOString() ?? null,
              receiptTimingStatus: version.receiptTimingStatus,
              receiptRegulationVersionId: version.receiptRegulationVersionId,
              receiptExceptionVersionId,
              approvalRegulationVersionId: effectiveRegulation.id,
              approvedAt: now.toISOString(),
              proposedPlayers: version.proposedPlayers.map((item) => ({
                playerId: item.playerId,
                code: item.player.code,
                fullName: item.player.fullName,
                birthDate: formatDateOnly(item.player.birthDate),
                nationalityCode: item.player.nationalityCode,
                positionCode: item.player.positionCode,
                positionOrder: item.positionOrder,
                shirtNumber: item.shirtNumber,
                notes: item.notes,
              })),
            };

            const updated = await context.db.clubApplicationVersion.update({
              where: { id: version.id },
              data: {
                state: 'APPROVED',
                decidedAt: now,
                decidedBy: command.accountId,
                decisionReason: reason,
                approvalRegulationVersionId: effectiveRegulation.id,
                officialSnapshot,
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
              action: 'CLUB_APPLICATION_APPROVED',
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
                state: version.state,
              },
              after: {
                caseId,
                versionId: version.id,
                versionNumber: version.versionNumber,
                state: 'APPROVED',
                approvedAt: now.toISOString(),
                approvalRegulationVersionId: effectiveRegulation.id,
                receiptExceptionVersionId,
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
          state: 'APPROVED',
        };
      }

      return await this.execution.execute(request, operation, async (context, accountId) => {
        const app = await context.db.clubApplication.findUniqueOrThrow({
          where: { id: caseId },
          include: {
            club: { select: { id: true, code: true, name: true, abbreviation: true } },
          },
        });

        const effectiveRegulation = needsRuleResolution
          ? await resolveEffectiveRegulationForWrite(context, app.seasonId, this.activation)
          : null;
        if (!needsRuleResolution) {
          await requireOpenSeason(context, app.seasonId);
        }

        const version = await context.db.clubApplicationVersion.findFirst({
          where: { id: versionId, caseId },
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

        const now = await context.now();
        const editorIds = version.editors.map((e) => e.accountId);

        if (normalizedAction === 'receive') {
          if (version.state !== 'DRAFT') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể tiếp nhận phiên bản hồ sơ ở trạng thái Nháp.',
            );
          }
          const timing = this.intake.assessReceiptTiming(
            effectiveRegulation!.registrationWindows,
            'CLUB_APPLICATION',
            now,
          );
          const updated = await context.db.clubApplicationVersion.update({
            where: { id: version.id },
            data: {
              state: 'RECEIVED',
              receivedAt: now,
              receiptRegulationVersionId: effectiveRegulation!.id,
              receiptTimingStatus: timing.receiptTimingStatus,
              receiptWindowId: timing.receiptWindowId,
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
            action: 'CLUB_APPLICATION_RECEIVED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ClubApplication',
            objectId: caseId,
            seasonId: app.seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              state: 'RECEIVED',
              receivedAt: now.toISOString(),
              receiptTimingStatus: timing.receiptTimingStatus,
              receiptRegulationVersionId: effectiveRegulation!.id,
            },
          });
          return {
            caseId,
            versionId: version.id,
            revision: updated.revision.toString(),
            state: 'RECEIVED',
            receivedAt: now.toISOString(),
            receiptTimingStatus: timing.receiptTimingStatus,
            receiptRegulationVersionId: effectiveRegulation!.id,
            receiptWindowId: timing.receiptWindowId,
          };
        }

        if (normalizedAction === 'submit') {
          if (version.state !== 'RECEIVED') {
            throw conflict('STATE_CONFLICT', 'Chỉ có thể trình duyệt hồ sơ đã được tiếp nhận.');
          }
          assertD059Completeness(version);
          await this.intake.requireTimelyOrApprovedException(
            context,
            'CLUB_APPLICATION',
            app.seasonId,
            version,
          );
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
            data: { revision: { increment: 1 }, updatedAt: now },
          });
          await this.audit.append(context, {
            action: 'CLUB_APPLICATION_SUBMITTED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ClubApplication',
            objectId: caseId,
            seasonId: app.seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              state: 'PENDING_APPROVAL',
              submittedAt: now.toISOString(),
            },
          });
          return {
            caseId,
            versionId: version.id,
            revision: updated.revision.toString(),
            state: 'PENDING_APPROVAL',
            submittedAt: now.toISOString(),
          };
        }

        if (normalizedAction === 'return') {
          if (version.state !== 'RECEIVED' && version.state !== 'PENDING_APPROVAL') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể yêu cầu bổ sung đối với hồ sơ đã tiếp nhận hoặc đang chờ phê duyệt.',
            );
          }
          if (version.state === 'PENDING_APPROVAL') {
            assertIndependentApprover(version.preparedBy, editorIds, accountId);
          }
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
            action: 'CLUB_APPLICATION_RETURNED',
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
              'Chỉ có thể từ chối hồ sơ đang ở trạng thái Chờ phê duyệt.',
            );
          }
          assertIndependentApprover(version.preparedBy, editorIds, accountId);
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
            action: 'CLUB_APPLICATION_REJECTED',
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
              'Chỉ có thể rút hồ sơ đang ở trạng thái Chờ phê duyệt.',
            );
          }
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
            action: 'CLUB_APPLICATION_WITHDRAWN',
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

        // cancel (before approval)
        if (app.currentAcceptedVersionId || !CANCELLABLE_STATES.has(version.state)) {
          throw conflict('STATE_CONFLICT', 'Chỉ có thể hủy vòng hồ sơ chưa được phê duyệt.');
        }
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
          action: 'CLUB_APPLICATION_CANCELLED',
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
      concealMissingApplication(error);
    }
  }

  private async assertPlayersExist(
    context: TransactionContext,
    playerIds: string[],
  ): Promise<void> {
    const unique = [...new Set(playerIds)];
    const found = await context.db.player.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    if (found.length !== unique.length) {
      throw invalid('Danh sách cầu thủ dự kiến chứa hồ sơ cầu thủ không tồn tại.');
    }
  }
}
