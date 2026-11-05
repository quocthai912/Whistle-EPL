import type { Request } from 'express';
import type { Prisma, Account } from '../generated/prisma/client';
import type { TransactionContext } from '../platform/transaction-context';
import { AdministrationExecution } from './administration-execution';
import { invalidateSessions } from './session-invalidation';
import { SecurityPrimitivesService } from './security-primitives.service';
import { DelegationBoundaryService, dependentRecipientLocks } from './delegation-boundary.service';
import { accountLock, authorityGuard, isAdministrator, rejectSelf } from './authority.policy';
import {
  assertRevision,
  businessText,
  conflict,
  invalid,
  listQuery,
  missing,
  systemRole,
  type CreateAccountDto,
  type EditAccountDto,
  type ResetAccountDto,
  type RevisionDto,
  type SystemRoleDto,
} from './accounts.dto';

const accountFields = {
  id: true,
  personnelCode: true,
  fullName: true,
  username: true,
  state: true,
  mustChangePassword: true,
  createdAt: true,
  revision: true,
} as const;
const sortOptions = [
  'createdAt:desc',
  'createdAt:asc',
  'username:asc',
  'username:desc',
  'fullName:asc',
  'personnelCode:asc',
] as const;

/** Discovers the lock for an existing subject; the authorized operation resolves missing targets. */
export async function lockSubject(db: Prisma.TransactionClient, id: string) {
  return (await db.account.count({ where: { id } })) ? [accountLock(id)] : [];
}

export class AccountsService {
  private readonly security = new SecurityPrimitivesService();
  private readonly boundaries = new DelegationBoundaryService();
  constructor(private readonly execution: AdministrationExecution) {}

