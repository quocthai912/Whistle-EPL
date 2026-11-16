import {
  loadRegulationContent,
  projectRegulationContent,
  regulationContentRelations,
} from './regulation-content';
import type { Request } from 'express';
import { Prisma } from '../generated/prisma/client';
import type {
  BusinessHistoryService,
  BusinessHistoryScope,
} from '../audit/business-history.service';
import { AuditWriterService } from '../audit/audit-writer.service';
import {
  businessText,
  denied,
  conflict,
  invalid,
  listQuery,
  missing,
} from '../identity-access/accounts.dto';
import { delegationRoles } from '../identity-access/authority.policy';
import type { RegulationDecisionService } from './regulation-decision.service';
import type { RegulationActivationService } from './regulation-activation.service';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { withPaginationMeta } from '../platform/response-envelope.interceptor';
import {
  MissingLockResource,
  type LockResource,
  type TransactionContext,
} from '../platform/transaction-context';
import type {
  CreateRegulationDraftDto,
  RegulationVersionActionDto,
  UpdateRegulationDraftDto,
} from './regulation.dto';
import {
  validateCompleteRegulationContent,
  validateDraftContent,
  type RegulationDraftContent,
} from './regulation-validation';

const states = [
  'DRAFT',
  'SUBMITTED',
  'RETURNED',
  'WITHDRAWN',
  'REJECTED',
  'APPROVED_WAITING',
  'EFFECTIVE',
  'SUPERSEDED',
  'CANCELLED',
  'ACTIVATION_BLOCKED',
] as const;
const overviewVersionSelection = {
  id: true,
  versionNumber: true,
  state: true,
  effectiveMode: true,
  proposedEffectiveAt: true,
  approvedAt: true,
  activeFrom: true,
  activeUntil: true,
} satisfies Prisma.RegulationVersionSelect;
type RegulationVersionOverviewRow = Prisma.RegulationVersionGetPayload<{
  select: typeof overviewVersionSelection;
}>;
const versionDetailRelations = {
  season: { select: { id: true, state: true, currentRegulationVersionId: true } },
  regulationCase: { select: { currentDraftVersionId: true } },
  preparer: { select: { id: true, fullName: true } },
  decider: { select: { id: true, fullName: true } },
  editors: {
    select: { accountId: true, firstEditedAt: true, account: { select: { fullName: true } } },
    orderBy: [{ firstEditedAt: 'asc' }, { accountId: 'asc' }],
  },
  successors: { select: { id: true }, take: 1 },
  ...regulationContentRelations,
} satisfies Prisma.RegulationVersionInclude;
const sorts = ['versionNumber:desc', 'versionNumber:asc', 'createdAt:desc', 'createdAt:asc'];
const lifecycleActions = ['submit', 'withdraw', 'return', 'reject'] as const;
type LifecycleAction = (typeof lifecycleActions)[number];
const versionLock = (key: string, mode: LockResource['mode']): LockResource => ({
  kind: 'regulationVersion',
  key,
  mode,
});
const caseLock = (key: string, mode: LockResource['mode']): LockResource => ({
  kind: 'regulationCase',
  key,
  mode,
});
const seasonLock = (key: string, mode: LockResource['mode']): LockResource => ({
  kind: 'season',
  key,
  mode,
});

type PreparationContext = Pick<TransactionContext, 'db' | 'now'>;

