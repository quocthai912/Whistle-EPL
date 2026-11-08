import type { Request } from 'express';
import type { DelegationCase, DelegationVersion, Prisma } from '../generated/prisma/client';
import type { TransactionContext } from '../platform/transaction-context';
import { AdministrationExecution } from './administration-execution';
import {
  assertRevision,
  businessText,
  conflict,
  denied,
  invalid,
  listQuery,
  listSearch,
  missing,
  seasonalRoles,
  uuid,
} from './accounts.dto';
import {
  accountLock,
  delegationRoles,
  eligibleRecipient,
  hasSeasonRole,
  isAdministrator,
  rejectSelf,
  type DelegationAction,
} from './authority.policy';
import { DelegationBoundaryService, grantState } from './delegation-boundary.service';
import {
  delegationContent,
  grantStates,
  proposalStates,
  type CreateDelegationDto,
  type EditDelegationDto,
  type DecisionDto,
  type VersionDto,
  type RevocationDto,
} from './delegation.dto';

const person = { id: true, fullName: true, personnelCode: true } as const;
const season = { id: true, code: true, name: true } as const;
const manager = 'SEASON_MANAGER';
const sorts = ['createdAt:desc', 'createdAt:asc'];
const transitions = {
  submit: { from: ['DRAFT'], to: 'PENDING', action: 'DELEGATION_SUBMITTED' },
  cancel: {
    from: ['DRAFT', 'PENDING', 'RETURNED'],
    to: 'CANCELLED',
    action: 'DELEGATION_CANCELLED',
  },
  return: { from: ['PENDING'], to: 'RETURNED', action: 'DELEGATION_RETURNED' },
  reject: { from: ['PENDING'], to: 'REJECTED', action: 'DELEGATION_REJECTED' },
} as const;
type Transition = keyof typeof transitions;
const managerWhere = (accountId: string) => ({ accountId, roleCode: manager, revokedAt: null });
const versionFields = {
  id: true,
  versionNumber: true,
  recipientId: true,
  state: true,
  actionCode: true,
  startMode: true,
  startsAt: true,
  endsAt: true,
  reason: true,
  decisionReason: true,
  submittedAt: true,
  decidedAt: true,
  preparedBy: true,
  decidedBy: true,
  recipient: { select: person },
  editors: { select: { accountId: true, firstEditedAt: true }, orderBy: { accountId: 'asc' } },
} as const;

export class DelegationProposalService {
  private readonly boundaries = new DelegationBoundaryService();
  constructor(private readonly execution: AdministrationExecution) {}

  /** Lists all proposals for administrators or only the caller's own proposals within their direct manager scope. */
  proposals(request: Request, query: Record<string, unknown>) {
    const { values, page, pageSize, sort, skip, take } = listQuery(
      query,
      ['seasonId', 'state', 'search', 'actionCode'],
      sorts,
    );
    if (values.state !== undefined && !proposalStates.includes(values.state)) throw invalid();
    if (values.actionCode !== undefined && !Object.hasOwn(delegationRoles, values.actionCode))
      throw invalid();
    const search = listSearch(values.search);
    const personSearch: Prisma.AccountWhereInput = {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { personnelCode: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ],
    };
    const seasonId = values.seasonId === undefined ? undefined : uuid(values.seasonId);
    return this.execution.run(
      request,
      async (context, actor) => {
        const db = context.db;
        const admin = await isAdministrator(db, actor);
        const directScope = { roles: { some: managerWhere(actor) } };
        const where: Prisma.DelegationCaseWhereInput = {
          seasonId,
          currentVersion: { state: values.state, actionCode: values.actionCode },
          ...(search && { OR: [{ proposer: personSearch }, { recipient: personSearch }] }),
          ...(admin ? {} : { proposerId: actor, season: directScope }),
        };
        const rows = await db.delegationCase.findMany({
          where,
          skip,
          take,
          orderBy: [{ createdAt: sort.endsWith(':asc') ? 'asc' : 'desc' }, { id: 'asc' }],
          select: {
            id: true,
            revision: true,
            createdAt: true,
            proposer: { select: person },
            recipient: { select: person },
            season: { select: season },
            currentVersion: { select: versionFields },
            versions: { select: versionFields, orderBy: { versionNumber: 'asc' } },
          },
        });
        const total = await db.delegationCase.count({ where });
        const seasons = await db.season.findMany({
          where: admin ? undefined : directScope,
          select: season,
          orderBy: { code: 'asc' },
        });
        const proposalSeasons = admin
          ? await db.season.findMany({
              where: directScope,
              select: season,
              orderBy: { code: 'asc' },
            })
          : seasons;
        const recipients = await db.seasonRoleAssignment.findMany({
          where: {
            seasonId: { in: proposalSeasons.map(({ id }) => id) },
            accountId: { not: actor },
            roleCode: { in: ['REGISTRATION_OFFICER', 'SCHEDULING_OFFICER', 'RESULTS_OFFICER'] },
            revokedAt: null,
            account: { state: 'ACTIVE' },
          },
          select: { seasonId: true, roleCode: true, account: { select: person } },
          orderBy: [{ account: { fullName: 'asc' } }, { accountId: 'asc' }, { roleCode: 'asc' }],
        });
        return {
          items: rows.map((row) => ({ ...row, revision: row.revision.toString() })),
          page,
          pageSize,
          total,
          seasons,
          proposalSeasons,
          recipients,
        };
      },
      { check: this.requireReader },
    );
  }

