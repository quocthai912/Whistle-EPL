import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import type { BusinessHistoryService } from '../audit/business-history.service';
import { Prisma } from '../generated/prisma/client';
import {
  assertRevision,
  conflict,
  invalid,
  listQuery,
  listSearch,
  missing,
} from '../identity-access/accounts.dto';
import { hasSeasonRole } from '../identity-access/authority.policy';
import { MasterNameConflict } from '../platform/application-error';
import { normalizeMultilineText } from '../platform/business-text';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { boundedMasterText, masterCode, masterName } from '../platform/master-profile';
import { withPaginationMeta } from '../platform/response-envelope.interceptor';
import {
  MissingLockResource,
  type LockResource,
  type TransactionContext,
} from '../platform/transaction-context';
import type { CreatePlayerDto, UpdatePlayerDto } from './players.dto';
import { registrationMasterImpactProvider } from './registration-dependency-facts';
import {
  canWritePlayerMaster,
  requirePlayerMasterRead,
  requirePlayerMasterWrite,
} from './registration-execution';
import { formatDateOnly, parseBirthDate } from './registration-validation';

type PlayerListItem = {
  id: string;
  code: string;
  fullName: string;
  birthDate: string;
  nationalityCode: string;
  nationalityLabel: string;
  positionCode: string;
  positionLabel: string;
  revision: string;
  portrait: { id: string; url: string; width: number; height: number } | null;
};

const playerSorts = [
  'fullName:asc',
  'fullName:desc',
  'code:asc',
  'code:desc',
  'birthDate:asc',
  'birthDate:desc',
  'id:asc',
  'id:desc',
] as const;

function concealMissingPlayer(error: unknown, id: string): never {
  if (
    error instanceof MissingLockResource &&
    error.kind === 'player' &&
    error.key === id.toLowerCase()
  )
    throw missing();
  throw error;
}

function readScope(id: string) {
  return {
    kind: 'Player' as const,
    id,
    locks: [{ kind: 'player' as const, key: id, mode: 'shared' as const }],
    authorize: requirePlayerMasterRead,
  };
}

function normalizeCatalogCode(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed || trimmed.length > 32) throw invalid('Mã danh mục không hợp lệ.');
  return trimmed;
}

async function playerDuplicateGuard(
  db: Prisma.TransactionClient,
  tuples: readonly { fullName: string; birthDateIso: string; nationalityCode: string }[],
): Promise<LockResource[]> {
  const keys = new Set<string>();
  for (const tuple of tuples) {
    const [row] = await db.$queryRaw<{ key: string }[]>`
      SELECT normalize(lower(${tuple.fullName}::text), NFC) AS key
    `;
    keys.add(`player:dup:${row.key}|${tuple.birthDateIso}|${tuple.nationalityCode}`);
  }
  return [...keys]
    .sort()
    .map((key) => ({ kind: 'masterIdentity' as const, key, mode: 'exclusive' as const }));
}

async function checkPlayerDuplicate(
  db: Prisma.TransactionClient,
  fullName: string,
  birthDateIso: string,
  nationalityCode: string,
  review: { candidateIds: readonly string[] } | undefined,
  excludedId?: string,
): Promise<void> {
  const candidates = await db.$queryRaw<{ id: string; code: string; name: string }[]>`
    SELECT id, code, full_name AS name
    FROM player
    WHERE normalize(lower(full_name), NFC) = normalize(lower(${fullName}::text), NFC)
      AND birth_date = ${birthDateIso}::date
      AND nationality_code = ${nationalityCode}
      ${excludedId ? Prisma.sql`AND id <> ${excludedId}::uuid` : Prisma.empty}
    ORDER BY id
  `;
  const reviewed = review?.candidateIds.map((id) => id.toLowerCase()).sort() ?? [];
  if (
    candidates.length !== reviewed.length ||
    candidates.some((candidate, index) => candidate.id !== reviewed[index])
  ) {
    throw new MasterNameConflict(candidates);
  }
}

