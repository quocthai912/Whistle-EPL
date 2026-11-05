import type { Request } from 'express';
import type { Prisma } from '../generated/prisma/client';
import { AuditWriterService, type AuditEvent } from '../audit/audit-writer.service';
import { DatabaseService } from '../platform/database.service';
import {
  CommandReceiptService,
  type ReceiptAction,
  type ReceiptOutcome,
} from '../platform/command-receipt.service';
import type { LockResource, TransactionContext } from '../platform/transaction-context';
import { AuthService } from './auth.service';
import { readCookie, SESSION_COOKIE } from './csrf.service';
import { isAdministrator } from './authority.policy';
import { denied, missing } from './accounts.dto';

type Check = (context: TransactionContext, actorId: string) => Promise<void>;
type Work<T> = (context: TransactionContext, actorId: string) => Promise<T>;
type Discover = (db: Prisma.TransactionClient) => Promise<LockResource[]>;

export class AdministrationExecution {
  private readonly receipts = new CommandReceiptService();
  private readonly audit = new AuditWriterService();
  constructor(
    readonly database: DatabaseService,
    private readonly auth: AuthService,
  ) {}

  /** Checks the live session and endpoint authority under ordered locks, adding origin and CSRF validation for mutations. */
  async run<T>(
    request: Request,
    work: Work<T>,
    options: {
      discover?: Discover;
      check?: Check;
      write?: boolean;
      locks?: LockResource[];
    } = {},
  ): Promise<T> {
    if (options.write) this.auth.csrf.requireOrigin(request, process.env.AUTH_ORIGIN ?? '');
    const candidate = await this.auth.sessions.candidate(readCookie(request, SESSION_COOKIE));
    if (!candidate) return this.auth.sessions.missing();
    /** Rechecks session state and the operation's current authority after lock acquisition. */
    const check = async (context: TransactionContext, now: Date) => {
      const live = await this.auth.sessions.require(context, candidate, now);
      if (live.account.mustChangePassword) throw denied();
      if (options.write)
        this.auth.csrf.requireToken(request.get('X-CSRF-Token'), live.session.csrfToken);
      if (options.check) await options.check(context, candidate.accountId);
      else if (!(await isAdministrator(context.db, candidate.accountId))) throw denied();
    };
    return this.database.write(
      [...(options.locks ?? []), ...this.auth.sessions.locks(candidate)],
      check,
      async (context) => {
        await this.auth.sessions.touch(
          context,
          await this.auth.sessions.require(context, candidate, await context.now()),
        );
        return work(context, candidate.accountId);
      },
      options.discover,
    );
  }

  /** Binds the protected request's idempotency key to the action, target and normalized intent. */
  async critical(
    context: TransactionContext,
    request: Request,
    accountId: string,
    action: ReceiptAction,
    targetId: string,
    payload: Record<string, string>,
    work: () => Promise<ReceiptOutcome>,
  ) {
    return (
      await this.receipts.execute(
        context,
        {
          accountId,
          action,
          targetId,
          payload,
          key: request.get('Idempotency-Key') ?? '',
        },
        work,
        async (_context, outcome) => {
          // The caller's current authority is checked before receipt lookup. Outcome fields are allowlisted.
          return outcome;
        },
      )
    ).data;
  }

  event(
    context: TransactionContext,
    request: Request,
    accountId: string,
    event: Omit<AuditEvent, 'actor' | 'outcome' | 'requestId'>,
  ) {
    return this.audit.append(context, {
      ...event,
      actor: { kind: 'ACCOUNT', accountId },
      outcome: 'SUCCESS',
      requestId: request.res?.locals.requestId as string | undefined,
    });
  }

  /** Loads an administration target inside the authorized transaction or returns a safe not-found error. */
  async subject(context: TransactionContext, id: string) {
    const account = await context.db.account.findUnique({ where: { id } });
    if (!account) throw missing();
    return account;
  }
}
