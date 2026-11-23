import { createHash, randomUUID } from 'node:crypto';
import { isISO8601 } from 'class-validator';
import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import type { Prisma } from '../generated/prisma/client';
import { assertRevision, conflict, invalid, missing } from '../identity-access/accounts.dto';
import { hasSeasonRole } from '../identity-access/authority.policy';
import { ApplicationError, type ApplicationErrorDetail } from '../platform/application-error';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import {
  MissingLockResource,
  type LockResource,
  type TransactionContext,
} from '../platform/transaction-context';
import type { RegulationActivationService } from '../season-regulations/regulation-activation.service';
import { computePlayingEffectivityStatus } from './player-registrations.service';
import {
  assessRegistrationEligibility,
  type EligibilityRegulationBasis,
  type HomegrownEvidenceBranch,
  type HomegrownEvidenceInput,
  type RegistrationEligibilityAssessment,
} from './registration-eligibility';
import {
  assertMastersAvailableForNewUse,
  discoverSeasonWithDueRules,
  requireOpenSeason,
  requireSeasonRegistrationOfficer,
  requireSeasonRegistrationReader,
  resolveEffectiveRegulationWithInstant,
} from './registration-execution';
import type { RegistrationIntakeService } from './registration-intake.service';
import {
  evaluateQuotaAcrossIntervals,
  findPlayerOverlapConflicts,
  findShirtNumberConflicts,
  isActivePlayingDisposition,
  isValidPlayingInterval,
  isValidShirtNumber,
  loadCompetitionAndClubIntervals,
  type ExistingRegistrationInterval,
} from './registration-intervals';
import type {
  CancelRegistrationPlanDto,
  ChangeRegistrationPlanDto,
  TerminateRegistrationDto,
  TransferRegistrationDto,
} from './registration-plans.dto';
import {
  formatDateOnly,
  optionalBoundedText,
  requiredBoundedText,
} from './registration-validation';

type EffectiveMode = 'IMMEDIATE' | 'SCHEDULED';
type TransferOperationKind = 'TRANSFER' | 'PLAN_CHANGE' | 'PLAN_CANCEL';
type PlayingDisposition = 'ACTIVE' | 'CANCELLED_BEFORE_EFFECTIVITY';

type DbRegulationRow = {
  id: string;
  seasonId: string;
  squadLimit: number | null;
  nonHomegrownLimit: number | null;
  homegrownSeasons: number | null;
  homegrownMonths: number | null;
  homegrownAgeStart: number | null;
  homegrownAgeEnd: number | null;
  u21Cutoff: Date | null;
};

type TransferChainResolution = {
  latest: {
    id: string;
    playerId: string;
    oldCaseId: string;
    newCaseId: string;
    oldBeforeVersionId: string;
    oldAfterVersionId: string;
    newVersionId: string;
    effectiveAt: Date;
    operationKind: TransferOperationKind;
    reason: string;
    supersedesOperationId: string | null;
  };
  root: {
    id: string;
    oldCaseId: string;
    newCaseId: string;
    oldBeforeVersionId: string;
    effectiveAt: Date;
  };
};

type PlanChangeSummary =
  | {
      paired: true;
      transferOperationId: string;
      oldCaseId: string;
      oldAfterVersionId: string;
      newCaseId: string;
      newVersionId: string;
      effectiveAt: string;
      operationKind: string;
    }
  | {
      paired: false;
      caseId: string;
      versionId: string;
      versionNumber: number;
      revision: string;
      shirtNumber: number | null;
      playingStart: string | null;
      playingEnd: string | null;
      playingDisposition: string | null;
    };

type PlanCancelSummary =
  | {
      paired: true;
      transferOperationId: string;
      oldCaseId: string;
      restoredOldVersionId: string;
      newCaseId: string;
      cancelledNewVersionId: string;
      effectiveAt: string;
      operationKind: string;
      playingDisposition: PlayingDisposition;
    }
  | {
      paired: false;
      caseId: string;
      versionId: string;
      versionNumber: number;
      revision: string;
      playingStart: string | null;
      playingEnd: string | null;
      playingDisposition: string | null;
    };

function concealMissingPlanResource(error: unknown): never {
  if (
    error instanceof MissingLockResource &&
    [
      'season',
      'player',
      'club',
      'playerRegistration',
      'registrationVersion',
      'transferOperation',
    ].includes(error.kind)
  ) {
    throw missing();
  }
  throw error;
}

/** Strips characters disallowed by SafeErrorFilter so interpolated names never drop details. */
function toSafeErrorText(value: string): string {
  const cleaned = value
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N} .,;:!?()%-]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
  return [...cleaned].slice(0, 80).join('') || 'không xác định';
}

const STRICT_ISO_INSTANT =
  /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)$/i;

function parseOptionalInstant(
  value: string | null | undefined,
  label: string,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || !value.trim()) return null;
  const trimmed = value.trim();
  if (
    !STRICT_ISO_INSTANT.test(trimmed) ||
    !isISO8601(trimmed, { strict: true, strictSeparator: true })
  ) {
    throw invalid(
      `${label} phải là mốc thời gian ISO-8601 hợp lệ kèm múi giờ (Z hoặc độ lệch múi giờ).`,
    );
  }
  const parsed = new Date(trimmed);
  if (!Number.isFinite(parsed.getTime())) {
    throw invalid(`${label} không đúng định dạng thời gian hợp lệ.`);
  }
  return parsed;
}

function parseEffectiveModeAndInstant(
  modeInput: EffectiveMode | undefined,
  instantInput: string | null | undefined,
): { effectiveMode: EffectiveMode; requestedInstant: Date | null } {
  const parsed = parseOptionalInstant(instantInput, 'Thời điểm hiệu lực');
  const effectiveMode: EffectiveMode = modeInput ?? (parsed ? 'SCHEDULED' : 'IMMEDIATE');
  if (effectiveMode === 'SCHEDULED') {
    if (!parsed) {
      throw invalid('Thao tác hẹn thời điểm hiệu lực bắt buộc phải có mốc thời gian cụ thể.');
    }
    return { effectiveMode, requestedInstant: parsed };
  }
  if (parsed) {
    throw invalid('Thao tác hiệu lực ngay không nhận thêm mốc thời gian hiệu lực tự chọn.');
  }
  return { effectiveMode: 'IMMEDIATE', requestedInstant: null };
}

function toRegulationBasis(row: DbRegulationRow | null): EligibilityRegulationBasis | null {
  if (!row) return null;
  return {
    id: row.id,
    seasonId: row.seasonId,
    squadLimit: row.squadLimit,
    nonHomegrownLimit: row.nonHomegrownLimit,
    homegrownSeasons: row.homegrownSeasons,
    homegrownMonths: row.homegrownMonths,
    homegrownAgeStart: row.homegrownAgeStart,
    homegrownAgeEnd: row.homegrownAgeEnd,
    u21CutoffIso: row.u21Cutoff ? formatDateOnly(row.u21Cutoff) : null,
  };
}

