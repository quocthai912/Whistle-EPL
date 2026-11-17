import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { unresolvedRegulationBasis } from './regulation-activation.service';
import { Prisma } from '../generated/prisma/client';
import { ApplicationError } from '../platform/application-error';
import { withPaginationMeta } from '../platform/response-envelope.interceptor';
import {
  assertRevision,
  conflict,
  denied,
  invalid,
  listQuery,
  listSearch,
  missing,
  seasonalRoles,
} from '../identity-access/accounts.dto';
import type { AuditWriterService } from '../audit/audit-writer.service';
import type { BusinessHistoryService } from '../audit/business-history.service';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { MissingLockResource, type TransactionContext } from '../platform/transaction-context';
import type { CreateSeasonDto, UpdateSeasonDto } from './seasons.dto';

type NormalizedSeasonInput = {
  code: string;
  name: string;
  competitionName: string;
  startDate: string;
  endDate: string;
};

type SeasonListItem = {
  id: string;
  code: string;
  name: string;
  competitionName: string;
  startDate: string;
  endDate: string;
  state: string;
  revision: string;
  effectiveRegulation: {
    versionId: string;
    versionNumber: number;
    activeFrom: string | null;
    activeUntil: string | null;
  } | null;
  capabilities: { canEditMetadata: boolean };
};

const seasonSorts = [
  'code:asc',
  'code:desc',
  'name:asc',
  'name:desc',
  'startDate:asc',
  'startDate:desc',
  'id:asc',
  'id:desc',
] as const;

function invalidField(field: string, code: string, message: string): never {
  throw new ApplicationError(400, 'VALIDATION_FAILED', 'Vui lòng kiểm tra dữ liệu đã nhập.', [
    { field, code, message },
  ]);
}

function normalizeBusinessCode(value: string): string {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(trimmed))
    return invalidField('code', 'matches', 'Mã chỉ gồm chữ Latin, số, gạch dưới hoặc gạch nối.');
  return trimmed.toUpperCase();
}

function normalizeName(value: string, field: 'name' | 'competitionName'): string {
  const normalized = value.normalize('NFC').trim().replace(/\s+/gu, ' ');
  if (!normalized) return invalidField(field, 'isNotEmpty', 'Trường này không được để trống.');
  if (
    [...normalized].length > 200 ||
    normalized.includes('\0') ||
    Buffer.from(normalized).toString() !== normalized
  )
    return invalidField(field, 'maxLength', 'Giá trị vượt quá độ dài cho phép.');
  return normalized;
}

function normalizeDate(value: string, field: 'startDate' | 'endDate'): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    return invalidField(field, 'isDateString', 'Ngày phải theo định dạng YYYY-MM-DD.');
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    return invalidField(field, 'isDateString', 'Ngày lịch không hợp lệ.');
  return value;
}

