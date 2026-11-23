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
  uuid,
} from '../identity-access/accounts.dto';
import { hasSeasonRole } from '../identity-access/authority.policy';
import { ApplicationError } from '../platform/application-error';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { withPaginationMeta } from '../platform/response-envelope.interceptor';
import {
  MissingLockResource,
  type LockResource,
  type TransactionContext,
} from '../platform/transaction-context';
import type { RegulationActivationService } from '../season-regulations/regulation-activation.service';
import type {
  CreatePlayerRegistrationDto,
  PlayerRegistrationActionDto,
  UpdatePlayerRegistrationDraftDto,
} from './player-registrations.dto';
import {
  evaluateRegistrationEligibilityForConfirmation,
  precheckRegistrationEligibility,
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
  formatDateOnly,
  optionalBoundedText,
  requiredBoundedText,
} from './registration-validation';

const ALLOWED_STATES = [
  'ALL',
  'DRAFT',
  'RECEIVED',
  'NEEDS_SUPPLEMENTATION',
  'VALID',
  'CANCELLED',
] as const;
const CANCELLABLE_PRE_VALID_STATES = new Set(['DRAFT', 'RECEIVED']);
const SUPPLEMENTABLE_STATES = new Set(['NEEDS_SUPPLEMENTATION', 'CANCELLED']);
const ALLOWED_PLAYING_STATUSES = [
  'ALL',
  'NOT_VALIDATED',
  'UPCOMING',
  'ACTIVE',
  'ENDED',
  'CANCELLED_BEFORE_EFFECTIVITY',
] as const;
const LIST_SORTS = [
  'updatedAt:desc',
  'playerName:asc',
  'playerName:desc',
  'shirtNumber:asc',
  'id:asc',
] as const;
const ALLOWED_ACTIONS = [
  'receive',
  'return',
  'supplement',
  'cancel',
  'validate',
  'confirm-valid',
] as const;
type RegistrationAction = (typeof ALLOWED_ACTIONS)[number];

export type PlayingEffectivityStatus =
  'NOT_VALIDATED' | 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED_BEFORE_EFFECTIVITY' | 'REVOKED';

export function computePlayingEffectivityStatus(
  version: {
    state: string;
    playingStart: Date | null;
    playingEnd: Date | null;
    playingDisposition: string | null;
  },
  now: Date,
): PlayingEffectivityStatus {
  if (version.state !== 'VALID' || !version.playingStart) return 'NOT_VALIDATED';
  if (version.playingDisposition === 'CANCELLED_BEFORE_EFFECTIVITY') {
    return 'CANCELLED_BEFORE_EFFECTIVITY';
  }
  if (
    version.playingDisposition === 'RECORDED_ERRONEOUS' ||
    version.playingDisposition === 'ENDED_BY_CORRECTION'
  ) {
    return 'REVOKED';
  }
  const nowMs = now.getTime();
  if (nowMs < version.playingStart.getTime()) return 'UPCOMING';
  if (version.playingEnd && nowMs >= version.playingEnd.getTime()) return 'ENDED';
  return 'ACTIVE';
}

function concealMissingRegistration(error: unknown): never {
  if (
    error instanceof MissingLockResource &&
    ['season', 'player', 'club', 'playerRegistration', 'registrationVersion'].includes(error.kind)
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
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw invalid(`${label} không đúng định dạng thời gian hợp lệ.`);
  }
  return parsed;
}

