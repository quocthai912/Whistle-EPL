import type { TransactionContext } from '../platform/transaction-context';
import { auditPayload, type AuditAction } from './audit-payload.policy';

export type AuditActor =
  | { kind: 'ACCOUNT'; accountId: string }
  | { kind: 'OPERATOR'; identity: string }
  | { kind: 'SYSTEM' };
export type AuditEvent = {
  actor: AuditActor;
  action: AuditAction;
  objectKind: string;
  objectId?: string;
  seasonId?: string;
  requestId?: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILURE';
  reason?: string;
  before?: unknown;
  after?: unknown;
};

export class AuditWriterService {
  async append(context: TransactionContext, event: AuditEvent): Promise<void> {
    auditPayload(event.action, {});
    if (event.reason !== undefined && ([...event.reason].length > 2000 || !event.reason.trim()))
      throw new Error('Invalid audit reason.');
    if (
      event.actor.kind === 'OPERATOR' &&
      (!event.actor.identity.trim() || [...event.actor.identity].length > 200)
    )
      throw new Error('Invalid operator identity.');
    // Validate both payloads before asking the database to append; failure aborts caller work.
    const before =
      event.before === undefined ? undefined : auditPayload(event.action, event.before);
    const after = event.after === undefined ? undefined : auditPayload(event.action, event.after);
    await context.db.auditRecord.create({
      data: {
        actorKind: event.actor.kind,
        actorId: event.actor.kind === 'ACCOUNT' ? event.actor.accountId : null,
        operatorIdentity: event.actor.kind === 'OPERATOR' ? event.actor.identity : null,
        occurredAt: await context.now(),
        actionCode: event.action,
        objectKind: event.objectKind,
        objectId: event.objectId,
        seasonId: event.seasonId,
        requestId: event.requestId,
        outcome: event.outcome,
        reason: event.reason,
        beforeData: before,
        afterData: after,
      },
    });
  }
}
