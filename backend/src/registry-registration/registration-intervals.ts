import type { Prisma } from '../generated/prisma/client';

export const SHIRT_NUMBER_MIN = 1;
export const SHIRT_NUMBER_MAX = 99;

export const INACTIVE_PLAYING_DISPOSITIONS = new Set([
  'CANCELLED_BEFORE_EFFECTIVITY',
  'RECORDED_ERRONEOUS',
]);

export type PlayingInterval = {
  start: Date;
  end: Date | null;
};

export type ExistingRegistrationInterval = {
  registrationId: string;
  versionId: string;
  seasonId: string;
  clubId: string;
  playerId: string;
  shirtNumber: number | null;
  playingStart: Date;
  playingEnd: Date | null;
  u21Finding: boolean | null;
  homegrownFinding: boolean | null;
  playingDisposition: string | null;
};

export type PlayerOverlapConflict = {
  registrationId: string;
  versionId: string;
  seasonId: string;
  clubId: string;
  playingStart: string;
  playingEnd: string | null;
  overlapStart: string;
  overlapEnd: string | null;
  crossSeason: boolean;
};

export type ShirtNumberConflict = {
  registrationId: string;
  versionId: string;
  playerId: string;
  shirtNumber: number;
  playingStart: string;
  playingEnd: string | null;
  overlapStart: string;
  overlapEnd: string | null;
};

export type QuotaCompositionBoundary = {
  startsAt: string;
  endsAt: string | null;
  countedSquadSize: number;
  nonHomegrownCount: number;
  u21Count: number;
  squadLimit: number;
  nonHomegrownLimit: number;
  squadExceeded: boolean;
  nonHomegrownExceeded: boolean;
  unresolvedU21Ids: string[];
  unresolvedHomegrownIds: string[];
};

export type QuotaSweepResult = {
  boundaries: QuotaCompositionBoundary[];
  squadBreaches: QuotaCompositionBoundary[];
  nonHomegrownBreaches: QuotaCompositionBoundary[];
  unresolvedU21Ids: string[];
  unresolvedHomegrownIds: string[];
};

export function isActivePlayingDisposition(disposition: string | null | undefined): boolean {
  return (
    disposition === null ||
    disposition === undefined ||
    !INACTIVE_PLAYING_DISPOSITIONS.has(disposition)
  );
}

/** Validates a half-open [start, end) playing interval where end is optional (+infinity). */
export function isValidPlayingInterval(interval: PlayingInterval): boolean {
  const startMs = interval.start.getTime();
  if (!Number.isFinite(startMs)) return false;
  if (interval.end === null) return true;
  const endMs = interval.end.getTime();
  return Number.isFinite(endMs) && endMs > startMs;
}

/** Returns true iff two half-open intervals [start, end) have a non-empty intersection. */
export function intervalsOverlap(a: PlayingInterval, b: PlayingInterval): boolean {
  if (!isValidPlayingInterval(a) || !isValidPlayingInterval(b)) return false;
  const aStart = a.start.getTime();
  const aEnd = a.end === null ? Number.POSITIVE_INFINITY : a.end.getTime();
  const bStart = b.start.getTime();
  const bEnd = b.end === null ? Number.POSITIVE_INFINITY : b.end.getTime();
  return aStart < bEnd && bStart < aEnd;
}

/** Returns the non-empty intersection of two half-open intervals, or null if disjoint/adjacent. */
export function intersectIntervals(a: PlayingInterval, b: PlayingInterval): PlayingInterval | null {
  if (!intervalsOverlap(a, b)) return null;
  const startMs = Math.max(a.start.getTime(), b.start.getTime());
  const aEnd = a.end === null ? Number.POSITIVE_INFINITY : a.end.getTime();
  const bEnd = b.end === null ? Number.POSITIVE_INFINITY : b.end.getTime();
  const endMs = Math.min(aEnd, bEnd);
  return {
    start: new Date(startMs),
    end: Number.isFinite(endMs) ? new Date(endMs) : null,
  };
}

