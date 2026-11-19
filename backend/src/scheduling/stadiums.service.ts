import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import type { BusinessHistoryService } from '../audit/business-history.service';
import { Prisma } from '../generated/prisma/client';
import {
  assertRevision,
  conflict,
  denied,
  invalid,
  listQuery,
  listSearch,
  missing,
} from '../identity-access/accounts.dto';
import { hasSeasonRole } from '../identity-access/authority.policy';
import { normalizeMultilineText } from '../platform/business-text';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { withPaginationMeta } from '../platform/response-envelope.interceptor';
import { MissingLockResource, type TransactionContext } from '../platform/transaction-context';
import type { CreateStadiumDto, UpdateStadiumDto } from './stadiums.dto';
import {
  boundedMasterText,
  checkMasterDuplicate,
  masterCode,
  masterName,
  masterNameGuards,
} from '../platform/master-profile';

async function canWriteStadium(context: TransactionContext, accountId: string, now: Date) {
  return !!(await context.db.sharedMasterGrant.findFirst({
    where: { accountId, masterKind: 'STADIUM_MASTER', endedAt: null, grantedAt: { lte: now } },
    select: { id: true },
  }));
}

export async function requireStadiumWrite(
  context: TransactionContext,
  accountId: string,
  now: Date,
) {
  if (!(await canWriteStadium(context, accountId, now))) throw denied();
}

export async function requireStadiumRead(
  context: TransactionContext,
  accountId: string,
  now: Date,
) {
  if (
    !(await canWriteStadium(context, accountId, now)) &&
    !(await hasSeasonRole(context.db, accountId, ['SCHEDULING_OFFICER']))
  )
    throw denied();
}

function readScope(id: string) {
  return {
    kind: 'Stadium' as const,
    id,
    locks: [{ kind: 'stadium' as const, key: id, mode: 'shared' as const }],
    authorize: requireStadiumRead,
  };
}

type StadiumListItem = {
  id: string;
  code: string;
  name: string;
  location: string | null;
  discontinuedAt: string | null;
};

const stadiumSorts = [
  'name:asc',
  'name:desc',
  'code:asc',
  'code:desc',
  'id:asc',
  'id:desc',
] as const;

function concealMissingStadium(error: unknown, id: string): never {
  if (
    error instanceof MissingLockResource &&
    error.kind === 'stadium' &&
    error.key === id.toLowerCase()
  )
    throw missing();
  throw error;
}

function normalizeLocation(value: string | null): string | null {
  return value?.trim() ? masterName(value, 500) : null;
}

