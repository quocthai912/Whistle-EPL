import type { Request } from 'express';
import type { TransactionContext } from '../platform/transaction-context';
import {
  assertRevision,
  conflict,
  missing,
  uuid,
  type PermissionDto,
  type RevisionDto,
  type SeasonRoleDto,
} from './accounts.dto';
import { lockSubject } from './accounts.service';
import { AdministrationExecution } from './administration-execution';
import { invalidateSessions } from './session-invalidation';
import { hasSeasonRole, rejectSelf, sharedPrerequisite } from './authority.policy';
import { DelegationBoundaryService, dependentRecipientLocks } from './delegation-boundary.service';

export class GrantsService {
  private readonly boundaries = new DelegationBoundaryService();
  constructor(private readonly execution: AdministrationExecution) {}

  /** Adds or revokes a season assignment, ending dependent rights when their prerequisites are lost. */
  seasonRole(
    request: Request,
    id: string,
    input: SeasonRoleDto | RevisionDto,
    assignmentId?: string,
  ) {
    const action = assignmentId ? 'SEASON_ROLE_REVOKED' : 'SEASON_ROLE_GRANTED';
    const addition =
      'seasonId' in input
        ? { seasonId: uuid(input.seasonId), roleCode: input.roleCode }
        : undefined;
    const payload: Record<string, string> = { expectedRevision: input.expectedRevision };
    if (addition) Object.assign(payload, addition);
    if (assignmentId) payload.assignmentId = assignmentId;
    return this.execution.run(
      request,
      (context, actor) =>
        this.execution.critical(context, request, actor, action, id, payload, async () => {
          const account = await this.execution.subject(context, id);
          assertRevision(account.revision, input.expectedRevision);
          const now = await context.now();
          const db = context.db;
          let assignment;
          if (addition) {
            rejectSelf(actor, id);
            if (account.state !== 'ACTIVE') throw conflict();
            if (!(await db.season.count({ where: { id: addition.seasonId } }))) throw missing();
            if (
              await db.seasonRoleAssignment.count({
                where: { accountId: id, ...addition, revokedAt: null },
              })
            )
              throw conflict();
            await context.recheckAuthority();
            assignment = await db.seasonRoleAssignment.create({
              data: { ...addition, accountId: id, grantedBy: actor, grantedAt: now },
            });
          } else {
            if (
              !(await db.seasonRoleAssignment.count({
                where: { id: assignmentId, accountId: id, revokedAt: null },
              }))
            )
              throw missing();
            await context.recheckAuthority();
            assignment = await db.seasonRoleAssignment.update({
              where: { id: assignmentId },
              data: { revokedAt: now },
            });
            await this.endSharedRights(context, request, id, actor, assignment.roleCode, now);
            await this.boundaries.terminateIneligible(context, id, now);
          }
          const updated = await this.changeAuthority(context, id, now, action);
          const { seasonId, roleCode } = assignment;
          await this.execution.event(context, request, actor, {
            action,
            objectKind: 'Account',
            objectId: id,
            seasonId,
            after: { assignmentId: assignment.id, seasonId, roleCode },
          });
          return {
            status: addition ? 201 : 200,
            data: { id, revision: updated, relatedId: assignment.id },
          };
        }),
      {
        write: true,
        discover: async (db) => [
          ...(await lockSubject(db, id)),
          ...(assignmentId ? await dependentRecipientLocks(db, id) : []),
        ],
      },
    );
  }

