import type { Prisma } from '../generated/prisma/client';
import type { LockResource } from '../platform/transaction-context';
import { denied, systemRole } from './accounts.dto';

export const delegationRoles = {
  PREPARE_REGULATION_CHANGE: ['REGISTRATION_OFFICER', 'SCHEDULING_OFFICER', 'RESULTS_OFFICER'],
  APPROVE_SCHEDULE_ADJUSTMENT: ['SCHEDULING_OFFICER'],
  PREPARE_OFFICIAL_RESULT_CORRECTION: ['RESULTS_OFFICER'],
};
export type DelegationAction = keyof typeof delegationRoles;
export const sharedPrerequisite = {
  CLUB_MASTER: 'SEASON_MANAGER',
  STADIUM_MASTER: 'SCHEDULING_OFFICER',
  PLAYER_MASTER: 'REGISTRATION_OFFICER',
};
export const authorityGuard: LockResource = {
  kind: 'system',
  key: 'last-active-admin',
  mode: 'exclusive',
};
export const accountLock = (key: string): LockResource => ({
  kind: 'account',
  key,
  mode: 'exclusive',
});

export async function isAdministrator(db: Prisma.TransactionClient, accountId: string) {
  return !!(await db.systemRoleAssignment.count({
    where: { accountId, roleCode: systemRole, revokedAt: null },
  }));
}
export async function hasSeasonRole(
  db: Prisma.TransactionClient,
  accountId: string,
  roles: string[],
  seasonId?: string,
) {
  return !!(await db.seasonRoleAssignment.count({
    where: { accountId, seasonId, roleCode: { in: roles }, revokedAt: null },
  }));
}
export async function eligibleRecipient(
  db: Prisma.TransactionClient,
  accountId: string,
  seasonId: string,
  actionCode: DelegationAction,
) {
  return !!(await db.seasonRoleAssignment.count({
    where: {
      accountId,
      seasonId,
      roleCode: { in: delegationRoles[actionCode] },
      revokedAt: null,
      account: { state: 'ACTIVE' },
    },
  }));
}
export function rejectSelf(actor: string, subject: string) {
  if (actor === subject) throw denied();
}
