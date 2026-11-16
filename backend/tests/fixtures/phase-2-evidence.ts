import { dependencySources } from '../../src/season-regulations/season-dependencies.port';
import type {
  DependencyFactsMap,
  DependencyKind,
} from '../../src/season-regulations/season-dependencies.port';
import type { Phase2FixtureSet } from './phase-2-fixtures';

const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type LaterFactSimulationKind = Exclude<
  DependencyKind,
  'seasonSummary' | 'seasonClosingReadiness'
>;

export type LaterFactSimulation<K extends LaterFactSimulationKind = LaterFactSimulationKind> = {
  label: 'GUARD_SIMULATION';
  kind: K;
  owner: (typeof dependencySources)[K]['owner'];
  seasonId: string;
  candidateVersionId: string;
  facts: DependencyFactsMap[K];
  note: string;
};

export type Phase2PersistedFixtureReferences = {
  season: Phase2FixtureSet['seasons'][number];
  regulationVersion: Phase2FixtureSet['regulationVersions'][number];
  summaryVersion: Phase2FixtureSet['summaryVersions'][number];
};

export type Phase2EvidenceComposition = {
  scope: 'PHASE2_GUARD_SIMULATION';
  persisted: {
    seasonId: string;
    regulationVersionId: string;
    summaryVersionId: string | null;
  };
  simulatedLaterFacts: readonly LaterFactSimulation[];
};

export function simulateLaterFact<K extends LaterFactSimulationKind>(input: {
  kind: K;
  season: Phase2FixtureSet['seasons'][number];
  regulationVersion: Phase2FixtureSet['regulationVersions'][number];
  facts: DependencyFactsMap[K];
  note: string;
}): LaterFactSimulation<K> {
  if (
    !UUID4.test(input.season.id) ||
    !UUID4.test(input.regulationVersion.id) ||
    !UUID4.test(input.regulationVersion.caseId) ||
    input.regulationVersion.seasonId !== input.season.id ||
    typeof input.note !== 'string' ||
    !input.note.trim() ||
    input.note.length > 500
  )
    throw new Error('Later-fact simulations need typed core IDs and an explanatory label.');
  return {
    label: 'GUARD_SIMULATION',
    kind: input.kind,
    owner: dependencySources[input.kind].owner,
    seasonId: input.season.id,
    candidateVersionId: input.regulationVersion.id,
    facts: input.facts,
    note: input.note.trim(),
  };
}

export function composePhase2Evidence(input: {
  references: Phase2PersistedFixtureReferences;
  simulatedLaterFacts?: readonly LaterFactSimulation[];
}): Phase2EvidenceComposition {
  const { season, regulationVersion, summaryVersion } = input.references;
  if (
    !UUID4.test(season.id) ||
    !UUID4.test(regulationVersion.id) ||
    !UUID4.test(regulationVersion.caseId) ||
    !UUID4.test(summaryVersion.id) ||
    !UUID4.test(summaryVersion.caseId) ||
    regulationVersion.seasonId !== season.id ||
    summaryVersion.seasonId !== season.id ||
    (input.simulatedLaterFacts ?? []).some(
      (fact) =>
        fact.label !== 'GUARD_SIMULATION' ||
        fact.seasonId !== season.id ||
        fact.candidateVersionId !== regulationVersion.id,
    )
  )
    throw new Error('Phase 2 evidence must bind simulations to persisted core identities.');
  return {
    scope: 'PHASE2_GUARD_SIMULATION',
    persisted: {
      seasonId: season.id,
      regulationVersionId: regulationVersion.id,
      summaryVersionId: summaryVersion.id,
    },
    simulatedLaterFacts: input.simulatedLaterFacts ?? [],
  };
}
