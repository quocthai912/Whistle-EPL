import type { Prisma } from '../generated/prisma/client';
import {
  normalizeLockResources,
  type LockResource,
  type TransactionContext,
} from '../platform/transaction-context';
import {
  dependencyKinds,
  dependencySources,
  type DependencyDiscovery,
  type DependencyFactBasis,
  type DependencyFactsMap,
  type DependencyKind,
  type DependencyModuleRegistration,
  type DependencyProvider,
  type DependencyProviderMap,
  type DependencyRequestMap,
  type DependencyResult,
  type DependencyUnavailableCause,
  type DependencyWriter,
  type RelationCatalog,
  type SeasonSummaryFacts,
  type SeasonSummarySourceSnapshot,
  type SeasonDependenciesPort,
} from './season-dependencies.port';

const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const writers: readonly DependencyWriter[] = [
  'registry-registration',
  'scheduling',
  'match-results',
  'statistics-reporting',
  'public-queries',
];
const requestFields: Record<DependencyKind, readonly string[]> = {
  registrationCompatibility: ['seasonId', 'candidateVersionId'],
  scheduleFreeze: ['seasonId', 'candidateVersionId'],
  officialResultFreeze: ['seasonId', 'candidateVersionId'],
  referencedCatalogUsage: ['seasonId', 'candidateVersionId', 'catalogCodes'],
  masterImpact: ['seasonId', 'candidateVersionId', 'resourceKind', 'resourceId'],
  publicMediaScope: ['seasonId', 'ownerKind', 'ownerId'],
  seasonSummary: ['seasonId'],
  seasonClosingReadiness: ['seasonId'],
};

/** Reads only PostgreSQL's catalog for fixed, code-owned public table names. */
export class PostgresRelationCatalog implements RelationCatalog {
  async existing(
    db: Prisma.TransactionClient,
    expectedRelations: readonly string[],
  ): Promise<readonly string[]> {
    const present: string[] = [];
    for (const relation of expectedRelations) {
      const rows = await db.$queryRaw<Array<{ exists: boolean }>>`
        SELECT to_regclass(${`public.${relation}`}) IS NOT NULL AS exists
      `;
      if (rows[0]?.exists === true) present.push(relation);
    }
    return present;
  }
}

export type SeasonDependenciesOptions = {
  /** Static application module registration; never environment or request configuration. */
  registeredWriters: readonly DependencyWriter[];
  providers?: DependencyProviderMap;
  relationCatalog?: RelationCatalog;
};

/** Combines writer/provider registrations from imported code modules; duplicate registrations fail. */
export function registerDependencyModules(
  modules: readonly DependencyModuleRegistration[],
): Pick<SeasonDependenciesOptions, 'registeredWriters' | 'providers'> {
  const registeredWriters = new Set<DependencyWriter>();
  const providers: Partial<Record<DependencyKind, unknown>> = {};
  for (const module of modules) {
    if (registeredWriters.has(module.writer))
      throw new Error('A dependency writer module can be registered only once.');
    registeredWriters.add(module.writer);
    for (const kind of dependencyKinds) {
      const provider = module.providers?.[kind];
      if (provider) {
        if (dependencySources[kind].owner !== module.writer)
          throw new Error(`A ${kind} provider must be registered by its owning writer.`);
        if (providers[kind]) throw new Error('A dependency provider can be registered only once.');
        providers[kind] = provider;
      }
    }
  }
  return {
    registeredWriters: [...registeredWriters],
    providers: providers as DependencyProviderMap,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID4.test(value);
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  return (
    Object.keys(value).length === expected.length &&
    Object.keys(value).every((key) => expected.includes(key))
  );
}

function validRequest<K extends DependencyKind>(
  kind: K,
  value: unknown,
): value is DependencyRequestMap[K] {
  if (!isRecord(value) || !exactKeys(value, requestFields[kind])) return false;
  if (!isUuid(value.seasonId)) return false;
  switch (kind) {
    case 'registrationCompatibility':
    case 'scheduleFreeze':
    case 'officialResultFreeze':
      return isUuid(value.candidateVersionId);
    case 'referencedCatalogUsage':
      return (
        isUuid(value.candidateVersionId) &&
        Array.isArray(value.catalogCodes) &&
        value.catalogCodes.every(
          (code) => typeof code === 'string' && /^[A-Z0-9_-]{1,32}$/.test(code),
        )
      );
    case 'masterImpact':
      return (
        isUuid(value.candidateVersionId) &&
        isUuid(value.resourceId) &&
        ['CLUB', 'STADIUM'].includes(String(value.resourceKind))
      );
    case 'publicMediaScope':
      return isUuid(value.ownerId) && ['CLUB', 'PLAYER'].includes(String(value.ownerKind));
    case 'seasonSummary':
      return true;
    case 'seasonClosingReadiness':
      return true;
  }
}

function validReferences(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isUuid);
}

