import type { TransactionContext, LockResource } from '../platform/transaction-context';

const WINDOW = 15 * 60 * 1000;
export class LoginThrottleService {
  locks(username: string, ip: string): LockResource[] {
    return [
      { kind: 'security', key: `username:${username}`, mode: 'exclusive' },
      { kind: 'security', key: `ip:${ip}`, mode: 'exclusive' },
    ];
  }
  /** Caller holds both logical keys, including when no persistent key exists yet. */
  async attempt(
    context: TransactionContext,
    username: string,
    ip: string,
    authenticate: boolean | (() => Promise<boolean>),
  ): Promise<'SUCCEEDED' | 'FAILED' | 'THROTTLED'> {
    const user = await context.db.loginThrottleKey.upsert({
      where: { kind_key: { kind: 'USERNAME', key: username } },
      create: { kind: 'USERNAME', key: username },
      update: {},
    });
    const address = await context.db.loginThrottleKey.upsert({
      where: { kind_key: { kind: 'IP', key: ip } },
      create: { kind: 'IP', key: ip },
      update: {},
    });
    const checkedAt = await context.now();
    if (
      (user.blockedUntil && user.blockedUntil > checkedAt) ||
      (address.blockedUntil && address.blockedUntil > checkedAt)
    )
      return 'THROTTLED';
    // Credential/session decisions finish before a success may reset the sequence.
    const valid = typeof authenticate === 'function' ? await authenticate() : authenticate;
    const now = await context.now();
    if (valid) {
      await context.db.loginFailure.updateMany({
        where: { usernameKey: username, usernameSequenceActive: true },
        data: { usernameSequenceActive: false },
      });
      await context.db.loginThrottleKey.update({
        where: { kind_key: { kind: 'USERNAME', key: username } },
        data: { lastSuccessAt: now, blockedUntil: null },
      });
      return 'SUCCEEDED';
    }
    await context.db.loginFailure.create({
      data: { usernameKey: username, ipKey: ip, occurredAt: now },
    });
    const since = new Date(now.getTime() - WINDOW);
    const usernameCount = await context.db.loginFailure.count({
      where: {
        usernameKey: username,
        usernameSequenceActive: true,
        occurredAt: { gt: since },
      },
    });
    const ipCount = await context.db.loginFailure.count({
      where: { ipKey: ip, occurredAt: { gt: since } },
    });
    const blockedUntil = new Date(now.getTime() + WINDOW);
    if (usernameCount >= 5)
      await context.db.loginThrottleKey.update({
        where: { kind_key: { kind: 'USERNAME', key: username } },
        data: { blockedUntil },
      });
    if (ipCount >= 20)
      await context.db.loginThrottleKey.update({
        where: { kind_key: { kind: 'IP', key: ip } },
        data: { blockedUntil },
      });
    return 'FAILED';
  }
}
