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
import type { CreateClubDto, UpdateClubDto } from './clubs.dto';
import {
  boundedMasterText,
  checkMasterDuplicate,
  masterCode,
  masterName,
  masterNameGuards,
} from '../platform/master-profile';

async function canWriteClub(context: TransactionContext, accountId: string, now: Date) {
  return !!(await context.db.sharedMasterGrant.findFirst({
    where: { accountId, masterKind: 'CLUB_MASTER', endedAt: null, grantedAt: { lte: now } },
    select: { id: true },
  }));
}

export async function requireClubWrite(context: TransactionContext, accountId: string, now: Date) {
  if (!(await canWriteClub(context, accountId, now))) throw denied();
}

export async function requireClubRead(context: TransactionContext, accountId: string, now: Date) {
  if (
    !(await canWriteClub(context, accountId, now)) &&
    !(await hasSeasonRole(context.db, accountId, ['SEASON_MANAGER']))
  )
    throw denied();
}

function readScope(id: string) {
  return {
    kind: 'Club' as const,
    id,
    locks: [{ kind: 'club' as const, key: id, mode: 'shared' as const }],
    authorize: requireClubRead,
  };
}

type ClubListItem = {
  id: string;
  code: string;
  name: string;
  abbreviation: string;
  discontinuedAt: string | null;
  logo: { id: string; url: string; width: number; height: number } | null;
};

const clubSorts = ['name:asc', 'name:desc', 'code:asc', 'code:desc', 'id:asc', 'id:desc'] as const;

function concealMissingClub(error: unknown, id: string): never {
  if (
    error instanceof MissingLockResource &&
    error.kind === 'club' &&
    error.key === id.toLowerCase()
  )
    throw missing();
  throw error;
}

