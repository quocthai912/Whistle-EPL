import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../../src/platform/database.service';
import { CommandReceiptService } from '../../src/platform/command-receipt.service';
import { Pool } from 'pg';
import { barrier, waitForBlockedBy } from '../fixtures/test-clock';
import { ApplicationError } from '../../src/platform/application-error';

describe('critical command receipt interface', () => {
  const database = new DatabaseService(process.env.TEST_DATABASE_URL!);
  const receipts = new CommandReceiptService();
  afterAll(() => database.close());
  it('recovers matching outcomes before re-evaluating a stale revision and rejects changed intent', async () => {
    const id = randomUUID();
    await database.client.account.create({
      data: {
        id,
        personnelCode: `R_${id.slice(0, 8).toUpperCase()}`,
        fullName: 'Nhân viên kiểm thử',
        username: `r.${id}`,
        passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',
        mustChangePassword: true,
      },
    });
    const command = {
      accountId: id,
      action: 'ACCOUNT_LOCKED' as const,
      key: randomUUID(),
      targetId: id,
      payload: { expectedRevision: '1' },
    };
    let effects = 0;
    const run = () =>
      database.write(
        [{ kind: 'account', key: id, mode: 'exclusive' }],
        async () => {},
        (ctx) =>
          receipts.execute(
            ctx,
            command,
            async () => {
              effects++;
              const account = await ctx.db.account.findUniqueOrThrow({ where: { id } });
              if (account.revision !== 1n)
                throw new Error('Stale edit must not execute on replay.');
              await ctx.db.account.update({
                where: { id },
                data: { state: 'LOCKED', revision: { increment: 1 } },
              });
              return { status: 200 as const, data: { id, revision: '2' } };
            },
            async (_ctx, outcome) => outcome,
          ),
      );
    expect(await run()).toEqual({ status: 200, data: { id, revision: '2' } });
    expect(await run()).toEqual({ status: 200, data: { id, revision: '2' } });
    expect(effects).toBe(1);
    await expect(
      database.write(
        [{ kind: 'account', key: id, mode: 'exclusive' }],
        async () => {},
        (ctx) =>
          receipts.execute(
            ctx,
            { ...command, payload: { expectedRevision: '2' } },
            async () => {
              throw new Error('Must not execute');
            },
            async (_ctx, outcome) => outcome,
          ),
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
  });

  it('serializes independent same-key contenders and recovers a committed result after a lost response', async () => {
    const id = randomUUID();
    await database.client.account.create({
      data: {
        id,
        personnelCode: `C_${id.slice(0, 8).toUpperCase()}`,
        fullName: 'Kiểm thử tranh chấp',
        username: `c.${id}`,
        passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',
        mustChangePassword: true,
      },
    });
    const second = new DatabaseService(process.env.TEST_DATABASE_URL!);
    const observer = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const command = {
      accountId: id,
      action: 'ACCOUNT_UNLOCKED' as const,
      key: randomUUID(),
      targetId: id,
      payload: { expectedRevision: '1' },
    };
    const entered = barrier();
    const release = barrier();
    let effects = 0;
    let pid = 0;
    const authority = async (ctx: Parameters<Parameters<typeof database.write>[1]>[0]) => {
      if ((await ctx.db.account.findUniqueOrThrow({ where: { id } })).state === 'LOCKED')
        throw new ApplicationError(403, 'ACCESS_DENIED', 'Không có quyền.');
    };
    const run = (connection: DatabaseService) =>
      connection.write([{ kind: 'account', key: id, mode: 'shared' }], authority, (ctx) =>
        receipts.execute(
          ctx,
          command,
          async () => {
            effects++;
            pid = (
              await ctx.db.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`
            )[0].pid;
            await ctx.db.systemGuard.create({ data: { key: `receipt-effect-${command.key}` } });
            entered.release();
            await release.reached;
            return { status: 200, data: { id, revision: '1' } };
          },
          async (_ctx, outcome) => outcome,
        ),
      );
    const first = run(database);
    try {
      await entered.reached;
      const contender = run(second);
      await waitForBlockedBy(observer, pid);
      release.release();
      expect(await first).toEqual(await contender);
      // Pretend the successful response was lost: the exact intent still recovers once.
      expect(await run(second)).toEqual({ status: 200, data: { id, revision: '1' } });
      expect(effects).toBe(1);
      await database.client.account.update({ where: { id }, data: { state: 'LOCKED' } });
      await expect(run(second)).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
    } finally {
      release.release();
      await first.catch(() => {});
      await second.close();
      await observer.end();
    }
  });

  it('rejects credential actions and rolls back effects when the outcome contains a secret', async () => {
    await expect(
      database.write(
        [],
        async () => {},
        (ctx) =>
          receipts.execute(
            ctx,
            {
              accountId: randomUUID(),
              action: 'PASSWORD_RESET' as never,
              key: randomUUID(),
              targetId: randomUUID(),
              payload: { expectedRevision: '1', temporaryPassword: 'secret' },
            },
            async () => {
              throw new Error('Must not run');
            },
            async (_ctx, outcome) => outcome,
          ),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    const id = randomUUID();
    await database.client.account.create({
      data: {
        id,
        personnelCode: `S_${id.slice(0, 8).toUpperCase()}`,
        fullName: 'Kiểm thử bí mật',
        username: `s.${id}`,
        passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',
        mustChangePassword: true,
      },
    });
    const key = randomUUID();
    await expect(
      database.write(
        [{ kind: 'account', key: id, mode: 'exclusive' }],
        async () => {},
        (ctx) =>
          receipts.execute(
            ctx,
            {
              accountId: id,
              action: 'ACCOUNT_LOCKED',
              key,
              targetId: id,
              payload: { expectedRevision: '1' },
            },
            async () => {
              await ctx.db.account.update({ where: { id }, data: { state: 'LOCKED' } });
              return { status: 200, data: { id, revision: '2', password: 'do-not-store' } };
            },
            async (_ctx, outcome) => outcome,
          ),
      ),
    ).rejects.toThrow('Unsafe receipt response');
    expect((await database.client.account.findUniqueOrThrow({ where: { id } })).state).toBe(
      'ACTIVE',
    );
    expect(await database.client.commandReceipt.count({ where: { requestKey: key } })).toBe(0);
  });
});
