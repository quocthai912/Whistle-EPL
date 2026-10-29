import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../platform/database.service';
import type { LockResource } from '../platform/transaction-context';

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
    const keys = await this.database.client.loginThrottleKey.findMany();
    const failures = await this.database.client.loginFailure.findMany({
      select: { usernameKey: true, ipKey: true },
      distinct: ['usernameKey', 'ipKey'],
    });
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
    for (const key of keys)
      locks.push({
        kind: 'security',
        key: `${key.kind.toLowerCase()}:${key.key}`,
        mode: 'exclusive',
      });
    for (const failure of failures) {
      locks.push({ kind: 'security', key: `username:${failure.usernameKey}`, mode: 'exclusive' });
      locks.push({ kind: 'security', key: `ip:${failure.ipKey}`, mode: 'exclusive' });
    }
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
        await context.db
          .$executeRaw`DELETE FROM login_failure f WHERE occurred_at < ${new Date(now.getTime() - 86400000)} AND NOT EXISTS (SELECT 1 FROM login_throttle_key k WHERE k.blocked_until > ${now} AND ((k.kind='USERNAME' AND k.key=f.username_key) OR (k.kind='IP' AND k.key=f.ip_key)))`;
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
  }
  async onModuleDestroy(): Promise<void> {
    await this.database?.close();
  }
}