function instant(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function projectOverview(version: RegulationVersionOverviewRow | null) {
  if (!version) return null;
  return {
    id: version.id,
    versionNumber: version.versionNumber,
    state: version.state,
    effectiveMode: version.effectiveMode,
    proposedEffectiveAt: instant(version.proposedEffectiveAt),
    approvedAt: instant(version.approvedAt),
    activeFrom: instant(version.activeFrom),
    activeUntil: instant(version.activeUntil),
  };
}

function databaseDate(value: string | null | undefined): Date | null | undefined {
  if (value === undefined || value === null) return value;
  return new Date(`${value}T00:00:00.000Z`);
}

function databaseInstant(value: string | null | undefined): Date | null | undefined {
  if (value === undefined || value === null) return value;
  return new Date(value);
}

function isMissingLock(error: unknown, kind: LockResource['kind'], key: string): boolean {
  return (
    error instanceof MissingLockResource &&
    error.kind === kind &&
    error.key.toLowerCase() === key.toLowerCase()
  );
}

function toContent(input: Record<string, unknown>): RegulationDraftContent {
  const content = { ...input };
  delete content.expectedRevision;
  delete content.predecessorVersionId;
  return content as RegulationDraftContent;
}

function scalarCreateData(
  content: RegulationDraftContent,
): Partial<Prisma.RegulationVersionUncheckedCreateInput> {
  const data: Partial<Prisma.RegulationVersionUncheckedCreateInput> = {};
  if (Object.hasOwn(content, 'effectiveMode')) data.effectiveMode = content.effectiveMode;
  if (Object.hasOwn(content, 'proposedEffectiveAt'))
    data.proposedEffectiveAt = databaseInstant(content.proposedEffectiveAt);
  if (Object.hasOwn(content, 'squadLimit')) data.squadLimit = content.squadLimit;
  if (Object.hasOwn(content, 'nonHomegrownLimit'))
    data.nonHomegrownLimit = content.nonHomegrownLimit;
  if (Object.hasOwn(content, 'homegrownSeasons')) data.homegrownSeasons = content.homegrownSeasons;
  if (Object.hasOwn(content, 'homegrownMonths')) data.homegrownMonths = content.homegrownMonths;
  if (Object.hasOwn(content, 'homegrownAgeStart'))
    data.homegrownAgeStart = content.homegrownAgeStart;
  if (Object.hasOwn(content, 'homegrownAgeEnd')) data.homegrownAgeEnd = content.homegrownAgeEnd;
  if (Object.hasOwn(content, 'u21Cutoff')) data.u21Cutoff = databaseDate(content.u21Cutoff);
  if (Object.hasOwn(content, 'clubCount')) data.clubCount = content.clubCount;
  if (Object.hasOwn(content, 'formatCode')) data.formatCode = content.formatCode;
  if (Object.hasOwn(content, 'legs')) data.legs = content.legs;
  if (Object.hasOwn(content, 'plannedMinutes')) data.plannedMinutes = content.plannedMinutes;
  if (Object.hasOwn(content, 'preparationMinutes'))
    data.preparationMinutes = content.preparationMinutes;
  if (Object.hasOwn(content, 'releaseMinutes')) data.releaseMinutes = content.releaseMinutes;
  if (Object.hasOwn(content, 'winPoints')) data.winPoints = content.winPoints;
  if (Object.hasOwn(content, 'drawPoints')) data.drawPoints = content.drawPoints;
  if (Object.hasOwn(content, 'lossPoints')) data.lossPoints = content.lossPoints;
  if (Object.hasOwn(content, 'qualificationCount'))
    data.qualificationCount = content.qualificationCount;
  if (Object.hasOwn(content, 'relegationCount')) data.relegationCount = content.relegationCount;
  return data;
}

function scalarUpdateData(
  content: RegulationDraftContent,
): Prisma.RegulationVersionUncheckedUpdateInput {
  const data: Prisma.RegulationVersionUncheckedUpdateInput = {};
  Object.assign(data, scalarCreateData(content));
  data.revision = { increment: 1n };
  return data;
}

async function replaceChildren(
  context: TransactionContext,
  versionId: string,
  content: RegulationDraftContent,
): Promise<void> {
  if (content.registrationWindows !== undefined) {
    await context.db.registrationWindow.deleteMany({ where: { regulationVersionId: versionId } });
    if (content.registrationWindows.length)
      await context.db.registrationWindow.createMany({
        data: content.registrationWindows.map((window) => ({
          regulationVersionId: versionId,
          intakeKind: window.intakeKind,
          opensAt: new Date(window.opensAt),
          closesAt: new Date(window.closesAt),
        })),
      });
  }
  if (content.rankingPriority !== undefined) {
    await context.db.rankingPriority.deleteMany({ where: { versionId } });
    if (content.rankingPriority.length)
      await context.db.rankingPriority.createMany({
        data: content.rankingPriority.map((entry) => ({
          versionId,
          position: entry.position,
          criterionCode: entry.criterionCode,
        })),
      });
  }
  if (content.goalTypes !== undefined) {
    await context.db.goalType.deleteMany({ where: { regulationVersionId: versionId } });
    if (content.goalTypes.length)
      await context.db.goalType.createMany({
        data: content.goalTypes.map((entry) => ({ regulationVersionId: versionId, ...entry })),
      });
  }
  if (content.cardTypes !== undefined) {
    await context.db.cardType.deleteMany({ where: { regulationVersionId: versionId } });
    if (content.cardTypes.length)
      await context.db.cardType.createMany({
        data: content.cardTypes.map((entry) => ({ regulationVersionId: versionId, ...entry })),
      });
  }
}

/** Owns the initial typed-draft read/write seam; submit and decision actions belong to T011/T012. */
export class RegulationsService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly audit: AuditWriterService,
    private readonly businessHistory: BusinessHistoryService,
    private readonly decisions: RegulationDecisionService,
    private readonly activation: RegulationActivationService,
  ) {}

  async seasons(request: Request) {
    return this.execution.read(
      request,
      { locks: [], authorize: async () => undefined },
      async (context, accountId) => ({
        items: await context.db.season.findMany({
          where: this.preparationSeasonFilter(accountId, await context.now()),
          select: { id: true, code: true, name: true, state: true },
          orderBy: [{ startDate: 'desc' }, { code: 'asc' }],
        }),
      }),
    );
  }

  async list(request: Request, seasonId: string, query: Record<string, unknown>) {
    try {
      return await this.execution.read(
        request,
        {
          locks: [seasonLock(seasonId, 'shared')],
          discover: async (db) => {
            const regulationCase = await db.regulationCase.findUnique({
              where: { seasonId },
              select: { id: true },
            });
            return regulationCase ? [caseLock(regulationCase.id, 'shared')] : [];
          },
          authorize: async (context, accountId) => {
            const season = await context.db.season.findUnique({
              where: { id: seasonId },
              select: { id: true },
            });
            if (!season) throw missing();
            await this.requirePreparationAccess(
              context,
              accountId,
              seasonId,
              await context.now(),
              true,
            );
          },
        },
        async (context, accountId) => {
          const { values, page, pageSize, sort, skip, take } = listQuery(query, ['state'], sorts);
          if (
            values.state !== undefined &&
            !states.includes(values.state as (typeof states)[number])
          )
            throw invalid();
          const ascending = sort.endsWith(':asc');
          const orderBy: Prisma.RegulationVersionOrderByWithRelationInput[] = sort.startsWith(
            'createdAt:',
          )
            ? [{ createdAt: ascending ? 'asc' : 'desc' }, { id: 'asc' }]
            : [{ versionNumber: ascending ? 'asc' : 'desc' }, { id: 'asc' }];
          const season = await context.db.season.findUniqueOrThrow({
            where: { id: seasonId },
            select: { id: true, state: true, currentRegulationVersionId: true },
          });
          await this.activation.requireResolvedBasis(context, seasonId);
          const regulationCase = await context.db.regulationCase.findUnique({
            where: { seasonId },
            select: { id: true, currentDraftVersionId: true },
          });
          const currentEffective = season.currentRegulationVersionId
            ? await context.db.regulationVersion.findUnique({
                where: { id: season.currentRegulationVersionId },
                select: overviewVersionSelection,
              })
            : null;
          const prepAllowed = await this.hasPreparationAuthority(
            context,
            accountId,
            seasonId,
            await context.now(),
          );
          const managerAllowed = await this.hasManagerAuthority(context, accountId, seasonId);
          if (!regulationCase)
            return withPaginationMeta(
              {
                items: [],
                overview: { currentEffective: projectOverview(currentEffective), waiting: null },
                capabilities: {
                  canCreateDraft: prepAllowed && season.state === 'OPEN',
                  canManageChanges: managerAllowed && season.state === 'OPEN',
                },
              },
              { page, pageSize, total: 0 },
            );

          const waiting = await context.db.regulationVersion.findFirst({
            where: { seasonId, caseId: regulationCase.id, state: 'APPROVED_WAITING' },
            orderBy: { versionNumber: 'desc' },
            select: overviewVersionSelection,
          });

          const where: Prisma.RegulationVersionWhereInput = {
            seasonId,
            caseId: regulationCase.id,
            ...(values.state ? { state: values.state } : {}),
          };
          const total = await context.db.regulationVersion.count({ where });
          const versions = await context.db.regulationVersion.findMany({
            where,
            skip,
            take,
            orderBy,
            select: {
              id: true,
              versionNumber: true,
              revision: true,
              state: true,
              predecessorVersionId: true,
              effectiveMode: true,
              proposedEffectiveAt: true,
              approvedAt: true,
              activationProcessedAt: true,
              activeFrom: true,
              activeUntil: true,
              createdAt: true,
              submittedAt: true,
              decidedAt: true,
              preparedBy: true,
              preparer: { select: { id: true, fullName: true } },
              editors: { select: { accountId: true } },
              successors: { select: { id: true }, take: 1 },
            },
          });
          return withPaginationMeta(
            {
              items: versions.map((version) => ({
                id: version.id,
                versionNumber: version.versionNumber,
                revision: version.revision.toString(),
                state: version.state,
                predecessorVersionId: version.predecessorVersionId,
                effectiveMode: version.effectiveMode,
                proposedEffectiveAt: instant(version.proposedEffectiveAt),
                approvedAt: instant(version.approvedAt),
                activationProcessedAt: instant(version.activationProcessedAt),
                activeFrom: instant(version.activeFrom),
                activeUntil: instant(version.activeUntil),
                createdAt: version.createdAt.toISOString(),
                submittedAt: instant(version.submittedAt),
                decidedAt: instant(version.decidedAt),
                preparedBy: version.preparer,
                isCurrentEffective: season.currentRegulationVersionId === version.id,
                isCurrentDraft: regulationCase.currentDraftVersionId === version.id,
                capabilities: this.actionCapabilities({
                  accountId,
                  seasonState: season.state,
                  versionId: version.id,
                  state: version.state,
                  preparedBy: version.preparedBy,
                  editors: version.editors.map(({ accountId: editorId }) => editorId),
                  successorExists: version.successors.length > 0,
                  currentDraftVersionId: regulationCase.currentDraftVersionId,
                  prepAllowed,
                  managerAllowed,
                }),
              })),
              overview: {
                currentEffective: projectOverview(currentEffective),
                waiting: projectOverview(waiting),
              },
              capabilities: {
                canManageChanges: managerAllowed && season.state === 'OPEN',
                canCreateDraft:
                  prepAllowed &&
                  season.state === 'OPEN' &&
                  regulationCase.currentDraftVersionId === null,
              },
            },
            { page, pageSize, total },
          );
        },
      );
    } catch (error) {
      if (isMissingLock(error, 'season', seasonId)) throw missing();
      throw error;
    }
  }

  async detail(request: Request, versionId: string) {
    const operation = this.versionOperation(versionId, 'shared', false);
    try {
      return await this.execution.read(request, operation, async (context, accountId) => {
        const version = await context.db.regulationVersion.findUnique({
          where: { id: versionId },
          include: versionDetailRelations,
        });
        if (!version) throw missing();
        await this.activation.requireResolvedBasis(context, version.seasonId);
        const now = await context.now();
        const prepAllowed = await this.hasPreparationAuthority(
          context,
          accountId,
          version.seasonId,
          now,
        );
        const managerAllowed = await this.hasManagerAuthority(context, accountId, version.seasonId);
        return this.projectDetail(version, accountId, prepAllowed, managerAllowed);
      });
    } catch (error) {
      if (isMissingLock(error, 'regulationVersion', versionId)) throw missing();
      throw error;
    }
  }

  async createDraft(request: Request, seasonId: string, input: CreateRegulationDraftDto) {
    const { predecessorVersionId, ...rawContent } = input;
    const content = validateDraftContent(rawContent);
    try {
      return await this.execution.execute(
        request,
        {
          locks: [seasonLock(seasonId, 'exclusive')],
          discover: async (db) => {
            const regulationCase = await db.regulationCase.findUnique({
              where: { seasonId },
              select: { id: true },
            });
            return regulationCase ? [caseLock(regulationCase.id, 'exclusive')] : [];
          },
          authorize: async (context, accountId, now) => {
            const season = await context.db.season.findUnique({
              where: { id: seasonId },
              select: { id: true, state: true },
            });
            if (!season) throw missing();
            await this.requirePreparationAccess(context, accountId, seasonId, now, false);
            if (season.state !== 'OPEN') throw conflict('STATE_CONFLICT');
          },
        },
        async (context, accountId) => {
          const season = await context.db.season.findUnique({ where: { id: seasonId } });
          if (!season) throw missing();

          let regulationCase = await context.db.regulationCase.findUnique({ where: { seasonId } });
          if (regulationCase?.currentDraftVersionId) throw conflict('STATE_CONFLICT');
          if (regulationCase) {
            const danglingDraft = await context.db.regulationVersion.findFirst({
              where: { caseId: regulationCase.id, state: 'DRAFT' },
              select: { id: true },
            });
            if (danglingDraft) throw conflict('STATE_CONFLICT');
          }

          let draftContent = content;
          let predecessorEditors: { accountId: string; firstEditedAt: Date }[] = [];
          if (predecessorVersionId && regulationCase) {
            const predecessor = await context.db.regulationVersion.findFirst({
              where: { id: predecessorVersionId, seasonId },
              select: { id: true, caseId: true, state: true },
            });
            if (!predecessor || predecessor.caseId !== regulationCase.id) throw invalid();
            if (!['RETURNED', 'WITHDRAWN'].includes(predecessor.state))
              throw conflict('STATE_CONFLICT');
            const priorSuccessor = await context.db.regulationVersion.findFirst({
              where: { predecessorVersionId: predecessor.id },
              select: { id: true },
            });
            if (priorSuccessor) throw conflict('STATE_CONFLICT');
            predecessorEditors = await context.db.regulationVersionEditor.findMany({
              where: { versionId: predecessor.id },
              select: { accountId: true, firstEditedAt: true },
              orderBy: [{ firstEditedAt: 'asc' }, { accountId: 'asc' }],
            });
            draftContent = validateDraftContent({
              ...(await loadRegulationContent(context, predecessor.id)),
              ...content,
            });
          } else if (predecessorVersionId) {
            throw invalid();
          }

          const latest = regulationCase
            ? await context.db.regulationVersion.findFirst({
                where: { caseId: regulationCase.id },
                orderBy: { versionNumber: 'desc' },
                select: { versionNumber: true },
              })
            : null;
          const versionNumber = (latest?.versionNumber ?? 0) + 1;
          if (season.state !== 'OPEN') throw conflict('STATE_CONFLICT');
          await context.recheckAuthority();
          if (!regulationCase)
            regulationCase = await context.db.regulationCase.create({ data: { seasonId } });

          const version = await context.db.regulationVersion.create({
            data: {
              ...scalarCreateData(draftContent),
              seasonId,
              caseId: regulationCase.id,
              versionNumber,
              preparedBy: accountId,
              predecessorVersionId: predecessorVersionId ?? null,
              state: 'DRAFT',
            },
            select: { id: true, revision: true, createdAt: true },
          });
          const inheritedEditors = predecessorEditors.filter(
            ({ accountId: editorId }) => editorId !== accountId,
          );
          if (inheritedEditors.length)
            await context.db.regulationVersionEditor.createMany({
              data: inheritedEditors.map((editor) => ({ versionId: version.id, ...editor })),
              skipDuplicates: true,
            });
          await replaceChildren(context, version.id, draftContent);
          const now = await context.now();
          await context.db.regulationCase.update({
            where: { id: regulationCase.id },
            data: {
              currentDraftVersionId: version.id,
              revision: { increment: 1n },
              updatedAt: now,
            },
          });
          await this.audit.append(context, {
            actor: { kind: 'ACCOUNT', accountId },
            action: 'REGULATION_DRAFT_CREATED',
            objectKind: 'RegulationVersion',
            objectId: version.id,
            seasonId,
            outcome: 'SUCCESS',
            after: {
              versionId: version.id,
              versionNumber,
              state: 'DRAFT',
              revision: version.revision.toString(),
            },
          });
          return { id: version.id, revision: version.revision.toString() };
        },
      );
    } catch (error) {
      if (isMissingLock(error, 'season', seasonId)) throw missing();
      throw error;
    }
  }

  async updateDraft(request: Request, versionId: string, input: UpdateRegulationDraftDto) {
    const content = validateDraftContent(toContent(input as unknown as Record<string, unknown>));
    if (!Object.keys(content).length) throw invalid();
    try {
      return await this.execution.execute(
        request,
        this.versionOperation(versionId, 'exclusive', true),
        async (context, accountId) => {
          const version = await context.db.regulationVersion.findUnique({
            where: { id: versionId },
            include: {
              season: { select: { id: true, state: true } },
              regulationCase: { select: { id: true, currentDraftVersionId: true } },
              ...regulationContentRelations,
            },
          });
          if (!version) throw missing();
          if (version.season.state !== 'OPEN') throw conflict('STATE_CONFLICT');
          if (
            version.state !== 'DRAFT' ||
            version.regulationCase.currentDraftVersionId !== version.id
          )
            throw conflict('STATE_CONFLICT');
          if (version.revision.toString() !== input.expectedRevision)
            throw conflict('REVISION_CONFLICT');

          validateDraftContent({ ...projectRegulationContent(version), ...content });
          const before = {
            versionId: version.id,
            versionNumber: version.versionNumber,
            state: version.state,
            revision: version.revision.toString(),
          };

          await context.recheckAuthority();
          await context.db.regulationVersion.update({
            where: { id: versionId },
            data: scalarUpdateData(content),
          });
          await replaceChildren(context, versionId, content);
          const existingEditor = await context.db.regulationVersionEditor.findUnique({
            where: { versionId_accountId: { versionId, accountId } },
            select: { accountId: true },
          });
          if (!existingEditor)
            await context.db.regulationVersionEditor.create({
              data: { versionId, accountId, firstEditedAt: await context.now() },
            });
          await context.db.regulationCase.update({
            where: { id: version.caseId },
            data: { revision: { increment: 1n }, updatedAt: await context.now() },
          });
          const after = { ...before, revision: (version.revision + 1n).toString() };
          await this.audit.append(context, {
            actor: { kind: 'ACCOUNT', accountId },
            action: 'REGULATION_DRAFT_UPDATED',
            objectKind: 'RegulationVersion',
            objectId: versionId,
            seasonId: version.seasonId,
            outcome: 'SUCCESS',
            before,
            after,
          });
          return { id: versionId, revision: after.revision };
        },
      );
    } catch (error) {
      if (isMissingLock(error, 'regulationVersion', versionId)) throw missing();
      throw error;
    }
  }

  async history(request: Request, versionId: string, query: Record<string, unknown>) {
    const { values, page, pageSize } = listQuery(
      query,
      ['actionCode', 'occurredFrom', 'occurredBefore'],
      ['occurredAt:desc'],
    );
    const pageRequest = {
      page,
      pageSize,
      ...(values.actionCode !== undefined ? { actionCode: values.actionCode } : {}),
      ...(values.occurredFrom !== undefined ? { occurredFrom: values.occurredFrom } : {}),
      ...(values.occurredBefore !== undefined ? { occurredBefore: values.occurredBefore } : {}),
    };
    try {
      return await this.execution.read(
        request,
        this.versionOperation(versionId, 'shared', false),
        async (context, accountId) => {
          const version = await context.db.regulationVersion.findUnique({
            where: { id: versionId },
            select: { id: true, seasonId: true },
          });
          if (!version) throw missing();
          const scope: BusinessHistoryScope = {
            kind: 'RegulationVersion',
            id: version.id,
            seasonId: version.seasonId,
            locks: [versionLock(version.id, 'shared'), seasonLock(version.seasonId, 'shared')],
            authorize: async (historyContext, historyAccountId) =>
              this.requirePreparationAccess(
                historyContext,
                historyAccountId,
                version.seasonId,
                await historyContext.now(),
                true,
              ),
          };
          const result = await this.businessHistory.listWithin(
            context,
            accountId,
            scope,
            pageRequest,
          );
          return withPaginationMeta(
            { items: result.items },
            { page, pageSize, total: result.total },
          );
        },
      );
    } catch (error) {
      if (isMissingLock(error, 'regulationVersion', versionId)) throw missing();
      throw error;
    }
  }

  async transition(
    request: Request,
    versionId: string,
    action: string,
    input: RegulationVersionActionDto,
  ) {
    if (action === 'approve') {
      const reason = businessText(input.reason, 'reason');
      if (!input.submittedVersionId || input.expectedCurrentVersionId === undefined)
        throw invalid();
      if (input.submittedVersionId.toLowerCase() !== versionId) throw conflict('STATE_CONFLICT');
      try {
        const result = await this.execution.executeCritical(
          request,
          this.versionOperation(versionId, 'exclusive', false, 'manager', true),
          async (context) => {
            const version = await context.db.regulationVersion.findUnique({
              where: { id: versionId },
              select: { effectiveMode: true, proposedEffectiveAt: true },
            });
            if (!version?.effectiveMode) throw conflict('STATE_CONFLICT');
            return {
              action: 'REGULATION_APPROVED',
              targetId: versionId,
              payload: {
                expectedRevision: input.expectedRevision,
                submittedVersionId: versionId,
                effectiveMode: version.effectiveMode,
                ...(input.expectedCurrentVersionId
                  ? { currentBasisVersionId: input.expectedCurrentVersionId.toLowerCase() }
                  : {}),
                ...(version.proposedEffectiveAt
                  ? { proposedEffectiveAt: version.proposedEffectiveAt.toISOString() }
                  : {}),
                reason,
              },
            };
          },
          (context, command) =>
            this.decisions.approve(context, command, async (contentVersionId) =>
              validateCompleteRegulationContent(
                await loadRegulationContent(context, contentVersionId),
              ),
            ),
          async (_context, outcome) => outcome,
        );
        return result.data;
      } catch (error) {
        if (isMissingLock(error, 'regulationVersion', versionId)) throw missing();
        throw error;
      }
    }
    if (input.expectedCurrentVersionId !== undefined) throw invalid();
    if (!lifecycleActions.includes(action as LifecycleAction)) throw invalid();
    const lifecycleAction = action as LifecycleAction;
    const reason = businessText(input.reason, 'reason');
    const decision = lifecycleAction === 'return' || lifecycleAction === 'reject';
    if (decision) {
      if (!input.submittedVersionId) throw invalid();
      if (input.submittedVersionId.toLowerCase() !== versionId) throw conflict('STATE_CONFLICT');
    } else if (input.submittedVersionId !== undefined) {
      throw invalid();
    }

    try {
      return await this.execution.execute(
        request,
        this.versionOperation(versionId, 'exclusive', true, decision ? 'manager' : 'preparation'),
        async (context, accountId) => {
          const version = await context.db.regulationVersion.findUnique({
            where: { id: versionId },
            include: {
              season: { select: { id: true, state: true } },
              regulationCase: { select: { id: true, currentDraftVersionId: true } },
              editors: { select: { accountId: true } },
            },
          });
          if (!version) throw missing();
          if (version.season.state !== 'OPEN') throw conflict('STATE_CONFLICT');
          if (version.revision.toString() !== input.expectedRevision)
            throw conflict('REVISION_CONFLICT');

          if (lifecycleAction === 'submit') {
            if (
              version.state !== 'DRAFT' ||
              version.regulationCase.currentDraftVersionId !== versionId
            )
              throw conflict('STATE_CONFLICT');
          } else {
            if (version.state !== 'SUBMITTED' || !version.submittedAt)
              throw conflict('STATE_CONFLICT');
            if (lifecycleAction === 'withdraw') {
              const isMember =
                version.preparedBy === accountId ||
                version.editors.some((editor) => editor.accountId === accountId);
              if (!isMember) throw denied();
            }
          }

          const completeContent =
            lifecycleAction === 'submit'
              ? validateCompleteRegulationContent(await loadRegulationContent(context, versionId))
              : undefined;
          const before = {
            versionId,
            versionNumber: version.versionNumber,
            state: version.state,
            revision: version.revision.toString(),
            ...(lifecycleAction !== 'submit'
              ? { submittedAt: version.submittedAt!.toISOString() }
              : {}),
          };

          await context.recheckAuthority();
          const recordedAt = await context.now();
          if (
            lifecycleAction === 'submit' &&
            completeContent?.effectiveMode === 'SCHEDULED' &&
            new Date(completeContent.proposedEffectiveAt!).getTime() <= recordedAt.getTime()
          )
            throw conflict('STATE_CONFLICT');

          const targetState =
            lifecycleAction === 'submit'
              ? 'SUBMITTED'
              : lifecycleAction === 'withdraw'
                ? 'WITHDRAWN'
                : lifecycleAction === 'return'
                  ? 'RETURNED'
                  : 'REJECTED';
          const updated = await context.db.regulationVersion.update({
            where: { id: versionId },
            data:
              lifecycleAction === 'submit'
                ? {
                    state: targetState,
                    submittedAt: recordedAt,
                    revision: { increment: 1n },
                    relegationCount: completeContent!.relegationCount,
                  }
                : {
                    state: targetState,
                    decidedAt: recordedAt,
                    decidedBy: accountId,
                    decisionReason: reason,
                    revision: { increment: 1n },
                  },
            select: { id: true, revision: true },
          });
          if (lifecycleAction === 'submit')
            await context.db.regulationCase.update({
              where: { id: version.caseId },
              data: {
                currentDraftVersionId: null,
                revision: { increment: 1n },
                updatedAt: recordedAt,
              },
            });

          const after = {
            versionId,
            versionNumber: version.versionNumber,
            state: targetState,
            revision: updated.revision.toString(),
            ...(lifecycleAction === 'submit'
              ? {
                  submittedAt: recordedAt.toISOString(),
                  effectiveMode: completeContent!.effectiveMode,
                  proposedEffectiveAt: completeContent!.proposedEffectiveAt
                    ? new Date(completeContent!.proposedEffectiveAt).toISOString()
                    : null,
                }
              : {
                  submittedAt: version.submittedAt!.toISOString(),
                  decidedAt: recordedAt.toISOString(),
                  decidedBy: accountId,
                  decisionReason: reason,
                }),
          };
          const auditAction =
            lifecycleAction === 'submit'
              ? 'REGULATION_SUBMITTED'
              : lifecycleAction === 'withdraw'
                ? 'REGULATION_WITHDRAWN'
                : lifecycleAction === 'return'
                  ? 'REGULATION_RETURNED'
                  : 'REGULATION_REJECTED';
          await this.audit.append(context, {
            actor: { kind: 'ACCOUNT', accountId },
            action: auditAction,
            objectKind: 'RegulationVersion',
            objectId: versionId,
            seasonId: version.seasonId,
            outcome: 'SUCCESS',
            reason,
            before,
            after,
          });
          return { id: updated.id, revision: updated.revision.toString() };
        },
      );
    } catch (error) {
      if (isMissingLock(error, 'regulationVersion', versionId)) throw missing();
      throw error;
    }
  }

  private versionOperation(
    versionId: string,
    mode: LockResource['mode'],
    write: boolean,
    actionAuthority: 'preparation' | 'manager' = 'preparation',
    approval = false,
  ) {
    return {
      locks: [versionLock(versionId, mode)],
      discover: async (db: Prisma.TransactionClient): Promise<LockResource[]> => {
        const version = await db.regulationVersion.findUnique({
          where: { id: versionId },
          select: { seasonId: true, caseId: true },
        });
        if (!version) return [];
        return [
          seasonLock(version.seasonId, mode),
          caseLock(version.caseId, mode),
          ...(approval
            ? [
                ...(await this.activation.discover(db, {
                  id: versionId,
                  seasonId: version.seasonId,
                })),
                ...(await this.activation.discoverWaiting(db, version.seasonId)),
              ]
            : []),
        ];
      },
      authorize: async (context: TransactionContext, accountId: string, now: Date) => {
        const version = await context.db.regulationVersion.findUnique({
          where: { id: versionId },
          select: { seasonId: true },
        });
        if (!version) throw missing();
        const season = await context.db.season.findUnique({
          where: { id: version.seasonId },
          select: { state: true },
        });
        if (!season) throw missing();
        if (actionAuthority === 'manager') {
          if (!(await this.hasManagerAuthority(context, accountId, version.seasonId)))
            throw denied();
        } else {
          await this.requirePreparationAccess(context, accountId, version.seasonId, now, !write);
        }
        if (write && season.state !== 'OPEN') throw conflict('STATE_CONFLICT');
      },
    };
  }

  private async requirePreparationAccess(
    context: PreparationContext,
    accountId: string,
    seasonId: string,
    now: Date,
    conceal: boolean,
  ): Promise<void> {
    if (await this.hasPreparationAuthority(context, accountId, seasonId, now)) return;
    if (conceal) throw missing();
    throw denied();
  }

  private async hasPreparationAuthority(
    context: PreparationContext,
    accountId: string,
    seasonId: string,
    now: Date,
  ): Promise<boolean> {
    return !!(await context.db.season.findFirst({
      where: { id: seasonId, ...this.preparationSeasonFilter(accountId, now) },
      select: { id: true },
    }));
  }

  private preparationSeasonFilter(accountId: string, now: Date): Prisma.SeasonWhereInput {
    const assignment = { accountId, revokedAt: null };
    return {
      OR: [
        { roles: { some: { ...assignment, roleCode: 'SEASON_MANAGER' } } },
        {
          roles: {
            some: { ...assignment, roleCode: { in: delegationRoles.PREPARE_REGULATION_CHANGE } },
          },
          grants: {
            some: {
              recipientId: accountId,
              actionCode: 'PREPARE_REGULATION_CHANGE',
              startsAt: { lte: now },
              endsAt: { gt: now },
              revokedAt: null,
              terminatedAt: null,
            },
          },
        },
      ],
    };
  }

  private async hasManagerAuthority(
    context: PreparationContext,
    accountId: string,
    seasonId: string,
  ): Promise<boolean> {
    return !!(await context.db.seasonRoleAssignment.findFirst({
      where: { accountId, seasonId, roleCode: 'SEASON_MANAGER', revokedAt: null },
      select: { id: true },
    }));
  }

  private actionCapabilities(input: {
    accountId: string;
    seasonState: string;
    versionId: string;
    state: string;
    preparedBy: string;
    editors: string[];
    successorExists: boolean;
    currentDraftVersionId: string | null;
    prepAllowed: boolean;
    managerAllowed: boolean;
  }) {
    const open = input.seasonState === 'OPEN';
    const submitted = input.state === 'SUBMITTED';
    const participated =
      input.preparedBy === input.accountId || input.editors.includes(input.accountId);
    return {
      canEditDraft:
        input.prepAllowed &&
        open &&
        input.state === 'DRAFT' &&
        input.currentDraftVersionId === input.versionId,
      canSubmit:
        input.prepAllowed &&
        open &&
        input.state === 'DRAFT' &&
        input.currentDraftVersionId === input.versionId,
      canWithdraw: input.prepAllowed && open && submitted && participated,
      canReturn: input.managerAllowed && open && submitted,
      canReject: input.managerAllowed && open && submitted,
      canApprove: input.managerAllowed && open && submitted && !participated,
      approvalExcluded: input.managerAllowed && open && submitted && participated,
      canCreateSuccessor:
        input.prepAllowed &&
        open &&
        !input.successorExists &&
        input.currentDraftVersionId === null &&
        ['RETURNED', 'WITHDRAWN'].includes(input.state),
    };
  }

  private projectDetail(
    version: Prisma.RegulationVersionGetPayload<{ include: typeof versionDetailRelations }>,
    accountId: string,
    prepAllowed: boolean,
    managerAllowed: boolean,
  ) {
    return {
      id: version.id,
      seasonId: version.seasonId,
      versionNumber: version.versionNumber,
      revision: version.revision.toString(),
      state: version.state,
      predecessorVersionId: version.predecessorVersionId,
      submittedAt: instant(version.submittedAt),
      decidedAt: instant(version.decidedAt),
      decidedBy: version.decider,
      decisionReason: version.decisionReason,
      effectiveMode: version.effectiveMode,
      proposedEffectiveAt: instant(version.proposedEffectiveAt),
      approvedAt: instant(version.approvedAt),
      activationProcessedAt: instant(version.activationProcessedAt),
      activeFrom: instant(version.activeFrom),
      activeUntil: instant(version.activeUntil),
      preparedBy: version.preparer,
      editors: version.editors.map((editor) => ({
        accountId: editor.accountId,
        fullName: editor.account.fullName,
        firstEditedAt: editor.firstEditedAt.toISOString(),
      })),
      content: projectRegulationContent(version),
      isCurrentEffective: version.season.currentRegulationVersionId === version.id,
      isCurrentDraft: version.regulationCase.currentDraftVersionId === version.id,
      capabilities: this.actionCapabilities({
        accountId,
        seasonState: version.season.state,
        versionId: version.id,
        state: version.state,
        preparedBy: version.preparedBy,
        editors: version.editors.map(({ accountId: editorId }) => editorId),
        successorExists: version.successors.length > 0,
        currentDraftVersionId: version.regulationCase.currentDraftVersionId,
        prepAllowed,
        managerAllowed,
      }),
    };
  }
}
