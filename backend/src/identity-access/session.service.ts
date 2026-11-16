import type { Account, Session } from '../generated/prisma/client';
import { DatabaseService } from '../platform/database.service';
import type { TransactionContext, LockResource } from '../platform/transaction-context';
import { ApplicationError } from '../platform/application-error';
import { SecurityPrimitivesService } from './security-primitives.service';
import { DelegationBoundaryService } from './delegation-boundary.service';
import { delegationRoles } from './authority.policy';

export const SESSION_PREPARATION_ACTIONS = ['PREPARE_REGULATION_CHANGE'] as const;
export type SessionPreparationAction = (typeof SESSION_PREPARATION_ACTIONS)[number];
export type SessionPreparationCapability = {
  seasonId: string;
  actionCode: SessionPreparationAction;
};
export type SessionPreparationCapabilities = {
  direct: SessionPreparationCapability[];
  delegated: SessionPreparationCapability[];
};

const preparationRoles: Record<SessionPreparationAction, readonly string[]> = {
  PREPARE_REGULATION_CHANGE: ['SEASON_MANAGER'],
};

/** Projects menu hints from current rows; this is never an authorization check. */
export function projectSessionPreparationCapabilities(
  seasonRoles: readonly { seasonId: string; roleCode: string }[],
  delegatedGrants: readonly { seasonId: string; actionCode: string }[],
): SessionPreparationCapabilities {
  const project = (rows: SessionPreparationCapability[]) => {
    const unique = new Map<string, SessionPreparationCapability>();
    for (const row of rows) unique.set(`${row.seasonId}:${row.actionCode}`, row);
    return [...unique.values()].sort(
      (left, right) =>
        left.seasonId.localeCompare(right.seasonId) ||
        left.actionCode.localeCompare(right.actionCode),
    );
  };
  const direct = seasonRoles.flatMap(({ seasonId, roleCode }) =>
    SESSION_PREPARATION_ACTIONS.filter((actionCode) =>
      preparationRoles[actionCode].includes(roleCode),
    ).map((actionCode) => ({ seasonId, actionCode })),
  );
  const delegated = delegatedGrants.flatMap(({ seasonId, actionCode }) =>
    SESSION_PREPARATION_ACTIONS.includes(actionCode as SessionPreparationAction)
      ? [{ seasonId, actionCode: actionCode as SessionPreparationAction }]
      : [],
  );
  return { direct: project(direct), delegated: project(delegated) };
}

export type LiveSession = { account: Account; session: Session };
export class SessionService {
  readonly boundaries = new DelegationBoundaryService();
  constructor(
    private readonly database: DatabaseService,
    private readonly security = new SecurityPrimitivesService(),
  ) {}
  /** Finds the presented session without processing boundaries or refreshing activity. */
  find(token?: string) {
    if (!token || !/^[\w-]{43}$/.test(token)) return null;
    return this.database.client.session.findUnique({
      where: { tokenHash: this.security.digest(token) },
    });
  }
  /** Resolves due delegation boundaries before returning a token match for the transaction's live-session check. */
  async candidate(token?: string): Promise<Session | null> {
    const session = await this.find(token);
    // Resolve in a separate transaction so a subsequent 401 cannot roll back the ledger.
    if (
      session &&
      !session.revokedAt &&
      (
        await this.boundaries.due(
          this.database.client,
          session.accountId,
          await this.database.now(),
        )
      ).length
    )
      await this.database.write(
        this.locks(session),
        async () => {},
        async (context) => this.boundaries.resolve(context, session.accountId, await context.now()),
      );
    return session;
  }
  locks(candidate: Session): LockResource[] {
    return [{ kind: 'account', key: candidate.accountId, mode: 'exclusive' }];
  }
  /** Rejects revoked, stale and expired sessions, including when a delegation boundary crosses during a lock wait. */
  async require(context: TransactionContext, candidate: Session, now: Date): Promise<LiveSession> {
    const session = await context.db.session.findUnique({ where: { id: candidate.id } });
    const account = await context.db.account.findUnique({ where: { id: candidate.accountId } });
    if (!session || !account) this.missing();
    if (
      account!.state !== 'ACTIVE' ||
      session!.accountAuthRevision !== account!.authRevision ||
      session!.revokedAt ||
      // A boundary can cross while this request waits on its account lock.
      (await this.boundaries.due(context.db, candidate.accountId, now)).some(
        ({ at }) => at > session!.createdAt,
      )
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
    const systemRoleRows = await context.db.systemRoleAssignment.findMany({
      where: { accountId: account.id, revokedAt: null },
      select: { roleCode: true },
    });
    const systemRoles = systemRoleRows.map(({ roleCode }) => ({ roleCode }));
    const seasonRoleRows = await context.db.seasonRoleAssignment.findMany({
      where: { accountId: account.id, revokedAt: null },
      select: { roleCode: true, seasonId: true },
    });
    const seasonRoles = seasonRoleRows.map(({ roleCode, seasonId }) => ({ roleCode, seasonId }));
    const sharedGrantRows = await context.db.sharedMasterGrant.findMany({
      where: { accountId: account.id, endedAt: null },
      select: { masterKind: true },
    });
    const sharedGrants = sharedGrantRows.map(({ masterKind }) => ({ masterKind }));
    const createSeason = await context.db.createSeasonGrant.count({
      where: { accountId: account.id, revokedAt: null },
    });
    const now = await context.now();
    const delegatedPreparations = await context.db.delegationGrant.findMany({
      where: {
        recipientId: account.id,
        actionCode: { in: [...SESSION_PREPARATION_ACTIONS] },
        season: {
          roles: {
            some: {
              accountId: account.id,
              revokedAt: null,
              roleCode: { in: delegationRoles.PREPARE_REGULATION_CHANGE },
            },
          },
        },
        revokedAt: null,
        terminatedAt: null,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      select: { seasonId: true, actionCode: true },
      orderBy: [{ seasonId: 'asc' }, { actionCode: 'asc' }],
    });
    const canCreateSeason = createSeason > 0;
    return {
      ...own,
      systemRoles,
      seasonRoles,
      sharedGrants,
      createSeason: canCreateSeason,
      canCreateSeason,
      preparationCapabilities: projectSessionPreparationCapabilities(
        seasonRoles,
        delegatedPreparations,
      ),
    };
  }
}
