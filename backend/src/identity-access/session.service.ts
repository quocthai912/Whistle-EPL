import type { Account, Session } from '../generated/prisma/client';
import { DatabaseService } from '../platform/database.service';
import type { TransactionContext, LockResource } from '../platform/transaction-context';
import { ApplicationError } from '../platform/application-error';
import { SecurityPrimitivesService } from './security-primitives.service';

export type LiveSession = { account: Account; session: Session };
export class SessionService {
  constructor(
    private readonly database: DatabaseService,
    private readonly security = new SecurityPrimitivesService(),
  ) {}
  async candidate(token?: string): Promise<Session | null> {
    if (!token || !/^[\w-]{43}$/.test(token)) return null;
    return this.database.client.session.findUnique({
      where: { tokenHash: this.security.digest(token) },
    });
  }
  locks(candidate: Session): LockResource[] {
    return [{ kind: 'account', key: candidate.accountId, mode: 'exclusive' }];
  }
  async require(context: TransactionContext, candidate: Session, now: Date): Promise<LiveSession> {
    const session = await context.db.session.findUnique({ where: { id: candidate.id } });
    const account = await context.db.account.findUnique({ where: { id: candidate.accountId } });
    if (!session || !account) this.missing();
    if (
      account!.state !== 'ACTIVE' ||
      session!.accountAuthRevision !== account!.authRevision ||
      session!.revokedAt
    )
      throw new ApplicationError(
        401,
        'PERMISSION_CHANGED',
        'Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.',
      );
    if (
      session!.absoluteExpiresAt <= now ||
      !this.security.isSessionTimeValid(session!.createdAt, session!.lastActivityAt, now) ||
      (account!.mustChangePassword &&
        (!account!.temporaryPasswordExpiresAt || account!.temporaryPasswordExpiresAt <= now))
    )
      throw new ApplicationError(
        401,
        'SESSION_EXPIRED',
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      );
    return { session: session!, account: account! };
  }
  async touch(context: TransactionContext, live: LiveSession): Promise<void> {
    const now = await context.now();
    await this.require(context, live.session, now);
    await context.db.session.update({
      where: { id: live.session.id },
      data: { lastActivityAt: now },
    });
  }
  missing(): never {
    throw new ApplicationError(401, 'AUTH_REQUIRED', 'Vui lòng đăng nhập lại.');
  }
  async projection(context: TransactionContext, live: LiveSession) {
    const account = live.account;
    const own = {
      id: account.id,
      personnelCode: account.personnelCode,
      fullName: account.fullName,
      username: account.username,
      changeRequired: account.mustChangePassword,
    };
    if (account.mustChangePassword) return own;
    const systemRoles = await context.db.systemRoleAssignment.findMany({
      where: { accountId: account.id, revokedAt: null },
      select: { roleCode: true },
    });
    const seasonRoles = await context.db.seasonRoleAssignment.findMany({
      where: { accountId: account.id, revokedAt: null },
      select: { roleCode: true, seasonId: true },
    });
    const sharedGrants = await context.db.sharedMasterGrant.findMany({
      where: { accountId: account.id, endedAt: null },
      select: { masterKind: true },
    });
    const createSeason = await context.db.createSeasonGrant.count({
      where: { accountId: account.id, revokedAt: null },
    });
    return { ...own, systemRoles, seasonRoles, sharedGrants, createSeason: createSeason > 0 };
  }
}