export class StadiumsService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly audit: AuditWriterService,
    private readonly businessHistory: BusinessHistoryService,
  ) {}

  async list(request: Request, query: Record<string, unknown>) {
    const { values, page, pageSize, sort, skip, take } = listQuery(
      query,
      ['search', 'availability'],
      stadiumSorts,
    );
    const availability = values.availability ?? 'ALL';
    if (!['ACTIVE', 'DISCONTINUED', 'ALL'].includes(availability)) throw invalid();
    const pattern = '%' + listSearch(values.search) + '%';
    const [field, direction] = sort.split(':') as ['name' | 'code' | 'id', 'asc' | 'desc'];
    const column = { name: Prisma.sql`name`, code: Prisma.sql`code`, id: Prisma.sql`id` }[field];
    const order = Prisma.sql`${column} ${direction === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}, id ASC`;
    return this.execution.read(
      request,
      { locks: [], authorize: requireStadiumRead },
      async (context, accountId) => {
        const [result] = await context.db.$queryRaw<
          {
            total: bigint;
            items: StadiumListItem[];
            active: bigint;
            discontinued: bigint;
          }[]
        >`
          WITH matching AS NOT MATERIALIZED (
            SELECT c.id, c.code, c.name, c.location, c.discontinued_at AS "discontinuedAt"
            FROM stadium c
            WHERE (c.code ILIKE ${pattern} OR c.name ILIKE ${pattern} OR c.location ILIKE ${pattern})
              AND (${availability} = 'ALL' OR (c.discontinued_at IS NULL) = (${availability} = 'ACTIVE'))
          ), page_rows AS (
            SELECT * FROM matching ORDER BY ${order} LIMIT ${take} OFFSET ${skip}
          )
          SELECT (SELECT count(*) FROM matching) AS total,
            (SELECT count(*) FROM stadium WHERE discontinued_at IS NULL) AS active,
            (SELECT count(*) FROM stadium WHERE discontinued_at IS NOT NULL) AS discontinued,
            COALESCE((SELECT jsonb_agg(page_rows ORDER BY ${order}) FROM page_rows), '[]') AS items
        `;
        const canEdit = await canWriteStadium(context, accountId, await context.now());
        return withPaginationMeta(
          {
            items: result.items,
            capabilities: { canEdit },
            counts: {
              total: Number(result.active + result.discontinued),
              active: Number(result.active),
              discontinued: Number(result.discontinued),
            },
          },
          { page, pageSize, total: Number(result.total) },
        );
      },
    );
  }

  async detail(request: Request, id: string) {
    try {
      return await this.execution.read(request, readScope(id), async (context, accountId) => {
        const stadium = await context.db.stadium.findUniqueOrThrow({
          where: { id },
          select: {
            id: true,
            code: true,
            name: true,
            location: true,
            revision: true,
            discontinuedAt: true,
          },
        });
        return {
          ...stadium,
          revision: stadium.revision.toString(),
          capabilities: { canEdit: await canWriteStadium(context, accountId, await context.now()) },
        };
      });
    } catch (error) {
      concealMissingStadium(error, id);
    }
  }

  async history(request: Request, id: string, query: Record<string, unknown>) {
    const { values, page, pageSize } = listQuery(
      query,
      ['actionCode', 'occurredFrom', 'occurredBefore'],
      ['occurredAt:desc'],
    );
    const scope = readScope(id);
    try {
      return await this.execution.read(request, scope, async (context, accountId) => {
        const result = await this.businessHistory.listWithin(context, accountId, scope, {
          page,
          pageSize,
          ...(values.actionCode !== undefined ? { actionCode: values.actionCode } : {}),
          ...(values.occurredFrom !== undefined ? { occurredFrom: values.occurredFrom } : {}),
          ...(values.occurredBefore !== undefined ? { occurredBefore: values.occurredBefore } : {}),
        });
        return withPaginationMeta({ items: result.items }, { page, pageSize, total: result.total });
      });
    } catch (error) {
      concealMissingStadium(error, id);
    }
  }

  async create(request: Request, input: CreateStadiumDto) {
    const code = masterCode(input.code);
    const name = masterName(input.name, 200);
    const location = normalizeLocation(input.location ?? null);
    const review = input.duplicateReview;
    const reason = review && boundedMasterText(normalizeMultilineText(review.reason), 2000);

    return this.execution.execute(
      request,
      {
        locks: [{ kind: 'masterIdentity', key: `stadium:code:${code}`, mode: 'exclusive' }],
        discover: (db) => masterNameGuards(db, 'stadium', [name]),
        authorize: requireStadiumWrite,
      },
      async (context, accountId) => {
        const { db } = context;
        if (await db.stadium.findUnique({ where: { code }, select: { id: true } }))
          throw conflict('DUPLICATE_CODE', 'Mã sân vận động đã được sử dụng.');

        await checkMasterDuplicate(db, 'stadium', name, review);

        const data = { code, name, location };
        const stadium = await db.stadium.create({
          data: { id: randomUUID(), ...data },
          select: { id: true, revision: true },
        });
        await this.audit.append(context, {
          action: 'STADIUM_CREATED',
          actor: { kind: 'ACCOUNT', accountId },
          objectKind: 'Stadium',
          objectId: stadium.id,
          outcome: 'SUCCESS',
          reason,
          after: data,
        });
        return { id: stadium.id, revision: stadium.revision.toString() };
      },
    );
  }

  async update(request: Request, id: string, input: UpdateStadiumDto) {
    const name = input.name === undefined ? undefined : masterName(input.name, 200);
    const location = input.location === undefined ? undefined : normalizeLocation(input.location);
    const reason =
      input.correctionReason === undefined
        ? undefined
        : boundedMasterText(normalizeMultilineText(input.correctionReason), 2000);
    const basis =
      input.correctionBasis === undefined
        ? undefined
        : boundedMasterText(normalizeMultilineText(input.correctionBasis), 2000);
    if (
      (name === undefined && location === undefined) ||
      (reason === undefined) !== (basis === undefined)
    )
      throw invalid();
    const review = input.duplicateReview;
    const duplicateReason =
      review && boundedMasterText(normalizeMultilineText(review.reason), 2000);
    try {
      return await this.execution.execute(
        request,
        {
          locks: [{ kind: 'stadium', key: id, mode: 'exclusive' }],
          authorize: requireStadiumWrite,
          discover:
            name === undefined
              ? undefined
              : async (db) => {
                  const previous = await db.stadium.findUnique({
                    where: { id },
                    select: { name: true },
                  });
                  return masterNameGuards(db, 'stadium', previous ? [previous.name, name] : [name]);
                },
        },
        async (context, accountId) => {
          const current = await context.db.stadium.findUniqueOrThrow({ where: { id } });
          assertRevision(current.revision, input.expectedRevision);
          const after = {
            ...(name === undefined || name === current.name ? {} : { name }),
            ...(location === undefined || location === current.location ? {} : { location }),
          };
          if (review && !after.name) throw invalid();
          if (!Object.keys(after).length) return { id, revision: current.revision.toString() };
          if (after.name) await checkMasterDuplicate(context.db, 'stadium', after.name, review, id);
          const before = {
            ...(after.name ? { name: current.name } : {}),
            ...('location' in after ? { location: current.location } : {}),
          };
          const updated = await context.db.stadium.update({
            where: { id },
            data: { ...after, revision: { increment: 1 }, updatedAt: await context.now() },
            select: { revision: true },
          });
          await this.audit.append(context, {
            action: basis ? 'STADIUM_CORRECTED' : 'STADIUM_UPDATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'Stadium',
            objectId: id,
            outcome: 'SUCCESS',
            reason: reason ?? duplicateReason,
            before,
            after: {
              ...after,
              ...(basis ? { correctionBasis: basis } : {}),
              ...(basis && duplicateReason ? { duplicateReviewReason: duplicateReason } : {}),
            },
          });
          return { id, revision: updated.revision.toString() };
        },
      );
    } catch (error) {
      concealMissingStadium(error, id);
    }
  }
}
