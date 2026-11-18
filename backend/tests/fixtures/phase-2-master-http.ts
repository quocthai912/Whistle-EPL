import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mkdtemp, readdir, rmdir, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import { SecurityPrimitivesService } from '../../src/identity-access/security-primitives.service';
import { DatabaseService } from '../../src/platform/database.service';
import { SafeErrorFilter } from '../../src/platform/error.filter';
import { ResponseEnvelopeInterceptor } from '../../src/platform/response-envelope.interceptor';
import { SafeValidationPipe } from '../../src/platform/validation.pipe';
import { createPhase1Fixtures, resetPhase1Fixtures } from './phase-1-fixtures';
import { LocalMediaStore } from '../../src/media/local-media.store';
import { assertAvailableForNewUse } from '../../src/platform/master-availability';

export function setupMasterHttpFixture() {
  const databaseUrl = process.env.TEST_DATABASE_URL!;
  const database = new DatabaseService(databaseUrl);
  const security = new SecurityPrimitivesService();
  const origin = 'https://whistle.test';
  let app: INestApplication;
  let fixtures: Awaited<ReturnType<typeof createPhase1Fixtures>>;
  let previousOrigin: string | undefined;
  let mediaRoot: string;
  let storage: LocalMediaStore;

  beforeAll(async () => {
    previousOrigin = process.env.AUTH_ORIGIN;
    process.env.AUTH_ORIGIN = origin;
    mediaRoot = await mkdtemp(join(tmpdir(), 'whistle-club-logo-test-'));
    storage = new LocalMediaStore(mediaRoot, 'local');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue(database)
      .overrideProvider(LocalMediaStore)
      .useValue(storage)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new SafeValidationPipe());
    app.useGlobalFilters(new SafeErrorFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
  });

  beforeEach(async () => {
    await resetPhase1Fixtures(databaseUrl, 'RESET_ISOLATED_TEST_DATABASE');
    fixtures = await createPhase1Fixtures(databaseUrl);
  });

  afterAll(async () => {
    await app?.close();
    await database.close();
    if (mediaRoot) {
      for (const file of await readdir(mediaRoot)) await unlink(join(mediaRoot, file));
      await rmdir(mediaRoot);
    }
    if (previousOrigin === undefined) delete process.env.AUTH_ORIGIN;
    else process.env.AUTH_ORIGIN = previousOrigin;
  });

  async function authenticate(accountId: string) {
    const account = await database.client.account.update({
      where: { id: accountId },
      data: { mustChangePassword: false, temporaryPasswordExpiresAt: null },
    });
    const tokens = security.createSessionTokens();
    const now = await database.now();
    await database.client.session.create({
      data: {
        accountId,
        tokenHash: tokens.tokenHash,
        csrfToken: tokens.csrfToken,
        accountAuthRevision: account.authRevision,
        createdAt: now,
        lastActivityAt: now,
        absoluteExpiresAt: security.sessionExpiry(now),
      },
    });
    return tokens;
  }

  function createClub(tokens: Awaited<ReturnType<typeof authenticate>>, input: object) {
    return request(app.getHttpServer())
      .post('/api/v1/clubs')
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', origin)
      .set('X-CSRF-Token', tokens.csrfToken)
      .send(input);
  }

  function readClub(tokens: Awaited<ReturnType<typeof authenticate>>, suffix = '') {
    return request(app.getHttpServer())
      .get(`/api/v1/clubs${suffix}`)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`);
  }

  function updateClub(tokens: Awaited<ReturnType<typeof authenticate>>, id: string, input: object) {
    return request(app.getHttpServer())
      .patch(`/api/v1/clubs/${id}`)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', origin)
      .set('X-CSRF-Token', tokens.csrfToken)
      .send(input);
  }

  async function clubManager() {
    const accountId = fixtures.accounts[2].id;
    await database.client.sharedMasterGrant.create({
      data: {
        accountId,
        masterKind: 'CLUB_MASTER',
        grantedBy: fixtures.accounts[0].id,
        grantedAt: await database.now(),
      },
    });
    return authenticate(accountId);
  }

  const club = { code: '  river_fc  ', name: '  Câu   lạc bộ River  ', abbreviation: 'RFC' };

  function writeMaster(
    tokens: Awaited<ReturnType<typeof authenticate>>,
    method: 'post' | 'patch',
    path: string,
    body: object,
  ) {
    const api = request(app.getHttpServer());
    return api[method]('/api/v1' + path)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', origin)
      .set('X-CSRF-Token', tokens.csrfToken)
      .send(body);
  }

  async function stadiumManager() {
    const accountId = fixtures.accounts[3].id;
    await database.client.sharedMasterGrant.create({
      data: {
        accountId,
        masterKind: 'STADIUM_MASTER',
        grantedBy: fixtures.accounts[0].id,
        grantedAt: await database.now(),
      },
    });
    return authenticate(accountId);
  }

  return {
    database,
    origin,
    authenticate,
    createClub,
    readClub,
    updateClub,
    clubManager,
    stadiumManager,
    writeMaster,
    club,
    get fixtures() {
      return fixtures;
    },
    get app() {
      return app;
    },
    get storage() {
      return storage;
    },
    get mediaRoot() {
      return mediaRoot;
    },
  };
}

/** GUARD_SIMULATION: a later owner delays between final availability check and its commitment. */
export async function waitBehindMasterUse<T>(
  database: DatabaseService,
  kind: 'club' | 'stadium',
  id: string,
  discontinue: () => PromiseLike<T>,
) {
  let locked!: () => void;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    locked = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const owner = database.write(
    [{ kind, key: id, mode: 'exclusive' }],
    async () => {},
    async (context) => {
      await assertAvailableForNewUse(context, kind, id);
      locked();
      await gate;
    },
  );
  let transition: Promise<T> | undefined;
  let waiting = false;
  try {
    await Promise.race([ready, owner]);
    transition = Promise.resolve(discontinue());
    const deadline = Date.now() + 10_000;
    const lockQuery = `%FROM "${kind}"%FOR UPDATE%`;
    while (Date.now() < deadline && !waiting) {
      const [{ blocked }] = await database.client.$queryRaw<{ blocked: boolean }[]>`
        SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE datname=current_database()
          AND wait_event_type='Lock' AND query ILIKE ${lockQuery}) AS blocked
      `;
      waiting = blocked;
      if (!waiting) await new Promise((resolve) => setTimeout(resolve, 10));
    }
  } finally {
    release();
    await owner;
  }
  return { waiting, response: await transition! };
}
