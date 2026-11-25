import type { DatabaseService } from '../../src/platform/database.service';
import type { LockResource } from '../../src/platform/transaction-context';

/** Deterministic external barrier; does not replace a business writer or its authority checks. */
export async function holdCommittedRow(reader: DatabaseService, lock: LockResource) {
  let acquired!: () => void;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    acquired = resolve;
  });
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const transaction = reader.write(
    [lock],
    async () => {},
    async () => {
      acquired();
      await released;
    },
  );
  await Promise.race([ready, transaction]);
  return async () => {
    release();
    await transaction;
  };
}

export async function waitForLockWaiters(
  reader: DatabaseService,
  queryFragment: string,
  count = 1,
) {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const rows = await reader.client.$queryRaw<Array<{ count: bigint }>>`
      SELECT count(*) FROM pg_stat_activity
      WHERE datname = current_database() AND pid <> pg_backend_pid()
        AND wait_event_type = 'Lock' AND query LIKE ${`%${queryFragment}%`}
    `;
    if (Number(rows[0].count) >= count) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(
    `Expected ${count} blocked ${queryFragment} writer(s) before releasing the barrier.`,
  );
}
