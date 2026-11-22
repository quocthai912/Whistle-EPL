import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import type { Prisma } from '../generated/prisma/client';
import {
  assertRevision,
  conflict,
  invalid,
  listQuery,
  missing,
  uuid,
} from '../identity-access/accounts.dto';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { withPaginationMeta } from '../platform/response-envelope.interceptor';
import {
  MissingLockResource,
  type LockResource,
  type TransactionContext,
} from '../platform/transaction-context';
import type { RegulationActivationService } from '../season-regulations/regulation-activation.service';
import type {
  ProposeReceiptExceptionDto,
  ReceiptExceptionActionDto,
} from './receipt-exceptions.dto';
import {
  assertIndependentApprover,
  discoverSeasonWithDueRules,
  requireOpenSeason,
  requireSeasonManager,
  requireSeasonRegistrationOfficer,
  requireSeasonRegistrationReader,
  resolveEffectiveRegulationForWrite,
  resolveEffectiveRegulationWithInstant,
} from './registration-execution';
import { requiredBoundedText } from './registration-validation';

export type IntakeGroupKind = 'CLUB_APPLICATION' | 'PLAYER_CHANGE';
export type ExceptionTargetKind = 'CLUB_APPLICATION' | 'PLAYER_REGISTRATION';

export type ReceiptTimingAssessment = {
  receiptTimingStatus: 'ON_TIME' | 'LATE';
  receiptWindowId: string | null;
};

type WindowSlice = {
  id: string;
  intakeKind: string;
  opensAt: Date;
  closesAt: Date;
};

const ACTIVE_CLUB_APP_STATES = new Set(['RECEIVED', 'PENDING_APPROVAL']);
const ACTIVE_REGISTRATION_STATES = new Set(['RECEIVED']);

function concealMissingException(error: unknown): never {
  if (
    error instanceof MissingLockResource &&
    [
      'season',
      'receiptExceptionCase',
      'receiptExceptionVersion',
      'clubApplicationVersion',
      'registrationVersion',
    ].includes(error.kind)
  ) {
    throw missing();
  }
  throw error;
}

