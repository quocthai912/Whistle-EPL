import type { TransactionContext } from '../platform/transaction-context';
import {
  allowedAuditActorKinds,
  auditPayload,
  isBusinessHistoryAction,
  type AuditAction,
  validateAuditEvent,
} from './audit-payload.policy';

function sameActor(
  event: AuditEvent['actor'],
  trusted: NonNullable<TransactionContext['executionActor']>,
) {
  return (
    event.kind === trusted.kind &&
    (event.kind === 'SYSTEM' ||
      (event.kind === 'ACCOUNT' &&
        trusted.kind === 'ACCOUNT' &&
        event.accountId === trusted.accountId) ||
      (event.kind === 'OPERATOR' &&
        trusted.kind === 'OPERATOR' &&
        event.identity === trusted.identity))
  );
}

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

const systemTechnicalActions = new Set<AuditAction>([
  'REGULATION_ACTIVATED',
  'REGULATION_ACTIVATION_BLOCKED',
  'MEDIA_ASSET_CLEANED',
]);

export class AuditWriterService {
  async append(context: TransactionContext, event: AuditEvent): Promise<void> {
    return this.appendEvent(context, event, false);
  }

  /** Emits only allowlisted technical events as SYSTEM within the caller's admitted transaction. */
  async appendSystemTechnical(
    context: TransactionContext,
    event: Omit<AuditEvent, 'actor'>,
  ): Promise<void> {
    if (!systemTechnicalActions.has(event.action) || !context.executionActor)
      throw new Error('A bound business transaction and approved system action are required.');
    return this.appendEvent(context, { ...event, actor: { kind: 'SYSTEM' } }, true);
  }

  private async appendEvent(
    context: TransactionContext,
    event: AuditEvent,
    systemTechnical: boolean,
  ): Promise<void> {
    auditPayload(event.action, {});
    validateAuditEvent(event);
    if (isBusinessHistoryAction(event.action, event.objectKind)) {
      const trusted = context.executionActor;
      if (!trusted) throw new Error('Business audit events require a bound execution principal.');
      if (systemTechnical && !systemTechnicalActions.has(event.action))
        throw new Error('Only approved technical actions may use the system audit principal.');
      if (!systemTechnical && !sameActor(event.actor, trusted))
        throw new Error('Business audit actor must match the trusted execution principal.');
      if (!allowedAuditActorKinds(event.action).includes(event.actor.kind))
        throw new Error('Business audit action does not permit this actor kind.');
    }
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
