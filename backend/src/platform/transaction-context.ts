import type { Prisma } from '../generated/prisma/client';
import { ClockService } from './clock.service';

export type LockMode = 'shared' | 'exclusive';
export type LockResource = {
  kind: 'system' | 'account' | 'security' | 'season' | 'case' | 'version';
  key: string;
  mode: LockMode;
};

const resources = {
  system: { order: 2, table: 'system_guard', column: 'key' },
  account: { order: 3, table: 'account', column: 'id' },
  security: { order: 3, table: null, column: null },
  season: { order: 4, table: 'season', column: 'id' },
  case: { order: 8, table: 'delegation_case', column: 'id' },
  version: { order: 8, table: 'delegation_version', column: 'id' },
} as const;

/** Passed by the owning use case; collaborators never open or commit transactions. */
export class TransactionContext {
  private receiptPhase = false;
  private acquired = false;
  constructor(
    readonly db: Prisma.TransactionClient,
    private readonly clock: ClockService,
    private readonly authority: (context: TransactionContext, now: Date) => Promise<void>,
  ) {}

  now(): Promise<Date> {
    return this.clock.now(this.db);
  }
  async recheckAuthority(): Promise<void> {
    await this.authority(this, await this.now());
  }

  async acquire(locks: readonly LockResource[]): Promise<void> {
    if (this.receiptPhase || this.acquired)
      throw new Error('Acquire the complete resource set once, before receipts.');
    this.acquired = true;
    const unique = new Map<string, LockResource>();
    for (const lock of locks) {
      const key = `${lock.kind}:${lock.key}`;
      const existing = unique.get(key);
      unique.set(key, { ...lock, mode: existing?.mode === 'exclusive' ? 'exclusive' : lock.mode });
    }
    const ordered = [...unique.values()].sort(
      (a, b) =>
        resources[a.kind].order - resources[b.kind].order ||
        `${a.kind}:${a.key}`.localeCompare(`${b.kind}:${b.key}`, 'en'),
    );
    for (const lock of ordered) {
      const resource = resources[lock.kind];
      const mode = lock.mode === 'exclusive' ? 'FOR UPDATE' : 'FOR SHARE';
      if (resource.table === null) {
        // Logical security keys also cover missing-row races; no client-selected SQL names.
        const fn =
          lock.mode === 'exclusive' ? 'pg_advisory_xact_lock' : 'pg_advisory_xact_lock_shared';
        await this.db.$queryRawUnsafe(
          `SELECT ${fn}(hashtextextended($1, 0))::text`,
          `security:${lock.key}`,
        );
      } else {
        const cast = lock.kind === 'system' ? '' : '::uuid';
        const rows = await this.db.$queryRawUnsafe<unknown[]>(
          `SELECT "${resource.column}" FROM "${resource.table}" WHERE "${resource.column}"=$1${cast} ${mode}`,
          lock.key,
        );
        if (rows.length !== 1) throw new Error('Required lock resource is absent.');
      }
    }
  }

  async lockReceipt(key: string): Promise<void> {
    this.receiptPhase = true;
    await this.db
      .$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`receipt:${key}`}, 0))::text`;
  }
}
