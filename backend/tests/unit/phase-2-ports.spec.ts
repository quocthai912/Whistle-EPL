import { randomUUID } from 'node:crypto';
import {
  SeasonDependenciesService,
  hasUsableSummaryBasisForClosure,
  isSeasonClosingReady,
  registerDependencyModules,
} from '../../src/season-regulations/season-dependencies.service';
import { ClockService } from '../../src/platform/clock.service';
import { LockSetChanged, TransactionContext } from '../../src/platform/transaction-context';
import type {
  DependencyKind,
  DependencyFactsMap,
  DependencyProvider,
  DependencyProviderMap,
  DependencyRequestMap,
  DependencyWriter,
  RelationCatalog,
} from '../../src/season-regulations/season-dependencies.port';
import { dependencySources } from '../../src/season-regulations/season-dependencies.port';
import { composePhase2Evidence, simulateLaterFact } from '../fixtures/phase-2-evidence';
import { createPhase2Fixtures, resetPhase2Fixtures } from '../fixtures/phase-2-fixtures';
import { assertIsolatedTarget } from '../fixtures/isolated-target.guard';

const seasonId = randomUUID();
const versionId = randomUUID();
const emptyTransaction = {} as never;
const seasonLock = [{ kind: 'season' as const, key: seasonId, mode: 'shared' as const }];
const registrationQuery: DependencyRequestMap['registrationCompatibility'] = {
  seasonId,
  candidateVersionId: versionId,
};

function transactionContext(dbOverrides: Record<string, unknown> = {}): TransactionContext {
  const db = {
    $queryRawUnsafe: jest.fn(async () => [{ id: seasonId }]),
    ...dbOverrides,
  } as never;
  return new TransactionContext(db, new ClockService(), async () => {});
}

function catalog(present: readonly string[]): RelationCatalog {
  return {
    async existing(_db, expected) {
      return expected.filter((relation) => present.includes(relation));
    },
  };
}

function service(
  options: {
    present?: readonly string[];
    writers?: readonly DependencyWriter[];
    providers?: DependencyProviderMap;
  } = {},
) {
  return new SeasonDependenciesService({
    registeredWriters: options.writers ?? [],
    providers: options.providers,
    relationCatalog: catalog(options.present ?? []),
  });
}

function knownRegistrationProvider(): DependencyProvider<'registrationCompatibility'> {
  return {
    discoverLocks: jest.fn(async () => [
      { kind: 'season' as const, key: seasonId, mode: 'shared' as const },
    ]),
    read: jest.fn(async () => ({
      facts: { intervalCompositions: [] },
      basis: { owner: 'registry-registration' as const, sourceRevision: '17', references: [] },
    })),
  };
}

function factProvider<K extends DependencyKind>(
  facts: DependencyFactsMap[K],
  owner: DependencyWriter,
  references: readonly string[],
): DependencyProvider<K> {
  return {
    discoverLocks: jest.fn(async () => seasonLock),
    read: jest.fn(async () => ({
      facts,
      basis: { owner, sourceRevision: '17', references },
    })),
  };
}