export class PlayersService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly audit: AuditWriterService,
    private readonly businessHistory: BusinessHistoryService,
  ) {}

  async catalogs(request: Request) {
    return this.execution.read(
      request,
      { locks: [], authorize: requirePlayerMasterRead },
      async (context) => {
        const [positions, nationalities] = await Promise.all([
          context.db.position.findMany({
            orderBy: { code: 'asc' },
            select: { code: true, displayName: true, vietnameseLabel: true, catalogVersion: true },
          }),
          context.db.nationality.findMany({
            orderBy: [{ vietnameseLabel: 'asc' }, { code: 'asc' }],
            select: { code: true, displayName: true, vietnameseLabel: true, catalogVersion: true },
          }),
        ]);
        return { positions, nationalities };
      },
    );
  }

  async list(request: Request, query: Record<string, unknown>) {
    const { values, page, pageSize, sort, skip, take } = listQuery(
      query,
      ['search', 'nationalityCode', 'positionCode'],
      playerSorts,
    );
    const pattern = '%' + listSearch(values.search) + '%';
    const nationalityFilter = values.nationalityCode?.trim().toUpperCase() || null;
    const positionFilter = values.positionCode?.trim().toUpperCase() || null;
    const [field, direction] = sort.split(':') as [
      'fullName' | 'code' | 'birthDate' | 'id',
      'asc' | 'desc',
    ];
    const column = {
      fullName: Prisma.sql`"fullName"`,
      code: Prisma.sql`code`,
      birthDate: Prisma.sql`"birthDate"`,
      id: Prisma.sql`id`,
    }[field];
    const order = Prisma.sql`${column} ${direction === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}, id ASC`;

    return this.execution.read(
      request,
      { locks: [], authorize: requirePlayerMasterRead },
      async (context, accountId) => {
        const [result] = await context.db.$queryRaw<{ total: bigint; items: PlayerListItem[] }[]>`
          WITH matching AS NOT MATERIALIZED (
            SELECT
              p.id,
              p.code,
              p.full_name AS "fullName",
              to_char(p.birth_date, 'YYYY-MM-DD') AS "birthDate",
              p.nationality_code AS "nationalityCode",
              n.vietnamese_label AS "nationalityLabel",
              p.position_code AS "positionCode",
              pos.vietnamese_label AS "positionLabel",
              p.revision::text AS revision,
              CASE WHEN m.id IS NULL THEN NULL ELSE jsonb_build_object(
                'id', m.id, 'url', '/api/v1/media/' || m.id, 'width', m.width, 'height', m.height
              ) END AS portrait
            FROM player p
            JOIN nationality n ON n.code = p.nationality_code
            JOIN position pos ON pos.code = p.position_code
            LEFT JOIN media_asset m ON m.id = p.current_portrait_id AND m.player_id = p.id
            WHERE (
              p.code ILIKE ${pattern}
              OR p.full_name ILIKE ${pattern}
              OR n.vietnamese_label ILIKE ${pattern}
              OR n.code ILIKE ${pattern}
              OR pos.vietnamese_label ILIKE ${pattern}
              OR pos.code ILIKE ${pattern}
            )
              AND (${nationalityFilter}::text IS NULL OR p.nationality_code = ${nationalityFilter})
              AND (${positionFilter}::text IS NULL OR p.position_code = ${positionFilter})
          ), page_rows AS (
            SELECT * FROM matching ORDER BY ${order} LIMIT ${take} OFFSET ${skip}
          )
          SELECT
            (SELECT count(*) FROM matching) AS total,
            COALESCE((SELECT jsonb_agg(page_rows ORDER BY ${order}) FROM page_rows), '[]') AS items
        `;
        const canEdit = await canWritePlayerMaster(context, accountId, await context.now());
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
        const player = await context.db.player.findUniqueOrThrow({
          where: { id },
          select: {
            id: true,
            code: true,
            fullName: true,
            birthDate: true,
            nationalityCode: true,
            nationality: { select: { code: true, displayName: true, vietnameseLabel: true } },
            positionCode: true,
            position: { select: { code: true, displayName: true, vietnameseLabel: true } },
            revision: true,
            createdAt: true,
            updatedAt: true,
            currentPortrait: { select: { id: true, width: true, height: true } },
          },
        });
        const { currentPortrait, ...profile } = player;
        return {
          ...profile,
          birthDate: formatDateOnly(player.birthDate),
          revision: player.revision.toString(),
          createdAt: player.createdAt.toISOString(),
          updatedAt: player.updatedAt.toISOString(),
          portrait: currentPortrait
            ? { ...currentPortrait, url: `/api/v1/media/${currentPortrait.id}` }
            : null,
          capabilities: {
            canEdit: await canWritePlayerMaster(context, accountId, await context.now()),
          },
        };
      });
    } catch (error) {
      concealMissingPlayer(error, id);
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
      concealMissingPlayer(error, id);
    }
  }

  async correctionImpact(request: Request, playerId: string, seasonId: string) {
    try {
      return await this.execution.read(
        request,
        {
          locks: [
            { kind: 'season', key: seasonId, mode: 'shared' },
            { kind: 'player', key: playerId, mode: 'shared' },
          ],
          discover: async (db) => [
            ...(await registrationMasterImpactProvider.discoverLocks(db, {
              seasonId,
              resourceKind: 'PLAYER',
              resourceId: playerId,
            })),
          ],
          authorize: async (context, accountId, now) => {
            await requirePlayerMasterWrite(context, accountId, now);
            if (
              !(await hasSeasonRole(
                context.db,
                accountId,
                ['REGISTRATION_OFFICER', 'SEASON_MANAGER'],
                seasonId,
              ))
            ) {
              throw missing();
            }
          },
        },
        async (context) => {
          const [applications, registrations] = await Promise.all([
            context.db.clubApplication.findMany({
              where: {
                seasonId,
                versions: { some: { proposedPlayers: { some: { playerId } } } },
              },
              include: {
                club: { select: { id: true, code: true, name: true } },
                versions: {
                  orderBy: { versionNumber: 'desc' },
                  take: 1,
                  select: { id: true, versionNumber: true, state: true },
                },
              },
              orderBy: { id: 'asc' },
            }),
            context.db.playerRegistration.findMany({
              where: { seasonId, playerId },
              include: {
                club: { select: { id: true, code: true, name: true } },
                versions: {
                  orderBy: { versionNumber: 'desc' },
                  take: 1,
                  select: { id: true, versionNumber: true, state: true },
                },
              },
              orderBy: { id: 'asc' },
            }),
          ]);

          return {
            status: 'KNOWN' as const,
            affected: [
              ...applications.map((app) => ({
                kind: 'CLUB_APPLICATION' as const,
                id: app.id,
                clubId: app.club.id,
                clubCode: app.club.code,
                clubName: app.club.name,
                latestVersionNumber: app.versions[0]?.versionNumber ?? null,
                state: app.versions[0]?.state ?? null,
              })),
              ...registrations.map((reg) => ({
                kind: 'PLAYER_REGISTRATION' as const,
                id: reg.id,
                clubId: reg.club.id,
                clubCode: reg.club.code,
                clubName: reg.club.name,
                latestVersionNumber: reg.versions[0]?.versionNumber ?? null,
                state: reg.versions[0]?.state ?? null,
              })),
            ],
          };
        },
      );
    } catch (error) {
      if (error instanceof MissingLockResource) throw missing();
      throw error;
    }
  }

  async create(request: Request, input: CreatePlayerDto) {
    const code = masterCode(input.code);
    const fullName = masterName(input.fullName, 200);
    const nationalityCode = normalizeCatalogCode(input.nationalityCode);
    const positionCode = normalizeCatalogCode(input.positionCode);
    const birthDateTrimmed = input.birthDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDateTrimmed)) {
      throw invalid('Ngày sinh phải có định dạng YYYY-MM-DD.');
    }
    const review = input.duplicateReview;
    const reason = review && boundedMasterText(normalizeMultilineText(review.reason), 2000);

    return this.execution.execute(
      request,
      {
        locks: [{ kind: 'masterIdentity', key: `player:code:${code}`, mode: 'exclusive' }],
        discover: (db) =>
          playerDuplicateGuard(db, [{ fullName, birthDateIso: birthDateTrimmed, nationalityCode }]),
        authorize: requirePlayerMasterWrite,
      },
      async (context, accountId) => {
        const now = await context.now();
        const birthDate = parseBirthDate(birthDateTrimmed, now);
        await this.assertValidCatalogs(context, nationalityCode, positionCode);

        if (await context.db.player.findUnique({ where: { code }, select: { id: true } })) {
          throw conflict('DUPLICATE_CODE', 'Mã cầu thủ đã được sử dụng.');
        }

        await checkPlayerDuplicate(context.db, fullName, birthDate.iso, nationalityCode, review);
        await context.recheckAuthority();

        const player = await context.db.player.create({
          data: {
            id: randomUUID(),
            code,
            fullName,
            birthDate: birthDate.date,
            nationalityCode,
            positionCode,
            createdAt: now,
            updatedAt: now,
          },
          select: { id: true, revision: true },
        });

        await this.audit.append(context, {
          action: 'PLAYER_CREATED',
          actor: { kind: 'ACCOUNT', accountId },
          objectKind: 'Player',
          objectId: player.id,
          outcome: 'SUCCESS',
          reason,
          after: {
            code,
            fullName,
            birthDate: birthDate.iso,
            nationalityCode,
            positionCode,
          },
        });

        return { id: player.id, code, revision: player.revision.toString() };
      },
    );
  }

  async update(request: Request, id: string, input: UpdatePlayerDto) {
    const fullName = input.fullName === undefined ? undefined : masterName(input.fullName, 200);
    const nationalityCode =
      input.nationalityCode === undefined ? undefined : normalizeCatalogCode(input.nationalityCode);
    const positionCode =
      input.positionCode === undefined ? undefined : normalizeCatalogCode(input.positionCode);
    const birthDateTrimmed = input.birthDate === undefined ? undefined : input.birthDate.trim();
    if (birthDateTrimmed !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(birthDateTrimmed)) {
      throw invalid('Ngày sinh phải có định dạng YYYY-MM-DD.');
    }

    const reason =
      input.correctionReason === undefined
        ? undefined
        : boundedMasterText(normalizeMultilineText(input.correctionReason), 2000);
    const basis =
      input.correctionBasis === undefined
        ? undefined
        : boundedMasterText(normalizeMultilineText(input.correctionBasis), 2000);

    if (
      (fullName === undefined &&
        birthDateTrimmed === undefined &&
        nationalityCode === undefined &&
        positionCode === undefined) ||
      (reason === undefined) !== (basis === undefined)
    ) {
      throw invalid();
    }

    const review = input.duplicateReview;
    const duplicateReason =
      review && boundedMasterText(normalizeMultilineText(review.reason), 2000);

    try {
      return await this.execution.execute(
        request,
        {
          locks: [{ kind: 'player', key: id, mode: 'exclusive' }],
          authorize: requirePlayerMasterWrite,
          discover: async (db) => {
            const existing = await db.player.findUnique({
              where: { id },
              select: { fullName: true, birthDate: true, nationalityCode: true },
            });
            if (!existing) return [];
            const prevTuple = {
              fullName: existing.fullName,
              birthDateIso: formatDateOnly(existing.birthDate),
              nationalityCode: existing.nationalityCode,
            };
            const nextTuple = {
              fullName: fullName ?? existing.fullName,
              birthDateIso: birthDateTrimmed ?? prevTuple.birthDateIso,
              nationalityCode: nationalityCode ?? existing.nationalityCode,
            };
            return playerDuplicateGuard(db, [prevTuple, nextTuple]);
          },
        },
        async (context, accountId) => {
          const current = await context.db.player.findUniqueOrThrow({ where: { id } });
          assertRevision(current.revision, input.expectedRevision);
          const now = await context.now();
          const currentBirthIso = formatDateOnly(current.birthDate);
          const parsedBirth =
            birthDateTrimmed === undefined ? undefined : parseBirthDate(birthDateTrimmed, now);

          await this.assertValidCatalogs(
            context,
            nationalityCode ?? current.nationalityCode,
            positionCode ?? current.positionCode,
          );

          const nextFullName = fullName ?? current.fullName;
          const nextBirthIso = parsedBirth?.iso ?? currentBirthIso;
          const nextNationality = nationalityCode ?? current.nationalityCode;
          const nextPosition = positionCode ?? current.positionCode;

          const afterSummary: Record<string, string> = {};
          const beforeSummary: Record<string, string> = {};
          const updateData: Prisma.PlayerUncheckedUpdateInput = {};

          if (nextFullName !== current.fullName) {
            beforeSummary.fullName = current.fullName;
            afterSummary.fullName = nextFullName;
            updateData.fullName = nextFullName;
          }
          if (nextBirthIso !== currentBirthIso) {
            beforeSummary.birthDate = currentBirthIso;
            afterSummary.birthDate = nextBirthIso;
            updateData.birthDate = parsedBirth!.date;
          }
          if (nextNationality !== current.nationalityCode) {
            beforeSummary.nationalityCode = current.nationalityCode;
            afterSummary.nationalityCode = nextNationality;
            updateData.nationalityCode = nextNationality;
          }
          if (nextPosition !== current.positionCode) {
            beforeSummary.positionCode = current.positionCode;
            afterSummary.positionCode = nextPosition;
            updateData.positionCode = nextPosition;
          }

          const duplicateTupleChanged =
            'fullName' in afterSummary ||
            'birthDate' in afterSummary ||
            'nationalityCode' in afterSummary;

          if (review && !duplicateTupleChanged) throw invalid();
          if ('birthDate' in afterSummary && (!reason || !basis)) {
            throw invalid(
              'Vui lòng nhập lý do và căn cứ đính chính khi thay đổi ngày sinh cầu thủ.',
            );
          }
          if (!Object.keys(afterSummary).length) {
            return { id, revision: current.revision.toString() };
          }

          if (duplicateTupleChanged) {
            await checkPlayerDuplicate(
              context.db,
              nextFullName,
              nextBirthIso,
              nextNationality,
              review,
              id,
            );
          }

          await context.recheckAuthority();

          const updated = await context.db.player.update({
            where: { id },
            data: { ...updateData, revision: { increment: 1 }, updatedAt: now },
            select: { revision: true },
          });

          await this.audit.append(context, {
            action: basis ? 'PLAYER_CORRECTED' : 'PLAYER_UPDATED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'Player',
            objectId: id,
            outcome: 'SUCCESS',
            reason: reason ?? duplicateReason,
            before: beforeSummary,
            after: {
              ...afterSummary,
              ...(basis ? { correctionBasis: basis } : {}),
              ...(basis && duplicateReason ? { duplicateReviewReason: duplicateReason } : {}),
            },
          });

          return { id, revision: updated.revision.toString() };
        },
      );
    } catch (error) {
      concealMissingPlayer(error, id);
    }
  }

  private async assertValidCatalogs(
    context: TransactionContext,
    nationalityCode: string,
    positionCode: string,
  ): Promise<void> {
    const [nationality, position] = await Promise.all([
      context.db.nationality.findUnique({
        where: { code: nationalityCode },
        select: { code: true },
      }),
      context.db.position.findUnique({ where: { code: positionCode }, select: { code: true } }),
    ]);
    if (!nationality) throw invalid('Quốc tịch không thuộc danh mục chuẩn được phê duyệt.');
    if (!position) throw invalid('Vị trí thi đấu không thuộc danh mục chuẩn được phê duyệt.');
  }
}
