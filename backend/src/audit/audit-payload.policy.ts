import type { Prisma } from '../generated/prisma/client';

const accountFields = ['personnelCode', 'fullName', 'username', 'state', 'mustChangePassword'];
// Each action owns its projection. No credential/token/hash or unrestricted snapshot field.
const policies = {
  ADMIN_BOOTSTRAPPED: [...accountFields, 'roleCode'],
  ADMIN_RECOVERED: ['state', 'mustChangePassword', 'sessionsInvalidated', 'reset', 'unlock'],
  ACCOUNT_CREATED: accountFields,
  ACCOUNT_UPDATED: ['fullName'],
  ACCOUNT_LOCKED: ['state', 'sessionsInvalidated'],
  ACCOUNT_UNLOCKED: ['state'],
  PASSWORD_RESET: ['mustChangePassword', 'sessionsInvalidated'],
  PASSWORD_CHANGED: ['sessionsInvalidated'],
  LOGIN_SUCCEEDED: [],
  LOGOUT_SUCCEEDED: [],
  SESSIONS_INVALIDATED: ['sessionsInvalidated', 'cause'],
  SYSTEM_ROLE_GRANTED: ['assignmentId', 'roleCode'],
  SYSTEM_ROLE_REVOKED: ['assignmentId', 'roleCode'],
  SEASON_ROLE_GRANTED: ['assignmentId', 'roleCode', 'seasonId'],
  SEASON_ROLE_REVOKED: ['assignmentId', 'roleCode', 'seasonId'],
  SHARED_GRANT_GRANTED: ['grantId', 'masterKind'],
  SHARED_GRANT_ENDED: ['grantId', 'masterKind'],
  CREATE_SEASON_GRANTED: ['grantId'],
  CREATE_SEASON_REVOKED: ['grantId'],
  DELEGATION_DRAFTED: [
    'versionId',
    'versionNumber',
    'recipientId',
    'actionCode',
    'startMode',
    'startsAt',
    'endsAt',
  ],
  DELEGATION_EDITED: [
    'versionId',
    'versionNumber',
    'recipientId',
    'actionCode',
    'startMode',
    'startsAt',
    'endsAt',
  ],
  DELEGATION_SUBMITTED: ['versionId', 'versionNumber', 'state'],
  DELEGATION_RETURNED: ['versionId', 'state'],
  DELEGATION_REJECTED: ['versionId', 'state'],
  DELEGATION_CANCELLED: ['versionId', 'state'],
  DELEGATION_GRANTED: ['grantId', 'versionId', 'recipientId', 'actionCode', 'startsAt', 'endsAt'],
  DELEGATION_REVOKED: ['grantId', 'state', 'sessionsInvalidated', 'effectiveAt'],
  DELEGATION_TERMINATED: ['grantId', 'state', 'sessionsInvalidated', 'effectiveAt'],
  DELEGATION_STARTED: ['grantId', 'sessionsInvalidated', 'effectiveAt'],
  DELEGATION_EXPIRED: ['grantId', 'sessionsInvalidated', 'effectiveAt'],
} as const;
export type AuditAction = keyof typeof policies;

export function isAuditAction(value: string): value is AuditAction {
  return Object.hasOwn(policies, value);
}

/** Project historical payloads by the same per-action field allowlist used at append time. */
export function auditChangeSummary(action: AuditAction, payload: Prisma.JsonValue) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const fields: readonly string[] = policies[action];
  const summary = Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) =>
        fields.includes(key) &&
        (typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          value === null),
    ),
  );
  return Object.keys(summary).length ? summary : null;
}

export function auditPayload(action: AuditAction, value: unknown): Prisma.InputJsonObject {
  const allowed: readonly string[] = policies[action];
  if (
    !allowed ||
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error('Invalid audit action or payload.');
  }
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      !allowed.includes(key) ||
      !(
        item === null ||
        typeof item === 'boolean' ||
        (typeof item === 'number' && Number.isSafeInteger(item)) ||
        (typeof item === 'string' && [...item].length <= 2000)
      )
    ) {
      throw new Error('Audit payload is outside the action allowlist.');
    }
    result[key] = item as string | number | boolean | null;
  }
  return result;
}
