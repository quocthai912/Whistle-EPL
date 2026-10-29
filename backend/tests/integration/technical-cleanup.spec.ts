import { randomUUID, randomBytes } from 'node:crypto';
import { DatabaseService } from '../../src/platform/database.service';
import { TechnicalCleanupService } from '../../src/operations/technical-cleanup.service';

describe('hourly eligible technical cleanup', () => {
  const database = new DatabaseService(process.env.TEST_DATABASE_URL!);
  afterAll(async () => {
    await database.close();
  });
  it('keeps active blocks and recent failures, deletes only eligible technical evidence', async () => {
    const suffix = randomUUID();
    const now = new Date();
    const old = new Date(now.getTime() - 90000000);
    const key = `cleanup.${suffix}`;
    const expiredCsrf = randomBytes(32).toString('base64url');
    const liveCsrf = randomBytes(32).toString('base64url');
    await database.client.loginThrottleKey.create({
      data: { kind: 'USERNAME', key, blockedUntil: new Date(now.getTime() + 900000) },
    });
    await database.client.loginFailure.createMany({
      data: [
        { usernameKey: key, ipKey: '192.0.2.1', occurredAt: old },
        { usernameKey: key, ipKey: '192.0.2.1', occurredAt: now },
      ],
    });
    await database.client.preloginCsrfContext.createMany({
      data: [
        { csrfToken: expiredCsrf, createdAt: old, expiresAt: new Date(old.getTime() + 900000) },
        { csrfToken: liveCsrf, createdAt: now, expiresAt: new Date(now.getTime() + 900000) },
      ],
    });
    const auditCount = await database.client.auditRecord.count();
    await new TechnicalCleanupService(database).execute();
    expect(await database.client.loginFailure.count({ where: { usernameKey: key } })).toBe(2);
    expect(await database.client.loginThrottleKey.count({ where: { key } })).toBe(1);
    expect(
      await database.client.preloginCsrfContext.count({ where: { csrfToken: expiredCsrf } }),
    ).toBe(0);
    expect(
      await database.client.preloginCsrfContext.count({ where: { csrfToken: liveCsrf } }),
    ).toBe(1);
    await database.client.loginThrottleKey.update({
      where: { kind_key: { kind: 'USERNAME', key } },
      data: { blockedUntil: old },
    });
    await new TechnicalCleanupService(database).execute();
    expect(await database.client.loginFailure.count({ where: { usernameKey: key } })).toBe(1);
    expect(await database.client.auditRecord.count()).toBe(auditCount);
  });
  it('retains pending and unexpired completed receipts for their full guarantee', async () => {
    const id = randomUUID();
    const account = await database.client.account.create({
      data: {
        personnelCode: `CL_${id.slice(0, 8).toUpperCase()}`,
        fullName: 'Nhân viên kiểm thử lưu kết quả',
        username: `cleanup.${id}`,
        passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',
        mustChangePassword: true,
      },
    });
    const now = new Date();
    const old = new Date(now.getTime() - 90000000);
    const base = {
      accountId: account.id,
      actionCode: 'ACCOUNT_UPDATED',
      contentDigest: 'c'.repeat(64),
    };
    const expired = await database.client.commandReceipt.create({
      data: {
        ...base,
        requestKey: randomUUID(),
        outcomeState: 'COMPLETED',
        completedAt: old,
        expiresAt: new Date(old.getTime() + 86400000),
        responseStatus: 200,
        responseData: { saved: true },
      },
    });
    const fresh = await database.client.commandReceipt.create({
      data: {
        ...base,
        requestKey: randomUUID(),
        outcomeState: 'COMPLETED',
        completedAt: now,
        expiresAt: new Date(now.getTime() + 86400000),
        responseStatus: 200,
        responseData: { saved: true },
      },
    });
    const pending = await database.client.commandReceipt.create({
      data: { ...base, requestKey: randomUUID(), outcomeState: 'PENDING' },
    });
    await new TechnicalCleanupService(database).execute();
    expect(
      await database.client.commandReceipt.findUnique({ where: { id: expired.id } }),
    ).toBeNull();
    expect(
      await database.client.commandReceipt.count({ where: { id: { in: [fresh.id, pending.id] } } }),
    ).toBe(2);
  });
});
