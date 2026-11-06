import type { Prisma } from '../generated/prisma/client';
import { auditChangeSummary, isAuditAction } from './audit-payload.policy';

export const auditObjectKinds = ['Account', 'DelegationCase', 'DelegationGrant'] as const;

export const auditSelection = {
  id: true,
  actorId: true,
  actorKind: true,
  operatorIdentity: true,
  actor: { select: { fullName: true } },
  occurredAt: true,
  actionCode: true,
  objectKind: true,
  objectId: true,
  seasonId: true,
  season: { select: { code: true } },
  outcome: true,
  reason: true,
  beforeData: true,
  afterData: true,
} satisfies Prisma.AuditRecordSelect;

type AuditRow = Prisma.AuditRecordGetPayload<{ select: typeof auditSelection }>;

function ownsChangePayload({ actionCode, objectKind }: AuditRow) {
  if (actionCode.startsWith('DELEGATION_')) {
    if (['DELEGATION_STARTED', 'DELEGATION_EXPIRED', 'DELEGATION_TERMINATED'].includes(actionCode))
      return objectKind === 'DelegationGrant';
    if (actionCode === 'DELEGATION_REVOKED')
      return objectKind === 'DelegationCase' || objectKind === 'DelegationGrant';
    return objectKind === 'DelegationCase';
  }
  return objectKind === 'Account';
}

/** The three Phase 1 object modules grant current reads to system administrators. */
export async function projectAuditPage(db: Prisma.TransactionClient, rows: AuditRow[]) {
  const ids = (kind: (typeof auditObjectKinds)[number]) =>
    rows.flatMap((row) => (row.objectKind === kind && row.objectId ? [row.objectId] : []));
  const accounts = await db.account.findMany({
    where: { id: { in: ids('Account') } },
    select: { id: true, fullName: true, personnelCode: true },
  });
  const cases = await db.delegationCase.findMany({
    where: { id: { in: ids('DelegationCase') } },
    select: { id: true },
  });
  const grants = await db.delegationGrant.findMany({
    where: { id: { in: ids('DelegationGrant') } },
    select: { id: true },
  });
  const accountById = new Map(accounts.map((account) => [account.id, account]));
  const caseIds = new Set(cases.map(({ id }) => id));
  const grantIds = new Set(grants.map(({ id }) => id));
  return rows.map((row) => {
    const { actor, season, beforeData, afterData, reason, ...metadata } = row;
    const objectId = row.objectId ?? '';
    const account = row.objectKind === 'Account' ? accountById.get(objectId) : undefined;
    const readable =
      !!account ||
      (row.objectKind === 'DelegationCase' && caseIds.has(objectId)) ||
      (row.objectKind === 'DelegationGrant' && grantIds.has(objectId));
    const action =
      readable && ownsChangePayload(row) && isAuditAction(row.actionCode) ? row.actionCode : null;
    return {
      ...metadata,
      actorName: actor?.fullName ?? null,
      objectName: account ? account.fullName + ' (' + account.personnelCode + ')' : null,
      seasonCode: season?.code ?? null,
      reason: action ? reason : null,
      before: action ? auditChangeSummary(action, beforeData) : null,
      after: action ? auditChangeSummary(action, afterData) : null,
    };
  });
}