describe('PHASE 2 typed later-fact ports', () => {
  it('verifies absence only when every owning relation and writer is absent', async () => {
    const target = service();
    const discovery = await target.discover(
      'registrationCompatibility',
      emptyTransaction,
      registrationQuery,
    );
    const result = await target.read(
      'registrationCompatibility',
      transactionContext(),
      registrationQuery,
    );

    expect(discovery).toMatchObject({
      status: 'VERIFIED_NOT_INTRODUCED',
      locks: [],
      basis: {
        owner: 'registry-registration',
        absentRelations: ['player_registration', 'registration_version'],
        registeredWriters: [],
      },
    });
    expect(result).toMatchObject({ status: 'VERIFIED_NOT_INTRODUCED', facts: null, locks: [] });
  });

  it('fails closed on partial source schema, an installed writer without a provider, and catalog failure', async () => {
    const partial = service({ present: ['player_registration'] });
    expect(
      await partial.discover('registrationCompatibility', emptyTransaction, registrationQuery),
    ).toMatchObject({ status: 'UNAVAILABLE', basis: { cause: 'PARTIAL_SOURCE_SCHEMA' } });

    const writerWithoutAdapter = service({ writers: ['registry-registration'] });
    expect(
      await writerWithoutAdapter.discover(
        'registrationCompatibility',
        emptyTransaction,
        registrationQuery,
      ),
    ).toMatchObject({ status: 'UNAVAILABLE', basis: { cause: 'SOURCE_WRITER_WITHOUT_ADAPTER' } });

    const failedCatalog = new SeasonDependenciesService({
      registeredWriters: [],
      relationCatalog: {
        async existing() {
          throw new Error('catalog details are private');
        },
      },
    });
    expect(
      await failedCatalog.discover(
        'registrationCompatibility',
        emptyTransaction,
        registrationQuery,
      ),
    ).toMatchObject({ status: 'UNAVAILABLE', basis: { cause: 'SCHEMA_CATALOG_FAILURE' } });
  });

  it('requires a complete relation catalog and a provider before returning known facts', async () => {
    const provider = knownRegistrationProvider();
    const providers: DependencyProviderMap = { registrationCompatibility: provider };
    const relations = ['player_registration', 'registration_version'];
    const target = service({
      present: relations,
      writers: ['registry-registration'],
      providers,
    });
    const discovery = await target.discover(
      'registrationCompatibility',
      emptyTransaction,
      registrationQuery,
    );
    expect(discovery).toMatchObject({
      status: 'KNOWN',
      locks: [{ kind: 'season', key: seasonId }],
    });

    const context = transactionContext();
    await context.acquire(seasonLock);
    const result = await target.read('registrationCompatibility', context, registrationQuery);
    expect(result).toMatchObject({
      status: 'KNOWN',
      facts: { intervalCompositions: [] },
      basis: { owner: 'registry-registration', sourceRevision: '17' },
    });
    expect(provider.read).toHaveBeenCalledTimes(1);

    const incomplete = service({ present: relations, writers: ['registry-registration'] });
    expect(
      await incomplete.discover('registrationCompatibility', emptyTransaction, registrationQuery),
    ).toMatchObject({ status: 'UNAVAILABLE', basis: { cause: 'SOURCE_WRITER_WITHOUT_ADAPTER' } });
  });

  it('retains interval classifications, schedule freeze values, and first-result rules in typed facts', async () => {
    const registrationId = randomUUID();
    const playerId = randomUUID();
    const clubId = randomUUID();
    const scheduleApprovalId = randomUUID();
    const scheduleVersionId = randomUUID();
    const firstReportVersionId = randomUUID();
    const basisRegulationVersionId = randomUUID();
    const intervalRegistrationVersionId = randomUUID();
    const registrationFacts: DependencyFactsMap['registrationCompatibility'] = {
      intervalCompositions: [
        {
          startsAt: '2026-08-01T00:00:00.000Z',
          endsAt: null,
          registrations: [
            {
              registrationId,
              versionId: intervalRegistrationVersionId,
              playerId,
              clubId,
              source: 'VALIDATED_REGISTRATION',
              u21: false,
              homegrown: true,
            },
          ],
        },
      ],
    };
    const scheduleFacts: DependencyFactsMap['scheduleFreeze'] = {
      initialApprovalVersionId: scheduleApprovalId,
      frozenAt: '2026-08-02T12:00:00.000Z',
      structure: { clubCount: 20, formatCode: 'DOUBLE_ROUND_ROBIN', legs: 2 },
      planning: { plannedMinutes: 90, preparationMinutes: 15, releaseMinutes: 15 },
      affectedScheduleVersionIds: [scheduleVersionId],
    };
    const resultFacts: DependencyFactsMap['officialResultFreeze'] = {
      firstOfficialReportVersionId: firstReportVersionId,
      firstConfirmedAt: '2026-08-03T12:00:00.000Z',
      basisRegulationVersionId,
      frozenRules: {
        clubCount: 20,
        winPoints: 3,
        drawPoints: 1,
        lossPoints: 0,
        rankingPriority: ['POINTS', 'GOAL_DIFFERENCE', 'GOALS_FOR'],
        qualificationCount: 4,
        relegationCount: 3,
      },
      confirmedReportVersionIds: [firstReportVersionId],
    };
    const providers: DependencyProviderMap = {
      registrationCompatibility: factProvider(registrationFacts, 'registry-registration', [
        registrationId,
        intervalRegistrationVersionId,
        playerId,
        clubId,
      ]),
      scheduleFreeze: factProvider(scheduleFacts, 'scheduling', [
        scheduleApprovalId,
        scheduleVersionId,
      ]),
      officialResultFreeze: factProvider(resultFacts, 'match-results', [
        firstReportVersionId,
        basisRegulationVersionId,
      ]),
    };
    const present = [
      ...dependencySources.registrationCompatibility.relations,
      ...dependencySources.scheduleFreeze.relations,
      ...dependencySources.officialResultFreeze.relations,
    ];
    const target = service({
      present,
      writers: ['registry-registration', 'scheduling', 'match-results'],
      providers,
    });
    const context = transactionContext();
    await context.acquire(seasonLock);

    const registration = await target.read('registrationCompatibility', context, registrationQuery);
    const schedule = await target.read('scheduleFreeze', context, registrationQuery);
    const result = await target.read('officialResultFreeze', context, registrationQuery);
    expect(registration).toMatchObject({ status: 'KNOWN', facts: registrationFacts });
    expect(schedule).toMatchObject({ status: 'KNOWN', facts: scheduleFacts });
    expect(result).toMatchObject({ status: 'KNOWN', facts: resultFacts });
  });

  it('composes static module registrations and asserts installed source schemas at startup', async () => {
    const provider = knownRegistrationProvider();
    const registration = registerDependencyModules([
      { writer: 'registry-registration', providers: { registrationCompatibility: provider } },
    ]);
    expect(registration.registeredWriters).toEqual(['registry-registration']);
    expect(registration.providers?.registrationCompatibility).toBe(provider);
    expect(() =>
      registerDependencyModules([
        {
          writer: 'registry-registration',
          providers: { scheduleFreeze: provider as never },
        },
      ]),
    ).toThrow('owning writer');

    const summaryRelations = dependencySources.seasonSummary.relations;
    const active = new SeasonDependenciesService({
      registeredWriters: [],
      relationCatalog: catalog(summaryRelations),
    });
    await expect(active.assertStartupCatalog(emptyTransaction)).resolves.toBeUndefined();

    const missingProvider = service({
      writers: ['registry-registration'],
      present: summaryRelations,
    });
    await expect(missingProvider.assertStartupCatalog(emptyTransaction)).rejects.toThrow(
      'startup catalog is incomplete',
    );
    expect(() =>
      registerDependencyModules([
        { writer: 'registry-registration' },
        { writer: 'registry-registration' },
      ]),
    ).toThrow('only once');
  });

  it('allows a registered owner to start before adapters for multi-owner dependencies exist', async () => {
    const present = new Set([
      ...dependencySources.registrationCompatibility.relations,
      ...dependencySources.seasonSummary.relations,
    ]);
    const target = new SeasonDependenciesService({
      registeredWriters: ['registry-registration'],
      providers: { registrationCompatibility: knownRegistrationProvider() },
      relationCatalog: {
        async existing(_db, expected) {
          return expected.filter((relation) => present.has(relation));
        },
      },
    });

    await expect(target.assertStartupCatalog(emptyTransaction)).resolves.toBeUndefined();
    await expect(
      target.discover('seasonClosingReadiness', emptyTransaction, { seasonId }),
    ).resolves.toMatchObject({ status: 'UNAVAILABLE' });

    const explicitReadinessProvider = factProvider<'seasonClosingReadiness'>(
      {
        summary: {
          caseExists: false,
          caseId: null,
          currentConfirmedVersionId: null,
          currentVersionState: null,
          currentStatisticsRevision: '0',
          basisStatisticsRevision: null,
          sourceSnapshot: null,
          needsReconfirmation: false,
        },
        unresolvedRequests: [],
        waitingEffects: [],
        playingIntervals: [],
        unresolvedFuturePlans: [],
      },
      'statistics-reporting',
      [],
    );
    const incompleteExplicitProvider = new SeasonDependenciesService({
      registeredWriters: ['registry-registration', 'statistics-reporting'],
      providers: {
        registrationCompatibility: knownRegistrationProvider(),
        seasonClosingReadiness: explicitReadinessProvider,
      },
      relationCatalog: {
        async existing(_db, expected) {
          return expected.filter((relation) => present.has(relation));
        },
      },
    });
    await expect(incompleteExplicitProvider.assertStartupCatalog(emptyTransaction)).rejects.toThrow(
      'startup catalog is incomplete',
    );
  });

  it('returns unavailable for malformed provider locks validated by the shared lock catalog', async () => {
    const provider = {
      discoverLocks: async () => [{ kind: 'season', key: 'not-a-uuid', mode: 'shared' }],
      read: jest.fn(async () => ({
        facts: { intervalCompositions: [] },
        basis: { owner: 'registry-registration', sourceRevision: '1', references: [] },
      })),
    };
    const target = service({
      present: ['player_registration', 'registration_version'],
      writers: ['registry-registration'],
      providers: { registrationCompatibility: provider } as never,
    });

    await expect(
      target.discover('registrationCompatibility', emptyTransaction, registrationQuery),
    ).resolves.toMatchObject({
      status: 'UNAVAILABLE',
      basis: { cause: 'INVALID_PROVIDER_RESULT' },
    });
    expect(provider.read).not.toHaveBeenCalled();
  });

  it('restarts when dependency lock coverage is missing or a summary pointer changes', async () => {
    const registrationTarget = service({
      present: ['player_registration', 'registration_version'],
      writers: ['registry-registration'],
      providers: { registrationCompatibility: knownRegistrationProvider() },
    });
    const noCoverage = transactionContext();
    await noCoverage.acquire([]);
    await expect(
      registrationTarget.read('registrationCompatibility', noCoverage, registrationQuery),
    ).rejects.toBeInstanceOf(LockSetChanged);

    const summaryCaseId = randomUUID();
    const oldVersionId = randomUUID();
    const currentVersionId = randomUUID();
    const summaryCase = {
      findUnique: jest.fn(async () => ({
        id: summaryCaseId,
        currentConfirmedVersionId: currentVersionId,
      })),
    };
    const summaryDatabase = {
      season: { findUnique: jest.fn(async () => ({ statisticsRevision: 0n })) },
      seasonSummaryCase: summaryCase,
    };
    const changedPointerContext = transactionContext(summaryDatabase);
    await changedPointerContext.acquire([
      ...seasonLock,
      { kind: 'seasonSummaryCase', key: summaryCaseId, mode: 'shared' },
      { kind: 'seasonSummaryVersion', key: oldVersionId, mode: 'shared' },
    ]);
    const summaryTarget = service({
      present: dependencySources.seasonSummary.relations,
    });
    await expect(
      summaryTarget.read('seasonSummary', changedPointerContext, { seasonId }),
    ).rejects.toBeInstanceOf(LockSetChanged);
    expect(summaryDatabase.season.findUnique).not.toHaveBeenCalled();
  });

  it('does not treat the real schema-only empty summary target as closure readiness', async () => {
    const db = {
      season: { findUnique: jest.fn(async () => ({ statisticsRevision: 0n })) },
      seasonSummaryCase: { findUnique: jest.fn(async () => null) },
    };
    const target = service({
      present: ['season_summary_case', 'season_summary_version', 'season_summary_version_editor'],
    });
    const context = transactionContext(db);
    await context.acquire(seasonLock);
    const result = await target.read('seasonSummary', context, { seasonId });

    expect(result).toMatchObject({
      status: 'KNOWN',
      facts: { caseExists: false, currentConfirmedVersionId: null, needsReconfirmation: false },
      basis: { owner: 'statistics-reporting', sourceRevision: '0:0:0', references: [] },
      locks: [{ kind: 'season', key: seasonId, mode: 'shared' }],
    });
    expect(hasUsableSummaryBasisForClosure(result)).toBe(false);
  });

  it('requires an immutable source snapshot for a confirmed summary basis', async () => {
    const summaryCaseId = randomUUID();
    const summaryVersionId = randomUUID();
    const regulationVersionId = randomUUID();
    const resultVersionId = randomUUID();
    const sourceSnapshot = {
      basis: {
        regulationVersionId,
        officialReportVersionIds: [resultVersionId],
        rankingResolutionVersionIds: [],
      },
      content: { standings: [], champion: null, totalGoals: 0 },
    };
    const summaryDatabase = {
      season: { findUnique: jest.fn(async () => ({ statisticsRevision: 3n })) },
      seasonSummaryCase: {
        findUnique: jest.fn(async () => ({
          id: summaryCaseId,
          revision: 2n,
          currentConfirmedVersionId: summaryVersionId,
          needsReconfirmation: false,
          currentConfirmedVersion: {
            id: summaryVersionId,
            revision: 1n,
            state: 'CONFIRMED',
            basisStatisticsRevision: 3n,
            sourceSnapshot,
          },
        })),
      },
    };
    const context = transactionContext(summaryDatabase);
    await context.acquire([
      ...seasonLock,
      { kind: 'seasonSummaryCase', key: summaryCaseId, mode: 'shared' },
      { kind: 'seasonSummaryVersion', key: summaryVersionId, mode: 'shared' },
    ]);
    const target = service({ present: dependencySources.seasonSummary.relations });
    const result = await target.read('seasonSummary', context, { seasonId });
    expect(result).toMatchObject({
      status: 'KNOWN',
      facts: { currentConfirmedVersionId: summaryVersionId, sourceSnapshot },
      basis: {
        references: [summaryCaseId, summaryVersionId, regulationVersionId, resultVersionId],
      },
    });
    expect(hasUsableSummaryBasisForClosure(result)).toBe(true);
  });

  it('returns unavailable instead of claiming empty when a provider throws or omits its source revision', async () => {
    const brokenProvider = {
      discoverLocks: async () => seasonLock,
      read: async () => {
        throw new Error('sensitive provider exception');
      },
    };
    const providers: DependencyProviderMap = {
      registrationCompatibility: brokenProvider,
    };
    const target = service({
      present: ['player_registration', 'registration_version'],
      providers,
    });
    const context = transactionContext();
    await context.acquire(seasonLock);
    expect(
      await target.read('registrationCompatibility', context, registrationQuery),
    ).toMatchObject({ status: 'UNAVAILABLE', basis: { cause: 'PROVIDER_FAILURE' } });

    const malformed = service({
      present: ['player_registration', 'registration_version'],
      providers: {
        registrationCompatibility: {
          discoverLocks: async () => seasonLock,
          read: async () => ({
            facts: { intervalCompositions: [] },
            basis: { owner: 'registry-registration', sourceRevision: '', references: [] },
          }),
        },
      },
    });
    const malformedContext = transactionContext();
    await malformedContext.acquire(seasonLock);
    expect(
      await malformed.read('registrationCompatibility', malformedContext, registrationQuery),
    ).toMatchObject({ status: 'UNAVAILABLE', basis: { cause: 'INVALID_PROVIDER_RESULT' } });
  });

  it('labels simulated later-owner facts and rejects references from another season', () => {
    const fixtureSeason = { id: seasonId, code: 'T005', name: 'Port Fixture' };
    const fixtureRegulationVersion = {
      id: versionId,
      seasonId,
      caseId: randomUUID(),
    };
    const fixtureSummaryVersion = {
      id: randomUUID(),
      seasonId,
      caseId: randomUUID(),
    };
    const simulation = simulateLaterFact({
      kind: 'registrationCompatibility',
      season: fixtureSeason,
      regulationVersion: fixtureRegulationVersion,
      note: 'Guard simulation only; no registration workflow is installed.',
      facts: { intervalCompositions: [] },
    });
    expect(simulation).toMatchObject({
      label: 'GUARD_SIMULATION',
      kind: 'registrationCompatibility',
      seasonId,
      candidateVersionId: versionId,
    });
    expect(() =>
      composePhase2Evidence({
        references: {
          season: fixtureSeason,
          regulationVersion: fixtureRegulationVersion,
          summaryVersion: { ...fixtureSummaryVersion, seasonId: randomUUID() },
        },
        simulatedLaterFacts: [simulation],
      }),
    ).toThrow('persisted core identities');
  });

  it('derives closure readiness using the caller trusted instant, never a provider cutoff or ready flag', () => {
    const summaryCaseId = randomUUID();
    const summaryVersionId = randomUUID();
    const regulationVersionId = randomUUID();
    const resultVersionId = randomUUID();
    const registrationId = randomUUID();
    const futureVersionId = randomUUID();
    const facts = {
      summary: {
        caseExists: true,
        caseId: summaryCaseId,
        currentConfirmedVersionId: summaryVersionId,
        currentVersionState: 'CONFIRMED',
        currentStatisticsRevision: '7',
        basisStatisticsRevision: '7',
        sourceSnapshot: {
          basis: {
            regulationVersionId,
            officialReportVersionIds: [resultVersionId],
            rankingResolutionVersionIds: [],
          },
          content: { standings: [], champion: null, totalGoals: 12 },
        },
        needsReconfirmation: false,
      },
      unresolvedRequests: [],
      waitingEffects: [],
      playingIntervals: [{ registrationId, playingEnd: '2026-11-14T23:00:00.000Z' }],
      unresolvedFuturePlans: [],
    };
    const result = {
      status: 'KNOWN',
      facts,
      basis: {
        owner: 'statistics-reporting',
        sourceRevision: '7:2:1',
        references: [
          summaryCaseId,
          summaryVersionId,
          regulationVersionId,
          resultVersionId,
          registrationId,
          futureVersionId,
        ],
      },
      locks: seasonLock,
    } as const;
    const trustedClosingAt = new Date('2026-11-15T00:00:00.000Z');
    expect(isSeasonClosingReady(result, trustedClosingAt)).toBe(true);
    expect(
      isSeasonClosingReady(
        {
          ...result,
          facts: {
            ...facts,
            playingIntervals: [{ registrationId, playingEnd: trustedClosingAt.toISOString() }],
          },
        },
        trustedClosingAt,
      ),
    ).toBe(true);
    expect(
      isSeasonClosingReady(
        {
          ...result,
          facts: {
            ...facts,
            playingIntervals: [
              {
                registrationId,
                playingEnd: new Date(trustedClosingAt.getTime() + 1).toISOString(),
              },
            ],
          },
        },
        trustedClosingAt,
      ),
    ).toBe(false);
    expect(isSeasonClosingReady(result, new Date(Number.NaN))).toBe(false);
    expect(
      isSeasonClosingReady(
        {
          ...result,
          facts: { ...facts, closingAt: '2000-01-01T00:00:00.000Z' },
        } as unknown as typeof result,
        trustedClosingAt,
      ),
    ).toBe(false);
    expect(
      isSeasonClosingReady(
        {
          ...result,
          facts: {
            ...facts,
            ready: true,
            playingIntervals: [{ registrationId, playingEnd: null }],
          },
        } as unknown as Parameters<typeof isSeasonClosingReady>[0],
        trustedClosingAt,
      ),
    ).toBe(false);
    expect(
      isSeasonClosingReady(
        { status: 'UNAVAILABLE', facts: null, basis: {} as never, locks: [] },
        trustedClosingAt,
      ),
    ).toBe(false);
    expect(
      isSeasonClosingReady(
        {
          ...result,
          facts: {
            ...facts,
            unresolvedFuturePlans: [
              { registrationId, versionId: futureVersionId, startsAt: '2026-12-01T00:00:00.000Z' },
            ],
          },
        },
        trustedClosingAt,
      ),
    ).toBe(false);
  });

  it('keeps fixture creation and reset behind the isolated-target guard and reset acknowledgement', async () => {
    await expect(
      createPhase2Fixtures('postgresql://operator:secret@db.example.com:55437/whistle_test_bad'),
    ).rejects.toThrow('isolated test database');
    await expect(
      resetPhase2Fixtures('postgresql://operator:secret@127.0.0.1:55437/whistle_test_fixture', ''),
    ).rejects.toThrow('acknowledgement');
  });

  it('requires explicit ports for both isolated and operational database URLs', () => {
    const target = 'postgresql://fixture:fixture@127.0.0.1:55437/whistle_test_fixture';
    const operational = 'postgresql://operator:fixture@127.0.0.1:5432/whistle';
    expect(assertIsolatedTarget(target, { nodeEnv: 'test', operationalUrl: operational })).toBe(
      target,
    );
    expect(() => assertIsolatedTarget(target.replace(':55437', ''), { nodeEnv: 'test' })).toThrow(
      'isolated test database',
    );
    expect(() =>
      assertIsolatedTarget(target, {
        nodeEnv: 'test',
        operationalUrl: operational.replace(':5432', ''),
      }),
    ).toThrow('isolated test database');
  });

  it('rejects invalid IDs and unknown dependency kinds before catalog access', async () => {
    const relationCatalog = { existing: jest.fn(async () => []) };
    const target = new SeasonDependenciesService({
      registeredWriters: [],
      relationCatalog,
    });
    await expect(
      target.discover('registrationCompatibility' as DependencyKind, emptyTransaction, {
        ...registrationQuery,
        seasonId: 'not-a-uuid',
      }),
    ).rejects.toThrow('Dependency request is invalid.');
    await expect(
      target.discover('not-a-kind' as DependencyKind, emptyTransaction, registrationQuery),
    ).rejects.toThrow('Unknown season dependency.');
    expect(relationCatalog.existing).not.toHaveBeenCalled();
  });
});