export class ClubsService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly audit: AuditWriterService,
    private readonly businessHistory: BusinessHistoryService,
  ) {}

  async list(request: Request, query: Record<string, unknown>) {
    const { values, page, pageSize, sort, skip, take } = listQuery(
      query,
      ['search', 'availability'],
      clubSorts,
    );
    const availability = values.availability ?? 'ALL';
    if (!['ACTIVE', 'DISCONTINUED', 'ALL'].includes(availability)) throw invalid();
    const pattern = '%' + listSearch(values.search) + '%';
    const [field, direction] = sort.split(':') as ['name' | 'code' | 'id', 'asc' | 'desc'];
    const column = { name: Prisma.sql`name`, code: Prisma.sql`code`, id: Prisma.sql`id` }[field];
    const order = Prisma.sql`${column} ${direction === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}, id ASC`;
    return this.execution.read(
      request,
      { locks: [], authorize: requireClubRead },
      async (context, accountId) => {
        const [result] = await context.db.$queryRaw<{ total: bigint; items: ClubListItem[] }[]>`
          WITH matching AS NOT MATERIALIZED (
            SELECT c.id, c.code, c.name, c.abbreviation, c.discontinued_at AS "discontinuedAt",
              CASE WHEN m.id IS NULL THEN NULL ELSE jsonb_build_object(
                'id', m.id, 'url', '/api/v1/media/' || m.id, 'width', m.width, 'height', m.height
              ) END AS logo
            FROM club c
            LEFT JOIN media_asset m ON m.id = c.current_logo_id AND m.club_id = c.id
            WHERE (c.code ILIKE ${pattern} OR c.name ILIKE ${pattern} OR c.abbreviation ILIKE ${pattern})
              AND (${availability} = 'ALL' OR (c.discontinued_at IS NULL) = (${availability} = 'ACTIVE'))
          ), page_rows AS (
            SELECT * FROM matching ORDER BY ${order} LIMIT ${take} OFFSET ${skip}
          )
          SELECT (SELECT count(*) FROM matching) AS total,
            COALESCE((SELECT jsonb_agg(page_rows ORDER BY ${order}) FROM page_rows), '[]') AS items
        `;
        const canEdit = await canWriteClub(context, accountId, await context.now());
        return withPaginationMeta(
          { items: result.items, capabilities: { canEdit } },
          { page, pageSize, total: Number(result.total) },
        );
      },
    );
  }

  async detail(request: Request, id: string) {
    try {
      return await this.execution.read(request, readScope(id), async (context, accountId) => {
        const club = await context.db.club.findUniqueOrThrow({
          where: { id },
          select: {
            id: true,
            code: true,
            name: true,
            abbreviation: true,
            revision: true,
            discontinuedAt: true,
            currentLogo: { select: { id: true, width: true, height: true } },
          },
        });
        const { currentLogo, ...profile } = club;
        return {
          ...profile,
          logo: currentLogo ? { ...currentLogo, url: `/api/v1/media/${currentLogo.id}` } : null,
          revision: club.revision.toString(),
          capabilities: { canEdit: await canWriteClub(context, accountId, await context.now()) },
        };
      });
    } catch (error) {
      concealMissingClub(error, id);
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
      concealMissingClub(error, id);
    }
  }

  async create(request: Request, input: CreateClubDto) {
    const code = masterCode(input.code);
    const name = masterName(input.name, 200);
    const abbreviation = masterName(input.abbreviation, 20);
    const review = input.duplicateReview;
    const reason = review && boundedMasterText(normalizeMultilineText(review.reason), 2000);

    return this.execution.execute(
      request,
      {
        locks: [{ kind: 'masterIdentity', key: `club:code:${code}`, mode: 'exclusive' }],
        discover: (db) => masterNameGuards(db, 'club', [name]),
        authorize: requireClubWrite,
      },
      async (context, accountId) => {
        const { db } = context;
        if (await db.club.findUnique({ where: { code }, select: { id: true } }))
          throw conflict('DUPLICATE_CODE', 'Mã câu lạc bộ đã được sử dụng.');

        await checkMasterDuplicate(db, 'club', name, review);

        const data = { code, name, abbreviation };
        const club = await db.club.create({
          data: { id: randomUUID(), ...data },
          select: { id: true, revision: true },
        });
        await this.audit.append(context, {
          action: 'CLUB_CREATED',
          actor: { kind: 'ACCOUNT', accountId },
          objectKind: 'Club',
          objectId: club.id,
          outcome: 'SUCCESS',
          reason,
          after: data,
        });
        return { id: club.id, revision: club.revision.toString() };
      },
    );
  }

  async update(request: Request, id: string, input: UpdateClubDto) {
    const name = input.name === undefined ? undefined : masterName(input.name, 200);
    const abbreviation =
      input.abbreviation === undefined ? undefined : masterName(input.abbreviation, 20);
    const reason =
      input.correctionReason === undefined
        ? undefined
        : boundedMasterText(normalizeMultilineText(input.correctionReason), 2000);
    const basis =
      input.correctionBasis === undefined
        ? undefined
        : boundedMasterText(normalizeMultilineText(input.correctionBasis), 2000);
    if (
      (name === undefined && abbreviation === undefined) ||
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
          locks: [{ kind: 'club', key: id, mode: 'exclusive' }],
          authorize: requireClubWrite,
          discover:
            name === undefined
              ? undefined
              : async (db) => {
                  const previous = await db.club.findUnique({
                    where: { id },
                    select: { name: true },
                  });
                  return masterNameGuards(db, 'club', previous ? [previous.name, name] : [name]);
                },
        },
        async (context, accountId) => {
          const current = await context.db.club.findUniqueOrThrow({ where: { id } });
          assertRevision(current.revision, input.expectedRevision);
          const after = {
            ...(name === undefined || name === current.name ? {} : { name }),
            ...(abbreviation === undefined || abbreviation === current.abbreviation
              ? {}
              : { abbreviation }),
          };
          if (review && !after.name) throw invalid();
          if (!Object.keys(after).length) return { id, revision: current.revision.toString() };
          if (after.name) await checkMasterDuplicate(context.db, 'club', after.name, review, id);
          const before = {
            ...(after.name ? { name: current.name } : {}),
            ...(after.abbreviation ? { abbreviation: current.abbreviation } : {}),
          };
          const updated = await context.db.club.update({
            where: { id },
            data: { ...after, revision: { increment: 1 }, updatedAt: await context.now() },
            select: { revision: true },
          });
          await this.audit.append(context, {
            action: basis ? 'CLUB_CORRECTED' : 'CLUB_UPDATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'Club',
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
      concealMissingClub(error, id);
    }
  }
}
