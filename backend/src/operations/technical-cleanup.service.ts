import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../platform/database.service';
import type { LockResource } from '../platform/transaction-context';
import { Prisma } from '../generated/prisma/client';

export class TechnicalCleanupService {
  constructor(private readonly database?: DatabaseService) {}
  @Cron('0 0 * * * *', { waitForCompletion: true })
  async hourly(): Promise<void> {
    if (!this.database) return;
    try {
      await this.execute();
      console.log('Hourly technical cleanup completed.');
    } catch {
      console.error(
        'Hourly technical cleanup failed or maintenance is active. Inspect operator state.',
      );
    }
  }
  async execute(): Promise<void> {
    if (!this.database) throw new Error('Configured database required.');
    const candidateTime = new Date();
    const accounts = await this.database.client.account.findMany({
      where: {
        sessions: {
          some: {
            OR: [
              { revokedAt: { not: null } },
              { absoluteExpiresAt: { lte: candidateTime } },
              { lastActivityAt: { lte: new Date(candidateTime.getTime() - 1800000) } },
            ],
          },
        },
      },
      select: { id: true },
    });
    const locks: LockResource[] = accounts.map((a) => ({
      kind: 'account',
      key: a.id,
      mode: 'exclusive',
    }));
    await this.database.write(
      locks,
      async () => {},
      async (context) => {
        const now = await context.now();
        await context.db.session.deleteMany({
          where: {
            accountId: { in: accounts.map((account) => account.id) },
            OR: [
              { revokedAt: { not: null } },
              { absoluteExpiresAt: { lte: now } },
              { lastActivityAt: { lte: new Date(now.getTime() - 1800000) } },
            ],
          },
        });
        await context.db.preloginCsrfContext.deleteMany({ where: { expiresAt: { lte: now } } });
        // Pending receipts never expire; completed receipts retain the full 24-hour guarantee.
        const receipts = await context.db.commandReceipt.findMany({
          where: { outcomeState: 'COMPLETED', expiresAt: { lte: now } },
        });
        for (const receipt of receipts.sort((a, b) =>
          `${a.accountId}:${a.actionCode}:${a.requestKey}`.localeCompare(
            `${b.accountId}:${b.actionCode}:${b.requestKey}`,
          ),
        )) {
          await context.lockReceipt(
            `${receipt.accountId}:${receipt.actionCode}:${receipt.requestKey}`,
          );
          await context.db.commandReceipt.deleteMany({
            where: {
              id: receipt.id,
              outcomeState: 'COMPLETED',
              expiresAt: { lte: await context.now() },
            },
          });
        }
      },
    );
    const [{ now }] = await this.database.client.$queryRaw<
      Array<{ now: Date }>
    >`SELECT clock_timestamp() AS now`;
    const cutoff = new Date(now.getTime() - 86400000);
    let cursor: string | undefined;
    for (;;) {
      const failures = await this.database.client.loginFailure.findMany({
        where: { occurredAt: { lt: cutoff }, ...(cursor ? { id: { gt: cursor } } : {}) },
        orderBy: { id: 'asc' },
        take: 250,
        select: { id: true, usernameKey: true, ipKey: true },
      });
      if (failures.length === 0) break;
      const securityLocks: LockResource[] = failures.flatMap((failure) => [
        { kind: 'security', key: `username:${failure.usernameKey}`, mode: 'exclusive' },
        { kind: 'security', key: `ip:${failure.ipKey}`, mode: 'exclusive' },
      ]);
      // These logical keys also synchronize matching/missing throttle rows. acquire() deduplicates them.
      await this.database.write(
        securityLocks,
        async () => {},
        async (context) => {
          const decisionTime = await context.now();
          await context.db.$executeRaw(Prisma.sql`DELETE FROM login_failure f
          WHERE f.id IN (${Prisma.join(failures.map((failure) => Prisma.sql`${failure.id}::uuid`))})
          AND occurred_at < ${new Date(decisionTime.getTime() - 86400000)}
          AND NOT EXISTS (SELECT 1 FROM login_throttle_key k WHERE k.blocked_until > ${decisionTime}
            AND ((k.kind='USERNAME' AND k.key=f.username_key) OR (k.kind='IP' AND k.key=f.ip_key)))`);
        },
      );
      cursor = failures[failures.length - 1].id;
    }
  }
  async onModuleDestroy(): Promise<void> {
    await this.database?.close();
  }
}