function normalizeSeasonInput(input: CreateSeasonDto): NormalizedSeasonInput {
  const normalized = {
    code: normalizeBusinessCode(input.code),
    name: normalizeName(input.name, 'name'),
    competitionName: normalizeName(input.competitionName, 'competitionName'),
    startDate: normalizeDate(input.startDate, 'startDate'),
    endDate: normalizeDate(input.endDate, 'endDate'),
  };
  if (normalized.startDate > normalized.endDate)
    invalidField('endDate', 'isAfterOrEqual', 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.');
  return normalized;
}

function normalizeSeasonPatch(input: UpdateSeasonDto): Partial<NormalizedSeasonInput> {
  const patch: Partial<NormalizedSeasonInput> = {};
  if (input.name !== undefined) patch.name = normalizeName(input.name, 'name');
  if (input.competitionName !== undefined)
    patch.competitionName = normalizeName(input.competitionName, 'competitionName');
  if (input.startDate !== undefined) patch.startDate = normalizeDate(input.startDate, 'startDate');
  if (input.endDate !== undefined) patch.endDate = normalizeDate(input.endDate, 'endDate');
  if (Object.keys(patch).length === 0) throw invalid();
  return patch;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function nullableInstant(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function isMissingSeasonLock(error: unknown, seasonId: string): boolean {
  return (
    error instanceof MissingLockResource &&
    error.kind === 'season' &&
    error.key.toLowerCase() === seasonId.toLowerCase()
  );
}

async function requireSeasonRead(
  context: TransactionContext,
  accountId: string,
  seasonId: string,
): Promise<void> {
  const assignment = await context.db.seasonRoleAssignment.findFirst({
    where: {
      accountId,
      seasonId,
      roleCode: { in: [...seasonalRoles] },
      revokedAt: null,
    },
    select: { id: true },
  });
  if (!assignment) throw missing();
}

async function requireSeasonManager(
  context: TransactionContext,
  accountId: string,
  seasonId: string,
): Promise<void> {
  const assignment = await context.db.seasonRoleAssignment.findFirst({
    where: { accountId, seasonId, roleCode: 'SEASON_MANAGER', revokedAt: null },
    select: { id: true },
  });
  if (!assignment) throw denied();
}

function isSeasonCodeUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as {
    code?: unknown;
    constraint?: unknown;
    meta?: {
      target?: unknown;
      driverAdapterError?: { cause?: { originalCode?: unknown; constraint?: unknown } };
    };
  };
  const target = Array.isArray(value.meta?.target)
    ? value.meta.target.join(',')
    : String(
        value.meta?.target ??
          value.constraint ??
          value.meta?.driverAdapterError?.cause?.constraint ??
          '',
      );
  if (value.code === 'P2002') return !target || /code/i.test(target);
  const postgresCode = value.code ?? value.meta?.driverAdapterError?.cause?.originalCode;
  return postgresCode === '23505' && /code/i.test(target);
}

/** Creates only the season shell; regulations and season roles belong to later use cases. */
export class SeasonsService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly audit: AuditWriterService,
    private readonly businessHistory: BusinessHistoryService,
  ) {}

  async list(request: Request, query: Record<string, unknown>) {
    return this.execution.read(
      request,
      { locks: [], authorize: async () => undefined },
      async (context, accountId) => {
        const { values, page, pageSize, sort, skip, take } = listQuery(
          query,
          ['search', 'state'],
          seasonSorts,
        );
        const state = values.state;
        if (state !== undefined && state !== 'OPEN' && state !== 'CLOSED') throw invalid();
        const search = listSearch(values.search);
        const pattern = `%${search}%`;
        const [sortField, sortDirection] = sort.split(':') as [
          'code' | 'name' | 'startDate' | 'id',
          'asc' | 'desc',
        ];
        const sortColumn = {
          code: Prisma.sql`code`,
          name: Prisma.sql`name`,
          startDate: Prisma.sql`start_date`,
          id: Prisma.sql`id`,
        }[sortField];
        const direction = sortDirection === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`;
        const stateCondition = state ? Prisma.sql`AND s.state = ${state}` : Prisma.empty;
        const searchCondition = search
          ? Prisma.sql`AND (s.code ILIKE ${pattern} OR s.name ILIKE ${pattern}
                OR s.competition_name ILIKE ${pattern})`
          : Prisma.empty;
        const [result] = await context.db.$queryRaw<
          Array<{ total: bigint; items: SeasonListItem[]; nextEffectivity: Date | null }>
        >`
          WITH matching AS NOT MATERIALIZED (
            SELECT s.id, s.code, s.name, s.competition_name, s.start_date, s.end_date,
              s.state, s.revision,
              effective.id AS effective_version_id,
              effective.version_number AS effective_version_number,
              effective.active_from AS effective_active_from,
              effective.active_until AS effective_active_until,
              waiting.proposed_effective_at AS waiting_effectivity,
              EXISTS (
                SELECT 1 FROM season_role_assignment AS manager_role
                WHERE manager_role.season_id = s.id
                  AND manager_role.account_id = ${accountId}::uuid
                  AND manager_role.revoked_at IS NULL
                  AND manager_role.role_code = 'SEASON_MANAGER'
              ) AS can_edit
            FROM season AS s
            LEFT JOIN regulation_version AS effective
              ON effective.id = s.current_regulation_version_id AND effective.season_id = s.id
            LEFT JOIN regulation_version AS waiting
              ON waiting.season_id = s.id AND waiting.state = 'APPROVED_WAITING'
            WHERE EXISTS (
              SELECT 1 FROM season_role_assignment AS read_role
              WHERE read_role.season_id = s.id
                AND read_role.account_id = ${accountId}::uuid
                AND read_role.revoked_at IS NULL
                AND read_role.role_code IN (${Prisma.join([...seasonalRoles])})
            )
            ${stateCondition}
            ${searchCondition}
          )
          , page_rows AS MATERIALIZED (
            SELECT * FROM matching
            ORDER BY ${sortColumn} ${direction}, id ASC
            LIMIT ${take} OFFSET ${skip}
          )
          SELECT (SELECT count(*) FROM matching) AS total,
            (SELECT min(waiting_effectivity) FROM page_rows) AS "nextEffectivity",
            COALESCE((
              SELECT jsonb_agg(jsonb_build_object(
                'id', id::text,
                'code', code,
                'name', name,
                'competitionName', competition_name,
                'startDate', to_char(start_date, 'YYYY-MM-DD'),
                'endDate', to_char(end_date, 'YYYY-MM-DD'),
                'state', state,
                'revision', revision::text,
                'effectiveRegulation', CASE WHEN effective_version_id IS NULL THEN NULL ELSE
                  jsonb_build_object(
                    'versionId', effective_version_id::text,
                    'versionNumber', effective_version_number,
                    'activeFrom', CASE WHEN effective_active_from IS NULL THEN NULL ELSE
                      to_char(effective_active_from AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') END,
                    'activeUntil', CASE WHEN effective_active_until IS NULL THEN NULL ELSE
                      to_char(effective_active_until AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') END
                  ) END,
                'capabilities', jsonb_build_object(
                  'canEditMetadata', state = 'OPEN' AND can_edit
                )
              ) ORDER BY ${sortColumn} ${direction}, id ASC)
              FROM page_rows
            ), '[]'::jsonb) AS items
        `;
        if (result.nextEffectivity && result.nextEffectivity <= (await context.now()))
          throw unresolvedRegulationBasis();
        return withPaginationMeta(
          { items: result.items },
          { page, pageSize, total: Number(result.total) },
        );
      },
    );
  }

  async detail(request: Request, seasonId: string) {
    try {
      return await this.execution.read(
        request,
        {
          locks: [{ kind: 'season', key: seasonId, mode: 'shared' }],
          authorize: (context, accountId) => requireSeasonRead(context, accountId, seasonId),
        },
        async (context, accountId) => {
          const season = await context.db.season.findUnique({
            where: { id: seasonId },
            select: {
              id: true,
              code: true,
              name: true,
              competitionName: true,
              startDate: true,
              endDate: true,
              state: true,
              revision: true,
              currentRegulationVersion: {
                select: { id: true, versionNumber: true, activeFrom: true, activeUntil: true },
              },
              regulationVersions: {
                where: { state: 'APPROVED_WAITING' },
                orderBy: [{ versionNumber: 'asc' }, { id: 'asc' }],
                take: 1,
                select: { id: true, versionNumber: true, proposedEffectiveAt: true },
              },
              roles: {
                where: {
                  accountId,
                  roleCode: 'SEASON_MANAGER',
                  revokedAt: null,
                },
                select: { id: true },
              },
            },
          });
          if (!season) throw missing();
          const effective = season.currentRegulationVersion;
          const waiting = season.regulationVersions[0] ?? null;
          if (waiting?.proposedEffectiveAt && waiting.proposedEffectiveAt <= (await context.now()))
            throw unresolvedRegulationBasis();
          return {
            id: season.id,
            code: season.code,
            name: season.name,
            competitionName: season.competitionName,
            startDate: dateOnly(season.startDate),
            endDate: dateOnly(season.endDate),
            state: season.state,
            revision: season.revision.toString(),
            effectiveRegulation: effective
              ? {
                  versionId: effective.id,
                  versionNumber: effective.versionNumber,
                  activeFrom: nullableInstant(effective.activeFrom),
                  activeUntil: nullableInstant(effective.activeUntil),
                }
              : null,
            waitingRegulation: waiting
              ? {
                  versionId: waiting.id,
                  versionNumber: waiting.versionNumber,
                  proposedEffectiveAt: nullableInstant(waiting.proposedEffectiveAt),
                }
              : null,
            capabilities: {
              canEditMetadata: season.state === 'OPEN' && season.roles.length > 0,
            },
          };
        },
      );
    } catch (error) {
      if (isMissingSeasonLock(error, seasonId)) throw missing();
      throw error;
    }
  }

  async history(request: Request, seasonId: string, query: Record<string, unknown>) {
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
    const scope = {
      kind: 'Season' as const,
      id: seasonId,
      locks: [{ kind: 'season' as const, key: seasonId, mode: 'shared' as const }],
      authorize: (context: TransactionContext, accountId: string) =>
        requireSeasonRead(context, accountId, seasonId),
    };
    try {
      return await this.execution.read(
        request,
        { locks: scope.locks, authorize: scope.authorize },
        async (context, accountId) => {
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
      if (isMissingSeasonLock(error, seasonId)) throw missing();
      throw error;
    }
  }

  async update(request: Request, seasonId: string, input: UpdateSeasonDto) {
    const patch = normalizeSeasonPatch(input);
    try {
      return await this.execution.execute(
        request,
        {
          locks: [{ kind: 'season', key: seasonId, mode: 'exclusive' }],
          authorize: (context, accountId) => requireSeasonManager(context, accountId, seasonId),
        },
        async (context, accountId) => {
          const season = await context.db.season.findUnique({
            where: { id: seasonId },
            select: {
              id: true,
              name: true,
              competitionName: true,
              startDate: true,
              endDate: true,
              state: true,
              revision: true,
            },
          });
          if (!season) throw missing();
          if (season.state !== 'OPEN')
            throw conflict('STATE_CONFLICT', 'Mùa giải đã đóng và không thể chỉnh sửa thông tin.');
          assertRevision(season.revision, input.expectedRevision);

          const nextStartDate = patch.startDate
            ? new Date(`${patch.startDate}T00:00:00.000Z`)
            : season.startDate;
          const nextEndDate = patch.endDate
            ? new Date(`${patch.endDate}T00:00:00.000Z`)
            : season.endDate;
          if (nextStartDate > nextEndDate)
            invalidField(
              'endDate',
              'isAfterOrEqual',
              'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.',
            );

          const before: Record<string, string> = {};
          const after: Record<string, string> = {};
          const data: Prisma.SeasonUpdateInput = {};
          if (patch.name !== undefined && patch.name !== season.name) {
            before.name = season.name;
            after.name = patch.name;
            data.name = patch.name;
          }
          if (
            patch.competitionName !== undefined &&
            patch.competitionName !== season.competitionName
          ) {
            before.competitionName = season.competitionName;
            after.competitionName = patch.competitionName;
            data.competitionName = patch.competitionName;
          }
          if (
            patch.startDate !== undefined &&
            dateOnly(nextStartDate) !== dateOnly(season.startDate)
          ) {
            before.startDate = dateOnly(season.startDate);
            after.startDate = dateOnly(nextStartDate);
            data.startDate = nextStartDate;
          }
          if (patch.endDate !== undefined && dateOnly(nextEndDate) !== dateOnly(season.endDate)) {
            before.endDate = dateOnly(season.endDate);
            after.endDate = dateOnly(nextEndDate);
            data.endDate = nextEndDate;
          }
          if (Object.keys(data).length === 0) throw invalid();

          const updatedAt = await context.now();
          await context.recheckAuthority();
          const updated = await context.db.season.update({
            where: { id: seasonId },
            data: { ...data, revision: { increment: 1n }, updatedAt },
            select: { id: true, revision: true },
          });
          await this.audit.append(context, {
            actor: { kind: 'ACCOUNT', accountId },
            action: 'SEASON_UPDATED',
            objectKind: 'Season',
            objectId: seasonId,
            seasonId,
            outcome: 'SUCCESS',
            before,
            after,
          });
          return { id: updated.id, revision: updated.revision.toString() };
        },
      );
    } catch (error) {
      if (isMissingSeasonLock(error, seasonId)) throw missing();
      throw error;
    }
  }

  async create(
    request: Request,
    input: CreateSeasonDto,
  ): Promise<{ id: string; revision: string }> {
    const payload = normalizeSeasonInput(input);
    try {
      const result = await this.execution.executeCritical(
        request,
        {
          locks: [{ kind: 'seasonCollection', key: 'SeasonCollection', mode: 'exclusive' }],
          authorize: async (context: TransactionContext, accountId: string) => {
            const grant = await context.db.createSeasonGrant.findFirst({
              where: { accountId, revokedAt: null },
              select: { id: true },
            });
            if (!grant) throw denied();
          },
        },
        {
          action: 'SEASON_CREATED',
          targetId: 'SeasonCollection',
          payload,
        },
        async (context, command) => {
          if (
            await context.db.season.findFirst({
              where: { code: { equals: command.payload.code, mode: 'insensitive' } },
              select: { id: true },
            })
          )
            throw conflict('DUPLICATE_CODE', 'Mã mùa giải đã tồn tại.');
          const now = await context.now();
          const season = await context.db.season.create({
            data: {
              id: randomUUID(),
              code: command.payload.code,
              name: command.payload.name,
              competitionName: command.payload.competitionName,
              startDate: new Date(`${command.payload.startDate}T00:00:00.000Z`),
              endDate: new Date(`${command.payload.endDate}T00:00:00.000Z`),
              state: 'OPEN',
              createdAt: now,
              updatedAt: now,
            },
            select: {
              id: true,
              revision: true,
              code: true,
              name: true,
              competitionName: true,
              startDate: true,
              endDate: true,
            },
          });
          await this.audit.append(context, {
            actor: { kind: 'ACCOUNT', accountId: command.accountId },
            action: 'SEASON_CREATED',
            objectKind: 'Season',
            objectId: season.id,
            seasonId: season.id,
            outcome: 'SUCCESS',
            after: {
              code: season.code,
              name: season.name,
              competitionName: season.competitionName,
              startDate: command.payload.startDate,
              endDate: command.payload.endDate,
            },
          });
          return { status: 201, data: { id: season.id, revision: season.revision.toString() } };
        },
        async (_context, outcome) => outcome,
      );
      return result.data;
    } catch (error) {
      if (isSeasonCodeUniqueViolation(error))
        throw conflict('DUPLICATE_CODE', 'Mã mùa giải đã tồn tại.');
      throw error;
    }
  }
}