  /** Returns paginated account metadata and live assignments through a projection that excludes credentials. */
  list(request: Request, query: Record<string, unknown>) {
    const { values, page, pageSize, sort, skip, take } = listQuery(
      query,
      ['search', 'state'],
      sortOptions,
    );
    if (values.state !== undefined && !['ACTIVE', 'LOCKED'].includes(values.state)) throw invalid();
    const search =
      values.search === undefined
        ? ''
        : businessText(values.search, 'name', false).replace(/[\\%_]/g, '\\$&');
    const [field, direction] = sort.split(':');
    const where: Prisma.AccountWhereInput = {
      state: values.state,
      ...(search && {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { personnelCode: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    return this.execution.run(request, async (context) => {
      const rows = await context.db.account.findMany({
        where,
        skip,
        take,
        orderBy: [{ [field]: direction }, { id: 'asc' }],
        select: {
          ...accountFields,
          systemRoles: {
            where: { revokedAt: null },
            select: { id: true, roleCode: true },
            orderBy: { id: 'asc' },
          },
          seasonRoles: {
            where: { revokedAt: null },
            select: { id: true, roleCode: true, seasonId: true },
            orderBy: [{ seasonId: 'asc' }, { roleCode: 'asc' }],
          },
          sharedGrants: {
            where: { endedAt: null },
            select: { id: true, masterKind: true },
            orderBy: { masterKind: 'asc' },
          },
          createSeasonGrants: { where: { revokedAt: null }, select: { id: true } },
        },
      });
      const total = await context.db.account.count({ where });
      const seasons = await context.db.season.findMany({
        select: { id: true, code: true, name: true },
        orderBy: { code: 'asc' },
      });
      return {
        items: rows.map((row) => ({ ...row, revision: row.revision.toString() })),
        page,
        pageSize,
        total,
        seasons,
      };
    });
  }

  /** Normalizes the verified personnel identity and issues a temporary credential under uniqueness locks. */
  create(request: Request, input: CreateAccountDto) {
    const enteredCode = input.personnelCode.trim();
    if (
      !/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(enteredCode) ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{2,49}$/.test(input.username)
    )
      throw invalid();
    const personnelCode = enteredCode.toUpperCase();
    const username = input.username.toLowerCase();
    const fullName = businessText(input.fullName, 'name');
    return this.execution.run(
      request,
      async (context, actor) => {
        if (await context.db.account.count({ where: { OR: [{ username }, { personnelCode }] } }))
          throw conflict('DUPLICATE_CODE', 'Mã nhân sự hoặc tên đăng nhập đã tồn tại.');
        const passwordHash = await this.security.hashPassword(input.temporaryPassword);
        await context.recheckAuthority();
        const now = await context.now();
        const account = await context.db.account.create({
          data: {
            personnelCode,
            username,
            fullName,
            passwordHash,
            mustChangePassword: true,
            temporaryPasswordExpiresAt: this.security.credentialExpiry(now),
            createdAt: now,
            updatedAt: now,
          },
          select: accountFields,
        });
        await this.execution.event(context, request, actor, {
          action: 'ACCOUNT_CREATED',
          objectKind: 'Account',
          objectId: account.id,
          after: {
            personnelCode,
            username,
            fullName,
            state: account.state,
            mustChangePassword: true,
          },
        });
        return { ...account, revision: account.revision.toString() };
      },
      {
        write: true,
        locks: [
          { kind: 'security', key: 'personnel-code:' + personnelCode, mode: 'exclusive' },
          { kind: 'security', key: 'username-create:' + username, mode: 'exclusive' },
        ],
      },
    );
  }

  edit(request: Request, id: string, input: EditAccountDto) {
    const fullName = businessText(input.fullName, 'name');
    return this.execution.run(
      request,
      async (context, actor) => {
        const account = await this.execution.subject(context, id);
        assertRevision(account.revision, input.expectedRevision);
        await context.recheckAuthority();
        const updated = await context.db.account.update({
          where: { id },
          data: { fullName, updatedAt: await context.now(), revision: { increment: 1 } },
          select: accountFields,
        });
        await this.execution.event(context, request, actor, {
          action: 'ACCOUNT_UPDATED',
          objectKind: 'Account',
          objectId: id,
          before: { fullName: account.fullName },
          after: { fullName },
        });
        return { ...updated, revision: updated.revision.toString() };
      },
      { write: true, discover: (db) => lockSubject(db, id) },
    );
  }

  reset(request: Request, id: string, input: ResetAccountDto) {
    return this.execution.run(
      request,
      async (context, actor) => {
        const account = await this.execution.subject(context, id);
        assertRevision(account.revision, input.expectedRevision);
        const passwordHash = await this.security.hashPassword(input.temporaryPassword);
        await context.recheckAuthority();
        const now = await context.now();
        const updated = await context.db.account.update({
          where: { id },
          data: {
            passwordHash,
            mustChangePassword: true,
            temporaryPasswordExpiresAt: this.security.credentialExpiry(now),
            updatedAt: now,
            revision: { increment: 1 },
          },
        });
        const sessionsInvalidated = await invalidateSessions(context, id, now, 'PASSWORD_RESET');
        await this.execution.event(context, request, actor, {
          action: 'PASSWORD_RESET',
          objectKind: 'Account',
          objectId: id,
          after: { mustChangePassword: true, sessionsInvalidated },
        });
        return { id, revision: updated.revision.toString() };
      },
      { write: true, discover: (db) => lockSubject(db, id) },
    );
  }

  /** Applies a revision-bound lock or unlock through a command receipt and preserves the last active administrator. */
  state(request: Request, id: string, state: 'ACTIVE' | 'LOCKED', input: RevisionDto) {
    const action = state === 'ACTIVE' ? 'ACCOUNT_UNLOCKED' : 'ACCOUNT_LOCKED';
    return this.execution.run(
      request,
      (context, actor) =>
        this.execution.critical(
          context,
          request,
          actor,
          action,
          id,
          { expectedRevision: input.expectedRevision },
          async () => {
            const account = await this.execution.subject(context, id);
            assertRevision(account.revision, input.expectedRevision);
            if (account.state === state) throw conflict();
            if (state === 'LOCKED') {
              rejectSelf(actor, id);
              await this.preserveAdministrator(context, account);
            }
            await context.recheckAuthority();
            const now = await context.now();
            const updated = await context.db.account.update({
              where: { id },
              data: { state, updatedAt: now, revision: { increment: 1 } },
            });
            const after =
              state === 'LOCKED'
                ? { state, sessionsInvalidated: await invalidateSessions(context, id, now, action) }
                : { state };
            if (state === 'LOCKED') await this.boundaries.terminateIneligible(context, id, now);
            await this.execution.event(context, request, actor, {
              action,
              objectKind: 'Account',
              objectId: id,
              before: { state: account.state },
              after,
            });
            return { status: 200, data: { id, revision: updated.revision.toString() } };
          },
        ),
      {
        write: true,
        locks: [authorityGuard],
        discover: async (db) => [
          ...(await lockSubject(db, id)),
          ...(state === 'LOCKED' ? await dependentRecipientLocks(db, id) : []),
        ],
      },
    );
  }

  /** Records a separate administrator assignment or revocation and invalidates the target's sessions. */
  systemRole(
    request: Request,
    id: string,
    input: RevisionDto | SystemRoleDto,
    assignmentId?: string,
  ) {
    const action = assignmentId ? 'SYSTEM_ROLE_REVOKED' : 'SYSTEM_ROLE_GRANTED';
    return this.execution.run(
      request,
      (context, actor) =>
        this.execution.critical(
          context,
          request,
          actor,
          action,
          id,
          {
            expectedRevision: input.expectedRevision,
            ...(assignmentId ? { assignmentId } : { roleCode: systemRole }),
          },
          async () => {
            const account = await this.execution.subject(context, id);
            assertRevision(account.revision, input.expectedRevision);
            rejectSelf(actor, id);
            const current = await context.db.systemRoleAssignment.findFirst({
              where: { accountId: id, roleCode: systemRole, revokedAt: null },
            });
            if (assignmentId && assignmentId !== current?.id) throw missing();
            if (!assignmentId && (current || account.state !== 'ACTIVE')) throw conflict();
            if (assignmentId) await this.preserveAdministrator(context, account);
            await context.recheckAuthority();
            const now = await context.now();
            const assignment = assignmentId
              ? await context.db.systemRoleAssignment.update({
                  where: { id: assignmentId },
                  data: { revokedAt: now },
                })
              : await context.db.systemRoleAssignment.create({
                  data: { accountId: id, roleCode: systemRole, grantedBy: actor, grantedAt: now },
                });
            const updated = await context.db.account.update({
              where: { id },
              data: { updatedAt: now, revision: { increment: 1 } },
            });
            await invalidateSessions(context, id, now, action);
            await this.execution.event(context, request, actor, {
              action,
              objectKind: 'Account',
              objectId: id,
              after: { assignmentId: assignment.id, roleCode: systemRole },
            });
            return {
              status: assignmentId ? 200 : 201,
              data: { id, revision: updated.revision.toString(), relatedId: assignment.id },
            };
          },
        ),
      { write: true, locks: [authorityGuard], discover: (db) => lockSubject(db, id) },
    );
  }

  /** Rejects an operation that would leave the system without an active administrator. */
  private async preserveAdministrator(context: TransactionContext, account: Account) {
    if (account.state !== 'ACTIVE' || !(await isAdministrator(context.db, account.id))) return;
    const another = await context.db.systemRoleAssignment.count({
      where: {
        accountId: { not: account.id },
        roleCode: systemRole,
        revokedAt: null,
        account: { state: 'ACTIVE' },
      },
    });
    if (!another)
      throw conflict('STATE_CONFLICT', 'Phải còn ít nhất một quản trị viên đang hoạt động.');
  }
}