type NormalizedRegistrationFields = {
  shirtNumber?: number | null;
  playingStart?: Date | null;
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

function normalizeDraftFields(input: {
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
}): NormalizedRegistrationFields {
  const playingStart = parseOptionalInstant(input.playingStart, 'Thời điểm bắt đầu hiệu lực');
  const playingEnd = parseOptionalInstant(input.playingEnd, 'Thời điểm kết thúc hiệu lực');
  const evidenceSummary = optionalBoundedText(input.evidenceSummary, 1000);
  const evidenceReference = optionalBoundedText(input.evidenceReference, 300);
  const notes = optionalBoundedText(input.notes, 2000);
  const verifiedRegulationVersionId =
    input.verifiedRegulationVersionId === undefined
      ? undefined
      : input.verifiedRegulationVersionId === null
        ? null
        : input.verifiedRegulationVersionId.toLowerCase();

  return {
    ...(input.shirtNumber !== undefined ? { shirtNumber: input.shirtNumber } : {}),
    ...(playingStart !== undefined ? { playingStart } : {}),
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

function resolveHomegrownEvidenceInput(
  version: {
    evidenceBranch: string | null;
    qualifyingValue: number | null;
    evidenceSummary: string | null;
    evidenceReference: string | null;
    affiliatedAssociationBasis: boolean | null;
    verifiedBy: string | null;
    verifiedAt: Date | null;
    homegrownFinding: boolean | null;
    nonHomegrownOptIn: boolean;
    decisionRegulationVersionId: string | null;
  },
  override: NormalizedRegistrationFields,
  fallbackActor: { accountId: string; now: Date; defaultRegulationVersionId: string | null },
): {
  nonHomegrownOptIn: boolean;
  evidence: HomegrownEvidenceInput | null;
  hasEvidenceOverride: boolean;
} {
  const nonHomegrownOptIn = override.nonHomegrownOptIn ?? version.nonHomegrownOptIn;
  const hasEvidenceOverride =
    override.evidenceBranch !== undefined ||
    override.qualifyingValue !== undefined ||
    override.evidenceSummary !== undefined ||
    override.evidenceReference !== undefined ||
    override.affiliatedAssociationBasis !== undefined ||
    override.verifiedRegulationVersionId !== undefined;

  const evidenceBranch = (
    override.evidenceBranch !== undefined ? override.evidenceBranch : version.evidenceBranch
  ) as HomegrownEvidenceBranch | null;
  const qualifyingValue =
    override.qualifyingValue !== undefined ? override.qualifyingValue : version.qualifyingValue;
  const evidenceSummary =
    override.evidenceSummary !== undefined ? override.evidenceSummary : version.evidenceSummary;
  const evidenceReference =
    override.evidenceReference !== undefined
      ? override.evidenceReference
      : version.evidenceReference;

  const affiliatedAssociationBasis =
    override.affiliatedAssociationBasis !== undefined
      ? override.affiliatedAssociationBasis
      : version.affiliatedAssociationBasis;

  const hasAnyEvidenceField =
    evidenceBranch !== null ||
    qualifyingValue !== null ||
    !!evidenceSummary ||
    !!evidenceReference ||
    affiliatedAssociationBasis !== null;

  if (!hasAnyEvidenceField) {
    return { nonHomegrownOptIn, evidence: null, hasEvidenceOverride };
  }

  const verifiedBy = hasEvidenceOverride ? fallbackActor.accountId : version.verifiedBy;
  const verifiedAt = hasEvidenceOverride ? fallbackActor.now : version.verifiedAt;
  const verifiedRegulationVersionId =
    override.verifiedRegulationVersionId !== undefined
      ? override.verifiedRegulationVersionId
      : hasEvidenceOverride
        ? (version.decisionRegulationVersionId ?? fallbackActor.defaultRegulationVersionId)
        : version.decisionRegulationVersionId;

  return {
    nonHomegrownOptIn,
    hasEvidenceOverride,
    evidence: {
      evidenceBranch,
      qualifyingValue,
      evidenceSummary,
      evidenceReference,
      verifiedBy,
      verifiedAt,
      verifiedRegulationVersionId,
      affiliatedAssociationBasis,
    },
  };
}

function buildEligibilityRejectionError(
  assessment: RegistrationEligibilityAssessment,
): ApplicationError {
  const summary = assessment.blockingCriteria.map((c) => c.reason).join(' ');
  return new ApplicationError(
    409,
    'STATE_CONFLICT',
    summary || 'Hồ sơ đăng ký cầu thủ chưa đáp ứng đầy đủ điều kiện xác nhận hợp lệ.',
    assessment.blockingCriteria.map((c) => ({
      field: c.criterion,
      code: c.status,
      message: c.reason,
    })),
  );
}

export class PlayerRegistrationsService {
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

          const [effectiveRegulation, clubs, clubApps, players, canManage, canDecideExceptions] =
            await Promise.all([
              season.currentRegulationVersionId
                ? context.db.regulationVersion.findUnique({
                    where: { id: season.currentRegulationVersionId },
                    select: {
                      id: true,
                      versionNumber: true,
                      activeFrom: true,
                      squadLimit: true,
                      nonHomegrownLimit: true,
                      homegrownSeasons: true,
                      homegrownMonths: true,
                      homegrownAgeStart: true,
                      homegrownAgeEnd: true,
                      u21Cutoff: true,
                      registrationWindows: {
                        where: { intakeKind: 'PLAYER_CHANGE' },
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
              context.db.clubApplication.findMany({
                where: { seasonId },
                select: { clubId: true, currentAcceptedVersionId: true },
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

          const approvedAppByClub = new Map<string, string | null>(
            clubApps.map((a) => [a.clubId, a.currentAcceptedVersionId]),
          );

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
                  squadLimit: effectiveRegulation.squadLimit,
                  nonHomegrownLimit: effectiveRegulation.nonHomegrownLimit,
                  homegrownSeasons: effectiveRegulation.homegrownSeasons,
                  homegrownMonths: effectiveRegulation.homegrownMonths,
                  homegrownAgeStart: effectiveRegulation.homegrownAgeStart,
                  homegrownAgeEnd: effectiveRegulation.homegrownAgeEnd,
                  u21Cutoff: effectiveRegulation.u21Cutoff
                    ? formatDateOnly(effectiveRegulation.u21Cutoff)
                    : null,
                  windows: effectiveRegulation.registrationWindows.map((w) => ({
                    id: w.id,
                    intakeKind: w.intakeKind,
                    opensAt: w.opensAt.toISOString(),
                    closesAt: w.closesAt.toISOString(),
                  })),
                }
              : null,
            clubs: clubs.map((c) => {
              const acceptedApplicationVersionId = approvedAppByClub.get(c.id) ?? null;
              return {
                ...c,
                discontinuedAt: c.discontinuedAt?.toISOString() ?? null,
                hasApprovedApplication: !!acceptedApplicationVersionId,
                acceptedApplicationVersionId,
              };
            }),
            players: players.map((p) => ({
              ...p,
              birthDate: formatDateOnly(p.birthDate),
            })),
            capabilities: { canManage, canDecideExceptions },
          };
        },
      );
    } catch (error) {
      concealMissingRegistration(error);
    }
  }

  async list(request: Request, seasonId: string, query: Record<string, unknown>) {
    const { values, page, pageSize, sort, skip, take } = listQuery(
      query,
      ['search', 'state', 'clubId', 'playerId', 'playingStatus'],
      LIST_SORTS,
    );
    if (values.state && !ALLOWED_STATES.includes(values.state as (typeof ALLOWED_STATES)[number])) {
      throw invalid();
    }
    if (
      values.playingStatus &&
      !ALLOWED_PLAYING_STATUSES.includes(
        values.playingStatus as (typeof ALLOWED_PLAYING_STATUSES)[number],
      )
    ) {
      throw invalid();
    }
    const clubId = values.clubId ? uuid(values.clubId) : undefined;
    const playerId = values.playerId ? uuid(values.playerId) : undefined;
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
          const now = await context.now();
          const where: Prisma.PlayerRegistrationWhereInput = {
            seasonId,
            ...(clubId ? { clubId } : {}),
            ...(playerId ? { playerId } : {}),
            ...(search
              ? {
                  OR: [
                    { player: { fullName: { contains: search, mode: 'insensitive' } } },
                    { player: { code: { contains: search, mode: 'insensitive' } } },
                    { club: { name: { contains: search, mode: 'insensitive' } } },
                    { club: { code: { contains: search, mode: 'insensitive' } } },
                    { club: { abbreviation: { contains: search, mode: 'insensitive' } } },
                  ],
                }
              : {}),
          };

          const orderBy: Prisma.PlayerRegistrationOrderByWithRelationInput[] =
            sort === 'playerName:asc'
              ? [{ player: { fullName: 'asc' } }, { id: 'asc' }]
              : sort === 'playerName:desc'
                ? [{ player: { fullName: 'desc' } }, { id: 'asc' }]
                : sort === 'id:asc'
                  ? [{ id: 'asc' }]
                  : [{ updatedAt: 'desc' }, { id: 'asc' }];

          const canPageInDb =
            (!values.state || values.state === 'ALL') &&
            (!values.playingStatus || values.playingStatus === 'ALL') &&
            sort !== 'shirtNumber:asc';

          const [rows, dbTotal, clubApps, canManage, canDecideExceptions] = await Promise.all([
            context.db.playerRegistration.findMany({
              where,
              orderBy,
              ...(canPageInDb ? { skip, take } : {}),
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
                versions: {
                  orderBy: { versionNumber: 'desc' },
                  take: 1,
                  include: {
                    receiptExceptions: {
                      where: { state: 'APPROVED' },
                      select: { id: true },
                      take: 1,
                    },
                  },
                },
                currentValidatedVersion: {
                  select: {
                    id: true,
                    versionNumber: true,
                    state: true,
                    shirtNumber: true,
                    playingStart: true,
                    playingEnd: true,
                    u21Finding: true,
                    homegrownFinding: true,
                    nonHomegrownOptIn: true,
                    playingDisposition: true,
                    decidedAt: true,
                    decisionRegulationVersionId: true,
                  },
                },
              },
            }),
            canPageInDb ? context.db.playerRegistration.count({ where }) : Promise.resolve(0),
            context.db.clubApplication.findMany({
              where: { seasonId },
              select: { clubId: true, currentAcceptedVersionId: true },
            }),
            hasSeasonRole(context.db, accountId, ['REGISTRATION_OFFICER'], seasonId),
            hasSeasonRole(context.db, accountId, ['SEASON_MANAGER'], seasonId),
          ]);

          const approvedClubSet = new Set(
            clubApps.filter((a) => !!a.currentAcceptedVersionId).map((a) => a.clubId),
          );

          const mapped = rows.map((row) => {
            const latest = row.versions[0] ?? null;
            const validated = row.currentValidatedVersion;
            const playingEffectivityStatus = validated
              ? computePlayingEffectivityStatus(validated, now)
              : 'NOT_VALIDATED';
            return {
              id: row.id,
              seasonId: row.seasonId,
              revision: row.revision.toString(),
              currentDraftVersionId: row.currentDraftVersionId,
              currentValidatedVersionId: row.currentValidatedVersionId,
              updatedAt: row.updatedAt.toISOString(),
              club: {
                ...row.club,
                discontinuedAt: row.club.discontinuedAt?.toISOString() ?? null,
                hasApprovedApplication: approvedClubSet.has(row.club.id),
              },
              player: {
                ...row.player,
                birthDate: formatDateOnly(row.player.birthDate),
              },
              playingEffectivityStatus,
              latestVersion: latest
                ? {
                    id: latest.id,
                    versionNumber: latest.versionNumber,
                    revision: latest.revision.toString(),
                    state: latest.state,
                    shirtNumber: latest.shirtNumber,
                    playingStart: latest.playingStart?.toISOString() ?? null,
                    playingEnd: latest.playingEnd?.toISOString() ?? null,
                    u21Finding: latest.u21Finding,
                    homegrownFinding: latest.homegrownFinding,
                    nonHomegrownOptIn: latest.nonHomegrownOptIn,
                    receivedAt: latest.receivedAt?.toISOString() ?? null,
                    receiptTimingStatus: latest.receiptTimingStatus,
                    decidedAt: latest.decidedAt?.toISOString() ?? null,
                    playingDisposition: latest.playingDisposition,
                    hasApprovedException: latest.receiptExceptions.length > 0,
                  }
                : null,
              currentValidatedVersion: validated
                ? {
                    id: validated.id,
                    versionNumber: validated.versionNumber,
                    shirtNumber: validated.shirtNumber,
                    playingStart: validated.playingStart?.toISOString() ?? null,
                    playingEnd: validated.playingEnd?.toISOString() ?? null,
                    u21Finding: validated.u21Finding,
                    homegrownFinding: validated.homegrownFinding,
                    nonHomegrownOptIn: validated.nonHomegrownOptIn,
                    playingDisposition: validated.playingDisposition,
                    decidedAt: validated.decidedAt?.toISOString() ?? null,
                    decisionRegulationVersionId: validated.decisionRegulationVersionId,
                  }
                : null,
            };
          });

          const filtered = canPageInDb
            ? mapped
            : mapped.filter((item) => {
                if (values.state && values.state !== 'ALL') {
                  if (item.latestVersion?.state !== values.state) return false;
                }
                if (values.playingStatus && values.playingStatus !== 'ALL') {
                  if (item.playingEffectivityStatus !== values.playingStatus) return false;
                }
                return true;
              });

          if (sort === 'shirtNumber:asc') {
            filtered.sort((a, b) => {
              const sa = a.latestVersion?.shirtNumber ?? 999;
              const sb = b.latestVersion?.shirtNumber ?? 999;
              return sa - sb || a.id.localeCompare(b.id);
            });
          }

          const total = canPageInDb ? dbTotal : filtered.length;
          const items = canPageInDb ? filtered : filtered.slice(skip, skip + take);

          return withPaginationMeta(
            {
              items,
              capabilities: { canManage, canDecideExceptions },
            },
            { page, pageSize, total },
          );
        },
      );
    } catch (error) {
      concealMissingRegistration(error);
    }
  }

  async detail(request: Request, caseId: string) {
    try {
      return await this.execution.read(
        request,
        {
          locks: [{ kind: 'playerRegistration', key: caseId, mode: 'shared' }],
          discover: async (db) => {
            const reg = await db.playerRegistration.findUnique({
              where: { id: caseId },
              select: { seasonId: true, clubId: true, playerId: true },
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
              versions: {
                orderBy: { versionNumber: 'desc' },
                include: {
                  preparer: { select: { id: true, fullName: true, personnelCode: true } },
                  decider: { select: { id: true, fullName: true, personnelCode: true } },
                  verifier: { select: { id: true, fullName: true, personnelCode: true } },
                  receiptRegulationVersion: { select: { id: true, versionNumber: true } },
                  decisionRegulationVersion: { select: { id: true, versionNumber: true } },
                  receiptWindow: { select: { id: true, opensAt: true, closesAt: true } },
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
          if (!reg) throw missing();

          const [clubApp, canManage, canDecideExceptions] = await Promise.all([
            context.db.clubApplication.findUnique({
              where: { seasonId_clubId: { seasonId: reg.seasonId, clubId: reg.clubId } },
              select: { id: true, currentAcceptedVersionId: true },
            }),
            hasSeasonRole(context.db, accountId, ['REGISTRATION_OFFICER'], reg.seasonId),
            hasSeasonRole(context.db, accountId, ['SEASON_MANAGER'], reg.seasonId),
          ]);

          const validatedVersion = reg.versions.find((v) => v.id === reg.currentValidatedVersionId);
          const playingEffectivityStatus = validatedVersion
            ? computePlayingEffectivityStatus(validatedVersion, now)
            : 'NOT_VALIDATED';

          return {
            id: reg.id,
            seasonId: reg.seasonId,
            season: reg.season,
            club: {
              ...reg.club,
              discontinuedAt: reg.club.discontinuedAt?.toISOString() ?? null,
              hasApprovedApplication: !!clubApp?.currentAcceptedVersionId,
              acceptedApplicationVersionId: clubApp?.currentAcceptedVersionId ?? null,
            },
            player: {
              ...reg.player,
              birthDate: formatDateOnly(reg.player.birthDate),
            },
            revision: reg.revision.toString(),
            currentDraftVersionId: reg.currentDraftVersionId,
            currentValidatedVersionId: reg.currentValidatedVersionId,
            playingEffectivityStatus,
            versions: reg.versions.map((v) => ({
              id: v.id,
              versionNumber: v.versionNumber,
              predecessorVersionId: v.predecessorVersionId,
              revision: v.revision.toString(),
              state: v.state,
              playingEffectivityStatus: computePlayingEffectivityStatus(v, now),
              preparedBy: v.preparedBy,
              preparer: v.preparer,
              receivedAt: v.receivedAt?.toISOString() ?? null,
              decidedAt: v.decidedAt?.toISOString() ?? null,
              decidedBy: v.decidedBy,
              decider: v.decider,
              decisionReason: v.decisionReason,
              shirtNumber: v.shirtNumber,
              playingStart: v.playingStart?.toISOString() ?? null,
              playingEnd: v.playingEnd?.toISOString() ?? null,
              u21Finding: v.u21Finding,
              homegrownFinding: v.homegrownFinding,
              nonHomegrownOptIn: v.nonHomegrownOptIn,
              evidenceBranch: v.evidenceBranch,
              qualifyingValue: v.qualifyingValue,
              evidenceSummary: v.evidenceSummary,
              evidenceReference: v.evidenceReference,
              verifiedBy: v.verifiedBy,
              verifier: v.verifier,
              verifiedAt: v.verifiedAt?.toISOString() ?? null,
              affiliatedAssociationBasis: v.affiliatedAssociationBasis,
              receiptRegulationVersionId: v.receiptRegulationVersionId,
              receiptRegulationVersion: v.receiptRegulationVersion,
              receiptTimingStatus: v.receiptTimingStatus,
              receiptWindow: v.receiptWindow
                ? {
                    id: v.receiptWindow.id,
                    opensAt: v.receiptWindow.opensAt.toISOString(),
                    closesAt: v.receiptWindow.closesAt.toISOString(),
                  }
                : null,
              decisionRegulationVersionId: v.decisionRegulationVersionId,
              decisionRegulationVersion: v.decisionRegulationVersion,
              officialSnapshot: v.officialSnapshot,
              playingDisposition: v.playingDisposition,
              notes: v.notes,
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
            capabilities: { canManage, canDecideExceptions },
          };
        },
      );
    } catch (error) {
      concealMissingRegistration(error);
    }
  }

  async history(request: Request, caseId: string, query: Record<string, unknown>) {
    const { values, page, pageSize } = listQuery(
      query,
      ['actionCode', 'occurredFrom', 'occurredBefore'],
      ['occurredAt:desc'],
    );
    try {
      return await this.execution.read(
        request,
        {
          locks: [{ kind: 'playerRegistration', key: caseId, mode: 'shared' }],
          discover: async (db) => {
            const reg = await db.playerRegistration.findUnique({
              where: { id: caseId },
              select: { seasonId: true },
            });
            return reg ? [{ kind: 'season', key: reg.seasonId, mode: 'shared' }] : [];
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
          const reg = await context.db.playerRegistration.findUnique({
            where: { id: caseId },
            select: { seasonId: true },
          });
          if (!reg) throw missing();
          const result = await this.businessHistory.listWithin(
            context,
            accountId,
            {
              kind: 'PlayerRegistration',
              id: caseId,
              seasonId: reg.seasonId,
              locks: [
                { kind: 'season', key: reg.seasonId, mode: 'shared' },
                { kind: 'playerRegistration', key: caseId, mode: 'shared' },
              ],
              authorize: (tx, actorId) =>
                requireSeasonRegistrationReader(tx, actorId, reg.seasonId),
            },
            {
              page,
              pageSize,
              ...(values.actionCode ? { actionCode: values.actionCode } : {}),
              ...(values.occurredFrom ? { occurredFrom: values.occurredFrom } : {}),
              ...(values.occurredBefore ? { occurredBefore: values.occurredBefore } : {}),
            },
          );

          const transferHistoryActions = new Set([
            'PLAYER_TRANSFER_EXECUTED',
            'PLAYER_REGISTRATION_PLAN_CHANGED',
            'PLAYER_REGISTRATION_PLAN_CANCELLED',
          ]);
          const hasCounterpartRefs = result.items.some(
            (item) =>
              transferHistoryActions.has(item.actionCode) &&
              item.after &&
              ('counterpartSeasonId' in item.after || 'counterpartCaseId' in item.after),
          );

          let items = result.items;
          if (hasCounterpartRefs) {
            const [readerRoles, counterpartCases] = await Promise.all([
              context.db.seasonRoleAssignment.findMany({
                where: {
                  accountId,
                  roleCode: { in: ['REGISTRATION_OFFICER', 'SEASON_MANAGER'] },
                  revokedAt: null,
                },
                select: { seasonId: true },
              }),
              context.db.playerRegistration.findMany({
                where: {
                  id: {
                    in: result.items.flatMap((item) => {
                      const cid = item.after?.counterpartCaseId;
                      return typeof cid === 'string' ? [cid] : [];
                    }),
                  },
                },
                select: { id: true, seasonId: true },
              }),
            ]);
            const readableSeasons = new Set(readerRoles.map((r) => r.seasonId));
            const caseSeasonById = new Map(counterpartCases.map((c) => [c.id, c.seasonId]));

            const stripCounterpart = <T extends Record<string, unknown> | null>(payload: T): T => {
              if (!payload) return payload;
              const next = { ...payload };
              delete next.counterpartCaseId;
              delete next.counterpartClubId;
              delete next.counterpartSeasonId;
              return next;
            };

            items = result.items.map((item) => {
              if (!transferHistoryActions.has(item.actionCode) || !item.after) return item;
              const directSeason =
                typeof item.after.counterpartSeasonId === 'string'
                  ? item.after.counterpartSeasonId
                  : null;
              const resolvedSeason =
                directSeason ??
                (typeof item.after.counterpartCaseId === 'string'
                  ? (caseSeasonById.get(item.after.counterpartCaseId) ?? null)
                  : null);
              if (
                resolvedSeason !== null
                  ? !readableSeasons.has(resolvedSeason)
                  : 'counterpartCaseId' in item.after || 'counterpartSeasonId' in item.after
              ) {
                return {
                  ...item,
                  before: stripCounterpart(item.before),
                  after: stripCounterpart(item.after),
                };
              }
              return item;
            });
          }

          return withPaginationMeta(
            { items },
            { page: result.page, pageSize: result.pageSize, total: result.total },
          );
        },
      );
    } catch (error) {
      concealMissingRegistration(error);
    }
  }

  async createDraft(request: Request, seasonId: string, input: CreatePlayerRegistrationDto) {
    const clubId = input.clubId.toLowerCase();
    const playerId = input.playerId.toLowerCase();
    const fields = normalizeDraftFields(input);

    try {
      return await this.execution.execute(
        request,
        {
          locks: [
            { kind: 'season', key: seasonId, mode: 'shared' },
            { kind: 'player', key: playerId, mode: 'shared' },
            { kind: 'club', key: clubId, mode: 'shared' },
          ],
          authorize: (context, accountId) =>
            requireSeasonRegistrationOfficer(context, accountId, seasonId),
        },
        async (context, accountId) => {
          await requireOpenSeason(context, seasonId);
          const [season, club, player] = await Promise.all([
            context.db.season.findUnique({
              where: { id: seasonId },
              select: { currentRegulationVersionId: true },
            }),
            context.db.club.findUnique({ where: { id: clubId }, select: { id: true } }),
            context.db.player.findUnique({ where: { id: playerId }, select: { id: true } }),
          ]);
          if (!season || !club || !player) {
            throw invalid('Không tìm thấy câu lạc bộ hoặc cầu thủ được chọn.');
          }
          if (fields.verifiedRegulationVersionId) {
            const regVer = await context.db.regulationVersion.findFirst({
              where: { id: fields.verifiedRegulationVersionId, seasonId },
              select: { id: true },
            });
            if (!regVer) {
              throw invalid('Phiên bản quy định xác minh không thuộc mùa giải này.');
            }
          }

          await context.recheckAuthority();
          const now = await context.now();
          const caseId = randomUUID();
          const versionId = randomUUID();

          const hasAffiliationDecision =
            fields.affiliatedAssociationBasis === true ||
            fields.affiliatedAssociationBasis === false;
          const verifiedBy = hasAffiliationDecision ? accountId : null;
          const verifiedAt = hasAffiliationDecision ? now : null;
          const verificationRegId = hasAffiliationDecision
            ? (fields.verifiedRegulationVersionId ?? season.currentRegulationVersionId ?? null)
            : null;

          await context.db.playerRegistration.create({
            data: {
              id: caseId,
              seasonId,
              clubId,
              playerId,
              createdAt: now,
              updatedAt: now,
            },
          });

          await context.db.registrationVersion.create({
            data: {
              id: versionId,
              seasonId,
              caseId,
              versionNumber: 1,
              preparedBy: accountId,
              state: 'DRAFT',
              shirtNumber: fields.shirtNumber ?? null,
              playingStart: fields.playingStart ?? null,
              playingEnd: fields.playingEnd ?? null,
              nonHomegrownOptIn: fields.nonHomegrownOptIn ?? false,
              evidenceBranch: fields.evidenceBranch ?? null,
              qualifyingValue: fields.qualifyingValue ?? null,
              evidenceSummary: fields.evidenceSummary ?? null,
              evidenceReference: fields.evidenceReference ?? null,
              affiliatedAssociationBasis: fields.affiliatedAssociationBasis ?? null,
              verifiedBy,
              verifiedAt,
              decisionRegulationVersionId: verificationRegId,
              notes: fields.notes ?? null,
              createdAt: now,
            },
          });

          const savedCase = await context.db.playerRegistration.update({
            where: { id: caseId },
            data: { currentDraftVersionId: versionId, revision: { increment: 1 }, updatedAt: now },
            select: { revision: true },
          });

          await this.audit.append(context, {
            action: 'PLAYER_REGISTRATION_DRAFT_CREATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              clubId,
              playerId,
              versionId,
              versionNumber: 1,
              state: 'DRAFT',
            },
          });

          return {
            caseId,
            versionId,
            versionNumber: 1,
            revision: '1',
            caseRevision: savedCase.revision.toString(),
            state: 'DRAFT',
          };
        },
      );
    } catch (error) {
      concealMissingRegistration(error);
    }
  }

  async updateDraft(request: Request, caseId: string, input: UpdatePlayerRegistrationDraftDto) {
    const versionId = input.versionId.toLowerCase();
    const fields = normalizeDraftFields(input);

    try {
      return await this.execution.execute(
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
            await requireSeasonRegistrationOfficer(context, accountId, reg.seasonId);
          },
        },
        async (context, accountId) => {
          const reg = await context.db.playerRegistration.findUnique({
            where: { id: caseId },
            select: {
              id: true,
              seasonId: true,
              season: { select: { currentRegulationVersionId: true } },
            },
          });
          if (!reg) throw missing();
          await requireOpenSeason(context, reg.seasonId);

          const version = await context.db.registrationVersion.findFirst({
            where: { id: versionId, caseId },
          });
          if (!version) throw missing();
          assertRevision(version.revision, input.expectedRevision);
          if (version.state !== 'DRAFT') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ được chỉnh sửa phiên bản đăng ký đang ở trạng thái Nháp.',
            );
          }

          if (fields.verifiedRegulationVersionId) {
            const regVer = await context.db.regulationVersion.findFirst({
              where: { id: fields.verifiedRegulationVersionId, seasonId: reg.seasonId },
              select: { id: true },
            });
            if (!regVer) {
              throw invalid('Phiên bản quy định xác minh không thuộc mùa giải này.');
            }
          }

          await context.recheckAuthority();
          const now = await context.now();

          const updateData: Prisma.RegistrationVersionUncheckedUpdateInput = {
            ...(fields.shirtNumber !== undefined ? { shirtNumber: fields.shirtNumber } : {}),
            ...(fields.playingStart !== undefined ? { playingStart: fields.playingStart } : {}),
            ...(fields.playingEnd !== undefined ? { playingEnd: fields.playingEnd } : {}),
            ...(fields.nonHomegrownOptIn !== undefined
              ? { nonHomegrownOptIn: fields.nonHomegrownOptIn }
              : {}),
            ...(fields.evidenceBranch !== undefined
              ? { evidenceBranch: fields.evidenceBranch }
              : {}),
            ...(fields.qualifyingValue !== undefined
              ? { qualifyingValue: fields.qualifyingValue }
              : {}),
            ...(fields.evidenceSummary !== undefined
              ? { evidenceSummary: fields.evidenceSummary }
              : {}),
            ...(fields.evidenceReference !== undefined
              ? { evidenceReference: fields.evidenceReference }
              : {}),
            ...(fields.notes !== undefined ? { notes: fields.notes } : {}),
            revision: { increment: 1 },
          };

          const evidenceOrBasisChanged =
            (fields.evidenceBranch !== undefined &&
              fields.evidenceBranch !== version.evidenceBranch) ||
            (fields.qualifyingValue !== undefined &&
              fields.qualifyingValue !== version.qualifyingValue) ||
            (fields.evidenceSummary !== undefined &&
              fields.evidenceSummary !== version.evidenceSummary) ||
            (fields.evidenceReference !== undefined &&
              fields.evidenceReference !== version.evidenceReference) ||
            (fields.verifiedRegulationVersionId !== undefined &&
              fields.verifiedRegulationVersionId !== version.decisionRegulationVersionId);

          if (fields.affiliatedAssociationBasis !== undefined) {
            if (fields.affiliatedAssociationBasis === null) {
              updateData.affiliatedAssociationBasis = null;
              updateData.verifiedBy = null;
              updateData.verifiedAt = null;
              updateData.decisionRegulationVersionId = null;
            } else {
              updateData.affiliatedAssociationBasis = fields.affiliatedAssociationBasis;
              updateData.verifiedBy = accountId;
              updateData.verifiedAt = now;
              updateData.decisionRegulationVersionId =
                fields.verifiedRegulationVersionId ?? reg.season.currentRegulationVersionId ?? null;
            }
          } else if (evidenceOrBasisChanged) {
            // Evidence or regulation basis changed without renewing verification: invalidate prior verification.
            updateData.affiliatedAssociationBasis = null;
            updateData.verifiedBy = null;
            updateData.verifiedAt = null;
            updateData.decisionRegulationVersionId =
              fields.verifiedRegulationVersionId !== undefined
                ? fields.verifiedRegulationVersionId
                : null;
          }

          const updated = await context.db.registrationVersion.update({
            where: { id: version.id },
            data: updateData,
            select: { revision: true },
          });
          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });

          await this.audit.append(context, {
            action: 'PLAYER_REGISTRATION_DRAFT_UPDATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: reg.seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              state: 'DRAFT',
              revision: updated.revision.toString(),
            },
          });

          return {
            caseId,
            versionId: version.id,
            versionNumber: version.versionNumber,
            revision: updated.revision.toString(),
            state: 'DRAFT',
          };
        },
      );
    } catch (error) {
      concealMissingRegistration(error);
    }
  }

  async act(request: Request, caseId: string, action: string, input: PlayerRegistrationActionDto) {
    if (!ALLOWED_ACTIONS.includes(action as RegistrationAction)) {
      throw invalid('Thao tác đăng ký cầu thủ không hợp lệ.');
    }
    const normalizedAction = action as RegistrationAction;
    const versionId = input.versionId.toLowerCase();

    const hasOverrideFields =
      input.shirtNumber !== undefined ||
      input.playingStart !== undefined ||
      input.playingEnd !== undefined ||
      input.nonHomegrownOptIn !== undefined ||
      input.evidenceBranch !== undefined ||
      input.qualifyingValue !== undefined ||
      input.evidenceSummary !== undefined ||
      input.evidenceReference !== undefined ||
      input.affiliatedAssociationBasis !== undefined ||
      input.verifiedRegulationVersionId !== undefined;

    if (normalizedAction === 'validate') {
      return this.precheck(request, caseId, versionId, input);
    }
    if (hasOverrideFields) {
      throw invalid('Thao tác này không chấp nhận trường ghi đè nội dung bản nháp.');
    }
    if (normalizedAction === 'confirm-valid') {
      return this.confirmValid(request, caseId, versionId, input);
    }

    const reason =
      input.reason === undefined
        ? undefined
        : requiredBoundedText(input.reason, 2000, 'Lý do không hợp lệ.');
    if ((normalizedAction === 'return' || normalizedAction === 'cancel') && !reason) {
      throw invalid('Vui lòng nhập lý do thực hiện thao tác này.');
    }
    const expectedRevision = input.expectedRevision ?? '';

    const operation = {
      locks: [
        { kind: 'playerRegistration' as const, key: caseId, mode: 'exclusive' as const },
        { kind: 'registrationVersion' as const, key: versionId, mode: 'exclusive' as const },
      ],
      discover: async (db: Prisma.TransactionClient) => {
        const reg = await db.playerRegistration.findUnique({
          where: { id: caseId },
          select: { seasonId: true, playerId: true, clubId: true },
        });
        if (!reg) return [];
        const seasonLocks: LockResource[] =
          normalizedAction === 'receive'
            ? await discoverSeasonWithDueRules(db, reg.seasonId, this.activation)
            : [{ kind: 'season', key: reg.seasonId, mode: 'shared' }];
        return [
          ...seasonLocks,
          { kind: 'player' as const, key: reg.playerId, mode: 'shared' as const },
          { kind: 'club' as const, key: reg.clubId, mode: 'shared' as const },
        ];
      },
      authorize: async (context: TransactionContext, accountId: string) => {
        const reg = await context.db.playerRegistration.findUnique({
          where: { id: caseId },
          select: { seasonId: true },
        });
        if (!reg) throw missing();
        await requireSeasonRegistrationOfficer(context, accountId, reg.seasonId);
      },
    };

    try {
      return await this.execution.execute(request, operation, async (context, accountId) => {
        const reg = await context.db.playerRegistration.findUnique({
          where: { id: caseId },
          select: {
            id: true,
            seasonId: true,
            clubId: true,
            playerId: true,
            currentDraftVersionId: true,
            currentValidatedVersionId: true,
          },
        });
        if (!reg) throw missing();

        const version = await context.db.registrationVersion.findFirst({
          where: { id: versionId, caseId },
        });
        if (!version) throw missing();
        assertRevision(version.revision, expectedRevision);

        if (normalizedAction === 'receive') {
          if (version.state !== 'DRAFT') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể tiếp nhận phiên bản đăng ký đang ở trạng thái Nháp.',
            );
          }
          const { regulation, resolvedAt: now } = await resolveEffectiveRegulationWithInstant(
            context,
            reg.seasonId,
            this.activation,
          );
          const timing = this.intake.assessReceiptTiming(
            regulation.registrationWindows,
            'PLAYER_CHANGE',
            now,
          );
          const updated = await context.db.registrationVersion.update({
            where: { id: version.id },
            data: {
              state: 'RECEIVED',
              receivedAt: now,
              receiptRegulationVersionId: regulation.id,
              receiptTimingStatus: timing.receiptTimingStatus,
              receiptWindowId: timing.receiptWindowId,
              revision: { increment: 1 },
            },
            select: { revision: true },
          });
          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: {
              currentDraftVersionId:
                reg.currentDraftVersionId === version.id ? null : reg.currentDraftVersionId,
              revision: { increment: 1 },
              updatedAt: now,
            },
          });
          await this.audit.append(context, {
            action: 'PLAYER_REGISTRATION_RECEIVED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: reg.seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              state: 'RECEIVED',
              receivedAt: now.toISOString(),
              receiptTimingStatus: timing.receiptTimingStatus,
              receiptRegulationVersionId: regulation.id,
            },
          });
          return {
            caseId,
            versionId: version.id,
            versionNumber: version.versionNumber,
            revision: updated.revision.toString(),
            state: 'RECEIVED',
            receivedAt: now.toISOString(),
            receiptTimingStatus: timing.receiptTimingStatus,
            receiptRegulationVersionId: regulation.id,
            receiptWindowId: timing.receiptWindowId,
          };
        }

        if (normalizedAction === 'return') {
          await requireOpenSeason(context, reg.seasonId);
          if (version.state !== 'RECEIVED') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể yêu cầu bổ sung phiên bản đang ở trạng thái Đã tiếp nhận.',
            );
          }
          await context.recheckAuthority();
          const now = await context.now();
          const updated = await context.db.registrationVersion.update({
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
          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: { revision: { increment: 1 }, updatedAt: now },
          });
          await this.audit.append(context, {
            action: 'PLAYER_REGISTRATION_RETURNED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: reg.seasonId,
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
            versionNumber: version.versionNumber,
            revision: updated.revision.toString(),
            state: 'NEEDS_SUPPLEMENTATION',
          };
        }

        if (normalizedAction === 'supplement') {
          await requireOpenSeason(context, reg.seasonId);
          if (reg.currentValidatedVersionId) {
            throw conflict(
              'STATE_CONFLICT',
              'Hồ sơ đăng ký đã có phiên bản hợp lệ; thay đổi sau xác nhận phải dùng quy trình điều chỉnh hoặc đính chính riêng.',
            );
          }
          if (!SUPPLEMENTABLE_STATES.has(version.state)) {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể tạo phiên bản bổ sung từ phiên bản Cần bổ sung hoặc Đã hủy.',
            );
          }
          const openSibling = await context.db.registrationVersion.findFirst({
            where: { caseId, state: { in: ['DRAFT', 'RECEIVED'] } },
            select: { id: true },
          });
          if (openSibling) {
            throw conflict(
              'STATE_CONFLICT',
              'Hồ sơ này đang có phiên bản Nháp hoặc Đã tiếp nhận chưa kết thúc.',
            );
          }
          const latest = await context.db.registrationVersion.findFirst({
            where: { caseId },
            orderBy: { versionNumber: 'desc' },
            select: { versionNumber: true },
          });
          await context.recheckAuthority();
          const now = await context.now();
          const nextVersionId = randomUUID();
          const nextVersionNumber = (latest?.versionNumber ?? version.versionNumber) + 1;

          await context.db.registrationVersion.create({
            data: {
              id: nextVersionId,
              seasonId: reg.seasonId,
              caseId,
              versionNumber: nextVersionNumber,
              predecessorVersionId: version.id,
              preparedBy: accountId,
              state: 'DRAFT',
              shirtNumber: version.shirtNumber,
              playingStart: version.playingStart,
              playingEnd: version.playingEnd,
              nonHomegrownOptIn: version.nonHomegrownOptIn,
              evidenceBranch: version.evidenceBranch,
              qualifyingValue: version.qualifyingValue,
              evidenceSummary: version.evidenceSummary,
              evidenceReference: version.evidenceReference,
              affiliatedAssociationBasis: version.affiliatedAssociationBasis,
              verifiedBy: version.verifiedBy,
              verifiedAt: version.verifiedAt,
              decisionRegulationVersionId: version.decisionRegulationVersionId,
              notes: version.notes,
              createdAt: now,
            },
          });
          const savedCase = await context.db.playerRegistration.update({
            where: { id: caseId },
            data: {
              currentDraftVersionId: nextVersionId,
              revision: { increment: 1 },
              updatedAt: now,
            },
            select: { revision: true },
          });
          await this.audit.append(context, {
            action: 'PLAYER_REGISTRATION_DRAFT_CREATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'PlayerRegistration',
            objectId: caseId,
            seasonId: reg.seasonId,
            outcome: 'SUCCESS',
            after: {
              caseId,
              clubId: reg.clubId,
              playerId: reg.playerId,
              versionId: nextVersionId,
              versionNumber: nextVersionNumber,
              state: 'DRAFT',
            },
          });
          return {
            caseId,
            versionId: nextVersionId,
            versionNumber: nextVersionNumber,
            revision: '1',
            caseRevision: savedCase.revision.toString(),
            state: 'DRAFT',
          };
        }

        // cancel (pre-validity cancellation)
        await requireOpenSeason(context, reg.seasonId);
        if (reg.currentValidatedVersionId) {
          throw conflict(
            'STATE_CONFLICT',
            'Hồ sơ đã được xác nhận hợp lệ; hủy trước hiệu lực thi đấu phải dùng quy trình quản lý kế hoạch.',
          );
        }
        if (!CANCELLABLE_PRE_VALID_STATES.has(version.state)) {
          throw conflict(
            'STATE_CONFLICT',
            'Chỉ có thể hủy phiên bản đăng ký trước khi xác nhận hợp lệ.',
          );
        }
        await context.recheckAuthority();
        const now = await context.now();
        const updated = await context.db.registrationVersion.update({
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
        await context.db.playerRegistration.update({
          where: { id: caseId },
          data: {
            currentDraftVersionId:
              reg.currentDraftVersionId === version.id ? null : reg.currentDraftVersionId,
            revision: { increment: 1 },
            updatedAt: now,
          },
        });
        await this.audit.append(context, {
          action: 'PLAYER_REGISTRATION_CANCELLED',
          actor: { kind: 'ACCOUNT', accountId },
          objectKind: 'PlayerRegistration',
          objectId: caseId,
          seasonId: reg.seasonId,
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
          versionNumber: version.versionNumber,
          revision: updated.revision.toString(),
          state: 'CANCELLED',
        };
      });
    } catch (error) {
      concealMissingRegistration(error);
    }
  }

  private async precheck(
    request: Request,
    caseId: string,
    versionId: string,
    input: PlayerRegistrationActionDto,
  ) {
    const overrides = normalizeDraftFields(input);
    try {
      return await this.execution.execute(
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
            await requireSeasonRegistrationOfficer(context, accountId, reg.seasonId);
          },
        },
        async (context, accountId) => {
          const reg = await context.db.playerRegistration.findUnique({
            where: { id: caseId },
            select: {
              id: true,
              seasonId: true,
              clubId: true,
              playerId: true,
              season: { select: { currentRegulationVersionId: true } },
            },
          });
          if (!reg) throw missing();
          const version = await context.db.registrationVersion.findFirst({
            where: { id: versionId, caseId },
          });
          if (!version) throw missing();

          const now = await context.now();
          const resolvedHg = resolveHomegrownEvidenceInput(version, overrides, {
            accountId,
            now,
            defaultRegulationVersionId: reg.season.currentRegulationVersionId,
          });
          const shirtNumber =
            overrides.shirtNumber !== undefined ? overrides.shirtNumber : version.shirtNumber;
          const playingStart =
            overrides.playingStart !== undefined ? overrides.playingStart : version.playingStart;
          const playingEnd =
            overrides.playingEnd !== undefined ? overrides.playingEnd : version.playingEnd;

          return precheckRegistrationEligibility(context, this.activation, {
            seasonId: reg.seasonId,
            clubId: reg.clubId,
            playerId: reg.playerId,
            registrationId: reg.id,
            versionId: version.id,
            shirtNumber,
            playingStart,
            playingEnd,
            nonHomegrownOptIn: resolvedHg.nonHomegrownOptIn,
            homegrownEvidence: resolvedHg.evidence,
          });
        },
      );
    } catch (error) {
      concealMissingRegistration(error);
    }
  }

  private async confirmValid(
    request: Request,
    caseId: string,
    versionId: string,
    input: PlayerRegistrationActionDto,
  ) {
    const expectedRevision = input.expectedRevision ?? '';
    const reason =
      input.reason === undefined
        ? undefined
        : requiredBoundedText(input.reason, 2000, 'Lý do xác nhận không hợp lệ.');

    const operation = {
      locks: [
        { kind: 'playerRegistration' as const, key: caseId, mode: 'exclusive' as const },
        { kind: 'registrationVersion' as const, key: versionId, mode: 'exclusive' as const },
      ],
      discover: async (db: Prisma.TransactionClient) => {
        const reg = await db.playerRegistration.findUnique({
          where: { id: caseId },
          select: { seasonId: true, playerId: true, clubId: true },
        });
        if (!reg) return [];
        const seasonLocks = await discoverSeasonWithDueRules(db, reg.seasonId, this.activation);
        return [
          ...seasonLocks,
          { kind: 'player' as const, key: reg.playerId, mode: 'exclusive' as const },
          { kind: 'club' as const, key: reg.clubId, mode: 'exclusive' as const },
        ];
      },
      authorize: async (context: TransactionContext, accountId: string) => {
        const reg = await context.db.playerRegistration.findUnique({
          where: { id: caseId },
          select: { seasonId: true },
        });
        if (!reg) throw missing();
        await requireSeasonRegistrationOfficer(context, accountId, reg.seasonId);
      },
    };

    try {
      const critical = await this.execution.executeCritical(
        request,
        operation,
        async (context) => {
          const version = await context.db.registrationVersion.findFirst({
            where: { id: versionId, caseId },
            select: { id: true, seasonId: true, playingStart: true, playingEnd: true },
          });
          if (!version) throw missing();
          if (!version.playingStart) {
            throw conflict(
              'STATE_CONFLICT',
              'Phiên bản đã tiếp nhận chưa có thời điểm bắt đầu hiệu lực thi đấu; vui lòng trả bổ sung để cập nhật.',
            );
          }
          const approvedException = await this.intake.findApprovedException(
            context,
            'PLAYER_REGISTRATION',
            version.seasonId,
            version.id,
          );
          return {
            action: 'PLAYER_REGISTRATION_CONFIRMED',
            targetId: caseId,
            payload: {
              expectedRevision,
              submittedVersionId: versionId,
              playingStart: version.playingStart.toISOString(),
              ...(version.playingEnd ? { playingEnd: version.playingEnd.toISOString() } : {}),
              ...(approvedException ? { receiptExceptionVersionId: approvedException.id } : {}),
              ...(reason ? { reason } : {}),
            },
          };
        },
        async (context, command) => {
          const reg = await context.db.playerRegistration.findUnique({
            where: { id: caseId },
            include: {
              season: { select: { id: true, code: true, name: true } },
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
          if (!reg) throw missing();

          const version = await context.db.registrationVersion.findFirst({
            where: { id: versionId, caseId },
          });
          if (!version) throw missing();
          assertRevision(version.revision, expectedRevision);

          if (reg.currentValidatedVersionId) {
            throw conflict('STATE_CONFLICT', 'Hồ sơ đăng ký cầu thủ này đã được xác nhận hợp lệ.');
          }
          if (version.state !== 'RECEIVED') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể xác nhận hợp lệ phiên bản đang ở trạng thái Đã tiếp nhận.',
            );
          }

          const { regulation, resolvedAt: now } = await resolveEffectiveRegulationWithInstant(
            context,
            reg.seasonId,
            this.activation,
          );

          await assertMastersAvailableForNewUse(context, { clubId: reg.clubId });
          const { receiptExceptionVersionId } = await this.intake.requireTimelyOrApprovedException(
            context,
            'PLAYER_REGISTRATION',
            reg.seasonId,
            version,
          );

          if (!version.playingStart) {
            throw conflict(
              'STATE_CONFLICT',
              'Phiên bản đã tiếp nhận chưa có thời điểm bắt đầu hiệu lực thi đấu; vui lòng trả bổ sung để cập nhật.',
            );
          }
          const effectivePlayingStart = version.playingStart;
          if (effectivePlayingStart.getTime() < now.getTime()) {
            throw conflict(
              'STATE_CONFLICT',
              'Thời điểm bắt đầu hiệu lực thi đấu không thể ở quá khứ so với thời điểm xác nhận.',
            );
          }

          const resolvedHg = resolveHomegrownEvidenceInput(
            version,
            {},
            {
              accountId: command.accountId,
              now,
              defaultRegulationVersionId: regulation.id,
            },
          );

          const assessment = await evaluateRegistrationEligibilityForConfirmation(
            context,
            regulation,
            {
              seasonId: reg.seasonId,
              clubId: reg.clubId,
              playerId: reg.playerId,
              registrationId: reg.id,
              versionId: version.id,
              shirtNumber: version.shirtNumber,
              playingStart: effectivePlayingStart,
              playingEnd: version.playingEnd,
              nonHomegrownOptIn: resolvedHg.nonHomegrownOptIn,
              homegrownEvidence: resolvedHg.evidence,
            },
          );

          if (!assessment.eligibleForConfirmation) {
            throw buildEligibilityRejectionError(assessment);
          }

          const clubParticipationDetails = assessment.criteria.find(
            (c) => c.criterion === 'CLUB_PARTICIPATION',
          )?.details;
          const acceptedApplicationVersionId =
            typeof clubParticipationDetails?.acceptedApplicationVersionId === 'string'
              ? clubParticipationDetails.acceptedApplicationVersionId
              : null;

          const officialSnapshot: Prisma.InputJsonObject = {
            capturedAt: now.toISOString(),
            season: {
              id: reg.season.id,
              code: reg.season.code,
              name: reg.season.name,
            },
            club: {
              id: reg.club.id,
              code: reg.club.code,
              name: reg.club.name,
              abbreviation: reg.club.abbreviation,
              acceptedApplicationVersionId,
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
              caseId: reg.id,
              versionId: version.id,
              versionNumber: version.versionNumber,
              shirtNumber: version.shirtNumber,
              playingStart: effectivePlayingStart.toISOString(),
              playingEnd: version.playingEnd?.toISOString() ?? null,
              u21Finding: assessment.u21Finding,
              homegrownFinding: assessment.homegrownFinding,
              nonHomegrownOptIn: resolvedHg.nonHomegrownOptIn,
            },
            basis: {
              receiptRegulationVersionId: version.receiptRegulationVersionId,
              receiptTimingStatus: version.receiptTimingStatus,
              receiptWindowId: version.receiptWindowId,
              receiptExceptionVersionId,
              decisionRegulationVersionId: regulation.id,
              squadLimit: assessment.squadLimit,
              nonHomegrownLimit: assessment.nonHomegrownLimit,
            },
            criteria: assessment.criteria.map((c) => ({
              criterion: c.criterion,
              status: c.status,
              reason: c.reason,
              regulationVersionId: c.regulationVersionId,
            })),
          };

          const updated = await context.db.registrationVersion.update({
            where: { id: version.id },
            data: {
              state: 'VALID',
              decidedAt: now,
              decidedBy: command.accountId,
              decisionReason: reason ?? null,
              u21Finding: assessment.u21Finding,
              homegrownFinding: assessment.homegrownFinding,
              decisionRegulationVersionId: regulation.id,
              officialSnapshot,
              playingDisposition: 'ACTIVE',
              revision: { increment: 1 },
            },
            select: { revision: true },
          });

          await context.db.playerRegistration.update({
            where: { id: caseId },
            data: {
              currentValidatedVersionId: version.id,
              currentDraftVersionId: null,
              revision: { increment: 1 },
              updatedAt: now,
            },
          });

          await this.audit.append(context, {
            action: 'PLAYER_REGISTRATION_CONFIRMED',
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
              state: version.state,
            },
            after: {
              caseId,
              clubId: reg.clubId,
              playerId: reg.playerId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              state: 'VALID',
              decidedAt: now.toISOString(),
              decisionRegulationVersionId: regulation.id,
              receiptRegulationVersionId: version.receiptRegulationVersionId!,
              receiptExceptionVersionId,
              shirtNumber: version.shirtNumber!,
              playingStart: effectivePlayingStart.toISOString(),
              playingEnd: version.playingEnd?.toISOString() ?? null,
              u21Finding: assessment.u21Finding,
              homegrownFinding: assessment.homegrownFinding,
              nonHomegrownOptIn: resolvedHg.nonHomegrownOptIn,
            },
          });

          return {
            status: 200,
            data: {
              id: caseId,
              revision: updated.revision.toString(),
              relatedId: version.id,
            },
          };
        },
        async (_context, outcome) => outcome,
      );

      return {
        ...critical.data,
        caseId,
        versionId: critical.data.relatedId ?? versionId,
        state: 'VALID',
      };
    } catch (error) {
      concealMissingRegistration(error);
    }
  }
}