function validUniqueReferences(value: unknown): value is readonly string[] {
  return validReferences(value) && new Set(value).size === value.length;
}

function validInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function validSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value);
}

function validImmutableJson(value: unknown): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(validImmutableJson);
  if (!isRecord(value)) return false;
  return Object.values(value).every(validImmutableJson);
}

function validSummarySnapshot(value: unknown): value is SeasonSummarySourceSnapshot {
  if (!isRecord(value) || !exactKeys(value, ['basis', 'content'])) return false;
  const basis = value.basis;
  const content = value.content;
  return (
    isRecord(basis) &&
    exactKeys(basis, [
      'regulationVersionId',
      'officialReportVersionIds',
      'rankingResolutionVersionIds',
    ]) &&
    isUuid(basis.regulationVersionId) &&
    validUniqueReferences(basis.officialReportVersionIds) &&
    validUniqueReferences(basis.rankingResolutionVersionIds) &&
    isRecord(content) &&
    Object.keys(content).length > 0 &&
    validImmutableJson(content)
  );
}

function validSummaryFacts(value: unknown): value is SeasonSummaryFacts {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      'caseExists',
      'caseId',
      'currentConfirmedVersionId',
      'currentVersionState',
      'currentStatisticsRevision',
      'basisStatisticsRevision',
      'sourceSnapshot',
      'needsReconfirmation',
    ])
  )
    return false;
  if (
    typeof value.caseExists !== 'boolean' ||
    (value.caseId !== null && !isUuid(value.caseId)) ||
    (value.currentConfirmedVersionId !== null && !isUuid(value.currentConfirmedVersionId)) ||
    (value.currentVersionState !== null && typeof value.currentVersionState !== 'string') ||
    typeof value.currentStatisticsRevision !== 'string' ||
    !/^\d+$/.test(value.currentStatisticsRevision) ||
    (value.basisStatisticsRevision !== null &&
      (typeof value.basisStatisticsRevision !== 'string' ||
        !/^\d+$/.test(value.basisStatisticsRevision))) ||
    typeof value.needsReconfirmation !== 'boolean' ||
    (!value.caseExists && value.caseId !== null) ||
    (value.caseExists && !isUuid(value.caseId)) ||
    (!value.currentConfirmedVersionId &&
      (value.currentVersionState !== null ||
        value.basisStatisticsRevision !== null ||
        value.sourceSnapshot !== null))
  )
    return false;
  return (
    value.currentConfirmedVersionId === null ||
    (value.currentVersionState === 'CONFIRMED' &&
      typeof value.basisStatisticsRevision === 'string' &&
      validSummarySnapshot(value.sourceSnapshot))
  );
}

