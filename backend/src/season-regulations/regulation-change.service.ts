import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import type { Prisma } from '../generated/prisma/client';
import {
  businessText,
  conflict,
  denied,
  invalid,
  listQuery,
  missing,
  uuid,
} from '../identity-access/accounts.dto';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { withPaginationMeta } from '../platform/response-envelope.interceptor';
import type { LockResource, TransactionContext } from '../platform/transaction-context';
import type { RegulationActivationService } from './regulation-activation.service';
import type {
  CreateRegulationChangeDto,
  EditRegulationChangeDto,
} from './regulation-changes.controller';
import type { RegulationDecisionService } from './regulation-decision.service';
import type { RegulationVersionActionDto } from './regulation.dto';
import { loadRegulationContent } from './regulation-content';
import { validateCompleteRegulationContent } from './regulation-validation';

const currentVersion = {
  currentVersion: { include: { editors: { select: { accountId: true } } } },
} as const;
type ChangeRequest = Prisma.RegulationChangeRequestGetPayload<{ include: typeof currentVersion }>;
type ChangeContent = {
  action: string;
  waitingVersionId: string;
  replacementVersionId: string | null;
  reason: string | null;
};

const seasonLock = (key: string, mode: LockResource['mode']): LockResource => ({
  kind: 'season',
  key,
  mode,
});
const regulationLock = (key: string): LockResource => ({
  kind: 'regulationVersion',
  key,
  mode: 'exclusive',
});

