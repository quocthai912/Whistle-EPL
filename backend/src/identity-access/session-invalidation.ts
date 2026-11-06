import type { TransactionContext } from '../platform/transaction-context';

/** Revokes all live sessions or only those issued before a timed delegation boundary. */
export async function invalidateSessions(
  context: TransactionContext,
  accountId: string,
  now: Date,
  cause: string,
  before?: Date,
) {
  const result = await context.db.session.updateMany({
    where: { accountId, revokedAt: null, ...(before ? { createdAt: { lt: before } } : {}) },
    data: { revokedAt: now, revocationReason: cause },
  });
  if (!before)
    await context.db.account.update({
      where: { id: accountId },
      data: { authRevision: { increment: 1 } },
    });
  return result.count;
}
