import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import type { Request } from 'express';
import { AuthService } from '../../src/identity-access/auth.service';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import { SecurityPrimitivesService } from '../../src/identity-access/security-primitives.service';
import { AuditQueryService } from '../../src/audit/audit-query.service';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { createSeasonDependenciesService } from '../../src/app.module';
import {
  BusinessHistoryService,
  type BusinessHistoryScope,
} from '../../src/audit/business-history.service';
import { ApplicationError } from '../../src/platform/application-error';
import {
  BusinessExecutionService,
  type BusinessReceiptIntent,
} from '../../src/platform/business-execution';
import {
  HttpBusinessExecutionAdapter,
  type HttpBusinessOperation,
} from '../../src/platform/http-business-execution';
import { DatabaseService } from '../../src/platform/database.service';
import type { ReceiptCommand, ReceiptOutcome } from '../../src/platform/command-receipt.service';
import type { LockResource } from '../../src/platform/transaction-context';
import { TestClock } from '../fixtures/test-clock';
import request from 'supertest';
import { setupMasterHttpFixture } from '../fixtures/phase-2-master-http';

const passwordHash = '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture';

describe('PHASE 2 actual HTTP master security and literal input', () => {
  const fixture = setupMasterHttpFixture();

  it.each([
    ['missing session', 'anonymous', 401],
    ['season role without shared grant', 'role', 403],
    ['foreign shared grant', 'foreign', 403],
    ['missing origin', 'no-origin', 403],
    ['foreign origin', 'origin', 403],
    ['missing CSRF', 'no-csrf', 403],
    ['wrong CSRF', 'csrf', 403],
    ['revoked session', 'revoked', 401],
    ['expired session', 'expired', 401],
    ['revoked shared grant', 'grant', 403],
  ])('rejects %s without creating a master', async (_label, scenario, expectedStatus) => {
    const tokens =
      scenario === 'foreign'
        ? await fixture.stadiumManager()
        : scenario === 'role'
          ? await fixture.authenticate(fixture.fixtures.accounts[2].id)
          : await fixture.clubManager();
    if (scenario === 'revoked')
      await fixture.database.client.session.updateMany({
        data: { revokedAt: await fixture.database.now(), revocationReason: 'LOGOUT' },
      });
    if (scenario === 'expired') {
      const issued = new Date((await fixture.database.now()).getTime() - 1_900_000);
      await fixture.database.client.session.updateMany({
        data: {
          createdAt: issued,
          lastActivityAt: issued,
          absoluteExpiresAt: new Date(issued.getTime() + 28_800_000),
        },
      });
    }
    if (scenario === 'grant')
      await fixture.database.client.sharedMasterGrant.updateMany({
        data: { endedAt: await fixture.database.now(), endReason: 'Fixture revocation' },
      });
    const call = request(fixture.app.getHttpServer()).post('/api/v1/clubs');
    if (scenario !== 'anonymous') call.set('Cookie', `${SESSION_COOKIE}=${tokens.token}`);
    if (scenario !== 'no-origin')
      call.set('Origin', scenario === 'origin' ? 'https://foreign.invalid' : fixture.origin);
    if (scenario !== 'no-csrf')
      call.set('X-CSRF-Token', scenario === 'csrf' ? 'incorrect' : tokens.csrfToken);
    await call.send(fixture.club).expect(expectedStatus);
    expect(await fixture.database.client.club.count()).toBe(0);
    expect(
      await fixture.database.client.auditRecord.count({ where: { actionCode: 'CLUB_CREATED' } }),
    ).toBe(0);
  });

  it('treats SQL and markup as literal text and rejects unsupported search and form fields', async () => {
    const tokens = await fixture.clubManager();
    const name = `CLB <script>alert("fixture")</script> %_ ' OR 1=1 -- Đà Nẵng`;
    const result = await fixture.createClub(tokens, { ...fixture.club, name }).expect(201);
    for (const [code, decoyName] of [
      ['PERCENT_DECOY', name.replace('%', 'X')],
      ['UNDERSCORE_DECOY', name.replace('_', 'Y')],
    ])
      await fixture.createClub(tokens, { ...fixture.club, code, name: decoyName }).expect(201);
    const search = await fixture
      .readClub(tokens, '?search=' + encodeURIComponent(name))
      .expect(200);
    expect(search.body.data.items).toMatchObject([{ id: result.body.data.id, name }]);
    expect(search.body.meta.total).toBe(1);
    await fixture.readClub(tokens, '?unsupported=1').expect(400);
    await fixture.createClub(tokens, { ...fixture.club, unsupported: true }).expect(400);
    const before = await fixture.database.client.club.findUniqueOrThrow({
      where: { id: result.body.data.id },
    });
    await fixture
      .updateClub(tokens, result.body.data.id, {
        expectedRevision: '1',
        id: randomUUID(),
        name: 'Unexpected identity',
      })
      .expect(400);
    const after = await fixture.database.client.club.findUniqueOrThrow({
      where: { id: result.body.data.id },
    });
    expect(after.name).toBe(before.name);
    expect(after.revision).toBe(before.revision);
    expect(await fixture.database.client.club.count()).toBe(3);
  });
});