export class RegulationChangeService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly activation: RegulationActivationService,
    private readonly decisions: RegulationDecisionService,
    private readonly audit: AuditWriterService,
  ) {}

  private async access(
    context: TransactionContext,
    seasonId: string,
    accountId: string,
    manager: boolean,
  ) {
    const assignment = await context.db.seasonRoleAssignment.findFirst({
      where: {
        seasonId,
        accountId,
        revokedAt: null,
        ...(manager ? { roleCode: 'SEASON_MANAGER' } : {}),
      },
      select: { roleCode: true },
      orderBy: { roleCode: 'desc' },
    });
    if (!assignment) throw denied();
    return (
      manager ||
      (await context.db.seasonRoleAssignment.count({
        where: { seasonId, accountId, revokedAt: null, roleCode: 'SEASON_MANAGER' },
      })) > 0
    );
  }

  private async get(context: TransactionContext, id: string) {
    const row = await context.db.regulationChangeRequest.findUnique({
      where: { id },
      include: currentVersion,
    });
    if (!row?.currentVersion) throw missing();
    return { ...row, currentVersion: row.currentVersion };
  }

  private ack(row: Pick<ChangeRequest, 'id' | 'revision'>, versionId: string) {
    return { id: row.id, revision: row.revision.toString(), versionId };
  }

  async list(request: Request, seasonId: string, query: Record<string, unknown>) {
    const { page, pageSize, skip, take } = listQuery(query, [], ['createdAt:desc']);
    return this.execution.read(
      request,
      {
        locks: [],
        authorize: async (context, actor) => {
          await this.access(context, seasonId, actor, false);
        },
      },
      async (context, actor) => {
        const manager = await this.access(context, seasonId, actor, false);
        const season = await context.db.season.findUniqueOrThrow({
          where: { id: seasonId },
          select: { state: true, currentRegulationVersionId: true },
        });
        const now = await context.now();
        const rows = await context.db.regulationChangeRequest.findMany({
          where: { seasonId },
          include: {
            currentVersion: {
              include: {
                editors: { select: { accountId: true } },
                waitingVersion: { select: { state: true, proposedEffectiveAt: true } },
                replacementVersion: {
                  select: {
                    state: true,
                    preparedBy: true,
                    editors: { select: { accountId: true } },
                  },
                },
              },
            },
          },
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        });
        const items = rows.flatMap((row) => {
          const version = row.currentVersion;
          if (!version) return [];
          const active =
            manager &&
            season.state === 'OPEN' &&
            version.waitingVersion.state === 'APPROVED_WAITING' &&
            version.waitingVersion.proposedEffectiveAt !== null &&
            version.waitingVersion.proposedEffectiveAt > now;
          const independent =
            version.preparedBy !== actor &&
            !version.editors.some((editor) => editor.accountId === actor);
          const replacement = version.replacementVersion;
          const independentOfReplacement =
            !replacement ||
            (replacement.state === 'SUBMITTED' &&
              replacement.preparedBy !== actor &&
              !replacement.editors.some((editor) => editor.accountId === actor));
          return [
            {
              ...this.ack(row, version.id),
              state: row.state,
              action: version.action,
              waitingVersionId: version.waitingVersionId,
              replacementVersionId: version.replacementVersionId,
              currentBasisVersionId: season.currentRegulationVersionId,
              reason: version.reason,
              decisionReason: version.decisionReason,
              cutoff: version.waitingVersion.proposedEffectiveAt?.toISOString() ?? null,
              capabilities: {
                canSubmit: active && row.state === 'DRAFT',
                canApprove:
                  active && row.state === 'SUBMITTED' && independent && independentOfReplacement,
              },
            },
          ];
        });
        const total = await context.db.regulationChangeRequest.count({ where: { seasonId } });
        return withPaginationMeta({ items }, { page, pageSize, total });
      },
    );
  }

  async create(request: Request, seasonId: string, input: CreateRegulationChangeDto) {
    const content = {
      action: input.action,
      waitingVersionId: uuid(input.waitingVersionId),
      replacementVersionId: input.replacementVersionId ? uuid(input.replacementVersionId) : null,
      reason: businessText(input.reason, 'reason'),
    };
    return this.execution.execute(
      request,
      {
        locks: [seasonLock(seasonId, 'exclusive')],
        discover: (db) => this.targets(db, seasonId, content),
        authorize: async (context, actor) => {
          await this.access(context, seasonId, actor, true);
        },
      },
      async (context, preparedBy) => {
        const recordedAt = await this.openTime(context, seasonId);
        await this.checkTargets(context, seasonId, content, recordedAt);
        const record = await context.db.regulationChangeRequest.create({ data: { seasonId } });
        const version = await context.db.regulationChangeVersion.create({
          data: { ...content, caseId: record.id, seasonId, preparedBy, versionNumber: 1 },
        });
        await context.db.regulationChangeRequest.update({
          where: { id: record.id },
          data: { currentVersionId: version.id },
        });
        return this.ack(record, version.id);
      },
    );
  }

  private async targets(
    db: Prisma.TransactionClient,
    seasonId: string,
    content: ChangeContent,
    approval = false,
  ) {
    const ids = [content.waitingVersionId, content.replacementVersionId].filter(
      (value): value is string => Boolean(value),
    );
    const rows = await db.regulationVersion.findMany({
      where: { seasonId, id: { in: ids } },
      select: { id: true, caseId: true },
    });
    const locks: LockResource[] = rows.flatMap((row) => [
      { kind: 'regulationCase', key: row.caseId, mode: 'exclusive' },
      regulationLock(row.id),
    ]);
    if (
      approval &&
      content.replacementVersionId &&
      rows.some((row) => row.id === content.replacementVersionId)
    ) {
      locks.push(
        ...(await this.activation.discover(db, { id: content.replacementVersionId, seasonId })),
      );
    }
    return locks;
  }

  private operation(id: string, approval = false, overrides?: EditRegulationChangeDto) {
    return {
      locks: [],
      discover: async (db: Prisma.TransactionClient): Promise<LockResource[]> => {
        const row = await db.regulationChangeRequest.findUnique({
          where: { id },
          include: currentVersion,
        });
        const version = row?.currentVersion;
        if (!row || !version) return [];
        const content = {
          ...version,
          waitingVersionId: overrides?.waitingVersionId
            ? uuid(overrides.waitingVersionId)
            : version.waitingVersionId,
          replacementVersionId: overrides?.replacementVersionId
            ? uuid(overrides.replacementVersionId)
            : version.replacementVersionId,
        };
        return [
          seasonLock(row.seasonId, 'exclusive'),
          { kind: 'regulationChangeRequest', key: id, mode: 'exclusive' },
          { kind: 'regulationChangeVersion', key: version.id, mode: 'exclusive' },
          ...(await this.targets(db, row.seasonId, content, approval)),
        ];
      },
      authorize: async (context: TransactionContext, actor: string) => {
        const row = await this.get(context, id);
        await this.access(context, row.seasonId, actor, true);
      },
    };
  }

  private async openTime(context: TransactionContext, seasonId: string) {
    await context.recheckAuthority();
    const season = await context.db.season.findUnique({
      where: { id: seasonId },
      select: { state: true },
    });
    if (season?.state !== 'OPEN') throw conflict('STATE_CONFLICT');
    return context.now();
  }

  private async checkTargets(
    context: TransactionContext,
    seasonId: string,
    content: ChangeContent,
    now: Date,
  ) {
    if ((content.action === 'CANCEL') !== (content.replacementVersionId === null)) throw invalid();
    const waiting = await context.db.regulationVersion.findFirst({
      where: { id: content.waitingVersionId, seasonId, state: 'APPROVED_WAITING' },
    });
    if (!waiting?.proposedEffectiveAt || waiting.proposedEffectiveAt <= now)
      throw conflict('BASIS_CHANGED');
    const replacement = content.replacementVersionId
      ? await context.db.regulationVersion.findFirst({
          where: { id: content.replacementVersionId, seasonId, state: 'SUBMITTED' },
        })
      : null;
    if (content.replacementVersionId && !replacement) throw conflict('BASIS_CHANGED');
    return { waiting, replacement, cutoff: waiting.proposedEffectiveAt };
  }

  async edit(request: Request, id: string, input: EditRegulationChangeDto) {
    return this.execution.execute(
      request,
      this.operation(id, false, input),
      async (context, actor) => {
        const row = await this.get(context, id);
        const version = row.currentVersion;
        if (row.revision.toString() !== input.expectedRevision) throw conflict('REVISION_CONFLICT');
        if (!['DRAFT', 'RETURNED', 'WITHDRAWN'].includes(row.state))
          throw conflict('STATE_CONFLICT');
        const content = {
          action: version.action,
          waitingVersionId: input.waitingVersionId
            ? uuid(input.waitingVersionId)
            : version.waitingVersionId,
          replacementVersionId: input.replacementVersionId
            ? uuid(input.replacementVersionId)
            : version.replacementVersionId,
          reason:
            input.reason === undefined ? version.reason : businessText(input.reason, 'reason'),
        };
        const now = await this.openTime(context, row.seasonId);
        await this.checkTargets(context, row.seasonId, content, now);
        const edited =
          version.state === 'DRAFT'
            ? await context.db.regulationChangeVersion.update({
                where: { id: version.id },
                data: { ...content, revision: { increment: 1n } },
              })
            : await context.db.regulationChangeVersion.create({
                data: {
                  ...content,
                  caseId: id,
                  seasonId: row.seasonId,
                  preparedBy: actor,
                  versionNumber: version.versionNumber + 1,
                  predecessorVersionId: version.id,
                },
              });
        await context.db.regulationChangeVersionEditor.createMany({
          data: [
            ...new Set([
              actor,
              version.preparedBy,
              ...version.editors.map((editor) => editor.accountId),
            ]),
          ].map((accountId) => ({ versionId: edited.id, accountId, firstEditedAt: now })),
          skipDuplicates: true,
        });
        const updated = await this.moveRequest(context, id, edited.id, 'DRAFT', now);
        return this.ack(updated, edited.id);
      },
    );
  }

  private moveRequest(
    context: TransactionContext,
    id: string,
    versionId: string,
    state: string,
    now: Date,
  ) {
    return context.db.regulationChangeRequest.update({
      where: { id },
      data: { state, currentVersionId: versionId, revision: { increment: 1n }, updatedAt: now },
    });
  }

  async transition(
    request: Request,
    id: string,
    action: string,
    input: RegulationVersionActionDto,
  ) {
    const reason = businessText(input.reason, 'reason');
    if (!input.submittedVersionId) throw invalid();
    const target = uuid(input.submittedVersionId);
    if (action === 'approve') {
      const result = await this.execution.executeCritical(
        request,
        this.operation(id, true),
        async (context) => {
          const version = await context.db.regulationChangeVersion.findFirst({
            where: { id: target, caseId: id },
          });
          if (!version) throw conflict('BASIS_CHANGED');
          if ((version.action === 'REPLACE') !== (input.expectedCurrentVersionId !== undefined))
            throw invalid();
          return {
            action: 'REGULATION_CHANGE_APPROVED',
            targetId: id,
            payload: {
              expectedRevision: input.expectedRevision,
              submittedVersionId: target,
              action: version.action,
              waitingVersionId: version.waitingVersionId,
              reason,
              ...(version.replacementVersionId
                ? { replacementVersionId: version.replacementVersionId }
                : {}),
              ...(input.expectedCurrentVersionId
                ? { currentBasisVersionId: uuid(input.expectedCurrentVersionId) }
                : {}),
            },
          };
        },
        async (context, command) => {
          const row = await this.get(context, id);
          const version = row.currentVersion;
          if (row.revision.toString() !== input.expectedRevision)
            throw conflict('REVISION_CONFLICT');
          if (version.id !== target || version.state !== 'SUBMITTED')
            throw conflict('BASIS_CHANGED');
          if (
            version.preparedBy === command.accountId ||
            version.editors.some((editor) => editor.accountId === command.accountId)
          )
            throw denied();
          const before = await this.openTime(context, row.seasonId);
          const { waiting, replacement, cutoff } = await this.checkTargets(
            context,
            row.seasonId,
            version,
            before,
          );
          await context.db.regulationVersion.update({
            where: { id: waiting.id },
            data: { state: 'CANCELLED', revision: { increment: 1n } },
          });
          if (replacement) {
            await this.decisions.approve(
              context,
              {
                ...command,
                action: 'REGULATION_APPROVED',
                targetId: replacement.id,
                payload: {
                  expectedRevision: replacement.revision.toString(),
                  ...(command.payload.currentBasisVersionId
                    ? { currentBasisVersionId: command.payload.currentBasisVersionId }
                    : {}),
                  reason,
                },
              },
              async (versionId) =>
                validateCompleteRegulationContent(await loadRegulationContent(context, versionId)),
            );
          }
          const now = await this.openTime(context, row.seasonId);
          if (now >= cutoff) throw conflict('BASIS_CHANGED');
          await context.db.regulationChangeVersion.update({
            where: { id: version.id },
            data: {
              state: 'APPROVED',
              decidedAt: now,
              decidedBy: command.accountId,
              decisionReason: reason,
              revision: { increment: 1n },
            },
          });
          const updated = await this.moveRequest(context, id, version.id, 'APPROVED', now);
          await this.audit.append(context, {
            actor: { kind: 'ACCOUNT', accountId: command.accountId },
            action: 'REGULATION_CHANGE_APPROVED',
            objectKind: 'RegulationChangeRequest',
            objectId: id,
            seasonId: row.seasonId,
            outcome: 'SUCCESS',
            reason,
            before: { requestId: id, versionId: version.id, state: 'SUBMITTED' },
            after: {
              requestId: id,
              versionId: version.id,
              versionNumber: version.versionNumber,
              state: 'APPROVED',
              action: version.action,
              waitingVersionId: waiting.id,
              replacementVersionId: replacement?.id ?? null,
              approvedAt: now.toISOString(),
            },
          });
          return {
            status: 200,
            data: { id, revision: updated.revision.toString(), relatedId: version.id },
          };
        },
        async (_context, outcome) => outcome,
      );
      return {
        id: result.data.id,
        revision: result.data.revision,
        versionId: result.data.relatedId,
      };
    }
    if (input.expectedCurrentVersionId !== undefined) throw invalid();
    const states = {
      submit: 'SUBMITTED',
      withdraw: 'WITHDRAWN',
      return: 'RETURNED',
      reject: 'REJECTED',
    } as const;
    if (!Object.hasOwn(states, action)) throw invalid();
    const state = states[action as keyof typeof states];
    return this.execution.execute(request, this.operation(id), async (context, actor) => {
      const row = await this.get(context, id);
      const version = row.currentVersion;
      if (row.revision.toString() !== input.expectedRevision) throw conflict('REVISION_CONFLICT');
      if (version.id !== target || version.state !== (action === 'submit' ? 'DRAFT' : 'SUBMITTED'))
        throw conflict('BASIS_CHANGED');
      if (
        action === 'withdraw' &&
        version.preparedBy !== actor &&
        !version.editors.some((editor) => editor.accountId === actor)
      )
        throw denied();
      const now = await this.openTime(context, row.seasonId);
      if (action === 'submit') await this.checkTargets(context, row.seasonId, version, now);
      await context.db.regulationChangeVersion.update({
        where: { id: version.id },
        data: {
          state,
          revision: { increment: 1n },
          ...(action === 'submit'
            ? { submittedAt: now }
            : { decidedAt: now, decidedBy: actor, decisionReason: reason }),
        },
      });
      const updated = await this.moveRequest(context, id, version.id, state, now);
      await this.audit.append(context, {
        actor: { kind: 'ACCOUNT', accountId: actor },
        action: `REGULATION_CHANGE_${state}`,
        objectKind: 'RegulationChangeRequest',
        objectId: id,
        seasonId: row.seasonId,
        outcome: 'SUCCESS',
        reason,
        before: { requestId: id, versionId: version.id, state: version.state },
        after: {
          requestId: id,
          versionId: version.id,
          versionNumber: version.versionNumber,
          state,
        },
      });
      return this.ack(updated, version.id);
    });
  }
}