function validRegistrationComposition(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !exactKeys(value, ['startsAt', 'endsAt', 'registrations']) ||
    !validInstant(value.startsAt) ||
    (value.endsAt !== null && !validInstant(value.endsAt)) ||
    (value.endsAt !== null && Date.parse(value.endsAt) <= Date.parse(value.startsAt)) ||
    !Array.isArray(value.registrations) ||
    value.registrations.length === 0
  )
    return false;
  return value.registrations.every(
    (registration) =>
      isRecord(registration) &&
      exactKeys(registration, [
        'registrationId',
        'versionId',
        'playerId',
        'clubId',
        'source',
        'u21',
        'homegrown',
      ]) &&
      isUuid(registration.registrationId) &&
      isUuid(registration.versionId) &&
      isUuid(registration.playerId) &&
      isUuid(registration.clubId) &&
      ['VALIDATED_REGISTRATION', 'CONFIRMED_FUTURE_PLAN'].includes(String(registration.source)) &&
      (registration.u21 === null || typeof registration.u21 === 'boolean') &&
      (registration.homegrown === null || typeof registration.homegrown === 'boolean'),
  );
}

function validScheduleFreeze(value: Record<string, unknown>): boolean {
  if (
    !exactKeys(value, [
      'initialApprovalVersionId',
      'frozenAt',
      'structure',
      'planning',
      'affectedScheduleVersionIds',
    ])
  )
    return false;
  if (!validUniqueReferences(value.affectedScheduleVersionIds)) return false;
  if (value.initialApprovalVersionId === null)
    return (
      value.frozenAt === null &&
      value.structure === null &&
      value.planning === null &&
      value.affectedScheduleVersionIds.length === 0
    );
  const structure = value.structure;
  const planning = value.planning;
  return (
    isUuid(value.initialApprovalVersionId) &&
    validInstant(value.frozenAt) &&
    isRecord(structure) &&
    exactKeys(structure, ['clubCount', 'formatCode', 'legs']) &&
    validSafeInteger(structure.clubCount) &&
    structure.clubCount >= 4 &&
    structure.clubCount <= 20 &&
    structure.clubCount % 2 === 0 &&
    structure.formatCode === 'DOUBLE_ROUND_ROBIN' &&
    structure.legs === 2 &&
    isRecord(planning) &&
    exactKeys(planning, ['plannedMinutes', 'preparationMinutes', 'releaseMinutes']) &&
    validSafeInteger(planning.plannedMinutes) &&
    planning.plannedMinutes > 0 &&
    validSafeInteger(planning.preparationMinutes) &&
    planning.preparationMinutes >= 0 &&
    validSafeInteger(planning.releaseMinutes) &&
    planning.releaseMinutes >= 0
  );
}

function validOfficialResultFreeze(value: Record<string, unknown>): boolean {
  if (
    !exactKeys(value, [
      'firstOfficialReportVersionId',
      'firstConfirmedAt',
      'basisRegulationVersionId',
      'frozenRules',
      'confirmedReportVersionIds',
    ])
  )
    return false;
  if (!validUniqueReferences(value.confirmedReportVersionIds)) return false;
  if (value.firstOfficialReportVersionId === null)
    return (
      value.firstConfirmedAt === null &&
      value.basisRegulationVersionId === null &&
      value.frozenRules === null &&
      value.confirmedReportVersionIds.length === 0
    );
  const rules = value.frozenRules;
  if (
    !isUuid(value.firstOfficialReportVersionId) ||
    !value.confirmedReportVersionIds.includes(value.firstOfficialReportVersionId) ||
    !validInstant(value.firstConfirmedAt) ||
    !isUuid(value.basisRegulationVersionId) ||
    !isRecord(rules) ||
    !exactKeys(rules, [
      'clubCount',
      'winPoints',
      'drawPoints',
      'lossPoints',
      'rankingPriority',
      'qualificationCount',
      'relegationCount',
    ])
  )
    return false;
  return (
    validSafeInteger(rules.clubCount) &&
    rules.clubCount >= 4 &&
    rules.clubCount <= 20 &&
    rules.clubCount % 2 === 0 &&
    validSafeInteger(rules.winPoints) &&
    validSafeInteger(rules.drawPoints) &&
    validSafeInteger(rules.lossPoints) &&
    rules.winPoints > rules.drawPoints &&
    rules.drawPoints > rules.lossPoints &&
    Array.isArray(rules.rankingPriority) &&
    rules.rankingPriority.length === 3 &&
    rules.rankingPriority.every((code) =>
      ['POINTS', 'GOAL_DIFFERENCE', 'GOALS_FOR'].includes(String(code)),
    ) &&
    new Set(rules.rankingPriority).size === 3 &&
    validSafeInteger(rules.qualificationCount) &&
    rules.qualificationCount >= 0 &&
    validSafeInteger(rules.relegationCount) &&
    rules.relegationCount >= 0 &&
    rules.relegationCount < rules.clubCount &&
    rules.qualificationCount + rules.relegationCount <= rules.clubCount
  );
}

