import type { Request } from 'express';
import type { Prisma } from '../generated/prisma/client';
import { AuthService } from '../identity-access/auth.service';
import { denied, invalid } from '../identity-access/accounts.dto';
import { readCookie, SESSION_COOKIE } from '../identity-access/csrf.service';
import type { DatabaseService } from '../platform/database.service';
import { normalizeLockResources, type LockResource } from '../platform/transaction-context';
import type { TransactionContext } from '../platform/transaction-context';
import { parseAuditInstant } from './audit-query.service';
import { auditSelection, projectBusinessHistory } from './audit-view.policy';
import { isBusinessHistoryAction, type BusinessHistoryKind } from './audit-payload.policy';

type BusinessHistoryAuthority = (
  context: TransactionContext,
  accountId: string,
  now: Date,
) => Promise<void>;
type Discover = (db: Prisma.TransactionClient) => Promise<LockResource[]>;

/** Target locks and current read authority come from the owning domain service. */
export type BusinessHistoryScope = {
  kind: BusinessHistoryKind;
  id: string;
  seasonId?: string;
  locks: readonly LockResource[];
  discover?: Discover;
  authorize: BusinessHistoryAuthority;
};

export type BusinessHistoryPageRequest = {
  page: number;
  pageSize: number;
  actionCode?: string;
  occurredFrom?: string;
  occurredBefore?: string;
};

const targetLocks: Record<BusinessHistoryKind, LockResource['kind']> = {
  Season: 'season',
  RegulationVersion: 'regulationVersion',
  RegulationChangeRequest: 'regulationChangeRequest',
  SeasonLifecycleRequest: 'seasonLifecycleRequest',
  Club: 'club',
  Stadium: 'stadium',
  MediaAsset: 'mediaAsset',
  Player: 'player',
  ClubApplication: 'clubApplication',
  ReceiptExceptionCase: 'receiptExceptionCase',
  PlayerRegistration: 'playerRegistration',
};
const seasonScoped = new Set<BusinessHistoryKind>([
  'RegulationVersion',
  'RegulationChangeRequest',
  'SeasonLifecycleRequest',
  'ClubApplication',
  'ReceiptExceptionCase',
  'PlayerRegistration',
]);
const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pageBounds(page: number, pageSize: number) {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    throw invalid();
  const skip = (page - 1) * pageSize;
  if (!Number.isSafeInteger(skip) || skip > 1000000) throw invalid();
  return skip;
}

function validateScope(scope: BusinessHistoryScope): LockResource[] {
  if (
    !scope ||
    !UUID4.test(scope.id) ||
    typeof scope.authorize !== 'function' ||
    (scope.discover !== undefined && typeof scope.discover !== 'function') ||
    !Array.isArray(scope.locks) ||
    (scope.seasonId !== undefined && !UUID4.test(scope.seasonId)) ||
    (scope.kind === 'Season' && scope.seasonId !== undefined && scope.seasonId !== scope.id) ||
    (seasonScoped.has(scope.kind) && !scope.seasonId)
  )
    throw invalid();
  const locks = normalizeLockResources(scope.locks);
  if (
    !locks.some(
      (lock) =>
        lock.kind === targetLocks[scope.kind] && lock.key.toLowerCase() === scope.id.toLowerCase(),
    ) ||
    (scope.seasonId !== undefined &&
      !locks.some(
        (lock) =>
          lock.kind === 'season' && lock.key.toLowerCase() === scope.seasonId!.toLowerCase(),
      ))
  )
    throw invalid();
  return locks;
}

/** Reads a bounded object history only after its owner rechecks current object-read authority. */
export class BusinessHistoryService {
  constructor(
    private readonly database: DatabaseService,
    private readonly auth: AuthService,
  ) {}

  async list(
    request: Request,
    scope: BusinessHistoryScope,
    page: BusinessHistoryPageRequest = { page: 1, pageSize: 20 },
  ) {
    const locks = validateScope(scope);
    this.validatePage(page);
    const candidate = await this.auth.sessions.candidate(readCookie(request, SESSION_COOKIE));
    if (!candidate) return this.auth.sessions.missing();

    const authority = async (context: TransactionContext, now: Date) => {
      const live = await this.auth.sessions.require(context, candidate, now);
      if (live.account.mustChangePassword) throw denied();
    };

    return this.database.write(
      [...locks, ...this.auth.sessions.locks(candidate)],
      authority,
      async (context) => {
        const live = await this.auth.sessions.require(context, candidate, await context.now());
        await this.auth.sessions.touch(context, live);
        return this.listWithin(context, live.account.id, scope, page);
      },
      scope.discover,
    );
  }

  /** Lists history inside an already authenticated, owner-authorized HTTP read transaction. */
  async listWithin(
    context: TransactionContext,
    accountId: string,
    scope: BusinessHistoryScope,
    page: BusinessHistoryPageRequest = { page: 1, pageSize: 20 },
  ) {
    const locks = validateScope(scope);
    context.assertLockCoverage(locks);
    this.validatePage(page);
    await scope.authorize(context, accountId, await context.now());
    if (page.actionCode !== undefined && !isBusinessHistoryAction(page.actionCode, scope.kind))
      throw invalid();
    const occurredFrom = parseAuditInstant(page.occurredFrom);
    const occurredBefore = parseAuditInstant(page.occurredBefore);
    if (occurredFrom && occurredBefore && occurredFrom >= occurredBefore) throw invalid();
    const where: Prisma.AuditRecordWhereInput = {
      objectKind: scope.kind,
      objectId: scope.id,
      ...(scope.seasonId ? { seasonId: scope.seasonId } : {}),
      ...(page.actionCode !== undefined ? { actionCode: page.actionCode } : {}),
      ...(occurredFrom || occurredBefore
        ? {
            occurredAt: {
              ...(occurredFrom ? { gte: occurredFrom } : {}),
              ...(occurredBefore ? { lt: occurredBefore } : {}),
            },
          }
        : {}),
    };
    const skip = pageBounds(page.page, page.pageSize);
    const total = await context.db.auditRecord.count({ where });
    const rows = await context.db.auditRecord.findMany({
      where,
      select: auditSelection,
      orderBy: [{ occurredAt: 'desc' }, { id: 'asc' }],
      skip,
      take: page.pageSize,
    });
    return {
      page: page.page,
      pageSize: page.pageSize,
      total,
      items: projectBusinessHistory(rows),
    };
  }

  private validatePage(page: BusinessHistoryPageRequest): void {
    if (
      !page ||
      typeof page !== 'object' ||
      Object.keys(page).some(
        (key) =>
          !['page', 'pageSize', 'actionCode', 'occurredFrom', 'occurredBefore'].includes(key),
      ) ||
      Object.values(page).some((value) => typeof value !== 'string' && typeof value !== 'number')
    )
      throw invalid();
    pageBounds(page.page, page.pageSize);
  }
}
