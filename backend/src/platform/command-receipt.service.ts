import { createHash } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client';
import { ApplicationError } from './application-error';
import type { TransactionContext } from './transaction-context';

const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fields = {
  ACCOUNT_LOCKED: ['expectedRevision'],
  ACCOUNT_UNLOCKED: ['expectedRevision'],
  SYSTEM_ROLE_GRANTED: ['expectedRevision', 'roleCode'],
  SYSTEM_ROLE_REVOKED: ['expectedRevision', 'assignmentId'],
  SEASON_ROLE_GRANTED: ['expectedRevision', 'roleCode', 'seasonId'],
  SEASON_ROLE_REVOKED: ['expectedRevision', 'assignmentId'],
  PERMISSION_GRANTED: ['expectedRevision', 'kind'],
  PERMISSION_REVOKED: ['expectedRevision', 'kind', 'grantId'],
  DELEGATION_GRANTED: ['expectedRevision', 'versionId'],
  DELEGATION_REVOKED: ['expectedRevision', 'reason'],
} as const;
export type ReceiptAction = keyof typeof fields;
export type ReceiptCommand = {
  accountId: string;
  action: ReceiptAction;
  key: string;
  targetId: string;
  payload: Record<string, string>;
};
export type ReceiptOutcome = {
  status: 200 | 201;
  data: { id: string; revision: string; relatedId?: string };
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

function safeOutcome(value: unknown): ReceiptOutcome {
  const result = value as ReceiptOutcome;
  if (
    !result ||
    ![200, 201].includes(result.status) ||
    Object.keys(result).some((k) => !['status', 'data'].includes(k)) ||
    !result.data ||
    Object.keys(result.data).some((k) => !['id', 'revision', 'relatedId'].includes(k)) ||
    !UUID4.test(result.data.id) ||
    !/^[1-9][0-9]*$/.test(result.data.revision) ||
    (result.data.relatedId !== undefined && !UUID4.test(result.data.relatedId))
  )
    throw new Error('Unsafe receipt response.');
  return result;
}

export class CommandReceiptService {
  private normalize(command: ReceiptCommand): ReceiptCommand {
    const allowed: readonly string[] = fields[command.action];
    if (
      !allowed ||
      !UUID4.test(command.accountId) ||
      !UUID4.test(command.key) ||
      !UUID4.test(command.targetId) ||
      !command.payload ||
      Object.keys(command.payload).some((k) => !allowed.includes(k)) ||
      !/^[1-9][0-9]*$/.test(command.payload.expectedRevision)
    )
      throw new ApplicationError(400, 'INVALID_INPUT', 'Định danh lệnh không hợp lệ.');
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(command.payload)) {
      if (typeof value !== 'string' || [...value].length > 2000)
        throw new ApplicationError(400, 'INVALID_INPUT', 'Nội dung lệnh không hợp lệ.');
      payload[key] =
        key === 'reason'
          ? value.normalize('NFC').trim().replace(/\s+/gu, ' ')
          : key.endsWith('Id')
            ? value.toLowerCase()
            : value;
    }
    return {
      ...command,
      accountId: command.accountId.toLowerCase(),
      key: command.key.toLowerCase(),
      targetId: command.targetId.toLowerCase(),
      payload,
    };
  }

  async execute(
    context: TransactionContext,
    input: ReceiptCommand,
    work: (context: TransactionContext, command: ReceiptCommand) => Promise<ReceiptOutcome>,
    project: (context: TransactionContext, outcome: ReceiptOutcome) => Promise<ReceiptOutcome>,
  ): Promise<ReceiptOutcome> {
    const command = this.normalize(input);
    const contentDigest = createHash('sha256')
      .update(
        canonical({ action: command.action, targetId: command.targetId, payload: command.payload }),
      )
      .digest('hex');
    await context.lockReceipt(`${command.accountId}:${command.action}:${command.key}`);
    await context.recheckAuthority();
    const where = {
      accountId_actionCode_requestKey: {
        accountId: command.accountId,
        actionCode: command.action,
        requestKey: command.key,
      },
    };
    let existing = await context.db.commandReceipt.findUnique({ where });
    const now = await context.now();
    if (existing?.expiresAt && existing.expiresAt <= now) {
      await context.db.commandReceipt.delete({ where });
      existing = null;
    }
    if (existing) {
      if (existing.contentDigest !== contentDigest)
        throw new ApplicationError(
          409,
          'IDEMPOTENCY_KEY_REUSED',
          'Định danh lệnh đã được dùng cho nội dung khác.',
        );
      if (existing.outcomeState !== 'COMPLETED')
        throw new ApplicationError(
          503,
          'TRANSACTION_UNAVAILABLE',
          'Chưa xác định được kết quả lệnh.',
        );
      const outcome = safeOutcome({ status: existing.responseStatus, data: existing.responseData });
      return safeOutcome(await project(context, outcome));
    }
    await context.db.commandReceipt.create({
      data: {
        accountId: command.accountId,
        actionCode: command.action,
        requestKey: command.key,
        contentDigest,
        outcomeState: 'PENDING',
      },
    });
    // The owning operation performs its fresh revision/state checks here, after replay lookup.
    const outcome = safeOutcome(await work(context, command));
    const projected = safeOutcome(await project(context, outcome));
    const completedAt = await context.now();
    await context.db.commandReceipt.update({
      where,
      data: {
        outcomeState: 'COMPLETED',
        responseStatus: outcome.status,
        responseData: outcome.data as Prisma.InputJsonObject,
        completedAt,
        expiresAt: new Date(completedAt.getTime() + 86400000),
      },
    });
    return projected;
  }
}