describe('PHASE 2 shared business execution security', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL!;
  const database = new DatabaseService(databaseUrl);
  const business = new BusinessExecutionService(database);
  const observer = new Pool({ connectionString: databaseUrl });
  const security = new SecurityPrimitivesService();
  const auth = new AuthService(database, security);
  const httpBusiness = new HttpBusinessExecutionAdapter(auth, business);
  const history = new BusinessHistoryService(database, auth);

  afterAll(async () => {
    await database.close();
    await observer.end();
  });

  async function createAccount(prefix = 'P2') {
    const id = randomUUID();
    return database.client.account.create({
      data: {
        id,
        personnelCode: `${prefix}_${id.replaceAll('-', '').slice(0, 20).toUpperCase()}`,
        fullName: 'Nhân viên kiểm thử bảo mật',
        username: `${prefix.toLowerCase()}.${id}`,
        passwordHash,
        mustChangePassword: true,
      },
    });
  }

  async function createLiveAccount(prefix = 'HTTP') {
    const initial = await createAccount(prefix);
    const account = await database.client.account.update({
      where: { id: initial.id },
      data: { mustChangePassword: false },
    });
    const tokens = security.createSessionTokens();
    const createdAt = await database.now();
    await database.client.session.create({
      data: {
        accountId: account.id,
        tokenHash: tokens.tokenHash,
        csrfToken: tokens.csrfToken,
        accountAuthRevision: account.authRevision,
        createdAt,
        lastActivityAt: createdAt,
        absoluteExpiresAt: security.sessionExpiry(createdAt),
      },
    });
    return { account, tokens };
  }

  function httpRequest(
    tokens: { token: string; csrfToken: string },
    headers: Record<string, string> = {},
  ): Request {
    const values = new Map(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
    );
    values.set('cookie', `${SESSION_COOKIE}=${tokens.token}`);
    values.set('x-csrf-token', headers['X-CSRF-Token'] ?? tokens.csrfToken);
    const request = {
      method: 'POST',
      headers: { cookie: values.get('cookie') },
      get(name: string) {
        return values.get(name.toLowerCase());
      },
    };
    return request as unknown as Request;
  }

  async function createSeasonGrant(accountId: string) {
    return database.client.createSeasonGrant.create({
      data: { accountId, grantedBy: accountId, grantedAt: new Date() },
    });
  }

  function creatorScope(accountId: string, normalizedCode: string) {
    return {
      principal: { kind: 'session' as const, accountId },
      locks: [
        { kind: 'account' as const, key: accountId, mode: 'shared' as const },
        {
          kind: 'security' as const,
          key: `season-code:${normalizedCode}`,
          mode: 'exclusive' as const,
        },
        {
          kind: 'seasonCollection' as const,
          key: 'SeasonCollection' as const,
          mode: 'shared' as const,
        },
      ],
      authority: async (context: Parameters<Parameters<typeof database.write>[1]>[0]) => {
        const account = await context.db.account.findUnique({ where: { id: accountId } });
        const grant = await context.db.createSeasonGrant.findFirst({
          where: { accountId, revokedAt: null },
        });
        if (!account || account.state !== 'ACTIVE' || !grant)
          throw new ApplicationError(403, 'ACCESS_DENIED', 'Không có quyền tạo mùa giải.');
      },
    };
  }

  function seasonIntent(key: string, code: string): BusinessReceiptIntent {
    return {
      action: 'SEASON_CREATED',
      key,
      targetId: 'SeasonCollection',
      payload: {
        code,
        name: '  Mùa   giải\n kiểm thử  ',
        competitionName: ' Premier   League Test ',
        startDate: '2027-08-01',
        endDate: '2028-05-31',
      },
    };
  }

  function seasonWork() {
    let attempts = 0;
    const work = async (
      context: Parameters<Parameters<typeof database.write>[2]>[0],
      command: ReceiptCommand,
    ): Promise<ReceiptOutcome> => {
      attempts++;
      const code = command.payload.code;
      if (await context.db.season.findUnique({ where: { code } }))
        throw new ApplicationError(409, 'DUPLICATE_CODE', 'Mã mùa giải đã tồn tại.');
      const season = await context.db.season.create({
        data: {
          id: randomUUID(),
          code,
          name: command.payload.name,
          competitionName: command.payload.competitionName,
          startDate: new Date(`${command.payload.startDate}T00:00:00.000Z`),
          endDate: new Date(`${command.payload.endDate}T00:00:00.000Z`),
        },
      });
      return { status: 201, data: { id: season.id, revision: String(season.revision) } };
    };
    return { work, attempts: () => attempts };
  }

  const identityProject = async (_context: unknown, outcome: ReceiptOutcome) => outcome;

  it('refuses a business operation without its explicit authority policy', () => {
    expect(() => business.execute({ locks: [] } as never, async () => true)).toThrow(
      'Every business operation requires an explicit authority check.',
    );
  });

  it('checks only installed source adapters at startup and leaves later owners unavailable', async () => {
    const dependencies = await createSeasonDependenciesService(database);
    const discovery = await database.client.$transaction((context) =>
      dependencies.discover('registrationCompatibility', context, {
        seasonId: randomUUID(),
        candidateVersionId: randomUUID(),
      }),
    );
    expect(discovery).toMatchObject({
      status: 'VERIFIED_NOT_INTRODUCED',
      basis: {
        absentRelations: ['player_registration', 'registration_version'],
        registeredWriters: [],
      },
    });
  });

  it('binds HTTP critical writes to the live session and enforces origin, CSRF and current operation authority', async () => {
    const previousOrigin = process.env.AUTH_ORIGIN;
    process.env.AUTH_ORIGIN = 'https://whistle.test';
    try {
      const { account, tokens } = await createLiveAccount('HTTPM');
      await createSeasonGrant(account.id);
      const seasonId = randomUUID();
      const command = {
        action: 'SEASON_CREATED' as const,
        targetId: 'SeasonCollection',
        payload: {
          code: `HTTP_${seasonId.replaceAll('-', '').slice(0, 20).toUpperCase()}`,
          name: 'HTTP adapter season',
          competitionName: 'Premier League Test',
          startDate: '2027-08-01',
          endDate: '2028-05-31',
        },
      };
      const operation: HttpBusinessOperation = {
        locks: [
          {
            kind: 'security',
            key: `season-code:${command.payload.code}`,
            mode: 'exclusive',
          },
          { kind: 'seasonCollection', key: 'SeasonCollection', mode: 'shared' },
        ],
        authorize: async (context, accountId) => {
          const grant = await context.db.createSeasonGrant.findFirst({
            where: { accountId, revokedAt: null },
          });
          if (!grant)
            throw new ApplicationError(403, 'ACCESS_DENIED', 'Create authority required.');
        },
      };
      let effects = 0;
      const write = (request: Request) =>
        httpBusiness.executeCritical(
          request,
          operation,
          command,
          async (context, receipt) => {
            effects++;
            expect(receipt.accountId).toBe(account.id);
            const season = await context.db.season.create({
              data: {
                id: seasonId,
                code: receipt.payload.code,
                name: receipt.payload.name,
                competitionName: receipt.payload.competitionName,
                startDate: new Date(`${receipt.payload.startDate}T00:00:00.000Z`),
                endDate: new Date(`${receipt.payload.endDate}T00:00:00.000Z`),
              },
            });
            await new AuditWriterService().append(context, {
              actor: { kind: 'ACCOUNT', accountId: receipt.accountId },
              action: 'SEASON_CREATED',
              objectKind: 'Season',
              objectId: season.id,
              seasonId: season.id,
              outcome: 'SUCCESS',
              after: {
                code: season.code,
                name: season.name,
                competitionName: season.competitionName,
                startDate: '2027-08-01',
                endDate: '2028-05-31',
              },
            });
            return { status: 201, data: { id: season.id, revision: String(season.revision) } };
          },
          identityProject,
        );

      const key = randomUUID();
      const request = httpRequest(tokens, {
        Origin: 'https://whistle.test',
        'Idempotency-Key': key,
      });
      const first = await write(request);
      expect(first.status).toBe(201);
      expect(await write(request)).toEqual(first);
      expect(effects).toBe(1);
      expect(
        await database.client.commandReceipt.count({
          where: { accountId: account.id, actionCode: 'SEASON_CREATED', requestKey: key },
        }),
      ).toBe(1);
      expect(
        await database.client.auditRecord.findFirstOrThrow({
          where: { objectKind: 'Season', objectId: seasonId, actionCode: 'SEASON_CREATED' },
        }),
      ).toMatchObject({ actorKind: 'ACCOUNT', actorId: account.id });

      await expect(
        write(httpRequest(tokens, { 'Idempotency-Key': randomUUID() })),
      ).rejects.toMatchObject({ code: 'CSRF_REJECTED' });
      await expect(
        write(
          httpRequest(tokens, {
            Origin: 'https://whistle.test',
            'X-CSRF-Token': 'invalid-token',
            'Idempotency-Key': randomUUID(),
          }),
        ),
      ).rejects.toMatchObject({ code: 'CSRF_REJECTED' });

      const admin = await createLiveAccount('HTTPA');
      await database.client.systemRoleAssignment.create({
        data: {
          accountId: admin.account.id,
          roleCode: 'SYSTEM_ADMINISTRATOR',
          grantedBy: admin.account.id,
          grantedAt: await database.now(),
        },
      });
      const noCreateAuthority: HttpBusinessOperation = {
        ...operation,
        authorize: async (context, accountId) => {
          const grant = await context.db.createSeasonGrant.findFirst({
            where: { accountId, revokedAt: null },
          });
          if (!grant)
            throw new ApplicationError(403, 'ACCESS_DENIED', 'Create authority required.');
        },
      };
      await expect(
        httpBusiness.execute(
          httpRequest(admin.tokens, { Origin: 'https://whistle.test' }),
          noCreateAuthority,
          async () => true,
        ),
      ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
      expect(await database.client.season.findUnique({ where: { id: seasonId } })).not.toBeNull();
    } finally {
      if (previousOrigin === undefined) delete process.env.AUTH_ORIGIN;
      else process.env.AUTH_ORIGIN = previousOrigin;
    }
  });

  it('requires owning object-read authority for business history while keeping UC04 metadata-only', async () => {
    const manager = await createLiveAccount('HISTM');
    const admin = await createLiveAccount('HISTA');
    const seasonId = randomUUID();
    const season = await database.client.season.create({
      data: {
        id: seasonId,
        code: `HISTORY_${seasonId.replaceAll('-', '').slice(0, 20).toUpperCase()}`,
        name: 'History season before',
        competitionName: 'Premier League Test',
        startDate: new Date('2027-08-01T00:00:00Z'),
        endDate: new Date('2028-05-31T00:00:00Z'),
      },
    });
    const now = await database.now();
    await database.client.seasonRoleAssignment.create({
      data: {
        accountId: manager.account.id,
        seasonId,
        roleCode: 'SEASON_MANAGER',
        grantedBy: manager.account.id,
        grantedAt: now,
      },
    });
    await database.client.systemRoleAssignment.create({
      data: {
        accountId: admin.account.id,
        roleCode: 'SYSTEM_ADMINISTRATOR',
        grantedBy: admin.account.id,
        grantedAt: now,
      },
    });
    const clubId = randomUUID();
    await database.client.club.create({
      data: {
        id: clubId,
        code: `HIST_${clubId.slice(0, 8).toUpperCase()}`,
        name: 'History Club',
        abbreviation: 'HCL',
      },
    });
    await business.execute(
      {
        principal: { kind: 'session', accountId: manager.account.id },
        locks: [
          { kind: 'account', key: manager.account.id, mode: 'shared' },
          { kind: 'season', key: seasonId, mode: 'exclusive' },
          { kind: 'club', key: clubId, mode: 'exclusive' },
        ],
        authority: async () => {},
      },
      async (context) => {
        await new AuditWriterService().append(context, {
          actor: { kind: 'ACCOUNT', accountId: manager.account.id },
          action: 'SEASON_UPDATED',
          objectKind: 'Season',
          objectId: season.id,
          seasonId,
          outcome: 'SUCCESS',
          before: { name: 'History season before' },
          after: { name: 'History season after' },
        });
        await new AuditWriterService().append(context, {
          actor: { kind: 'ACCOUNT', accountId: manager.account.id },
          action: 'CLUB_UPDATED',
          objectKind: 'Club',
          objectId: clubId,
          seasonId,
          outcome: 'SUCCESS',
          before: { name: 'History Club' },
          after: { name: 'History Club updated' },
        });
      },
    );

    const scope: BusinessHistoryScope = {
      kind: 'Season' as const,
      id: seasonId,
      locks: [{ kind: 'season' as const, key: seasonId, mode: 'shared' as const }],
      authorize: async (context, accountId) => {
        const currentRole = await context.db.seasonRoleAssignment.count({
          where: {
            accountId,
            seasonId,
            roleCode: 'SEASON_MANAGER',
            revokedAt: null,
          },
        });
        if (!currentRole)
          throw new ApplicationError(
            403,
            'ACCESS_DENIED',
            'Current season read authority required.',
          );
      },
    };
    const detail = await history.list(httpRequest(manager.tokens), scope);
    expect(detail).toMatchObject({
      total: 1,
      pageSize: 20,
      items: [
        {
          objectKind: 'Season',
          objectId: seasonId,
          before: { name: 'History season before' },
          after: { name: 'History season after' },
        },
      ],
    });
    await expect(history.list(httpRequest(admin.tokens), scope)).rejects.toMatchObject({
      code: 'ACCESS_DENIED',
    });

    const auditQuery = new AuditQueryService(database, auth);
    const systemWide = await auditQuery.list(httpRequest(admin.tokens), {});
    const metadata = systemWide.items.find((item) => item.objectId === seasonId);
    expect(metadata).toMatchObject({
      objectKind: 'Season',
      reason: null,
      before: null,
      after: null,
    });
    await expect(
      auditQuery.list(httpRequest(admin.tokens), { objectKind: 'Season' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });

    const clubReader = await createLiveAccount('HISTC');
    const clubScope: BusinessHistoryScope = {
      kind: 'Club',
      id: clubId,
      seasonId,
      locks: [
        { kind: 'club', key: clubId, mode: 'shared' },
        { kind: 'season', key: seasonId, mode: 'shared' },
      ],
      authorize: async (_context, accountId) => {
        if (accountId !== clubReader.account.id)
          throw new ApplicationError(403, 'ACCESS_DENIED', 'Current club read authority required.');
      },
    };
    const clubDetail = await history.list(httpRequest(clubReader.tokens), clubScope);
    expect(clubDetail).toMatchObject({
      total: 1,
      items: [{ objectKind: 'Club', objectId: clubId, after: { name: 'History Club updated' } }],
    });
  });

  it('binds PHASE 2 audit actors to the trusted principal and reserves technical events for their approved actors', async () => {
    const actor = await createLiveAccount('ACTOR');
    const seasonId = randomUUID();
    await database.client.season.create({
      data: {
        id: seasonId,
        code: `ACTOR_${seasonId.replaceAll('-', '').slice(0, 20).toUpperCase()}`,
        name: 'Actor binding season',
        competitionName: 'Premier League Actor Test',
        startDate: new Date('2027-08-01T00:00:00Z'),
        endDate: new Date('2028-05-31T00:00:00Z'),
      },
    });
    const regulationCase = await database.client.regulationCase.create({ data: { seasonId } });
    const version = await database.client.regulationVersion.create({
      data: {
        seasonId,
        caseId: regulationCase.id,
        versionNumber: 1,
        preparedBy: actor.account.id,
      },
    });
    const activationEvent = {
      action: 'REGULATION_ACTIVATED' as const,
      objectKind: 'RegulationVersion',
      objectId: version.id,
      seasonId,
      outcome: 'SUCCESS' as const,
      before: { state: 'APPROVED_WAITING' },
      after: {
        versionId: version.id,
        state: 'ACTIVE',
        activeFrom: '2027-08-01T00:00:00.000Z',
        processedAt: '2027-08-01T00:01:00.000Z',
      },
    };
    const sessionScope = {
      principal: { kind: 'session' as const, accountId: actor.account.id },
      locks: [
        { kind: 'account' as const, key: actor.account.id, mode: 'shared' as const },
        { kind: 'season' as const, key: seasonId, mode: 'shared' as const },
        { kind: 'regulationVersion' as const, key: version.id, mode: 'exclusive' as const },
      ],
      authority: async () => {},
    };
    await expect(
      business.execute(sessionScope, (context) =>
        new AuditWriterService().append(context, {
          ...activationEvent,
          actor: { kind: 'SYSTEM' },
        }),
      ),
    ).rejects.toThrow('trusted execution principal');
    await expect(
      business.execute(sessionScope, (context) =>
        new AuditWriterService().append(context, {
          ...activationEvent,
          actor: { kind: 'ACCOUNT', accountId: actor.account.id },
        }),
      ),
    ).rejects.toThrow('does not permit this actor kind');
    expect(await database.client.auditRecord.count({ where: { objectId: version.id } })).toBe(0);

    await business.execute(sessionScope, (context) =>
      new AuditWriterService().appendSystemTechnical(context, activationEvent),
    );
    expect(
      await database.client.auditRecord.findFirstOrThrow({ where: { objectId: version.id } }),
    ).toMatchObject({ actorKind: 'SYSTEM', actorId: null, actionCode: 'REGULATION_ACTIVATED' });

    const assetId = randomUUID();
    await business.execute(
      { principal: { kind: 'system', actorKind: 'SYSTEM' }, locks: [], authority: async () => {} },
      (context) =>
        new AuditWriterService().appendSystemTechnical(context, {
          action: 'MEDIA_ASSET_CLEANED',
          objectKind: 'MediaAsset',
          objectId: assetId,
          outcome: 'SUCCESS',
          before: { contentDeletedAt: null },
          after: { assetId, contentDeletedAt: '2027-08-02T00:00:00.000Z' },
        }),
    );
    expect(
      await database.client.auditRecord.findFirstOrThrow({ where: { objectId: assetId } }),
    ).toMatchObject({ actorKind: 'SYSTEM', actorId: null, actionCode: 'MEDIA_ASSET_CLEANED' });
  });

  it('rolls back business state when required audit references or effectivity are missing', async () => {
    const account = await createAccount('AUDIT');
    const seasonId = randomUUID();
    const versionId = randomUUID();
    const season = await database.client.season.create({
      data: {
        id: seasonId,
        code: `AUDIT_${seasonId.replaceAll('-', '').slice(0, 20).toUpperCase()}`,
        name: 'Audit rollback before',
        competitionName: 'Premier League Test',
        startDate: new Date('2027-08-01T00:00:00Z'),
        endDate: new Date('2028-05-31T00:00:00Z'),
      },
    });
    await expect(
      business.execute(
        {
          principal: { kind: 'session', accountId: account.id },
          locks: [
            { kind: 'account', key: account.id, mode: 'shared' },
            { kind: 'season', key: seasonId, mode: 'exclusive' },
          ],
          authority: async () => {},
        },
        async (context) => {
          await context.db.season.update({
            where: { id: season.id },
            data: { name: 'Must roll back' },
          });
          await new AuditWriterService().append(context, {
            actor: { kind: 'ACCOUNT', accountId: account.id },
            action: 'REGULATION_APPROVED',
            objectKind: 'RegulationVersion',
            objectId: versionId,
            seasonId,
            outcome: 'SUCCESS',
            reason: 'Approved after a fixture review.',
            before: { state: 'SUBMITTED' },
            after: {
              versionId,
              versionNumber: 1,
              effectiveMode: 'SCHEDULED',
            },
          });
        },
      ),
    ).rejects.toThrow('required fields');
    expect(
      await database.client.season.findUniqueOrThrow({ where: { id: seasonId } }),
    ).toMatchObject({
      name: 'Audit rollback before',
    });
  });

  it('keeps system/operator work out of account-scoped command receipts', async () => {
    const actor = await createAccount('PRINCIPAL');
    const intent: BusinessReceiptIntent = {
      action: 'ACCOUNT_LOCKED',
      key: randomUUID(),
      targetId: actor.id,
      payload: { expectedRevision: '1' },
    };
    const authority = async () => {};
    for (const principal of [
      { kind: 'system' as const, actorKind: 'SYSTEM' as const },
      { kind: 'operator' as const, identity: 'isolated-operator-fixture' },
    ])
      expect(() =>
        business.executeCritical(
          { principal, locks: [], authority },
          intent,
          async () => ({ status: 200, data: { id: actor.id, revision: '2' } }),
          identityProject,
        ),
      ).toThrow(expect.objectContaining({ code: 'ACCESS_DENIED' }));

    const forgedActorId = randomUUID();
    const forgedIntent = {
      ...intent,
      accountId: forgedActorId,
    } as BusinessReceiptIntent;
    await business.executeCritical(
      {
        principal: { kind: 'session', accountId: actor.id },
        locks: [{ kind: 'account', key: actor.id, mode: 'shared' }],
        authority,
      },
      forgedIntent,
      async () => ({ status: 200, data: { id: actor.id, revision: '1' } }),
      identityProject,
    );

    expect(
      await business.execute(
        { principal: { kind: 'system', actorKind: 'SYSTEM' }, locks: [], authority },
        async () => true,
      ),
    ).toBe(true);
    expect(
      await database.client.commandReceipt.count({
        where: { accountId: actor.id, actionCode: 'ACCOUNT_LOCKED', requestKey: intent.key },
      }),
    ).toBe(1);
    expect(
      await database.client.commandReceipt.count({
        where: { accountId: forgedActorId, actionCode: 'ACCOUNT_LOCKED', requestKey: intent.key },
      }),
    ).toBe(0);
  });

  it('uses fixed SeasonCollection intent, replays before creation guards, and rechecks current create authority', async () => {
    const actor = await createAccount();
    const grant = await createSeasonGrant(actor.id);
    const id = randomUUID();
    const command = seasonIntent(randomUUID(), `test_${id.replaceAll('-', '').slice(0, 24)}`);
    const run = seasonWork();
    const scope = creatorScope(actor.id, command.payload.code.toUpperCase());

    expect(command.targetId).toBe('SeasonCollection');
    expect(command.payload).not.toHaveProperty('expectedRevision');
    const first = await business.executeCritical(scope, command, run.work, identityProject);
    expect(first.status).toBe(201);
    expect(first.data.revision).toBe('1');
    expect(run.attempts()).toBe(1);

    const season = await database.client.season.findUniqueOrThrow({ where: { id: first.data.id } });
    expect(season.code).toBe(command.payload.code.toUpperCase());
    expect(season.name).toBe('Mùa giải kiểm thử');
    expect(season.competitionName).toBe('Premier League Test');
    expect(season.startDate.toISOString().slice(0, 10)).toBe('2027-08-01');
    expect(
      await database.client.seasonRoleAssignment.count({
        where: { accountId: actor.id, seasonId: season.id },
      }),
    ).toBe(0);

    expect(await business.executeCritical(scope, command, run.work, identityProject)).toEqual(
      first,
    );
    expect(run.attempts()).toBe(1);
    await expect(
      business.executeCritical(
        scope,
        { ...command, payload: { ...command.payload, name: 'Changed name' } },
        run.work,
        identityProject,
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });

    await database.client.createSeasonGrant.update({
      where: { id: grant.id },
      data: { revokedAt: new Date() },
    });
    await expect(
      business.executeCritical(scope, command, run.work, identityProject),
    ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
    expect(run.attempts()).toBe(1);
  });

  it('binds regulation, change, and lifecycle approval receipts to exact submitted versions', async () => {
    const actor = await createAccount('APPROVAL');
    const seasonId = randomUUID();
    await database.client.season.create({
      data: {
        id: seasonId,
        code: `APPROVAL_${seasonId.replaceAll('-', '').slice(0, 20).toUpperCase()}`,
        name: 'Mùa kiểm thử phê duyệt',
        competitionName: 'Premier League Approval Test',
        startDate: new Date('2027-08-01T00:00:00Z'),
        endDate: new Date('2028-05-31T00:00:00Z'),
      },
    });
    const regulationCase = await database.client.regulationCase.create({ data: { seasonId } });
    const waitingVersion = await database.client.regulationVersion.create({
      data: { seasonId, caseId: regulationCase.id, versionNumber: 1, preparedBy: actor.id },
    });
    const replacementVersion = await database.client.regulationVersion.create({
      data: { seasonId, caseId: regulationCase.id, versionNumber: 2, preparedBy: actor.id },
    });
    const changeRequest = await database.client.regulationChangeRequest.create({
      data: { seasonId },
    });
    const changeVersion = await database.client.regulationChangeVersion.create({
      data: {
        seasonId,
        caseId: changeRequest.id,
        versionNumber: 1,
        preparedBy: actor.id,
        action: 'REPLACE',
        waitingVersionId: waitingVersion.id,
        replacementVersionId: replacementVersion.id,
      },
    });
    const summaryCase = await database.client.seasonSummaryCase.create({
      data: { seasonId },
    });
    const summaryVersion = await database.client.seasonSummaryVersion.create({
      data: { seasonId, caseId: summaryCase.id, versionNumber: 1, preparedBy: actor.id },
    });
    const lifecycleRequest = await database.client.seasonLifecycleRequest.create({
      data: { seasonId },
    });
    const lifecycleVersion = await database.client.seasonLifecycleVersion.create({
      data: {
        seasonId,
        caseId: lifecycleRequest.id,
        versionNumber: 1,
        preparedBy: actor.id,
        action: 'CLOSE',
        summaryVersionId: summaryVersion.id,
      },
    });
    const reopenVersion = await database.client.seasonLifecycleVersion.create({
      data: {
        seasonId,
        caseId: lifecycleRequest.id,
        versionNumber: 2,
        preparedBy: actor.id,
        action: 'REOPEN',
      },
    });
    const authority = async (context: Parameters<Parameters<typeof database.write>[1]>[0]) => {
      const current = await context.db.account.findUnique({ where: { id: actor.id } });
      if (current?.state !== 'ACTIVE')
        throw new ApplicationError(403, 'ACCESS_DENIED', 'Không có quyền phê duyệt.');
    };
    const scopeFor = (command: BusinessReceiptIntent) => {
      const locks: LockResource[] = [
        { kind: 'account', key: actor.id, mode: 'shared' },
        { kind: 'season', key: seasonId, mode: 'shared' },
      ];
      if (command.action === 'REGULATION_APPROVED')
        locks.push({ kind: 'regulationVersion', key: command.targetId, mode: 'exclusive' });
      else if (command.action === 'REGULATION_CHANGE_APPROVED') {
        locks.push(
          { kind: 'regulationChangeRequest', key: command.targetId, mode: 'exclusive' },
          {
            kind: 'regulationChangeVersion',
            key: command.payload.submittedVersionId,
            mode: 'exclusive',
          },
        );
      } else if (command.action === 'SEASON_LIFECYCLE_APPROVED') {
        locks.push(
          { kind: 'seasonLifecycleRequest', key: command.targetId, mode: 'exclusive' },
          {
            kind: 'seasonLifecycleVersion',
            key: command.payload.submittedVersionId,
            mode: 'exclusive',
          },
        );
      }
      return { principal: { kind: 'session' as const, accountId: actor.id }, locks, authority };
    };
    const commands: BusinessReceiptIntent[] = [
      {
        action: 'REGULATION_APPROVED',
        key: randomUUID(),
        targetId: waitingVersion.id,
        payload: {
          expectedRevision: String(waitingVersion.revision),
          submittedVersionId: waitingVersion.id,
          effectiveMode: 'scheduled',
          proposedEffectiveAt: '2027-08-01T03:00:00+03:00',
        },
      },
      {
        action: 'REGULATION_CHANGE_APPROVED',
        key: randomUUID(),
        targetId: changeRequest.id,
        payload: {
          expectedRevision: String(changeRequest.revision),
          submittedVersionId: changeVersion.id,
          action: 'replace',
          waitingVersionId: waitingVersion.id,
          replacementVersionId: replacementVersion.id,
          reason: '  Replace\r\n rule  ',
        },
      },
      {
        action: 'SEASON_LIFECYCLE_APPROVED',
        key: randomUUID(),
        targetId: lifecycleRequest.id,
        payload: {
          expectedRevision: String(lifecycleRequest.revision),
          submittedVersionId: lifecycleVersion.id,
          action: 'close',
          reason: 'Season completed',
          readinessBasisReference: summaryVersion.id,
        },
      },
      {
        action: 'SEASON_LIFECYCLE_APPROVED',
        key: randomUUID(),
        targetId: lifecycleRequest.id,
        payload: {
          expectedRevision: String(lifecycleRequest.revision),
          submittedVersionId: reopenVersion.id,
          action: 'reopen',
          reason: 'Resume the season',
        },
      },
    ];
    let effects = 0;
    const run = async (command: BusinessReceiptIntent) =>
      business.executeCritical(
        scopeFor(command),
        command,
        async (_context, intent) => {
          effects++;
          return {
            status: 200,
            data: { id: intent.targetId, revision: '2' },
          };
        },
        identityProject,
      );

    for (const command of commands) {
      const first = await run(command);
      const normalizedPayload = { ...command.payload };
      if (command.action === 'REGULATION_APPROVED') {
        normalizedPayload.effectiveMode = 'SCHEDULED';
        normalizedPayload.proposedEffectiveAt = '2027-08-01T00:00:00.000Z';
      } else if (command.action === 'REGULATION_CHANGE_APPROVED') {
        normalizedPayload.action = 'REPLACE';
        normalizedPayload.reason = 'Replace\n rule';
      } else if (command.action === 'SEASON_LIFECYCLE_APPROVED') {
        normalizedPayload.action = command.payload.action.toUpperCase();
      }
      expect(await run({ ...command, payload: normalizedPayload })).toEqual(first);
    }
    expect(effects).toBe(4);

    const regulationCommand = commands[0];
    if (regulationCommand.action !== 'REGULATION_APPROVED') throw new Error('Invalid test setup');
    const changedTarget = replacementVersion.id;
    await expect(
      run({
        ...regulationCommand,
        targetId: changedTarget,
        payload: { ...regulationCommand.payload, submittedVersionId: changedTarget },
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
    await expect(
      run({
        ...regulationCommand,
        payload: { ...regulationCommand.payload, expectedRevision: '2' },
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED' });
    await expect(
      run({
        ...regulationCommand,
        key: randomUUID(),
        payload: {
          ...regulationCommand.payload,
          proposedEffectiveAt: '2027-02-30T03:00:00+03:00',
        },
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('keeps business guards active after receipt expiry', async () => {
    const actor = await createAccount('EXPIRY');
    await createSeasonGrant(actor.id);
    const clock = new TestClock(new Date('2026-01-01T00:00:00.000Z'));
    const timedDatabase = new DatabaseService(databaseUrl, clock);
    const timedBusiness = new BusinessExecutionService(timedDatabase);
    const key = randomUUID();
    const seasonId = randomUUID();
    const command = seasonIntent(key, `test_${seasonId.replaceAll('-', '').slice(0, 24)}`);
    const run = seasonWork();
    try {
      const first = await timedBusiness.executeCritical(
        creatorScope(actor.id, command.payload.code.toUpperCase()),
        command,
        run.work,
        identityProject,
      );
      clock.set(new Date('2026-01-02T00:00:01.000Z'));
      await expect(
        timedBusiness.executeCritical(
          creatorScope(actor.id, command.payload.code.toUpperCase()),
          command,
          run.work,
          identityProject,
        ),
      ).rejects.toMatchObject({ code: 'DUPLICATE_CODE' });
      expect(run.attempts()).toBe(2);
      expect(
        await database.client.season.count({
          where: { id: first.data.id, code: command.payload.code.toUpperCase() },
        }),
      ).toBe(1);
    } finally {
      await timedDatabase.close();
    }
  });

  it('rolls back effects and receipts when safe outcome validation fails', async () => {
    const actor = await createAccount('ROLLBACK');
    const key = randomUUID();
    const guardKey = `phase2-rollback-${randomUUID()}`;
    await expect(
      business.executeCritical(
        {
          principal: { kind: 'session', accountId: actor.id },
          locks: [{ kind: 'account', key: actor.id, mode: 'exclusive' }],
          authority: async (context) => {
            const current = await context.db.account.findUnique({ where: { id: actor.id } });
            if (current?.state !== 'ACTIVE')
              throw new ApplicationError(403, 'ACCESS_DENIED', 'Không có quyền.');
          },
        },
        {
          action: 'ACCOUNT_LOCKED',
          key,
          targetId: actor.id,
          payload: { expectedRevision: '1' },
        },
        async (context) => {
          await context.db.systemGuard.create({ data: { key: guardKey } });
          return {
            status: 200 as const,
            data: { id: actor.id, revision: '2', credential: 'must-not-persist' },
          } as unknown as ReceiptOutcome;
        },
        identityProject,
      ),
    ).rejects.toThrow('Unsafe receipt response');

    expect(
      (await observer.query('SELECT key FROM system_guard WHERE key=$1', [guardKey])).rowCount,
    ).toBe(0);
    expect(
      (
        await observer.query(
          `SELECT id FROM command_receipt WHERE account_id=$1 AND action_code='ACCOUNT_LOCKED' AND request_key=$2`,
          [actor.id, key],
        )
      ).rowCount,
    ).toBe(0);
  });

  it('acquires shuffled locks in D096 order using static table mappings', async () => {
    const actor = await createAccount('ORDER');
    const seasonId = randomUUID();
    const season = await database.client.season.create({
      data: {
        id: seasonId,
        code: `ORDER_${seasonId.replaceAll('-', '').slice(0, 20).toUpperCase()}`,
        name: 'Mùa kiểm thử thứ tự khóa',
        competitionName: 'Premier League Lock Test',
        startDate: new Date('2027-08-01T00:00:00Z'),
        endDate: new Date('2028-05-31T00:00:00Z'),
      },
    });
    const clubId = randomUUID();
    await observer.query(
      `INSERT INTO club(id,code,name,abbreviation) VALUES($1,$2,'Club Lock Test','CLT')`,
      [clubId, `ORDER_${seasonId.slice(0, 8).toUpperCase()}`],
    );
    const stadiumId = randomUUID();
    await observer.query(`INSERT INTO stadium(id,code,name) VALUES($1,$2,'Stadium Lock Test')`, [
      stadiumId,
      `ORDER_${seasonId.slice(8, 16).toUpperCase()}`,
    ]);
    const regulationCase = await database.client.regulationCase.create({
      data: { seasonId: season.id },
    });
    const regulationVersion = await database.client.regulationVersion.create({
      data: {
        seasonId: season.id,
        caseId: regulationCase.id,
        versionNumber: 1,
        preparedBy: actor.id,
      },
    });

    const tableLocks = [
      {
        kind: 'system' as const,
        key: 'last-active-admin',
        mode: 'exclusive' as const,
        table: 'system_guard',
      },
      { kind: 'account' as const, key: actor.id, mode: 'shared' as const, table: 'account' },
      { kind: 'season' as const, key: season.id, mode: 'shared' as const, table: 'season' },
      { kind: 'club' as const, key: clubId, mode: 'shared' as const, table: 'club' },
      { kind: 'stadium' as const, key: stadiumId, mode: 'shared' as const, table: 'stadium' },
      {
        kind: 'regulationCase' as const,
        key: regulationCase.id,
        mode: 'shared' as const,
        table: 'regulation_case',
      },
      {
        kind: 'regulationVersion' as const,
        key: regulationVersion.id,
        mode: 'shared' as const,
        table: 'regulation_version',
      },
    ];
    const blockers: Array<{ client: PoolClient; pid: number }> = [];
    let operationPid = 0;
    let pending: Promise<boolean> | undefined;
    const pollUntilBlocked = async (blockerPid: number, table: string) => {
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        const result = await observer.query(
          `SELECT query FROM pg_stat_activity
           WHERE pid=$1 AND $2=ANY(pg_blocking_pids(pid)) AND wait_event_type='Lock'`,
          [operationPid, blockerPid],
        );
        if (result.rowCount) {
          const query = String(result.rows[0].query).toLowerCase();
          expect(query).toContain(`"${table}"`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      throw new Error(`Expected ordered lock wait for ${table}.`);
    };

    try {
      for (const lock of tableLocks) {
        const client = await observer.connect();
        await client.query('BEGIN');
        const pid = Number((await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid);
        if (lock.kind === 'system')
          await client.query('SELECT key FROM system_guard WHERE key=$1 FOR UPDATE', [lock.key]);
        else
          await client.query(`SELECT id FROM "${lock.table}" WHERE id=$1 FOR UPDATE`, [lock.key]);
        blockers.push({ client, pid });
      }
      const shuffled = [...tableLocks]
        .reverse()
        .map(({ kind, key, mode }) => ({ kind, key, mode }));
      pending = business.execute(
        {
          principal: { kind: 'session', accountId: actor.id },
          locks: shuffled,
          authority: async (context) => {
            const current = await context.db.account.findUnique({ where: { id: actor.id } });
            if (current?.state !== 'ACTIVE')
              throw new ApplicationError(403, 'ACCESS_DENIED', 'Không có quyền.');
          },
          discover: async (tx) => {
            const rows = await tx.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`;
            operationPid = Number(rows[0].pid);
            return [];
          },
        },
        async () => true,
      );

      for (let index = 0; index < tableLocks.length; index++) {
        const blocker = blockers[index];
        await pollUntilBlocked(blocker.pid, tableLocks[index].table);
        await blocker.client.query('COMMIT');
      }
      expect(await pending).toBe(true);
    } finally {
      for (const blocker of blockers) {
        await blocker.client.query('ROLLBACK').catch(() => {});
        blocker.client.release();
      }
      await pending?.catch(() => {});
    }
  });
});
