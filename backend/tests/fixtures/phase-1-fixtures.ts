import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { SecurityPrimitivesService } from '../../src/identity-access/security-primitives.service';
import { assertIsolatedTarget } from './isolated-target.guard';

/** Never imported by application startup or exposed through HTTP. */
export async function createPhase1Fixtures(databaseUrl: string) {
  assertIsolatedTarget(databaseUrl);
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
    log: [],
  });
  try {
    const passwordHash = await new SecurityPrimitivesService().hashPassword(
      'Synthetic fixture credential 🦉 only',
    );
    return await client.$transaction(async (tx) => {
      const accounts = [];
      for (let i = 0; i < 5; i++) {
        const id = randomUUID();
        accounts.push(
          await tx.account.create({
            data: {
              id,
              personnelCode: `TEST_${id.replaceAll('-', '').slice(0, 24).toUpperCase()}`,
              fullName: `Nhân viên kiểm thử ${i + 1}`,
              username: `test.${id}`,
              passwordHash,
              mustChangePassword: true,
              temporaryPasswordExpiresAt: new Date(Date.now() + 86400000),
            },
          }),
        );
      }
      const seasons = [];
      for (let i = 0; i < 2; i++) {
        const id = randomUUID();
        seasons.push(
          await tx.season.create({
            data: {
              id,
              code: `TEST_${id.replaceAll('-', '').slice(0, 24).toUpperCase()}`,
              name: `Mùa giải kiểm thử ${i + 1}`,
              startDate: new Date(`${2026 + i}-08-01T00:00:00Z`),
              endDate: new Date(`${2027 + i}-05-31T00:00:00Z`),
            },
          }),
        );
      }
      const now = new Date();
      for (const admin of accounts.slice(0, 2))
        await tx.systemRoleAssignment.create({
          data: {
            accountId: admin.id,
            roleCode: 'SYSTEM_ADMINISTRATOR',
            grantedBy: accounts[0].id,
            grantedAt: now,
          },
        });
      await tx.seasonRoleAssignment.createMany({
        data: [
          {
            accountId: accounts[2].id,
            seasonId: seasons[0].id,
            roleCode: 'SEASON_MANAGER',
            grantedBy: accounts[0].id,
            grantedAt: now,
          },
          {
            accountId: accounts[3].id,
            seasonId: seasons[0].id,
            roleCode: 'SCHEDULING_OFFICER',
            grantedBy: accounts[0].id,
            grantedAt: now,
          },
          {
            accountId: accounts[4].id,
            seasonId: seasons[1].id,
            roleCode: 'RESULTS_OFFICER',
            grantedBy: accounts[0].id,
            grantedAt: now,
          },
        ],
      });
      // Return safe identifiers, never the reusable fixture credential/hash.
      return {
        accounts: accounts.map((a) => ({ id: a.id, username: a.username })),
        seasons: seasons.map((s) => ({ id: s.id, code: s.code })),
      };
    });
  } finally {
    await client.$disconnect();
  }
}

export async function resetPhase1Fixtures(
  databaseUrl: string,
  acknowledgement: string,
): Promise<void> {
  assertIsolatedTarget(databaseUrl);
  if (acknowledgement !== 'RESET_ISOLATED_TEST_DATABASE')
    throw new Error('Explicit isolated reset acknowledgement required.');
  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
    log: [],
  });
  try {
    await client.$executeRawUnsafe(`TRUNCATE TABLE public.account,public.season,public.session,public.prelogin_csrf_context,
      public.login_throttle_key,public.login_failure,public.system_role_assignment,public.season_role_assignment,
      public.shared_master_grant,public.create_season_grant,public.delegation_case,public.delegation_version,
      public.delegation_version_editor,public.delegation_grant,public.delegation_boundary,public.audit_record,public.command_receipt`);
  } finally {
    await client.$disconnect();
  }
}
