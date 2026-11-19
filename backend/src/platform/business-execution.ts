import type { Prisma } from '../generated/prisma/client';
import { CommandReceiptService } from './command-receipt.service';
import type { ReceiptCommand, ReceiptOutcome } from './command-receipt.service';
import { DatabaseService } from './database.service';
import { ApplicationError } from './application-error';
import type { TransactionContext } from './transaction-context';
import type { LockResource, TrustedExecutionActor } from './transaction-context';

export type BusinessExecutionPrincipal =
  | { kind: 'session'; accountId: string }
  | { kind: 'system'; actorKind: 'SYSTEM' }
  | { kind: 'operator'; identity: string };

export type BusinessReceiptIntent = Omit<ReceiptCommand, 'accountId'>;

/** Every business use case supplies its current authority and complete typed lock plan. */
export type BusinessExecutionScope = {
  /** T007's protected adapter derives this from the live cookie session, never request fields. */
  principal: BusinessExecutionPrincipal;
  locks: readonly LockResource[];
  /** T007 resolves/locks current session state and validates CSRF/Origin before the use case. */
  authority: (context: TransactionContext, now: Date) => Promise<void>;
  discover?: (db: Prisma.TransactionClient) => Promise<LockResource[]>;
};

/** Application-facing transaction seam; business collaborators share its context. */
export class BusinessExecutionService {
  constructor(
    private readonly database: DatabaseService,
    private readonly receipts = new CommandReceiptService(),
  ) {}

  execute<T>(
    scope: BusinessExecutionScope,
    work: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    if (!scope || typeof scope.authority !== 'function')
      throw new Error('Every business operation requires an explicit authority check.');
    if (!scope.principal)
      throw new Error('Every business operation requires an execution principal.');
    const principalValid =
      (scope.principal.kind === 'session' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          scope.principal.accountId,
        )) ||
      (scope.principal.kind === 'system' && scope.principal.actorKind === 'SYSTEM') ||
      (scope.principal.kind === 'operator' &&
        typeof scope.principal.identity === 'string' &&
        scope.principal.identity.trim().length > 0);
    if (!principalValid) throw new Error('Business execution principal is invalid.');
    if (!Array.isArray(scope.locks)) throw new Error('Every business operation needs typed locks.');
    const executionActor: TrustedExecutionActor =
      scope.principal.kind === 'session'
        ? { kind: 'ACCOUNT', accountId: scope.principal.accountId }
        : scope.principal.kind === 'system'
          ? { kind: 'SYSTEM' }
          : { kind: 'OPERATOR', identity: scope.principal.identity };
    return this.database.write(scope.locks, scope.authority, work, scope.discover, executionActor);
  }

  executeCritical(
    scope: BusinessExecutionScope,
    command:
      BusinessReceiptIntent | ((context: TransactionContext) => Promise<BusinessReceiptIntent>),
    work: (context: TransactionContext, command: ReceiptCommand) => Promise<ReceiptOutcome>,
    project: (context: TransactionContext, outcome: ReceiptOutcome) => Promise<ReceiptOutcome>,
    beforeReceipt?: (context: TransactionContext) => Promise<void>,
  ): Promise<ReceiptOutcome> {
    if (!scope?.principal || scope.principal.kind !== 'session')
      throw new ApplicationError(403, 'ACCESS_DENIED', 'Lệnh cần phiên tài khoản hợp lệ.');
    const accountId = scope.principal.accountId;
    return this.execute(scope, async (context) => {
      await beforeReceipt?.(context);
      const intent = typeof command === 'function' ? await command(context) : command;
      const receiptCommand: ReceiptCommand = { ...intent, accountId };
      return this.receipts.execute(context, receiptCommand, work, project);
    });
  }
}