/** Validates D058/FR-016 shirt numbers: integer in [1, 99]. */
export function isValidShirtNumber(shirtNumber: number | null | undefined): shirtNumber is number {
  return (
    typeof shirtNumber === 'number' &&
    Number.isInteger(shirtNumber) &&
    shirtNumber >= SHIRT_NUMBER_MIN &&
    shirtNumber <= SHIRT_NUMBER_MAX
  );
}

/** Finds all competition-wide overlapping playing intervals for the same player (including cross-season). */
export function findPlayerOverlapConflicts(
  candidate: {
    playerId: string;
    seasonId: string;
    playingStart: Date;
    playingEnd: Date | null;
    excludeRegistrationIds?: readonly string[];
  },
  existingCompetitionRegistrations: readonly ExistingRegistrationInterval[],
): PlayerOverlapConflict[] {
  const candidateInterval: PlayingInterval = {
    start: candidate.playingStart,
    end: candidate.playingEnd,
  };
  if (!isValidPlayingInterval(candidateInterval)) return [];
  const excluded = new Set(candidate.excludeRegistrationIds ?? []);
  const conflicts: PlayerOverlapConflict[] = [];

  for (const row of existingCompetitionRegistrations) {
    if (row.playerId !== candidate.playerId) continue;
    if (excluded.has(row.registrationId)) continue;
    if (!isActivePlayingDisposition(row.playingDisposition)) continue;
    const overlap = intersectIntervals(candidateInterval, {
      start: row.playingStart,
      end: row.playingEnd,
    });
    if (!overlap) continue;
    conflicts.push({
      registrationId: row.registrationId,
      versionId: row.versionId,
      seasonId: row.seasonId,
      clubId: row.clubId,
      playingStart: row.playingStart.toISOString(),
      playingEnd: row.playingEnd ? row.playingEnd.toISOString() : null,
      overlapStart: overlap.start.toISOString(),
      overlapEnd: overlap.end ? overlap.end.toISOString() : null,
      crossSeason: row.seasonId !== candidate.seasonId,
    });
  }

  return conflicts.sort(
    (a, b) =>
      a.overlapStart.localeCompare(b.overlapStart) ||
      a.registrationId.localeCompare(b.registrationId),
  );
}

/** Finds all overlapping shirt-number allocations in the same club-season (including U21 and future plans). */
export function findShirtNumberConflicts(
  candidate: {
    seasonId: string;
    clubId: string;
    shirtNumber: number;
    playingStart: Date;
    playingEnd: Date | null;
    excludeRegistrationIds?: readonly string[];
  },
  existingClubSeasonRegistrations: readonly ExistingRegistrationInterval[],
): ShirtNumberConflict[] {
  const candidateInterval: PlayingInterval = {
    start: candidate.playingStart,
    end: candidate.playingEnd,
  };
  if (!isValidPlayingInterval(candidateInterval) || !isValidShirtNumber(candidate.shirtNumber)) {
    return [];
  }
  const excluded = new Set(candidate.excludeRegistrationIds ?? []);
  const conflicts: ShirtNumberConflict[] = [];

  for (const row of existingClubSeasonRegistrations) {
    if (row.seasonId !== candidate.seasonId || row.clubId !== candidate.clubId) continue;
    if (excluded.has(row.registrationId)) continue;
    if (!isActivePlayingDisposition(row.playingDisposition)) continue;
    if (row.shirtNumber !== candidate.shirtNumber) continue;
    const overlap = intersectIntervals(candidateInterval, {
      start: row.playingStart,
      end: row.playingEnd,
    });
    if (!overlap) continue;
    conflicts.push({
      registrationId: row.registrationId,
      versionId: row.versionId,
      playerId: row.playerId,
      shirtNumber: row.shirtNumber,
      playingStart: row.playingStart.toISOString(),
      playingEnd: row.playingEnd ? row.playingEnd.toISOString() : null,
      overlapStart: overlap.start.toISOString(),
      overlapEnd: overlap.end ? overlap.end.toISOString() : null,
    });
  }

  return conflicts.sort(
    (a, b) =>
      a.overlapStart.localeCompare(b.overlapStart) ||
      a.registrationId.localeCompare(b.registrationId),
  );
}

