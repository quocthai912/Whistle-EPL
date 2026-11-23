import { randomUUID } from 'node:crypto';
import { isISO8601 } from 'class-validator';
import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import type { Prisma } from '../generated/prisma/client';
import { assertRevision, conflict, invalid, missing } from '../identity-access/accounts.dto';
import { hasSeasonRole } from '../identity-access/authority.policy';
import { ApplicationError } from '../platform/application-error';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import {
  MissingLockResource,
  type LockResource,
  type TransactionContext,
} from '../platform/transaction-context';
import type { RegulationActivationService } from '../season-regulations/regulation-activation.service';
import {
  normalizeDeclaredReferences,
  type NormalizedDeclaredReference,
} from './club-application-corrections.service';
import {
  assessRegistrationEligibility,
  type EligibilityCriterionFinding,
  type EligibilityRegulationBasis,
  type HomegrownEvidenceBranch,
  type HomegrownEvidenceInput,
  type RegistrationEligibilityAssessment,
} from './registration-eligibility';
import {
  assertIndependentApprover,
  discoverSeasonWithDueRules,
  requireOpenSeason,
  requireSeasonManager,
  requireSeasonRegistrationOfficer,
  requireSeasonRegistrationReader,
  resolveEffectiveRegulationWithInstant,
} from './registration-execution';
import type { RegistrationIntakeService } from './registration-intake.service';
import {
  isValidPlayingInterval,
  isValidShirtNumber,
  loadCompetitionAndClubIntervals,
  type ExistingRegistrationInterval,
} from './registration-intervals';
import type {
  ProposeRegistrationCorrectionDto,
  RegistrationCorrectionActionDto,
  RegistrationCorrectionDisposition,
  UpdateRegistrationCorrectionDraftDto,
} from './registration-corrections.dto';
import {
  formatDateOnly,
  optionalBoundedText,
  requiredBoundedText,
} from './registration-validation';

const OPEN_CORRECTION_STATES = new Set(['DRAFT', 'SUBMITTED']);
const D057_ACTIONS = ['submit', 'approve', 'return', 'reject', 'withdraw', 'cancel'] as const;
type D057Action = (typeof D057_ACTIONS)[number];

const STRICT_ISO_INSTANT =
  /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):?[0-5]\d)$/i;

type HistoricalRegulationRow = {
  id: string;
  seasonId: string;
  versionNumber: number;
  state: string;
  activeFrom: Date | null;
  activeUntil: Date | null;
  squadLimit: number | null;
  nonHomegrownLimit: number | null;
  homegrownSeasons: number | null;
  homegrownMonths: number | null;
  homegrownAgeStart: number | null;
  homegrownAgeEnd: number | null;
  u21Cutoff: Date | null;
};

export type EvaluatedHistoricalSegment = {
  segmentOrder: number;
  segmentStart: Date;
  segmentEnd: Date | null;
  regulationVersionId: string;
  regulationVersionNumber: number;
  outcome: 'MET' | 'UNMET' | 'INSUFFICIENT_BASIS';
  requiredDisposition: RegistrationCorrectionDisposition | null;
  findings: {
    u21Finding: boolean | null;
    homegrownFinding: boolean | null;
    squadLimit: number | null;
    nonHomegrownLimit: number | null;
    criteria: EligibilityCriterionFinding[];
    blockingCriteria: EligibilityCriterionFinding[];
  };
};

export type StoredRegistrationAffectedReferences = {
  declared: NormalizedDeclaredReference[];
  uc19MatchReviewRequired: boolean;
  pendingSourceCorrection: {
    required: boolean;
    snapshotBirthDate: string | null;
    currentPlayerBirthDate: string;
  };
};

export type NormalizedRegistrationCorrectionFields = {
  shirtNumber?: number;
  playingStart?: Date;
  playingEnd?: Date | null;
  nonHomegrownOptIn?: boolean;
  evidenceBranch?: HomegrownEvidenceBranch | null;
  qualifyingValue?: number | null;
  evidenceSummary?: string | null;
  evidenceReference?: string | null;
  affiliatedAssociationBasis?: boolean | null;
  verifiedRegulationVersionId?: string | null;
  notes?: string | null;
};

export type MergedRegistrationCorrectionCandidate = {
  shirtNumber: number;
  playingStart: Date;
  playingEnd: Date | null;
  nonHomegrownOptIn: boolean;
  evidenceBranch: HomegrownEvidenceBranch | null;
  qualifyingValue: number | null;
  evidenceSummary: string | null;
  evidenceReference: string | null;
  affiliatedAssociationBasis: boolean | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  verifiedRegulationVersionId: string | null;
  notes: string | null;
};

function concealMissingRegistrationCorrection(error: unknown): never {
  if (
    error instanceof MissingLockResource &&
    [
      'season',
      'player',
      'club',
      'playerRegistration',
      'registrationVersion',
      'registrationCorrectionCase',
      'registrationCorrectionVersion',
    ].includes(error.kind)
  ) {
    throw missing();
  }
  throw error;
}

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

export function normalizeRegistrationCorrectionFields(input: {
  shirtNumber?: number | null;
  playingStart?: string | null;
  playingEnd?: string | null;
  nonHomegrownOptIn?: boolean;
  evidenceBranch?: 'SEASONS' | 'MONTHS' | null;
  qualifyingValue?: number | null;
  evidenceSummary?: string | null;
  evidenceReference?: string | null;
  affiliatedAssociationBasis?: boolean | null;
  verifiedRegulationVersionId?: string | null;
  notes?: string | null;
}): NormalizedRegistrationCorrectionFields {
  if (input.shirtNumber !== undefined) {
    if (input.shirtNumber === null || !isValidShirtNumber(input.shirtNumber)) {
      throw invalid('Số áo đăng ký phải là số nguyên từ 1 đến 99.');
    }
  }
  const playingStart = parseOptionalInstant(input.playingStart, 'Thời điểm bắt đầu hiệu lực');
  if (input.playingStart !== undefined && !playingStart) {
    throw invalid('Thời điểm bắt đầu hiệu lực thi đấu không được để trống.');
  }
  const playingEnd = parseOptionalInstant(input.playingEnd, 'Thời điểm kết thúc hiệu lực');

  const evidenceSummary =
    input.evidenceSummary === undefined
      ? undefined
      : input.evidenceSummary === null
        ? null
        : (optionalBoundedText(input.evidenceSummary, 2000) ?? null);
  const evidenceReference =
    input.evidenceReference === undefined
      ? undefined
      : input.evidenceReference === null
        ? null
        : (optionalBoundedText(input.evidenceReference, 500) ?? null);
  const notes =
    input.notes === undefined
      ? undefined
      : input.notes === null
        ? null
        : (optionalBoundedText(input.notes, 2000) ?? null);
  const verifiedRegulationVersionId =
    input.verifiedRegulationVersionId === undefined
      ? undefined
      : input.verifiedRegulationVersionId === null
        ? null
        : input.verifiedRegulationVersionId.toLowerCase();

  return {
    ...(input.shirtNumber !== undefined ? { shirtNumber: input.shirtNumber } : {}),
    ...(playingStart !== undefined && playingStart !== null ? { playingStart } : {}),
    ...(playingEnd !== undefined ? { playingEnd } : {}),
    ...(input.nonHomegrownOptIn !== undefined
      ? { nonHomegrownOptIn: input.nonHomegrownOptIn }
      : {}),
    ...(input.evidenceBranch !== undefined ? { evidenceBranch: input.evidenceBranch } : {}),
    ...(input.qualifyingValue !== undefined ? { qualifyingValue: input.qualifyingValue } : {}),
    ...(evidenceSummary !== undefined ? { evidenceSummary } : {}),
    ...(evidenceReference !== undefined ? { evidenceReference } : {}),
    ...(input.affiliatedAssociationBasis !== undefined
      ? { affiliatedAssociationBasis: input.affiliatedAssociationBasis }
      : {}),
    ...(verifiedRegulationVersionId !== undefined ? { verifiedRegulationVersionId } : {}),
    ...(notes !== undefined ? { notes } : {}),
  };
}

function extractSnapshotPlayerBirthDate(officialSnapshot: Prisma.JsonValue | null): string | null {
  if (
    !officialSnapshot ||
    typeof officialSnapshot !== 'object' ||
    Array.isArray(officialSnapshot)
  ) {
    return null;
  }
  const player = (officialSnapshot as { player?: unknown }).player;
  if (!player || typeof player !== 'object' || Array.isArray(player)) {
    return null;
  }
  const birthDate = (player as { birthDate?: unknown }).birthDate;
  return typeof birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? birthDate : null;
}

