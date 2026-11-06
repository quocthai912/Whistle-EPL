import { isISO8601 } from 'class-validator';
import type { Request } from 'express';
import type { Prisma } from '../generated/prisma/client';
import { denied, invalid, listQuery, uuid } from '../identity-access/accounts.dto';
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
];
const sorts = ['occurredAt:desc', 'occurredAt:asc'];

function instant(value: string | undefined) {
  if (value === undefined) return undefined;
  if (
    !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
      value,
    ) ||
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

  list(request: Request, query: Record<string, unknown>) {
    const token = readCookie(request, SESSION_COOKIE);
    return this.database.client.$transaction(
      async (db) => {
        const candidate = await this.auth.sessions.find(token, db);
        if (!candidate) return this.auth.sessions.missing();
        const live = await this.auth.sessions.require(
          { db },
          candidate,
          await this.database.now(db),
        );
        if (live.account.mustChangePassword || !(await isAdministrator(db, live.account.id)))
          throw denied();

        const { values, page, pageSize, sort, skip, take } = listQuery(query, filters, sorts);
        const { actorId, actionCode, objectKind, objectId } = values;
        const gte = instant(values.occurredFrom);
        const lt = instant(values.occurredBefore);
        if (
          (gte && lt && gte >= lt) ||
          (actionCode !== undefined && !isAuditAction(actionCode)) ||
          (objectKind !== undefined && !auditObjectKinds.some((kind) => kind === objectKind))
        )
          throw invalid();

        const where: Prisma.AuditRecordWhereInput = {
          actorId: actorId === undefined ? undefined : uuid(actorId),
          actionCode,
          objectKind,
          objectId: objectId === undefined ? undefined : uuid(objectId),
          occurredAt: gte || lt ? { gte, lt } : undefined,
        };
        const [total, rows] = await Promise.all([
          db.auditRecord.count({ where }),
          db.auditRecord.findMany({
            where,
            skip,
            take,
            select: auditSelection,
            orderBy: [{ occurredAt: sort === 'occurredAt:asc' ? 'asc' : 'desc' }, { id: 'asc' }],
          }),
        ]);
        return { page, pageSize, total, items: await projectAuditPage(db, rows) };
      },
      { isolationLevel: 'RepeatableRead' },
    );
  }
}
