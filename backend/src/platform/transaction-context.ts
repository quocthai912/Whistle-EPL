import type { Prisma } from '../generated/prisma/client';
import { ClockService } from './clock.service';

export type LockMode = 'shared' | 'exclusive';
type LockKind =
  | 'system'
  | 'seasonCollection'
  | 'masterIdentity'
  | 'account'
  | 'security'
  | 'season'
  | 'player'
  | 'club'
  | 'stadium'
  | 'case'
  | 'version'
  | 'regulationCase'
  | 'regulationVersion'
  | 'regulationChangeRequest'
  | 'regulationChangeVersion'
  | 'seasonLifecycleRequest'
  | 'seasonLifecycleVersion'
  | 'seasonSummaryCase'
  | 'seasonSummaryVersion'
  | 'mediaAsset';
export type LockResource = {
  kind: LockKind;
  key: string;
  mode: LockMode;
};
export type TrustedExecutionActor =
  | { kind: 'ACCOUNT'; accountId: string }
  | { kind: 'OPERATOR'; identity: string }
  | { kind: 'SYSTEM' };
export class LockSetChanged extends Error {}
export class MissingLockResource extends Error {
  constructor(
    readonly kind: LockResource['kind'],
    readonly key: string,
  ) {
    super(`Required ${kind} lock resource is absent.`);
  }
}

const resources = {
  system: { order: 2, table: 'system_guard', column: 'key', keyType: 'text' },
  seasonCollection: {
    order: 2,
    table: null,
    column: null,
    keyType: 'fixed',
    advisoryPrefix: 'season-collection:',
  },
  masterIdentity: {
    order: 2,
    table: null,
    column: null,
    keyType: 'text',
    advisoryPrefix: 'master-identity:',
  },
  account: { order: 3, table: 'account', column: 'id', keyType: 'uuid' },
  security: {
    order: 3,
    table: null,
    column: null,
    keyType: 'text',
    advisoryPrefix: 'security:',
  },
  season: { order: 4, table: 'season', column: 'id', keyType: 'uuid' },
  player: { order: 5, table: 'player', column: 'id', keyType: 'uuid' },
  club: { order: 6, table: 'club', column: 'id', keyType: 'uuid' },
  stadium: { order: 7, table: 'stadium', column: 'id', keyType: 'uuid' },
  // Preserve the original delegation lock kinds while giving later cases and versions explicit mappings.
  case: { order: 8, table: 'delegation_case', column: 'id', keyType: 'uuid' },
  version: { order: 8, table: 'delegation_version', column: 'id', keyType: 'uuid' },
  regulationCase: { order: 8, table: 'regulation_case', column: 'id', keyType: 'uuid' },
  regulationVersion: { order: 8, table: 'regulation_version', column: 'id', keyType: 'uuid' },
  regulationChangeRequest: {
    order: 8,
    table: 'regulation_change_request',
    column: 'id',
    keyType: 'uuid',
  },
  regulationChangeVersion: {
    order: 8,
    table: 'regulation_change_version',
    column: 'id',
    keyType: 'uuid',
  },
  seasonLifecycleRequest: {
    order: 8,
    table: 'season_lifecycle_request',
    column: 'id',
    keyType: 'uuid',
  },
  seasonLifecycleVersion: {
    order: 8,
    table: 'season_lifecycle_version',
    column: 'id',
    keyType: 'uuid',
  },
  seasonSummaryCase: { order: 8, table: 'season_summary_case', column: 'id', keyType: 'uuid' },
  seasonSummaryVersion: {
    order: 8,
    table: 'season_summary_version',
    column: 'id',
    keyType: 'uuid',
  },
  mediaAsset: { order: 8, table: 'media_asset', column: 'id', keyType: 'uuid' },
} as const;

const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const compareText = (left: string, right: string) => (left < right ? -1 : left > right ? 1 : 0);

function normalizeLock(lock: LockResource): LockResource {
  if (!lock || !Object.hasOwn(resources, lock.kind)) throw new Error('Unknown lock resource kind.');
  const resource = resources[lock.kind];
  if (lock.mode !== 'shared' && lock.mode !== 'exclusive') throw new Error('Unknown lock mode.');
  if (typeof lock.key !== 'string' || !lock.key) throw new Error('Lock resource key is required.');
  if (resource.keyType === 'uuid') {
    if (!UUID4.test(lock.key)) throw new Error('Lock resource ID must be a UUID v4.');
    return { ...lock, key: lock.key.toLowerCase() };
  }
  if (resource.keyType === 'fixed' && lock.key !== 'SeasonCollection')
    throw new Error('Season creation must use the fixed SeasonCollection lock scope.');
  return lock;
}

function lockIdentity(lock: LockResource): string {
  const normalized = normalizeLock(lock);
  return `${normalized.kind}:${normalized.key}`;
}

function mergedLockModes(locks: readonly LockResource[]): Map<string, LockMode> {
  const modes = new Map<string, LockMode>();
  for (const lock of locks) {
    const id = lockIdentity(lock);
    const prior = modes.get(id);
    modes.set(id, prior === 'exclusive' || lock.mode === 'exclusive' ? 'exclusive' : 'shared');
  }
  return modes;
}

