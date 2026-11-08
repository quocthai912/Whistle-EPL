import { isISO8601 } from 'class-validator';
import type { Request } from 'express';
import { Prisma } from '../generated/prisma/client';
import { denied, invalid, listQuery, listSearch, uuid } from '../identity-access/accounts.dto';
import type { AuthService } from '../identity-access/auth.service';
import { isAdministrator } from '../identity-access/authority.policy';
import { readCookie, SESSION_COOKIE } from '../identity-access/csrf.service';
import type { DatabaseService } from '../platform/database.service';
import { isAuditAction } from './audit-payload.policy';
import { auditObjectKinds, auditSelection, projectAuditPage } from './audit-view.policy';

const filters = [
  'actorId',
  'occurredFrom',
  'occurredBefore',
  'actionCode',
  'objectKind',
  'objectId',
  'search',
];
const sorts = ['occurredAt:desc', 'occurredAt:asc'];

/** Parses an optional exact UTC boundary without accepting normalized invalid dates. */
function instant(value: string | undefined) {
  if (value === undefined) return undefined;
  if (
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?Z$/.test(value) ||
    !isISO8601(value, { strict: true, strictSeparator: true })
  )
    throw invalid();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw invalid();
  return date;
}

export class AuditQueryService {
  constructor(
    private readonly database: DatabaseService,
    private readonly auth: AuthService,
  ) {}

  /** Searches permitted audit metadata with validated filters and stable bounded pagination. */
  async list(request: Request, query: Record<string, unknown>) {
    const sessions = this.auth.sessions;
    const candidate = await sessions.find(readCookie(request, SESSION_COOKIE));
    if (!candidate) return sessions.missing();
    return this.database.write(
      sessions.locks(candidate),
      async (context, now) => {
        const live = await sessions.require(context, candidate, now);
        if (
          live.account.mustChangePassword ||
          !(await isAdministrator(context.db, live.account.id))
        )
          throw denied();
      },
      async (context) => {
        const { db } = context;
        const { values, page, pageSize, sort, skip, take } = listQuery(query, filters, sorts);
        const { actorId, actionCode, objectKind, objectId } = values;
        const search = listSearch(values.search);
        const pattern = '%' + search + '%';
        const gte = instant(values.occurredFrom);
        const lt = instant(values.occurredBefore);
        if (
          (gte && lt && gte >= lt) ||
          (actionCode !== undefined && !isAuditAction(actionCode)) ||
          (objectKind !== undefined && !auditObjectKinds.some((kind) => kind === objectKind))
        )
          throw invalid();

        const conditions = [
          actorId === undefined ? null : Prisma.sql`actor_id = ${uuid(actorId)}::uuid`,
          actionCode === undefined ? null : Prisma.sql`action_code = ${actionCode}`,
          objectKind === undefined ? null : Prisma.sql`object_kind = ${objectKind}`,
          objectId === undefined ? null : Prisma.sql`object_id = ${uuid(objectId)}::uuid`,
          gte ? Prisma.sql`occurred_at >= ${gte}::timestamptz` : null,
          lt ? Prisma.sql`occurred_at < ${lt}::timestamptz` : null,
          search
            ? Prisma.sql`(operator_identity ILIKE ${pattern} OR EXISTS (
            SELECT 1 FROM account AS searchable_account
            WHERE (searchable_account.id = audit_record.actor_id
              OR (audit_record.object_kind = 'Account' AND searchable_account.id = audit_record.object_id))
              AND (searchable_account.full_name ILIKE ${pattern}
                OR searchable_account.personnel_code ILIKE ${pattern}
                OR searchable_account.username ILIKE ${pattern})
          ))`
            : null,
        ].filter((condition) => condition !== null);
        const ascending = sort === 'occurredAt:asc';
        const direction = ascending ? Prisma.sql`ASC` : Prisma.sql`DESC`;
        const where = conditions.length
          ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
          : Prisma.empty;
        // One statement snapshots the total and page keys without weakening
        // ReadCommitted admission. The selected audit rows are append-only.
        const [{ total, ids }] = await db.$queryRaw<Array<{ total: bigint; ids: string[] }>>`
          WITH matching AS NOT MATERIALIZED (SELECT id, occurred_at FROM audit_record ${where})
          SELECT (SELECT count(*) FROM matching) AS total,
            ARRAY(SELECT id FROM matching ORDER BY occurred_at ${direction}, id ASC
              LIMIT ${take} OFFSET ${skip}) AS ids
        `;
        const rows = await db.auditRecord.findMany({
          where: { id: { in: ids } },
          select: auditSelection,
          orderBy: [{ occurredAt: ascending ? 'asc' : 'desc' }, { id: 'asc' }],
        });
        const items = await projectAuditPage(db, rows);
        // D080 counts a successful internal lookup as session activity.
        await sessions.touch(
          context,
          await sessions.require(context, candidate, await context.now()),
        );
        return { page, pageSize, total: Number(total), items };
      },
    );
  }
}