function toRegulationBasis(row: HistoricalRegulationRow): EligibilityRegulationBasis {
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

function mergeCandidateFields(
  base: {
    shirtNumber: number | null;
    playingStart: Date | null;
    playingEnd: Date | null;
    nonHomegrownOptIn: boolean;
    evidenceBranch: string | null;
    qualifyingValue: number | null;
    evidenceSummary: string | null;
    evidenceReference: string | null;
    affiliatedAssociationBasis: boolean | null;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    decisionRegulationVersionId: string | null;
    notes: string | null;
  },
  updates: NormalizedRegistrationCorrectionFields,
  actorId: string,
  now: Date,
  fallbackRegulationId: string | null,
): MergedRegistrationCorrectionCandidate {
  const shirtNumber = updates.shirtNumber !== undefined ? updates.shirtNumber : base.shirtNumber;
  if (shirtNumber === null || !isValidShirtNumber(shirtNumber)) {
    throw invalid('Phiên bản đính chính phải có số áo hợp lệ từ 1 đến 99.');
  }
  const playingStart =
    updates.playingStart !== undefined ? updates.playingStart : base.playingStart;
  if (!playingStart) {
    throw invalid('Phiên bản đính chính phải có thời điểm bắt đầu hiệu lực thi đấu.');
  }
  const playingEnd = updates.playingEnd !== undefined ? updates.playingEnd : base.playingEnd;
  if (!isValidPlayingInterval({ start: playingStart, end: playingEnd })) {
    throw invalid('Khoảng thời gian hiệu lực thi đấu [bắt đầu, kết thúc) không hợp lệ.');
  }

  const nonHomegrownOptIn =
    updates.nonHomegrownOptIn !== undefined ? updates.nonHomegrownOptIn : base.nonHomegrownOptIn;
  const evidenceBranch =
    updates.evidenceBranch !== undefined
      ? updates.evidenceBranch
      : (base.evidenceBranch as HomegrownEvidenceBranch | null);
  const qualifyingValue =
    updates.qualifyingValue !== undefined ? updates.qualifyingValue : base.qualifyingValue;
  const evidenceSummary =
    updates.evidenceSummary !== undefined ? updates.evidenceSummary : base.evidenceSummary;
  const evidenceReference =
    updates.evidenceReference !== undefined ? updates.evidenceReference : base.evidenceReference;
  const affiliatedAssociationBasis =
    updates.affiliatedAssociationBasis !== undefined
      ? updates.affiliatedAssociationBasis
      : base.affiliatedAssociationBasis;
  const notes = updates.notes !== undefined ? updates.notes : base.notes;

  const hasVerificationEvidence =
    affiliatedAssociationBasis === true ||
    affiliatedAssociationBasis === false ||
    evidenceBranch !== null ||
    qualifyingValue !== null ||
    !!evidenceSummary ||
    !!evidenceReference;

  const evidenceEdited =
    updates.evidenceBranch !== undefined ||
    updates.qualifyingValue !== undefined ||
    updates.evidenceSummary !== undefined ||
    updates.evidenceReference !== undefined ||
    updates.affiliatedAssociationBasis !== undefined ||
    updates.verifiedRegulationVersionId !== undefined;

  const verifiedBy = hasVerificationEvidence
    ? evidenceEdited
      ? actorId
      : (base.verifiedBy ?? actorId)
    : null;
  const verifiedAt = hasVerificationEvidence
    ? evidenceEdited
      ? now
      : (base.verifiedAt ?? now)
    : null;
  const verifiedRegulationVersionId = hasVerificationEvidence
    ? (updates.verifiedRegulationVersionId ??
      base.decisionRegulationVersionId ??
      fallbackRegulationId)
    : null;

  return {
    shirtNumber,
    playingStart,
    playingEnd,
    nonHomegrownOptIn,
    evidenceBranch,
    qualifyingValue,
    evidenceSummary,
    evidenceReference,
    affiliatedAssociationBasis,
    verifiedBy,
    verifiedAt,
    verifiedRegulationVersionId,
    notes,
  };
}

/**
 * Evaluates FR-020 historical regulation segments across [playingStart, playingEnd)
 * strictly by each RegulationVersion's exact [activeFrom, activeUntil) interval
 * (never using delayed activationProcessedAt).
 */
export function evaluateHistoricalCorrectionSegments(params: {
  seasonId: string;
  clubId: string;
  playerId: string;
  registrationId: string;
  playerBirthDateIso: string;
  clubParticipation: {
    clubExists: boolean;
    hasApprovedApplication: boolean;
    acceptedApplicationVersionId: string | null;
    clubDiscontinued: boolean;
  };
  receipt: {
    receivedAt: Date | null;
    receiptTimingStatus: 'ON_TIME' | 'LATE' | null;
    receiptRegulationVersionId: string | null;
    receiptWindowId: string | null;
    approvedExceptionVersionId: string | null;
  };
  candidate: MergedRegistrationCorrectionCandidate;
  disposition: RegistrationCorrectionDisposition;
  regulations: readonly HistoricalRegulationRow[];
  existingPlayerIntervals: readonly ExistingRegistrationInterval[];
  existingClubSeasonIntervals: readonly ExistingRegistrationInterval[];
}): EvaluatedHistoricalSegment[] {
  const { candidate, regulations } = params;
  const activeRegulations = regulations
    .filter((r) => r.activeFrom !== null && ['EFFECTIVE', 'SUPERSEDED'].includes(r.state))
    .sort((a, b) => a.activeFrom!.getTime() - b.activeFrom!.getTime());

  if (activeRegulations.length === 0) {
    throw conflict(
      'STATE_CONFLICT',
      'Mùa giải chưa có phiên bản quy định lịch sử có hiệu lực để đánh giá đính chính hồ sơ đăng ký.',
    );
  }

  const candStartMs = candidate.playingStart.getTime();
  const candEndMs =
    candidate.playingEnd === null ? Number.POSITIVE_INFINITY : candidate.playingEnd.getTime();

  const pointSet = new Set<number>([candStartMs]);
  for (const reg of activeRegulations) {
    const fromMs = reg.activeFrom!.getTime();
    if (fromMs > candStartMs && fromMs < candEndMs) {
      pointSet.add(fromMs);
    }
    if (reg.activeUntil !== null) {
      const untilMs = reg.activeUntil.getTime();
      if (untilMs > candStartMs && untilMs < candEndMs) {
        pointSet.add(untilMs);
      }
    }
  }
  const sortedPoints = [...pointSet].sort((a, b) => a - b);

  const segments: EvaluatedHistoricalSegment[] = [];

  for (let i = 0; i < sortedPoints.length; i++) {
    const segStartMs = sortedPoints[i];
    const nextPointMs = i + 1 < sortedPoints.length ? sortedPoints[i + 1] : null;
    const segEnd =
      nextPointMs !== null
        ? new Date(nextPointMs)
        : candidate.playingEnd !== null
          ? candidate.playingEnd
          : null;
    const segStart = new Date(segStartMs);

    // Find the historical regulation whose exact [activeFrom, activeUntil) covers [segStart, segEnd)
    const coveringReg = activeRegulations.find((reg) => {
      const fromMs = reg.activeFrom!.getTime();
      const untilMs =
        reg.activeUntil === null ? Number.POSITIVE_INFINITY : reg.activeUntil.getTime();
      const targetEndMs = segEnd === null ? Number.POSITIVE_INFINITY : segEnd.getTime();
      return fromMs <= segStartMs && targetEndMs <= untilMs;
    });

    if (!coveringReg) {
      // Missing historical regulation basis for this affected sub-interval!
      const fallbackReg = activeRegulations[0];
      const missingFinding: EligibilityCriterionFinding = {
        criterion: 'EFFECTIVE_REGULATION',
        status: 'INSUFFICIENT_BASIS',
        reason: `Thiếu phiên bản quy định lịch sử có hiệu lực cho phân đoạn từ ${segStart.toISOString()}${segEnd ? ` đến ${segEnd.toISOString()}` : ''}.`,
        regulationVersionId: null,
      };
      segments.push({
        segmentOrder: i + 1,
        segmentStart: segStart,
        segmentEnd: segEnd,
        regulationVersionId: fallbackReg.id,
        regulationVersionNumber: fallbackReg.versionNumber,
        outcome: 'INSUFFICIENT_BASIS',
        requiredDisposition:
          params.disposition !== 'RETAIN_VALID' ? params.disposition : 'END_EFFECTIVITY',
        findings: {
          u21Finding: null,
          homegrownFinding: null,
          squadLimit: null,
          nonHomegrownLimit: null,
          criteria: [missingFinding],
          blockingCriteria: [missingFinding],
        },
      });
      continue;
    }

    const regBasis = toRegulationBasis(coveringReg);
    const homegrownEvidence: HomegrownEvidenceInput | null =
      candidate.evidenceBranch !== null ||
      candidate.qualifyingValue !== null ||
      !!candidate.evidenceSummary ||
      !!candidate.evidenceReference ||
      candidate.affiliatedAssociationBasis !== null
        ? {
            evidenceBranch: candidate.evidenceBranch,
            qualifyingValue: candidate.qualifyingValue,
            evidenceSummary: candidate.evidenceSummary,
            evidenceReference: candidate.evidenceReference,
            affiliatedAssociationBasis: candidate.affiliatedAssociationBasis,
            verifiedBy: candidate.verifiedBy,
            verifiedAt: candidate.verifiedAt,
            // Bind to the segment's regulation version when verified within this season
            verifiedRegulationVersionId: candidate.verifiedRegulationVersionId
              ? coveringReg.id
              : null,
          }
        : null;

    const assessment: RegistrationEligibilityAssessment = assessRegistrationEligibility({
      mode: 'CONFIRMATION',
      seasonId: params.seasonId,
      clubId: params.clubId,
      playerId: params.playerId,
      regulation: regBasis,
      clubParticipation: params.clubParticipation,
      receipt: params.receipt,
      player: {
        id: params.playerId,
        birthDateIso: params.playerBirthDateIso,
      },
      candidate: {
        registrationId: params.registrationId,
        excludeRegistrationIds: [params.registrationId],
        shirtNumber: candidate.shirtNumber,
        playingStart: segStart,
        playingEnd: segEnd,
        nonHomegrownOptIn: candidate.nonHomegrownOptIn,
        homegrownEvidence,
      },
      existingPlayerIntervals: params.existingPlayerIntervals,
      existingClubSeasonIntervals: params.existingClubSeasonIntervals,
    });

    const hasInsufficientBasis = assessment.blockingCriteria.some(
      (c) => c.status === 'INSUFFICIENT_BASIS',
    );
    const outcome: 'MET' | 'UNMET' | 'INSUFFICIENT_BASIS' = assessment.eligibleForConfirmation
      ? 'MET'
      : hasInsufficientBasis
        ? 'INSUFFICIENT_BASIS'
        : 'UNMET';

    const requiredDisposition: RegistrationCorrectionDisposition | null =
      outcome === 'MET'
        ? null
        : params.disposition !== 'RETAIN_VALID'
          ? params.disposition
          : 'END_EFFECTIVITY';

    segments.push({
      segmentOrder: i + 1,
      segmentStart: segStart,
      segmentEnd: segEnd,
      regulationVersionId: coveringReg.id,
      regulationVersionNumber: coveringReg.versionNumber,
      outcome,
      requiredDisposition,
      findings: {
        u21Finding: assessment.u21Finding,
        homegrownFinding: assessment.homegrownFinding,
        squadLimit: assessment.squadLimit,
        nonHomegrownLimit: assessment.nonHomegrownLimit,
        criteria: assessment.criteria,
        blockingCriteria: assessment.blockingCriteria,
      },
    });
  }

  return segments;
}

function buildCorrectionSummary(params: {
  versionId: string;
  versionNumber: number;
  shirtNumber: number | null;
  playingStart: Date | null;
  playingEnd: Date | null;
  playerBirthDateIso: string | null;
  u21Finding: boolean | null;
  homegrownFinding: boolean | null;
  nonHomegrownOptIn: boolean;
  evidenceBranch: string | null;
  qualifyingValue: number | null;
  evidenceSummary: string | null;
  evidenceReference: string | null;
  affiliatedAssociationBasis: boolean | null;
  playingDisposition: string | null;
  notes: string | null;
}): Record<string, unknown> {
  return {
    versionId: params.versionId,
    versionNumber: params.versionNumber,
    shirtNumber: params.shirtNumber,
    playingStart: params.playingStart?.toISOString() ?? null,
    playingEnd: params.playingEnd?.toISOString() ?? null,
    playerBirthDate: params.playerBirthDateIso,
    u21Finding: params.u21Finding,
    homegrownFinding: params.homegrownFinding,
    nonHomegrownOptIn: params.nonHomegrownOptIn,
    evidenceBranch: params.evidenceBranch,
    qualifyingValue: params.qualifyingValue,
    evidenceSummary: params.evidenceSummary,
    evidenceReference: params.evidenceReference,
    affiliatedAssociationBasis: params.affiliatedAssociationBasis,
    playingDisposition: params.playingDisposition,
    notes: params.notes,
  };
}

function deriveProposedPlayingDisposition(
  disposition: RegistrationCorrectionDisposition,
  targetDisposition: string | null,
): string {
  if (disposition === 'RECORD_ERRONEOUS') {
    return 'RECORDED_ERRONEOUS';
  }
  if (disposition === 'END_EFFECTIVITY') {
    return 'ENDED_BY_CORRECTION';
  }
  return targetDisposition ?? 'ACTIVE';
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

export class RegistrationCorrectionsService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly activation: RegulationActivationService,
    private readonly intake: RegistrationIntakeService,
    private readonly audit: AuditWriterService,
  ) {}

  private async evaluateForRegistration(
    context: TransactionContext,
    reg: {
      id: string;
      seasonId: string;
      clubId: string;
      playerId: string;
      club: { id: string; discontinuedAt: Date | null };
      player: { id: string; birthDate: Date };
    },
    targetVersion: Prisma.RegistrationVersionGetPayload<object>,
    candidate: MergedRegistrationCorrectionCandidate,
    disposition: RegistrationCorrectionDisposition,
  ): Promise<{
    segments: EvaluatedHistoricalSegment[];
    u21Finding: boolean | null;
    homegrownFinding: boolean | null;
    approvedExceptionVersionId: string | null;
  }> {
    const [clubApp, regulations, intervals, approvedEx] = await Promise.all([
      context.db.clubApplication.findUnique({
        where: { seasonId_clubId: { seasonId: reg.seasonId, clubId: reg.clubId } },
        select: { id: true, currentAcceptedVersionId: true },
      }),
      context.db.regulationVersion.findMany({
        where: {
          seasonId: reg.seasonId,
          activeFrom: { not: null },
          state: { in: ['EFFECTIVE', 'SUPERSEDED'] },
        },
        orderBy: [{ activeFrom: 'asc' }, { versionNumber: 'asc' }],
        select: {
          id: true,
          seasonId: true,
          versionNumber: true,
          state: true,
          activeFrom: true,
          activeUntil: true,
          squadLimit: true,
          nonHomegrownLimit: true,
          homegrownSeasons: true,
          homegrownMonths: true,
          homegrownAgeStart: true,
          homegrownAgeEnd: true,
          u21Cutoff: true,
        },
      }),
      loadCompetitionAndClubIntervals(context.db, {
        seasonId: reg.seasonId,
        clubId: reg.clubId,
        playerId: reg.playerId,
        excludeRegistrationIds: [reg.id],
      }),
      targetVersion.receiptTimingStatus === 'LATE'
        ? this.intake.findApprovedException(
            context,
            'PLAYER_REGISTRATION',
            reg.seasonId,
            targetVersion.id,
          )
        : Promise.resolve(null),
    ]);

    const playerBirthDateIso = formatDateOnly(reg.player.birthDate);
    const segments = evaluateHistoricalCorrectionSegments({
      seasonId: reg.seasonId,
      clubId: reg.clubId,
      playerId: reg.playerId,
      registrationId: reg.id,
      playerBirthDateIso,
      clubParticipation: {
        clubExists: true,
        hasApprovedApplication: !!clubApp?.currentAcceptedVersionId,
        acceptedApplicationVersionId: clubApp?.currentAcceptedVersionId ?? null,
        clubDiscontinued: reg.club.discontinuedAt !== null,
      },
      receipt: {
        receivedAt: targetVersion.receivedAt,
        receiptTimingStatus:
          targetVersion.receiptTimingStatus === 'ON_TIME' ||
          targetVersion.receiptTimingStatus === 'LATE'
            ? targetVersion.receiptTimingStatus
            : 'ON_TIME',
        receiptRegulationVersionId: targetVersion.receiptRegulationVersionId,
        receiptWindowId: targetVersion.receiptWindowId,
        approvedExceptionVersionId: approvedEx?.id ?? null,
      },
      candidate,
      disposition,
      regulations,
      existingPlayerIntervals: intervals.existingPlayerIntervals,
      existingClubSeasonIntervals: intervals.existingClubSeasonIntervals,
    });

    const firstSegment = segments[0];
    return {
      segments,
      u21Finding: firstSegment?.findings.u21Finding ?? null,
      homegrownFinding: firstSegment?.findings.homegrownFinding ?? null,
      approvedExceptionVersionId: approvedEx?.id ?? null,
    };
  }

  async list(request: Request, caseId: string) {
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
            return [
              { kind: 'season', key: reg.seasonId, mode: 'shared' },
              { kind: 'player', key: reg.playerId, mode: 'shared' },
              { kind: 'club', key: reg.clubId, mode: 'shared' },
            ];
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
          const [reg, correctionVersions] = await Promise.all([
            context.db.playerRegistration.findUniqueOrThrow({
              where: { id: caseId },
              include: {
                season: { select: { id: true, state: true } },
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
                currentValidatedVersion: true,
              },
            }),
            context.db.registrationCorrectionVersion.findMany({
              where: { registrationId: caseId },
              orderBy: { versionNumber: 'desc' },
              include: {
                preparer: { select: { id: true, fullName: true, personnelCode: true } },
                decider: { select: { id: true, fullName: true, personnelCode: true } },
                editors: { select: { accountId: true } },
                targetVersion: true,
                proposedVersion: true,
                segments: {
                  orderBy: { segmentOrder: 'asc' },
                  include: {
                    regulationVersion: {
                      select: {
                        id: true,
                        versionNumber: true,
                        activeFrom: true,
                        activeUntil: true,
                        squadLimit: true,
                        nonHomegrownLimit: true,
                        u21Cutoff: true,
                      },
                    },
                  },
                },
              },
            }),
          ]);

          const currentPlayerBirthDate = formatDateOnly(reg.player.birthDate);
          const snapshotBirthDate = reg.currentValidatedVersion
            ? extractSnapshotPlayerBirthDate(reg.currentValidatedVersion.officialSnapshot)
            : null;
          const pendingSourceCorrection = {
            required: snapshotBirthDate !== null && snapshotBirthDate !== currentPlayerBirthDate,
            snapshotBirthDate,
            currentPlayerBirthDate,
          };

          const [canPrepare, canApprove] = await Promise.all([
            hasSeasonRole(context.db, accountId, ['REGISTRATION_OFFICER'], reg.seasonId),
            hasSeasonRole(context.db, accountId, ['SEASON_MANAGER'], reg.seasonId),
          ]);

          return {
            caseId: reg.id,
            seasonId: reg.seasonId,
            seasonState: reg.season.state,
            currentValidatedVersionId: reg.currentValidatedVersionId,
            pendingSourceCorrection,
            items: correctionVersions.map((v) => ({
              id: v.id,
              correctionCaseId: v.caseId,
              versionNumber: v.versionNumber,
              predecessorVersionId: v.predecessorVersionId,
              revision: v.revision.toString(),
              state: v.state,
              preparedBy: v.preparedBy,
              preparer: v.preparer,
              editorIds: v.editors.map((e) => e.accountId),
              submittedAt: v.submittedAt?.toISOString() ?? null,
              decidedAt: v.decidedAt?.toISOString() ?? null,
              decidedBy: v.decidedBy,
              decider: v.decider,
              decisionReason: v.decisionReason,
              targetVersionId: v.targetVersionId,
              proposedVersionId: v.proposedVersionId,
              reason: v.reason,
              basis: v.basis,
              disposition: v.disposition,
              beforeSummary: v.beforeSummary,
              afterSummary: v.afterSummary,
              affectedReferences: v.affectedReferences,
              segments: v.segments.map((s) => ({
                id: s.id,
                segmentOrder: s.segmentOrder,
                segmentStart: s.segmentStart.toISOString(),
                segmentEnd: s.segmentEnd?.toISOString() ?? null,
                regulationVersionId: s.regulationVersionId,
                regulationVersionNumber: s.regulationVersion.versionNumber,
                outcome: s.outcome,
                requiredDisposition: s.requiredDisposition,
                findings: s.findings,
              })),
            })),
            capabilities: { canPrepare, canApprove },
          };
        },
      );
    } catch (error) {
      concealMissingRegistrationCorrection(error);
    }
  }

  async propose(request: Request, caseId: string, input: ProposeRegistrationCorrectionDto) {
    const targetVersionId = input.targetVersionId.toLowerCase();
    const fields = normalizeRegistrationCorrectionFields(input);
    const disposition: RegistrationCorrectionDisposition = input.disposition ?? 'RETAIN_VALID';
    const reason = requiredBoundedText(
      input.reason,
      2000,
      'Vui lòng nhập lý do đính chính hợp lệ.',
    );
    const basis = requiredBoundedText(
      input.basis,
      2000,
      'Vui lòng cung cấp căn cứ, bằng chứng đính chính hợp lệ.',
    );
    const declaredRefs = normalizeDeclaredReferences(input.affectedReferences);

    try {
      return await this.execution.execute(
        request,
        {
          locks: [
            { kind: 'playerRegistration', key: caseId, mode: 'exclusive' },
            { kind: 'registrationVersion', key: targetVersionId, mode: 'shared' },
          ],
          discover: async (db) => {
            const reg = await db.playerRegistration.findUnique({
              where: { id: caseId },
              select: { seasonId: true, playerId: true, clubId: true },
            });
            if (!reg) return [];
            const locks: LockResource[] = [
              { kind: 'season', key: reg.seasonId, mode: 'shared' },
              { kind: 'player', key: reg.playerId, mode: 'shared' },
              { kind: 'club', key: reg.clubId, mode: 'shared' },
            ];
            const existingCases = await db.registrationCorrectionCase.findMany({
              where: { registrationId: caseId },
              select: { id: true },
            });
            for (const c of existingCases) {
              locks.push({ kind: 'registrationCorrectionCase', key: c.id, mode: 'exclusive' });
            }
            return locks;
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
        async (context, accountId) => {
          const reg = await context.db.playerRegistration.findUniqueOrThrow({
            where: { id: caseId },
            include: {
              season: { select: { id: true, currentRegulationVersionId: true } },
              club: { select: { id: true, discontinuedAt: true } },
              player: { select: { id: true, birthDate: true } },
              versions: {
                orderBy: { versionNumber: 'desc' },
                take: 1,
                select: { id: true, versionNumber: true },
              },
              correctionCases: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  versions: {
                    orderBy: { versionNumber: 'desc' },
                    select: { id: true, versionNumber: true, state: true },
                  },
                },
              },
            },
          });
          await requireOpenSeason(context, reg.seasonId);

          if (!reg.currentValidatedVersionId) {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể đề xuất đính chính cho hồ sơ đăng ký cầu thủ đã được xác nhận hợp lệ.',
            );
          }
          if (reg.currentValidatedVersionId !== targetVersionId) {
            throw conflict(
              'BASIS_CHANGED',
              'Phiên bản đăng ký chính thức hiện hành đã thay đổi; vui lòng tải lại trước khi đề xuất đính chính.',
            );
          }

          const existingCase = reg.correctionCases[0] ?? null;
          if (
            existingCase &&
            existingCase.versions.some((v) => OPEN_CORRECTION_STATES.has(v.state))
          ) {
            throw conflict(
              'STATE_CONFLICT',
              'Hồ sơ đăng ký hiện đang có một đề xuất đính chính chưa hoàn tất.',
            );
          }

          const targetVersion = await context.db.registrationVersion.findFirst({
            where: { id: targetVersionId, caseId, state: 'VALID' },
          });
          if (!targetVersion) {
            throw conflict(
              'BASIS_CHANGED',
              'Không tìm thấy phiên bản đăng ký chính thức gốc hợp lệ.',
            );
          }

          const now = await context.now();
          const candidate = mergeCandidateFields(
            targetVersion,
            fields,
            accountId,
            now,
            reg.season.currentRegulationVersionId,
          );

          const evaluation = await this.evaluateForRegistration(
            context,
            reg,
            targetVersion,
            candidate,
            disposition,
          );

          await context.recheckAuthority();

          const currentPlayerBirthDate = formatDateOnly(reg.player.birthDate);
          const snapshotBirthDate = extractSnapshotPlayerBirthDate(targetVersion.officialSnapshot);
          const pendingSourceCorrection = {
            required: snapshotBirthDate !== null && snapshotBirthDate !== currentPlayerBirthDate,
            snapshotBirthDate,
            currentPlayerBirthDate,
          };

          const nextRegVersionNumber = (reg.versions[0]?.versionNumber ?? 1) + 1;
          const proposedVersionId = randomUUID();
          const proposedDisposition = deriveProposedPlayingDisposition(
            disposition,
            targetVersion.playingDisposition,
          );

          await context.db.registrationVersion.create({
            data: {
              id: proposedVersionId,
              seasonId: reg.seasonId,
              caseId,
              versionNumber: nextRegVersionNumber,
              predecessorVersionId: targetVersion.id,
              preparedBy: accountId,
              state: 'DRAFT',
              receivedAt: targetVersion.receivedAt,
              submittedAt: targetVersion.submittedAt,
              shirtNumber: candidate.shirtNumber,
              playingStart: candidate.playingStart,
              playingEnd: candidate.playingEnd,
              u21Finding: evaluation.u21Finding,
              homegrownFinding: evaluation.homegrownFinding,
              nonHomegrownOptIn: candidate.nonHomegrownOptIn,
              evidenceBranch: candidate.evidenceBranch,
              qualifyingValue: candidate.qualifyingValue,
              evidenceSummary: candidate.evidenceSummary,
              evidenceReference: candidate.evidenceReference,
              affiliatedAssociationBasis: candidate.affiliatedAssociationBasis,
              verifiedBy: candidate.verifiedBy,
              verifiedAt: candidate.verifiedAt,
              receiptRegulationVersionId: targetVersion.receiptRegulationVersionId,
              receiptTimingStatus: targetVersion.receiptTimingStatus,
              receiptWindowId: targetVersion.receiptWindowId,
              decisionRegulationVersionId: candidate.verifiedRegulationVersionId,
              playingDisposition: proposedDisposition,
              notes: candidate.notes,
              createdAt: now,
            },
          });

          const beforeSummary = buildCorrectionSummary({
            versionId: targetVersion.id,
            versionNumber: targetVersion.versionNumber,
            shirtNumber: targetVersion.shirtNumber,
            playingStart: targetVersion.playingStart,
            playingEnd: targetVersion.playingEnd,
            playerBirthDateIso: snapshotBirthDate ?? currentPlayerBirthDate,
            u21Finding: targetVersion.u21Finding,
            homegrownFinding: targetVersion.homegrownFinding,
            nonHomegrownOptIn: targetVersion.nonHomegrownOptIn,
            evidenceBranch: targetVersion.evidenceBranch,
            qualifyingValue: targetVersion.qualifyingValue,
            evidenceSummary: targetVersion.evidenceSummary,
            evidenceReference: targetVersion.evidenceReference,
            affiliatedAssociationBasis: targetVersion.affiliatedAssociationBasis,
            playingDisposition: targetVersion.playingDisposition,
            notes: targetVersion.notes,
          });

          const afterSummary = buildCorrectionSummary({
            versionId: proposedVersionId,
            versionNumber: nextRegVersionNumber,
            shirtNumber: candidate.shirtNumber,
            playingStart: candidate.playingStart,
            playingEnd: candidate.playingEnd,
            playerBirthDateIso: currentPlayerBirthDate,
            u21Finding: evaluation.u21Finding,
            homegrownFinding: evaluation.homegrownFinding,
            nonHomegrownOptIn: candidate.nonHomegrownOptIn,
            evidenceBranch: candidate.evidenceBranch,
            qualifyingValue: candidate.qualifyingValue,
            evidenceSummary: candidate.evidenceSummary,
            evidenceReference: candidate.evidenceReference,
            affiliatedAssociationBasis: candidate.affiliatedAssociationBasis,
            playingDisposition: proposedDisposition,
            notes: candidate.notes,
          });

          const affectedReferences: StoredRegistrationAffectedReferences = {
            declared: declaredRefs,
            uc19MatchReviewRequired: declaredRefs.some(
              (r) => r.kind === 'OFFICIAL_RESULT' || r.kind === 'SCHEDULED_MATCH',
            ),
            pendingSourceCorrection,
          };

          let correctionCaseId: string;
          let correctionVersionNumber = 1;
          let predecessorVersionId: string | null = null;

          if (existingCase) {
            correctionCaseId = existingCase.id;
            const latestCorr = existingCase.versions[0];
            correctionVersionNumber = latestCorr ? latestCorr.versionNumber + 1 : 1;
            predecessorVersionId = latestCorr ? latestCorr.id : null;
          } else {
            correctionCaseId = randomUUID();
            await context.db.registrationCorrectionCase.create({
              data: {
                id: correctionCaseId,
                seasonId: reg.seasonId,
                registrationId: caseId,
                createdAt: now,
                updatedAt: now,
              },
            });
          }

          const correctionVersionId = randomUUID();
          await context.db.registrationCorrectionVersion.create({
            data: {
              id: correctionVersionId,
              seasonId: reg.seasonId,
              registrationId: caseId,
              caseId: correctionCaseId,
              versionNumber: correctionVersionNumber,
              preparedBy: accountId,
              predecessorVersionId,
              state: 'DRAFT',
              targetVersionId: targetVersion.id,
              proposedVersionId,
              reason,
              basis,
              disposition,
              beforeSummary: beforeSummary as Prisma.InputJsonObject,
              afterSummary: afterSummary as Prisma.InputJsonObject,
              affectedReferences: affectedReferences as unknown as Prisma.InputJsonObject,
              createdAt: now,
              segments: {
                create: evaluation.segments.map((seg) => ({
                  id: randomUUID(),
                  segmentOrder: seg.segmentOrder,
                  segmentStart: seg.segmentStart,
                  segmentEnd: seg.segmentEnd,
                  regulationVersionId: seg.regulationVersionId,
                  outcome: seg.outcome,
                  requiredDisposition: seg.requiredDisposition,
                  findings: seg.findings as unknown as Prisma.InputJsonObject,
                })),
              },
            },
          });

          await context.db.registrationCorrectionCase.update({
            where: { id: correctionCaseId },
            data: {
              currentVersionId: correctionVersionId,
              revision: { increment: 1 },
              updatedAt: now,
            },
          });

          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });

          await this.audit.append(context, {
            action: 'REGISTRATION_CORRECTION_DRAFT_CREATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: reg.seasonId,
            outcome: 'SUCCESS',
            reason,
            after: {
              caseId,
              correctionCaseId,
              correctionVersionId,
              versionNumber: correctionVersionNumber,
              targetVersionId: targetVersion.id,
              proposedVersionId,
              disposition,
              state: 'DRAFT',
            },
          });

          return {
            caseId,
            correctionCaseId,
            correctionVersionId,
            versionNumber: correctionVersionNumber,
            predecessorVersionId,
            targetVersionId: targetVersion.id,
            proposedVersionId,
            disposition,
            revision: '1',
            state: 'DRAFT',
            beforeSummary,
            afterSummary,
            affectedReferences,
            segments: evaluation.segments.map((seg) => ({
              segmentOrder: seg.segmentOrder,
              segmentStart: seg.segmentStart.toISOString(),
              segmentEnd: seg.segmentEnd?.toISOString() ?? null,
              regulationVersionId: seg.regulationVersionId,
              regulationVersionNumber: seg.regulationVersionNumber,
              outcome: seg.outcome,
              requiredDisposition: seg.requiredDisposition,
              findings: seg.findings,
            })),
          };
        },
      );
    } catch (error) {
      concealMissingRegistrationCorrection(error);
    }
  }

  async updateDraft(
    request: Request,
    caseId: string,
    correctionVersionId: string,
    input: UpdateRegistrationCorrectionDraftDto,
  ) {
    const fields = normalizeRegistrationCorrectionFields(input);
    const reason =
      input.reason === undefined
        ? undefined
        : requiredBoundedText(input.reason, 2000, 'Vui lòng nhập lý do đính chính hợp lệ.');
    const basis =
      input.basis === undefined
        ? undefined
        : requiredBoundedText(
            input.basis,
            2000,
            'Vui lòng cung cấp căn cứ, bằng chứng đính chính hợp lệ.',
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
            { kind: 'playerRegistration', key: caseId, mode: 'exclusive' },
            {
              kind: 'registrationCorrectionVersion',
              key: correctionVersionId,
              mode: 'exclusive',
            },
          ],
          discover: async (db) => {
            const reg = await db.playerRegistration.findUnique({
              where: { id: caseId },
              select: {
                seasonId: true,
                playerId: true,
                clubId: true,
                currentValidatedVersionId: true,
              },
            });
            if (!reg) return [];
            const locks: LockResource[] = [
              { kind: 'season', key: reg.seasonId, mode: 'shared' },
              { kind: 'player', key: reg.playerId, mode: 'shared' },
              { kind: 'club', key: reg.clubId, mode: 'shared' },
            ];
            if (reg.currentValidatedVersionId) {
              locks.push({
                kind: 'registrationVersion',
                key: reg.currentValidatedVersionId,
                mode: 'shared',
              });
            }
            const ver = await db.registrationCorrectionVersion.findFirst({
              where: { id: correctionVersionId, registrationId: caseId },
              select: { caseId: true, targetVersionId: true, proposedVersionId: true },
            });
            if (ver) {
              locks.push({
                kind: 'registrationCorrectionCase',
                key: ver.caseId,
                mode: 'exclusive',
              });
              locks.push({
                kind: 'registrationVersion',
                key: ver.targetVersionId,
                mode: 'shared',
              });
              locks.push({
                kind: 'registrationVersion',
                key: ver.proposedVersionId,
                mode: 'exclusive',
              });
            }
            return locks;
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
        async (context, accountId) => {
          const reg = await context.db.playerRegistration.findUniqueOrThrow({
            where: { id: caseId },
            include: {
              season: { select: { id: true, currentRegulationVersionId: true } },
              club: { select: { id: true, discontinuedAt: true } },
              player: { select: { id: true, birthDate: true } },
            },
          });
          await requireOpenSeason(context, reg.seasonId);

          const corrVersion = await context.db.registrationCorrectionVersion.findFirst({
            where: { id: correctionVersionId, registrationId: caseId },
            include: {
              targetVersion: true,
              proposedVersion: true,
            },
          });
          if (!corrVersion) throw missing();
          if (corrVersion.state !== 'DRAFT') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể chỉnh sửa đề xuất đính chính đang ở trạng thái Nháp.',
            );
          }
          assertRevision(corrVersion.revision, input.expectedRevision);

          if (reg.currentValidatedVersionId !== corrVersion.targetVersionId) {
            throw conflict(
              'BASIS_CHANGED',
              'Phiên bản đăng ký chính thức gốc đã thay đổi; vui lòng lập đề xuất đính chính mới.',
            );
          }

          const now = await context.now();
          const nextDisposition: RegistrationCorrectionDisposition =
            input.disposition ??
            (corrVersion.disposition as RegistrationCorrectionDisposition | null) ??
            'RETAIN_VALID';

          const candidate = mergeCandidateFields(
            corrVersion.proposedVersion,
            fields,
            accountId,
            now,
            reg.season.currentRegulationVersionId,
          );

          const evaluation = await this.evaluateForRegistration(
            context,
            reg,
            corrVersion.targetVersion,
            candidate,
            nextDisposition,
          );

          await context.recheckAuthority();

          const proposedDisposition = deriveProposedPlayingDisposition(
            nextDisposition,
            corrVersion.targetVersion.playingDisposition,
          );

          await context.db.registrationVersion.update({
            where: { id: corrVersion.proposedVersionId },
            data: {
              shirtNumber: candidate.shirtNumber,
              playingStart: candidate.playingStart,
              playingEnd: candidate.playingEnd,
              u21Finding: evaluation.u21Finding,
              homegrownFinding: evaluation.homegrownFinding,
              nonHomegrownOptIn: candidate.nonHomegrownOptIn,
              evidenceBranch: candidate.evidenceBranch,
              qualifyingValue: candidate.qualifyingValue,
              evidenceSummary: candidate.evidenceSummary,
              evidenceReference: candidate.evidenceReference,
              affiliatedAssociationBasis: candidate.affiliatedAssociationBasis,
              verifiedBy: candidate.verifiedBy,
              verifiedAt: candidate.verifiedAt,
              decisionRegulationVersionId: candidate.verifiedRegulationVersionId,
              playingDisposition: proposedDisposition,
              notes: candidate.notes,
              revision: { increment: 1 },
            },
          });

          const currentPlayerBirthDate = formatDateOnly(reg.player.birthDate);
          const snapshotBirthDate = extractSnapshotPlayerBirthDate(
            corrVersion.targetVersion.officialSnapshot,
          );
          const pendingSourceCorrection = {
            required: snapshotBirthDate !== null && snapshotBirthDate !== currentPlayerBirthDate,
            snapshotBirthDate,
            currentPlayerBirthDate,
          };

          const afterSummary = buildCorrectionSummary({
            versionId: corrVersion.proposedVersionId,
            versionNumber: corrVersion.proposedVersion.versionNumber,
            shirtNumber: candidate.shirtNumber,
            playingStart: candidate.playingStart,
            playingEnd: candidate.playingEnd,
            playerBirthDateIso: currentPlayerBirthDate,
            u21Finding: evaluation.u21Finding,
            homegrownFinding: evaluation.homegrownFinding,
            nonHomegrownOptIn: candidate.nonHomegrownOptIn,
            evidenceBranch: candidate.evidenceBranch,
            qualifyingValue: candidate.qualifyingValue,
            evidenceSummary: candidate.evidenceSummary,
            evidenceReference: candidate.evidenceReference,
            affiliatedAssociationBasis: candidate.affiliatedAssociationBasis,
            playingDisposition: proposedDisposition,
            notes: candidate.notes,
          });

          const nextDeclared =
            declaredRefs ?? readStoredDeclaredReferences(corrVersion.affectedReferences);
          const affectedReferences: StoredRegistrationAffectedReferences = {
            declared: nextDeclared,
            uc19MatchReviewRequired: nextDeclared.some(
              (r) => r.kind === 'OFFICIAL_RESULT' || r.kind === 'SCHEDULED_MATCH',
            ),
            pendingSourceCorrection,
          };

          await context.db.registrationCorrectionSegment.deleteMany({
            where: { correctionVersionId: corrVersion.id },
          });

          const updated = await context.db.registrationCorrectionVersion.update({
            where: { id: corrVersion.id },
            data: {
              ...(reason !== undefined ? { reason } : {}),
              ...(basis !== undefined ? { basis } : {}),
              disposition: nextDisposition,
              afterSummary: afterSummary as Prisma.InputJsonObject,
              affectedReferences: affectedReferences as unknown as Prisma.InputJsonObject,
              revision: { increment: 1 },
              segments: {
                create: evaluation.segments.map((seg) => ({
                  id: randomUUID(),
                  segmentOrder: seg.segmentOrder,
                  segmentStart: seg.segmentStart,
                  segmentEnd: seg.segmentEnd,
                  regulationVersionId: seg.regulationVersionId,
                  outcome: seg.outcome,
                  requiredDisposition: seg.requiredDisposition,
                  findings: seg.findings as unknown as Prisma.InputJsonObject,
                })),
              },
            },
            select: { revision: true },
          });

          await context.db.registrationCorrectionVersionEditor.upsert({
            where: { versionId_accountId: { versionId: corrVersion.id, accountId } },
            create: { versionId: corrVersion.id, accountId, firstEditedAt: now },
            update: {},
          });

          await context.db.registrationCorrectionCase.update({
            where: { id: corrVersion.caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });

          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });

          await this.audit.append(context, {
            action: 'REGISTRATION_CORRECTION_DRAFT_UPDATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: reg.seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              correctionCaseId: corrVersion.caseId,
              correctionVersionId: corrVersion.id,
              versionNumber: corrVersion.versionNumber,
              targetVersionId: corrVersion.targetVersionId,
              proposedVersionId: corrVersion.proposedVersionId,
              disposition: nextDisposition,
              state: 'DRAFT',
              revision: updated.revision.toString(),
            },
          });

          return {
            caseId,
            correctionCaseId: corrVersion.caseId,
            correctionVersionId: corrVersion.id,
            targetVersionId: corrVersion.targetVersionId,
            proposedVersionId: corrVersion.proposedVersionId,
            disposition: nextDisposition,
            revision: updated.revision.toString(),
            state: 'DRAFT',
            afterSummary,
            affectedReferences,
            segments: evaluation.segments.map((seg) => ({
              segmentOrder: seg.segmentOrder,
              segmentStart: seg.segmentStart.toISOString(),
              segmentEnd: seg.segmentEnd?.toISOString() ?? null,
              regulationVersionId: seg.regulationVersionId,
              regulationVersionNumber: seg.regulationVersionNumber,
              outcome: seg.outcome,
              requiredDisposition: seg.requiredDisposition,
              findings: seg.findings,
            })),
          };
        },
      );
    } catch (error) {
      concealMissingRegistrationCorrection(error);
    }
  }

  async act(
    request: Request,
    caseId: string,
    correctionVersionId: string,
    action: string,
    input: RegistrationCorrectionActionDto,
  ) {
    if (!D057_ACTIONS.includes(action as D057Action)) {
      throw invalid('Thao tác đính chính hồ sơ đăng ký không hợp lệ.');
    }
    const normalizedAction = action as D057Action;
    const reason =
      input.reason === undefined
        ? undefined
        : requiredBoundedText(input.reason, 2000, 'Lý do không hợp lệ.');
    if (['approve', 'return', 'reject', 'cancel'].includes(normalizedAction) && !reason) {
      throw invalid('Vui lòng nhập lý do thực hiện thao tác này.');
    }
    const requestedTargetId = input.targetVersionId?.toLowerCase();
    if (normalizedAction === 'approve' && !requestedTargetId) {
      throw invalid('Vui lòng cung cấp chính xác phiên bản đăng ký chính thức cần đính chính.');
    }

    const operation = {
      locks: [
        { kind: 'playerRegistration' as const, key: caseId, mode: 'exclusive' as const },
        {
          kind: 'registrationCorrectionVersion' as const,
          key: correctionVersionId,
          mode: 'exclusive' as const,
        },
      ],
      discover: async (db: Prisma.TransactionClient) => {
        const reg = await db.playerRegistration.findUnique({
          where: { id: caseId },
          select: {
            seasonId: true,
            playerId: true,
            clubId: true,
            currentValidatedVersionId: true,
          },
        });
        if (!reg) return [];
        const locks: LockResource[] =
          normalizedAction === 'approve'
            ? await discoverSeasonWithDueRules(db, reg.seasonId, this.activation)
            : [{ kind: 'season', key: reg.seasonId, mode: 'shared' }];
        locks.push(
          {
            kind: 'player',
            key: reg.playerId,
            mode: normalizedAction === 'approve' ? 'exclusive' : 'shared',
          },
          {
            kind: 'club',
            key: reg.clubId,
            mode: normalizedAction === 'approve' ? 'exclusive' : 'shared',
          },
        );
        if (reg.currentValidatedVersionId) {
          locks.push({
            kind: 'registrationVersion',
            key: reg.currentValidatedVersionId,
            mode: 'shared',
          });
        }
        const ver = await db.registrationCorrectionVersion.findFirst({
          where: { id: correctionVersionId, registrationId: caseId },
          select: { caseId: true, targetVersionId: true, proposedVersionId: true },
        });
        if (ver) {
          locks.push(
            { kind: 'registrationCorrectionCase', key: ver.caseId, mode: 'exclusive' },
            { kind: 'registrationVersion', key: ver.targetVersionId, mode: 'shared' },
            { kind: 'registrationVersion', key: ver.proposedVersionId, mode: 'exclusive' },
          );
        }
        return locks;
      },
      authorize: async (context: TransactionContext, accountId: string) => {
        const reg = await context.db.playerRegistration.findUnique({
          where: { id: caseId },
          select: { seasonId: true },
        });
        if (!reg) throw missing();
        if (['approve', 'return', 'reject'].includes(normalizedAction)) {
          await requireSeasonManager(context, accountId, reg.seasonId);
          return;
        }
        await requireSeasonRegistrationOfficer(context, accountId, reg.seasonId);
      },
    };

    try {
      if (normalizedAction === 'approve') {
        const critical = await this.execution.executeCritical(
          request,
          operation,
          async (context) => {
            const ver = await context.db.registrationCorrectionVersion.findFirst({
              where: { id: correctionVersionId, registrationId: caseId },
              select: { proposedVersionId: true, disposition: true },
            });
            if (!ver) throw missing();
            const effectiveDisposition = input.disposition ?? ver.disposition ?? undefined;
            return {
              action: 'REGISTRATION_CORRECTION_APPROVED' as const,
              targetId: caseId,
              payload: {
                expectedRevision: input.expectedRevision,
                submittedVersionId: correctionVersionId,
                targetVersionId: requestedTargetId!,
                proposedVersionId: ver.proposedVersionId,
                reason: reason!,
                ...(effectiveDisposition ? { disposition: effectiveDisposition } : {}),
              },
            };
          },
          async (context, command) => {
            const reg = await context.db.playerRegistration.findUniqueOrThrow({
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
              },
            });
            const corrVersion = await context.db.registrationCorrectionVersion.findFirst({
              where: { id: correctionVersionId, registrationId: caseId },
              include: {
                editors: { select: { accountId: true } },
                targetVersion: true,
                proposedVersion: true,
                segments: { orderBy: { segmentOrder: 'asc' } },
              },
            });
            if (!corrVersion) throw missing();
            assertRevision(corrVersion.revision, input.expectedRevision);
            if (corrVersion.state !== 'SUBMITTED') {
              throw conflict(
                'STATE_CONFLICT',
                'Chỉ có thể phê duyệt đề xuất đính chính đang ở trạng thái Chờ phê duyệt.',
              );
            }
            if (
              corrVersion.targetVersionId !== requestedTargetId ||
              reg.currentValidatedVersionId !== corrVersion.targetVersionId
            ) {
              throw conflict(
                'BASIS_CHANGED',
                'Phiên bản đăng ký chính thức hiện hành đã thay đổi; không thể phê duyệt đề xuất đính chính trên cơ sở cũ.',
              );
            }

            assertIndependentApprover(
              corrVersion.preparedBy,
              corrVersion.editors.map((e) => e.accountId),
              command.accountId,
            );

            const { regulation: effectiveRegulation, resolvedAt: now } =
              await resolveEffectiveRegulationWithInstant(context, reg.seasonId, this.activation);

            const disposition: RegistrationCorrectionDisposition =
              ((input.disposition ??
                corrVersion.disposition) as RegistrationCorrectionDisposition | null) ??
              'RETAIN_VALID';

            if (
              input.disposition &&
              corrVersion.disposition &&
              input.disposition !== corrVersion.disposition
            ) {
              throw conflict(
                'STATE_CONFLICT',
                'Phương án xử lý hiệu lực khi phê duyệt không khớp với phương án đã trình trên phiên bản đính chính.',
              );
            }

            const candidate: MergedRegistrationCorrectionCandidate = {
              shirtNumber: corrVersion.proposedVersion.shirtNumber!,
              playingStart: corrVersion.proposedVersion.playingStart!,
              playingEnd: corrVersion.proposedVersion.playingEnd,
              nonHomegrownOptIn: corrVersion.proposedVersion.nonHomegrownOptIn,
              evidenceBranch:
                (corrVersion.proposedVersion.evidenceBranch as HomegrownEvidenceBranch | null) ??
                null,
              qualifyingValue: corrVersion.proposedVersion.qualifyingValue,
              evidenceSummary: corrVersion.proposedVersion.evidenceSummary,
              evidenceReference: corrVersion.proposedVersion.evidenceReference,
              affiliatedAssociationBasis: corrVersion.proposedVersion.affiliatedAssociationBasis,
              verifiedBy: corrVersion.proposedVersion.verifiedBy,
              verifiedAt: corrVersion.proposedVersion.verifiedAt,
              verifiedRegulationVersionId: corrVersion.proposedVersion.decisionRegulationVersionId,
              notes: corrVersion.proposedVersion.notes,
            };

            const evaluation = await this.evaluateForRegistration(
              context,
              reg,
              corrVersion.targetVersion,
              candidate,
              disposition,
            );

            // Re-verify that historical segments match what was submitted
            if (
              evaluation.segments.length !== corrVersion.segments.length ||
              evaluation.segments.some((seg, idx) => {
                const subSeg = corrVersion.segments[idx];
                return (
                  !subSeg ||
                  subSeg.regulationVersionId !== seg.regulationVersionId ||
                  subSeg.outcome !== seg.outcome ||
                  subSeg.segmentStart.getTime() !== seg.segmentStart.getTime() ||
                  (subSeg.segmentEnd?.getTime() ?? null) !== (seg.segmentEnd?.getTime() ?? null)
                );
              })
            ) {
              throw conflict(
                'BASIS_CHANGED',
                'Dữ liệu quy định lịch sử hoặc thành phần đội hình đã thay đổi sau khi trình duyệt; vui lòng trả lại để đánh giá lại các phân đoạn.',
              );
            }

            // Block approval if any segment has INSUFFICIENT_BASIS (missing historical regulation or basis)
            const insufficientSegment = evaluation.segments.find(
              (seg) => seg.outcome === 'INSUFFICIENT_BASIS',
            );
            if (insufficientSegment) {
              const reasonText =
                insufficientSegment.findings.blockingCriteria[0]?.reason ??
                'Thiếu căn cứ quy định lịch sử cho ít nhất một phân đoạn hiệu lực bị ảnh hưởng.';
              throw new ApplicationError(409, 'STATE_CONFLICT', reasonText);
            }

            // Enforce explicit disposition if any segment is UNMET (FR-019 / FR-020)
            const unmetSegments = evaluation.segments.filter((seg) => seg.outcome === 'UNMET');
            if (unmetSegments.length > 0 && disposition === 'RETAIN_VALID') {
              throw new ApplicationError(
                409,
                'STATE_CONFLICT',
                'Tồn tại phân đoạn quy định lịch sử không còn đáp ứng điều kiện hợp lệ; bắt buộc chọn phương án xử lý hiệu lực (Kết thúc hiệu lực hoặc Ghi nhận quyết định trước có sai sót) trước khi phê duyệt.',
              );
            }

            await context.recheckAuthority();

            const finalPlayingDisposition = deriveProposedPlayingDisposition(
              disposition,
              corrVersion.targetVersion.playingDisposition,
            );

            const targetSnapshot =
              corrVersion.targetVersion.officialSnapshot &&
              typeof corrVersion.targetVersion.officialSnapshot === 'object' &&
              !Array.isArray(corrVersion.targetVersion.officialSnapshot)
                ? (corrVersion.targetVersion.officialSnapshot as Record<string, unknown>)
                : {};

            const officialSnapshot = {
              ...targetSnapshot,
              capturedAt: now.toISOString(),
              season: reg.season,
              club: {
                id: reg.club.id,
                code: reg.club.code,
                name: reg.club.name,
                abbreviation: reg.club.abbreviation,
              },
              player: {
                id: reg.player.id,
                code: reg.player.code,
                fullName: reg.player.fullName,
                birthDate: formatDateOnly(reg.player.birthDate),
                nationalityCode: reg.player.nationalityCode,
                positionCode: reg.player.positionCode,
              },
              registration: {
                caseId,
                versionId: corrVersion.proposedVersionId,
                versionNumber: corrVersion.proposedVersion.versionNumber,
                shirtNumber: candidate.shirtNumber,
                playingStart: candidate.playingStart.toISOString(),
                playingEnd: candidate.playingEnd?.toISOString() ?? null,
                u21Finding: evaluation.u21Finding,
                homegrownFinding: evaluation.homegrownFinding,
                nonHomegrownOptIn: candidate.nonHomegrownOptIn,
                playingDisposition: finalPlayingDisposition,
              },
              correction: {
                correctionCaseId: corrVersion.caseId,
                correctionVersionId: corrVersion.id,
                correctionVersionNumber: corrVersion.versionNumber,
                targetVersionId: corrVersion.targetVersionId,
                disposition,
                reason: corrVersion.reason,
                basis: corrVersion.basis,
                decisionReason: reason,
                approvalRegulationVersionId: effectiveRegulation.id,
                approvedAt: now.toISOString(),
                segments: evaluation.segments.map((seg) => ({
                  segmentOrder: seg.segmentOrder,
                  segmentStart: seg.segmentStart.toISOString(),
                  segmentEnd: seg.segmentEnd?.toISOString() ?? null,
                  regulationVersionId: seg.regulationVersionId,
                  regulationVersionNumber: seg.regulationVersionNumber,
                  outcome: seg.outcome,
                  requiredDisposition: seg.requiredDisposition,
                })),
              },
            };

            await context.db.registrationVersion.update({
              where: { id: corrVersion.proposedVersionId },
              data: {
                state: 'VALID',
                decidedAt: now,
                decidedBy: command.accountId,
                decisionReason: reason,
                decisionRegulationVersionId: effectiveRegulation.id,
                playingDisposition: finalPlayingDisposition,
                officialSnapshot: officialSnapshot as unknown as Prisma.InputJsonObject,
                revision: { increment: 1 },
              },
            });

            const updatedCorr = await context.db.registrationCorrectionVersion.update({
              where: { id: corrVersion.id },
              data: {
                state: 'APPROVED',
                decidedAt: now,
                decidedBy: command.accountId,
                decisionReason: reason,
                revision: { increment: 1 },
              },
              select: { revision: true },
            });

            await context.db.registrationCorrectionCase.update({
              where: { id: corrVersion.caseId },
              data: {
                currentVersionId: corrVersion.id,
                revision: { increment: 1 },
                updatedAt: now,
              },
            });

            await context.db.playerRegistration.update({
              where: { id: caseId },
              data: {
                currentValidatedVersionId: corrVersion.proposedVersionId,
                revision: { increment: 1 },
                updatedAt: now,
              },
            });

            await this.audit.append(context, {
              action: 'REGISTRATION_CORRECTION_APPROVED',
              actor: { kind: 'ACCOUNT', accountId: command.accountId },
              objectKind: 'PlayerRegistration',
              objectId: caseId,
              seasonId: reg.seasonId,
              outcome: 'SUCCESS',
              reason,
              before: {
                caseId,
                correctionCaseId: corrVersion.caseId,
                correctionVersionId: corrVersion.id,
                versionNumber: corrVersion.versionNumber,
                targetVersionId: corrVersion.targetVersionId,
                proposedVersionId: corrVersion.proposedVersionId,
                state: 'SUBMITTED',
                shirtNumber: corrVersion.targetVersion.shirtNumber,
                playingStart: corrVersion.targetVersion.playingStart?.toISOString() ?? null,
                playingEnd: corrVersion.targetVersion.playingEnd?.toISOString() ?? null,
                u21Finding: corrVersion.targetVersion.u21Finding,
                homegrownFinding: corrVersion.targetVersion.homegrownFinding,
                nonHomegrownOptIn: corrVersion.targetVersion.nonHomegrownOptIn,
                playingDisposition: corrVersion.targetVersion.playingDisposition,
              },
              after: {
                caseId,
                correctionCaseId: corrVersion.caseId,
                correctionVersionId: corrVersion.id,
                versionNumber: corrVersion.versionNumber,
                targetVersionId: corrVersion.targetVersionId,
                proposedVersionId: corrVersion.proposedVersionId,
                disposition,
                state: 'APPROVED',
                approvedAt: now.toISOString(),
                approvalRegulationVersionId: effectiveRegulation.id,
                segmentCount: evaluation.segments.length,
                unmetSegmentCount: unmetSegments.length,
                playingDisposition: finalPlayingDisposition,
                shirtNumber: candidate.shirtNumber,
                playingStart: candidate.playingStart.toISOString(),
                playingEnd: candidate.playingEnd?.toISOString() ?? null,
                u21Finding: evaluation.u21Finding,
                homegrownFinding: evaluation.homegrownFinding,
                nonHomegrownOptIn: candidate.nonHomegrownOptIn,
              },
            });

            return {
              status: 200,
              data: {
                id: caseId,
                revision: updatedCorr.revision.toString(),
                relatedId: corrVersion.proposedVersionId,
              },
            };
          },
          async (_context, outcome) => outcome,
        );

        return {
          ...critical.data,
          caseId,
          correctionVersionId,
          targetVersionId: requestedTargetId,
          currentValidatedVersionId: critical.data.relatedId,
          state: 'APPROVED',
        };
      }

      return await this.execution.execute(request, operation, async (context, accountId) => {
        const reg = await context.db.playerRegistration.findUniqueOrThrow({
          where: { id: caseId },
          include: {
            season: { select: { id: true, currentRegulationVersionId: true } },
            club: { select: { id: true, discontinuedAt: true } },
            player: { select: { id: true, birthDate: true } },
          },
        });

        const corrVersion = await context.db.registrationCorrectionVersion.findFirst({
          where: { id: correctionVersionId, registrationId: caseId },
          include: {
            editors: { select: { accountId: true } },
            targetVersion: true,
            proposedVersion: true,
          },
        });
        if (!corrVersion) throw missing();
        assertRevision(corrVersion.revision, input.expectedRevision);
        const editorIds = corrVersion.editors.map((e) => e.accountId);

        if (normalizedAction === 'submit') {
          if (corrVersion.state !== 'DRAFT') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể trình duyệt bản nháp đính chính đang ở trạng thái Nháp.',
            );
          }
          await requireOpenSeason(context, reg.seasonId);
          if (reg.currentValidatedVersionId !== corrVersion.targetVersionId) {
            throw conflict(
              'BASIS_CHANGED',
              'Phiên bản đăng ký chính thức gốc đã thay đổi; vui lòng lập đề xuất đính chính mới.',
            );
          }

          const disposition: RegistrationCorrectionDisposition =
            (corrVersion.disposition as RegistrationCorrectionDisposition | null) ?? 'RETAIN_VALID';
          const candidate: MergedRegistrationCorrectionCandidate = {
            shirtNumber: corrVersion.proposedVersion.shirtNumber!,
            playingStart: corrVersion.proposedVersion.playingStart!,
            playingEnd: corrVersion.proposedVersion.playingEnd,
            nonHomegrownOptIn: corrVersion.proposedVersion.nonHomegrownOptIn,
            evidenceBranch:
              (corrVersion.proposedVersion.evidenceBranch as HomegrownEvidenceBranch | null) ??
              null,
            qualifyingValue: corrVersion.proposedVersion.qualifyingValue,
            evidenceSummary: corrVersion.proposedVersion.evidenceSummary,
            evidenceReference: corrVersion.proposedVersion.evidenceReference,
            affiliatedAssociationBasis: corrVersion.proposedVersion.affiliatedAssociationBasis,
            verifiedBy: corrVersion.proposedVersion.verifiedBy,
            verifiedAt: corrVersion.proposedVersion.verifiedAt,
            verifiedRegulationVersionId: corrVersion.proposedVersion.decisionRegulationVersionId,
            notes: corrVersion.proposedVersion.notes,
          };

          const evaluation = await this.evaluateForRegistration(
            context,
            reg,
            corrVersion.targetVersion,
            candidate,
            disposition,
          );

          await context.recheckAuthority();
          const now = await context.now();

          // Refresh segments one final time while corrVersion.state is still DRAFT
          await context.db.registrationCorrectionSegment.deleteMany({
            where: { correctionVersionId: corrVersion.id },
          });
          for (const seg of evaluation.segments) {
            await context.db.registrationCorrectionSegment.create({
              data: {
                id: randomUUID(),
                seasonId: reg.seasonId,
                correctionVersionId: corrVersion.id,
                segmentOrder: seg.segmentOrder,
                segmentStart: seg.segmentStart,
                segmentEnd: seg.segmentEnd,
                regulationVersionId: seg.regulationVersionId,
                outcome: seg.outcome,
                requiredDisposition: seg.requiredDisposition,
                findings: seg.findings as unknown as Prisma.InputJsonObject,
              },
            });
          }

          const updated = await context.db.registrationCorrectionVersion.update({
            where: { id: corrVersion.id },
            data: {
              state: 'SUBMITTED',
              submittedAt: now,
              revision: { increment: 1 },
            },
            select: { revision: true },
          });

          await context.db.registrationCorrectionVersionEditor.upsert({
            where: { versionId_accountId: { versionId: corrVersion.id, accountId } },
            create: { versionId: corrVersion.id, accountId, firstEditedAt: now },
            update: {},
          });

          await context.db.registrationCorrectionCase.update({
            where: { id: corrVersion.caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });

          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });

          await this.audit.append(context, {
            action: 'REGISTRATION_CORRECTION_SUBMITTED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: reg.seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              correctionCaseId: corrVersion.caseId,
              correctionVersionId: corrVersion.id,
              versionNumber: corrVersion.versionNumber,
              targetVersionId: corrVersion.targetVersionId,
              proposedVersionId: corrVersion.proposedVersionId,
              disposition,
              state: 'SUBMITTED',
              submittedAt: now.toISOString(),
            },
          });

          return {
            caseId,
            correctionCaseId: corrVersion.caseId,
            correctionVersionId: corrVersion.id,
            targetVersionId: corrVersion.targetVersionId,
            proposedVersionId: corrVersion.proposedVersionId,
            revision: updated.revision.toString(),
            state: 'SUBMITTED',
            submittedAt: now.toISOString(),
          };
        }

        if (normalizedAction === 'return') {
          if (corrVersion.state !== 'SUBMITTED') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể trả lại bổ sung đối với đề xuất đính chính đang Chờ phê duyệt.',
            );
          }
          assertIndependentApprover(corrVersion.preparedBy, editorIds, accountId);
          await requireOpenSeason(context, reg.seasonId);
          await context.recheckAuthority();
          const now = await context.now();

          const updated = await context.db.registrationCorrectionVersion.update({
            where: { id: corrVersion.id },
            data: {
              state: 'RETURNED',
              decidedAt: now,
              decidedBy: accountId,
              decisionReason: reason,
              revision: { increment: 1 },
            },
            select: { revision: true },
          });

          await context.db.registrationCorrectionCase.update({
            where: { id: corrVersion.caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });
          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });

          await this.audit.append(context, {
            action: 'REGISTRATION_CORRECTION_RETURNED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: reg.seasonId,
            outcome: 'SUCCESS',
            reason,
            after: {
              caseId,
              correctionCaseId: corrVersion.caseId,
              correctionVersionId: corrVersion.id,
              versionNumber: corrVersion.versionNumber,
              targetVersionId: corrVersion.targetVersionId,
              proposedVersionId: corrVersion.proposedVersionId,
              state: 'RETURNED',
              decidedAt: now.toISOString(),
            },
          });

          return {
            caseId,
            correctionCaseId: corrVersion.caseId,
            correctionVersionId: corrVersion.id,
            revision: updated.revision.toString(),
            state: 'RETURNED',
          };
        }

        if (normalizedAction === 'reject') {
          if (corrVersion.state !== 'SUBMITTED') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể từ chối đề xuất đính chính đang Chờ phê duyệt.',
            );
          }
          assertIndependentApprover(corrVersion.preparedBy, editorIds, accountId);
          await requireOpenSeason(context, reg.seasonId);
          await context.recheckAuthority();
          const now = await context.now();

          const updated = await context.db.registrationCorrectionVersion.update({
            where: { id: corrVersion.id },
            data: {
              state: 'REJECTED',
              decidedAt: now,
              decidedBy: accountId,
              decisionReason: reason,
              revision: { increment: 1 },
            },
            select: { revision: true },
          });

          await context.db.registrationCorrectionCase.update({
            where: { id: corrVersion.caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });
          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });

          await this.audit.append(context, {
            action: 'REGISTRATION_CORRECTION_REJECTED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: reg.seasonId,
            outcome: 'SUCCESS',
            reason,
            after: {
              caseId,
              correctionCaseId: corrVersion.caseId,
              correctionVersionId: corrVersion.id,
              versionNumber: corrVersion.versionNumber,
              targetVersionId: corrVersion.targetVersionId,
              proposedVersionId: corrVersion.proposedVersionId,
              state: 'REJECTED',
              decidedAt: now.toISOString(),
            },
          });

          return {
            caseId,
            correctionCaseId: corrVersion.caseId,
            correctionVersionId: corrVersion.id,
            revision: updated.revision.toString(),
            state: 'REJECTED',
          };
        }

        // withdraw or cancel (RegistrationCorrectionVersion constraint allows 'WITHDRAWN')
        if (!['DRAFT', 'SUBMITTED'].includes(corrVersion.state)) {
          throw conflict(
            'STATE_CONFLICT',
            'Chỉ có thể rút hoặc hủy đề xuất đính chính đang ở trạng thái Nháp hoặc Chờ phê duyệt.',
          );
        }
        await requireOpenSeason(context, reg.seasonId);
        await context.recheckAuthority();
        const now = await context.now();

        const updated = await context.db.registrationCorrectionVersion.update({
          where: { id: corrVersion.id },
          data: {
            state: 'WITHDRAWN',
            decidedAt: now,
            decidedBy: accountId,
            decisionReason: reason ?? null,
            revision: { increment: 1 },
          },
          select: { revision: true },
        });

        await context.db.registrationCorrectionCase.update({
          where: { id: corrVersion.caseId },
          data: { revision: { increment: 1 }, updatedAt: now },
        });
        await context.db.playerRegistration.update({
          where: { id: caseId },
          data: { revision: { increment: 1 }, updatedAt: now },
        });

        await this.audit.append(context, {
          action: 'REGISTRATION_CORRECTION_WITHDRAWN',
          actor: { kind: 'ACCOUNT', accountId },
          objectKind: 'PlayerRegistration',
          objectId: caseId,
          seasonId: reg.seasonId,
          outcome: 'SUCCESS',
          ...(reason ? { reason } : {}),
          after: {
            caseId,
            correctionCaseId: corrVersion.caseId,
            correctionVersionId: corrVersion.id,
            versionNumber: corrVersion.versionNumber,
            targetVersionId: corrVersion.targetVersionId,
            proposedVersionId: corrVersion.proposedVersionId,
            state: 'WITHDRAWN',
            decidedAt: now.toISOString(),
          },
        });

        return {
          caseId,
          correctionCaseId: corrVersion.caseId,
          correctionVersionId: corrVersion.id,
          revision: updated.revision.toString(),
          state: 'WITHDRAWN',
        };
      });
    } catch (error) {
      concealMissingRegistrationCorrection(error);
    }
  }
}