function validFacts<K extends DependencyKind>(
  kind: K,
  value: unknown,
): value is DependencyFactsMap[K] {
  if (!isRecord(value)) return false;
  switch (kind) {
    case 'registrationCompatibility':
      return (
        exactKeys(value, ['intervalCompositions']) &&
        Array.isArray(value.intervalCompositions) &&
        value.intervalCompositions.every(validRegistrationComposition)
      );
    case 'scheduleFreeze':
      return validScheduleFreeze(value);
    case 'officialResultFreeze':
      return validOfficialResultFreeze(value);
    case 'referencedCatalogUsage':
      return (
        exactKeys(value, ['references']) &&
        Array.isArray(value.references) &&
        value.references.every(
          (reference) =>
            isRecord(reference) &&
            exactKeys(reference, ['catalogCode', 'sourceVersionId', 'enabledWhenRecorded']) &&
            typeof reference.catalogCode === 'string' &&
            reference.catalogCode.length > 0 &&
            isUuid(reference.sourceVersionId) &&
            typeof reference.enabledWhenRecorded === 'boolean',
        )
      );
    case 'masterImpact':
      return (
        exactKeys(value, ['affected']) &&
        Array.isArray(value.affected) &&
        value.affected.every(
          (row) =>
            isRecord(row) &&
            exactKeys(row, ['kind', 'id']) &&
            ['REGISTRATION', 'SCHEDULE', 'RESULT'].includes(String(row.kind)) &&
            isUuid(row.id),
        )
      );
    case 'publicMediaScope':
      return (
        exactKeys(value, ['public', 'basisReference']) &&
        typeof value.public === 'boolean' &&
        (value.basisReference === null || isUuid(value.basisReference)) &&
        (!value.public || value.basisReference !== null)
      );
    case 'seasonSummary':
      return validSummaryFacts(value);
    case 'seasonClosingReadiness': {
      if (
        !exactKeys(value, [
          'summary',
          'unresolvedRequests',
          'waitingEffects',
          'playingIntervals',
          'unresolvedFuturePlans',
        ]) ||
        !validSummaryFacts(value.summary) ||
        !Array.isArray(value.unresolvedRequests) ||
        !Array.isArray(value.waitingEffects) ||
        !Array.isArray(value.playingIntervals) ||
        !Array.isArray(value.unresolvedFuturePlans)
      )
        return false;
      return (
        value.unresolvedRequests.every(
          (request) =>
            isRecord(request) &&
            exactKeys(request, ['kind', 'id']) &&
            ['REGULATION_CHANGE', 'LIFECYCLE'].includes(String(request.kind)) &&
            isUuid(request.id),
        ) &&
        value.waitingEffects.every(
          (effect) =>
            isRecord(effect) &&
            exactKeys(effect, ['kind', 'versionId']) &&
            ['REGULATION', 'REGISTRATION'].includes(String(effect.kind)) &&
            isUuid(effect.versionId),
        ) &&
        value.playingIntervals.every(
          (interval) =>
            isRecord(interval) &&
            exactKeys(interval, ['registrationId', 'playingEnd']) &&
            isUuid(interval.registrationId) &&
            (interval.playingEnd === null || validInstant(interval.playingEnd)),
        ) &&
        value.unresolvedFuturePlans.every(
          (plan) =>
            isRecord(plan) &&
            exactKeys(plan, ['registrationId', 'versionId', 'startsAt']) &&
            isUuid(plan.registrationId) &&
            isUuid(plan.versionId) &&
            validInstant(plan.startsAt),
        )
      );
    }
  }
}