  /** Lists authorized grants and filters lifecycle states at one trusted instant for consistent results. */
  grants(request: Request, query: Record<string, unknown>) {
    const { values, page, pageSize, sort, skip, take } = listQuery(
      query,
      ['seasonId', 'recipientId', 'state', 'search', 'actionCode'],
      ['grantedAt:desc', 'grantedAt:asc', 'startsAt:asc', 'endsAt:asc'],
    );
    const seasonId = values.seasonId === undefined ? undefined : uuid(values.seasonId);
    const recipientId = values.recipientId === undefined ? undefined : uuid(values.recipientId);
    if (values.state !== undefined && !grantStates.includes(values.state)) throw invalid();
    if (values.actionCode !== undefined && !Object.hasOwn(delegationRoles, values.actionCode))
      throw invalid();
    const search = listSearch(values.search);
    const actionLabels: Record<string, string> = {
      PREPARE_REGULATION_CHANGE: 'Chuẩn bị/chỉnh sửa đề xuất thay đổi quy định',
      APPROVE_SCHEDULE_ADJUSTMENT: 'Phê duyệt yêu cầu điều chỉnh lịch thi đấu',
      PREPARE_OFFICIAL_RESULT_CORRECTION:
        'Chuẩn bị/chỉnh sửa đề xuất điều chỉnh kết quả chính thức',
    };
    const matchingActions = Object.entries(actionLabels)
      .filter(([, label]) =>
        label
          .toLocaleLowerCase('vi-VN')
          .includes((values.search ?? '').normalize('NFC').trim().toLocaleLowerCase('vi-VN')),
      )
      .map(([code]) => code);
    return this.execution.run(
      request,
      async (context, actor) => {
        const db = context.db;
        const now = await context.now();
        const admin = await isAdministrator(db, actor);
        const active = { revokedAt: null, terminatedAt: null };
        const scope: Prisma.DelegationGrantWhereInput = admin
          ? {}
          : {
              approvedVersion: {
                case: { proposerId: actor, season: { roles: { some: managerWhere(actor) } } },
              },
            };
        const filters: Record<string, Prisma.DelegationGrantWhereInput> = {
          ACTIVE: { ...active, startsAt: { lte: now }, endsAt: { gt: now } },
          SCHEDULED: { ...active, startsAt: { gt: now } },
          EXPIRED: { ...active, endsAt: { lte: now } },
          REVOKED: { revokedAt: { not: null } },
          TERMINATED: { revokedAt: null, terminatedAt: { not: null } },
        };
        const where: Prisma.DelegationGrantWhereInput = {
          seasonId,
          recipientId,
          actionCode: values.actionCode,
          ...(search && {
            OR: [
              { recipient: { fullName: { contains: search, mode: 'insensitive' } } },
              { recipient: { personnelCode: { contains: search, mode: 'insensitive' } } },
              { actionCode: { in: matchingActions } },
            ],
          }),
          ...(values.state && filters[values.state]),
          ...scope,
        };
        const [field, direction] = sort.split(':');
        const rows = await db.delegationGrant.findMany({
          where,
          skip,
          take,
          orderBy: [{ [field]: direction }, { id: 'asc' }],
          include: {
            season: { select: season },
            recipient: { select: person },
            approvedVersion: {
              select: {
                reason: true,
                case: { select: { id: true, revision: true, proposer: { select: person } } },
              },
            },
          },
        });
        const total = await db.delegationGrant.count({ where });
        const items = rows.map(({ approvedVersion, ...grant }) => ({
          ...grant,
          caseId: approvedVersion.case.id,
          proposer: approvedVersion.case.proposer,
          revision: approvedVersion.case.revision.toString(),
          state: grantState(grant, now),
          basis: approvedVersion.reason,
        }));
        const recipientOptions = await db.delegationGrant.findMany({
          where: scope,
          distinct: ['recipientId'],
          select: { recipient: { select: person } },
          orderBy: { recipient: { fullName: 'asc' } },
        });
        return {
          items,
          page,
          pageSize,
          total,
          recipients: recipientOptions.map(({ recipient }) => recipient),
        };
      },
      { check: this.requireReader },
    );
  }

