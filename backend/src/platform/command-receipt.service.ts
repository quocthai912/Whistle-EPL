import { createHash } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client';
import { ApplicationError } from './application-error';
import { normalizeMultilineText } from './business-text';
import type { TransactionContext } from './transaction-context';

const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const rules = {
  ACCOUNT_LOCKED: { target: 'uuid', required: ['expectedRevision'] },
  ACCOUNT_UNLOCKED: { target: 'uuid', required: ['expectedRevision'] },
  SYSTEM_ROLE_GRANTED: { target: 'uuid', required: ['expectedRevision', 'roleCode'] },
  SYSTEM_ROLE_REVOKED: { target: 'uuid', required: ['expectedRevision', 'assignmentId'] },
  SEASON_ROLE_GRANTED: { target: 'uuid', required: ['expectedRevision', 'roleCode', 'seasonId'] },
  SEASON_ROLE_REVOKED: { target: 'uuid', required: ['expectedRevision', 'assignmentId'] },
  PERMISSION_GRANTED: { target: 'uuid', required: ['expectedRevision', 'kind'] },
  PERMISSION_REVOKED: { target: 'uuid', required: ['expectedRevision', 'kind', 'grantId'] },
  DELEGATION_GRANTED: { target: 'uuid', required: ['expectedRevision', 'versionId'] },
  DELEGATION_REVOKED: { target: 'uuid', required: ['expectedRevision', 'reason'] },
  SEASON_CREATED: {
    target: 'season-collection',
    required: ['code', 'name', 'competitionName', 'startDate', 'endDate'],
  },
  // The target/submittedVersionId names the immutable typed content; its expected revision is
  // part of the digest. T012 rechecks effectivity and external review bases under owning locks.
  REGULATION_APPROVED: {
    target: 'uuid',
    required: ['expectedRevision', 'submittedVersionId', 'effectiveMode'],
    optional: ['proposedEffectiveAt', 'reason', 'currentBasisVersionId'],
  },
  REGULATION_CHANGE_APPROVED: {
    target: 'uuid',
    required: ['expectedRevision', 'submittedVersionId', 'action', 'waitingVersionId', 'reason'],
    optional: ['replacementVersionId', 'currentBasisVersionId'],
  },
  SEASON_LIFECYCLE_APPROVED: {
    target: 'uuid',
    required: ['expectedRevision', 'submittedVersionId', 'action', 'reason'],
    optional: ['readinessBasisReference'],
  },
} as const;
export type ReceiptAction = keyof typeof rules;
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

function invalidIntent(): never {
  throw new ApplicationError(400, 'INVALID_INPUT', 'Nội dung lệnh không hợp lệ.');
}

function normalizeDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return invalidIntent();
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    return invalidIntent();
  return value;
}

