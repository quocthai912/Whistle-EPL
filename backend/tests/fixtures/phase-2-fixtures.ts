import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { assertIsolatedTarget } from './isolated-target.guard';
import { createPhase1Fixtures, resetPhase1Fixtures } from './phase-1-fixtures';

export type Phase2FixtureSet = {
  accounts: readonly { id: string; username: string }[];
  seasons: readonly { id: string; code: string; name: string }[];
  regulationVersions: readonly { id: string; seasonId: string; caseId: string }[];
  summaryVersions: readonly { id: string; seasonId: string; caseId: string }[];
};

/** Creates only synthetic rows in an explicitly isolated test database; never imported by app code. */
export async function createPhase2Fixtures(databaseUrl: string): Promise<Phase2FixtureSet> {
  assertIsolatedTarget(databaseUrl);
  const foundation = await createPhase1Fixtures(databaseUrl);
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
    log: [],
  });
  try {
    return await client.$transaction(async (tx) => {
      const regulationVersions: Phase2FixtureSet['regulationVersions'][number][] = [];
      const summaryVersions: Phase2FixtureSet['summaryVersions'][number][] = [];
      for (const [index, season] of foundation.seasons.entries()) {
        const regulationCase = await tx.regulationCase.create({
          data: { seasonId: season.id },
        });
        const regulationVersion = await tx.regulationVersion.create({
          data: {
            seasonId: season.id,
            caseId: regulationCase.id,
            versionNumber: 1,
            preparedBy: foundation.accounts[0].id,
          },
        });
        regulationVersions.push({
          id: regulationVersion.id,
          seasonId: season.id,
          caseId: regulationCase.id,
        });

        const summaryCase = await tx.seasonSummaryCase.create({
          data: { seasonId: season.id },
        });
        const summaryVersion = await tx.seasonSummaryVersion.create({
          data: {
            seasonId: season.id,
            caseId: summaryCase.id,
            versionNumber: 1,
            preparedBy: foundation.accounts[0].id,
            reportDate: new Date(`${2027 + index}-05-31T00:00:00.000Z`),
          },
        });
        summaryVersions.push({
          id: summaryVersion.id,
          seasonId: season.id,
          caseId: summaryCase.id,
        });
      }
      return {
        accounts: foundation.accounts,
        seasons: foundation.seasons,
        regulationVersions,
        summaryVersions,
      };
    });
  } finally {
    await client.$disconnect();
  }
}

/** Retains the existing loopback/name guard and exact reset acknowledgement; no CASCADE is used. */
export async function resetPhase2Fixtures(
  databaseUrl: string,
  acknowledgement: string,
): Promise<void> {
  assertIsolatedTarget(databaseUrl);
  if (acknowledgement !== 'RESET_ISOLATED_TEST_DATABASE')
    throw new Error('Explicit isolated reset acknowledgement required.');
  await resetPhase1Fixtures(databaseUrl, acknowledgement);
}