  create(request: Request, input: CreateDelegationDto) {
    const content = delegationContent(input);
    const seasonId = uuid(input.seasonId);
    return this.execution.run(
      request,
      async (context, actor) => {
        rejectSelf(actor, content.recipientId);
        await this.requireDraftRecipient(context, content.recipientId, seasonId);
        await context.recheckAuthority();
        const now = await context.now();
        const proposal = await context.db.delegationCase.create({
          data: {
            seasonId,
            proposerId: actor,
            recipientId: content.recipientId,
            createdAt: now,
            updatedAt: now,
          },
        });
        const version = await context.db.delegationVersion.create({
          data: {
            ...content,
            caseId: proposal.id,
            versionNumber: 1,
            preparedBy: actor,
            createdAt: now,
          },
        });
        const updated = await context.db.delegationCase.update({
          where: { id: proposal.id },
          data: { currentVersionId: version.id },
        });
        await this.contentEvent(context, request, actor, proposal, version, 'DELEGATION_DRAFTED');
        return this.result(updated, version);
      },
      {
        write: true,
        discover: (db) => this.existingAccounts(db, [content.recipientId]),
        check: (context, actor) => this.requireManager(context, actor, seasonId),
      },
    );
  }

  edit(request: Request, id: string, input: EditDelegationDto) {
    const content = delegationContent(input);
    return this.execution.run(
      request,
      async (context, actor) => {
        const { proposal, version } = await this.current(context, id);
        await this.requireProposer(context, actor, proposal);
        assertRevision(proposal.revision, input.expectedRevision);
        if (!['DRAFT', 'RETURNED'].includes(version.state)) throw conflict();
        rejectSelf(actor, content.recipientId);
        await this.requireDraftRecipient(context, content.recipientId, proposal.seasonId);
        await context.recheckAuthority();
        const now = await context.now();
        const updatedVersion =
          version.state === 'RETURNED'
            ? await context.db.delegationVersion.create({
                data: {
                  ...content,
                  caseId: id,
                  versionNumber: version.versionNumber + 1,
                  predecessorVersionId: version.id,
                  preparedBy: actor,
                  createdAt: now,
                },
              })
            : await context.db.delegationVersion.update({
                where: { id: version.id },
                data: content,
              });
        const updated = await this.advance(context, proposal, now, {
          currentVersionId: updatedVersion.id,
          recipientId: content.recipientId,
        });
        await this.contentEvent(
          context,
          request,
          actor,
          proposal,
          updatedVersion,
          'DELEGATION_EDITED',
          version,
        );
        return this.result(updated, updatedVersion);
      },
      {
        write: true,
        discover: (db) => this.caseLocks(db, id, content.recipientId),
        check: this.requireDirectManager,
      },
    );
  }

