import type { TransactionContext } from '../platform/transaction-context';
import type { Prisma } from '../generated/prisma/client';
import type { RegulationDraftContent } from './regulation-validation';

export const regulationContentRelations = {
  registrationWindows: {
    select: { intakeKind: true, opensAt: true, closesAt: true },
    orderBy: [{ intakeKind: 'asc' }, { opensAt: 'asc' }, { id: 'asc' }],
  },
  rankingPriority: {
    select: { position: true, criterionCode: true },
    orderBy: { position: 'asc' },
  },
  goalTypes: {
    select: { code: true, name: true, isOwnGoal: true, enabled: true },
    orderBy: { code: 'asc' },
  },
  cardTypes: {
    select: { code: true, name: true, meaning: true, enabled: true },
    orderBy: { code: 'asc' },
  },
} satisfies Prisma.RegulationVersionInclude;

export async function loadRegulationContent(
  context: TransactionContext,
  versionId: string,
): Promise<RegulationDraftContent> {
  const version = await context.db.regulationVersion.findUniqueOrThrow({
    where: { id: versionId },
    include: regulationContentRelations,
  });
  return projectRegulationContent(version);
}

export function projectRegulationContent(
  version: Prisma.RegulationVersionGetPayload<{
    include: typeof regulationContentRelations;
  }>,
): RegulationDraftContent {
  return {
    effectiveMode: version.effectiveMode as RegulationDraftContent['effectiveMode'],
    proposedEffectiveAt: version.proposedEffectiveAt?.toISOString() ?? null,
    squadLimit: version.squadLimit,
    nonHomegrownLimit: version.nonHomegrownLimit,
    homegrownSeasons: version.homegrownSeasons,
    homegrownMonths: version.homegrownMonths,
    homegrownAgeStart: version.homegrownAgeStart,
    homegrownAgeEnd: version.homegrownAgeEnd,
    u21Cutoff: version.u21Cutoff?.toISOString().slice(0, 10) ?? null,
    registrationWindows: version.registrationWindows.map((window) => ({
      intakeKind: window.intakeKind as NonNullable<
        RegulationDraftContent['registrationWindows']
      >[number]['intakeKind'],
      opensAt: window.opensAt.toISOString(),
      closesAt: window.closesAt.toISOString(),
    })),
    clubCount: version.clubCount,
    formatCode: version.formatCode as RegulationDraftContent['formatCode'],
    legs: version.legs,
    plannedMinutes: version.plannedMinutes,
    preparationMinutes: version.preparationMinutes,
    releaseMinutes: version.releaseMinutes,
    winPoints: version.winPoints,
    drawPoints: version.drawPoints,
    lossPoints: version.lossPoints,
    rankingPriority: version.rankingPriority.map((entry) => ({
      position: entry.position,
      criterionCode: entry.criterionCode as NonNullable<
        RegulationDraftContent['rankingPriority']
      >[number]['criterionCode'],
    })),
    qualificationCount: version.qualificationCount,
    relegationCount: version.relegationCount,
    goalTypes: version.goalTypes.map((goal) => ({
      code: goal.code,
      name: goal.name,
      isOwnGoal: goal.isOwnGoal,
      enabled: goal.enabled,
    })),
    cardTypes: version.cardTypes.map((card) => ({
      code: card.code,
      name: card.name,
      meaning: card.meaning as NonNullable<RegulationDraftContent['cardTypes']>[number]['meaning'],
      enabled: card.enabled,
    })),
  };
}