/** Applies the same fixed resource and key validation used by transaction lock acquisition. */
export function normalizeLockResources(value: unknown): LockResource[] {
  if (!Array.isArray(value)) throw new Error('A lock resource list is required.');
  return value.map((candidate) => {
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      Array.isArray(candidate) ||
      !('kind' in candidate) ||
      !('key' in candidate) ||
      !('mode' in candidate) ||
      Object.keys(candidate).length !== 3 ||
      !['kind', 'key', 'mode'].every((key) => Object.hasOwn(candidate, key))
    )
      throw new Error('A lock resource is malformed.');
    return normalizeLock(candidate as LockResource);
  });
}

/** Passed by the owning use case; collaborators never open or commit transactions. */
export class TransactionContext {
  private receiptPhase = false;
  private acquired = false;
  private heldLocks = new Map<string, LockMode>();
  constructor(
    readonly db: Prisma.TransactionClient,
    private readonly clock: ClockService,
    private readonly authority: (context: TransactionContext, now: Date) => Promise<void>,
    readonly executionActor?: TrustedExecutionActor,
  ) {}

  now(): Promise<Date> {
    return this.clock.now(this.db);
  }
  async recheckAuthority(): Promise<void> {
    await this.authority(this, await this.now());
  }

  /** Acquires the full lock set once, then restarts acquisition if concurrent changes introduced an uncovered resource. */
  async acquire(
    locks: readonly LockResource[],
    discover?: (db: Prisma.TransactionClient) => Promise<LockResource[]>,
  ): Promise<void> {
    if (this.receiptPhase || this.acquired)
      throw new Error('Acquire the complete resource set once, before receipts.');
    this.acquired = true;
    const dependent = (await discover?.(this.db)) ?? [];
    const complete = normalizeLockResources([...locks, ...dependent]);
    await this.acquireOrdered(complete);
    this.heldLocks = mergedLockModes(complete);
    if (discover) {
      // Re-read topology after the ordered locks. A new resource requires a fresh acquisition.
      this.assertLockCoverage(await discover(this.db));
    }
  }

  /** Rejects a fact read whose rediscovered resources exceed this transaction's held lock set. */
  assertLockCoverage(locks: unknown): void {
    if (!this.acquired) throw new Error('Acquire business locks before reading dependent facts.');
    const required = normalizeLockResources(locks);
    if (
      required.some((lock) => {
        const held = this.heldLocks.get(lockIdentity(lock));
        return !held || (lock.mode === 'exclusive' && held !== 'exclusive');
      })
    )
      throw new LockSetChanged();
  }

  /** Deduplicates locks, retaining the strongest mode, and acquires them in the shared resource order. */
  private async acquireOrdered(locks: readonly LockResource[]): Promise<void> {
    const unique = new Map<string, LockResource>();
    for (const candidate of locks) {
      const lock = normalizeLock(candidate);
      const key = lockIdentity(lock);
      const existing = unique.get(key);
      unique.set(key, { ...lock, mode: existing?.mode === 'exclusive' ? 'exclusive' : lock.mode });
    }
    const ordered = [...unique.values()].sort(
      (a, b) =>
        resources[a.kind].order - resources[b.kind].order ||
        compareText(a.kind, b.kind) ||
        compareText(
          resources[a.kind].keyType === 'uuid' ? a.key.toLowerCase() : a.key,
          resources[b.kind].keyType === 'uuid' ? b.key.toLowerCase() : b.key,
        ),
    );
    for (const lock of ordered) {
      const resource = resources[lock.kind];
      const mode = lock.mode === 'exclusive' ? 'FOR UPDATE' : 'FOR SHARE';
      if (resource.table === null) {
        // Logical scopes cover resources without rows; namespaces and SQL names are static.
        const fn =
          lock.mode === 'exclusive' ? 'pg_advisory_xact_lock' : 'pg_advisory_xact_lock_shared';
        const scope = `${resource.advisoryPrefix}${lock.key}`;
        await this.db.$queryRawUnsafe(`SELECT ${fn}(hashtextextended($1, 0))::text`, scope);
      } else {
        const cast = resource.keyType === 'uuid' ? '::uuid' : '';
        const rows = await this.db.$queryRawUnsafe<unknown[]>(
          `SELECT "${resource.column}" FROM "${resource.table}" WHERE "${resource.column}"=$1${cast} ${mode}`,
          lock.key,
        );
        if (rows.length !== 1) throw new MissingLockResource(lock.kind, lock.key);
      }
    }
  }

  async lockReceipt(key: string): Promise<void> {
    if (!this.acquired) throw new Error('Acquire business locks before a command receipt.');
    if (this.receiptPhase) throw new Error('A business transaction may lock one command receipt.');
    this.receiptPhase = true;
    await this.db
      .$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`receipt:${key}`}, 0))::text`;
  }
}
