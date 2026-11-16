import type { Request } from 'express';
import { MethodNotAllowedException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { denied } from '../identity-access/accounts.dto';
import { AuthService } from '../identity-access/auth.service';
import { readCookie, SESSION_COOKIE } from '../identity-access/csrf.service';
import type { TransactionContext, LockResource } from './transaction-context';
import {
  BusinessExecutionService,
  type BusinessReceiptIntent,
  type BusinessExecutionScope,
} from './business-execution';
import type { ReceiptCommand, ReceiptOutcome } from './command-receipt.service';

export type HttpBusinessOperation = {
  locks: readonly LockResource[];
  discover?: (db: Prisma.TransactionClient) => Promise<LockResource[]>;
  authorize(context: TransactionContext, accountId: string, now: Date): Promise<void>;
};

export type HttpBusinessReceiptIntent = Omit<BusinessReceiptIntent, 'key'>;

/** Resolves HTTP business operations to a live session and explicit owner authority. */
export class HttpBusinessExecutionAdapter {
  constructor(
    private readonly auth: AuthService,
    private readonly execution: BusinessExecutionService,
  ) {}

  async execute<T>(
    request: Request,
    operation: HttpBusinessOperation,
    work: (context: TransactionContext, accountId: string) => Promise<T>,
  ): Promise<T> {
    const { candidate, scope } = await this.resolve(request, operation);
    return this.execution.execute(scope, async (context) => {
      const live = await this.auth.sessions.require(context, candidate, await context.now());
      await this.auth.sessions.touch(context, live);
      return work(context, live.account.id);
    });
  }

  /** Runs a GET with live-session and owner checks, without applying mutation Origin/CSRF gates. */
  async read<T>(
    request: Request,
    operation: HttpBusinessOperation,
    work: (context: TransactionContext, accountId: string) => Promise<T>,
  ): Promise<T> {
    if (request.method !== 'GET') throw new MethodNotAllowedException();
    const { candidate, scope } = await this.resolve(request, operation, false);
    return this.execution.execute(scope, async (context) => {
      const live = await this.auth.sessions.require(context, candidate, await context.now());
      await this.auth.sessions.touch(context, live);
      return work(context, live.account.id);
    });
  }

  async executeCritical(
    request: Request,
    operation: HttpBusinessOperation,
    intent:
      | HttpBusinessReceiptIntent
      | ((context: TransactionContext) => Promise<HttpBusinessReceiptIntent>),
    work: (context: TransactionContext, command: ReceiptCommand) => Promise<ReceiptOutcome>,
    project: (context: TransactionContext, outcome: ReceiptOutcome) => Promise<ReceiptOutcome>,
  ): Promise<ReceiptOutcome> {
    const { candidate, scope } = await this.resolve(request, operation);
    const key = request.get('Idempotency-Key') ?? '';
    const command =
      typeof intent === 'function'
        ? async (context: TransactionContext) => ({ ...(await intent(context)), key })
        : { ...intent, key };
    return this.execution.executeCritical(scope, command, work, project, async (context) => {
      await this.auth.sessions.touch(
        context,
        await this.auth.sessions.require(context, candidate, await context.now()),
      );
    });
  }

  private async resolve(
    request: Request,
    operation: HttpBusinessOperation,
    requireMutationIntegrity = true,
  ): Promise<{
    candidate: NonNullable<Awaited<ReturnType<AuthService['sessions']['candidate']>>>;
    scope: BusinessExecutionScope;
  }> {
    if (
      !operation ||
      !Array.isArray(operation.locks) ||
      typeof operation.authorize !== 'function' ||
      (operation.discover !== undefined && typeof operation.discover !== 'function')
    )
      throw new Error(
        'Every protected business route requires operation-specific authority and locks.',
      );
    if (requireMutationIntegrity)
      this.auth.csrf.requireOrigin(request, process.env.AUTH_ORIGIN ?? '');
    const candidate = await this.auth.sessions.candidate(readCookie(request, SESSION_COOKIE));
    if (!candidate) this.auth.sessions.missing();

    const authority: BusinessExecutionScope['authority'] = async (context, now) => {
      const live = await this.auth.sessions.require(context, candidate!, now);
      if (live.account.mustChangePassword) throw denied();
      if (requireMutationIntegrity)
        this.auth.csrf.requireToken(request.get('X-CSRF-Token'), live.session.csrfToken);
      await operation.authorize(context, live.account.id, now);
    };
    return {
      candidate: candidate!,
      scope: {
        principal: { kind: 'session', accountId: candidate!.accountId },
        locks: [...operation.locks, ...this.auth.sessions.locks(candidate!)],
        authority,
        discover: operation.discover,
      },
    };
  }
}