  /** Changes a typed shared or Create Season permission independently of the account's roles. */
  permission(request: Request, id: string, input: PermissionDto, grantId?: string) {
    const receipt = grantId ? 'PERMISSION_REVOKED' : 'PERMISSION_GRANTED';
    const kind = input.kind;
    return this.execution.run(
      request,
      (context, actor) =>
        this.execution.critical(
          context,
          request,
          actor,
          receipt,
          id,
          { expectedRevision: input.expectedRevision, kind, ...(grantId && { grantId }) },
          async () => {
            const account = await this.execution.subject(context, id);
            assertRevision(account.revision, input.expectedRevision);
            if (!grantId) {
              rejectSelf(actor, id);
              if (account.state !== 'ACTIVE') throw conflict();
            }
            const now = await context.now();
            const db = context.db;
            const base = { accountId: id, grantedAt: now, grantedBy: actor };
            let relatedId;
            if (kind === 'CREATE_SEASON') {
              const current = await db.createSeasonGrant.findFirst({
                where: { accountId: id, revokedAt: null },
              });
              if (grantId && current?.id !== grantId) throw missing();
              if (!grantId && current) throw conflict();
              await context.recheckAuthority();
              const grant = grantId
                ? await db.createSeasonGrant.update({
                    where: { id: grantId },
                    data: { revokedAt: now },
                  })
                : await db.createSeasonGrant.create({ data: base });
              relatedId = grant.id;
              await this.execution.event(context, request, actor, {
                action: grantId ? 'CREATE_SEASON_REVOKED' : 'CREATE_SEASON_GRANTED',
                objectKind: 'Account',
                objectId: id,
                after: { grantId: relatedId },
              });
            } else {
              const current = await db.sharedMasterGrant.findFirst({
                where: { accountId: id, masterKind: kind, endedAt: null },
              });
              if (grantId && current?.id !== grantId) throw missing();
              if (
                !grantId &&
                (current || !(await hasSeasonRole(db, id, [sharedPrerequisite[kind]])))
              )
                throw conflict(
                  'STATE_CONFLICT',
                  'Tài khoản cần vai trò phù hợp để được cấp quyền dùng chung.',
                );
              await context.recheckAuthority();
              const grant = grantId
                ? await db.sharedMasterGrant.update({
                    where: { id: grantId },
                    data: { endedAt: now, endReason: 'REVOKED' },
                  })
                : await db.sharedMasterGrant.create({ data: { ...base, masterKind: kind } });
              relatedId = grant.id;
              await this.execution.event(context, request, actor, {
                action: grantId ? 'SHARED_GRANT_ENDED' : 'SHARED_GRANT_GRANTED',
                objectKind: 'Account',
                objectId: id,
                after: { grantId: relatedId, masterKind: kind },
              });
            }
            return {
              status: grantId ? 200 : 201,
              data: {
                id,
                relatedId,
                revision: await this.changeAuthority(context, id, now, receipt),
              },
            };
          },
        ),
      { write: true, discover: (db) => lockSubject(db, id) },
    );
  }

  /** Ends the matching shared right only after the account loses its final qualifying assignment across seasons. */
  private async endSharedRights(
    context: TransactionContext,
    request: Request,
    id: string,
    actor: string,
    roleCode: string,
    now: Date,
  ) {
    const entry = Object.entries(sharedPrerequisite).find(([, role]) => role === roleCode);
    if (!entry || (await hasSeasonRole(context.db, id, [roleCode]))) return;
    const [masterKind] = entry;
    const grant = await context.db.sharedMasterGrant.findFirst({
      where: { accountId: id, masterKind, endedAt: null },
    });
    if (!grant) return;
    await context.db.sharedMasterGrant.update({
      where: { id: grant.id },
      data: { endedAt: now, endReason: 'PREREQUISITE_LOST' },
    });
    await this.execution.event(context, request, actor, {
      action: 'SHARED_GRANT_ENDED',
      objectKind: 'Account',
      objectId: id,
      reason: 'Vai trò điều kiện cuối cùng đã bị thu hồi.',
      after: { grantId: grant.id, masterKind },
    });
  }

  private async changeAuthority(
    context: TransactionContext,
    id: string,
    now: Date,
    action: string,
  ) {
    await this.boundaries.resolve(context, id, now);
    await invalidateSessions(context, id, now, action);
    return (
      await context.db.account.update({
        where: { id },
        data: { updatedAt: now, revision: { increment: 1 } },
      })
    ).revision.toString();
  }
}
