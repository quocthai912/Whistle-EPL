import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../../src/platform/database.service';
import { SecurityPrimitivesService } from '../../src/identity-access/security-primitives.service';
import { assertIsolatedTarget } from './isolated-target.guard';
import { createPhase1Fixtures } from './phase-1-fixtures';

function database() {
  return new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
}

export async function browserAdministration() {
  const fixtures = await createPhase1Fixtures(
    assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''),
  );
  const db = database();
  try {
    await db.client.account.updateMany({
      where: { id: { in: fixtures.accounts.map(({ id }) => id) } },
      data: { mustChangePassword: false, temporaryPasswordExpiresAt: null },
    });
    return {
      ...fixtures,
      accounts: fixtures.accounts.map((account) => ({
        ...account,
        password: 'Synthetic fixture credential 🦉 only',
      })),
    };
  } finally {
    await db.close();
  }
}

export async function expireBrowserPrelogin(id: string) {
  const db = database();
  try {
    const createdAt = new Date(Date.now() - 900001);
    await db.client.preloginCsrfContext.update({
      where: { id },
      data: { createdAt, expiresAt: new Date(createdAt.getTime() + 900000) },
    });
  } finally {
    await db.close();
  }
}

/** Explicit test-process preparation only. No HTTP endpoint or application startup import. */
export async function browserAccount(temporary = false) {
  const db = database();
  const username = `browser.${randomUUID()}`;
  const password = `Synthetic 🦉 ${randomUUID()}`;
  try {
    const row = await db.client.account.create({
      data: {
        username,
        personnelCode: `B_${randomUUID().replaceAll('-', '').slice(0, 24).toUpperCase()}`,
        fullName: 'Nhân viên trình duyệt',
        passwordHash: await new SecurityPrimitivesService().hashPassword(password),
        mustChangePassword: temporary,
        temporaryPasswordExpiresAt: temporary ? new Date(Date.now() + 86400000) : null,
      },
    });
    return { id: row.id, username, password };
  } finally {
    await db.close();
  }
}

export async function changeBrowserBasis(
  accountId: string,
  change: 'idle' | 'absolute' | 'revoke' | 'lock',
) {
  const db = database();
  try {
    const created = new Date(Date.now() - (change === 'absolute' ? 28800001 : 1800001));
    if (change === 'idle')
      await db.client.session.updateMany({
        where: { accountId },
        data: {
          createdAt: created,
          lastActivityAt: created,
          absoluteExpiresAt: new Date(created.getTime() + 28800000),
        },
      });
    if (change === 'absolute')
      await db.client.session.updateMany({
        where: { accountId },
        data: {
          createdAt: created,
          lastActivityAt: new Date(created.getTime() + 1000),
          absoluteExpiresAt: new Date(created.getTime() + 28800000),
        },
      });
    if (change === 'revoke')
      await db.client.account.update({
        where: { id: accountId },
        data: { authRevision: { increment: 1 } },
      });
    if (change === 'lock')
      await db.client.account.update({
        where: { id: accountId },
        data: { state: 'LOCKED', authRevision: { increment: 1 } },
      });
  } finally {
    await db.close();
  }
}