  /** Checks the current version before applying a permitted proposal transition and recording its decision. */
  transition(request: Request, id: string, operation: Transition, input: VersionDto | DecisionDto) {
    const transition = transitions[operation];
    const proposerOperation = operation === 'submit' || operation === 'cancel';
    const reason = 'reason' in input ? businessText(input.reason, 'reason') : undefined;
    return this.execution.run(
      request,
      async (context, actor) => {
        const { proposal, version } = await this.current(context, id);
        if (proposerOperation) await this.requireProposer(context, actor, proposal);
        this.checkVersion(proposal, version, input);
        if (!(transition.from as readonly string[]).includes(version.state)) throw conflict();
        await context.recheckAuthority();
        const now = await context.now();
        if (operation === 'submit') await this.validateSubmission(context, proposal, version, now);
        const updated = await context.db.delegationVersion.update({
          where: { id: version.id },
          data: {
            state: transition.to,
            ...(operation === 'submit'
              ? { submittedAt: now }
              : { decidedAt: now, decidedBy: actor, ...(reason && { decisionReason: reason }) }),
          },
        });
        await this.execution.event(context, request, actor, {
          action: transition.action,
          before: { versionId: version.id, state: version.state },
          objectKind: 'DelegationCase',
          objectId: id,
          seasonId: proposal.seasonId,
          reason,
          after: {
            versionId: version.id,
            state: updated.state,
            ...(operation === 'submit' && { versionNumber: version.versionNumber }),
          },
        });
        return this.result(await this.advance(context, proposal, now), updated);
      },
      {
        write: true,
        discover: (db) => this.caseLocks(db, id),
        ...(proposerOperation && { check: this.requireDirectManager }),
      },
    );
  }

  grant(request: Request, id: string, input: VersionDto) {
    const versionId = uuid(input.versionId);
    return this.execution.run(
      request,
      (context, actor) =>
        this.execution.critical(
          context,
          request,
          actor,
          'DELEGATION_GRANTED',
          id,
          { expectedRevision: input.expectedRevision, versionId },
          async () => {
            const { proposal, version } = await this.current(context, id);
            this.checkVersion(proposal, version, input);
            if (version.state !== 'PENDING') throw conflict();
            rejectSelf(actor, proposal.proposerId);
            rejectSelf(actor, proposal.recipientId);
            if (
              await context.db.delegationVersionEditor.count({
                where: { versionId, accountId: actor },
              })
            )
              throw denied();
            if (
              proposal.proposerId === proposal.recipientId ||
              !(await context.db.account.count({
                where: { id: proposal.proposerId, state: 'ACTIVE' },
              })) ||
              !(await hasSeasonRole(context.db, proposal.proposerId, [manager], proposal.seasonId))
            )
              throw conflict('BASIS_CHANGED');
            await context.recheckAuthority();
            const now = await context.now();
            const { startsAt, endsAt } = await this.validateSubmission(
              context,
              proposal,
              version,
              now,
              true,
            );
            const scope = {
              recipientId: proposal.recipientId,
              seasonId: proposal.seasonId,
              actionCode: version.actionCode,
            };
            const overlap = await context.db.delegationGrant.count({
              where: {
                ...scope,
                revokedAt: null,
                terminatedAt: null,
                startsAt: { lt: endsAt },
                endsAt: { gt: startsAt },
              },
            });
            if (overlap)
              throw conflict('STATE_CONFLICT', 'Khoảng thời gian trùng với ủy quyền đã cấp.');
            await this.boundaries.resolve(context, proposal.recipientId, now);
            const granted = await context.db.delegationGrant.create({
              data: {
                ...scope,
                startsAt,
                endsAt,
                approvedVersionId: versionId,
                grantedBy: actor,
                grantedAt: now,
              },
            });
            await context.db.delegationVersion.update({
              where: { id: versionId },
              data: { state: 'GRANTED', decidedAt: now, decidedBy: actor },
            });
            await this.execution.event(context, request, actor, {
              action: 'DELEGATION_GRANTED',
              before: { versionId, state: version.state },
              objectKind: 'DelegationCase',
              objectId: id,
              seasonId: proposal.seasonId,
              after: {
                grantId: granted.id,
                state: 'GRANTED',
                versionId,
                recipientId: scope.recipientId,
                actionCode: scope.actionCode,
                startsAt: startsAt.toISOString(),
                endsAt: endsAt.toISOString(),
              },
            });
            if (version.startMode === 'IMMEDIATE')
              await this.boundaries.record(
                context,
                granted,
                'START',
                now,
                now,
                { kind: 'SYSTEM' },
                undefined,
                undefined,
                true,
              );
            return {
              status: 201,
              data: {
                id,
                relatedId: granted.id,
                revision: (await this.advance(context, proposal, now)).revision.toString(),
              },
            };
          },
        ),
      { write: true, discover: (db) => this.caseLocks(db, id) },
    );
  }

