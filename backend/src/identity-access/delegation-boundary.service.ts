import type { DelegationGrant, Prisma } from '../generated/prisma/client';
import { AuditWriterService, type AuditEvent } from '../audit/audit-writer.service';
import type { TransactionContext } from '../platform/transaction-context';
import {
  accountLock,
  eligibleRecipient,
  hasSeasonRole,
  type DelegationAction,
} from './authority.policy';
import { invalidateSessions } from './session-invalidation';

type Boundary = 'START' | 'EXPIRY' | 'REVOCATION' | 'TERMINATION';
const actionByBoundary = {
  START: 'DELEGATION_STARTED',
  EXPIRY: 'DELEGATION_EXPIRED',
  REVOCATION: 'DELEGATION_REVOKED',
  TERMINATION: 'DELEGATION_TERMINATED',
} as const;

const live = { revokedAt: null, terminatedAt: null };
const participant = (accountId: string): Prisma.DelegationGrantWhereInput => ({
  OR: [{ recipientId: accountId }, { approvedVersion: { case: { proposerId: accountId } } }],
});

export async function dependentRecipientLocks(db: Prisma.TransactionClient, accountId: string) {
  const grants = await db.delegationGrant.findMany({
    where: { ...live, ...participant(accountId) },
    select: { recipientId: true },
  });
  return grants.map(({ recipientId }) => accountLock(recipientId));
}

/** Projects the lifecycle at the supplied instant, giving terminal decisions precedence over the effective interval. */
export function grantState(grant: DelegationGrant, now: Date) {
  if (grant.revokedAt) return 'REVOKED';
  if (grant.terminatedAt) return 'TERMINATED';
  if (grant.endsAt <= now) return 'EXPIRED';
  return grant.startsAt > now ? 'SCHEDULED' : 'ACTIVE';
}

export class DelegationBoundaryService {
  private readonly audit = new AuditWriterService();

  async due(db: Prisma.TransactionClient, recipientId: string, now: Date) {
    const grants = await db.delegationGrant.findMany({
      where: {
        recipientId,
        startsAt: { lte: now },
        OR: [
          { boundaries: { none: { boundaryKind: 'START' } } },
          { ...live, endsAt: { lte: now }, boundaries: { none: { boundaryKind: 'EXPIRY' } } },
        ],
      },
      include: { boundaries: { select: { boundaryKind: true } } },
    });
    return grants
      .flatMap((grant) => {
        const end = grant.revokedAt ?? grant.terminatedAt;
        const recorded = new Set(grant.boundaries.map((boundary) => boundary.boundaryKind));
        const boundaries: { grant: DelegationGrant; kind: Boundary; at: Date }[] = [];
        if ((!end || grant.startsAt <= end) && !recorded.has('START'))
          boundaries.push({ grant, kind: 'START', at: grant.startsAt });
        if (grant.endsAt <= now && (!end || grant.endsAt <= end) && !recorded.has('EXPIRY'))
          boundaries.push({ grant, kind: 'EXPIRY', at: grant.endsAt });
        return boundaries;
      })
      .sort(
        (a, b) =>
          a.at.getTime() - b.at.getTime() ||
          Number(a.kind === 'START') - Number(b.kind === 'START') ||
          a.grant.id.localeCompare(b.grant.id),
      );
  }

  /** Records outstanding start and expiry boundaries in order while the recipient's account lock is held. */
  async resolve(context: TransactionContext, recipientId: string, now: Date) {
    for (const { grant, kind, at } of await this.due(context.db, recipientId, now))
      await this.record(context, grant, kind, at, now);
  }

  /** Persists the boundary, invalidates affected sessions and appends its audit event in the caller's transaction. */
  async record(
    context: TransactionContext,
    grant: DelegationGrant,
    kind: Boundary,
    at: Date,
    now: Date,
    actor: AuditEvent['actor'] = { kind: 'SYSTEM' },
    reason?: string,
    requestId?: string,
    immediate = false,
  ) {
    await context.db.delegationBoundary.create({
      data: {
        grantId: grant.id,
        boundaryKind: kind,
        effectiveAt: at,
        processedAt: now,
        terminationBasis: reason,
      },
    });
    const action = actionByBoundary[kind];
    const timed = kind === 'START' || kind === 'EXPIRY';
    const sessionsInvalidated = await invalidateSessions(
      context,
      grant.recipientId,
      now,
      action,
      timed && !immediate ? at : undefined,
    );
    await this.audit.append(context, {
      actor,
      action,
      objectKind: 'DelegationGrant',
      objectId: grant.id,
      seasonId: grant.seasonId,
      reason,
      requestId,
      outcome: 'SUCCESS',
      after: {
        grantId: grant.id,
        sessionsInvalidated,
        effectiveAt: at.toISOString(),
        ...(!timed && { state: kind === 'REVOCATION' ? 'REVOKED' : 'TERMINATED' }),
      },
    });
  }

  /** Ends active or scheduled grants that lost either participant's eligibility, preserving earlier due boundaries. */
  async terminateIneligible(context: TransactionContext, accountId: string, now: Date) {
    const grants = await context.db.delegationGrant.findMany({
      where: { ...live, endsAt: { gt: now }, ...participant(accountId) },
      include: {
        approvedVersion: {
          select: { case: { select: { proposerId: true, proposer: { select: { state: true } } } } },
        },
      },
      orderBy: [{ recipientId: 'asc' }, { id: 'asc' }],
    });
    for (const grant of grants) {
      const { proposerId, proposer } = grant.approvedVersion.case;
      const eligible =
        proposer.state === 'ACTIVE' &&
        (await hasSeasonRole(context.db, proposerId, ['SEASON_MANAGER'], grant.seasonId)) &&
        (await eligibleRecipient(
          context.db,
          grant.recipientId,
          grant.seasonId,
          grant.actionCode as DelegationAction,
        ));
      if (eligible) continue;
      await this.resolve(context, grant.recipientId, now);
      const reason = 'Không còn đủ điều kiện ủy quyền.';
      await context.db.delegationGrant.update({
        where: { id: grant.id },
        data: { terminatedAt: now, reason },
      });
      await this.record(context, grant, 'TERMINATION', now, now, { kind: 'SYSTEM' }, reason);
    }
  }
}