function normalizeInstant(value: string): string {
  const match =
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/i.exec(value);
  if (!match) return invalidIntent();
  normalizeDate(match[1]);
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const second = Number(match[4]);
  if (hour > 23 || minute > 59 || second > 59) return invalidIntent();
  if (match[5] !== undefined && match[5].length > 3) return invalidIntent();
  const zone = match[6];
  if (zone.toUpperCase() !== 'Z') {
    const offsetHours = Number(zone.slice(1, 3));
    const offsetMinutes = Number(zone.slice(4, 6));
    if (offsetHours > 23 || offsetMinutes > 59) return invalidIntent();
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return invalidIntent();
  return parsed.toISOString();
}

function normalizeSingleLine(value: string, maximum: number): string {
  const normalized = value.normalize('NFC').trim().replace(/\s+/gu, ' ');
  if (!normalized || [...normalized].length > maximum) return invalidIntent();
  return normalized;
}

export class CommandReceiptService {
  /** Validates the receipt fields and canonicalizes values exactly as needed for an intent digest. */
  private normalize(command: ReceiptCommand): ReceiptCommand {
    if (
      !command ||
      typeof command !== 'object' ||
      Object.keys(command).some(
        (key) => !['accountId', 'action', 'key', 'targetId', 'payload'].includes(key),
      )
    )
      return invalidIntent();
    const rule = rules[command.action];
    if (!rule) return invalidIntent();
    const optional = 'optional' in rule ? rule.optional : [];
    const allowedFields = new Set<string>([...rule.required, ...optional]);
    if (
      !UUID4.test(command.accountId) ||
      !UUID4.test(command.key) ||
      !command.payload ||
      typeof command.payload !== 'object' ||
      Object.keys(command.payload).some((key) => !allowedFields.has(key)) ||
      rule.required.some((key) => typeof command.payload[key] !== 'string') ||
      (rule.target === 'uuid' && !UUID4.test(command.targetId)) ||
      (rule.target === 'season-collection' && command.targetId !== 'SeasonCollection')
    )
      return invalidIntent();
    const payload: Record<string, string> = {};
    for (const [key, value] of Object.entries(command.payload)) {
      if (typeof value !== 'string' || [...value].length > 2000) return invalidIntent();
      if (key === 'expectedRevision') {
        if (!/^[1-9][0-9]*$/.test(value)) return invalidIntent();
        payload[key] = value;
      } else if (key === 'code') {
        const code = value.trim().toUpperCase();
        if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(code)) return invalidIntent();
        payload[key] = code;
      } else if (key === 'name') {
        payload[key] = normalizeSingleLine(value, 200);
      } else if (key === 'competitionName') {
        payload[key] = normalizeSingleLine(value, 200);
      } else if (key === 'startDate' || key === 'endDate') {
        payload[key] = normalizeDate(value);
      } else if (key === 'proposedEffectiveAt') {
        payload[key] = normalizeInstant(value);
      } else if (key === 'reason') {
        payload[key] = normalizeMultilineText(value);
      } else if (
        key === 'effectiveMode' ||
        key === 'action' ||
        key === 'roleCode' ||
        key === 'kind'
      ) {
        payload[key] = value.trim().toUpperCase();
      } else if (key === 'readinessBasisReference') {
        if (!UUID4.test(value) && !/^[0-9a-f]{64}$/i.test(value)) return invalidIntent();
        payload[key] = value.toLowerCase();
      } else if (key.endsWith('Id')) {
        if (!UUID4.test(value)) return invalidIntent();
        payload[key] = value.toLowerCase();
      } else {
        payload[key] = value;
      }
    }

    if ('expectedRevision' in payload && !/^[1-9][0-9]*$/.test(payload.expectedRevision))
      return invalidIntent();
    if (command.action === 'SEASON_CREATED' && payload.startDate > payload.endDate)
      return invalidIntent();
    if (command.action === 'REGULATION_APPROVED') {
      if (payload.submittedVersionId !== command.targetId.toLowerCase()) return invalidIntent();
      if (payload.effectiveMode === 'SCHEDULED' && !payload.proposedEffectiveAt)
        return invalidIntent();
      if (payload.effectiveMode === 'IMMEDIATE' && payload.proposedEffectiveAt)
        return invalidIntent();
      if (!['IMMEDIATE', 'SCHEDULED'].includes(payload.effectiveMode)) return invalidIntent();
    }
    if (command.action === 'REGULATION_CHANGE_APPROVED') {
      if (!['CANCEL', 'REPLACE'].includes(payload.action)) return invalidIntent();
      if (payload.action === 'REPLACE' && !payload.replacementVersionId) return invalidIntent();
      if (payload.action === 'CANCEL' && payload.replacementVersionId) return invalidIntent();
      if (!payload.reason) return invalidIntent();
    }
    if (command.action === 'SEASON_LIFECYCLE_APPROVED') {
      if (!['CLOSE', 'REOPEN'].includes(payload.action) || !payload.reason) return invalidIntent();
      if (payload.action === 'CLOSE' && !payload.readinessBasisReference) return invalidIntent();
      if (payload.action === 'REOPEN' && payload.readinessBasisReference) return invalidIntent();
    }
    return {
      ...command,
      accountId: command.accountId.toLowerCase(),
      key: command.key.toLowerCase(),
      targetId:
        rule.target === 'season-collection' ? 'SeasonCollection' : command.targetId.toLowerCase(),
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