function requiredFactReferences(
  kind: DependencyKind,
  value: DependencyFactsMap[DependencyKind],
): string[] {
  switch (kind) {
    case 'registrationCompatibility':
      return (
        value as DependencyFactsMap['registrationCompatibility']
      ).intervalCompositions.flatMap((composition) =>
        composition.registrations.flatMap((registration) => [
          registration.registrationId,
          registration.versionId,
          registration.playerId,
          registration.clubId,
        ]),
      );
    case 'scheduleFreeze': {
      const facts = value as DependencyFactsMap['scheduleFreeze'];
      return [facts.initialApprovalVersionId, ...facts.affectedScheduleVersionIds].filter(isUuid);
    }
    case 'officialResultFreeze': {
      const facts = value as DependencyFactsMap['officialResultFreeze'];
      return [
        facts.firstOfficialReportVersionId,
        facts.basisRegulationVersionId,
        ...facts.confirmedReportVersionIds,
      ].filter(isUuid);
    }
    case 'referencedCatalogUsage':
      return (value as DependencyFactsMap['referencedCatalogUsage']).references.map(
        (reference) => reference.sourceVersionId,
      );
    case 'masterImpact':
      return (value as DependencyFactsMap['masterImpact']).affected.map((record) => record.id);
    case 'publicMediaScope':
      return [(value as DependencyFactsMap['publicMediaScope']).basisReference].filter(isUuid);
    case 'seasonSummary': {
      const facts = value as DependencyFactsMap['seasonSummary'];
      const snapshot = facts.sourceSnapshot;
      return [
        facts.caseId,
        facts.currentConfirmedVersionId,
        snapshot?.basis.regulationVersionId,
        ...(snapshot?.basis.officialReportVersionIds ?? []),
        ...(snapshot?.basis.rankingResolutionVersionIds ?? []),
      ].filter(isUuid);
    }
    case 'seasonClosingReadiness': {
      const facts = value as DependencyFactsMap['seasonClosingReadiness'];
      return [
        ...requiredFactReferences('seasonSummary', facts.summary),
        ...facts.unresolvedRequests.map((request) => request.id),
        ...facts.waitingEffects.map((effect) => effect.versionId),
        ...facts.playingIntervals.map((interval) => interval.registrationId),
        ...facts.unresolvedFuturePlans.flatMap((plan) => [plan.registrationId, plan.versionId]),
      ];
    }
  }
}

function factBasis(value: unknown, expectedOwner: DependencyWriter): value is DependencyFactBasis {
  return (
    isRecord(value) &&
    value.owner === expectedOwner &&
    typeof value.sourceRevision === 'string' &&
    value.sourceRevision.trim().length > 0 &&
    validUniqueReferences(value.references)
  );
}

function factBasisCovers<K extends DependencyKind>(
  kind: K,
  facts: DependencyFactsMap[K],
  basis: DependencyFactBasis,
): boolean {
  const references = new Set(basis.references);
  return requiredFactReferences(kind, facts).every((reference) => references.has(reference));
}