  revoke(request: Request, id: string, input: RevocationDto) {
    const reason = businessText(input.reason, 'reason');
    return this.execution.run(
      request,
      (context, actor) =>
        this.execution.critical(
          context,
          request,
          actor,
          'DELEGATION_REVOKED',
          id,
          { expectedRevision: input.expectedRevision, reason },
          async () => {
            const grant = await context.db.delegationGrant.findUnique({
              where: { id },
              include: { approvedVersion: { include: { case: true } } },
            });
            if (!grant) throw missing();
            const proposal = grant.approvedVersion.case;
            assertRevision(proposal.revision, input.expectedRevision);
            await context.recheckAuthority();
            const now = await context.now();
            if (!['ACTIVE', 'SCHEDULED'].includes(grantState(grant, now))) throw conflict();
            await this.boundaries.resolve(context, grant.recipientId, now);
            await context.db.delegationGrant.update({
              where: { id },
              data: { revokedAt: now, revokedBy: actor, reason },
            });
            await this.boundaries.record(
              context,
              grant,
              'REVOCATION',
              now,
              now,
              { kind: 'ACCOUNT', accountId: actor },
              reason,
              request.res?.locals.requestId as string | undefined,
            );
            return {
              status: 200,
              data: {
                id,
                revision: (await this.advance(context, proposal, now)).revision.toString(),
              },
            };
          },
        ),
      {
        write: true,
        discover: async (db) => {
          const grant = await db.delegationGrant.findUnique({
            where: { id },
            select: { recipientId: true, approvedVersion: { select: { caseId: true } } },
          });
          return grant ? this.caseLocks(db, grant.approvedVersion.caseId, grant.recipientId) : [];
        },
      },
    );
  }

  /** Admits administrators and direct Season Managers to the delegation lists. */
  private requireReader = async (context: TransactionContext, actor: string) => {
    if (
      !(await isAdministrator(context.db, actor)) &&
      !(await hasSeasonRole(context.db, actor, [manager]))
    )
      throw denied();
  };

  private requireDirectManager = (context: TransactionContext, actor: string) =>
    this.requireManager(context, actor);

  /** Requires a current direct Season Manager role, in the specified season when one is supplied. */
  private async requireManager(context: TransactionContext, actor: string, seasonId?: string) {
    if (!(await hasSeasonRole(context.db, actor, [manager], seasonId))) throw denied();
  }

  /** Conceals the case from callers who lack both ownership and current direct authority in its season. */
  private async requireProposer(
    context: TransactionContext,
    actor: string,
    proposal: DelegationCase,
  ) {
    if (
      actor !== proposal.proposerId ||
      !(await hasSeasonRole(context.db, actor, [manager], proposal.seasonId))
    )
      throw missing();
  }

  /** Limits draft recipient lookups to active accounts with a role in the same season. */
  private async requireDraftRecipient(
    context: TransactionContext,
    accountId: string,
    seasonId: string,
  ) {
    const visible = await context.db.seasonRoleAssignment.count({
      where: {
        accountId,
        seasonId,
        revokedAt: null,
        roleCode: { in: [...seasonalRoles] },
        account: { state: 'ACTIVE' },
      },
    });
    if (!visible) throw missing();
  }

  /** Loads the proposal with its current version, treating absent cases and version pointers alike. */
  private async current(context: TransactionContext, id: string) {
    const proposal = await context.db.delegationCase.findUnique({
      where: { id },
      include: { currentVersion: true },
    });
    if (!proposal?.currentVersion) throw missing();
    return { proposal, version: proposal.currentVersion };
  }

