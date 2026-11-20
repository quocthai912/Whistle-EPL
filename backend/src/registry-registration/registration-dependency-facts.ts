import type { Prisma } from '../generated/prisma/client';
import type { LockResource, TransactionContext } from '../platform/transaction-context';
import type {
  DependencyModuleRegistration,
  DependencyProvider,
  RegistrationIntervalComposition,
} from '../season-regulations/season-dependencies.port';

type ActiveValidatedRegistration = {
  id: string;
  revision: bigint;
  clubId: string;
  playerId: string;
  version: {
    id: string;
    revision: bigint;
    playingStart: Date;
    playingEnd: Date | null;
    u21Finding: boolean | null;
    homegrownFinding: boolean | null;
    playingDisposition: string | null;
  };
};

const INACTIVE_DISPOSITIONS = new Set(['CANCELLED_BEFORE_EFFECTIVITY', 'RECORDED_ERRONEOUS']);

function isActivePlayingDisposition(disposition: string | null): boolean {
  return disposition === null || !INACTIVE_DISPOSITIONS.has(disposition);
}

/** Partitions validated playing intervals into consecutive half-open composition windows. */
export function buildIntervalCompositions(
  registrations: readonly ActiveValidatedRegistration[],
  now: Date,
): RegistrationIntervalComposition[] {
  const effective = registrations.filter((row) =>
    isActivePlayingDisposition(row.version.playingDisposition),
  );
  if (!effective.length) return [];

  const boundarySet = new Set<number>();
  for (const row of effective) {
    boundarySet.add(row.version.playingStart.getTime());
    if (row.version.playingEnd) boundarySet.add(row.version.playingEnd.getTime());
  }
  const points = [...boundarySet].sort((a, b) => a - b);
  const nowMs = now.getTime();
  const compositions: RegistrationIntervalComposition[] = [];

  for (let i = 0; i < points.length; i++) {
    const startMs = points[i];
    const endMs = i + 1 < points.length ? points[i + 1] : null;
    const activeInWindow = effective.filter((row) => {
      const s = row.version.playingStart.getTime();
      const e = row.version.playingEnd
        ? row.version.playingEnd.getTime()
        : Number.POSITIVE_INFINITY;
      return s <= startMs && e > startMs;
    });
    if (!activeInWindow.length) continue;
    compositions.push({
      startsAt: new Date(startMs).toISOString(),
      endsAt: endMs === null ? null : new Date(endMs).toISOString(),
      registrations: activeInWindow
        .slice()
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((row) => ({
          registrationId: row.id,
          versionId: row.version.id,
          playerId: row.playerId,
          clubId: row.clubId,
          source:
            row.version.playingStart.getTime() > nowMs
              ? 'CONFIRMED_FUTURE_PLAN'
              : 'VALIDATED_REGISTRATION',
          u21: row.version.u21Finding,
          homegrown: row.version.homegrownFinding,
        })),
    });
  }
  return compositions;
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export const registrationCompatibilityProvider: DependencyProvider<'registrationCompatibility'> = {
  async discoverLocks(db, request) {
    const rows = await db.playerRegistration.findMany({
      where: { seasonId: request.seasonId, currentValidatedVersionId: { not: null } },
      select: { id: true, currentValidatedVersionId: true },
    });
    const locks: LockResource[] = [{ kind: 'season', key: request.seasonId, mode: 'shared' }];
    for (const row of rows) {
      locks.push({ kind: 'playerRegistration', key: row.id, mode: 'shared' });
      if (row.currentValidatedVersionId) {
        locks.push({
          kind: 'registrationVersion',
          key: row.currentValidatedVersionId,
          mode: 'shared',
        });
      }
    }
    return locks;
  },

  async read(context, request) {
    const rows = await context.db.playerRegistration.findMany({
      where: { seasonId: request.seasonId, currentValidatedVersionId: { not: null } },
      select: {
        id: true,
        revision: true,
        clubId: true,
        playerId: true,
        currentValidatedVersion: {
          select: {
            id: true,
            revision: true,
            state: true,
            playingStart: true,
            playingEnd: true,
            u21Finding: true,
            homegrownFinding: true,
            playingDisposition: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const active: ActiveValidatedRegistration[] = [];
    const revParts: string[] = [];
    for (const row of rows) {
      const version = row.currentValidatedVersion;
      if (!version || version.state !== 'VALID' || !version.playingStart) continue;
      revParts.push(`${row.id}:${row.revision}:${version.revision}`);
      active.push({
        id: row.id,
        revision: row.revision,
        clubId: row.clubId,
        playerId: row.playerId,
        version: {
          id: version.id,
          revision: version.revision,
          playingStart: version.playingStart,
          playingEnd: version.playingEnd,
          u21Finding: version.u21Finding,
          homegrownFinding: version.homegrownFinding,
          playingDisposition: version.playingDisposition,
        },
      });
    }

    const now = await context.now();
    const intervalCompositions = buildIntervalCompositions(active, now);
    const references = uniqueSorted(
      intervalCompositions.flatMap((comp) =>
        comp.registrations.flatMap((entry) => [
          entry.registrationId,
          entry.versionId,
          entry.playerId,
          entry.clubId,
        ]),
      ),
    );
    return {
      facts: { intervalCompositions },
      basis: {
        owner: 'registry-registration',
        sourceRevision: revParts.length ? revParts.join('|') : '0',
        references,
      },
    };
  },
};

export type RegistrationClosingFacts = {
  pendingRequests: readonly {
    kind:
      'CLUB_APPLICATION' | 'PLAYER_REGISTRATION' | 'RECEIPT_EXCEPTION' | 'REGISTRATION_CORRECTION';
    id: string;
  }[];
  waitingEffects: readonly { kind: 'REGISTRATION'; versionId: string }[];
  playingIntervals: readonly { registrationId: string; playingEnd: string | null }[];
  unresolvedFuturePlans: readonly { registrationId: string; versionId: string; startsAt: string }[];
  sourceRevision: string;
  references: readonly string[];
};

export const registrationClosingFactsProvider = {
  async discoverLocks(
    db: Prisma.TransactionClient,
    request: { seasonId: string },
  ): Promise<readonly LockResource[]> {
    const [apps, regs, exceptions, corrections] = await Promise.all([
      db.clubApplication.findMany({ where: { seasonId: request.seasonId }, select: { id: true } }),
      db.playerRegistration.findMany({
        where: { seasonId: request.seasonId },
        select: { id: true, currentValidatedVersionId: true },
      }),
      db.receiptExceptionCase.findMany({
        where: { seasonId: request.seasonId },
        select: { id: true },
      }),
      db.registrationCorrectionCase.findMany({
        where: { seasonId: request.seasonId },
        select: { id: true },
      }),
    ]);
    const locks: LockResource[] = [{ kind: 'season', key: request.seasonId, mode: 'shared' }];
    for (const app of apps) locks.push({ kind: 'clubApplication', key: app.id, mode: 'shared' });
    for (const reg of regs) {
      locks.push({ kind: 'playerRegistration', key: reg.id, mode: 'shared' });
      if (reg.currentValidatedVersionId) {
        locks.push({
          kind: 'registrationVersion',
          key: reg.currentValidatedVersionId,
          mode: 'shared',
        });
      }
    }
    for (const ex of exceptions)
      locks.push({ kind: 'receiptExceptionCase', key: ex.id, mode: 'shared' });
    for (const corr of corrections)
      locks.push({ kind: 'registrationCorrectionCase', key: corr.id, mode: 'shared' });
    return locks;
  },

  async read(
    context: TransactionContext,
    request: { seasonId: string },
  ): Promise<RegistrationClosingFacts> {
    const locks = await this.discoverLocks(context.db, request);
    context.assertLockCoverage(locks);
    const now = await context.now();
    const [pendingApps, pendingRegs, pendingExceptions, pendingCorrections, validatedRegs] =
      await Promise.all([
        context.db.clubApplicationVersion.findMany({
          where: {
            seasonId: request.seasonId,
            state: { in: ['RECEIVED', 'PENDING_APPROVAL'] },
          },
          select: { id: true, caseId: true },
        }),
        context.db.registrationVersion.findMany({
          where: { seasonId: request.seasonId, state: 'RECEIVED' },
          select: { id: true, caseId: true },
        }),
        context.db.receiptExceptionVersion.findMany({
          where: { seasonId: request.seasonId, state: 'SUBMITTED' },
          select: { id: true, caseId: true },
        }),
        context.db.registrationCorrectionVersion.findMany({
          where: { seasonId: request.seasonId, state: 'SUBMITTED' },
          select: { id: true, caseId: true },
        }),
        context.db.playerRegistration.findMany({
          where: { seasonId: request.seasonId, currentValidatedVersionId: { not: null } },
          select: {
            id: true,
            revision: true,
            currentValidatedVersion: {
              select: {
                id: true,
                revision: true,
                state: true,
                playingStart: true,
                playingEnd: true,
                playingDisposition: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        }),
      ]);

    const pendingRequests = [
      ...pendingApps.map((row) => ({ kind: 'CLUB_APPLICATION' as const, id: row.caseId })),
      ...pendingRegs.map((row) => ({ kind: 'PLAYER_REGISTRATION' as const, id: row.caseId })),
      ...pendingExceptions.map((row) => ({ kind: 'RECEIPT_EXCEPTION' as const, id: row.caseId })),
      ...pendingCorrections.map((row) => ({
        kind: 'REGISTRATION_CORRECTION' as const,
        id: row.caseId,
      })),
    ];

    const playingIntervals: { registrationId: string; playingEnd: string | null }[] = [];
    const unresolvedFuturePlans: { registrationId: string; versionId: string; startsAt: string }[] =
      [];
    const waitingEffects: { kind: 'REGISTRATION'; versionId: string }[] = [];
    const references: string[] = pendingRequests.map((item) => item.id);
    const revParts: string[] = [];

    for (const reg of validatedRegs) {
      const version = reg.currentValidatedVersion;
      if (!version || version.state !== 'VALID' || !version.playingStart) continue;
      if (!isActivePlayingDisposition(version.playingDisposition)) continue;
      revParts.push(`${reg.id}:${reg.revision}:${version.revision}`);
      references.push(reg.id, version.id);
      if (version.playingStart.getTime() > now.getTime()) {
        unresolvedFuturePlans.push({
          registrationId: reg.id,
          versionId: version.id,
          startsAt: version.playingStart.toISOString(),
        });
        waitingEffects.push({ kind: 'REGISTRATION', versionId: version.id });
      } else {
        playingIntervals.push({
          registrationId: reg.id,
          playingEnd: version.playingEnd ? version.playingEnd.toISOString() : null,
        });
      }
    }

    return {
      pendingRequests,
      waitingEffects,
      playingIntervals,
      unresolvedFuturePlans,
      sourceRevision: revParts.length ? revParts.join('|') : '0',
      references: uniqueSorted(references),
    };
  },
};

export type MasterImpactResourceKind = 'CLUB' | 'STADIUM' | 'PLAYER';

async function collectAffectedMasterImpactIds(
  db: Prisma.TransactionClient,
  request: { seasonId: string; resourceKind: MasterImpactResourceKind; resourceId: string },
): Promise<{ applicationIds: string[]; registrationIds: string[] }> {
  if (request.resourceKind === 'CLUB') {
    const [apps, regs] = await Promise.all([
      db.clubApplication.findMany({
        where: { seasonId: request.seasonId, clubId: request.resourceId },
        select: { id: true },
      }),
      db.playerRegistration.findMany({
        where: { seasonId: request.seasonId, clubId: request.resourceId },
        select: { id: true },
      }),
    ]);
    return {
      applicationIds: uniqueSorted(apps.map((row) => row.id)),
      registrationIds: uniqueSorted(regs.map((row) => row.id)),
    };
  }
  if (request.resourceKind === 'STADIUM') {
    const versions = await db.clubApplicationVersion.findMany({
      where: { seasonId: request.seasonId, homeStadiumId: request.resourceId },
      select: { caseId: true },
      distinct: ['caseId'],
    });
    return {
      applicationIds: uniqueSorted(versions.map((row) => row.caseId)),
      registrationIds: [],
    };
  }
  const [proposed, regs] = await Promise.all([
    db.proposedPlayerItem.findMany({
      where: {
        playerId: request.resourceId,
        applicationVersion: { seasonId: request.seasonId },
      },
      select: { applicationVersion: { select: { caseId: true } } },
    }),
    db.playerRegistration.findMany({
      where: { seasonId: request.seasonId, playerId: request.resourceId },
      select: { id: true },
    }),
  ]);
  return {
    applicationIds: uniqueSorted(proposed.map((row) => row.applicationVersion.caseId)),
    registrationIds: uniqueSorted(regs.map((row) => row.id)),
  };
}

export const registrationMasterImpactProvider = {
  async discoverLocks(
    db: Prisma.TransactionClient,
    request: { seasonId: string; resourceKind: MasterImpactResourceKind; resourceId: string },
  ): Promise<readonly LockResource[]> {
    const { applicationIds, registrationIds } = await collectAffectedMasterImpactIds(db, request);
    const locks: LockResource[] = [
      { kind: 'season', key: request.seasonId, mode: 'shared' },
      {
        kind:
          request.resourceKind === 'CLUB'
            ? 'club'
            : request.resourceKind === 'STADIUM'
              ? 'stadium'
              : 'player',
        key: request.resourceId,
        mode: 'shared',
      },
      ...applicationIds.map((id) => ({
        kind: 'clubApplication' as const,
        key: id,
        mode: 'shared' as const,
      })),
      ...registrationIds.map((id) => ({
        kind: 'playerRegistration' as const,
        key: id,
        mode: 'shared' as const,
      })),
    ];
    return locks;
  },

  async read(
    context: TransactionContext,
    request: { seasonId: string; resourceKind: MasterImpactResourceKind; resourceId: string },
  ) {
    const locks = await this.discoverLocks(context.db, request);
    context.assertLockCoverage(locks);
    const { applicationIds, registrationIds } = await collectAffectedMasterImpactIds(
      context.db,
      request,
    );
    const sorted = uniqueSorted([...applicationIds, ...registrationIds]);
    return {
      facts: {
        affected: sorted.map((id) => ({ kind: 'REGISTRATION' as const, id })),
      },
      basis: {
        owner: 'registry-registration' as const,
        sourceRevision: String(sorted.length),
        references: sorted,
      },
    };
  },
};

export const registrationPublicMediaBasisProvider = {
  async discoverLocks(
    db: Prisma.TransactionClient,
    request: { seasonId: string; ownerKind: 'CLUB' | 'PLAYER'; ownerId: string },
  ): Promise<readonly LockResource[]> {
    const locks: LockResource[] = [
      { kind: 'season', key: request.seasonId, mode: 'shared' },
      {
        kind: request.ownerKind === 'CLUB' ? 'club' : 'player',
        key: request.ownerId,
        mode: 'shared',
      },
    ];
    if (request.ownerKind === 'CLUB') {
      const app = await db.clubApplication.findUnique({
        where: { seasonId_clubId: { seasonId: request.seasonId, clubId: request.ownerId } },
        select: { id: true },
      });
      if (app) locks.push({ kind: 'clubApplication', key: app.id, mode: 'shared' });
    } else {
      const regs = await db.playerRegistration.findMany({
        where: {
          seasonId: request.seasonId,
          playerId: request.ownerId,
          currentValidatedVersionId: { not: null },
        },
        select: { id: true },
      });
      for (const reg of regs)
        locks.push({ kind: 'playerRegistration', key: reg.id, mode: 'shared' });
    }
    return locks;
  },

  async read(
    context: TransactionContext,
    request: { seasonId: string; ownerKind: 'CLUB' | 'PLAYER'; ownerId: string },
  ): Promise<{ eligible: boolean; basisReference: string | null }> {
    const locks = await this.discoverLocks(context.db, request);
    context.assertLockCoverage(locks);
    if (request.ownerKind === 'CLUB') {
      const app = await context.db.clubApplication.findUnique({
        where: { seasonId_clubId: { seasonId: request.seasonId, clubId: request.ownerId } },
        select: { currentAcceptedVersionId: true },
      });
      return {
        eligible: !!app?.currentAcceptedVersionId,
        basisReference: app?.currentAcceptedVersionId ?? null,
      };
    }
    const reg = await context.db.playerRegistration.findFirst({
      where: {
        seasonId: request.seasonId,
        playerId: request.ownerId,
        currentValidatedVersionId: { not: null },
        currentValidatedVersion: {
          state: 'VALID',
          OR: [
            { playingDisposition: null },
            { playingDisposition: { notIn: [...INACTIVE_DISPOSITIONS] } },
          ],
        },
      },
      orderBy: { id: 'asc' },
      select: { currentValidatedVersionId: true },
    });
    return {
      eligible: !!reg?.currentValidatedVersionId,
      basisReference: reg?.currentValidatedVersionId ?? null,
    };
  },
};

/** Installed in AppModule before exposing PHASE 3 writers so PHASE 2 compatibility checks read live data. */
export const registryRegistrationDependencyModule: DependencyModuleRegistration = {
  writer: 'registry-registration',
  providers: {
    registrationCompatibility: registrationCompatibilityProvider,
  },
};