/**
 * Sweeps every composition boundary across [candidate.playingStart, candidate.playingEnd),
 * including confirmed future registrations, and checks squad and non-homegrown limits.
 */
export function evaluateQuotaAcrossIntervals(
  candidate: {
    playingStart: Date;
    playingEnd: Date | null;
    u21: boolean;
    homegrown: boolean | null;
    excludeRegistrationIds?: readonly string[];
  },
  existingClubSeasonRegistrations: readonly ExistingRegistrationInterval[],
  limits: { squadLimit: number; nonHomegrownLimit: number },
): QuotaSweepResult {
  const candidateInterval: PlayingInterval = {
    start: candidate.playingStart,
    end: candidate.playingEnd,
  };
  if (!isValidPlayingInterval(candidateInterval)) {
    return {
      boundaries: [],
      squadBreaches: [],
      nonHomegrownBreaches: [],
      unresolvedU21Ids: [],
      unresolvedHomegrownIds: [],
    };
  }

  const excluded = new Set(candidate.excludeRegistrationIds ?? []);
  const candidateStartMs = candidate.playingStart.getTime();
  const candidateEndMs =
    candidate.playingEnd === null ? Number.POSITIVE_INFINITY : candidate.playingEnd.getTime();

  const overlappingExisting = existingClubSeasonRegistrations.filter((row) => {
    if (excluded.has(row.registrationId)) return false;
    if (!isActivePlayingDisposition(row.playingDisposition)) return false;
    return intervalsOverlap(candidateInterval, { start: row.playingStart, end: row.playingEnd });
  });

  const pointSet = new Set<number>([candidateStartMs]);
  for (const row of overlappingExisting) {
    const startMs = row.playingStart.getTime();
    if (startMs > candidateStartMs && startMs < candidateEndMs) pointSet.add(startMs);
    if (row.playingEnd !== null) {
      const endMs = row.playingEnd.getTime();
      if (endMs > candidateStartMs && endMs < candidateEndMs) pointSet.add(endMs);
    }
  }
  const points = [...pointSet].sort((a, b) => a - b);

  const boundaries: QuotaCompositionBoundary[] = [];
  const allUnresolvedU21 = new Set<string>();
  const allUnresolvedHomegrown = new Set<string>();

  for (let i = 0; i < points.length; i++) {
    const segStartMs = points[i];
    const nextPointMs = i + 1 < points.length ? points[i + 1] : null;
    const segEndMs =
      nextPointMs !== null
        ? nextPointMs
        : candidate.playingEnd !== null
          ? candidate.playingEnd.getTime()
          : null;

    let countedSquadSize = 0;
    let nonHomegrownCount = 0;
    let u21Count = 0;
    const unresolvedU21InSegment: string[] = [];
    const unresolvedHgInSegment: string[] = [];

    for (const row of overlappingExisting) {
      const rowStartMs = row.playingStart.getTime();
      const rowEndMs =
        row.playingEnd === null ? Number.POSITIVE_INFINITY : row.playingEnd.getTime();
      if (rowStartMs > segStartMs || rowEndMs <= segStartMs) continue;

      if (row.u21Finding === null) {
        unresolvedU21InSegment.push(row.registrationId);
        allUnresolvedU21.add(row.registrationId);
        continue;
      }
      if (row.u21Finding) {
        u21Count++;
      } else {
        countedSquadSize++;
        if (row.homegrownFinding === null) {
          unresolvedHgInSegment.push(row.registrationId);
          allUnresolvedHomegrown.add(row.registrationId);
        } else if (!row.homegrownFinding) {
          nonHomegrownCount++;
        }
      }
    }

    if (candidate.u21) {
      u21Count++;
    } else {
      countedSquadSize++;
      if (candidate.homegrown === false) nonHomegrownCount++;
    }

    boundaries.push({
      startsAt: new Date(segStartMs).toISOString(),
      endsAt: segEndMs === null ? null : new Date(segEndMs).toISOString(),
      countedSquadSize,
      nonHomegrownCount,
      u21Count,
      squadLimit: limits.squadLimit,
      nonHomegrownLimit: limits.nonHomegrownLimit,
      squadExceeded: countedSquadSize > limits.squadLimit,
      nonHomegrownExceeded: nonHomegrownCount > limits.nonHomegrownLimit,
      unresolvedU21Ids: unresolvedU21InSegment.sort(),
      unresolvedHomegrownIds: unresolvedHgInSegment.sort(),
    });
  }

  return {
    boundaries,
    squadBreaches: boundaries.filter((b) => b.squadExceeded),
    nonHomegrownBreaches: boundaries.filter((b) => b.nonHomegrownExceeded),
    unresolvedU21Ids: [...allUnresolvedU21].sort(),
    unresolvedHomegrownIds: [...allUnresolvedHomegrown].sort(),
  };
}