function knownSummaryProvider(): DependencyProvider<'seasonSummary'> {
  return {
    async discoverLocks(db, request) {
      const summaryCase = await db.seasonSummaryCase.findUnique({
        where: { seasonId: request.seasonId },
        select: { id: true, currentConfirmedVersionId: true },
      });
      const locks: LockResource[] = [{ kind: 'season', key: request.seasonId, mode: 'shared' }];
      if (summaryCase) {
        locks.push({ kind: 'seasonSummaryCase', key: summaryCase.id, mode: 'shared' });
        if (summaryCase.currentConfirmedVersionId)
          locks.push({
            kind: 'seasonSummaryVersion',
            key: summaryCase.currentConfirmedVersionId,
            mode: 'shared',
          });
      }
      return locks;
    },
    async read(context, request) {
      const [season, summaryCase] = await Promise.all([
        context.db.season.findUnique({
          where: { id: request.seasonId },
          select: { statisticsRevision: true },
        }),
        context.db.seasonSummaryCase.findUnique({
          where: { seasonId: request.seasonId },
          select: {
            id: true,
            revision: true,
            currentConfirmedVersionId: true,
            needsReconfirmation: true,
            currentConfirmedVersion: {
              select: {
                id: true,
                revision: true,
                state: true,
                basisStatisticsRevision: true,
                sourceSnapshot: true,
              },
            },
          },
        }),
      ]);
      if (!season) throw new Error('Season summary source is unavailable.');
      if (summaryCase?.currentConfirmedVersionId && !summaryCase.currentConfirmedVersion)
        throw new Error('Season summary pointer is unavailable.');

      const currentVersion = summaryCase?.currentConfirmedVersion ?? null;
      const sourceSnapshotValue = currentVersion?.sourceSnapshot ?? null;
      const sourceSnapshot = sourceSnapshotValue as SeasonSummarySourceSnapshot | null;
      const sourceSnapshotReferences = validSummarySnapshot(sourceSnapshotValue)
        ? [
            sourceSnapshotValue.basis.regulationVersionId,
            ...sourceSnapshotValue.basis.officialReportVersionIds,
            ...sourceSnapshotValue.basis.rankingResolutionVersionIds,
          ]
        : [];
      return {
        facts: {
          caseExists: summaryCase !== null,
          caseId: summaryCase?.id ?? null,
          currentConfirmedVersionId: summaryCase?.currentConfirmedVersionId ?? null,
          currentVersionState: currentVersion?.state ?? null,
          currentStatisticsRevision: season.statisticsRevision.toString(),
          basisStatisticsRevision: currentVersion?.basisStatisticsRevision?.toString() ?? null,
          sourceSnapshot: sourceSnapshot ?? null,
          needsReconfirmation: summaryCase?.needsReconfirmation ?? false,
        },
        basis: {
          owner: 'statistics-reporting',
          sourceRevision: `${season.statisticsRevision}:${summaryCase?.revision ?? 0n}:${currentVersion?.revision ?? 0n}`,
          references: [summaryCase?.id, currentVersion?.id, ...sourceSnapshotReferences].filter(
            isUuid,
          ),
        },
      };
    },
  };
}

function usableSummaryBasis(facts: SeasonSummaryFacts): boolean {
  return (
    facts.currentConfirmedVersionId !== null &&
    facts.currentVersionState === 'CONFIRMED' &&
    !facts.needsReconfirmation &&
    facts.basisStatisticsRevision !== null &&
    facts.basisStatisticsRevision === facts.currentStatisticsRevision &&
    facts.sourceSnapshot !== null &&
    validSummarySnapshot(facts.sourceSnapshot)
  );
}

export function hasUsableSummaryBasisForClosure(
  result: DependencyResult<'seasonSummary'>,
): boolean {
  return (
    result.status === 'KNOWN' &&
    validFacts('seasonSummary', result.facts) &&
    factBasis(result.basis, 'statistics-reporting') &&
    factBasisCovers('seasonSummary', result.facts, result.basis) &&
    usableSummaryBasis(result.facts)
  );
}

/**
 * Derives closure from source facts at the caller's trusted instant; providers cannot choose the
 * cutoff. The owning command must sample TransactionContext.now() after acquiring the full lock set.
 */
export function isSeasonClosingReady(
  result: DependencyResult<'seasonClosingReadiness'>,
  trustedClosingAt: Date,
): boolean {
  if (
    result.status !== 'KNOWN' ||
    !validFacts('seasonClosingReadiness', result.facts) ||
    !factBasis(result.basis, 'statistics-reporting') ||
    !factBasisCovers('seasonClosingReadiness', result.facts, result.basis)
  )
    return false;
  const closingAt = trustedClosingAt instanceof Date ? trustedClosingAt.getTime() : Number.NaN;
  if (!Number.isFinite(closingAt)) return false;
  const facts = result.facts;
  return (
    usableSummaryBasis(facts.summary) &&
    facts.unresolvedRequests.length === 0 &&
    facts.waitingEffects.length === 0 &&
    facts.unresolvedFuturePlans.length === 0 &&
    facts.playingIntervals.every(
      (interval) => interval.playingEnd !== null && Date.parse(interval.playingEnd) <= closingAt,
    )
  );
}