export class RegistrationIntakeService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly activation: RegulationActivationService,
    private readonly audit: AuditWriterService,
  ) {}

  /** Evaluates D053 half-open [opensAt, closesAt) intake windows active at server receipt time. */
  assessReceiptTiming(
    windows: readonly WindowSlice[],
    intakeKind: IntakeGroupKind,
    receivedAt: Date,
  ): ReceiptTimingAssessment {
    const matched = windows.find(
      (window) =>
        window.intakeKind === intakeKind &&
        window.opensAt.getTime() <= receivedAt.getTime() &&
        receivedAt.getTime() < window.closesAt.getTime(),
    );
    return matched
      ? { receiptTimingStatus: 'ON_TIME', receiptWindowId: matched.id }
      : { receiptTimingStatus: 'LATE', receiptWindowId: null };
  }

  /** Finds an approved D053 receipt exception bound strictly to the exact target version and season. */
  async findApprovedException(
    context: TransactionContext,
    targetKind: ExceptionTargetKind,
    seasonId: string,
    targetVersionId: string,
  ) {
    return context.db.receiptExceptionVersion.findFirst({
      where: {
        seasonId,
        state: 'APPROVED',
        ...(targetKind === 'CLUB_APPLICATION'
          ? { clubApplicationVersionId: targetVersionId }
          : { registrationVersionId: targetVersionId }),
      },
      select: { id: true, caseId: true, versionNumber: true, decidedAt: true, decidedBy: true },
    });
  }

  /** Enforces D053 timeliness or an approved exception for that exact received version. */
  async requireTimelyOrApprovedException(
    context: TransactionContext,
    targetKind: ExceptionTargetKind,
    seasonId: string,
    version: { id: string; receivedAt: Date | null; receiptTimingStatus: string | null },
  ): Promise<{ receiptExceptionVersionId: string | null }> {
    if (!version.receivedAt || !version.receiptTimingStatus) {
      throw conflict('STATE_CONFLICT', 'Phiên bản hồ sơ chưa được tiếp nhận.');
    }
    if (version.receiptTimingStatus === 'ON_TIME') {
      return { receiptExceptionVersionId: null };
    }
    const approved = await this.findApprovedException(context, targetKind, seasonId, version.id);
    if (!approved) {
      throw conflict(
        'STATE_CONFLICT',
        'Hồ sơ tiếp nhận ngoài khung thời gian quy định và chưa có ngoại lệ tiếp nhận được phê duyệt cho đúng phiên bản này.',
      );
    }
    return { receiptExceptionVersionId: approved.id };
  }

  async list(request: Request, seasonId: string, query: Record<string, unknown>) {
    const { values, page, pageSize, skip, take } = listQuery(
      query,
      ['targetKind', 'targetVersionId', 'state'],
      ['createdAt:desc'],
    );
    if (
      values.targetKind &&
      !['CLUB_APPLICATION', 'PLAYER_REGISTRATION'].includes(values.targetKind)
    )
      throw invalid();
    if (
      values.state &&
      !['ALL', 'DRAFT', 'SUBMITTED', 'RETURNED', 'WITHDRAWN', 'REJECTED', 'APPROVED'].includes(
        values.state,
      )
    )
      throw invalid();
    const targetVersionId = values.targetVersionId ? uuid(values.targetVersionId) : undefined;

    try {
      return await this.execution.read(
        request,
        {
          locks: [{ kind: 'season', key: seasonId, mode: 'shared' }],
          authorize: (context, accountId) =>
            requireSeasonRegistrationReader(context, accountId, seasonId),
        },
        async (context) => {
          const versionPredicates: Prisma.ReceiptExceptionVersionWhereInput[] = [];
          if (values.targetKind === 'CLUB_APPLICATION') {
            versionPredicates.push({ clubApplicationVersionId: { not: null } });
          } else if (values.targetKind === 'PLAYER_REGISTRATION') {
            versionPredicates.push({ registrationVersionId: { not: null } });
          }
          if (targetVersionId) {
            versionPredicates.push({
              OR: [
                { clubApplicationVersionId: targetVersionId },
                { registrationVersionId: targetVersionId },
              ],
            });
          }
          const where: Prisma.ReceiptExceptionCaseWhereInput = {
            seasonId,
            ...(versionPredicates.length > 0
              ? {
                  versions: {
                    some:
                      versionPredicates.length === 1
                        ? versionPredicates[0]
                        : { AND: versionPredicates },
                  },
                }
              : {}),
            ...(values.state && values.state !== 'ALL'
              ? { currentVersion: { state: values.state } }
              : {}),
          };
          const [total, cases] = await Promise.all([
            context.db.receiptExceptionCase.count({ where }),
            context.db.receiptExceptionCase.findMany({
              where,
              orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
              skip,
              take,
              include: {
                versions: {
                  orderBy: { versionNumber: 'desc' },
                  include: {
                    preparer: { select: { id: true, fullName: true, personnelCode: true } },
                    decider: { select: { id: true, fullName: true, personnelCode: true } },
                    editors: { select: { accountId: true } },
                  },
                },
              },
            }),
          ]);
          return withPaginationMeta(
            {
              items: cases.map((item) => ({
                id: item.id,
                seasonId: item.seasonId,
                currentVersionId: item.currentVersionId,
                approvedVersionId: item.approvedVersionId,
                revision: item.revision.toString(),
                versions: item.versions.map((v) => ({
                  id: v.id,
                  versionNumber: v.versionNumber,
                  revision: v.revision.toString(),
                  state: v.state,
                  targetKind: v.clubApplicationVersionId
                    ? ('CLUB_APPLICATION' as const)
                    : ('PLAYER_REGISTRATION' as const),
                  targetVersionId: v.clubApplicationVersionId ?? v.registrationVersionId!,
                  reason: v.reason,
                  basis: v.basis,
                  preparedBy: v.preparedBy,
                  preparer: v.preparer,
                  editorIds: v.editors.map((e) => e.accountId),
                  submittedAt: v.submittedAt?.toISOString() ?? null,
                  decidedAt: v.decidedAt?.toISOString() ?? null,
                  decidedBy: v.decidedBy,
                  decider: v.decider,
                  decisionReason: v.decisionReason,
                })),
              })),
            },
            { page, pageSize, total },
          );
        },
      );
    } catch (error) {
      concealMissingException(error);
    }
  }

  async propose(request: Request, seasonId: string, input: ProposeReceiptExceptionDto) {
    const reason = requiredBoundedText(
      input.reason,
      2000,
      'Vui lòng nhập lý do đề xuất ngoại lệ tiếp nhận.',
    );
    const basis = requiredBoundedText(
      input.basis,
      2000,
      'Vui lòng nhập căn cứ đề xuất ngoại lệ tiếp nhận.',
    );
    const submitImmediately = input.submitImmediately ?? true;
    const targetVersionId = input.targetVersionId.toLowerCase();

    try {
      return await this.execution.execute(
        request,
        {
          locks: [
            input.targetKind === 'CLUB_APPLICATION'
              ? { kind: 'clubApplicationVersion', key: targetVersionId, mode: 'exclusive' }
              : { kind: 'registrationVersion', key: targetVersionId, mode: 'exclusive' },
          ],
          discover: async (db) => {
            const locks: LockResource[] = await discoverSeasonWithDueRules(
              db,
              seasonId,
              this.activation,
            );
            const existing = await db.receiptExceptionVersion.findFirst({
              where:
                input.targetKind === 'CLUB_APPLICATION'
                  ? { clubApplicationVersionId: targetVersionId }
                  : { registrationVersionId: targetVersionId },
              select: { caseId: true },
            });
            if (existing) {
              locks.push({ kind: 'receiptExceptionCase', key: existing.caseId, mode: 'exclusive' });
            }
            return locks;
          },
          authorize: (context, accountId) =>
            requireSeasonRegistrationOfficer(context, accountId, seasonId),
        },
        async (context, accountId) => {
          await resolveEffectiveRegulationForWrite(context, seasonId, this.activation);
          await this.assertTargetEligibleForException(
            context,
            input.targetKind,
            seasonId,
            targetVersionId,
          );

          const priorVersions = await context.db.receiptExceptionVersion.findMany({
            where:
              input.targetKind === 'CLUB_APPLICATION'
                ? { seasonId, clubApplicationVersionId: targetVersionId }
                : { seasonId, registrationVersionId: targetVersionId },
            orderBy: { versionNumber: 'desc' },
            select: { id: true, caseId: true, versionNumber: true, state: true },
          });

          if (priorVersions.some((v) => v.state === 'APPROVED')) {
            throw conflict(
              'STATE_CONFLICT',
              'Phiên bản này đã có ngoại lệ tiếp nhận được phê duyệt.',
            );
          }
          if (priorVersions.some((v) => v.state === 'DRAFT' || v.state === 'SUBMITTED')) {
            throw conflict(
              'STATE_CONFLICT',
              'Phiên bản này đang có đề xuất ngoại lệ chưa kết thúc.',
            );
          }

          await context.recheckAuthority();
          const now = await context.now();
          let caseId: string;
          let versionNumber = 1;
          let predecessorVersionId: string | null = null;

          if (priorVersions.length > 0) {
            caseId = priorVersions[0].caseId;
            versionNumber = priorVersions[0].versionNumber + 1;
            predecessorVersionId = priorVersions[0].id;
          } else {
            caseId = randomUUID();
            await context.db.receiptExceptionCase.create({
              data: { id: caseId, seasonId, createdAt: now, updatedAt: now },
            });
          }

          const versionId = randomUUID();
          const state = submitImmediately ? 'SUBMITTED' : 'DRAFT';
          await context.db.receiptExceptionVersion.create({
            data: {
              id: versionId,
              seasonId,
              caseId,
              versionNumber,
              preparedBy: accountId,
              predecessorVersionId,
              state,
              submittedAt: submitImmediately ? now : null,
              clubApplicationVersionId:
                input.targetKind === 'CLUB_APPLICATION' ? targetVersionId : null,
              registrationVersionId:
                input.targetKind === 'PLAYER_REGISTRATION' ? targetVersionId : null,
              reason,
              basis,
              createdAt: now,
            },
          });

          const savedCase = await context.db.receiptExceptionCase.update({
            where: { id: caseId },
            data: { currentVersionId: versionId, revision: { increment: 1 }, updatedAt: now },
            select: { revision: true },
          });

          await this.audit.append(context, {
            action: 'RECEIPT_EXCEPTION_DRAFT_CREATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ReceiptExceptionCase',
            objectId: caseId,
            seasonId,
            outcome: 'SUCCESS',
            reason,
            after: {
              caseId,
              versionId,
              versionNumber,
              state: 'DRAFT',
              targetKind: input.targetKind,
              targetVersionId,
            },
          });

          if (submitImmediately) {
            await this.audit.append(context, {
              action: 'RECEIPT_EXCEPTION_SUBMITTED',
              actor: { kind: 'ACCOUNT', accountId },
              objectKind: 'ReceiptExceptionCase',
              objectId: caseId,
              seasonId,
              outcome: 'SUCCESS',
              reason,
              after: {
                caseId,
                versionId,
                versionNumber,
                state: 'SUBMITTED',
                targetVersionId,
              },
            });
          }

          return {
            caseId,
            versionId,
            versionNumber,
            revision: '1',
            caseRevision: savedCase.revision.toString(),
            state,
            targetKind: input.targetKind,
            targetVersionId,
          };
        },
      );
    } catch (error) {
      concealMissingException(error);
    }
  }

  async act(request: Request, caseId: string, action: string, input: ReceiptExceptionActionDto) {
    if (!['submit', 'withdraw', 'return', 'reject', 'approve'].includes(action)) {
      throw invalid('Thao tác ngoại lệ tiếp nhận không hợp lệ.');
    }
    const normalizedAction = action as 'submit' | 'withdraw' | 'return' | 'reject' | 'approve';
    const isManagerAction = ['return', 'reject', 'approve'].includes(normalizedAction);
    const reason =
      input.reason === undefined
        ? undefined
        : requiredBoundedText(input.reason, 2000, 'Lý do không hợp lệ.');
    if (['return', 'reject', 'approve'].includes(normalizedAction) && !reason) {
      throw invalid('Vui lòng nhập lý do quyết định ngoại lệ tiếp nhận.');
    }
    const versionId = input.versionId.toLowerCase();

    const operation = {
      locks: [
        { kind: 'receiptExceptionCase' as const, key: caseId, mode: 'exclusive' as const },
        { kind: 'receiptExceptionVersion' as const, key: versionId, mode: 'exclusive' as const },
      ],
      discover: async (db: Prisma.TransactionClient) => {
        const exceptionCase = await db.receiptExceptionCase.findUnique({
          where: { id: caseId },
          select: { seasonId: true },
        });
        if (!exceptionCase) return [];
        const version = await db.receiptExceptionVersion.findFirst({
          where: { id: versionId, caseId },
          select: { clubApplicationVersionId: true, registrationVersionId: true },
        });
        const locks: LockResource[] =
          normalizedAction === 'approve'
            ? await discoverSeasonWithDueRules(db, exceptionCase.seasonId, this.activation)
            : [{ kind: 'season', key: exceptionCase.seasonId, mode: 'shared' }];
        if (version?.clubApplicationVersionId) {
          locks.push({
            kind: 'clubApplicationVersion',
            key: version.clubApplicationVersionId,
            mode: 'exclusive',
          });
        } else if (version?.registrationVersionId) {
          locks.push({
            kind: 'registrationVersion',
            key: version.registrationVersionId,
            mode: 'exclusive',
          });
        }
        return locks;
      },
      authorize: async (context: TransactionContext, accountId: string) => {
        const exceptionCase = await context.db.receiptExceptionCase.findUnique({
          where: { id: caseId },
          select: { seasonId: true },
        });
        if (!exceptionCase) throw missing();
        if (isManagerAction) {
          await requireSeasonManager(context, accountId, exceptionCase.seasonId);
        } else {
          await requireSeasonRegistrationOfficer(context, accountId, exceptionCase.seasonId);
        }
      },
    };

    try {
      if (normalizedAction === 'approve') {
        const critical = await this.execution.executeCritical(
          request,
          operation,
          async (context) => {
            const version = await context.db.receiptExceptionVersion.findFirst({
              where: { id: versionId, caseId },
              select: { clubApplicationVersionId: true, registrationVersionId: true },
            });
            if (!version) throw missing();
            const targetVersionId =
              version.clubApplicationVersionId ?? version.registrationVersionId!;
            return {
              action: 'RECEIPT_EXCEPTION_APPROVED',
              targetId: caseId,
              payload: {
                expectedRevision: input.expectedRevision,
                submittedVersionId: versionId,
                targetVersionId,
                reason: reason!,
              },
            };
          },
          async (context, command) => {
            const exceptionCase = await context.db.receiptExceptionCase.findUnique({
              where: { id: caseId },
              select: { id: true, seasonId: true, approvedVersionId: true },
            });
            if (!exceptionCase) throw missing();
            await resolveEffectiveRegulationForWrite(
              context,
              exceptionCase.seasonId,
              this.activation,
            );
            const version = await context.db.receiptExceptionVersion.findFirst({
              where: { id: versionId, caseId },
              include: { editors: { select: { accountId: true } } },
            });
            if (!version) throw missing();
            assertRevision(version.revision, input.expectedRevision);
            if (version.state !== 'SUBMITTED') {
              throw conflict(
                'STATE_CONFLICT',
                'Đề xuất ngoại lệ không còn ở trạng thái Chờ phê duyệt.',
              );
            }
            assertIndependentApprover(
              version.preparedBy,
              version.editors.map((e) => e.accountId),
              command.accountId,
            );
            if (exceptionCase.approvedVersionId) {
              throw conflict(
                'STATE_CONFLICT',
                'Hồ sơ ngoại lệ này đã có phiên bản được phê duyệt.',
              );
            }
            const targetKind: ExceptionTargetKind = version.clubApplicationVersionId
              ? 'CLUB_APPLICATION'
              : 'PLAYER_REGISTRATION';
            const targetVersionId =
              version.clubApplicationVersionId ?? version.registrationVersionId!;
            await this.assertTargetEligibleForException(
              context,
              targetKind,
              exceptionCase.seasonId,
              targetVersionId,
            );
            const { resolvedAt: now } = await resolveEffectiveRegulationWithInstant(
              context,
              exceptionCase.seasonId,
              this.activation,
            );
            const saved = await context.db.receiptExceptionVersion.update({
              where: { id: version.id },
              data: {
                state: 'APPROVED',
                decidedAt: now,
                decidedBy: command.accountId,
                decisionReason: reason,
                revision: { increment: 1 },
              },
              select: { revision: true },
            });
            await context.db.receiptExceptionCase.update({
              where: { id: caseId },
              data: {
                approvedVersionId: version.id,
                currentVersionId: version.id,
                revision: { increment: 1 },
                updatedAt: now,
              },
            });
            await this.audit.append(context, {
              action: 'RECEIPT_EXCEPTION_APPROVED',
              actor: { kind: 'ACCOUNT', accountId: command.accountId },
              objectKind: 'ReceiptExceptionCase',
              objectId: caseId,
              seasonId: exceptionCase.seasonId,
              outcome: 'SUCCESS',
              reason,
              before: {
                caseId,
                versionId: version.id,
                versionNumber: version.versionNumber,
                state: version.state,
                targetVersionId,
              },
              after: {
                caseId,
                versionId: version.id,
                versionNumber: version.versionNumber,
                state: 'APPROVED',
                targetVersionId,
                approvedAt: now.toISOString(),
              },
            });
            return {
              status: 200,
              data: { id: caseId, revision: saved.revision.toString(), relatedId: version.id },
            };
          },
          async (_context, outcome) => outcome,
        );
        return {
          ...critical.data,
          caseId,
          versionId: critical.data.relatedId ?? versionId,
          state: 'APPROVED',
        };
      }

      return await this.execution.execute(request, operation, async (context, accountId) => {
        const exceptionCase = await context.db.receiptExceptionCase.findUnique({
          where: { id: caseId },
          select: { id: true, seasonId: true, approvedVersionId: true },
        });
        if (!exceptionCase) throw missing();
        await requireOpenSeason(context, exceptionCase.seasonId);

        const version = await context.db.receiptExceptionVersion.findFirst({
          where: { id: versionId, caseId },
          include: { editors: { select: { accountId: true } } },
        });
        if (!version) throw missing();
        assertRevision(version.revision, input.expectedRevision);

        const targetKind: ExceptionTargetKind = version.clubApplicationVersionId
          ? 'CLUB_APPLICATION'
          : 'PLAYER_REGISTRATION';
        const targetVersionId = version.clubApplicationVersionId ?? version.registrationVersionId!;

        if (normalizedAction === 'submit') {
          if (version.state !== 'DRAFT') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể gửi duyệt đề xuất ngoại lệ ở trạng thái Nháp.',
            );
          }
          if (!version.reason?.trim() || !version.basis?.trim()) {
            throw invalid('Đề xuất ngoại lệ phải có đầy đủ lý do và căn cứ.');
          }
          await this.assertTargetEligibleForException(
            context,
            targetKind,
            exceptionCase.seasonId,
            targetVersionId,
          );
          await context.recheckAuthority();
          const now = await context.now();
          const saved = await context.db.receiptExceptionVersion.update({
            where: { id: version.id },
            data: { state: 'SUBMITTED', submittedAt: now, revision: { increment: 1 } },
            select: { revision: true },
          });
          await context.db.receiptExceptionVersionEditor.upsert({
            where: { versionId_accountId: { versionId: version.id, accountId } },
            create: { versionId: version.id, accountId, firstEditedAt: now },
            update: {},
          });
          await this.audit.append(context, {
            action: 'RECEIPT_EXCEPTION_SUBMITTED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'ReceiptExceptionCase',
            objectId: caseId,
            seasonId: exceptionCase.seasonId,
            outcome: 'SUCCESS',
            reason: version.reason,
            after: {
              caseId,
              versionId: version.id,
              versionNumber: version.versionNumber,
              state: 'SUBMITTED',
              targetVersionId,
            },
          });
          return {
            caseId,
            versionId: version.id,
            revision: saved.revision.toString(),
            state: 'SUBMITTED',
          };
        }

        if (normalizedAction === 'withdraw') {
          if (version.state !== 'SUBMITTED' && version.state !== 'DRAFT') {
            throw conflict(
              'STATE_CONFLICT',
              'Chỉ có thể rút đề xuất ngoại lệ ở trạng thái Nháp hoặc Chờ phê duyệt.',
            );
          }
        } else if (version.state !== 'SUBMITTED') {
          throw conflict(
            'STATE_CONFLICT',
            'Đề xuất ngoại lệ không còn ở trạng thái Chờ phê duyệt.',
          );
        }

        if (isManagerAction) {
          assertIndependentApprover(
            version.preparedBy,
            version.editors.map((e) => e.accountId),
            accountId,
          );
        }

        await context.recheckAuthority();
        const now = await context.now();

        const nextState =
          normalizedAction === 'withdraw'
            ? 'WITHDRAWN'
            : normalizedAction === 'return'
              ? 'RETURNED'
              : 'REJECTED';
        const auditAction =
          normalizedAction === 'withdraw'
            ? 'RECEIPT_EXCEPTION_WITHDRAWN'
            : normalizedAction === 'return'
              ? 'RECEIPT_EXCEPTION_RETURNED'
              : 'RECEIPT_EXCEPTION_REJECTED';

        const saved = await context.db.receiptExceptionVersion.update({
          where: { id: version.id },
          data: {
            state: nextState,
            decidedAt: now,
            decidedBy: accountId,
            decisionReason: reason ?? null,
            revision: { increment: 1 },
          },
          select: { revision: true },
        });
        await this.audit.append(context, {
          action: auditAction,
          actor: { kind: 'ACCOUNT', accountId },
          objectKind: 'ReceiptExceptionCase',
          objectId: caseId,
          seasonId: exceptionCase.seasonId,
          outcome: 'SUCCESS',
          reason,
          after: {
            caseId,
            versionId: version.id,
            versionNumber: version.versionNumber,
            state: nextState,
            targetVersionId,
          },
        });
        return {
          caseId,
          versionId: version.id,
          revision: saved.revision.toString(),
          state: nextState,
        };
      });
    } catch (error) {
      concealMissingException(error);
    }
  }

  private async assertTargetEligibleForException(
    context: TransactionContext,
    targetKind: ExceptionTargetKind,
    seasonId: string,
    targetVersionId: string,
  ): Promise<void> {
    if (targetKind === 'CLUB_APPLICATION') {
      const target = await context.db.clubApplicationVersion.findFirst({
        where: { id: targetVersionId, seasonId },
        select: {
          id: true,
          versionKind: true,
          state: true,
          receivedAt: true,
          receiptTimingStatus: true,
        },
      });
      if (!target) throw missing();
      if (target.versionKind !== 'INITIAL') {
        throw conflict(
          'STATE_CONFLICT',
          'Phiên bản đính chính D100 không thuộc diện áp dụng ngoại lệ tiếp nhận D053.',
        );
      }
      if (!target.receivedAt) {
        throw conflict('STATE_CONFLICT', 'Chỉ có thể đề xuất ngoại lệ cho phiên bản đã tiếp nhận.');
      }
      if (target.receiptTimingStatus !== 'LATE') {
        throw conflict(
          'STATE_CONFLICT',
          'Phiên bản hồ sơ này đã tiếp nhận đúng hạn, không cần ngoại lệ.',
        );
      }
      if (!ACTIVE_CLUB_APP_STATES.has(target.state)) {
        throw conflict(
          'STATE_CONFLICT',
          'Không thể xử lý ngoại lệ cho phiên bản hồ sơ đã kết thúc hoặc bị hủy.',
        );
      }
      return;
    }

    const target = await context.db.registrationVersion.findFirst({
      where: { id: targetVersionId, seasonId },
      select: { id: true, state: true, receivedAt: true, receiptTimingStatus: true },
    });
    if (!target) throw missing();
    if (!target.receivedAt) {
      throw conflict('STATE_CONFLICT', 'Chỉ có thể đề xuất ngoại lệ cho phiên bản đã tiếp nhận.');
    }
    if (target.receiptTimingStatus !== 'LATE') {
      throw conflict(
        'STATE_CONFLICT',
        'Phiên bản đăng ký này đã tiếp nhận đúng hạn, không cần ngoại lệ.',
      );
    }
    if (!ACTIVE_REGISTRATION_STATES.has(target.state)) {
      throw conflict(
        'STATE_CONFLICT',
        'Không thể xử lý ngoại lệ cho phiên bản đăng ký đã kết thúc hoặc bị hủy.',
      );
    }
  }
}
