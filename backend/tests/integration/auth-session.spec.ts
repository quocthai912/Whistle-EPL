import { Test } from '@nestjs/testing';
import { Controller, Get, Post, UseGuards, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/platform/database.service';
import { SafeValidationPipe } from '../../src/platform/validation.pipe';
import { SafeErrorFilter } from '../../src/platform/error.filter';
import { ResponseEnvelopeInterceptor } from '../../src/platform/response-envelope.interceptor';
import { TestClock } from '../fixtures/test-clock';
import { resetPhase1Fixtures } from '../fixtures/phase-1-fixtures';
import { SecurityPrimitivesService } from '../../src/identity-access/security-primitives.service';
import { Pool } from 'pg';
import { waitForBlockedBy } from '../fixtures/test-clock';
import { AuthGuard } from '../../src/identity-access/auth.guard';
import { AuthService } from '../../src/identity-access/auth.service';

@Controller('api/v1/guard-probe')
@UseGuards(AuthGuard)
class ProtectedProbe {
  @Get() read() {
    return { permitted: true };
  }
  @Post() write() {
    return { permitted: true };
  }
}

describe('authentication HTTP contract', () => {
  const clock = new TestClock(new Date('2026-10-29T03:00:00Z'));
  const database = new DatabaseService(process.env.TEST_DATABASE_URL!, clock);
  const observer = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  let app: INestApplication;
  beforeAll(async () => {
    await resetPhase1Fixtures(process.env.TEST_DATABASE_URL!, 'RESET_ISOLATED_TEST_DATABASE');
    process.env.AUTH_ORIGIN = 'https://whistle.test';
    const module = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [ProtectedProbe],
      providers: [AuthGuard, { provide: AuthService, useFactory: () => new AuthService(database) }],
    })
      .overrideProvider(DatabaseService)
      .useValue(database)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new SafeValidationPipe());
    app.useGlobalFilters(new SafeErrorFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    await database.close();
    await observer.end();
    delete process.env.AUTH_ORIGIN;
  });
  beforeEach(() => clock.set(new Date('2026-10-29T03:00:00Z')));
  const password = 'Personal synthetic credential 🦉 only';
  const cookieOf = (response: request.Response, name = '__Host-whistle-session') =>
    (response.headers['set-cookie'] as unknown as string[])
      .find((cookie) => cookie.startsWith(`${name}=`))!
      .split(';')[0];
  async function createAccount(username: string, temporary = false) {
    return database.client.account.create({
      data: {
        personnelCode: username.toUpperCase().replaceAll('.', '_'),
        fullName: 'Nhân viên kiểm thử',
        username,
        passwordHash: await new SecurityPrimitivesService().hashPassword(password),
        mustChangePassword: temporary,
        temporaryPasswordExpiresAt: temporary ? new Date('2026-10-30T03:00:00Z') : null,
      },
    });
  }
  async function loginAs(username: string, credential = password) {
    const pre = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', 'https://whistle.test')
      .set('Cookie', cookieOf(pre, '__Host-whistle-csrf-context'))
      .set('X-CSRF-Token', pre.body.data.csrfToken)
      .send({ username, password: credential });
  }
  it('bootstraps a protected no-store prelogin context and reuses it across tabs', async () => {
    const first = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
    expect(first.headers['cache-control']).toBe('no-store');
    expect(first.body.data.csrfToken).toMatch(/^[\w-]{43}$/);
    const cookie = first.headers['set-cookie'][0];
    expect(cookie).toMatch(/^__Host-whistle-csrf-context=/);
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/'])
      expect(cookie).toContain(flag);
    expect(cookie).not.toContain('Domain=');
    const second = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf')
      .set('Cookie', cookie.split(';')[0])
      .expect(200);
    expect(second.body.data.csrfToken).toBe(first.body.data.csrfToken);
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookie.split(';')[0])
      .expect(401);
  });
  it('logs in with a case-insensitive username, keeps stable session CSRF and logs out only the current session', async () => {
    const password = 'Personal synthetic credential 🦉 only';
    await database.client.account.create({
      data: {
        personnelCode: 'AUTH_STAFF',
        fullName: 'Nhân viên kiểm thử',
        username: 'auth.staff',
        passwordHash: await new SecurityPrimitivesService().hashPassword(password),
        mustChangePassword: false,
      },
    });
    const login = async () => {
      const pre = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', pre.headers['set-cookie'][0].split(';')[0])
        .set('X-CSRF-Token', pre.body.data.csrfToken)
        .send({ username: 'AUTH.STAFF', password })
        .expect(200);
    };
    const first = await login();
    const second = await login();
    expect(first.body.data.username).toBe('auth.staff');
    expect(first.body.data.changeRequired).toBe(false);
    const cookie = (first.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith('__Host-whistle-session='))!
      .split(';')[0];
    const other = (second.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith('__Host-whistle-session='))!
      .split(';')[0];
    const csrf = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf')
      .set('Cookie', cookie)
      .expect(200);
    const tab = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf')
      .set('Cookie', cookie)
      .expect(200);
    expect(tab.body.data.csrfToken).toBe(csrf.body.data.csrfToken);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Origin', 'https://whistle.test')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookie)
      .expect(401);
    await request(app.getHttpServer()).get('/api/v1/auth/session').set('Cookie', other).expect(200);
  });
  it('changes a temporary password, invalidates every session and requires personal login again', async () => {
    await createAccount('auth.temporary', true);
    const first = await loginAs('auth.temporary');
    const second = await loginAs('auth.temporary');
    expect(first.body.data.changeRequired).toBe(true);
    expect(first.body.data.systemRoles).toBeUndefined();
    const cookie = cookieOf(first);
    const csrf = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf')
      .set('Cookie', cookie)
      .expect(200);
    const replacement = ' Personal replacement credential 🦉 ';
    const changed = await request(app.getHttpServer())
      .post('/api/v1/auth/password/change')
      .set('Origin', 'https://whistle.test')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({ currentPassword: password, newPassword: replacement })
      .expect(200);
    expect(changed.headers['set-cookie'][0]).toContain('__Host-whistle-session=;');
    for (const session of [cookie, cookieOf(second)])
      await request(app.getHttpServer())
        .get('/api/v1/auth/session')
        .set('Cookie', session)
        .expect(401);
    expect((await loginAs('auth.temporary', replacement.trim())).status).toBe(401);
    const personal = await loginAs('auth.temporary', replacement);
    expect(personal.status).toBe(200);
    expect(personal.body.data.changeRequired).toBe(false);
  });
  it('rejects an idle session at exact equality before any activity refresh', async () => {
    await createAccount('auth.idle');
    const logged = await loginAs('auth.idle');
    clock.set(new Date('2026-10-29T03:30:00Z'));
    const expired = await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookieOf(logged))
      .expect(401);
    expect(expired.body.error.code).toBe('SESSION_EXPIRED');
    const row = await observer.query(
      'SELECT last_activity_at FROM session s JOIN account a ON a.id=s.account_id WHERE a.username=$1',
      ['auth.idle'],
    );
    expect(row.rows[0].last_activity_at.toISOString()).toBe('2026-10-29T03:00:00.000Z');
  });
  it('expires at eight hours despite valid intervening activity', async () => {
    await createAccount('auth.absolute');
    const logged = await loginAs('auth.absolute');
    for (let minute = 29; minute < 480; minute += 29) {
      clock.set(new Date(Date.parse('2026-10-29T03:00:00Z') + minute * 60000));
      await request(app.getHttpServer())
        .get('/api/v1/auth/session')
        .set('Cookie', cookieOf(logged))
        .expect(200);
    }
    clock.set(new Date('2026-10-29T11:00:00Z'));
    const expired = await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookieOf(logged))
      .expect(401);
    expect(expired.body.error.code).toBe('SESSION_EXPIRED');
  });
  it('expires prelogin at fifteen minutes, renews bootstrap and consumes a successful context', async () => {
    await createAccount('auth.prelogin');
    const pre = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
    clock.set(new Date('2026-10-29T03:15:00Z'));
    const submit = () =>
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookieOf(pre, '__Host-whistle-csrf-context'))
        .set('X-CSRF-Token', pre.body.data.csrfToken)
        .send({ username: 'auth.prelogin', password });
    await submit().expect(403);
    const renewed = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf')
      .set('Cookie', cookieOf(pre, '__Host-whistle-csrf-context'))
      .expect(200);
    expect(renewed.body.data.csrfToken).not.toBe(pre.body.data.csrfToken);
    const login = () =>
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookieOf(renewed, '__Host-whistle-csrf-context'))
        .set('X-CSRF-Token', renewed.body.data.csrfToken)
        .send({ username: 'auth.prelogin', password });
    await login().expect(200);
    await login().expect(403);
  });
  it('uses generic failure for unknown, wrong, locked and exactly expired temporary credentials', async () => {
    await createAccount('auth.locked');
    await database.client.account.update({
      where: { username: 'auth.locked' },
      data: { state: 'LOCKED' },
    });
    await createAccount('auth.expired', true);
    await database.client.account.update({
      where: { username: 'auth.expired' },
      data: { temporaryPasswordExpiresAt: new Date('2026-10-29T03:00:00Z') },
    });
    const responses = [
      await loginAs('auth.unknown'),
      await loginAs('auth.staff', 'Incorrect personal password'),
      await loginAs('auth.locked'),
      await loginAs('auth.expired'),
    ];
    for (const response of responses) {
      expect(response.status).toBe(401);
      expect(response.body.error).toEqual({
        code: 'LOGIN_FAILED',
        message: 'Tên đăng nhập hoặc mật khẩu không hợp lệ.',
      });
      expect(response.headers['set-cookie']).toBeUndefined();
    }
  });
  it('rejects missing, forged and wrong-origin protection and accepts exact Referer fallback', async () => {
    await createAccount('auth.origin');
    const pre = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
    const submit = () =>
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Cookie', cookieOf(pre, '__Host-whistle-csrf-context'))
        .send({ username: 'auth.origin', password });
    await submit().set('X-CSRF-Token', pre.body.data.csrfToken).expect(403);
    await submit()
      .set('Origin', 'https://whistle.test.evil')
      .set('X-CSRF-Token', pre.body.data.csrfToken)
      .expect(403);
    await submit()
      .set('Origin', 'null')
      .set('Referer', 'https://whistle.test/login')
      .set('X-CSRF-Token', pre.body.data.csrfToken)
      .expect(403);
    await submit().set('Origin', 'https://whistle.test').expect(403);
    await submit()
      .set('Origin', 'https://whistle.test')
      .set('X-CSRF-Token', 'x'.repeat(43))
      .expect(403);
    const logged = await submit()
      .set('Referer', 'https://whistle.test/login')
      .set('X-CSRF-Token', pre.body.data.csrfToken)
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', cookieOf(logged))
      .send({})
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookieOf(logged))
      .expect(200);
  });
  it('rejects malformed or forbidden DTO fields without echoing secrets', async () => {
    const pre = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
    for (const body of [
      [],
      null,
      { username: 12, password },
      { username: 'auth.staff', password, authRevision: '999' },
      { username: 'a'.repeat(51), password },
      { username: 'ab', password },
      { username: 'auth.staff', password: 12 },
    ]) {
      const invalid = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookieOf(pre, '__Host-whistle-csrf-context'))
        .set('X-CSRF-Token', pre.body.data.csrfToken)
        .send(body ?? 'null')
        .expect(400);
      expect(JSON.stringify(invalid.body)).not.toContain(password);
    }
  });
  it('keeps password/hash/raw session/CSRF out of projections and audit, persisting only a token digest', async () => {
    await createAccount('auth.secrets');
    const logged = await loginAs('auth.secrets');
    const token = cookieOf(logged).split('=')[1];
    const rows = await observer.query(
      'SELECT s.token_hash,s.csrf_token FROM session s JOIN account a ON a.id=s.account_id WHERE a.username=$1',
      ['auth.secrets'],
    );
    expect(rows.rows[0].token_hash).toBe(new SecurityPrimitivesService().digest(token));
    const audits = await observer.query('SELECT * FROM audit_record WHERE object_id=$1', [
      logged.body.data.id,
    ]);
    expect(audits.rows.some((a) => a.action_code === 'LOGIN_SUCCEEDED')).toBe(true);
    const serialized = JSON.stringify({ response: logged.body, audits: audits.rows });
    for (const secret of [
      token,
      rows.rows[0].csrf_token,
      password,
      'passwordHash',
      'authRevision',
      '$argon2',
    ])
      expect(serialized).not.toContain(secret);
    expect((await observer.query('SELECT count(*)::int AS n FROM command_receipt')).rows[0].n).toBe(
      0,
    );
  });
  it('rejects stale authRevision and never revives a session after account unlock', async () => {
    const account = await createAccount('auth.revision');
    const logged = await loginAs('auth.revision');
    await database.write(
      [{ kind: 'account', key: account.id, mode: 'exclusive' }],
      async () => {},
      async (context) => {
        await context.db.account.update({
          where: { id: account.id },
          data: { state: 'LOCKED', authRevision: { increment: 1 } },
        });
      },
    );
    const denied = await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookieOf(logged))
      .expect(401);
    expect(denied.body.error.code).toBe('PERMISSION_CHANGED');
    expect(denied.body.error.message).toBe(
      'Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.',
    );
    await database.client.account.update({ where: { id: account.id }, data: { state: 'ACTIVE' } });
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookieOf(logged))
      .expect(401);
  });
  it('rechecks verified credentials after a real account lock wait during reset', async () => {
    const account = await createAccount('auth.reset.race');
    const replacement = await new SecurityPrimitivesService().hashPassword(
      'Reset replacement synthetic credential',
    );
    const held = await observer.connect();
    try {
      await held.query('BEGIN');
      const pid = (await held.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
      await held.query('SELECT id FROM account WHERE id=$1 FOR UPDATE', [account.id]);
      const login = loginAs('auth.reset.race');
      await waitForBlockedBy(observer, pid);
      // Controlled fixture reset at the account seam while issuance is waiting.
      await held.query(
        'UPDATE account SET password_hash=$2,auth_revision=auth_revision+1 WHERE id=$1',
        [account.id, replacement],
      );
      await held.query('COMMIT');
      expect((await login).status).toBe(401);
      expect(
        (
          await observer.query('SELECT count(*)::int n FROM session WHERE account_id=$1', [
            account.id,
          ])
        ).rows[0].n,
      ).toBe(0);
    } finally {
      await held.query('ROLLBACK');
      held.release();
    }
  });
  it('requires a full current session for internal routes and CSRF/origin for their mutations', async () => {
    await request(app.getHttpServer()).get('/api/v1/guard-probe').expect(401);
    await createAccount('auth.restricted', true);
    const restricted = await loginAs('auth.restricted');
    await request(app.getHttpServer())
      .get('/api/v1/guard-probe')
      .set('Cookie', cookieOf(restricted))
      .expect(403);
    const full = await loginAs('auth.staff');
    await request(app.getHttpServer())
      .get('/api/v1/guard-probe')
      .set('Cookie', cookieOf(full))
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/guard-probe')
      .set('Cookie', cookieOf(full))
      .send({})
      .expect(403);
    const csrf = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf')
      .set('Cookie', cookieOf(full))
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/guard-probe')
      .set('Cookie', cookieOf(full))
      .set('Origin', 'https://whistle.test')
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({})
      .expect(201);
  });
  it('rolls back session issuance and prelogin consumption if the required audit insert fails', async () => {
    const account = await createAccount('auth.audit.failure');
    const pre = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
    await observer.query(
      `CREATE FUNCTION auth_test_audit_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic storage failure'; END $$`,
    );
    await observer.query(
      `CREATE TRIGGER auth_test_audit_failure BEFORE INSERT ON audit_record FOR EACH ROW EXECUTE FUNCTION auth_test_audit_failure()`,
    );
    try {
      const failed = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookieOf(pre, '__Host-whistle-csrf-context'))
        .set('X-CSRF-Token', pre.body.data.csrfToken)
        .send({ username: account.username, password })
        .expect(500);
      expect(failed.headers['set-cookie']).toBeUndefined();
      expect(
        (
          await observer.query('SELECT count(*)::int n FROM session WHERE account_id=$1', [
            account.id,
          ])
        ).rows[0].n,
      ).toBe(0);
      const id = cookieOf(pre, '__Host-whistle-csrf-context').split('=')[1];
      expect(
        (await observer.query('SELECT consumed_at FROM prelogin_csrf_context WHERE id=$1', [id]))
          .rows[0].consumed_at,
      ).toBeNull();
    } finally {
      await observer.query('DROP TRIGGER auth_test_audit_failure ON audit_record');
      await observer.query('DROP FUNCTION auth_test_audit_failure()');
    }
  });
  it('rolls back password and revocation on audit failure and rejects unacceptable/currently wrong credentials', async () => {
    const account = await createAccount('auth.change.failure');
    const logged = await loginAs(account.username);
    const cookie = cookieOf(logged);
    const csrf = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf')
      .set('Cookie', cookie)
      .expect(200);
    const change = (currentPassword: string, newPassword: string) =>
      request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookie)
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .send({ currentPassword, newPassword });
    for (const replacement of ['a'.repeat(14), '🦉'.repeat(129), '\ud800'.repeat(15)])
      await change(password, replacement).expect(400);
    await change('incorrect personal credential', 'New acceptable personal credential').expect(400);
    await observer.query(
      `CREATE FUNCTION auth_test_change_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action_code='PASSWORD_CHANGED' THEN RAISE EXCEPTION 'synthetic storage failure'; END IF; RETURN NEW; END $$`,
    );
    await observer.query(
      'CREATE TRIGGER auth_test_change_failure BEFORE INSERT ON audit_record FOR EACH ROW EXECUTE FUNCTION auth_test_change_failure()',
    );
    try {
      await change(password, 'New acceptable personal credential').expect(500);
      const rows = await observer.query(
        'SELECT password_hash,auth_revision FROM account WHERE id=$1',
        [account.id],
      );
      expect(rows.rows[0].password_hash).toBe(account.passwordHash);
      expect(rows.rows[0].auth_revision).toBe('1');
      await request(app.getHttpServer())
        .get('/api/v1/auth/session')
        .set('Cookie', cookie)
        .expect(200);
    } finally {
      await observer.query('DROP TRIGGER auth_test_change_failure ON audit_record');
      await observer.query('DROP FUNCTION auth_test_change_failure()');
    }
  });
  it('uses post-lock time and refuses session activity once expiry passes during a wait', async () => {
    const account = await createAccount('auth.wait.expiry');
    const logged = await loginAs(account.username);
    const held = await observer.connect();
    try {
      await held.query('BEGIN');
      const pid = (await held.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
      await held.query('SELECT id FROM account WHERE id=$1 FOR UPDATE', [account.id]);
      const pending = request(app.getHttpServer())
        .get('/api/v1/auth/session')
        .set('Cookie', cookieOf(logged))
        .then((response) => response);
      await waitForBlockedBy(observer, pid);
      clock.set(new Date('2026-10-29T03:30:00Z'));
      await held.query('COMMIT');
      expect((await pending).body.error.code).toBe('SESSION_EXPIRED');
    } finally {
      await held.query('ROLLBACK');
      held.release();
    }
  });
  it('includes prelogin/session/login/password/logout state writers in maintenance admission', async () => {
    const account = await createAccount('auth.maintenance');
    const logged = await loginAs(account.username);
    const cookie = cookieOf(logged);
    const csrf = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf')
      .set('Cookie', cookie)
      .expect(200);
    const pre = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
    await database.setMaintenance(true, 'dd94f969-cac2-4c6b-a070-5a3928752488');
    try {
      await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(503);
      await request(app.getHttpServer())
        .get('/api/v1/auth/session')
        .set('Cookie', cookie)
        .expect(503);
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookieOf(pre, '__Host-whistle-csrf-context'))
        .set('X-CSRF-Token', pre.body.data.csrfToken)
        .send({ username: account.username, password })
        .expect(503);
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookie)
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .send({})
        .expect(503);
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookie)
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .send({ currentPassword: password, newPassword: 'New acceptable personal credential' })
        .expect(503);
    } finally {
      await database.setMaintenance(false, 'dd94f969-cac2-4c6b-a070-5a3928752488');
    }
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookie)
      .expect(200);
  });
  it('accepts bodyless logout and rejects unknown logout fields', async () => {
    await createAccount('auth.bodyless');
    const logged = await loginAs('auth.bodyless');
    const csrf = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf')
      .set('Cookie', cookieOf(logged))
      .expect(200);
    const logout = () =>
      request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookieOf(logged))
        .set('X-CSRF-Token', csrf.body.data.csrfToken);
    await logout().send({ accountId: logged.body.data.id }).expect(400);
    await logout().expect(200);
  });
  it('checks current session and CSRF before giving any current-password feedback', async () => {
    const account = await createAccount('auth.password.oracle');
    const logged = await loginAs(account.username);
    const cookie = cookieOf(logged);
    const change = (csrf: string) =>
      request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookie)
        .set('X-CSRF-Token', csrf)
        .send({
          currentPassword: 'incorrect password',
          newPassword: 'New acceptable personal credential',
        });
    await change('forged').expect(403);
    clock.set(new Date('2026-10-29T03:30:00Z'));
    await change('forged').expect(401);
  });
  it('records activity through the full-session guard and clears expired cookies with the protected scope', async () => {
    await createAccount('auth.guard.activity');
    const logged = await loginAs('auth.guard.activity');
    const cookie = cookieOf(logged);
    clock.set(new Date('2026-10-29T03:29:00Z'));
    await request(app.getHttpServer()).get('/api/v1/guard-probe').set('Cookie', cookie).expect(200);
    clock.set(new Date('2026-10-29T03:31:00Z'));
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookie)
      .expect(200);
    clock.set(new Date('2026-10-29T04:01:00Z'));
    const expired = await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookie)
      .expect(401);
    const clearing = expired.headers['set-cookie'][0];
    expect(clearing).toContain('__Host-whistle-session=;');
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/'])
      expect(clearing).toContain(flag);
    const renewed = await request(app.getHttpServer())
      .get('/api/v1/auth/csrf')
      .set('Cookie', cookie)
      .expect(200);
    expect(renewed.headers['set-cookie'][0]).toContain('__Host-whistle-session=;');
  });
  it('ignores spoofed forwarding headers except from the configured immediate Caddy peer', async () => {
    const before = process.env.AUTH_TRUSTED_PROXY_CIDRS;
    try {
      delete process.env.AUTH_TRUSTED_PROXY_CIDRS;
      const pre = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
      const attempt = (source: string) =>
        request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .set('Origin', 'https://whistle.test')
          .set('X-Forwarded-For', source)
          .set('Cookie', cookieOf(pre, '__Host-whistle-csrf-context'))
          .set('X-CSRF-Token', pre.body.data.csrfToken)
          .send({ username: 'source.unknown', password });
      await attempt('192.0.2.91').expect(401);
      expect(
        (
          await observer.query(
            'SELECT count(*)::int n FROM login_throttle_key WHERE kind=$1 AND key=$2',
            ['IP', '192.0.2.91'],
          )
        ).rows[0].n,
      ).toBe(0);
      process.env.AUTH_TRUSTED_PROXY_CIDRS = '127.0.0.1/32';
      await attempt('192.0.2.92').expect(401);
      expect(
        (
          await observer.query(
            'SELECT count(*)::int n FROM login_throttle_key WHERE kind=$1 AND key=$2',
            ['IP', '192.0.2.92'],
          )
        ).rows[0].n,
      ).toBe(1);
      await attempt('192.0.2.92, 192.0.2.93').expect(400);
      await attempt('invalid-address').expect(400);
    } finally {
      if (before === undefined) delete process.env.AUTH_TRUSTED_PROXY_CIDRS;
      else process.env.AUTH_TRUSTED_PROXY_CIDRS = before;
    }
  });
  it('expires a restricted session at the temporary credential deadline and accepts 15/128 code-point personal passwords', async () => {
    const account = await createAccount('auth.temp.deadline', true);
    await database.client.account.update({
      where: { id: account.id },
      data: { temporaryPasswordExpiresAt: new Date('2026-10-29T03:00:00.001Z') },
    });
    const logged = await loginAs(account.username);
    expect(logged.status).toBe(200);
    clock.set(new Date('2026-10-29T03:00:00.001Z'));
    await request(app.getHttpServer())
      .get('/api/v1/auth/session')
      .set('Cookie', cookieOf(logged))
      .expect(401);
    clock.set(new Date('2026-10-29T03:00:00Z'));
    await createAccount('auth.password.limits');
    let current = password;
    for (const replacement of ['🦉'.repeat(15), ' 🦉'.repeat(64)]) {
      const personal = await loginAs('auth.password.limits', current);
      const cookie = cookieOf(personal);
      const csrf = await request(app.getHttpServer())
        .get('/api/v1/auth/csrf')
        .set('Cookie', cookie)
        .expect(200);
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookie)
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .send({ currentPassword: current, newPassword: replacement })
        .expect(200);
      current = replacement;
    }
    expect((await loginAs('auth.password.limits', current)).status).toBe(200);
  });
  it('rechecks prelogin expiry at issuance after blocked counter storage', async () => {
    const account = await createAccount('auth.prelogin.final');
    const pre = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
    const held = await observer.connect();
    await observer.query(
      `CREATE FUNCTION auth_test_counter_wait() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='USERNAME' AND NEW.key='auth.prelogin.final' THEN PERFORM pg_advisory_xact_lock(782141); END IF; RETURN NEW; END $$`,
    );
    await observer.query(
      'CREATE TRIGGER auth_test_counter_wait BEFORE INSERT ON login_throttle_key FOR EACH ROW EXECUTE FUNCTION auth_test_counter_wait()',
    );
    try {
      await held.query('BEGIN');
      const pid = (await held.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
      await held.query('SELECT pg_advisory_xact_lock(782141)');
      clock.set(new Date('2026-10-29T03:14:59.999Z'));
      const pending = request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookieOf(pre, '__Host-whistle-csrf-context'))
        .set('X-CSRF-Token', pre.body.data.csrfToken)
        .send({ username: account.username, password })
        .then((response) => response);
      await waitForBlockedBy(observer, pid);
      clock.set(new Date('2026-10-29T03:15:00Z'));
      await held.query('COMMIT');
      expect((await pending).status).toBe(403);
      expect(
        (
          await observer.query('SELECT count(*)::int n FROM session WHERE account_id=$1', [
            account.id,
          ])
        ).rows[0].n,
      ).toBe(0);
    } finally {
      await held.query('ROLLBACK');
      held.release();
      await observer.query('DROP TRIGGER auth_test_counter_wait ON login_throttle_key');
      await observer.query('DROP FUNCTION auth_test_counter_wait()');
    }
  });
  it('counts a credential expiring during counter storage as failure without resetting its username sequence', async () => {
    const account = await createAccount('auth.temp.final', true);
    await database.client.account.update({
      where: { id: account.id },
      data: { temporaryPasswordExpiresAt: new Date('2026-10-29T03:15:00Z') },
    });
    clock.set(new Date('2026-10-29T03:01:00Z'));
    const pre = await request(app.getHttpServer()).get('/api/v1/auth/csrf').expect(200);
    // Isolated fixture: retained failure evidence, no pre-existing throttle-key row.
    await database.client.loginFailure.createMany({
      data: Array.from({ length: 4 }, () => ({
        usernameKey: account.username,
        ipKey: '192.0.2.131',
        occurredAt: new Date('2026-10-29T03:01:00Z'),
      })),
    });
    const held = await observer.connect();
    await observer.query(
      `CREATE FUNCTION auth_test_expiring_password() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.kind='USERNAME' AND NEW.key='auth.temp.final' THEN PERFORM pg_advisory_xact_lock(782142); END IF; RETURN NEW; END $$`,
    );
    await observer.query(
      'CREATE TRIGGER auth_test_expiring_password BEFORE INSERT ON login_throttle_key FOR EACH ROW EXECUTE FUNCTION auth_test_expiring_password()',
    );
    try {
      await held.query('BEGIN');
      const pid = (await held.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
      await held.query('SELECT pg_advisory_xact_lock(782142)');
      clock.set(new Date('2026-10-29T03:14:59.999Z'));
      const pending = request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Origin', 'https://whistle.test')
        .set('Cookie', cookieOf(pre, '__Host-whistle-csrf-context'))
        .set('X-CSRF-Token', pre.body.data.csrfToken)
        .send({ username: account.username, password })
        .then((response) => response);
      await waitForBlockedBy(observer, pid);
      clock.set(new Date('2026-10-29T03:15:00Z'));
      await held.query('COMMIT');
      expect((await pending).status).toBe(401);
      expect(
        (
          await observer.query(
            'SELECT count(*)::int n FROM login_failure WHERE username_key=$1 AND username_sequence_active',
            [account.username],
          )
        ).rows[0].n,
      ).toBe(5);
      expect(
        (
          await observer.query('SELECT count(*)::int n FROM session WHERE account_id=$1', [
            account.id,
          ])
        ).rows[0].n,
      ).toBe(0);
    } finally {
      await held.query('ROLLBACK');
      held.release();
      await observer.query('DROP TRIGGER auth_test_expiring_password ON login_throttle_key');
      await observer.query('DROP FUNCTION auth_test_expiring_password()');
    }
  });
});
