import type { Prisma } from '../generated/prisma/client';
import type { LockResource, TransactionContext } from '../platform/transaction-context';

export const dependencyKinds = [
  'registrationCompatibility',
  'scheduleFreeze',
  'officialResultFreeze',
  'referencedCatalogUsage',
  'masterImpact',
  'publicMediaScope',
  'seasonSummary',
  'seasonClosingReadiness',
] as const;

export type DependencyKind = (typeof dependencyKinds)[number];
export type DependencyWriter =
  | 'registry-registration'
  | 'scheduling'
  | 'match-results'
  | 'statistics-reporting'
  | 'public-queries';

export type DependencyRequestMap = {
  registrationCompatibility: { seasonId: string; candidateVersionId: string };
  scheduleFreeze: { seasonId: string; candidateVersionId: string };
  officialResultFreeze: { seasonId: string; candidateVersionId: string };
  referencedCatalogUsage: {
    seasonId: string;
    candidateVersionId: string;
    catalogCodes: readonly string[];
  };
  masterImpact: {
    seasonId: string;
    candidateVersionId: string;
    resourceKind: 'CLUB' | 'STADIUM';
    resourceId: string;
  };
  publicMediaScope: { seasonId: string; ownerKind: 'CLUB' | 'PLAYER'; ownerId: string };
  seasonSummary: { seasonId: string };
  seasonClosingReadiness: { seasonId: string };
};

export interface ImmutableJsonObject {
  readonly [key: string]: ImmutableJsonValue;
}

export interface ImmutableJsonArray extends ReadonlyArray<ImmutableJsonValue> {
  readonly length: number;
}

export type ImmutableJsonValue =
  string | number | boolean | null | ImmutableJsonArray | ImmutableJsonObject;

/** Snapshot basis and content retained by an immutable confirmed summary version. */
export type SeasonSummarySourceSnapshot = Readonly<{
  basis: Readonly<{
    regulationVersionId: string;
    officialReportVersionIds: readonly string[];
    rankingResolutionVersionIds: readonly string[];
  }>;
  content: Readonly<Record<string, ImmutableJsonValue>>;
}>;

export type RegistrationIntervalComposition = {
  startsAt: string;
  endsAt: string | null;
  registrations: readonly {
    registrationId: string;
    versionId: string;
    playerId: string;
    clubId: string;
    source: 'VALIDATED_REGISTRATION' | 'CONFIRMED_FUTURE_PLAN';
    /** Null means the owning source lacks enough evidence to establish this classification. */
    u21: boolean | null;
    homegrown: boolean | null;
  }[];
};

export type SeasonSummaryFacts = {
  caseExists: boolean;
  caseId: string | null;
  currentConfirmedVersionId: string | null;
  currentVersionState: string | null;
  currentStatisticsRevision: string;
  basisStatisticsRevision: string | null;
  sourceSnapshot: SeasonSummarySourceSnapshot | null;
  needsReconfirmation: boolean;
};

export type DependencyFactsMap = {
  registrationCompatibility: {
    intervalCompositions: readonly RegistrationIntervalComposition[];
  };
  scheduleFreeze: {
    initialApprovalVersionId: string | null;
    frozenAt: string | null;
    structure: {
      clubCount: number;
      formatCode: 'DOUBLE_ROUND_ROBIN';
      legs: 2;
    } | null;
    planning: {
      plannedMinutes: number;
      preparationMinutes: number;
      releaseMinutes: number;
    } | null;
    affectedScheduleVersionIds: readonly string[];
  };
  officialResultFreeze: {
    firstOfficialReportVersionId: string | null;
    firstConfirmedAt: string | null;
    basisRegulationVersionId: string | null;
    frozenRules: {
      clubCount: number;
      winPoints: number;
      drawPoints: number;
      lossPoints: number;
      rankingPriority: readonly ('POINTS' | 'GOAL_DIFFERENCE' | 'GOALS_FOR')[];
      qualificationCount: number;
      relegationCount: number;
    } | null;
    confirmedReportVersionIds: readonly string[];
  };
  referencedCatalogUsage: {
    references: readonly {
      catalogCode: string;
      sourceVersionId: string;
      enabledWhenRecorded: boolean;
    }[];
  };
  masterImpact: {
    affected: readonly { kind: 'REGISTRATION' | 'SCHEDULE' | 'RESULT'; id: string }[];
  };
  publicMediaScope: {
    public: boolean;
    basisReference: string | null;
  };
  seasonSummary: SeasonSummaryFacts;
  seasonClosingReadiness: {
    summary: SeasonSummaryFacts;
    unresolvedRequests: readonly { kind: 'REGULATION_CHANGE' | 'LIFECYCLE'; id: string }[];
    waitingEffects: readonly { kind: 'REGULATION' | 'REGISTRATION'; versionId: string }[];
    playingIntervals: readonly { registrationId: string; playingEnd: string | null }[];
    unresolvedFuturePlans: readonly {
      registrationId: string;
      versionId: string;
      startsAt: string;
    }[];
  };
};

export type DependencyFactBasis = {
  owner: DependencyWriter;
  sourceRevision: string;
  references: readonly string[];
};

export type DependencyProviderResult<K extends DependencyKind> = {
  facts: DependencyFactsMap[K];
  basis: DependencyFactBasis;
};