function sanitizeDetailMessage(text: string): string {
  return text
    .replace(/\[bắt đầu, kết thúc\)/g, 'bắt đầu đến kết thúc')
    .replace(/\//g, ' hoặc ')
    .replace(/[–—]/g, '-')
    .replace(/[^\p{L}\p{M}\p{N} .,;:!?()%-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

function planConflict(field: string, code: string, message: string): ApplicationError {
  return new ApplicationError(409, 'STATE_CONFLICT', message, [
    { field, code, message: sanitizeDetailMessage(message) },
  ]);
}

function buildEligibilityRejectionError(
  assessment: RegistrationEligibilityAssessment,
): ApplicationError {
  const summary = assessment.blockingCriteria.map((c) => c.reason).join(' ');
  return new ApplicationError(
    409,
    'STATE_CONFLICT',
    summary || 'Hồ sơ đăng ký đích chưa đáp ứng đầy đủ điều kiện xác nhận hợp lệ.',
    assessment.blockingCriteria.map((c) => ({
      field: c.criterion,
      code: c.status,
      message: sanitizeDetailMessage(c.reason),
    })),
  );
}

function resolveInlineHomegrownEvidence(
  input: {
    evidenceBranch?: HomegrownEvidenceBranch | null;
    qualifyingValue?: number | null;
    evidenceSummary?: string | null;
    evidenceReference?: string | null;
    affiliatedAssociationBasis?: boolean | null;
    verifiedRegulationVersionId?: string | null;
  },
  actorId: string,
  now: Date,
  defaultRegulationVersionId: string,
): HomegrownEvidenceInput | null {
  const evidenceSummary = optionalBoundedText(input.evidenceSummary, 1000) ?? null;
  const evidenceReference = optionalBoundedText(input.evidenceReference, 300) ?? null;
  const evidenceBranch = input.evidenceBranch ?? null;
  const qualifyingValue = input.qualifyingValue ?? null;
  const affiliatedAssociationBasis = input.affiliatedAssociationBasis ?? null;

  const hasAny =
    evidenceBranch !== null ||
    qualifyingValue !== null ||
    !!evidenceSummary ||
    !!evidenceReference ||
    affiliatedAssociationBasis !== null;

  if (!hasAny) return null;

  return {
    evidenceBranch,
    qualifyingValue,
    evidenceSummary,
    evidenceReference,
    affiliatedAssociationBasis,
    verifiedBy: actorId,
    verifiedAt: now,
    verifiedRegulationVersionId:
      input.verifiedRegulationVersionId?.toLowerCase() ?? defaultRegulationVersionId,
  };
}

/** Hashes inline destination eligibility/evidence inputs so idempotency checks bind them without leaking private evidence. */
function hashInlineTransferBasis(
  input: TransferRegistrationDto,
  notes: string | null | undefined,
): string {
  const canonical = JSON.stringify({
    nonHomegrownOptIn: input.nonHomegrownOptIn ?? false,
    evidenceBranch: input.evidenceBranch ?? null,
    qualifyingValue: input.qualifyingValue ?? null,
    evidenceSummary: optionalBoundedText(input.evidenceSummary, 1000) ?? null,
    evidenceReference: optionalBoundedText(input.evidenceReference, 300) ?? null,
    affiliatedAssociationBasis: input.affiliatedAssociationBasis ?? null,
    verifiedRegulationVersionId: input.verifiedRegulationVersionId?.toLowerCase() ?? null,
    notes: notes ?? null,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

function asSnapshotRecord(snapshot: Prisma.JsonValue | null): Record<string, unknown> {
  if (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)) {
    return { ...(snapshot as Record<string, unknown>) };
  }
  return {};
}

type RevalidatedSnapshotBasis = {
  receiptRegulationVersionId: string | null;
  receiptTimingStatus: 'ON_TIME' | 'LATE';
  receiptWindowId: string | null;
  receiptExceptionVersionId: string | null;
  decisionRegulationVersionId: string;
  assessment: RegistrationEligibilityAssessment;
};

function buildUpdatedOfficialSnapshot(
  previous: Prisma.JsonValue | null,
  update: {
    capturedAt: Date;
    caseId: string;
    versionId: string;
    versionNumber: number;
    shirtNumber: number | null;
    playingStart: Date;
    playingEnd: Date | null;
    u21Finding: boolean | null;
    homegrownFinding: boolean | null;
    nonHomegrownOptIn: boolean;
    playingDisposition: PlayingDisposition;
    planEvent: Record<string, string | null>;
    revalidatedBasis?: RevalidatedSnapshotBasis;
  },
): Prisma.InputJsonObject {
  const base = asSnapshotRecord(previous);
  return {
    ...base,
    capturedAt: update.capturedAt.toISOString(),
    registration: {
      caseId: update.caseId,
      versionId: update.versionId,
      versionNumber: update.versionNumber,
      shirtNumber: update.shirtNumber,
      playingStart: update.playingStart.toISOString(),
      playingEnd: update.playingEnd?.toISOString() ?? null,
      u21Finding: update.u21Finding,
      homegrownFinding: update.homegrownFinding,
      nonHomegrownOptIn: update.nonHomegrownOptIn,
      playingDisposition: update.playingDisposition,
    },
    ...(update.revalidatedBasis
      ? {
          basis: {
            receiptRegulationVersionId: update.revalidatedBasis.receiptRegulationVersionId,
            receiptTimingStatus: update.revalidatedBasis.receiptTimingStatus,
            receiptWindowId: update.revalidatedBasis.receiptWindowId,
            receiptExceptionVersionId: update.revalidatedBasis.receiptExceptionVersionId,
            decisionRegulationVersionId: update.revalidatedBasis.decisionRegulationVersionId,
            squadLimit: update.revalidatedBasis.assessment.squadLimit,
            nonHomegrownLimit: update.revalidatedBasis.assessment.nonHomegrownLimit,
          },
          criteria: update.revalidatedBasis.assessment.criteria.map((c) => ({
            criterion: c.criterion,
            status: c.status,
            reason: c.reason,
            regulationVersionId: c.regulationVersionId,
          })),
        }
      : {}),
    planEvent: update.planEvent,
  } as Prisma.InputJsonObject;
}

/** Creates an immutable VALID successor version cloning unchanged baseline facts from baseVersion. */
async function createSuccessorRegistrationVersion(
  context: TransactionContext,
  baseVersion: Prisma.RegistrationVersionGetPayload<object>,
  params: {
    id: string;
    versionNumber: number;
    actorId: string;
    now: Date;
    reason: string;
    playingStart: Date;
    playingEnd: Date | null;
    shirtNumber?: number | null;
    u21Finding?: boolean | null;
    homegrownFinding?: boolean | null;
    receivedAt?: Date | null;
    receiptRegulationVersionId?: string | null;
    receiptTimingStatus?: string | null;
    receiptWindowId?: string | null;
    decisionRegulationVersionId?: string | null;
    playingDisposition: PlayingDisposition;
    planEvent: Record<string, string | null>;
    revalidatedBasis?: RevalidatedSnapshotBasis;
  },
): Promise<{ revision: bigint }> {
  const shirtNumber =
    params.shirtNumber !== undefined ? params.shirtNumber : baseVersion.shirtNumber;
  const u21Finding = params.u21Finding !== undefined ? params.u21Finding : baseVersion.u21Finding;
  const homegrownFinding =
    params.homegrownFinding !== undefined ? params.homegrownFinding : baseVersion.homegrownFinding;
  const snapshot = buildUpdatedOfficialSnapshot(baseVersion.officialSnapshot, {
    capturedAt: params.now,
    caseId: baseVersion.caseId,
    versionId: params.id,
    versionNumber: params.versionNumber,
    shirtNumber,
    playingStart: params.playingStart,
    playingEnd: params.playingEnd,
    u21Finding,
    homegrownFinding,
    nonHomegrownOptIn: baseVersion.nonHomegrownOptIn,
    playingDisposition: params.playingDisposition,
    planEvent: params.planEvent,
    revalidatedBasis: params.revalidatedBasis,
  });

  return context.db.registrationVersion.create({
    data: {
      id: params.id,
      seasonId: baseVersion.seasonId,
      caseId: baseVersion.caseId,
      versionNumber: params.versionNumber,
      predecessorVersionId: baseVersion.id,
      preparedBy: params.actorId,
      state: 'VALID',
      receivedAt: params.receivedAt !== undefined ? params.receivedAt : baseVersion.receivedAt,
      submittedAt: baseVersion.submittedAt,
      decidedAt: params.now,
      decidedBy: params.actorId,
      decisionReason: params.reason,
      shirtNumber,
      playingStart: params.playingStart,
      playingEnd: params.playingEnd,
      u21Finding,
      homegrownFinding,
      nonHomegrownOptIn: baseVersion.nonHomegrownOptIn,
      evidenceBranch: baseVersion.evidenceBranch,
      qualifyingValue: baseVersion.qualifyingValue,
      evidenceSummary: baseVersion.evidenceSummary,
      evidenceReference: baseVersion.evidenceReference,
      affiliatedAssociationBasis: baseVersion.affiliatedAssociationBasis,
      verifiedBy: baseVersion.verifiedBy,
      verifiedAt: baseVersion.verifiedAt,
      receiptRegulationVersionId:
        params.receiptRegulationVersionId !== undefined
          ? params.receiptRegulationVersionId
          : baseVersion.receiptRegulationVersionId,
      receiptTimingStatus:
        params.receiptTimingStatus !== undefined
          ? params.receiptTimingStatus
          : baseVersion.receiptTimingStatus,
      receiptWindowId:
        params.receiptWindowId !== undefined ? params.receiptWindowId : baseVersion.receiptWindowId,
      decisionRegulationVersionId:
        params.decisionRegulationVersionId !== undefined
          ? params.decisionRegulationVersionId
          : baseVersion.decisionRegulationVersionId,
      officialSnapshot: snapshot,
      playingDisposition: params.playingDisposition,
      notes: baseVersion.notes,
      createdAt: params.now,
    },
    select: { revision: true },
  });
}

async function walkTransferRoot(
  db: Prisma.TransactionClient,
  start: {
    id: string;
    oldCaseId: string;
    newCaseId: string;
    oldBeforeVersionId: string;
    effectiveAt: Date;
    operationKind: string;
    supersedesOperationId: string | null;
  },
): Promise<TransferChainResolution['root'] | null> {
  let cursor = start;
  const visited = new Set<string>([cursor.id]);
  while (cursor.supersedesOperationId) {
    if (visited.has(cursor.supersedesOperationId)) {
      return null;
    }
    const prev = await db.transferOperation.findUnique({
      where: { id: cursor.supersedesOperationId },
      select: {
        id: true,
        oldCaseId: true,
        newCaseId: true,
        oldBeforeVersionId: true,
        effectiveAt: true,
        operationKind: true,
        supersedesOperationId: true,
      },
    });
    if (!prev) {
      return null;
    }
    visited.add(prev.id);
    cursor = prev;
  }
  if (cursor.operationKind !== 'TRANSFER') {
    return null;
  }
  return {
    id: cursor.id,
    oldCaseId: cursor.oldCaseId,
    newCaseId: cursor.newCaseId,
    oldBeforeVersionId: cursor.oldBeforeVersionId,
    effectiveAt: cursor.effectiveAt,
  };
}

/**
 * Non-throwing transfer lookup for pre-auth lock discovery and authorization scoping.
 * Never throws business conflicts so guessed IDs cannot leak state before auth and
 * idempotent replays on superseded transferOperationIds reach CommandReceiptService cleanly.
 */
async function findTransferOperationForLocking(
  db: Prisma.TransactionClient,
  caseId: string,
  requestedOperationId?: string | null,
): Promise<TransferChainResolution | null> {
  const candidate = requestedOperationId
    ? await db.transferOperation.findUnique({
        where: { id: requestedOperationId },
      })
    : await db.transferOperation.findFirst({
        where: {
          OR: [{ oldCaseId: caseId }, { newCaseId: caseId }],
          operationKind: { in: ['TRANSFER', 'PLAN_CHANGE'] },
          supersededBy: { none: {} },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });

  if (!candidate) return null;
  if (candidate.oldCaseId !== caseId && candidate.newCaseId !== caseId) return null;

  const root = await walkTransferRoot(db, candidate);
  if (!root) return null;
  return {
    latest: {
      id: candidate.id,
      playerId: candidate.playerId,
      oldCaseId: candidate.oldCaseId,
      newCaseId: candidate.newCaseId,
      oldBeforeVersionId: candidate.oldBeforeVersionId,
      oldAfterVersionId: candidate.oldAfterVersionId,
      newVersionId: candidate.newVersionId,
      effectiveAt: candidate.effectiveAt,
      operationKind: candidate.operationKind as TransferOperationKind,
      reason: candidate.reason,
      supersedesOperationId: candidate.supersedesOperationId,
    },
    root,
  };
}

/** Strict post-auth/post-replay resolution of an active non-superseded TransferOperation. */
async function resolveActivePairedTransferStrict(
  db: Prisma.TransactionClient,
  caseId: string,
  expectedOperationId?: string | null,
): Promise<TransferChainResolution | null> {
  const latest = expectedOperationId
    ? await db.transferOperation.findUnique({
        where: { id: expectedOperationId },
        include: { supersededBy: { select: { id: true }, take: 1 } },
      })
    : await db.transferOperation.findFirst({
        where: {
          OR: [{ oldCaseId: caseId }, { newCaseId: caseId }],
          operationKind: { in: ['TRANSFER', 'PLAN_CHANGE'] },
          supersededBy: { none: {} },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: { supersededBy: { select: { id: true }, take: 1 } },
      });

  if (!latest) return null;
  if (latest.oldCaseId !== caseId && latest.newCaseId !== caseId) {
    throw conflict(
      'STATE_CONFLICT',
      'Thao tác chuyển nhượng được chọn không thuộc hồ sơ đăng ký này.',
    );
  }
  if (latest.supersededBy.length > 0 || latest.operationKind === 'PLAN_CANCEL') {
    if (expectedOperationId) {
      throw conflict(
        'STATE_CONFLICT',
        'Kế hoạch chuyển nhượng này đã được thay thế hoặc hủy trước đó; vui lòng tải lại dữ liệu mới nhất.',
      );
    }
    return null;
  }

  const root = await walkTransferRoot(db, latest);
  if (!root) {
    throw planConflict(
      'TRANSFER_LINEAGE',
      'UNRESOLVED_TRANSFER_ROOT',
      'Không thể xác định thao tác chuyển nhượng gốc để đối chiếu khoảng hiệu lực ban đầu trước khi xử lý kế hoạch.',
    );
  }
  return {
    latest: {
      id: latest.id,
      playerId: latest.playerId,
      oldCaseId: latest.oldCaseId,
      newCaseId: latest.newCaseId,
      oldBeforeVersionId: latest.oldBeforeVersionId,
      oldAfterVersionId: latest.oldAfterVersionId,
      newVersionId: latest.newVersionId,
      effectiveAt: latest.effectiveAt,
      operationKind: latest.operationKind as TransferOperationKind,
      reason: latest.reason,
      supersedesOperationId: latest.supersedesOperationId,
    },
    root,
  };
}

export class RegistrationPlansService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly activation: RegulationActivationService,
    private readonly intake: RegistrationIntakeService,
    private readonly audit: AuditWriterService,
  ) {}

  private async discoverPairedPlanLocks(
    db: Prisma.TransactionClient,
    caseId: string,
    requestedOpId: string | null,
  ): Promise<LockResource[]> {
    const reg = await db.playerRegistration.findUnique({
      where: { id: caseId },
      select: { seasonId: true, playerId: true, clubId: true },
    });
    if (!reg) return [];
    const chain = await findTransferOperationForLocking(db, caseId, requestedOpId);
    const locks: LockResource[] = [
      ...(await discoverSeasonWithDueRules(db, reg.seasonId, this.activation)),
      { kind: 'player', key: reg.playerId, mode: 'exclusive' },
      { kind: 'club', key: reg.clubId, mode: 'exclusive' },
    ];
    if (chain) {
      locks.push({ kind: 'transferOperation', key: chain.latest.id, mode: 'exclusive' });
      if (chain.root.id !== chain.latest.id) {
        locks.push({ kind: 'transferOperation', key: chain.root.id, mode: 'shared' });
      }
      locks.push({
        kind: 'registrationVersion',
        key: chain.root.oldBeforeVersionId,
        mode: 'shared',
      });
      const counterpartCaseId =
        chain.latest.oldCaseId === caseId ? chain.latest.newCaseId : chain.latest.oldCaseId;
      const counterpart = await db.playerRegistration.findUnique({
        where: { id: counterpartCaseId },
        select: { seasonId: true, clubId: true, currentValidatedVersionId: true },
      });
      if (counterpart) {
        locks.push(
          ...(await discoverSeasonWithDueRules(db, counterpart.seasonId, this.activation)),
        );
        locks.push({ kind: 'club', key: counterpart.clubId, mode: 'exclusive' });
        locks.push({ kind: 'playerRegistration', key: counterpartCaseId, mode: 'exclusive' });
        if (counterpart.currentValidatedVersionId) {
          locks.push({
            kind: 'registrationVersion',
            key: counterpart.currentValidatedVersionId,
            mode: 'exclusive',
          });
        }
      }
    }
    return locks;
  }

  private async authorizePairedPlanMutation(
    context: TransactionContext,
    accountId: string,
    caseId: string,
    requestedOpId: string | null,
    receiptLookup?: {
      actionCode: 'PLAYER_REGISTRATION_PLAN_CHANGED' | 'PLAYER_REGISTRATION_PLAN_CANCELLED';
      requestKey: string | null;
    },
  ): Promise<void> {
    const reg = await context.db.playerRegistration.findUnique({
      where: { id: caseId },
      select: { seasonId: true },
    });
    if (!reg) throw missing();
    await requireSeasonRegistrationOfficer(context, accountId, reg.seasonId);

    const pairedCaseIds = new Set<string>();
    const recordOpCases = (op: { oldCaseId: string; newCaseId: string } | null) => {
      if (!op) return;
      if (op.oldCaseId !== caseId && op.newCaseId !== caseId) return;
      pairedCaseIds.add(op.oldCaseId);
      pairedCaseIds.add(op.newCaseId);
    };

    // 1. Resolve any unexpired stored replay receipt so replaying an implicit or superseded
    //    paired plan-change/plan-cancel re-verifies authority over BOTH seasons.
    const normalizedKey = receiptLookup?.requestKey?.trim().toLowerCase() ?? '';
    if (receiptLookup && normalizedKey) {
      const receipt = await context.db.commandReceipt.findUnique({
        where: {
          accountId_actionCode_requestKey: {
            accountId: accountId.toLowerCase(),
            actionCode: receiptLookup.actionCode,
            requestKey: normalizedKey,
          },
        },
        select: { expiresAt: true, responseData: true },
      });
      const now = await context.now();
      if (receipt && (!receipt.expiresAt || receipt.expiresAt > now)) {
        const data =
          receipt.responseData &&
          typeof receipt.responseData === 'object' &&
          !Array.isArray(receipt.responseData)
            ? (receipt.responseData as Record<string, unknown>)
            : null;
        const relatedId = typeof data?.relatedId === 'string' ? data.relatedId : null;
        if (relatedId) {
          const replayOp = await context.db.transferOperation.findUnique({
            where: { id: relatedId },
            select: { oldCaseId: true, newCaseId: true },
          });
          if (replayOp) {
            pairedCaseIds.add(replayOp.oldCaseId);
            pairedCaseIds.add(replayOp.newCaseId);
          }
        }
      }
    }

    // 2. Check explicit requestedOpId directly regardless of active/superseded status.
    if (requestedOpId) {
      const explicitOp = await context.db.transferOperation.findUnique({
        where: { id: requestedOpId },
        select: { oldCaseId: true, newCaseId: true },
      });
      recordOpCases(explicitOp);
    } else {
      // 3. Check active implicit paired transfer for fresh mutations without transferOperationId.
      const activeOp = await context.db.transferOperation.findFirst({
        where: {
          OR: [{ oldCaseId: caseId }, { newCaseId: caseId }],
          operationKind: { in: ['TRANSFER', 'PLAN_CHANGE'] },
          supersededBy: { none: {} },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { oldCaseId: true, newCaseId: true },
      });
      recordOpCases(activeOp);
    }

    const authorizedSeasonIds = new Set<string>([reg.seasonId]);
    for (const pairedCaseId of pairedCaseIds) {
      if (pairedCaseId === caseId) continue;
      const pairedCase = await context.db.playerRegistration.findUnique({
        where: { id: pairedCaseId },
        select: { seasonId: true },
      });
      if (!pairedCase) throw missing();
      if (!authorizedSeasonIds.has(pairedCase.seasonId)) {
        await requireSeasonRegistrationOfficer(context, accountId, pairedCase.seasonId);
        authorizedSeasonIds.add(pairedCase.seasonId);
      }
    }
  }

  async plans(request: Request, caseId: string) {
    try {
      return await this.execution.read(
        request,
        {
          locks: [{ kind: 'playerRegistration', key: caseId, mode: 'shared' }],
          discover: async (db) => {
            const reg = await db.playerRegistration.findUnique({
              where: { id: caseId },
              select: { seasonId: true, playerId: true, clubId: true },
            });
            if (!reg) return [];
            const ops = await db.transferOperation.findMany({
              where: { OR: [{ oldCaseId: caseId }, { newCaseId: caseId }] },
              select: { id: true, oldCaseId: true, newCaseId: true },
            });
            const locks: LockResource[] = [
              { kind: 'season', key: reg.seasonId, mode: 'shared' },
              { kind: 'player', key: reg.playerId, mode: 'shared' },
              { kind: 'club', key: reg.clubId, mode: 'shared' },
            ];
            for (const op of ops) {
              locks.push({ kind: 'transferOperation', key: op.id, mode: 'shared' });
              if (op.oldCaseId !== caseId) {
                locks.push({ kind: 'playerRegistration', key: op.oldCaseId, mode: 'shared' });
              }
              if (op.newCaseId !== caseId) {
                locks.push({ kind: 'playerRegistration', key: op.newCaseId, mode: 'shared' });
              }
            }
            return locks;
          },
          authorize: async (context, accountId) => {
            const reg = await context.db.playerRegistration.findUnique({
              where: { id: caseId },
              select: { seasonId: true },
            });
            if (!reg) throw missing();
            await requireSeasonRegistrationReader(context, accountId, reg.seasonId);
          },
        },
        async (context, accountId) => {
          const now = await context.now();
          const reg = await context.db.playerRegistration.findUnique({
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
              currentValidatedVersion: {
                include: {
                  decider: { select: { id: true, fullName: true, personnelCode: true } },
                },
              },
            },
          });
          if (!reg) throw missing();

          const [canManageSource, transferRows, officerSeasons, playerOtherRegs, readerSeasons] =
            await Promise.all([
              hasSeasonRole(context.db, accountId, ['REGISTRATION_OFFICER'], reg.seasonId),
              context.db.transferOperation.findMany({
                where: { OR: [{ oldCaseId: caseId }, { newCaseId: caseId }] },
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                include: {
                  actor: { select: { id: true, fullName: true, personnelCode: true } },
                  oldCase: {
                    select: {
                      id: true,
                      seasonId: true,
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
                      currentValidatedVersionId: true,
                    },
                  },
                  newCase: {
                    select: {
                      id: true,
                      seasonId: true,
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
                      currentValidatedVersionId: true,
                    },
                  },
                  oldBeforeVersion: {
                    select: {
                      id: true,
                      versionNumber: true,
                      playingStart: true,
                      playingEnd: true,
                      shirtNumber: true,
                      playingDisposition: true,
                    },
                  },
                  oldAfterVersion: {
                    select: {
                      id: true,
                      versionNumber: true,
                      playingStart: true,
                      playingEnd: true,
                      shirtNumber: true,
                      playingDisposition: true,
                    },
                  },
                  newVersion: {
                    select: {
                      id: true,
                      versionNumber: true,
                      playingStart: true,
                      playingEnd: true,
                      shirtNumber: true,
                      playingDisposition: true,
                    },
                  },
                  supersededBy: { select: { id: true }, take: 1 },
                },
              }),
              context.db.seasonRoleAssignment.findMany({
                where: {
                  accountId,
                  roleCode: 'REGISTRATION_OFFICER',
                  revokedAt: null,
                  season: { state: 'OPEN' },
                },
                select: {
                  season: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      state: true,
                      currentRegulationVersion: {
                        select: {
                          id: true,
                          versionNumber: true,
                          registrationWindows: {
                            where: { intakeKind: 'PLAYER_CHANGE' },
                            orderBy: [{ opensAt: 'asc' }, { id: 'asc' }],
                            select: { id: true, opensAt: true, closesAt: true },
                          },
                        },
                      },
                    },
                  },
                },
              }),
              context.db.playerRegistration.findMany({
                where: {
                  playerId: reg.playerId,
                  id: { not: caseId },
                  currentValidatedVersionId: { not: null },
                },
                select: {
                  id: true,
                  seasonId: true,
                  season: { select: { id: true, code: true, name: true } },
                  club: { select: { id: true, code: true, name: true, abbreviation: true } },
                  currentValidatedVersion: {
                    select: {
                      id: true,
                      versionNumber: true,
                      state: true,
                      shirtNumber: true,
                      playingStart: true,
                      playingEnd: true,
                      playingDisposition: true,
                    },
                  },
                },
                orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
              }),
              context.db.seasonRoleAssignment.findMany({
                where: {
                  accountId,
                  roleCode: { in: ['REGISTRATION_OFFICER', 'SEASON_MANAGER'] },
                  revokedAt: null,
                },
                select: { seasonId: true, roleCode: true },
              }),
            ]);

          const readableSeasonSet = new Set(readerSeasons.map((r) => r.seasonId));
          const officerSeasonSet = new Set(
            readerSeasons
              .filter((r) => r.roleCode === 'REGISTRATION_OFFICER')
              .map((r) => r.seasonId),
          );

          const openTargetSeasonIds = [...new Set(officerSeasons.map((r) => r.season.id))];
          const [targetClubApps, targetClubs, pendingDestVersions] =
            openTargetSeasonIds.length > 0
              ? await Promise.all([
                  context.db.clubApplication.findMany({
                    where: {
                      seasonId: { in: openTargetSeasonIds },
                      currentAcceptedVersionId: { not: null },
                    },
                    select: { seasonId: true, clubId: true, currentAcceptedVersionId: true },
                  }),
                  context.db.club.findMany({
                    where: { discontinuedAt: null },
                    orderBy: [{ name: 'asc' }, { id: 'asc' }],
                    select: { id: true, code: true, name: true, abbreviation: true },
                  }),
                  context.db.playerRegistration.findMany({
                    where: {
                      seasonId: { in: openTargetSeasonIds },
                      playerId: reg.playerId,
                      id: { not: caseId },
                      currentValidatedVersionId: null,
                      club: { discontinuedAt: null },
                    },
                    select: {
                      id: true,
                      seasonId: true,
                      clubId: true,
                      club: { select: { id: true, code: true, name: true } },
                      versions: {
                        where: { state: 'RECEIVED' },
                        orderBy: { versionNumber: 'desc' },
                        take: 1,
                        select: {
                          id: true,
                          versionNumber: true,
                          revision: true,
                          shirtNumber: true,
                          playingStart: true,
                          playingEnd: true,
                          receiptTimingStatus: true,
                          receiptExceptions: {
                            where: { state: 'APPROVED' },
                            select: { id: true },
                            take: 1,
                          },
                        },
                      },
                    },
                  }),
                ])
              : [[], [], []];

          const approvedBySeason = new Map<string, Set<string>>();
          for (const app of targetClubApps) {
            const set = approvedBySeason.get(app.seasonId) ?? new Set<string>();
            set.add(app.clubId);
            approvedBySeason.set(app.seasonId, set);
          }

          const transferHistory = transferRows.map((op) => {
            const oldReadable = readableSeasonSet.has(op.oldCase.seasonId);
            const newReadable = readableSeasonSet.has(op.newCase.seasonId);
            const counterpartReadable = op.oldCaseId === caseId ? newReadable : oldReadable;
            const isSuperseded = op.supersededBy.length > 0;
            const canManageBothSides =
              officerSeasonSet.has(op.oldCase.seasonId) &&
              officerSeasonSet.has(op.newCase.seasonId) &&
              op.oldCase.season.state === 'OPEN' &&
              op.newCase.season.state === 'OPEN';

            return {
              id: op.id,
              operationKind: op.operationKind,
              effectiveAt: op.effectiveAt.toISOString(),
              reason: op.reason,
              supersedesOperationId: op.supersedesOperationId,
              isSuperseded,
              createdAt: op.createdAt.toISOString(),
              actor: op.actor,
              direction: op.oldCaseId === caseId ? ('OUTGOING' as const) : ('INCOMING' as const),
              canManageBothSides,
              counterpartAccessRestricted: !counterpartReadable,
              oldSide: oldReadable
                ? {
                    accessRestricted: false,
                    caseId: op.oldCaseId,
                    season: op.oldCase.season,
                    club: {
                      ...op.oldCase.club,
                      discontinuedAt: op.oldCase.club.discontinuedAt?.toISOString() ?? null,
                    },
                    beforeVersion: {
                      id: op.oldBeforeVersion.id,
                      versionNumber: op.oldBeforeVersion.versionNumber,
                      shirtNumber: op.oldBeforeVersion.shirtNumber,
                      playingStart: op.oldBeforeVersion.playingStart?.toISOString() ?? null,
                      playingEnd: op.oldBeforeVersion.playingEnd?.toISOString() ?? null,
                      playingDisposition: op.oldBeforeVersion.playingDisposition,
                    },
                    afterVersion: {
                      id: op.oldAfterVersion.id,
                      versionNumber: op.oldAfterVersion.versionNumber,
                      shirtNumber: op.oldAfterVersion.shirtNumber,
                      playingStart: op.oldAfterVersion.playingStart?.toISOString() ?? null,
                      playingEnd: op.oldAfterVersion.playingEnd?.toISOString() ?? null,
                      playingDisposition: op.oldAfterVersion.playingDisposition,
                    },
                  }
                : {
                    accessRestricted: true,
                    caseId: null,
                    season: null,
                    club: null,
                    beforeVersion: null,
                    afterVersion: null,
                  },
              newSide: newReadable
                ? {
                    accessRestricted: false,
                    caseId: op.newCaseId,
                    season: op.newCase.season,
                    club: {
                      ...op.newCase.club,
                      discontinuedAt: op.newCase.club.discontinuedAt?.toISOString() ?? null,
                    },
                    version: {
                      id: op.newVersion.id,
                      versionNumber: op.newVersion.versionNumber,
                      shirtNumber: op.newVersion.shirtNumber,
                      playingStart: op.newVersion.playingStart?.toISOString() ?? null,
                      playingEnd: op.newVersion.playingEnd?.toISOString() ?? null,
                      playingDisposition: op.newVersion.playingDisposition,
                    },
                  }
                : {
                    accessRestricted: true,
                    caseId: null,
                    season: null,
                    club: null,
                    version: null,
                  },
            };
          });

          const activeTransferPlan =
            transferHistory.find(
              (op) =>
                !op.isSuperseded &&
                op.operationKind !== 'PLAN_CANCEL' &&
                new Date(op.effectiveAt).getTime() > now.getTime(),
            ) ?? null;

          const current = reg.currentValidatedVersion;
          const playingEffectivityStatus = current
            ? computePlayingEffectivityStatus(current, now)
            : 'NOT_VALIDATED';
          const isValidActive =
            !!current &&
            current.state === 'VALID' &&
            !!current.playingStart &&
            isActivePlayingDisposition(current.playingDisposition);
          const isProspective = isValidActive && current!.playingStart!.getTime() > now.getTime();
          const hasNotEnded =
            isValidActive &&
            (!current!.playingEnd || current!.playingEnd.getTime() > now.getTime());
          const seasonOpen = reg.season.state === 'OPEN';

          const dependencies = playerOtherRegs
            .filter(
              (other) =>
                other.currentValidatedVersion &&
                other.currentValidatedVersion.state === 'VALID' &&
                other.currentValidatedVersion.playingStart &&
                isActivePlayingDisposition(other.currentValidatedVersion.playingDisposition),
            )
            .map((other) => {
              const readable = readableSeasonSet.has(other.seasonId);
              const v = other.currentValidatedVersion!;
              if (!readable) {
                return {
                  caseId: null,
                  season: null,
                  club: null,
                  shirtNumber: null,
                  playingStart: null,
                  playingEnd: null,
                  playingEffectivityStatus: null,
                  accessRestricted: true,
                };
              }
              return {
                caseId: other.id,
                season: other.season,
                club: other.club,
                shirtNumber: v.shirtNumber,
                playingStart: v.playingStart!.toISOString(),
                playingEnd: v.playingEnd?.toISOString() ?? null,
                playingEffectivityStatus: computePlayingEffectivityStatus(v, now),
                accessRestricted: false,
              };
            });

          const seenSeason = new Set<string>();
          const authorizedTargetSeasons = officerSeasons
            .filter((entry) => {
              if (seenSeason.has(entry.season.id)) return false;
              seenSeason.add(entry.season.id);
              return true;
            })
            .map((entry) => {
              const s = entry.season;
              const approvedClubs = approvedBySeason.get(s.id) ?? new Set<string>();
              return {
                id: s.id,
                code: s.code,
                name: s.name,
                hasEffectiveRegulation: !!s.currentRegulationVersion,
                effectiveRegulationVersionNumber: s.currentRegulationVersion?.versionNumber ?? null,
                playerChangeWindows: (s.currentRegulationVersion?.registrationWindows ?? []).map(
                  (w) => ({
                    id: w.id,
                    opensAt: w.opensAt.toISOString(),
                    closesAt: w.closesAt.toISOString(),
                  }),
                ),
                eligibleClubs: targetClubs
                  .filter((c) => approvedClubs.has(c.id))
                  .filter((c) => !(s.id === reg.seasonId && c.id === reg.clubId)),
                receivedDestinationCandidates: pendingDestVersions
                  .filter(
                    (p) =>
                      p.seasonId === s.id &&
                      p.versions.length > 0 &&
                      approvedClubs.has(p.clubId) &&
                      !(s.id === reg.seasonId && p.clubId === reg.clubId),
                  )
                  .map((p) => {
                    const v = p.versions[0];
                    return {
                      caseId: p.id,
                      club: p.club,
                      versionId: v.id,
                      versionNumber: v.versionNumber,
                      revision: v.revision.toString(),
                      shirtNumber: v.shirtNumber,
                      playingStart: v.playingStart?.toISOString() ?? null,
                      playingEnd: v.playingEnd?.toISOString() ?? null,
                      receiptTimingStatus: v.receiptTimingStatus,
                      hasApprovedException: v.receiptExceptions.length > 0,
                    };
                  }),
              };
            });

          return {
            caseId: reg.id,
            revision: reg.revision.toString(),
            serverNow: now.toISOString(),
            season: reg.season,
            club: {
              ...reg.club,
              discontinuedAt: reg.club.discontinuedAt?.toISOString() ?? null,
            },
            player: {
              ...reg.player,
              birthDate: formatDateOnly(reg.player.birthDate),
            },
            playingEffectivityStatus,
            currentValidatedVersion: current
              ? {
                  id: current.id,
                  versionNumber: current.versionNumber,
                  revision: current.revision.toString(),
                  state: current.state,
                  shirtNumber: current.shirtNumber,
                  playingStart: current.playingStart?.toISOString() ?? null,
                  playingEnd: current.playingEnd?.toISOString() ?? null,
                  playingDisposition: current.playingDisposition,
                  u21Finding: current.u21Finding,
                  homegrownFinding: current.homegrownFinding,
                  nonHomegrownOptIn: current.nonHomegrownOptIn,
                  decisionReason: current.decisionReason,
                  decidedAt: current.decidedAt?.toISOString() ?? null,
                  decider: current.decider,
                }
              : null,
            activeTransferPlan,
            transferHistory,
            dependencies,
            authorizedTargetSeasons,
            capabilities: {
              seasonOpen,
              canManageSource,
              canTerminate:
                seasonOpen &&
                canManageSource &&
                isValidActive &&
                hasNotEnded &&
                !isProspective &&
                !activeTransferPlan,
              canTransfer:
                seasonOpen &&
                canManageSource &&
                isValidActive &&
                hasNotEnded &&
                !activeTransferPlan &&
                authorizedTargetSeasons.length > 0,
              canPlanChange:
                seasonOpen &&
                canManageSource &&
                ((activeTransferPlan && activeTransferPlan.canManageBothSides) ||
                  (!activeTransferPlan && isProspective)),
              canPlanCancel:
                seasonOpen &&
                canManageSource &&
                ((activeTransferPlan && activeTransferPlan.canManageBothSides) ||
                  (!activeTransferPlan && isProspective)),
            },
          };
        },
      );
    } catch (error) {
      concealMissingPlanResource(error);
    }
  }

  async terminate(request: Request, caseId: string, input: TerminateRegistrationDto) {
    const versionId = input.versionId.toLowerCase();
    const expectedRevision = input.expectedRevision;
    const reason = requiredBoundedText(
      input.reason,
      2000,
      'Vui lòng nhập lý do chấm dứt hiệu lực.',
    );
    const { effectiveMode, requestedInstant } = parseEffectiveModeAndInstant(
      input.effectiveMode,
      input.effectiveAt,
    );

    let summary:
      | {
          caseId: string;
          versionId: string;
          versionNumber: number;
          predecessorVersionId: string;
          revision: string;
          playingStart: string;
          playingEnd: string;
          playingDisposition: string;
          decidedAt: string;
        }
      | undefined;

    try {
      const critical = await this.execution.executeCritical(
        request,
        {
          locks: [
            { kind: 'playerRegistration', key: caseId, mode: 'exclusive' },
            { kind: 'registrationVersion', key: versionId, mode: 'exclusive' },
          ],
          discover: async (db) => {
            const reg = await db.playerRegistration.findUnique({
              where: { id: caseId },
              select: { seasonId: true, playerId: true, clubId: true },
            });
            if (!reg) return [];
            const ops = await db.transferOperation.findMany({
              where: {
                OR: [{ oldCaseId: caseId }, { newCaseId: caseId }],
                supersededBy: { none: {} },
              },
              select: { id: true },
            });
            return [
              { kind: 'season', key: reg.seasonId, mode: 'exclusive' },
              { kind: 'player', key: reg.playerId, mode: 'exclusive' },
              { kind: 'club', key: reg.clubId, mode: 'exclusive' },
              ...ops.map((o) => ({
                kind: 'transferOperation' as const,
                key: o.id,
                mode: 'exclusive' as const,
              })),
            ];
          },
          authorize: async (context, accountId) => {
            const reg = await context.db.playerRegistration.findUnique({
              where: { id: caseId },
              select: { seasonId: true },
            });
            if (!reg) throw missing();
            await requireSeasonRegistrationOfficer(context, accountId, reg.seasonId);
          },
        },
        {
          action: 'PLAYER_REGISTRATION_TERMINATED',
          targetId: caseId,
          payload: {
            expectedRevision,
            versionId,
            effectiveMode,
            ...(requestedInstant ? { effectiveAt: requestedInstant.toISOString() } : {}),
            reason,
          },
        },
        async (context, command) => {
          const reg = await context.db.playerRegistration.findUnique({
            where: { id: caseId },
          });
          if (!reg) throw missing();
          await requireOpenSeason(context, reg.seasonId);

          const version = await context.db.registrationVersion.findFirst({
            where: { id: versionId, caseId },
          });
          if (!version) throw missing();
          assertRevision(version.revision, expectedRevision);

          if (reg.currentValidatedVersionId !== version.id || version.state !== 'VALID') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể chấm dứt phiên bản đăng ký hợp lệ đang giữ vai trò chính thức hiện hành.',
            );
          }
          if (!version.playingStart || !isActivePlayingDisposition(version.playingDisposition)) {
            throw conflict(
              'STATE_CONFLICT',
              'Phiên bản đăng ký này không còn ở trạng thái hiệu lực thi đấu để chấm dứt.',
            );
          }

          await context.recheckAuthority();
          const now = await context.now();
          const effectiveAt = effectiveMode === 'IMMEDIATE' ? now : requestedInstant!;

          // FR-018: do not orphan an active prospective paired transfer by mutating one side independently
          const activeTransfer = await resolveActivePairedTransferStrict(context.db, caseId);
          if (activeTransfer && activeTransfer.latest.effectiveAt.getTime() > now.getTime()) {
            throw planConflict(
              'DEPENDENT_PLAN',
              'CONFLICT_DEPENDENCY',
              'Hồ sơ này đang gắn với kế hoạch chuyển nhượng tương lai chưa có hiệu lực; vui lòng điều chỉnh hoặc hủy kế hoạch chuyển nhượng trước khi chấm dứt độc lập.',
            );
          }

          if (effectiveAt.getTime() < now.getTime()) {
            throw planConflict(
              'PLAYING_INTERVAL',
              'BACKDATING_FORBIDDEN',
              'Không được chấm dứt hồi tố trước thời điểm hệ thống ghi nhận quyết định.',
            );
          }
          if (effectiveAt.getTime() <= version.playingStart.getTime()) {
            throw planConflict(
              'PLAYING_INTERVAL',
              'INVALID_INTERVAL_BOUND',
              'Thời điểm chấm dứt phải lớn hơn thời điểm bắt đầu hiệu lực thi đấu; để hủy kế hoạch chưa bắt đầu vui lòng dùng thao tác hủy kế hoạch tương lai.',
            );
          }
          if (version.playingEnd !== null) {
            if (version.playingEnd.getTime() <= now.getTime()) {
              throw planConflict(
                'PLAYING_INTERVAL',
                'ALREADY_ENDED',
                'Khoảng hiệu lực thi đấu của hồ sơ này đã kết thúc.',
              );
            }
            if (effectiveAt.getTime() >= version.playingEnd.getTime()) {
              throw planConflict(
                'PLAYING_INTERVAL',
                'INVALID_INTERVAL_BOUND',
                'Thời điểm chấm dứt mới phải sớm hơn thời điểm kết thúc hiện tại của đăng ký.',
              );
            }
          }

          const latest = await context.db.registrationVersion.findFirst({
            where: { caseId },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
          });
          const nextVersionNumber = (latest?.versionNumber ?? version.versionNumber) + 1;
          const nextVersionId = randomUUID();

          const created = await createSuccessorRegistrationVersion(context, version, {
            id: nextVersionId,
            versionNumber: nextVersionNumber,
            actorId: command.accountId,
            now,
            reason,
            playingStart: version.playingStart,
            playingEnd: effectiveAt,
            playingDisposition: 'ACTIVE',
            planEvent: {
              kind: 'TERMINATION',
              predecessorVersionId: version.id,
              effectiveAt: effectiveAt.toISOString(),
              reason,
            },
          });

          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: {
              currentValidatedVersionId: nextVersionId,
              revision: { increment: 1 },
              updatedAt: now,
            },
          });

          await this.audit.append(context, {
            action: 'PLAYER_REGISTRATION_TERMINATED',
            actor: { kind: 'ACCOUNT', accountId: command.accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: reg.seasonId,
            outcome: 'SUCCESS',
            reason,
            before: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              playingStart: version.playingStart.toISOString(),
              playingEnd: version.playingEnd?.toISOString() ?? null,
            },
            after: {
              caseId,
              clubId: reg.clubId,
              playerId: reg.playerId,
              versionId: nextVersionId,
              versionNumber: nextVersionNumber,
              predecessorVersionId: version.id,
              playingStart: version.playingStart.toISOString(),
              playingEnd: effectiveAt.toISOString(),
              effectiveAt: effectiveAt.toISOString(),
              decidedAt: now.toISOString(),
              playingDisposition: 'ACTIVE',
            },
          });

          return {
            status: 200,
            data: {
              id: caseId,
              revision: created.revision.toString(),
              relatedId: nextVersionId,
            },
          };
        },
        async (context, outcome) => {
          const v = await context.db.registrationVersion.findUnique({
            where: { id: outcome.data.relatedId! },
            select: {
              id: true,
              versionNumber: true,
              predecessorVersionId: true,
              revision: true,
              playingStart: true,
              playingEnd: true,
              playingDisposition: true,
              decidedAt: true,
            },
          });
          if (v && v.playingStart && v.playingEnd) {
            summary = {
              caseId,
              versionId: v.id,
              versionNumber: v.versionNumber,
              predecessorVersionId: v.predecessorVersionId ?? versionId,
              revision: v.revision.toString(),
              playingStart: v.playingStart.toISOString(),
              playingEnd: v.playingEnd.toISOString(),
              playingDisposition: v.playingDisposition ?? 'ACTIVE',
              decidedAt: v.decidedAt?.toISOString() ?? '',
            };
          }
          return outcome;
        },
      );

      return {
        ...critical.data,
        ...(summary ?? { caseId, versionId: critical.data.relatedId ?? versionId }),
      };
    } catch (error) {
      concealMissingPlanResource(error);
    }
  }

  async transfer(request: Request, caseId: string, input: TransferRegistrationDto) {
    const oldVersionId = input.oldVersionId.toLowerCase();
    const expectedRevision = input.expectedRevision;
    const reason = requiredBoundedText(
      input.reason,
      2000,
      'Vui lòng nhập lý do chuyển câu lạc bộ.',
    );
    const { effectiveMode, requestedInstant } = parseEffectiveModeAndInstant(
      input.effectiveMode,
      input.effectiveAt,
    );
    const requestedPlayingEnd = parseOptionalInstant(
      input.playingEnd,
      'Thời điểm kết thúc hiệu lực đăng ký mới',
    );
    const notes = optionalBoundedText(input.notes, 2000);

    const isExistingDestination =
      input.destinationCaseId !== undefined && input.destinationCaseId !== null;
    if (
      !isExistingDestination &&
      input.destinationVersionId !== undefined &&
      input.destinationVersionId !== null
    ) {
      throw invalid('Cần cung cấp đầy đủ hồ sơ và phiên bản đích khi liên kết bản đã tiếp nhận.');
    }
    if (isExistingDestination) {
      if (!input.destinationVersionId || !input.destinationExpectedRevision) {
        throw invalid(
          'Cần cung cấp đầy đủ thông tin hồ sơ đích, phiên bản đích và phiên bản kỹ thuật tương ứng.',
        );
      }
      if (input.destinationCaseId!.toLowerCase() === caseId) {
        throw invalid('Hồ sơ đăng ký đích phải khác hồ sơ đăng ký nguồn.');
      }
    } else {
      if (!input.destinationSeasonId || !input.destinationClubId) {
        throw invalid('Vui lòng chọn mùa giải đích và câu lạc bộ đích cho chuyển nhượng.');
      }
      if (!isValidShirtNumber(input.shirtNumber)) {
        throw invalid('Số áo đăng ký đích phải là số nguyên từ 1 đến 99.');
      }
    }

    if (
      requestedInstant &&
      requestedPlayingEnd &&
      requestedPlayingEnd.getTime() <= requestedInstant.getTime()
    ) {
      throw invalid(
        'Khoảng thời gian hiệu lực đăng ký đích [bắt đầu, kết thúc) không hợp lệ (kết thúc phải lớn hơn bắt đầu).',
      );
    }

    const destCaseIdInput = input.destinationCaseId?.toLowerCase() ?? null;
    const destVersionIdInput = input.destinationVersionId?.toLowerCase() ?? null;
    const destExpectedRevInput = input.destinationExpectedRevision ?? null;
    const inlineDestSeasonId = input.destinationSeasonId?.toLowerCase() ?? null;
    const inlineDestClubId = input.destinationClubId?.toLowerCase() ?? null;
    const inlineBasisDigest = isExistingDestination
      ? undefined
      : hashInlineTransferBasis(input, notes);

    let transferSummary:
      | {
          transferOperationId: string;
          oldCaseId: string;
          oldBeforeVersionId: string;
          oldAfterVersionId: string;
          newCaseId: string;
          newVersionId: string;
          effectiveAt: string;
          operationKind: string;
        }
      | undefined;

    try {
      const critical = await this.execution.executeCritical(
        request,
        {
          locks: [
            { kind: 'playerRegistration', key: caseId, mode: 'exclusive' },
            { kind: 'registrationVersion', key: oldVersionId, mode: 'exclusive' },
            ...(destCaseIdInput
              ? [
                  {
                    kind: 'playerRegistration' as const,
                    key: destCaseIdInput,
                    mode: 'exclusive' as const,
                  },
                ]
              : []),
            ...(destVersionIdInput
              ? [
                  {
                    kind: 'registrationVersion' as const,
                    key: destVersionIdInput,
                    mode: 'exclusive' as const,
                  },
                ]
              : []),
          ],
          discover: async (db) => {
            const oldReg = await db.playerRegistration.findUnique({
              where: { id: caseId },
              select: { seasonId: true, playerId: true, clubId: true },
            });
            if (!oldReg) return [];

            let destSeasonId = inlineDestSeasonId;
            let destClubId = inlineDestClubId;
            if (destCaseIdInput) {
              const destReg = await db.playerRegistration.findUnique({
                where: { id: destCaseIdInput },
                select: { seasonId: true, clubId: true },
              });
              if (!destReg) return [];
              destSeasonId = destReg.seasonId;
              destClubId = destReg.clubId;
            }
            if (!destSeasonId || !destClubId) return [];

            const destSeasonLocks = await discoverSeasonWithDueRules(
              db,
              destSeasonId,
              this.activation,
            );
            return [
              ...destSeasonLocks,
              { kind: 'season', key: oldReg.seasonId, mode: 'exclusive' },
              { kind: 'player', key: oldReg.playerId, mode: 'exclusive' },
              { kind: 'club', key: oldReg.clubId, mode: 'exclusive' },
              { kind: 'club', key: destClubId, mode: 'exclusive' },
            ];
          },
          authorize: async (context, accountId) => {
            const oldReg = await context.db.playerRegistration.findUnique({
              where: { id: caseId },
              select: { seasonId: true },
            });
            if (!oldReg) throw missing();

            let destSeasonId = inlineDestSeasonId;
            if (destCaseIdInput) {
              const destReg = await context.db.playerRegistration.findUnique({
                where: { id: destCaseIdInput },
                select: { seasonId: true },
              });
              if (!destReg) throw missing();
              destSeasonId = destReg.seasonId;
            }
            if (!destSeasonId) throw invalid();

            // D056 / FR-017: Officer MUST hold REGISTRATION_OFFICER authority over BOTH affected seasons.
            await requireSeasonRegistrationOfficer(context, accountId, oldReg.seasonId);
            if (destSeasonId !== oldReg.seasonId) {
              await requireSeasonRegistrationOfficer(context, accountId, destSeasonId);
            }
          },
        },
        async (context) => {
          let destSeasonId = inlineDestSeasonId;
          let destClubId = inlineDestClubId;
          let receiptExceptionVersionId: string | undefined;
          let effectivePlayingEndIso: string | undefined = requestedPlayingEnd?.toISOString();
          let shirtStr: string | undefined =
            input.shirtNumber !== undefined && input.shirtNumber !== null
              ? String(input.shirtNumber)
              : undefined;

          if (destCaseIdInput && destVersionIdInput) {
            const destReg = await context.db.playerRegistration.findUnique({
              where: { id: destCaseIdInput },
              select: { seasonId: true, clubId: true },
            });
            if (!destReg) throw missing();
            destSeasonId = destReg.seasonId;
            destClubId = destReg.clubId;
            const destVer = await context.db.registrationVersion.findFirst({
              where: { id: destVersionIdInput, caseId: destCaseIdInput },
              select: { id: true, shirtNumber: true, playingEnd: true },
            });
            if (!destVer) throw missing();
            if (destVer.shirtNumber !== null) shirtStr = String(destVer.shirtNumber);
            if (destVer.playingEnd) effectivePlayingEndIso = destVer.playingEnd.toISOString();
            const approvedEx = await this.intake.findApprovedException(
              context,
              'PLAYER_REGISTRATION',
              destReg.seasonId,
              destVer.id,
            );
            if (approvedEx) receiptExceptionVersionId = approvedEx.id;
          }

          if (!destSeasonId || !destClubId) throw invalid();

          return {
            action: 'PLAYER_TRANSFER_EXECUTED',
            targetId: caseId,
            payload: {
              expectedRevision,
              oldVersionId,
              destinationSeasonId: destSeasonId,
              destinationClubId: destClubId,
              effectiveMode,
              reason,
              ...(destCaseIdInput ? { destinationCaseId: destCaseIdInput } : {}),
              ...(destVersionIdInput ? { destinationVersionId: destVersionIdInput } : {}),
              ...(destExpectedRevInput
                ? { destinationExpectedRevision: destExpectedRevInput }
                : {}),
              ...(requestedInstant ? { effectiveAt: requestedInstant.toISOString() } : {}),
              ...(effectivePlayingEndIso ? { playingEnd: effectivePlayingEndIso } : {}),
              ...(shirtStr ? { shirtNumber: shirtStr } : {}),
              ...(receiptExceptionVersionId ? { receiptExceptionVersionId } : {}),
              ...(inlineBasisDigest ? { contentBasisDigest: inlineBasisDigest } : {}),
            },
          };
        },
        async (context, command) => {
          const oldReg = await context.db.playerRegistration.findUnique({
            where: { id: caseId },
            include: {
              season: { select: { id: true, code: true, name: true, state: true } },
              club: { select: { id: true, code: true, name: true, abbreviation: true } },
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
          });
          if (!oldReg) throw missing();

          // Source season must be OPEN (source club MAY be discontinued under D099/FR-017!)
          await requireOpenSeason(context, oldReg.seasonId);

          const oldVersion = await context.db.registrationVersion.findFirst({
            where: { id: oldVersionId, caseId },
          });
          if (!oldVersion) throw missing();
          assertRevision(oldVersion.revision, expectedRevision);

          if (oldReg.currentValidatedVersionId !== oldVersion.id || oldVersion.state !== 'VALID') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể chuyển nhượng từ phiên bản đăng ký hợp lệ đang giữ vai trò chính thức hiện hành.',
            );
          }
          if (
            !oldVersion.playingStart ||
            !isActivePlayingDisposition(oldVersion.playingDisposition)
          ) {
            throw conflict(
              'STATE_CONFLICT',
              'Đăng ký nguồn không còn ở trạng thái hiệu lực thi đấu để chuyển câu lạc bộ.',
            );
          }

          // Block starting a second competing prospective transfer while an active future transfer exists
          const existingPaired = await resolveActivePairedTransferStrict(context.db, caseId);
          if (existingPaired) {
            const checkNow = await context.now();
            if (existingPaired.latest.effectiveAt.getTime() > checkNow.getTime()) {
              throw conflict(
                'STATE_CONFLICT',
                'Hồ sơ nguồn đang gắn với một kế hoạch chuyển nhượng chưa hiệu lực; hãy điều chỉnh hoặc hủy kế hoạch hiện tại trước.',
              );
            }
          }

          let destSeasonId: string;
          let destClubId: string;
          let existingDestReg: {
            id: string;
            seasonId: string;
            clubId: string;
            playerId: string;
            currentValidatedVersionId: string | null;
          } | null = null;
          let existingDestVersion: Prisma.RegistrationVersionGetPayload<object> | null = null;

          if (destCaseIdInput && destVersionIdInput) {
            existingDestReg = await context.db.playerRegistration.findUnique({
              where: { id: destCaseIdInput },
              select: {
                id: true,
                seasonId: true,
                clubId: true,
                playerId: true,
                currentValidatedVersionId: true,
              },
            });
            if (!existingDestReg) throw missing();
            if (existingDestReg.playerId !== oldReg.playerId) {
              throw conflict(
                'STATE_CONFLICT',
                'Hồ sơ đăng ký đích không thuộc cùng một cầu thủ với hồ sơ nguồn.',
              );
            }
            if (existingDestReg.currentValidatedVersionId) {
              throw conflict(
                'STATE_CONFLICT',
                'Hồ sơ đăng ký đích đã được xác nhận hợp lệ trước đó.',
              );
            }
            existingDestVersion = await context.db.registrationVersion.findFirst({
              where: { id: destVersionIdInput, caseId: destCaseIdInput },
            });
            if (!existingDestVersion) throw missing();
            assertRevision(existingDestVersion.revision, destExpectedRevInput!);
            if (existingDestVersion.state !== 'RECEIVED') {
              throw conflict(
                'STATE_CONFLICT',
                'Phiên bản đăng ký đích phải đang ở trạng thái Đã tiếp nhận trước khi ghép chuyển nhượng.',
              );
            }
            destSeasonId = existingDestReg.seasonId;
            destClubId = existingDestReg.clubId;
          } else {
            destSeasonId = inlineDestSeasonId!;
            destClubId = inlineDestClubId!;
          }

          if (destSeasonId === oldReg.seasonId && destClubId === oldReg.clubId) {
            throw conflict(
              'STATE_CONFLICT',
              'Câu lạc bộ đích trong cùng mùa giải phải khác câu lạc bộ hiện tại của cầu thủ.',
            );
          }

          // Destination season must be OPEN and have a resolved effective regulation (D052/D076/D089)
          const { regulation: destRegulation, resolvedAt: now } =
            await resolveEffectiveRegulationWithInstant(context, destSeasonId, this.activation);

          // Destination club MUST be available for new use under D099 (source club is NOT re-checked!)
          await assertMastersAvailableForNewUse(context, { clubId: destClubId });

          const effectiveAt = effectiveMode === 'IMMEDIATE' ? now : requestedInstant!;

          // Source termination boundary checks (NO backdating, NO empty/reversed source interval)
          if (effectiveAt.getTime() < now.getTime()) {
            throw planConflict(
              'PLAYING_INTERVAL',
              'BACKDATING_FORBIDDEN',
              'Thời điểm chuyển câu lạc bộ không được ở quá khứ so với thời điểm hệ thống ghi nhận.',
            );
          }
          if (effectiveAt.getTime() <= oldVersion.playingStart.getTime()) {
            throw planConflict(
              'PLAYING_INTERVAL',
              'INVALID_INTERVAL_BOUND',
              'Thời điểm chuyển câu lạc bộ phải lớn hơn thời điểm bắt đầu hiệu lực của đăng ký nguồn.',
            );
          }
          if (oldVersion.playingEnd !== null) {
            if (oldVersion.playingEnd.getTime() <= now.getTime()) {
              throw planConflict(
                'PLAYING_INTERVAL',
                'ALREADY_ENDED',
                'Đăng ký nguồn đã kết thúc hiệu lực thi đấu và không thể chuyển tiếp.',
              );
            }
            if (effectiveAt.getTime() > oldVersion.playingEnd.getTime()) {
              throw planConflict(
                'PLAYING_INTERVAL',
                'INVALID_INTERVAL_BOUND',
                'Thời điểm chuyển câu lạc bộ không được vượt quá thời điểm kết thúc đã xác nhận của đăng ký nguồn.',
              );
            }
          }

          let destShirtNumber: number | null;
          let destPlayingEnd: Date | null;
          let destNonHomegrownOptIn: boolean;
          let destEvidence: HomegrownEvidenceInput | null;
          let destReceipt: {
            receivedAt: Date;
            receiptTimingStatus: 'ON_TIME' | 'LATE';
            receiptRegulationVersionId: string;
            receiptWindowId: string | null;
            approvedExceptionVersionId: string | null;
          };

          if (existingDestVersion) {
            if (
              !existingDestVersion.playingStart ||
              existingDestVersion.playingStart.getTime() !== effectiveAt.getTime()
            ) {
              throw conflict(
                'STATE_CONFLICT',
                'Thời điểm bắt đầu hiệu lực của phiên bản đích đã tiếp nhận phải trùng khớp chính xác với thời điểm chuyển câu lạc bộ.',
              );
            }
            const { receiptExceptionVersionId } =
              await this.intake.requireTimelyOrApprovedException(
                context,
                'PLAYER_REGISTRATION',
                destSeasonId,
                existingDestVersion,
              );
            destShirtNumber = existingDestVersion.shirtNumber;
            destPlayingEnd = existingDestVersion.playingEnd;
            destNonHomegrownOptIn = existingDestVersion.nonHomegrownOptIn;
            const hasExistingEv =
              existingDestVersion.evidenceBranch !== null ||
              existingDestVersion.qualifyingValue !== null ||
              !!existingDestVersion.evidenceSummary ||
              !!existingDestVersion.evidenceReference ||
              existingDestVersion.affiliatedAssociationBasis !== null;
            destEvidence = hasExistingEv
              ? {
                  evidenceBranch:
                    existingDestVersion.evidenceBranch as HomegrownEvidenceBranch | null,
                  qualifyingValue: existingDestVersion.qualifyingValue,
                  evidenceSummary: existingDestVersion.evidenceSummary,
                  evidenceReference: existingDestVersion.evidenceReference,
                  affiliatedAssociationBasis: existingDestVersion.affiliatedAssociationBasis,
                  verifiedBy: existingDestVersion.verifiedBy,
                  verifiedAt: existingDestVersion.verifiedAt,
                  verifiedRegulationVersionId: existingDestVersion.decisionRegulationVersionId,
                }
              : null;
            destReceipt = {
              receivedAt: existingDestVersion.receivedAt!,
              receiptTimingStatus: existingDestVersion.receiptTimingStatus as 'ON_TIME' | 'LATE',
              receiptRegulationVersionId: existingDestVersion.receiptRegulationVersionId!,
              receiptWindowId: existingDestVersion.receiptWindowId,
              approvedExceptionVersionId: receiptExceptionVersionId,
            };
          } else {
            const timing = this.intake.assessReceiptTiming(
              destRegulation.registrationWindows,
              'PLAYER_CHANGE',
              now,
            );
            if (timing.receiptTimingStatus !== 'ON_TIME') {
              throw planConflict(
                'RECEIPT_WINDOW',
                'OUTSIDE_WINDOW',
                'Mùa giải đích đang ngoài khung thời gian tiếp nhận thay đổi cầu thủ; để chuyển ngoài hạn cần tiếp nhận hồ sơ đích và được phê duyệt ngoại lệ tiếp nhận cho đúng phiên bản đó.',
              );
            }
            destShirtNumber = input.shirtNumber!;
            destPlayingEnd = requestedPlayingEnd ?? null;
            destNonHomegrownOptIn = input.nonHomegrownOptIn ?? false;
            destEvidence = resolveInlineHomegrownEvidence(
              input,
              command.accountId,
              now,
              destRegulation.id,
            );
            destReceipt = {
              receivedAt: now,
              receiptTimingStatus: 'ON_TIME',
              receiptRegulationVersionId: destRegulation.id,
              receiptWindowId: timing.receiptWindowId,
              approvedExceptionVersionId: null,
            };
          }

          if (!isValidPlayingInterval({ start: effectiveAt, end: destPlayingEnd })) {
            throw invalid(
              'Khoảng thời gian hiệu lực đăng ký đích [bắt đầu, kết thúc) không hợp lệ.',
            );
          }

          const [destSeason, destClub, destClubApp, rawIntervals] = await Promise.all([
            context.db.season.findUnique({
              where: { id: destSeasonId },
              select: { id: true, code: true, name: true },
            }),
            context.db.club.findUnique({
              where: { id: destClubId },
              select: {
                id: true,
                code: true,
                name: true,
                abbreviation: true,
                discontinuedAt: true,
              },
            }),
            context.db.clubApplication.findUnique({
              where: { seasonId_clubId: { seasonId: destSeasonId, clubId: destClubId } },
              select: { id: true, currentAcceptedVersionId: true },
            }),
            loadCompetitionAndClubIntervals(context.db, {
              seasonId: destSeasonId,
              clubId: destClubId,
              playerId: oldReg.playerId,
              excludeRegistrationIds: existingDestReg ? [existingDestReg.id] : [],
            }),
          ]);
          if (!destSeason || !destClub) throw missing();

          const projectedPlayerIntervals: ExistingRegistrationInterval[] =
            rawIntervals.existingPlayerIntervals.map((interval) =>
              interval.registrationId === oldReg.id
                ? { ...interval, playingEnd: effectiveAt }
                : interval,
            );

          const assessment = assessRegistrationEligibility({
            mode: 'CONFIRMATION',
            seasonId: destSeasonId,
            clubId: destClubId,
            playerId: oldReg.playerId,
            regulation: toRegulationBasis(destRegulation),
            clubParticipation: {
              clubExists: true,
              hasApprovedApplication: !!destClubApp?.currentAcceptedVersionId,
              acceptedApplicationVersionId: destClubApp?.currentAcceptedVersionId ?? null,
              clubDiscontinued: destClub.discontinuedAt !== null,
            },
            receipt: destReceipt,
            player: {
              id: oldReg.player.id,
              birthDateIso: formatDateOnly(oldReg.player.birthDate),
            },
            candidate: {
              registrationId: existingDestReg?.id,
              shirtNumber: destShirtNumber,
              playingStart: effectiveAt,
              playingEnd: destPlayingEnd,
              nonHomegrownOptIn: destNonHomegrownOptIn,
              homegrownEvidence: destEvidence,
            },
            existingPlayerIntervals: projectedPlayerIntervals,
            existingClubSeasonIntervals: rawIntervals.existingClubSeasonIntervals,
          });

          if (!assessment.eligibleForConfirmation) {
            throw buildEligibilityRejectionError(assessment);
          }

          // --- ATOMIC PAIRED WRITE ---
          const oldLatest = await context.db.registrationVersion.findFirst({
            where: { caseId: oldReg.id },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
          });
          const oldAfterVersionNumber = (oldLatest?.versionNumber ?? oldVersion.versionNumber) + 1;
          const oldAfterVersionId = randomUUID();
          const newCaseId = existingDestReg?.id ?? randomUUID();
          const newVersionId = existingDestVersion?.id ?? randomUUID();
          const transferOperationId = randomUUID();

          const oldAfterCreated = await createSuccessorRegistrationVersion(context, oldVersion, {
            id: oldAfterVersionId,
            versionNumber: oldAfterVersionNumber,
            actorId: command.accountId,
            now,
            reason,
            playingStart: oldVersion.playingStart,
            playingEnd: effectiveAt,
            playingDisposition: 'ACTIVE',
            planEvent: {
              kind: 'TRANSFER_OUT',
              transferOperationId,
              counterpartCaseId: newCaseId,
              predecessorVersionId: oldVersion.id,
              effectiveAt: effectiveAt.toISOString(),
              reason,
            },
          });

          await context.db.playerRegistration.update({
            where: { id: oldReg.id },
            data: {
              currentValidatedVersionId: oldAfterVersionId,
              revision: { increment: 1 },
              updatedAt: now,
            },
          });

          const newVersionNumber = existingDestVersion?.versionNumber ?? 1;
          const destSnapshot: Prisma.InputJsonObject = {
            capturedAt: now.toISOString(),
            season: { id: destSeason.id, code: destSeason.code, name: destSeason.name },
            club: {
              id: destClub.id,
              code: destClub.code,
              name: destClub.name,
              abbreviation: destClub.abbreviation,
              acceptedApplicationVersionId: destClubApp?.currentAcceptedVersionId ?? null,
            },
            player: {
              id: oldReg.player.id,
              code: oldReg.player.code,
              fullName: oldReg.player.fullName,
              birthDate: formatDateOnly(oldReg.player.birthDate),
              nationalityCode: oldReg.player.nationalityCode,
              positionCode: oldReg.player.positionCode,
            },
            registration: {
              caseId: newCaseId,
              versionId: newVersionId,
              versionNumber: newVersionNumber,
              shirtNumber: destShirtNumber,
              playingStart: effectiveAt.toISOString(),
              playingEnd: destPlayingEnd?.toISOString() ?? null,
              u21Finding: assessment.u21Finding,
              homegrownFinding: assessment.homegrownFinding,
              nonHomegrownOptIn: destNonHomegrownOptIn,
              playingDisposition: 'ACTIVE',
            },
            basis: {
              receiptRegulationVersionId: destReceipt.receiptRegulationVersionId,
              receiptTimingStatus: destReceipt.receiptTimingStatus,
              receiptWindowId: destReceipt.receiptWindowId,
              receiptExceptionVersionId: destReceipt.approvedExceptionVersionId,
              decisionRegulationVersionId: destRegulation.id,
              squadLimit: assessment.squadLimit,
              nonHomegrownLimit: assessment.nonHomegrownLimit,
            },
            planEvent: {
              kind: 'TRANSFER_IN',
              transferOperationId,
              counterpartCaseId: oldReg.id,
              effectiveAt: effectiveAt.toISOString(),
              reason,
            },
            criteria: assessment.criteria.map((c) => ({
              criterion: c.criterion,
              status: c.status,
              reason: c.reason,
              regulationVersionId: c.regulationVersionId,
            })),
          };

          if (existingDestVersion && existingDestReg) {
            await context.db.registrationVersion.update({
              where: { id: existingDestVersion.id },
              data: {
                state: 'VALID',
                decidedAt: now,
                decidedBy: command.accountId,
                decisionReason: reason,
                u21Finding: assessment.u21Finding,
                homegrownFinding: assessment.homegrownFinding,
                decisionRegulationVersionId: destRegulation.id,
                officialSnapshot: destSnapshot,
                playingDisposition: 'ACTIVE',
                revision: { increment: 1 },
              },
            });
            await context.db.playerRegistration.update({
              where: { id: existingDestReg.id },
              data: {
                currentValidatedVersionId: existingDestVersion.id,
                currentDraftVersionId: null,
                revision: { increment: 1 },
                updatedAt: now,
              },
            });
          } else {
            await context.db.playerRegistration.create({
              data: {
                id: newCaseId,
                seasonId: destSeasonId,
                clubId: destClubId,
                playerId: oldReg.playerId,
                createdAt: now,
                updatedAt: now,
              },
            });
            await context.db.registrationVersion.create({
              data: {
                id: newVersionId,
                seasonId: destSeasonId,
                caseId: newCaseId,
                versionNumber: 1,
                preparedBy: command.accountId,
                state: 'VALID',
                receivedAt: destReceipt.receivedAt,
                decidedAt: now,
                decidedBy: command.accountId,
                decisionReason: reason,
                shirtNumber: destShirtNumber,
                playingStart: effectiveAt,
                playingEnd: destPlayingEnd,
                u21Finding: assessment.u21Finding,
                homegrownFinding: assessment.homegrownFinding,
                nonHomegrownOptIn: destNonHomegrownOptIn,
                evidenceBranch: destEvidence?.evidenceBranch ?? null,
                qualifyingValue: destEvidence?.qualifyingValue ?? null,
                evidenceSummary: destEvidence?.evidenceSummary ?? null,
                evidenceReference: destEvidence?.evidenceReference ?? null,
                affiliatedAssociationBasis: destEvidence?.affiliatedAssociationBasis ?? null,
                verifiedBy: destEvidence?.verifiedBy ?? null,
                verifiedAt: destEvidence?.verifiedAt ?? null,
                receiptRegulationVersionId: destReceipt.receiptRegulationVersionId,
                receiptTimingStatus: destReceipt.receiptTimingStatus,
                receiptWindowId: destReceipt.receiptWindowId,
                decisionRegulationVersionId: destRegulation.id,
                officialSnapshot: destSnapshot,
                playingDisposition: 'ACTIVE',
                notes: notes ?? null,
                createdAt: now,
              },
            });
            await context.db.playerRegistration.update({
              where: { id: newCaseId },
              data: { currentValidatedVersionId: newVersionId, updatedAt: now },
            });
          }

          await context.db.transferOperation.create({
            data: {
              id: transferOperationId,
              playerId: oldReg.playerId,
              oldCaseId: oldReg.id,
              newCaseId,
              oldBeforeVersionId: oldVersion.id,
              oldAfterVersionId,
              newVersionId,
              effectiveAt,
              operationKind: 'TRANSFER',
              reason,
              actorId: command.accountId,
              createdAt: now,
            },
          });

          await this.audit.append(context, {
            action: 'PLAYER_TRANSFER_EXECUTED',
            actor: { kind: 'ACCOUNT', accountId: command.accountId },
            objectKind: 'PlayerRegistration',
            objectId: oldReg.id,
            seasonId: oldReg.seasonId,
            outcome: 'SUCCESS',
            reason,
            before: {
              caseId: oldReg.id,
              versionId: oldVersion.id,
              versionNumber: oldVersion.versionNumber,
              playingStart: oldVersion.playingStart.toISOString(),
              playingEnd: oldVersion.playingEnd?.toISOString() ?? null,
            },
            after: {
              caseId: oldReg.id,
              clubId: oldReg.clubId,
              playerId: oldReg.playerId,
              versionId: oldAfterVersionId,
              versionNumber: oldAfterVersionNumber,
              predecessorVersionId: oldVersion.id,
              counterpartCaseId: newCaseId,
              counterpartClubId: destClubId,
              counterpartSeasonId: destSeasonId,
              transferOperationId,
              role: 'SOURCE',
              shirtNumber: oldVersion.shirtNumber,
              playingStart: oldVersion.playingStart.toISOString(),
              playingEnd: effectiveAt.toISOString(),
              effectiveAt: effectiveAt.toISOString(),
              decidedAt: now.toISOString(),
              playingDisposition: 'ACTIVE',
            },
          });

          await this.audit.append(context, {
            action: 'PLAYER_TRANSFER_EXECUTED',
            actor: { kind: 'ACCOUNT', accountId: command.accountId },
            objectKind: 'PlayerRegistration',
            objectId: newCaseId,
            seasonId: destSeasonId,
            outcome: 'SUCCESS',
            reason,
            before: {
              caseId: newCaseId,
              versionId: existingDestVersion?.id ?? null,
              versionNumber: existingDestVersion?.versionNumber ?? 0,
              playingStart: existingDestVersion?.playingStart?.toISOString() ?? null,
              playingEnd: existingDestVersion?.playingEnd?.toISOString() ?? null,
            },
            after: {
              caseId: newCaseId,
              clubId: destClubId,
              playerId: oldReg.playerId,
              versionId: newVersionId,
              versionNumber: newVersionNumber,
              counterpartCaseId: oldReg.id,
              counterpartClubId: oldReg.clubId,
              counterpartSeasonId: oldReg.seasonId,
              transferOperationId,
              role: 'DESTINATION',
              shirtNumber: destShirtNumber,
              playingStart: effectiveAt.toISOString(),
              playingEnd: destPlayingEnd?.toISOString() ?? null,
              effectiveAt: effectiveAt.toISOString(),
              decidedAt: now.toISOString(),
              decisionRegulationVersionId: destRegulation.id,
              playingDisposition: 'ACTIVE',
            },
          });

          return {
            status: 200,
            data: {
              id: oldReg.id,
              revision: oldAfterCreated.revision.toString(),
              relatedId: transferOperationId,
            },
          };
        },
        async (context, outcome) => {
          const op = await context.db.transferOperation.findUnique({
            where: { id: outcome.data.relatedId! },
            select: {
              id: true,
              oldCaseId: true,
              oldBeforeVersionId: true,
              oldAfterVersionId: true,
              newCaseId: true,
              newVersionId: true,
              effectiveAt: true,
              operationKind: true,
            },
          });
          if (op) {
            transferSummary = {
              transferOperationId: op.id,
              oldCaseId: op.oldCaseId,
              oldBeforeVersionId: op.oldBeforeVersionId,
              oldAfterVersionId: op.oldAfterVersionId,
              newCaseId: op.newCaseId,
              newVersionId: op.newVersionId,
              effectiveAt: op.effectiveAt.toISOString(),
              operationKind: op.operationKind,
            };
          }
          return outcome;
        },
      );

      return {
        ...critical.data,
        ...(transferSummary ?? { transferOperationId: critical.data.relatedId }),
      };
    } catch (error) {
      concealMissingPlanResource(error);
    }
  }

  async planChange(request: Request, caseId: string, input: ChangeRegistrationPlanDto) {
    const versionId = input.versionId.toLowerCase();
    const expectedRevision = input.expectedRevision;
    const requestedOpId = input.transferOperationId?.toLowerCase() ?? null;
    const reason = requiredBoundedText(
      input.reason,
      2000,
      'Vui lòng nhập lý do điều chỉnh kế hoạch tương lai.',
    );
    const requestedStart = parseOptionalInstant(
      input.playingStart,
      'Thời điểm bắt đầu hiệu lực mới',
    );
    const requestedEnd = parseOptionalInstant(input.playingEnd, 'Thời điểm kết thúc hiệu lực mới');

    if (
      requestedStart === undefined &&
      requestedEnd === undefined &&
      input.shirtNumber === undefined
    ) {
      throw invalid(
        'Vui lòng thay đổi ít nhất một thông tin (thời điểm hiệu lực hoặc số áo) khi điều chỉnh kế hoạch.',
      );
    }
    if (
      input.shirtNumber !== undefined &&
      input.shirtNumber !== null &&
      !isValidShirtNumber(input.shirtNumber)
    ) {
      throw invalid('Số áo đăng ký phải là số nguyên từ 1 đến 99.');
    }

    const playingEndMode =
      requestedEnd === undefined ? 'KEEP' : requestedEnd === null ? 'CLEAR' : 'SET';

    let changeSummary: PlanChangeSummary | undefined;

    try {
      const critical = await this.execution.executeCritical(
        request,
        {
          locks: [
            { kind: 'playerRegistration', key: caseId, mode: 'exclusive' },
            { kind: 'registrationVersion', key: versionId, mode: 'exclusive' },
          ],
          discover: (db) => this.discoverPairedPlanLocks(db, caseId, requestedOpId),
          authorize: (context, accountId) =>
            this.authorizePairedPlanMutation(context, accountId, caseId, requestedOpId, {
              actionCode: 'PLAYER_REGISTRATION_PLAN_CHANGED',
              requestKey: request.get('Idempotency-Key') ?? null,
            }),
        },
        // Pure caller-input receipt intent so idempotent replay matches even after state advances
        {
          action: 'PLAYER_REGISTRATION_PLAN_CHANGED',
          targetId: caseId,
          payload: {
            expectedRevision,
            versionId,
            playingEndMode,
            reason,
            ...(requestedOpId ? { transferOperationId: requestedOpId } : {}),
            ...(requestedStart ? { playingStart: requestedStart.toISOString() } : {}),
            ...(requestedEnd ? { playingEnd: requestedEnd.toISOString() } : {}),
            ...(input.shirtNumber !== undefined && input.shirtNumber !== null
              ? { shirtNumber: String(input.shirtNumber) }
              : {}),
          },
        },
        async (context, command) => {
          const targetReg = await context.db.playerRegistration.findUnique({
            where: { id: caseId },
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
          });
          if (!targetReg) throw missing();

          const targetVersion = await context.db.registrationVersion.findFirst({
            where: { id: versionId, caseId },
          });
          if (!targetVersion) throw missing();
          assertRevision(targetVersion.revision, expectedRevision);

          if (
            targetReg.currentValidatedVersionId !== targetVersion.id ||
            targetVersion.state !== 'VALID'
          ) {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể điều chỉnh kế hoạch trên phiên bản đăng ký hợp lệ hiện hành.',
            );
          }
          if (
            !targetVersion.playingStart ||
            !isActivePlayingDisposition(targetVersion.playingDisposition)
          ) {
            throw conflict('STATE_CONFLICT', 'Hồ sơ này không còn ở trạng thái kế hoạch hiệu lực.');
          }

          const chain = await resolveActivePairedTransferStrict(context.db, caseId, requestedOpId);
          if (requestedOpId && !chain) {
            throw conflict(
              'STATE_CONFLICT',
              'Không tìm thấy kế hoạch chuyển nhượng tương ứng còn hiệu lực.',
            );
          }

          // --- CASE A: PAIRED PROSPECTIVE TRANSFER PLAN CHANGE ---
          if (chain) {
            const { latest, root } = chain;
            const [oldCase, newCase] = await Promise.all([
              context.db.playerRegistration.findUnique({ where: { id: latest.oldCaseId } }),
              context.db.playerRegistration.findUnique({ where: { id: latest.newCaseId } }),
            ]);
            if (!oldCase || !newCase) throw missing();

            if (
              oldCase.currentValidatedVersionId !== latest.oldAfterVersionId ||
              newCase.currentValidatedVersionId !== latest.newVersionId
            ) {
              throw conflict(
                'STATE_CONFLICT',
                'Một trong hai hồ sơ của kế hoạch chuyển nhượng đã có thay đổi độc lập khác; không thể điều chỉnh cặp chuyển nhượng này.',
              );
            }

            const [oldVer, newVer, rootOldBeforeVer] = await Promise.all([
              context.db.registrationVersion.findUnique({
                where: { id: latest.oldAfterVersionId },
              }),
              context.db.registrationVersion.findUnique({ where: { id: latest.newVersionId } }),
              context.db.registrationVersion.findUnique({ where: { id: root.oldBeforeVersionId } }),
            ]);
            if (
              !oldVer ||
              !newVer ||
              !rootOldBeforeVer ||
              !oldVer.playingStart ||
              !newVer.playingStart
            ) {
              throw missing();
            }

            await requireOpenSeason(context, oldCase.seasonId);
            const { regulation: destReg, resolvedAt: now } =
              await resolveEffectiveRegulationWithInstant(
                context,
                newCase.seasonId,
                this.activation,
              );

            if (now.getTime() >= latest.effectiveAt.getTime()) {
              throw conflict(
                'STATE_CONFLICT',
                'Kế hoạch chuyển nhượng đã đến thời điểm bắt đầu hiệu lực thi đấu; sai sót cần xử lý qua quy trình đính chính hồ sơ.',
              );
            }

            const newEffectiveAt = requestedStart ?? latest.effectiveAt;
            const newDestEnd = requestedEnd !== undefined ? requestedEnd : newVer.playingEnd;
            const newDestShirt =
              input.shirtNumber !== undefined && input.shirtNumber !== null
                ? input.shirtNumber
                : newVer.shirtNumber;

            if (
              newEffectiveAt.getTime() === latest.effectiveAt.getTime() &&
              (newDestEnd?.getTime() ?? null) === (newVer.playingEnd?.getTime() ?? null) &&
              newDestShirt === newVer.shirtNumber
            ) {
              throw invalid('Thông tin điều chỉnh trùng với kế hoạch hiện tại.');
            }
            if (newEffectiveAt.getTime() < now.getTime()) {
              throw planConflict(
                'PLAYING_INTERVAL',
                'BACKDATING_FORBIDDEN',
                'Thời điểm hiệu lực mới của chuyển nhượng không được ở quá khứ.',
              );
            }
            if (newEffectiveAt.getTime() <= oldVer.playingStart.getTime()) {
              throw planConflict(
                'PLAYING_INTERVAL',
                'INVALID_INTERVAL_BOUND',
                'Thời điểm chuyển mới phải lớn hơn thời điểm bắt đầu hiệu lực của đăng ký nguồn.',
              );
            }
            // FR-017: never extend source past its originally confirmed pre-transfer playingEnd
            if (
              rootOldBeforeVer.playingEnd !== null &&
              newEffectiveAt.getTime() > rootOldBeforeVer.playingEnd.getTime()
            ) {
              throw planConflict(
                'PLAYING_INTERVAL',
                'INVALID_INTERVAL_BOUND',
                'Thời điểm chuyển mới không được vượt quá thời điểm kết thúc ban đầu của đăng ký nguồn.',
              );
            }
            if (!isValidPlayingInterval({ start: newEffectiveAt, end: newDestEnd })) {
              throw invalid('Khoảng thời gian hiệu lực mới của đăng ký đích không hợp lệ.');
            }

            // D053 window gate on prospective plan change in destination season
            const timing = this.intake.assessReceiptTiming(
              destReg.registrationWindows,
              'PLAYER_CHANGE',
              now,
            );
            if (timing.receiptTimingStatus !== 'ON_TIME') {
              throw planConflict(
                'RECEIPT_WINDOW',
                'OUTSIDE_WINDOW',
                'Điều chỉnh kế hoạch chuyển nhượng tương lai đang thực hiện ngoài khung thời gian tiếp nhận thay đổi cầu thủ của quy định hiện hành.',
              );
            }

            await assertMastersAvailableForNewUse(context, { clubId: newCase.clubId });

            // Validate OLD side if transfer date moved LATER (extending oldCase's interval)
            if (newEffectiveAt.getTime() > latest.effectiveAt.getTime()) {
              await this.assertExistingRegistrationIntervalValid(context, {
                reg: oldCase,
                version: oldVer,
                proposedStart: oldVer.playingStart,
                proposedEnd: newEffectiveAt,
                proposedShirt: oldVer.shirtNumber,
                excludeRegistrationIds: [oldCase.id, newCase.id],
                contextLabel: 'kéo dài khoảng hiệu lực hồ sơ nguồn khi dời ngày chuyển nhượng',
              });
            }

            const destAssessment = await this.assertDestinationEligibilityForPlan(context, {
              reg: newCase,
              version: newVer,
              player: targetReg.player,
              regulation: destReg,
              playingStart: newEffectiveAt,
              playingEnd: newDestEnd,
              shirtNumber: newDestShirt,
              timing,
              now,
              projectedIntervalOverride: {
                registrationId: oldCase.id,
                playingStart: oldVer.playingStart,
                playingEnd: newEffectiveAt,
              },
            });

            const [oldMax, newMax] = await Promise.all([
              context.db.registrationVersion.findFirst({
                where: { caseId: oldCase.id },
                orderBy: { versionNumber: 'desc' },
                select: { versionNumber: true },
              }),
              context.db.registrationVersion.findFirst({
                where: { caseId: newCase.id },
                orderBy: { versionNumber: 'desc' },
                select: { versionNumber: true },
              }),
            ]);

            const nextOldVerNum = (oldMax?.versionNumber ?? oldVer.versionNumber) + 1;
            const nextNewVerNum = (newMax?.versionNumber ?? newVer.versionNumber) + 1;
            const nextOldVerId = randomUUID();
            const nextNewVerId = randomUUID();
            const nextOpId = randomUUID();

            const createdOld = await createSuccessorRegistrationVersion(context, oldVer, {
              id: nextOldVerId,
              versionNumber: nextOldVerNum,
              actorId: command.accountId,
              now,
              reason,
              playingStart: oldVer.playingStart,
              playingEnd: newEffectiveAt,
              playingDisposition: 'ACTIVE',
              planEvent: {
                kind: 'TRANSFER_PLAN_CHANGE_SOURCE',
                transferOperationId: nextOpId,
                supersedesOperationId: latest.id,
                effectiveAt: newEffectiveAt.toISOString(),
                reason,
              },
            });

            const createdNew = await createSuccessorRegistrationVersion(context, newVer, {
              id: nextNewVerId,
              versionNumber: nextNewVerNum,
              actorId: command.accountId,
              now,
              reason,
              playingStart: newEffectiveAt,
              playingEnd: newDestEnd,
              shirtNumber: newDestShirt,
              u21Finding: destAssessment.u21Finding,
              homegrownFinding: destAssessment.homegrownFinding,
              receivedAt: now,
              receiptRegulationVersionId: destReg.id,
              receiptTimingStatus: 'ON_TIME',
              receiptWindowId: timing.receiptWindowId,
              decisionRegulationVersionId: destReg.id,
              playingDisposition: 'ACTIVE',
              revalidatedBasis: {
                receiptRegulationVersionId: destReg.id,
                receiptTimingStatus: 'ON_TIME',
                receiptWindowId: timing.receiptWindowId,
                receiptExceptionVersionId: null,
                decisionRegulationVersionId: destReg.id,
                assessment: destAssessment,
              },
              planEvent: {
                kind: 'TRANSFER_PLAN_CHANGE_DESTINATION',
                transferOperationId: nextOpId,
                supersedesOperationId: latest.id,
                effectiveAt: newEffectiveAt.toISOString(),
                reason,
              },
            });

            await context.db.playerRegistration.update({
              where: { id: oldCase.id },
              data: {
                currentValidatedVersionId: nextOldVerId,
                revision: { increment: 1 },
                updatedAt: now,
              },
            });
            await context.db.playerRegistration.update({
              where: { id: newCase.id },
              data: {
                currentValidatedVersionId: nextNewVerId,
                revision: { increment: 1 },
                updatedAt: now,
              },
            });

            await context.db.transferOperation.create({
              data: {
                id: nextOpId,
                playerId: oldCase.playerId,
                oldCaseId: oldCase.id,
                newCaseId: newCase.id,
                oldBeforeVersionId: oldVer.id,
                oldAfterVersionId: nextOldVerId,
                newVersionId: nextNewVerId,
                effectiveAt: newEffectiveAt,
                operationKind: 'PLAN_CHANGE',
                reason,
                actorId: command.accountId,
                supersedesOperationId: latest.id,
                createdAt: now,
              },
            });

            await this.audit.append(context, {
              action: 'PLAYER_REGISTRATION_PLAN_CHANGED',
              actor: { kind: 'ACCOUNT', accountId: command.accountId },
              objectKind: 'PlayerRegistration',
              objectId: oldCase.id,
              seasonId: oldCase.seasonId,
              outcome: 'SUCCESS',
              reason,
              before: {
                caseId: oldCase.id,
                versionId: oldVer.id,
                versionNumber: oldVer.versionNumber,
                playingStart: oldVer.playingStart.toISOString(),
                playingEnd: oldVer.playingEnd?.toISOString() ?? null,
              },
              after: {
                caseId: oldCase.id,
                clubId: oldCase.clubId,
                playerId: oldCase.playerId,
                versionId: nextOldVerId,
                versionNumber: nextOldVerNum,
                predecessorVersionId: oldVer.id,
                counterpartCaseId: newCase.id,
                transferOperationId: nextOpId,
                playingStart: oldVer.playingStart.toISOString(),
                playingEnd: newEffectiveAt.toISOString(),
                effectiveAt: newEffectiveAt.toISOString(),
                decidedAt: now.toISOString(),
                playingDisposition: 'ACTIVE',
              },
            });

            await this.audit.append(context, {
              action: 'PLAYER_REGISTRATION_PLAN_CHANGED',
              actor: { kind: 'ACCOUNT', accountId: command.accountId },
              objectKind: 'PlayerRegistration',
              objectId: newCase.id,
              seasonId: newCase.seasonId,
              outcome: 'SUCCESS',
              reason,
              before: {
                caseId: newCase.id,
                versionId: newVer.id,
                versionNumber: newVer.versionNumber,
                shirtNumber: newVer.shirtNumber,
                playingStart: newVer.playingStart.toISOString(),
                playingEnd: newVer.playingEnd?.toISOString() ?? null,
              },
              after: {
                caseId: newCase.id,
                clubId: newCase.clubId,
                playerId: newCase.playerId,
                versionId: nextNewVerId,
                versionNumber: nextNewVerNum,
                predecessorVersionId: newVer.id,
                counterpartCaseId: oldCase.id,
                transferOperationId: nextOpId,
                shirtNumber: newDestShirt,
                playingStart: newEffectiveAt.toISOString(),
                playingEnd: newDestEnd?.toISOString() ?? null,
                effectiveAt: newEffectiveAt.toISOString(),
                decidedAt: now.toISOString(),
                decisionRegulationVersionId: destReg.id,
                playingDisposition: 'ACTIVE',
              },
            });

            return {
              status: 200,
              data: {
                id: caseId,
                revision:
                  caseId === newCase.id
                    ? createdNew.revision.toString()
                    : createdOld.revision.toString(),
                relatedId: nextOpId,
              },
            };
          }

          // --- CASE B: STANDALONE PROSPECTIVE REGISTRATION PLAN CHANGE ---
          const { regulation, resolvedAt: now } = await resolveEffectiveRegulationWithInstant(
            context,
            targetReg.seasonId,
            this.activation,
          );
          if (now.getTime() >= targetVersion.playingStart.getTime()) {
            throw planConflict(
              'PLAYING_INTERVAL',
              'ALREADY_EFFECTIVE',
              'Hồ sơ đã bắt đầu hiệu lực thi đấu; không thể thay đổi theo quy trình kế hoạch tương lai.',
            );
          }

          const newStart = requestedStart ?? targetVersion.playingStart;
          const newEnd = requestedEnd !== undefined ? requestedEnd : targetVersion.playingEnd;
          const newShirt =
            input.shirtNumber !== undefined && input.shirtNumber !== null
              ? input.shirtNumber
              : targetVersion.shirtNumber;

          if (
            newStart.getTime() === targetVersion.playingStart.getTime() &&
            (newEnd?.getTime() ?? null) === (targetVersion.playingEnd?.getTime() ?? null) &&
            newShirt === targetVersion.shirtNumber
          ) {
            throw invalid('Thông tin điều chỉnh trùng với kế hoạch hiện tại.');
          }
          if (newStart.getTime() < now.getTime()) {
            throw planConflict(
              'PLAYING_INTERVAL',
              'BACKDATING_FORBIDDEN',
              'Thời điểm bắt đầu hiệu lực mới của kế hoạch không được ở quá khứ.',
            );
          }
          if (!isValidPlayingInterval({ start: newStart, end: newEnd })) {
            throw invalid('Khoảng thời gian hiệu lực mới [bắt đầu, kết thúc) không hợp lệ.');
          }

          const timing = this.intake.assessReceiptTiming(
            regulation.registrationWindows,
            'PLAYER_CHANGE',
            now,
          );
          if (timing.receiptTimingStatus !== 'ON_TIME') {
            throw planConflict(
              'RECEIPT_WINDOW',
              'OUTSIDE_WINDOW',
              'Điều chỉnh kế hoạch đăng ký tương lai đang thực hiện ngoài khung thời gian tiếp nhận thay đổi cầu thủ của quy định hiện hành.',
            );
          }

          await assertMastersAvailableForNewUse(context, { clubId: targetReg.clubId });
          const assessment = await this.assertDestinationEligibilityForPlan(context, {
            reg: targetReg,
            version: targetVersion,
            player: targetReg.player,
            regulation,
            playingStart: newStart,
            playingEnd: newEnd,
            shirtNumber: newShirt,
            timing,
            now,
          });

          const latest = await context.db.registrationVersion.findFirst({
            where: { caseId },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
          });
          const nextVerNum = (latest?.versionNumber ?? targetVersion.versionNumber) + 1;
          const nextVerId = randomUUID();

          const created = await createSuccessorRegistrationVersion(context, targetVersion, {
            id: nextVerId,
            versionNumber: nextVerNum,
            actorId: command.accountId,
            now,
            reason,
            playingStart: newStart,
            playingEnd: newEnd,
            shirtNumber: newShirt,
            u21Finding: assessment.u21Finding,
            homegrownFinding: assessment.homegrownFinding,
            receivedAt: now,
            receiptRegulationVersionId: regulation.id,
            receiptTimingStatus: 'ON_TIME',
            receiptWindowId: timing.receiptWindowId,
            decisionRegulationVersionId: regulation.id,
            playingDisposition: 'ACTIVE',
            revalidatedBasis: {
              receiptRegulationVersionId: regulation.id,
              receiptTimingStatus: 'ON_TIME',
              receiptWindowId: timing.receiptWindowId,
              receiptExceptionVersionId: null,
              decisionRegulationVersionId: regulation.id,
              assessment,
            },
            planEvent: {
              kind: 'STANDALONE_PLAN_CHANGE',
              predecessorVersionId: targetVersion.id,
              reason,
            },
          });

          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: {
              currentValidatedVersionId: nextVerId,
              revision: { increment: 1 },
              updatedAt: now,
            },
          });

          await this.audit.append(context, {
            action: 'PLAYER_REGISTRATION_PLAN_CHANGED',
            actor: { kind: 'ACCOUNT', accountId: command.accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: targetReg.seasonId,
            outcome: 'SUCCESS',
            reason,
            before: {
              caseId,
              versionId: targetVersion.id,
              versionNumber: targetVersion.versionNumber,
              shirtNumber: targetVersion.shirtNumber,
              playingStart: targetVersion.playingStart.toISOString(),
              playingEnd: targetVersion.playingEnd?.toISOString() ?? null,
            },
            after: {
              caseId,
              clubId: targetReg.clubId,
              playerId: targetReg.playerId,
              versionId: nextVerId,
              versionNumber: nextVerNum,
              predecessorVersionId: targetVersion.id,
              shirtNumber: newShirt,
              playingStart: newStart.toISOString(),
              playingEnd: newEnd?.toISOString() ?? null,
              decidedAt: now.toISOString(),
              decisionRegulationVersionId: regulation.id,
              playingDisposition: 'ACTIVE',
            },
          });

          return {
            status: 200,
            data: {
              id: caseId,
              revision: created.revision.toString(),
              relatedId: nextVerId,
            },
          };
        },
        async (context, outcome) => {
          const op = await context.db.transferOperation.findUnique({
            where: { id: outcome.data.relatedId! },
            select: {
              id: true,
              oldCaseId: true,
              oldAfterVersionId: true,
              newCaseId: true,
              newVersionId: true,
              effectiveAt: true,
              operationKind: true,
            },
          });
          if (op) {
            changeSummary = {
              paired: true,
              transferOperationId: op.id,
              oldCaseId: op.oldCaseId,
              oldAfterVersionId: op.oldAfterVersionId,
              newCaseId: op.newCaseId,
              newVersionId: op.newVersionId,
              effectiveAt: op.effectiveAt.toISOString(),
              operationKind: op.operationKind,
            };
          } else {
            const v = await context.db.registrationVersion.findUnique({
              where: { id: outcome.data.relatedId! },
              select: {
                id: true,
                versionNumber: true,
                revision: true,
                shirtNumber: true,
                playingStart: true,
                playingEnd: true,
                playingDisposition: true,
              },
            });
            if (v) {
              changeSummary = {
                paired: false,
                caseId,
                versionId: v.id,
                versionNumber: v.versionNumber,
                revision: v.revision.toString(),
                shirtNumber: v.shirtNumber,
                playingStart: v.playingStart?.toISOString() ?? null,
                playingEnd: v.playingEnd?.toISOString() ?? null,
                playingDisposition: v.playingDisposition,
              };
            }
          }
          return outcome;
        },
      );

      return { ...critical.data, ...(changeSummary ?? {}) };
    } catch (error) {
      concealMissingPlanResource(error);
    }
  }

  async planCancel(request: Request, caseId: string, input: CancelRegistrationPlanDto) {
    const versionId = input.versionId.toLowerCase();
    const expectedRevision = input.expectedRevision;
    const requestedOpId = input.transferOperationId?.toLowerCase() ?? null;
    const reason = requiredBoundedText(
      input.reason,
      2000,
      'Vui lòng nhập lý do hủy kế hoạch trước hiệu lực thi đấu.',
    );

    let cancelSummary: PlanCancelSummary | undefined;

    try {
      const critical = await this.execution.executeCritical(
        request,
        {
          locks: [
            { kind: 'playerRegistration', key: caseId, mode: 'exclusive' },
            { kind: 'registrationVersion', key: versionId, mode: 'exclusive' },
          ],
          discover: (db) => this.discoverPairedPlanLocks(db, caseId, requestedOpId),
          authorize: (context, accountId) =>
            this.authorizePairedPlanMutation(context, accountId, caseId, requestedOpId, {
              actionCode: 'PLAYER_REGISTRATION_PLAN_CANCELLED',
              requestKey: request.get('Idempotency-Key') ?? null,
            }),
        },
        // Pure caller-input receipt intent so idempotent replay matches even after state advances
        {
          action: 'PLAYER_REGISTRATION_PLAN_CANCELLED',
          targetId: caseId,
          payload: {
            expectedRevision,
            versionId,
            reason,
            ...(requestedOpId ? { transferOperationId: requestedOpId } : {}),
          },
        },
        async (context, command) => {
          const targetReg = await context.db.playerRegistration.findUnique({
            where: { id: caseId },
          });
          if (!targetReg) throw missing();

          const targetVersion = await context.db.registrationVersion.findFirst({
            where: { id: versionId, caseId },
          });
          if (!targetVersion) throw missing();
          assertRevision(targetVersion.revision, expectedRevision);

          if (
            targetReg.currentValidatedVersionId !== targetVersion.id ||
            targetVersion.state !== 'VALID'
          ) {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể hủy kế hoạch trên phiên bản đăng ký hợp lệ hiện hành.',
            );
          }
          if (
            !targetVersion.playingStart ||
            !isActivePlayingDisposition(targetVersion.playingDisposition)
          ) {
            throw conflict(
              'STATE_CONFLICT',
              'Kế hoạch đăng ký này đã bị hủy hoặc không còn hiệu lực.',
            );
          }

          const chain = await resolveActivePairedTransferStrict(context.db, caseId, requestedOpId);
          if (requestedOpId && !chain) {
            throw conflict(
              'STATE_CONFLICT',
              'Không tìm thấy kế hoạch chuyển nhượng tương ứng để hủy.',
            );
          }

          // --- CASE A: PAIRED PROSPECTIVE TRANSFER CANCELLATION WITH RESTORATION VALIDATION ---
          if (chain) {
            const { latest, root } = chain;
            const [oldCase, newCase] = await Promise.all([
              context.db.playerRegistration.findUnique({ where: { id: latest.oldCaseId } }),
              context.db.playerRegistration.findUnique({ where: { id: latest.newCaseId } }),
            ]);
            if (!oldCase || !newCase) throw missing();

            await requireOpenSeason(context, oldCase.seasonId);
            await requireOpenSeason(context, newCase.seasonId);

            if (
              oldCase.currentValidatedVersionId !== latest.oldAfterVersionId ||
              newCase.currentValidatedVersionId !== latest.newVersionId
            ) {
              throw planConflict(
                'DEPENDENT_PLAN',
                'CONFLICT_DEPENDENCY',
                'Không thể hủy chuyển nhượng vì một trong hai hồ sơ đã phát sinh phiên bản hoặc kế hoạch phụ thuộc khác; cần xử lý bản ghi phụ thuộc trước.',
              );
            }

            const [oldAfterVer, newVer, rootOldBeforeVer] = await Promise.all([
              context.db.registrationVersion.findUnique({
                where: { id: latest.oldAfterVersionId },
              }),
              context.db.registrationVersion.findUnique({ where: { id: latest.newVersionId } }),
              context.db.registrationVersion.findUnique({ where: { id: root.oldBeforeVersionId } }),
            ]);
            if (
              !oldAfterVer ||
              !newVer ||
              !rootOldBeforeVer ||
              !oldAfterVer.playingStart ||
              !newVer.playingStart
            ) {
              throw missing();
            }

            await context.recheckAuthority();
            const now = await context.now();
            if (now.getTime() >= latest.effectiveAt.getTime()) {
              throw conflict(
                'STATE_CONFLICT',
                'Kế hoạch chuyển nhượng đã bắt đầu hiệu lực thi đấu; không thể hủy theo quy trình kế hoạch tương lai.',
              );
            }

            const restoredEnd = rootOldBeforeVer.playingEnd;
            await this.assertExistingRegistrationIntervalValid(context, {
              reg: oldCase,
              version: oldAfterVer,
              proposedStart: oldAfterVer.playingStart,
              proposedEnd: restoredEnd,
              proposedShirt: oldAfterVer.shirtNumber,
              excludeRegistrationIds: [oldCase.id, newCase.id],
              contextLabel: 'khôi phục thời điểm kết thúc trước chuyển nhượng của hồ sơ nguồn',
            });

            const [oldMax, newMax] = await Promise.all([
              context.db.registrationVersion.findFirst({
                where: { caseId: oldCase.id },
                orderBy: { versionNumber: 'desc' },
                select: { versionNumber: true },
              }),
              context.db.registrationVersion.findFirst({
                where: { caseId: newCase.id },
                orderBy: { versionNumber: 'desc' },
                select: { versionNumber: true },
              }),
            ]);

            const nextOldVerNum = (oldMax?.versionNumber ?? oldAfterVer.versionNumber) + 1;
            const nextNewVerNum = (newMax?.versionNumber ?? newVer.versionNumber) + 1;
            const restoredOldVerId = randomUUID();
            const cancelledNewVerId = randomUUID();
            const cancelOpId = randomUUID();

            const createdOld = await createSuccessorRegistrationVersion(context, oldAfterVer, {
              id: restoredOldVerId,
              versionNumber: nextOldVerNum,
              actorId: command.accountId,
              now,
              reason,
              playingStart: oldAfterVer.playingStart,
              playingEnd: restoredEnd,
              playingDisposition: 'ACTIVE',
              planEvent: {
                kind: 'TRANSFER_PLAN_CANCEL_RESTORED',
                transferOperationId: cancelOpId,
                supersedesOperationId: latest.id,
                restoredPlayingEnd: restoredEnd?.toISOString() ?? null,
                reason,
              },
            });

            const createdNew = await createSuccessorRegistrationVersion(context, newVer, {
              id: cancelledNewVerId,
              versionNumber: nextNewVerNum,
              actorId: command.accountId,
              now,
              reason,
              playingStart: newVer.playingStart,
              playingEnd: newVer.playingEnd,
              playingDisposition: 'CANCELLED_BEFORE_EFFECTIVITY',
              planEvent: {
                kind: 'TRANSFER_PLAN_CANCELLED',
                transferOperationId: cancelOpId,
                supersedesOperationId: latest.id,
                reason,
              },
            });

            await context.db.playerRegistration.update({
              where: { id: oldCase.id },
              data: {
                currentValidatedVersionId: restoredOldVerId,
                revision: { increment: 1 },
                updatedAt: now,
              },
            });
            await context.db.playerRegistration.update({
              where: { id: newCase.id },
              data: {
                currentValidatedVersionId: cancelledNewVerId,
                revision: { increment: 1 },
                updatedAt: now,
              },
            });

            await context.db.transferOperation.create({
              data: {
                id: cancelOpId,
                playerId: oldCase.playerId,
                oldCaseId: oldCase.id,
                newCaseId: newCase.id,
                oldBeforeVersionId: oldAfterVer.id,
                oldAfterVersionId: restoredOldVerId,
                newVersionId: cancelledNewVerId,
                effectiveAt: latest.effectiveAt,
                operationKind: 'PLAN_CANCEL',
                reason,
                actorId: command.accountId,
                supersedesOperationId: latest.id,
                createdAt: now,
              },
            });

            await this.audit.append(context, {
              action: 'PLAYER_REGISTRATION_PLAN_CANCELLED',
              actor: { kind: 'ACCOUNT', accountId: command.accountId },
              objectKind: 'PlayerRegistration',
              objectId: oldCase.id,
              seasonId: oldCase.seasonId,
              outcome: 'SUCCESS',
              reason,
              before: {
                caseId: oldCase.id,
                versionId: oldAfterVer.id,
                versionNumber: oldAfterVer.versionNumber,
                playingStart: oldAfterVer.playingStart.toISOString(),
                playingEnd: oldAfterVer.playingEnd?.toISOString() ?? null,
              },
              after: {
                caseId: oldCase.id,
                clubId: oldCase.clubId,
                playerId: oldCase.playerId,
                versionId: restoredOldVerId,
                versionNumber: nextOldVerNum,
                predecessorVersionId: oldAfterVer.id,
                counterpartCaseId: newCase.id,
                transferOperationId: cancelOpId,
                playingStart: oldAfterVer.playingStart.toISOString(),
                playingEnd: restoredEnd?.toISOString() ?? null,
                effectiveAt: latest.effectiveAt.toISOString(),
                decidedAt: now.toISOString(),
                playingDisposition: 'ACTIVE',
              },
            });

            await this.audit.append(context, {
              action: 'PLAYER_REGISTRATION_PLAN_CANCELLED',
              actor: { kind: 'ACCOUNT', accountId: command.accountId },
              objectKind: 'PlayerRegistration',
              objectId: newCase.id,
              seasonId: newCase.seasonId,
              outcome: 'SUCCESS',
              reason,
              before: {
                caseId: newCase.id,
                versionId: newVer.id,
                versionNumber: newVer.versionNumber,
                playingStart: newVer.playingStart.toISOString(),
                playingEnd: newVer.playingEnd?.toISOString() ?? null,
                playingDisposition: newVer.playingDisposition ?? 'ACTIVE',
              },
              after: {
                caseId: newCase.id,
                clubId: newCase.clubId,
                playerId: newCase.playerId,
                versionId: cancelledNewVerId,
                versionNumber: nextNewVerNum,
                predecessorVersionId: newVer.id,
                counterpartCaseId: oldCase.id,
                transferOperationId: cancelOpId,
                playingStart: newVer.playingStart.toISOString(),
                playingEnd: newVer.playingEnd?.toISOString() ?? null,
                effectiveAt: latest.effectiveAt.toISOString(),
                decidedAt: now.toISOString(),
                playingDisposition: 'CANCELLED_BEFORE_EFFECTIVITY',
              },
            });

            return {
              status: 200,
              data: {
                id: caseId,
                revision:
                  caseId === newCase.id
                    ? createdNew.revision.toString()
                    : createdOld.revision.toString(),
                relatedId: cancelOpId,
              },
            };
          }

          // --- CASE B: STANDALONE PROSPECTIVE REGISTRATION PLAN CANCELLATION ---
          await requireOpenSeason(context, targetReg.seasonId);
          await context.recheckAuthority();
          const now = await context.now();
          if (now.getTime() >= targetVersion.playingStart.getTime()) {
            throw conflict(
              'STATE_CONFLICT',
              'Hồ sơ đã bắt đầu hiệu lực thi đấu; không thể hủy theo quy trình kế hoạch tương lai.',
            );
          }

          const latest = await context.db.registrationVersion.findFirst({
            where: { caseId },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
          });
          const nextVerNum = (latest?.versionNumber ?? targetVersion.versionNumber) + 1;
          const nextVerId = randomUUID();

          const created = await createSuccessorRegistrationVersion(context, targetVersion, {
            id: nextVerId,
            versionNumber: nextVerNum,
            actorId: command.accountId,
            now,
            reason,
            playingStart: targetVersion.playingStart,
            playingEnd: targetVersion.playingEnd,
            playingDisposition: 'CANCELLED_BEFORE_EFFECTIVITY',
            planEvent: {
              kind: 'STANDALONE_PLAN_CANCELLED',
              predecessorVersionId: targetVersion.id,
              reason,
            },
          });

          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: {
              currentValidatedVersionId: nextVerId,
              revision: { increment: 1 },
              updatedAt: now,
            },
          });

          await this.audit.append(context, {
            action: 'PLAYER_REGISTRATION_PLAN_CANCELLED',
            actor: { kind: 'ACCOUNT', accountId: command.accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: targetReg.seasonId,
            outcome: 'SUCCESS',
            reason,
            before: {
              caseId,
              versionId: targetVersion.id,
              versionNumber: targetVersion.versionNumber,
              playingStart: targetVersion.playingStart.toISOString(),
              playingEnd: targetVersion.playingEnd?.toISOString() ?? null,
              playingDisposition: targetVersion.playingDisposition ?? 'ACTIVE',
            },
            after: {
              caseId,
              clubId: targetReg.clubId,
              playerId: targetReg.playerId,
              versionId: nextVerId,
              versionNumber: nextVerNum,
              predecessorVersionId: targetVersion.id,
              playingStart: targetVersion.playingStart.toISOString(),
              playingEnd: targetVersion.playingEnd?.toISOString() ?? null,
              decidedAt: now.toISOString(),
              playingDisposition: 'CANCELLED_BEFORE_EFFECTIVITY',
            },
          });

          return {
            status: 200,
            data: {
              id: caseId,
              revision: created.revision.toString(),
              relatedId: nextVerId,
            },
          };
        },
        async (context, outcome) => {
          const op = await context.db.transferOperation.findUnique({
            where: { id: outcome.data.relatedId! },
            select: {
              id: true,
              oldCaseId: true,
              oldAfterVersionId: true,
              newCaseId: true,
              newVersionId: true,
              effectiveAt: true,
              operationKind: true,
            },
          });
          if (op) {
            cancelSummary = {
              paired: true,
              transferOperationId: op.id,
              oldCaseId: op.oldCaseId,
              restoredOldVersionId: op.oldAfterVersionId,
              newCaseId: op.newCaseId,
              cancelledNewVersionId: op.newVersionId,
              effectiveAt: op.effectiveAt.toISOString(),
              operationKind: op.operationKind,
              playingDisposition: 'CANCELLED_BEFORE_EFFECTIVITY',
            };
          } else {
            const v = await context.db.registrationVersion.findUnique({
              where: { id: outcome.data.relatedId! },
              select: {
                id: true,
                versionNumber: true,
                revision: true,
                playingStart: true,
                playingEnd: true,
                playingDisposition: true,
              },
            });
            if (v) {
              cancelSummary = {
                paired: false,
                caseId,
                versionId: v.id,
                versionNumber: v.versionNumber,
                revision: v.revision.toString(),
                playingStart: v.playingStart?.toISOString() ?? null,
                playingEnd: v.playingEnd?.toISOString() ?? null,
                playingDisposition: v.playingDisposition,
              };
            }
          }
          return outcome;
        },
      );

      return { ...critical.data, ...(cancelSummary ?? {}) };
    } catch (error) {
      concealMissingPlanResource(error);
    }
  }

  /**
   * Validates restoring or extending an existing validated registration interval [proposedStart, proposedEnd)
   * against competition-wide player overlap, club-season shirt conflicts, and club-season quota sweep.
   * Rejects missing classification/rule bases and structured conflict dependencies without cascading.
   */
  private async assertExistingRegistrationIntervalValid(
    context: TransactionContext,
    params: {
      reg: { id: string; seasonId: string; clubId: string; playerId: string };
      version: {
        shirtNumber: number | null;
        u21Finding: boolean | null;
        homegrownFinding: boolean | null;
      };
      proposedStart: Date;
      proposedEnd: Date | null;
      proposedShirt: number | null;
      excludeRegistrationIds: readonly string[];
      contextLabel: string;
    },
  ): Promise<void> {
    if (!isValidPlayingInterval({ start: params.proposedStart, end: params.proposedEnd })) {
      throw conflict('STATE_CONFLICT', `Khoảng thời gian khi ${params.contextLabel} không hợp lệ.`);
    }

    const { regulation } = await resolveEffectiveRegulationWithInstant(
      context,
      params.reg.seasonId,
      this.activation,
    );
    const intervals = await loadCompetitionAndClubIntervals(context.db, {
      seasonId: params.reg.seasonId,
      clubId: params.reg.clubId,
      playerId: params.reg.playerId,
      excludeRegistrationIds: params.excludeRegistrationIds,
    });

    const details: ApplicationErrorDetail[] = [];

    const playerConflicts = findPlayerOverlapConflicts(
      {
        playerId: params.reg.playerId,
        seasonId: params.reg.seasonId,
        playingStart: params.proposedStart,
        playingEnd: params.proposedEnd,
        excludeRegistrationIds: params.excludeRegistrationIds,
      },
      intervals.existingPlayerIntervals,
    );
    const shirtConflicts = isValidShirtNumber(params.proposedShirt)
      ? findShirtNumberConflicts(
          {
            seasonId: params.reg.seasonId,
            clubId: params.reg.clubId,
            shirtNumber: params.proposedShirt,
            playingStart: params.proposedStart,
            playingEnd: params.proposedEnd,
            excludeRegistrationIds: params.excludeRegistrationIds,
          },
          intervals.existingClubSeasonIntervals,
        )
      : [];

    const conflictClubIds = [...new Set(playerConflicts.map((c) => c.clubId))];
    const conflictPlayerIds = [...new Set(shirtConflicts.map((c) => c.playerId))];
    const [conflictClubs, conflictPlayers] = await Promise.all([
      conflictClubIds.length
        ? context.db.club.findMany({
            where: { id: { in: conflictClubIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      conflictPlayerIds.length
        ? context.db.player.findMany({
            where: { id: { in: conflictPlayerIds } },
            select: { id: true, fullName: true },
          })
        : Promise.resolve([]),
    ]);
    const clubById = new Map(conflictClubs.map((c) => [c.id, c]));
    const playerById = new Map(conflictPlayers.map((p) => [p.id, p]));

    for (const c of playerConflicts) {
      const club = clubById.get(c.clubId);
      const clubLabel = club ? toSafeErrorText(club.name) : c.clubId;
      details.push({
        field: 'PLAYER_OVERLAP',
        code: 'CONFLICT_DEPENDENCY',
        message: `Chồng lấn với hồ sơ đăng ký tại câu lạc bộ ${clubLabel} kể từ ${c.overlapStart}.`,
      });
    }

    for (const c of shirtConflicts) {
      const player = playerById.get(c.playerId);
      const playerLabel = player ? toSafeErrorText(player.fullName) : c.playerId;
      details.push({
        field: 'SHIRT_NUMBER',
        code: 'CONFLICT_DEPENDENCY',
        message: `Trùng số áo ${c.shirtNumber} với cầu thủ ${playerLabel} kể từ ${c.overlapStart}.`,
      });
    }

    if (params.version.u21Finding === null) {
      details.push({
        field: 'U21_CLASSIFICATION',
        code: 'INSUFFICIENT_BASIS',
        message: 'Hồ sơ nguồn thiếu kết luận phân loại U21 để kiểm tra hạn mức đội hình.',
      });
    } else if (!params.version.u21Finding && params.version.homegrownFinding === null) {
      details.push({
        field: 'HOMEGROWN_VERIFICATION',
        code: 'INSUFFICIENT_BASIS',
        message:
          'Hồ sơ nguồn thiếu kết luận đào tạo nội địa để kiểm tra giới hạn ngoài diện nội địa.',
      });
    } else if (regulation.squadLimit === null || regulation.nonHomegrownLimit === null) {
      details.push({
        field: 'EFFECTIVE_REGULATION',
        code: 'INSUFFICIENT_BASIS',
        message:
          'Quy định mùa giải nguồn thiếu cấu hình giới hạn đội hình hoặc cầu thủ ngoài diện nội địa.',
      });
    } else {
      const sweep = evaluateQuotaAcrossIntervals(
        {
          playingStart: params.proposedStart,
          playingEnd: params.proposedEnd,
          u21: params.version.u21Finding,
          homegrown: params.version.homegrownFinding,
          excludeRegistrationIds: params.excludeRegistrationIds,
        },
        intervals.existingClubSeasonIntervals,
        {
          squadLimit: regulation.squadLimit,
          nonHomegrownLimit: regulation.nonHomegrownLimit,
        },
      );
      if (sweep.unresolvedU21Ids.length > 0 || sweep.unresolvedHomegrownIds.length > 0) {
        details.push({
          field: 'SQUAD_LIMIT',
          code: 'INSUFFICIENT_BASIS',
          message:
            'Tồn tại hồ sơ đăng ký hiện hữu trong câu lạc bộ chưa đủ dữ liệu phân loại để đối chiếu hạn mức.',
        });
      }
      for (const b of sweep.squadBreaches) {
        details.push({
          field: 'SQUAD_LIMIT',
          code: 'CONFLICT_DEPENDENCY',
          message: `Vượt giới hạn đội hình (${b.countedSquadSize} trên tối đa ${b.squadLimit}) từ mốc ${b.startsAt}.`,
        });
      }
      for (const b of sweep.nonHomegrownBreaches) {
        details.push({
          field: 'NON_HOMEGROWN_LIMIT',
          code: 'CONFLICT_DEPENDENCY',
          message: `Vượt giới hạn cầu thủ ngoài diện đào tạo nội địa (${b.nonHomegrownCount} trên tối đa ${b.nonHomegrownLimit}) từ mốc ${b.startsAt}.`,
        });
      }
    }

    if (details.length > 0) {
      throw new ApplicationError(
        409,
        'STATE_CONFLICT',
        `Không thể ${params.contextLabel} do xung đột với hồ sơ đăng ký hoặc hạn mức đã xác nhận khác.`,
        details,
      );
    }
  }

  private async assertDestinationEligibilityForPlan(
    context: TransactionContext,
    params: {
      reg: { id: string; seasonId: string; clubId: string; playerId: string };
      version: Prisma.RegistrationVersionGetPayload<object>;
      player: { id: string; birthDate: Date };
      regulation: DbRegulationRow;
      playingStart: Date;
      playingEnd: Date | null;
      shirtNumber: number | null;
      timing: { receiptTimingStatus: 'ON_TIME' | 'LATE'; receiptWindowId: string | null };
      now: Date;
      projectedIntervalOverride?: {
        registrationId: string;
        playingStart: Date;
        playingEnd: Date | null;
      };
    },
  ): Promise<RegistrationEligibilityAssessment> {
    const [club, clubApp, rawIntervals] = await Promise.all([
      context.db.club.findUnique({
        where: { id: params.reg.clubId },
        select: { id: true, discontinuedAt: true },
      }),
      context.db.clubApplication.findUnique({
        where: { seasonId_clubId: { seasonId: params.reg.seasonId, clubId: params.reg.clubId } },
        select: { id: true, currentAcceptedVersionId: true },
      }),
      loadCompetitionAndClubIntervals(context.db, {
        seasonId: params.reg.seasonId,
        clubId: params.reg.clubId,
        playerId: params.reg.playerId,
        excludeRegistrationIds: [params.reg.id],
      }),
    ]);

    const projectedPlayerIntervals = params.projectedIntervalOverride
      ? rawIntervals.existingPlayerIntervals.map((row) =>
          row.registrationId === params.projectedIntervalOverride!.registrationId
            ? {
                ...row,
                playingStart: params.projectedIntervalOverride!.playingStart,
                playingEnd: params.projectedIntervalOverride!.playingEnd,
              }
            : row,
        )
      : rawIntervals.existingPlayerIntervals;

    const hasEvidence =
      params.version.evidenceBranch !== null ||
      params.version.qualifyingValue !== null ||
      !!params.version.evidenceSummary ||
      !!params.version.evidenceReference ||
      params.version.affiliatedAssociationBasis !== null;

    const assessment = assessRegistrationEligibility({
      mode: 'CONFIRMATION',
      seasonId: params.reg.seasonId,
      clubId: params.reg.clubId,
      playerId: params.reg.playerId,
      regulation: toRegulationBasis(params.regulation),
      clubParticipation: {
        clubExists: !!club,
        hasApprovedApplication: !!clubApp?.currentAcceptedVersionId,
        acceptedApplicationVersionId: clubApp?.currentAcceptedVersionId ?? null,
        clubDiscontinued: !!club && club.discontinuedAt !== null,
      },
      receipt: {
        receivedAt: params.now,
        receiptTimingStatus: params.timing.receiptTimingStatus,
        receiptRegulationVersionId: params.regulation.id,
        receiptWindowId: params.timing.receiptWindowId,
        approvedExceptionVersionId: null,
      },
      player: {
        id: params.player.id,
        birthDateIso: formatDateOnly(params.player.birthDate),
      },
      candidate: {
        registrationId: params.reg.id,
        shirtNumber: params.shirtNumber,
        playingStart: params.playingStart,
        playingEnd: params.playingEnd,
        nonHomegrownOptIn: params.version.nonHomegrownOptIn,
        homegrownEvidence: hasEvidence
          ? {
              evidenceBranch: params.version.evidenceBranch as HomegrownEvidenceBranch | null,
              qualifyingValue: params.version.qualifyingValue,
              evidenceSummary: params.version.evidenceSummary,
              evidenceReference: params.version.evidenceReference,
              affiliatedAssociationBasis: params.version.affiliatedAssociationBasis,
              verifiedBy: params.version.verifiedBy,
              verifiedAt: params.version.verifiedAt,
              verifiedRegulationVersionId:
                params.version.decisionRegulationVersionId ?? params.regulation.id,
            }
          : null,
      },
      existingPlayerIntervals: projectedPlayerIntervals,
      existingClubSeasonIntervals: rawIntervals.existingClubSeasonIntervals,
    });

    if (!assessment.eligibleForConfirmation) {
      throw buildEligibilityRejectionError(assessment);
    }
    return assessment;
  }
}