export class SeasonDependenciesService implements SeasonDependenciesPort {
  private readonly registeredWriters: ReadonlySet<DependencyWriter>;
  private readonly providers: DependencyProviderMap;
  private readonly relationCatalog: RelationCatalog;

  constructor(options: SeasonDependenciesOptions) {
    if (!options || !Array.isArray(options.registeredWriters))
      throw new Error('A static dependency writer catalog is required.');
    if (
      options.registeredWriters.some((writer) => !writers.includes(writer)) ||
      new Set(options.registeredWriters).size !== options.registeredWriters.length
    )
      throw new Error('The dependency writer catalog is invalid.');
    this.registeredWriters = new Set(options.registeredWriters);
    this.providers = {
      seasonSummary: knownSummaryProvider(),
      ...options.providers,
    };
    this.relationCatalog = options.relationCatalog ?? new PostgresRelationCatalog();
  }

  /** Validates every installed source/provider pair before callers expose its dependent workflow. */
  async assertStartupCatalog(db: Prisma.TransactionClient): Promise<void> {
    for (const kind of dependencyKinds) {
      const source = dependencySources[kind];
      const provider = this.provider(kind);
      const registeredSourceWriters = source.writers.filter((writer) =>
        this.registeredWriters.has(writer),
      );
      // Composite dependencies are installed incrementally with their owner modules. A missing
      // composite adapter blocks only its callers (discover/read return UNAVAILABLE), not app start.
      if (
        !provider &&
        (registeredSourceWriters.length === 0 ||
          (source.writers.length > 1 && registeredSourceWriters.length < source.writers.length))
      )
        continue;
      if (!provider)
        throw new Error(`Season dependency startup catalog is incomplete for ${kind}.`);
      let present: readonly string[];
      try {
        present = await this.relationCatalog.existing(db, source.relations);
      } catch {
        throw new Error(`Season dependency startup catalog is unavailable for ${kind}.`);
      }
      const expected = new Set(source.relations);
      if (
        !Array.isArray(present) ||
        new Set(present).size !== present.length ||
        present.some((relation) => !expected.has(relation)) ||
        present.length !== source.relations.length
      )
        throw new Error(`Season dependency startup catalog is incomplete for ${kind}.`);
    }
  }

  async discover<K extends DependencyKind>(
    kind: K,
    db: Prisma.TransactionClient,
    request: DependencyRequestMap[K],
  ): Promise<DependencyDiscovery> {
    this.assertKind(kind);
    if (!validRequest(kind, request)) throw new Error('Dependency request is invalid.');
    return this.discoverSource(kind, db, request);
  }

  async read<K extends DependencyKind>(
    kind: K,
    context: TransactionContext,
    request: DependencyRequestMap[K],
  ): Promise<DependencyResult<K>> {
    this.assertKind(kind);
    if (!validRequest(kind, request)) throw new Error('Dependency request is invalid.');
    const discovery = await this.discoverSource(kind, context.db, request);
    if (discovery.status !== 'KNOWN') return { ...discovery, facts: null } as DependencyResult<K>;
    context.assertLockCoverage(discovery.locks);

    const provider = this.provider(kind);
    if (!provider)
      return {
        ...this.unavailable(
          kind,
          'SOURCE_SCHEMA_WITHOUT_ADAPTER',
          discovery.basis.presentRelations,
        ),
        facts: null,
      } as DependencyResult<K>;
    try {
      const observed = await provider.read(context, request);
      if (
        !isRecord(observed) ||
        !validFacts(kind, observed.facts) ||
        !factBasis(observed.basis, dependencySources[kind].owner) ||
        !factBasisCovers(kind, observed.facts, observed.basis)
      )
        return {
          ...this.unavailable(kind, 'INVALID_PROVIDER_RESULT', discovery.basis.presentRelations),
          facts: null,
        } as DependencyResult<K>;
      return {
        status: 'KNOWN',
        facts: observed.facts,
        basis: observed.basis,
        locks: discovery.locks,
      } as DependencyResult<K>;
    } catch {
      return {
        ...this.unavailable(kind, 'PROVIDER_FAILURE', discovery.basis.presentRelations),
        facts: null,
      } as DependencyResult<K>;
    }
  }