  /** Binds the command to both the case revision and its exact current version. */
  private checkVersion(proposal: DelegationCase, version: DelegationVersion, input: VersionDto) {
    assertRevision(proposal.revision, input.expectedRevision);
    if (version.id !== uuid(input.versionId)) throw conflict('BASIS_CHANGED');
  }

  /** Checks completeness, same-season eligibility and the effective interval at submission or grant time. */
  private async validateSubmission(
    context: TransactionContext,
    proposal: DelegationCase,
    version: DelegationVersion,
    now: Date,
    grant = false,
  ) {
    const startsAt = version.startMode === 'IMMEDIATE' ? now : version.startsAt;
    if (
      !startsAt ||
      !version.endsAt ||
      !version.reason?.trim() ||
      startsAt >= version.endsAt ||
      (version.startMode === 'SCHEDULED' && startsAt <= now) ||
      (version.recipientId !== null && version.recipientId !== proposal.recipientId) ||
      !(await eligibleRecipient(
        context.db,
        proposal.recipientId,
        proposal.seasonId,
        version.actionCode as DelegationAction,
      ))
    )
      throw grant
        ? conflict('BASIS_CHANGED', 'Điều kiện hoặc thời hạn ủy quyền đã thay đổi.')
        : invalid('Kiểm tra người nhận, nghiệp vụ, thời gian và lý do.');
    return { startsAt, endsAt: version.endsAt };
  }

  private async existingAccounts(db: Prisma.TransactionClient, ids: string[]) {
    return (await db.account.findMany({ where: { id: { in: ids } }, select: { id: true } })).map(
      ({ id }) => accountLock(id),
    );
  }

  /** Discovers the ordered-lock inputs for the case, current version and affected participants. */
  private async caseLocks(db: Prisma.TransactionClient, id: string, additionalRecipient?: string) {
    const row = await db.delegationCase.findUnique({ where: { id } });
    if (!row) return [];
    return [
      ...(await this.existingAccounts(db, [
        row.proposerId,
        row.recipientId,
        ...(additionalRecipient ? [additionalRecipient] : []),
      ])),
      { kind: 'season' as const, key: row.seasonId, mode: 'shared' as const },
      { kind: 'case' as const, key: id, mode: 'exclusive' as const },
      ...(row.currentVersionId
        ? [{ kind: 'version' as const, key: row.currentVersionId, mode: 'exclusive' as const }]
        : []),
    ];
  }

  private advance(
    context: TransactionContext,
    proposal: DelegationCase,
    now: Date,
    data?: { currentVersionId: string; recipientId: string },
  ) {
    return context.db.delegationCase.update({
      where: { id: proposal.id },
      data: { ...data, updatedAt: now, revision: { increment: 1 } },
    });
  }

  /** Audits the draft or edit with its version, recipient and proposed period. */
  private contentEvent(
    context: TransactionContext,
    request: Request,
    actor: string,
    proposal: DelegationCase,
    version: DelegationVersion,
    action: 'DELEGATION_DRAFTED' | 'DELEGATION_EDITED',
    previous?: DelegationVersion,
  ) {
    /** Projects only the proposal fields needed to compare the original and edited content. */
    const summary = (item: DelegationVersion) => ({
      versionId: item.id,
      versionNumber: item.versionNumber,
      state: item.state,
      reason: item.reason,
      recipientId: item.recipientId,
      actionCode: item.actionCode,
      startMode: item.startMode,
      startsAt: item.startsAt?.toISOString() ?? null,
      endsAt: item.endsAt?.toISOString() ?? null,
    });
    return this.execution.event(context, request, actor, {
      action,
      objectKind: 'DelegationCase',
      objectId: proposal.id,
      seasonId: proposal.seasonId,
      ...(previous && { before: summary(previous) }),
      after: summary(version),
    });
  }

  private result(proposal: DelegationCase, version: DelegationVersion) {
    return {
      id: proposal.id,
      revision: proposal.revision.toString(),
      state: version.state,
      versionId: version.id,
    };
  }
}
