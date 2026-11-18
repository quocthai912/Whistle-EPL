import { createHash, randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { AuditAction } from '../audit/audit-payload.policy';
import type { AuditWriterService } from '../audit/audit-writer.service';
import type { Prisma } from '../generated/prisma/client';
import {
  assertRevision,
  conflict,
  denied,
  invalid,
  listQuery,
  missing,
  seasonalRoles,
} from '../identity-access/accounts.dto';
import { hasSeasonRole } from '../identity-access/authority.policy';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { ApplicationError } from '../platform/application-error';
import { normalizeMultilineText } from '../platform/business-text';
import { boundedMasterText } from '../platform/master-profile';
import { withPaginationMeta } from '../platform/response-envelope.interceptor';
import {
  MissingLockResource,
  type LockResource,
  type TransactionContext,
} from '../platform/transaction-context';
import { isSeasonClosingReady } from './season-dependencies.service';
import type { SeasonDependenciesPort } from './season-dependencies.port';
import type {
  EditSeasonLifecycleDto,
  PrepareSeasonLifecycleDto,
  TransitionSeasonLifecycleDto,
} from './season-lifecycle.dto';

const versionInclude = {
  preparer: { select: { fullName: true } },
  editors: { select: { accountId: true, account: { select: { fullName: true } } } },
  summaryVersion: { select: { versionNumber: true } },
} satisfies Prisma.SeasonLifecycleVersionInclude;
type Version = Prisma.SeasonLifecycleVersionGetPayload<{ include: typeof versionInclude }>;
const decisionActions = { withdraw: 'WITHDRAWN', return: 'RETURNED', reject: 'REJECTED' } as const;
const editableStates = ['DRAFT', 'RETURNED', 'WITHDRAWN'];

function reasonText(reason: string) {
  return boundedMasterText(normalizeMultilineText(reason), 2000);
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => JSON.stringify(key) + ':' + canonical(item))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}

function participated(version: Version, accountId: string) {
  return (
    version.preparedBy === accountId ||
    version.editors.some((editor) => editor.accountId === accountId)
  );
}

function exactSeasonState(state: string, action: string) {
  if (state !== (action === 'CLOSE' ? 'OPEN' : 'CLOSED')) throw conflict();
}

async function requireManager(context: TransactionContext, accountId: string, seasonId: string) {
  if (!(await hasSeasonRole(context.db, accountId, ['SEASON_MANAGER'], seasonId))) throw denied();
}

function auditSummary(
  version: { id: string; versionNumber: number; action: string; state: string },
  id: string,
) {
  return {
    requestId: id,
    versionId: version.id,
    versionNumber: version.versionNumber,
    action: version.action,
    state: version.state,
  };
}