/** Loads persisted validated intervals for competition-wide player overlap and club-season quota/shirt checks. */
export async function loadCompetitionAndClubIntervals(
  db: Prisma.TransactionClient,
  params: {
    seasonId: string;
    clubId: string;
    playerId: string;
    excludeRegistrationIds?: readonly string[];
  },
): Promise<{
  existingPlayerIntervals: ExistingRegistrationInterval[];
  existingClubSeasonIntervals: ExistingRegistrationInterval[];
}> {
  const excludeFilter = params.excludeRegistrationIds?.length
    ? { id: { notIn: [...params.excludeRegistrationIds] } }
    : {};

  const select = {
    id: true,
    seasonId: true,
    clubId: true,
    playerId: true,
    currentValidatedVersion: {
      select: {
        id: true,
        state: true,
        shirtNumber: true,
        playingStart: true,
        playingEnd: true,
        u21Finding: true,
        homegrownFinding: true,
        playingDisposition: true,
      },
    },
  } as const;

  const [playerRows, clubRows] = await Promise.all([
    db.playerRegistration.findMany({
      where: {
        playerId: params.playerId,
        currentValidatedVersionId: { not: null },
        ...excludeFilter,
      },
      select,
      orderBy: { id: 'asc' },
    }),
    db.playerRegistration.findMany({
      where: {
        seasonId: params.seasonId,
        clubId: params.clubId,
        currentValidatedVersionId: { not: null },
        ...excludeFilter,
      },
      select,
      orderBy: { id: 'asc' },
    }),
  ]);

  const mapRows = (rows: typeof playerRows): ExistingRegistrationInterval[] => {
    const mapped: ExistingRegistrationInterval[] = [];
    for (const row of rows) {
      const version = row.currentValidatedVersion;
      if (!version || version.state !== 'VALID' || !version.playingStart) continue;
      mapped.push({
        registrationId: row.id,
        versionId: version.id,
        seasonId: row.seasonId,
        clubId: row.clubId,
        playerId: row.playerId,
        shirtNumber: version.shirtNumber,
        playingStart: version.playingStart,
        playingEnd: version.playingEnd,
        u21Finding: version.u21Finding,
        homegrownFinding: version.homegrownFinding,
        playingDisposition: version.playingDisposition,
      });
    }
    return mapped;
  };

  return {
    existingPlayerIntervals: mapRows(playerRows),
    existingClubSeasonIntervals: mapRows(clubRows),
  };
}