export type DependencyProvider<K extends DependencyKind> = {
  discoverLocks(
    db: Prisma.TransactionClient,
    request: DependencyRequestMap[K],
  ): Promise<readonly LockResource[]>;
  read(
    context: TransactionContext,
    request: DependencyRequestMap[K],
  ): Promise<DependencyProviderResult<K>>;
};

export type DependencyProviderMap = {
  [K in DependencyKind]?: DependencyProvider<K>;
};

/** Compile-time application module registration consumed by the shared port factory. */
export type DependencyModuleRegistration = {
  writer: DependencyWriter;
  providers?: DependencyProviderMap;
};

export type RelationCatalog = {
  existing(
    db: Prisma.TransactionClient,
    expectedRelations: readonly string[],
  ): Promise<readonly string[]>;
};

export type DependencyUnavailableCause =
  | 'SCHEMA_CATALOG_FAILURE'
  | 'INVALID_SCHEMA_CATALOG'
  | 'PARTIAL_SOURCE_SCHEMA'
  | 'SOURCE_WRITER_WITHOUT_ADAPTER'
  | 'SOURCE_SCHEMA_WITHOUT_ADAPTER'
  | 'SOURCE_SCHEMA_ABSENT_WITH_ADAPTER'
  | 'PROVIDER_FAILURE'
  | 'INVALID_PROVIDER_RESULT';

export type DependencyBasis =
  | {
      owner: DependencyWriter;
      presentRelations: readonly string[];
      registeredWriters: readonly DependencyWriter[];
    }
  | {
      owner: DependencyWriter;
      absentRelations: readonly string[];
      registeredWriters: readonly [];
    }
  | {
      owner: DependencyWriter;
      cause: DependencyUnavailableCause;
      presentRelations: readonly string[];
      registeredWriters: readonly DependencyWriter[];
    }
  | DependencyFactBasis;

export type DependencyDiscovery =
  | {
      status: 'KNOWN';
      locks: readonly LockResource[];
      basis: Extract<DependencyBasis, { presentRelations: readonly string[] }>;
    }
  | {
      status: 'VERIFIED_NOT_INTRODUCED';
      locks: readonly [];
      basis: Extract<DependencyBasis, { absentRelations: readonly string[] }>;
    }
  | {
      status: 'UNAVAILABLE';
      locks: readonly [];
      basis: Extract<DependencyBasis, { cause: DependencyUnavailableCause }>;
    };

export type DependencyResult<K extends DependencyKind> =
  | {
      status: 'KNOWN';
      facts: DependencyFactsMap[K];
      basis: DependencyFactBasis;
      locks: readonly LockResource[];
    }
  | {
      status: 'VERIFIED_NOT_INTRODUCED';
      facts: null;
      basis: Extract<DependencyBasis, { absentRelations: readonly string[] }>;
      locks: readonly [];
    }
  | {
      status: 'UNAVAILABLE';
      facts: null;
      basis: Extract<DependencyBasis, { cause: DependencyUnavailableCause }>;
      locks: readonly [];
    };

/** Typed source contracts and static owner registrations; relation names are never request data. */
export const dependencySources: Record<
  DependencyKind,
  { owner: DependencyWriter; relations: readonly string[]; writers: readonly DependencyWriter[] }
> = {
  registrationCompatibility: {
    owner: 'registry-registration',
    relations: ['player_registration', 'registration_version'],
    writers: ['registry-registration'],
  },
  scheduleFreeze: {
    owner: 'scheduling',
    relations: ['schedule_case', 'schedule_version', 'match'],
    writers: ['scheduling'],
  },
  officialResultFreeze: {
    owner: 'match-results',
    relations: ['match', 'match_report_case', 'match_report_version'],
    writers: ['match-results'],
  },
  referencedCatalogUsage: {
    owner: 'match-results',
    relations: ['match_report_version', 'appearance', 'goal_event', 'card_event'],
    writers: ['match-results'],
  },
  masterImpact: {
    owner: 'registry-registration',
    relations: [
      'player_registration',
      'registration_version',
      'schedule_case',
      'match',
      'match_report_version',
    ],
    writers: ['registry-registration', 'scheduling', 'match-results'],
  },
  publicMediaScope: {
    owner: 'public-queries',
    relations: ['player', 'media_asset'],
    writers: ['public-queries', 'registry-registration'],
  },
  seasonSummary: {
    owner: 'statistics-reporting',
    relations: ['season_summary_case', 'season_summary_version', 'season_summary_version_editor'],
    writers: [],
  },
  seasonClosingReadiness: {
    owner: 'statistics-reporting',
    relations: [
      'season_summary_case',
      'season_summary_version',
      'season_lifecycle_request',
      'regulation_change_request',
      'player_registration',
      'schedule_case',
      'match',
      'match_report_version',
    ],
    writers: ['registry-registration', 'scheduling', 'match-results', 'statistics-reporting'],
  },
};

export interface SeasonDependenciesPort {
  discover<K extends DependencyKind>(
    kind: K,
    db: Prisma.TransactionClient,
    request: DependencyRequestMap[K],
  ): Promise<DependencyDiscovery>;
  read<K extends DependencyKind>(
    kind: K,
    context: TransactionContext,
    request: DependencyRequestMap[K],
  ): Promise<DependencyResult<K>>;
}