export class SeasonLifecycleService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly dependencies: SeasonDependenciesPort,
    private readonly audit: AuditWriterService,
  ) {}

  private async discoverReadiness(
    db: Prisma.TransactionClient,
    seasonId: string,
  ): Promise<LockResource[]> {
    const summary = await db.seasonSummaryCase.findUnique({
      where: { seasonId },
      select: { id: true, currentConfirmedVersionId: true },
    });
    if (!summary) return [];
    const source = await this.dependencies.discover('seasonClosingReadiness', db, { seasonId });
    return [
      { kind: 'seasonSummaryCase', key: summary.id, mode: 'shared' },
      ...(summary.currentConfirmedVersionId
        ? [
            {
              kind: 'seasonSummaryVersion' as const,
              key: summary.currentConfirmedVersionId,
              mode: 'shared' as const,
            },
          ]
        : []),
      ...source.locks,
    ];
  }

  private async readiness(context: TransactionContext, seasonId: string, ignoreRequest?: string) {
    const { db } = context;
    const season = await db.season.findUniqueOrThrow({
      where: { id: seasonId },
      select: { statisticsRevision: true },
    });
    const current = await db.seasonSummaryCase.findUnique({
      where: { seasonId },
      include: { currentConfirmedVersion: true },
    });
    const summary = current?.currentConfirmedVersion;
    if (
      !current ||
      !summary ||
      summary.seasonId !== seasonId ||
      summary.state !== 'CONFIRMED' ||
      current.needsReconfirmation ||
      summary.basisStatisticsRevision !== season.statisticsRevision ||
      summary.sourceSnapshot === null
    )
      return { state: 'SUMMARY_REQUIRED' } as const;

    const result = await this.dependencies.read('seasonClosingReadiness', context, { seasonId });
    if (result.status !== 'KNOWN') return { state: 'READINESS_UNAVAILABLE' } as const;
    const { facts, basis } = result;
    if (
      facts.summary.caseId !== current.id ||
      facts.summary.currentConfirmedVersionId !== summary.id ||
      facts.summary.currentStatisticsRevision !== season.statisticsRevision.toString() ||
      facts.summary.basisStatisticsRevision !== summary.basisStatisticsRevision?.toString() ||
      canonical(facts.summary.sourceSnapshot) !== canonical(summary.sourceSnapshot)
    )
      return { state: 'SUMMARY_REQUIRED' } as const;

    const now = await context.now();
    const narrowed = {
      ...result,
      facts: {
        ...facts,
        unresolvedRequests: facts.unresolvedRequests.filter(
          (item) => item.kind !== 'LIFECYCLE' || item.id !== ignoreRequest,
        ),
      },
    };
    const [native] = await db.$queryRaw<Array<{ pending: boolean; waiting: boolean }>>`
      SELECT (
        EXISTS (SELECT 1 FROM season_lifecycle_version
          WHERE season_id=${seasonId}::uuid AND state='SUBMITTED'
            AND case_id IS DISTINCT FROM ${ignoreRequest ?? null}::uuid)
        OR EXISTS (SELECT 1 FROM regulation_version WHERE season_id=${seasonId}::uuid AND state='SUBMITTED')
        OR EXISTS (SELECT 1 FROM regulation_change_request WHERE season_id=${seasonId}::uuid AND state='SUBMITTED')
        OR EXISTS (SELECT 1 FROM season_summary_version WHERE season_id=${seasonId}::uuid AND state='SUBMITTED')
      ) AS pending, EXISTS (SELECT 1 FROM regulation_version
        WHERE season_id=${seasonId}::uuid AND state='APPROVED_WAITING') AS waiting
    `;
    const blockers = [
      ...(native.pending || narrowed.facts.unresolvedRequests.length ? ['PENDING_REQUESTS'] : []),
      ...(native.waiting || facts.waitingEffects.length ? ['WAITING_EFFECTS'] : []),
      ...(facts.playingIntervals.some(
        (interval) =>
          interval.playingEnd === null || Date.parse(interval.playingEnd) > now.getTime(),
      )
        ? ['PLAYING_INTERVALS']
        : []),
      ...(facts.unresolvedFuturePlans.length ? ['FUTURE_PLANS'] : []),
    ];
    if (blockers.length || !isSeasonClosingReady(narrowed, now))
      return { state: 'READINESS_BLOCKED', blockers } as const;

    const readinessBasis = createHash('sha256')
      .update(
        canonical({
          summary: summary.id,
          summaryRevision: summary.revision.toString(),
          statisticsRevision: season.statisticsRevision.toString(),
          snapshot: summary.sourceSnapshot,
          sourceRevision: basis.sourceRevision,
          references: basis.references
            .filter((id) => id !== ignoreRequest)
            .slice()
            .sort(),
          playingIntervals: [...facts.playingIntervals].sort((left, right) =>
            left.registrationId.localeCompare(right.registrationId),
          ),
        }),
      )
      .digest('hex');
    return { state: 'READY', summaryVersionId: summary.id, readinessBasis } as const;
  }

  private operation(id: string, withReadiness = false) {
    return {
      locks: [{ kind: 'seasonLifecycleRequest' as const, key: id, mode: 'exclusive' as const }],
      discover: async (db: Prisma.TransactionClient): Promise<LockResource[]> => {
        const row = await db.seasonLifecycleRequest.findUnique({
          where: { id },
          select: { seasonId: true, currentVersion: { select: { id: true, action: true } } },
        });
        if (!row) return [];
        return [
          { kind: 'season', key: row.seasonId, mode: 'exclusive' },
          ...(row.currentVersion
            ? [
                {
                  kind: 'seasonLifecycleVersion' as const,
                  key: row.currentVersion.id,
                  mode: 'exclusive' as const,
                },
              ]
            : []),
          ...(withReadiness && row.currentVersion?.action === 'CLOSE'
            ? await this.discoverReadiness(db, row.seasonId)
            : []),
        ];
      },
      authorize: async (context: TransactionContext, accountId: string) => {
        const row = await context.db.seasonLifecycleRequest.findUnique({
          where: { id },
          select: { seasonId: true },
        });
        if (!row) throw missing();
        await requireManager(context, accountId, row.seasonId);
      },
    };
  }

  private async target(context: TransactionContext, id: string) {
    const row = await context.db.seasonLifecycleRequest.findUnique({
      where: { id },
      include: { season: { select: { state: true } }, currentVersion: { include: versionInclude } },
    });
    if (!row?.currentVersion) throw missing();
    return { ...row, version: row.currentVersion };
  }

  async list(request: Request, seasonId: string, query: Record<string, unknown>) {
    const { page, pageSize, skip, take, values } = listQuery(
      query,
      ['state', 'action'],
      ['createdAt:desc'],
    );
    if (
      (values.state &&
        !['DRAFT', 'SUBMITTED', 'RETURNED', 'WITHDRAWN', 'REJECTED', 'APPROVED'].includes(
          values.state,
        )) ||
      (values.action && !['CLOSE', 'REOPEN'].includes(values.action))
    )
      throw invalid();
    try {
      return await this.execution.read(
        request,
        {
          locks: [{ kind: 'season', key: seasonId, mode: 'shared' }],
          discover: (db) => this.discoverReadiness(db, seasonId),
          authorize: async (context, accountId) => {
            if (!(await hasSeasonRole(context.db, accountId, [...seasonalRoles], seasonId)))
              throw missing();
          },
        },
        async (context, accountId) => {
          const { db } = context;
          const season = await db.season.findUniqueOrThrow({
            where: { id: seasonId },
            select: { state: true },
          });
          const manager = await hasSeasonRole(db, accountId, ['SEASON_MANAGER'], seasonId);
          const readiness =
            season.state === 'OPEN' ? (await this.readiness(context, seasonId)).state : null;
          const where = {
            seasonId,
            currentVersionId: { not: null },
            ...(values.action || values.state
              ? {
                  currentVersion: {
                    ...(values.action ? { action: values.action } : {}),
                    ...(values.state ? { state: values.state } : {}),
                  },
                }
              : {}),
          };
          const [total, rows] = await Promise.all([
            db.seasonLifecycleRequest.count({ where }),
            db.seasonLifecycleRequest.findMany({
              where,
              orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
              skip,
              take,
              include: { currentVersion: { include: versionInclude } },
            }),
          ]);
          const items = rows.flatMap(({ id, revision, currentVersion: version }) => {
            if (!version) return [];
            const author = participated(version, accountId);
            return [
              {
                id,
                revision: revision.toString(),
                ...auditSummary(version, id),
                preparerName: version.preparer.fullName,
                editors: version.editors.map(({ account }) => account.fullName),
                reason: version.reason,
                submittedAt: version.submittedAt,
                decidedAt: version.decidedAt,
                decisionReason: version.decisionReason,
                summaryVersionId: version.summaryVersionId,
                summaryVersionNumber: version.summaryVersion?.versionNumber ?? null,
                capabilities: {
                  canEdit:
                    manager &&
                    editableStates.includes(version.state) &&
                    (version.state === 'DRAFT' || author),
                  canSubmit: manager && author && version.state === 'DRAFT',
                  canWithdraw: manager && author && version.state === 'SUBMITTED',
                  canReview: manager && !author && version.state === 'SUBMITTED',
                },
              },
            ];
          });
          return withPaginationMeta(
            { items, seasonState: season.state, readiness, canPrepare: manager },
            { page, pageSize, total },
          );
        },
      );
    } catch (error) {
      this.handleMissing(error);
    }
  }

  async detail(request: Request, id: string, query: Record<string, unknown>) {
    const { page, pageSize, skip, take } = listQuery(query, [], ['versionNumber:desc']);
    try {
      return await this.execution.read(
        request,
        {
          locks: [{ kind: 'seasonLifecycleRequest', key: id, mode: 'shared' }],
          discover: async (db) => {
            const row = await db.seasonLifecycleRequest.findUnique({
              where: { id },
              select: { seasonId: true },
            });
            if (!row) return [];
            return [
              { kind: 'season', key: row.seasonId, mode: 'shared' },
              ...(await this.discoverReadiness(db, row.seasonId)),
            ];
          },
          authorize: async (context, accountId) => {
            const row = await context.db.seasonLifecycleRequest.findUnique({
              where: { id },
              select: { seasonId: true },
            });
            if (
              !row ||
              !(await hasSeasonRole(context.db, accountId, [...seasonalRoles], row.seasonId))
            )
              throw missing();
          },
        },
        async (context) => {
          const row = await this.target(context, id);
          const readiness =
            row.season.state === 'OPEN' &&
            row.version.action === 'CLOSE' &&
            ['DRAFT', 'SUBMITTED'].includes(row.version.state)
              ? await this.readiness(context, row.seasonId, id)
              : null;
          const where = { caseId: id };
          const total = await context.db.seasonLifecycleVersion.count({ where });
          const versions = await context.db.seasonLifecycleVersion.findMany({
            where,
            skip,
            take,
            orderBy: { versionNumber: 'desc' },
            include: versionInclude,
          });
          return withPaginationMeta(
            {
              readiness: readiness?.state ?? null,
              blockers: readiness?.state === 'READINESS_BLOCKED' ? readiness.blockers : [],
              items: versions.map((version) => ({
                ...auditSummary(version, id),
                reason: version.reason,
                decisionReason: version.decisionReason,
                preparerName: version.preparer.fullName,
                editors: version.editors.map(({ account }) => account.fullName),
                submittedAt: version.submittedAt,
                decidedAt: version.decidedAt,
                summaryVersionNumber: version.summaryVersion?.versionNumber ?? null,
              })),
            },
            { page, pageSize, total },
          );
        },
      );
    } catch (error) {
      this.handleMissing(error);
    }
  }

  async create(request: Request, seasonId: string, input: PrepareSeasonLifecycleDto) {
    const reason = reasonText(input.reason);
    try {
      return await this.execution.execute(
        request,
        {
          locks: [{ kind: 'season', key: seasonId, mode: 'exclusive' }],
          authorize: (context, accountId) => requireManager(context, accountId, seasonId),
        },
        async (context, accountId) => {
          const { db } = context;
          const season = await db.season.findUniqueOrThrow({ where: { id: seasonId } });
          exactSeasonState(season.state, input.action);
          const now = await context.now();
          const id = randomUUID();
          await db.seasonLifecycleRequest.create({
            data: { id, seasonId, createdAt: now, updatedAt: now },
          });
          const version = await db.seasonLifecycleVersion.create({
            data: {
              id: randomUUID(),
              seasonId,
              caseId: id,
              versionNumber: 1,
              action: input.action,
              reason,
              preparedBy: accountId,
              createdAt: now,
            },
          });
          await db.seasonLifecycleRequest.update({
            where: { id },
            data: { currentVersionId: version.id },
          });
          await this.auditLifecycle(
            context,
            accountId,
            seasonId,
            id,
            'SEASON_LIFECYCLE_DRAFT_CREATED',
            reason,
            auditSummary(version, id),
          );
          return { id, revision: '1', relatedId: version.id };
        },
      );
    } catch (error) {
      this.handleMissing(error);
    }
  }

  async edit(request: Request, id: string, input: EditSeasonLifecycleDto) {
    const reason = reasonText(input.reason);
    try {
      return await this.execution.execute(
        request,
        this.operation(id),
        async (context, accountId) => {
          const row = await this.target(context, id);
          const { version, seasonId } = row;
          assertRevision(row.revision, input.expectedRevision);
          exactSeasonState(row.season.state, input.action);
          if (!editableStates.includes(version.state)) throw conflict();
          if (version.state !== 'DRAFT' && !participated(version, accountId)) throw denied();
          const now = await context.now();
          const changed =
            version.state !== 'DRAFT'
              ? await context.db.seasonLifecycleVersion.create({
                  data: {
                    id: randomUUID(),
                    seasonId,
                    caseId: id,
                    versionNumber: version.versionNumber + 1,
                    predecessorVersionId: version.id,
                    preparedBy: accountId,
                    action: input.action,
                    reason,
                    createdAt: now,
                  },
                })
              : await context.db.seasonLifecycleVersion.update({
                  where: { id: version.id },
                  data: { action: input.action, reason, revision: { increment: 1 } },
                });
          await context.db.seasonLifecycleVersionEditor.createMany({
            data: [
              ...new Set([
                accountId,
                version.preparedBy,
                ...version.editors.map((editor) => editor.accountId),
              ]),
            ]
              .filter(
                (editor) =>
                  changed.id !== version.id ||
                  !version.editors.some((entry) => entry.accountId === editor),
              )
              .filter((editor) => changed.id === version.id || editor !== accountId)
              .map((editor) => ({ accountId: editor, versionId: changed.id, firstEditedAt: now })),
            skipDuplicates: true,
          });
          const ack = await this.moveRequest(context, id, changed.id, now);
          await this.auditLifecycle(
            context,
            accountId,
            seasonId,
            id,
            'SEASON_LIFECYCLE_DRAFT_UPDATED',
            reason,
            auditSummary(changed, id),
            auditSummary(version, id),
          );
          return ack;
        },
      );
    } catch (error) {
      this.handleMissing(error);
    }
  }

  private async moveRequest(context: TransactionContext, id: string, versionId: string, now: Date) {
    const saved = await context.db.seasonLifecycleRequest.update({
      where: { id },
      data: { currentVersionId: versionId, revision: { increment: 1 }, updatedAt: now },
    });
    return { id, revision: saved.revision.toString(), relatedId: versionId };
  }

  async transition(
    request: Request,
    id: string,
    action: string,
    input: TransitionSeasonLifecycleDto,
  ) {
    const reason = reasonText(input.reason);
    const versionId = input.submittedVersionId.toLowerCase();
    if (action === 'approve')
      return this.approve(request, id, versionId, input.expectedRevision, reason);
    if (!(action === 'submit' || Object.hasOwn(decisionActions, action))) throw invalid();
    try {
      return await this.execution.execute(
        request,
        this.operation(id, action === 'submit'),
        async (context, accountId) => {
          const row = await this.target(context, id);
          const { version, seasonId } = row;
          assertRevision(row.revision, input.expectedRevision);
          if (version.id !== versionId) throw conflict('BASIS_CHANGED');
          const author = participated(version, accountId);
          if (action === 'submit') {
            if (!author) throw denied();
            if (version.state !== 'DRAFT') throw conflict();
            exactSeasonState(row.season.state, version.action);
            const readiness =
              version.action === 'CLOSE' ? await this.readiness(context, seasonId, id) : null;
            if (readiness?.state === 'READINESS_UNAVAILABLE')
              throw new ApplicationError(
                503,
                'LIFECYCLE_READINESS_UNAVAILABLE',
                'Chưa thể xác minh điều kiện đóng mùa giải.',
              );
            if (readiness && readiness.state !== 'READY')
              throw conflict(
                'STATE_CONFLICT',
                readiness.state === 'SUMMARY_REQUIRED'
                  ? 'Cần bản tổng kết đã xác nhận và còn hiệu lực.'
                  : 'Mùa giải còn nghiệp vụ chưa hoàn tất.',
              );
            const now = await context.now();
            const saved = await context.db.seasonLifecycleVersion.update({
              where: { id: version.id },
              data: {
                state: 'SUBMITTED',
                submittedAt: now,
                revision: { increment: 1 },
                summaryVersionId: readiness?.summaryVersionId ?? null,
                readinessBasis: readiness?.readinessBasis ?? null,
              },
            });
            const ack = await this.moveRequest(context, id, version.id, now);
            await this.auditLifecycle(
              context,
              accountId,
              seasonId,
              id,
              'SEASON_LIFECYCLE_SUBMITTED',
              reason,
              { ...auditSummary(saved, id), summaryVersionId: saved.summaryVersionId },
              auditSummary(version, id),
            );
            return ack;
          }
          if (version.state !== 'SUBMITTED') throw conflict();
          if (author !== (action === 'withdraw')) throw denied();
          const now = await context.now();
          const state = decisionActions[action as keyof typeof decisionActions];
          const saved = await context.db.seasonLifecycleVersion.update({
            where: { id: version.id },
            data: {
              state,
              decidedAt: now,
              decidedBy: accountId,
              decisionReason: reason,
              revision: { increment: 1 },
            },
          });
          const ack = await this.moveRequest(context, id, version.id, now);
          await this.auditLifecycle(
            context,
            accountId,
            seasonId,
            id,
            `SEASON_LIFECYCLE_${state}`,
            reason,
            auditSummary(saved, id),
            auditSummary(version, id),
          );
          return ack;
        },
      );
    } catch (error) {
      this.handleMissing(error);
    }
  }

  private async approve(
    request: Request,
    id: string,
    versionId: string,
    expectedRevision: string,
    reason: string,
  ) {
    try {
      const result = await this.execution.executeCritical(
        request,
        this.operation(id, true),
        async (context) => {
          const selected = await context.db.seasonLifecycleVersion.findFirst({
            where: { id: versionId, caseId: id },
          });
          if (!selected || (selected.action === 'CLOSE' && !selected.readinessBasis))
            throw conflict('BASIS_CHANGED');
          return {
            action: 'SEASON_LIFECYCLE_APPROVED',
            targetId: id,
            payload: {
              expectedRevision,
              submittedVersionId: versionId,
              action: selected.action,
              reason,
              ...(selected.readinessBasis
                ? { readinessBasisReference: selected.readinessBasis }
                : {}),
            },
          };
        },
        async (context, command) => {
          const row = await this.target(context, id);
          const { version, seasonId } = row;
          assertRevision(row.revision, expectedRevision);
          if (version.id !== versionId || version.state !== 'SUBMITTED')
            throw conflict('BASIS_CHANGED');
          if (participated(version, command.accountId)) throw denied();
          exactSeasonState(row.season.state, version.action);
          if (version.action === 'CLOSE') {
            const readiness = await this.readiness(context, seasonId, id);
            if (
              readiness.state !== 'READY' ||
              readiness.readinessBasis !== version.readinessBasis ||
              readiness.summaryVersionId !== version.summaryVersionId
            )
              throw conflict('BASIS_CHANGED');
          }
          const now = await context.now();
          const saved = await context.db.seasonLifecycleVersion.update({
            where: { id: version.id },
            data: {
              state: 'APPROVED',
              decidedAt: now,
              decidedBy: command.accountId,
              decisionReason: reason,
              revision: { increment: 1 },
            },
          });
          const ack = await this.moveRequest(context, id, version.id, now);
          await context.db.season.update({
            where: { id: seasonId },
            data: {
              state: version.action === 'CLOSE' ? 'CLOSED' : 'OPEN',
              revision: { increment: 1 },
              updatedAt: now,
            },
          });
          await this.auditLifecycle(
            context,
            command.accountId,
            seasonId,
            id,
            'SEASON_LIFECYCLE_APPROVED',
            reason,
            {
              ...auditSummary(saved, id),
              summaryVersionId: version.summaryVersionId,
              approvedAt: now.toISOString(),
            },
            auditSummary(version, id),
          );
          return { status: 200, data: ack };
        },
        async (_context, outcome) => outcome,
      );
      return result.data;
    } catch (error) {
      this.handleMissing(error);
    }
  }

  private auditLifecycle(
    context: TransactionContext,
    accountId: string,
    seasonId: string,
    id: string,
    action: AuditAction,
    reason: string,
    after: unknown,
    before?: unknown,
  ) {
    return this.audit.append(context, {
      actor: { kind: 'ACCOUNT', accountId },
      action,
      objectKind: 'SeasonLifecycleRequest',
      objectId: id,
      seasonId,
      reason,
      outcome: 'SUCCESS',
      before,
      after,
    });
  }

  private handleMissing(error: unknown): never {
    if (error instanceof MissingLockResource) throw missing();
    throw error;
  }
}