  private assertKind(kind: string): asserts kind is DependencyKind {
    if (!(dependencyKinds as readonly string[]).includes(kind))
      throw new Error('Unknown season dependency.');
  }

  private provider<K extends DependencyKind>(kind: K): DependencyProvider<K> | undefined {
    return this.providers[kind] as DependencyProvider<K> | undefined;
  }

  private async discoverSource<K extends DependencyKind>(
    kind: K,
    db: Prisma.TransactionClient,
    request: DependencyRequestMap[K],
  ): Promise<DependencyDiscovery> {
    const source = dependencySources[kind];
    const registeredWriters = source.writers.filter((writer) => this.registeredWriters.has(writer));
    let presentRelations: readonly string[];
    try {
      presentRelations = await this.relationCatalog.existing(db, source.relations);
    } catch {
      return this.unavailable(kind, 'SCHEMA_CATALOG_FAILURE', []);
    }
    const allowed = new Set(source.relations);
    if (
      !Array.isArray(presentRelations) ||
      new Set(presentRelations).size !== presentRelations.length ||
      presentRelations.some((relation) => !allowed.has(relation))
    )
      return this.unavailable(kind, 'INVALID_SCHEMA_CATALOG', []);

    const provider = this.provider(kind);
    if (presentRelations.length === 0 && registeredWriters.length === 0 && !provider) {
      return {
        status: 'VERIFIED_NOT_INTRODUCED',
        locks: [],
        basis: {
          owner: source.owner,
          absentRelations: source.relations,
          registeredWriters: [],
        },
      };
    }
    if (presentRelations.length === 0 && provider)
      return this.unavailable(kind, 'SOURCE_SCHEMA_ABSENT_WITH_ADAPTER', []);
    if (presentRelations.length > 0 && presentRelations.length < source.relations.length)
      return this.unavailable(kind, 'PARTIAL_SOURCE_SCHEMA', presentRelations);
    if (!provider) {
      return this.unavailable(
        kind,
        registeredWriters.length > 0
          ? 'SOURCE_WRITER_WITHOUT_ADAPTER'
          : 'SOURCE_SCHEMA_WITHOUT_ADAPTER',
        presentRelations,
      );
    }

    let discoveredLocks: readonly LockResource[];
    try {
      discoveredLocks = await provider.discoverLocks(db, request);
    } catch {
      return this.unavailable(kind, 'PROVIDER_FAILURE', presentRelations);
    }
    let locks: LockResource[];
    try {
      locks = normalizeLockResources(discoveredLocks);
    } catch {
      return this.unavailable(kind, 'INVALID_PROVIDER_RESULT', presentRelations);
    }
    if (
      !locks.some(
        (lock) =>
          lock.kind === 'season' && lock.key.toLowerCase() === request.seasonId.toLowerCase(),
      )
    )
      return this.unavailable(kind, 'INVALID_PROVIDER_RESULT', presentRelations);
    return {
      status: 'KNOWN',
      locks,
      basis: { owner: source.owner, presentRelations, registeredWriters },
    };
  }

  private unavailable<K extends DependencyKind>(
    kind: K,
    cause: DependencyUnavailableCause,
    presentRelations: readonly string[],
  ): Extract<DependencyDiscovery, { status: 'UNAVAILABLE' }> {
    const source = dependencySources[kind];
    return {
      status: 'UNAVAILABLE',
      locks: [],
      basis: {
        owner: source.owner,
        cause,
        presentRelations,
        registeredWriters: source.writers.filter((writer) => this.registeredWriters.has(writer)),
      },
    };
  }
}
