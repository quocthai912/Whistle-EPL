import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { DatabaseService } from '../../src/platform/database.service';
import { ApplicationError } from '../../src/platform/application-error';
import { waitForBlockedBy, barrier, TestClock } from '../fixtures/test-clock';
import { AuditWriterService } from '../../src/audit/audit-writer.service';

describe('transaction foundation with independent PostgreSQL connections', () => {
  const database = new DatabaseService(process.env.TEST_DATABASE_URL!);
  const observer = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  afterAll(async () => {
    await database.close();
    await observer.end();
  });

  it('rolls back a failed write and never retries business errors', async () => {
    let executions = 0;
    await expect(
      database.write(
        [],
        async () => {},
        async (ctx) => {
          executions++;
          await ctx.db.systemGuard.create({ data: { key: `rollback-${randomUUID()}` } });
          throw new ApplicationError(409, 'STATE_CONFLICT', 'Xung đột.');
        },
      ),
    ).rejects.toMatchObject({ code: 'STATE_CONFLICT' });
    expect(executions).toBe(1);
    const result = await observer.query(
      "SELECT count(*)::int AS count FROM system_guard WHERE key LIKE 'rollback-%'",
    );
    expect(result.rows[0].count).toBe(0);
  });

  it('rechecks authority and trusted time after a competing account lock releases', async () => {
    const id = randomUUID();
    await database.client.account.create({
      data: {
        id,
        personnelCode: `TX_${id.slice(0, 8).toUpperCase()}`,
        fullName: 'Kiểm thử giao dịch',
        username: `tx.${id}`,
        passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',
        mustChangePassword: true,
      },
    });
    const blocker = await observer.connect();
    const pid = (await blocker.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    await blocker.query('BEGIN');
    await blocker.query('SELECT id FROM account WHERE id=$1 FOR UPDATE', [id]);
    let effects = 0;
    let checkedAt: Date | undefined;
    const pending = database.write(
      [{ kind: 'account', key: id, mode: 'shared' }],
      async (ctx, now) => {
        checkedAt = now;
        const account = await ctx.db.account.findUniqueOrThrow({ where: { id } });
        if (account.state === 'LOCKED')
          throw new ApplicationError(401, 'PERMISSION_CHANGED', 'Vui lòng đăng nhập lại.');
      },
      async () => {
        effects++;
      },
    );
    const denied = expect(pending).rejects.toMatchObject({ code: 'PERMISSION_CHANGED' });
    try {
      await waitForBlockedBy(observer, pid);
      const boundary = (await blocker.query('SELECT clock_timestamp() AS now')).rows[0].now as Date;
      await blocker.query("UPDATE account SET state='LOCKED' WHERE id=$1", [id]);
      await blocker.query('COMMIT');
      await denied;
      expect(checkedAt!.getTime()).toBeGreaterThanOrEqual(boundary.getTime());
      expect(effects).toBe(0);
    } finally {
      await blocker.query('ROLLBACK');
      blocker.release();
    }
  });

  it('persists closed maintenance across instances and fails closed until the same operation releases it', async () => {
    const operation = randomUUID();
    await database.setMaintenance(true, operation);
    const restarted = new DatabaseService(process.env.TEST_DATABASE_URL!);
    try {
      await expect(
        restarted.write(
          [],
          async () => {},
          async () => true,
        ),
      ).rejects.toMatchObject({ code: 'MAINTENANCE' });
      await expect(restarted.setMaintenance(false, randomUUID())).rejects.toMatchObject({
        code: 'STATE_CONFLICT',
      });
    } finally {
      await database.setMaintenance(false, operation);
      await restarted.close();
    }
    expect(
      await database.write(
        [],
        async () => {},
        async () => true,
      ),
    ).toBe(true);
  });

  it('rolls back the business effect when required audit persistence fails', async () => {
    const key = `audit-rollback-${randomUUID()}`;
    await expect(
      database.write(
        [],
        async () => {},
        async (ctx) => {
          await ctx.db.systemGuard.create({ data: { key } });
          await new AuditWriterService().append(ctx, {
            actor: { kind: 'ACCOUNT', accountId: randomUUID() },
            action: 'ACCOUNT_LOCKED',
            objectKind: 'ACCOUNT',
            outcome: 'SUCCESS',
            after: { state: 'LOCKED' },
          });
        },
      ),
    ).rejects.toThrow();
    expect(
      (await observer.query('SELECT key FROM system_guard WHERE key=$1', [key])).rowCount,
    ).toBe(0);
  });

  it('retries at most three executions only after a known rollback', async () => {
    let effects = 0;
    await expect(
      database.write(
        [],
        async () => {},
        async (ctx) => {
          effects++;
          await ctx.db.$executeRawUnsafe(
            "DO $$ BEGIN RAISE EXCEPTION 'test rollback' USING ERRCODE='40001'; END $$",
          );
        },
      ),
    ).rejects.toMatchObject({ code: 'TRANSACTION_UNAVAILABLE' });
    expect(effects).toBe(3);
  });

  it('lets the owning use case recheck its final write decision after preparatory work', async () => {
    const clock = new TestClock(new Date('2026-01-01T00:00:00Z'));
    const timed = new DatabaseService(process.env.TEST_DATABASE_URL!, clock);
    const key = `expired-${randomUUID()}`;
    try {
      await expect(
        timed.write(
          [],
          async (_ctx, now) => {
            if (now >= new Date('2026-01-01T00:30:00Z'))
              throw new ApplicationError(401, 'SESSION_EXPIRED', 'Phiên đã hết hạn.');
          },
          async (ctx) => {
            await ctx.db.systemGuard.create({ data: { key } });
            clock.set(new Date('2026-01-01T00:30:00Z'));
            await ctx.recheckAuthority();
          },
        ),
      ).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
      expect(
        (await observer.query('SELECT key FROM system_guard WHERE key=$1', [key])).rowCount,
      ).toBe(0);
    } finally {
      await timed.close();
    }
  });

  it('drains admitted writers before closing persisted maintenance admission', async () => {
    const entered = barrier();
    const release = barrier();
    let pid = 0;
    const writer = database.write(
      [],
      async () => {},
      async (ctx) => {
        pid = (await ctx.db.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`)[0]
          .pid;
        entered.release();
        await release.reached;
      },
    );
    const operation = randomUUID();
    let closing: Promise<void> | undefined;
    try {
      await entered.reached;
      closing = database.setMaintenance(true, operation);
      await waitForBlockedBy(observer, pid);
      const next = expect(
        database.write(
          [],
          async () => {},
          async () => true,
        ),
      ).rejects.toMatchObject({ code: 'MAINTENANCE' });
      release.release();
      await writer;
      await closing;
      await next;
    } finally {
      release.release();
      await writer.catch(() => {});
      await closing?.catch(() => {});
      await database.setMaintenance(false, operation);
    }
  });

  it('does not automatically repeat a transaction when the connection outcome is uncertain', async () => {
    let effects = 0;
    const key = `unknown-${randomUUID()}`;
    await expect(
      database.write(
        [],
        async () => {},
        async (ctx) => {
          effects++;
          await ctx.db.systemGuard.create({ data: { key } });
          const pid = (
            await ctx.db.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`
          )[0].pid;
          await observer.query('SELECT pg_terminate_backend($1)', [pid]);
        },
      ),
    ).rejects.toThrow();
    expect(effects).toBe(1);
    expect(
      (await observer.query('SELECT key FROM system_guard WHERE key=$1', [key])).rowCount,
    ).toBe(0);
  });
});
