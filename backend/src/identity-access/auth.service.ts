import { DatabaseService } from '../platform/database.service';
import { ApplicationError } from '../platform/application-error';
import { AuditWriterService } from '../audit/audit-writer.service';
import { SecurityPrimitivesService } from './security-primitives.service';
import { CsrfService } from './csrf.service';
import { SessionService } from './session.service';
import { LoginThrottleService } from './login-throttle.service';
import type { LoginDto, ChangePasswordDto } from './auth.dto';

export class AuthService {
  readonly sessions: SessionService;
  readonly csrf: CsrfService;
  private readonly throttle = new LoginThrottleService();
  private readonly dummyHash: Promise<string>;
  constructor(
    private readonly database: DatabaseService,
    private readonly security = new SecurityPrimitivesService(),
    private readonly audit = new AuditWriterService(),
  ) {
    this.sessions = new SessionService(database, security);
    this.csrf = new CsrfService(database, security);
    this.dummyHash = security.hashPassword(`Unknown identity dummy ${security.createCsrfToken()}`);
  }
  async login(
    input: LoginDto,
    ip: string,
    preloginId: string,
    csrfToken: string,
    requestId?: string,
  ) {
    if (!this.csrf.validId(preloginId)) this.csrf.denied();
    const username = input.username.toLowerCase();
    const basis = await this.database.client.account.findUnique({ where: { username } });
    const verified = await this.security.verifyPassword(
      basis?.passwordHash ?? (await this.dummyHash),
      input.password,
    );
    const result = await this.database.write(
      [
        ...(basis ? [{ kind: 'account' as const, key: basis.id, mode: 'exclusive' as const }] : []),
        ...this.throttle.locks(username, ip),
        { kind: 'security', key: `prelogin:${preloginId}`, mode: 'exclusive' },
      ],
      async () => {},
      async (context) => {
        const now = await context.now();
        await this.csrf.requirePrelogin(context, preloginId, csrfToken, now);
        let issued:
          { token: string; data: Awaited<ReturnType<SessionService['projection']>> } | undefined;
        const outcome = await this.throttle.attempt(context, username, ip, async () => {
          const current = basis
            ? await context.db.account.findUnique({ where: { id: basis.id } })
            : null;
          const issuedAt = await context.now();
          await this.csrf.requirePrelogin(context, preloginId, csrfToken, issuedAt);
          const valid = !!(
            verified &&
            current &&
            current.state === 'ACTIVE' &&
            current.passwordHash === basis?.passwordHash &&
            current.authRevision === basis?.authRevision &&
            (!current.mustChangePassword ||
              (current.temporaryPasswordExpiresAt && current.temporaryPasswordExpiresAt > issuedAt))
          );
          if (!valid || !current) return false;
          const tokens = this.security.createSessionTokens();
          const session = await context.db.session.create({
            data: {
              accountId: current.id,
              tokenHash: tokens.tokenHash,
              csrfToken: tokens.csrfToken,
              accountAuthRevision: current.authRevision,
              createdAt: issuedAt,
              lastActivityAt: issuedAt,
              absoluteExpiresAt: this.security.sessionExpiry(issuedAt),
            },
          });
          await context.db.preloginCsrfContext.update({
            where: { id: preloginId },
            data: { consumedAt: issuedAt },
          });
          await this.audit.append(context, {
            actor: { kind: 'ACCOUNT', accountId: current.id },
            action: 'LOGIN_SUCCEEDED',
            objectKind: 'Account',
            objectId: current.id,
            outcome: 'SUCCESS',
            requestId,
          });
          issued = {
            token: tokens.token,
            data: await this.sessions.projection(context, { account: current, session }),
          };
          return true;
        });
        return { outcome, ...issued };
      },
    );
    if (result.outcome === 'THROTTLED')
      throw new ApplicationError(429, 'LOGIN_THROTTLED', 'Vui lòng thử lại sau 15 phút.');
    if (!result.token)
      throw new ApplicationError(401, 'LOGIN_FAILED', 'Tên đăng nhập hoặc mật khẩu không hợp lệ.');
    return result;
  }
  async current(token?: string, csrfToken?: string, logout = false, requestId?: string) {
    const candidate = await this.sessions.candidate(token);
    if (!candidate) this.sessions.missing();
    return this.database.write(
      this.sessions.locks(candidate!),
      async () => {},
      async (context) => {
        const live = await this.sessions.require(context, candidate!, await context.now());
        if (logout) {
          this.csrf.requireToken(csrfToken, live.session.csrfToken);
          await this.sessions.require(context, candidate!, await context.now());
          await context.db.session.update({
            where: { id: live.session.id },
            data: { revokedAt: await context.now(), revocationReason: 'LOGOUT' },
          });
          await this.audit.append(context, {
            actor: { kind: 'ACCOUNT', accountId: live.account.id },
            action: 'LOGOUT_SUCCEEDED',
            objectKind: 'Account',
            objectId: live.account.id,
            outcome: 'SUCCESS',
            requestId,
          });
        } else await this.sessions.touch(context, live);
        return {
          data: await this.sessions.projection(context, live),
          csrfToken: live.session.csrfToken,
        };
      },
    );
  }
  async onModuleDestroy(): Promise<void> {
    await this.database?.close();
  }
  async authorize(token?: string, csrfToken?: string, mutation = false): Promise<void> {
    const candidate = await this.sessions.candidate(token);
    if (!candidate) this.sessions.missing();
    await this.database.write(
      this.sessions.locks(candidate!),
      async () => {},
      async (context) => {
        const live = await this.sessions.require(context, candidate!, await context.now());
        if (live.account.mustChangePassword)
          throw new ApplicationError(
            403,
            'PASSWORD_CHANGE_REQUIRED',
            'Vui lòng đổi mật khẩu trước khi tiếp tục.',
          );
        if (mutation) this.csrf.requireToken(csrfToken, live.session.csrfToken);
        await this.sessions.touch(context, live);
      },
    );
  }
  async changePassword(
    token: string | undefined,
    csrfToken: string | undefined,
    input: ChangePasswordDto,
    requestId?: string,
  ) {
    const candidate = await this.sessions.candidate(token);
    if (!candidate) this.sessions.missing();
    const basis = await this.database.write(
      this.sessions.locks(candidate!),
      async () => {},
      async (context) => {
        const live = await this.sessions.require(context, candidate!, await context.now());
        this.csrf.requireToken(csrfToken, live.session.csrfToken);
        return live.account;
      },
    );
    const verified = await this.security.verifyPassword(basis.passwordHash, input.currentPassword);
    if (!verified)
      throw new ApplicationError(
        400,
        'CURRENT_PASSWORD_INVALID',
        'Mật khẩu hiện tại không hợp lệ.',
      );
    const passwordHash = await this.security.hashPassword(input.newPassword);
    return this.database.write(
      this.sessions.locks(candidate!),
      async () => {},
      async (context) => {
        const live = await this.sessions.require(context, candidate!, await context.now());
        this.csrf.requireToken(csrfToken, live.session.csrfToken);
        if (
          live.account.passwordHash !== basis.passwordHash ||
          live.account.authRevision !== basis.authRevision
        )
          this.sessions.missing();
        const now = await context.now();
        await this.sessions.require(context, candidate!, now);
        const invalidated = await context.db.session.updateMany({
          where: { accountId: basis.id, revokedAt: null },
          data: { revokedAt: now, revocationReason: 'PASSWORD_CHANGED' },
        });
        await context.db.account.update({
          where: { id: basis.id },
          data: {
            passwordHash,
            mustChangePassword: false,
            temporaryPasswordExpiresAt: null,
            passwordChangedAt: now,
            authRevision: { increment: 1 },
            revision: { increment: 1 },
            updatedAt: now,
          },
        });
        await this.audit.append(context, {
          actor: { kind: 'ACCOUNT', accountId: basis.id },
          action: 'PASSWORD_CHANGED',
          objectKind: 'Account',
          objectId: basis.id,
          requestId,
          outcome: 'SUCCESS',
          after: { sessionsInvalidated: invalidated.count },
        });
        return { acknowledged: true };
      },
    );
  }
}
