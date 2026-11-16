import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { AuthService } from '../../src/identity-access/auth.service';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import { SecurityPrimitivesService } from '../../src/identity-access/security-primitives.service';
import { ApplicationError } from '../../src/platform/application-error';
import { DatabaseService } from '../../src/platform/database.service';
import { SafeErrorFilter } from '../../src/platform/error.filter';
import { ResponseEnvelopeInterceptor } from '../../src/platform/response-envelope.interceptor';
import { SafeValidationPipe } from '../../src/platform/validation.pipe';
import { createPhase1Fixtures, resetPhase1Fixtures } from '../fixtures/phase-1-fixtures';

const fixturePasswordHash = '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture';

describe('PHASE 2 regulation draft HTTP contract', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL!;
  const database = new DatabaseService(databaseUrl);
  const observer = new Pool({ connectionString: databaseUrl });
  const security = new SecurityPrimitivesService();
  let app: INestApplication;
  let fixtures: Awaited<ReturnType<typeof createPhase1Fixtures>>;
  let previousOrigin: string | undefined;

  async function startApplication(db: DatabaseService) {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue(db)
      .compile();
    const application = module.createNestApplication();
    application.useGlobalPipes(new SafeValidationPipe());
    application.useGlobalFilters(new SafeErrorFilter());
    application.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await application.init();
    return application;
  }

  async function createLiveAccount(prefix: string) {
    const id = randomUUID();
    const account = await database.client.account.create({
      data: {
        id,
        personnelCode: `${prefix}_${id.replaceAll('-', '').slice(0, 20).toUpperCase()}`,
        fullName: `Nhân viên quy định ${prefix}`,
        username: `${prefix.toLowerCase()}.${id}`,
        passwordHash: fixturePasswordHash,
        mustChangePassword: false,
      },
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

  async function grantSeasonRole(
    accountId: string,
    seasonId: string,
    roleCode: 'SEASON_MANAGER' | 'REGISTRATION_OFFICER' | 'SCHEDULING_OFFICER' | 'RESULTS_OFFICER',
  ) {
    return database.client.seasonRoleAssignment.create({
      data: {
        accountId,
        seasonId,
        roleCode,
        grantedBy: fixtures.accounts[0].id,
        grantedAt: await database.now(),
      },
    });
  }

  function readRequest(tokens: { token: string }, path: string) {
    return request(app.getHttpServer())
      .get(path)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`);
  }

  function createRequest(
    tokens: { token: string; csrfToken: string },
    seasonId: string,
    payload: Record<string, unknown>,
  ) {
    return request(app.getHttpServer())
      .post(`/api/v1/seasons/${seasonId}/regulation-versions`)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', 'https://whistle.test')
      .set('X-CSRF-Token', tokens.csrfToken)
      .send(payload);
  }

  function updateRequest(
    tokens: { token: string; csrfToken: string },
    versionId: string,
    payload: Record<string, unknown>,
  ) {
    return request(app.getHttpServer())
      .patch(`/api/v1/regulation-versions/${versionId}`)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', 'https://whistle.test')
      .set('X-CSRF-Token', tokens.csrfToken)
      .send(payload);
  }

  const draftContent = () => ({
    effectiveMode: 'SCHEDULED',
    proposedEffectiveAt: '2027-07-01T00:00:00Z',
    clubCount: 20,
    relegationCount: null,
    registrationWindows: [
      {
        intakeKind: 'CLUB_APPLICATION',
        opensAt: '2026-06-01T00:00:00Z',
        closesAt: '2026-07-01T00:00:00Z',
      },
      {
        intakeKind: 'PLAYER_CHANGE',
        opensAt: '2026-07-01T00:00:00Z',
        closesAt: '2026-08-01T00:00:00Z',
      },
    ],
    rankingPriority: [{ position: 1, criterionCode: 'POINTS' }],
    goalTypes: [{ code: 'c', name: '  Own   goal ', isOwnGoal: true, enabled: true }],
    cardTypes: [{ code: 'yellow', name: '  Yellow   card ', meaning: 'YELLOW', enabled: true }],
  });

  beforeAll(async () => {
    previousOrigin = process.env.AUTH_ORIGIN;
    process.env.AUTH_ORIGIN = 'https://whistle.test';
    app = await startApplication(database);
  });

  beforeEach(async () => {
    await resetPhase1Fixtures(databaseUrl, 'RESET_ISOLATED_TEST_DATABASE');
    fixtures = await createPhase1Fixtures(databaseUrl);
  });

  afterAll(async () => {
    await app?.close();
    await database.close();
    await observer.end();
    if (previousOrigin === undefined) delete process.env.AUTH_ORIGIN;
    else process.env.AUTH_ORIGIN = previousOrigin;
  });

  it('creates an incomplete typed draft without inventing omitted values and exposes exact list/detail data', async () => {
    const manager = await createLiveAccount('T010C');
    const [season, otherSeason] = fixtures.seasons;
    await grantSeasonRole(manager.account.id, season.id, 'SEASON_MANAGER');

    const created = await createRequest(manager.tokens, season.id, draftContent()).expect(201);
    expect(created.body).toMatchObject({
      data: { id: expect.any(String), revision: '1' },
      requestId: expect.any(String),
    });
    expect(Object.keys(created.body)).toEqual(['data', 'requestId']);
    const versionId = created.body.data.id as string;

    const version = await database.client.regulationVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: {
        registrationWindows: true,
        rankingPriority: true,
        goalTypes: true,
        cardTypes: true,
      },
    });
    expect(version).toMatchObject({
      seasonId: season.id,
      versionNumber: 1,
      revision: 1n,
      state: 'DRAFT',
      effectiveMode: 'SCHEDULED',
      clubCount: 20,
      relegationCount: null,
      winPoints: null,
      squadLimit: null,
    });
    expect(version.proposedEffectiveAt?.toISOString()).toBe('2027-07-01T00:00:00.000Z');
    expect(version.registrationWindows).toHaveLength(2);
    expect(version.registrationWindows.every(({ id }) => Boolean(id))).toBe(true);
    expect(version.rankingPriority).toMatchObject([{ position: 1, criterionCode: 'POINTS' }]);
    expect(version.goalTypes).toMatchObject([{ code: 'C', name: 'Own goal', isOwnGoal: true }]);
    expect(version.cardTypes).toMatchObject([{ code: 'YELLOW', name: 'Yellow card' }]);
    expect(
      await database.client.regulationVersionEditor.findMany({
        where: { versionId },
        select: { accountId: true },
      }),
    ).toEqual([{ accountId: manager.account.id }]);

    const list = await readRequest(
      manager.tokens,
      `/api/v1/seasons/${season.id}/regulation-versions`,
    ).expect(200);
    expect(Object.keys(list.body)).toEqual(['data', 'meta', 'requestId']);
    expect(list.body.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(list.body.data).toMatchObject({
      items: [
        {
          id: versionId,
          revision: '1',
          state: 'DRAFT',
          isCurrentDraft: true,
          capabilities: { canEditDraft: true },
        },
      ],
      capabilities: { canCreateDraft: false },
    });

    const detail = await readRequest(
      manager.tokens,
      `/api/v1/regulation-versions/${versionId}`,
    ).expect(200);
    expect(detail.body.data).toMatchObject({
      id: versionId,
      preparedBy: { id: manager.account.id },
      editors: [{ accountId: manager.account.id }],
      content: {
        effectiveMode: 'SCHEDULED',
        proposedEffectiveAt: '2027-07-01T00:00:00.000Z',
        clubCount: 20,
        relegationCount: null,
        winPoints: null,
        registrationWindows: [
          { intakeKind: 'CLUB_APPLICATION', opensAt: '2026-06-01T00:00:00.000Z' },
          { intakeKind: 'PLAYER_CHANGE', opensAt: '2026-07-01T00:00:00.000Z' },
        ],
        rankingPriority: [{ position: 1, criterionCode: 'POINTS' }],
        goalTypes: [{ code: 'C', isOwnGoal: true }],
        cardTypes: [{ code: 'YELLOW', meaning: 'YELLOW' }],
      },
    });
    await readRequest(
      manager.tokens,
      `/api/v1/seasons/${otherSeason.id}/regulation-versions`,
    ).expect(404);

    const audit = await database.client.auditRecord.findFirstOrThrow({
      where: { actionCode: 'REGULATION_DRAFT_CREATED', objectId: versionId },
    });
    expect(audit).toMatchObject({
      actorKind: 'ACCOUNT',
      actorId: manager.account.id,
      objectKind: 'RegulationVersion',
      objectId: versionId,
      seasonId: season.id,
      afterData: { versionId, versionNumber: 1, state: 'DRAFT', revision: '1' },
    });
    expect(await database.client.commandReceipt.count()).toBe(0);
  });

  it('returns persisted current and waiting summaries independently of the selected version page', async () => {
    const manager = await createLiveAccount('T010O');
    const season = fixtures.seasons[0];
    await grantSeasonRole(manager.account.id, season.id, 'SEASON_MANAGER');
    const regulationCase = await database.client.regulationCase.create({
      data: { seasonId: season.id },
    });
    const now = await database.now();
    const effective = await database.client.regulationVersion.create({
      data: {
        seasonId: season.id,
        caseId: regulationCase.id,
        versionNumber: 1,
        preparedBy: manager.account.id,
        effectiveMode: 'IMMEDIATE',
      },
    });
    await database.client.regulationVersion.update({
      where: { id: effective.id },
      data: { state: 'EFFECTIVE', submittedAt: now, approvedAt: now, activeFrom: now },
    });
    const superseded = await database.client.regulationVersion.create({
      data: {
        seasonId: season.id,
        caseId: regulationCase.id,
        versionNumber: 2,
        preparedBy: manager.account.id,
        predecessorVersionId: effective.id,
        effectiveMode: 'IMMEDIATE',
      },
    });
    await database.client.regulationVersion.update({
      where: { id: superseded.id },
      data: {
        state: 'SUPERSEDED',
        submittedAt: now,
        approvedAt: now,
        activeFrom: now,
        activeUntil: now,
      },
    });
    const waitingAt = new Date(now.getTime() + 86_400_000);
    const waiting = await database.client.regulationVersion.create({
      data: {
        seasonId: season.id,
        caseId: regulationCase.id,
        versionNumber: 3,
        preparedBy: manager.account.id,
        predecessorVersionId: superseded.id,
        effectiveMode: 'SCHEDULED',
        proposedEffectiveAt: waitingAt,
      },
    });
    await database.client.regulationVersion.update({
      where: { id: waiting.id },
      data: { state: 'APPROVED_WAITING', submittedAt: now, approvedAt: now },
    });
    await database.client.season.update({
      where: { id: season.id },
      data: { currentRegulationVersionId: effective.id },
    });

    const page = await readRequest(
      manager.tokens,
      `/api/v1/seasons/${season.id}/regulation-versions`,
    )
      .query({ page: '1', pageSize: '1', sort: 'versionNumber:desc', state: 'SUPERSEDED' })
      .expect(200);
    expect(page.body.meta).toEqual({ page: 1, pageSize: 1, total: 1 });
    expect(page.body.data.items).toMatchObject([{ id: superseded.id, state: 'SUPERSEDED' }]);
    expect(page.body.data.overview).toEqual({
      currentEffective: {
        id: effective.id,
        versionNumber: 1,
        state: 'EFFECTIVE',
        effectiveMode: 'IMMEDIATE',
        proposedEffectiveAt: null,
        approvedAt: now.toISOString(),
        activeFrom: now.toISOString(),
        activeUntil: null,
      },
      waiting: {
        id: waiting.id,
        versionNumber: 3,
        state: 'APPROVED_WAITING',
        effectiveMode: 'SCHEDULED',
        proposedEffectiveAt: waitingAt.toISOString(),
        approvedAt: now.toISOString(),
        activeFrom: null,
        activeUntil: null,
      },
    });
  });

  it('replaces only supplied child arrays, records collaborative editors, and rejects stale revisions', async () => {
    const manager = await createLiveAccount('T010E');
    const collaborator = await createLiveAccount('T010M');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    await grantSeasonRole(collaborator.account.id, seasonId, 'SEASON_MANAGER');
    const created = await createRequest(manager.tokens, seasonId, {
      ...draftContent(),
      u21Cutoff: '2005-01-01',
    }).expect(201);
    const versionId = created.body.data.id as string;

    const updated = await updateRequest(collaborator.tokens, versionId, {
      expectedRevision: '1',
      squadLimit: 25,
      u21Cutoff: null,
      registrationWindows: [],
      goalTypes: [{ code: 'a', name: '  Normal   goal ', isOwnGoal: false, enabled: true }],
    }).expect(200);
    expect(updated.body.data).toEqual({ id: versionId, revision: '2' });
    const saved = await database.client.regulationVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: {
        registrationWindows: true,
        rankingPriority: true,
        goalTypes: true,
        cardTypes: true,
      },
    });
    expect(saved).toMatchObject({
      revision: 2n,
      squadLimit: 25,
      clubCount: 20,
      winPoints: null,
      u21Cutoff: null,
    });
    expect(saved.registrationWindows).toEqual([]);
    expect(saved.rankingPriority).toHaveLength(1);
    expect(saved.goalTypes).toMatchObject([{ code: 'A', name: 'Normal goal', isOwnGoal: false }]);
    expect(saved.cardTypes).toMatchObject([{ code: 'YELLOW' }]);
    expect(
      await database.client.regulationVersionEditor.findMany({
        where: { versionId },
        orderBy: { accountId: 'asc' },
        select: { accountId: true },
      }),
    ).toEqual(
      [manager.account.id, collaborator.account.id].sort().map((accountId) => ({ accountId })),
    );

    const stale = await updateRequest(collaborator.tokens, versionId, {
      expectedRevision: '1',
      squadLimit: 30,
    }).expect(409);
    expect(stale.body.error.code).toBe('REVISION_CONFLICT');
    const audit = await database.client.auditRecord.findFirstOrThrow({
      where: { actionCode: 'REGULATION_DRAFT_UPDATED', objectId: versionId },
    });
    expect(audit).toMatchObject({
      actorId: collaborator.account.id,
      beforeData: { versionId, versionNumber: 1, state: 'DRAFT', revision: '1' },
      afterData: { versionId, versionNumber: 1, state: 'DRAFT', revision: '2' },
    });
    expect(
      await database.client.auditRecord.count({
        where: { actionCode: 'REGULATION_DRAFT_UPDATED', objectId: versionId },
      }),
    ).toBe(1);
  });

  it('rejects PATCH fragments that contradict unchanged persisted draft fields', async () => {
    const manager = await createLiveAccount('T010X');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    const created = await createRequest(manager.tokens, seasonId, {
      effectiveMode: 'SCHEDULED',
      proposedEffectiveAt: '2027-07-01T00:00:00Z',
      homegrownAgeStart: 15,
      homegrownAgeEnd: 21,
      clubCount: 8,
      qualificationCount: 5,
      relegationCount: 2,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
    }).expect(201);
    const versionId = created.body.data.id as string;
    const conflictingPatches = [
      { homegrownAgeEnd: 15 },
      { drawPoints: 4 },
      { clubCount: 6 },
      { effectiveMode: 'IMMEDIATE' },
    ];
    for (const patch of conflictingPatches) {
      const response = await updateRequest(manager.tokens, versionId, {
        expectedRevision: '1',
        ...patch,
      });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
    }
    expect(
      await database.client.regulationVersion.findUniqueOrThrow({ where: { id: versionId } }),
    ).toMatchObject({
      revision: 1n,
      homegrownAgeStart: 15,
      homegrownAgeEnd: 21,
      clubCount: 8,
      qualificationCount: 5,
      relegationCount: 2,
      winPoints: 3,
      drawPoints: 1,
      lossPoints: 0,
      effectiveMode: 'SCHEDULED',
    });
    expect(
      await database.client.auditRecord.count({
        where: { actionCode: 'REGULATION_DRAFT_UPDATED', objectId: versionId },
      }),
    ).toBe(0);
  });

  it('requires current seasonal preparation authority and live mutation integrity', async () => {
    const [season, otherSeason] = fixtures.seasons;
    const manager = await createLiveAccount('T010P');
    const officer = await createLiveAccount('T010O');
    const administrator = await createLiveAccount('T010A');
    const creator = await createLiveAccount('T010N');
    await grantSeasonRole(manager.account.id, season.id, 'SEASON_MANAGER');
    await grantSeasonRole(officer.account.id, season.id, 'SCHEDULING_OFFICER');
    await database.client.systemRoleAssignment.create({
      data: {
        accountId: administrator.account.id,
        roleCode: 'SYSTEM_ADMINISTRATOR',
        grantedBy: fixtures.accounts[0].id,
        grantedAt: await database.now(),
      },
    });
    await database.client.createSeasonGrant.create({
      data: {
        accountId: creator.account.id,
        grantedBy: fixtures.accounts[0].id,
        grantedAt: await database.now(),
      },
    });

    await request(app.getHttpServer())
      .get(`/api/v1/seasons/${season.id}/regulation-versions`)
      .expect(401);
    for (const session of [officer, administrator, creator])
      await createRequest(session.tokens, season.id, {}).expect(403);
    await readRequest(
      manager.tokens,
      `/api/v1/seasons/${otherSeason.id}/regulation-versions`,
    ).expect(404);

    await request(app.getHttpServer())
      .post(`/api/v1/seasons/${season.id}/regulation-versions`)
      .set('Cookie', `${SESSION_COOKIE}=${manager.tokens.token}`)
      .send({})
      .expect(403);
    await request(app.getHttpServer())
      .post(`/api/v1/seasons/${season.id}/regulation-versions`)
      .set('Cookie', `${SESSION_COOKIE}=${manager.tokens.token}`)
      .set('Origin', 'https://whistle.test')
      .send({})
      .expect(403);
    const privateDraft = await createRequest(manager.tokens, season.id, {}).expect(201);
    const otherSeasonManager = await createLiveAccount('T010Q');
    await grantSeasonRole(otherSeasonManager.account.id, otherSeason.id, 'SEASON_MANAGER');
    const privateVersionId = privateDraft.body.data.id as string;
    await readRequest(
      otherSeasonManager.tokens,
      `/api/v1/regulation-versions/${privateVersionId}`,
    ).expect(404);
    await readRequest(
      otherSeasonManager.tokens,
      `/api/v1/regulation-versions/${randomUUID()}`,
    ).expect(404);
    await updateRequest(otherSeasonManager.tokens, privateVersionId, {
      expectedRevision: '1',
      squadLimit: 10,
    }).expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/regulation-versions/${privateVersionId}`)
      .set('Cookie', `${SESSION_COOKIE}=${manager.tokens.token}`)
      .set('X-CSRF-Token', manager.tokens.csrfToken)
      .send({ expectedRevision: '1', squadLimit: 25 })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/regulation-versions/${privateVersionId}`)
      .set('Cookie', `${SESSION_COOKIE}=${manager.tokens.token}`)
      .set('Origin', 'https://whistle.test')
      .send({ expectedRevision: '1', squadLimit: 25 })
      .expect(403);
    await updateRequest(manager.tokens, randomUUID(), {
      expectedRevision: '1',
      squadLimit: 1,
    }).expect(404);
  });

  it('rejects child IDs, unknown fields, and invalid nested semantics before persistence', async () => {
    const manager = await createLiveAccount('T010V');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    const invalidPayloads = [
      { unknown: true },
      {
        registrationWindows: [
          {
            id: randomUUID(),
            intakeKind: 'CLUB_APPLICATION',
            opensAt: '2026-06-01T00:00:00Z',
            closesAt: '2026-07-01T00:00:00Z',
          },
        ],
      },
      { goalTypes: [{ code: 'C', name: 'Own goal', isOwnGoal: false, enabled: true }] },
      {
        registrationWindows: [
          {
            intakeKind: 'PLAYER_CHANGE',
            opensAt: '2026-06-01T00:00:00Z',
            closesAt: '2026-07-01T00:00:00Z',
          },
          {
            intakeKind: 'PLAYER_CHANGE',
            opensAt: '2026-06-15T00:00:00Z',
            closesAt: '2026-07-15T00:00:00Z',
          },
        ],
      },
    ];
    for (const payload of invalidPayloads) {
      const response = await createRequest(manager.tokens, seasonId, payload);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toMatch(/VALIDATION_FAILED|INVALID_INPUT/);
    }
    expect(await database.client.regulationCase.count({ where: { seasonId } })).toBe(0);
    expect(await database.client.regulationVersion.count({ where: { seasonId } })).toBe(0);
    expect(
      await database.client.auditRecord.count({
        where: { actionCode: 'REGULATION_DRAFT_CREATED' },
      }),
    ).toBe(0);

    const created = await createRequest(manager.tokens, seasonId, {}).expect(201);
    const versionId = created.body.data.id as string;
    const invalidUpdate = await updateRequest(manager.tokens, versionId, {
      expectedRevision: '1',
      goalTypes: [
        {
          id: randomUUID(),
          code: 'A',
          name: 'Goal',
          isOwnGoal: false,
          enabled: true,
        },
      ],
    }).expect(400);
    expect(invalidUpdate.body.error.code).toMatch(/VALIDATION_FAILED|INVALID_INPUT/);
    expect(
      await database.client.regulationVersion.findUniqueOrThrow({ where: { id: versionId } }),
    ).toMatchObject({ revision: 1n });
  });

  it('rolls back version and child replacement when audit append fails', async () => {
    const manager = await createLiveAccount('T010F');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    const created = await createRequest(manager.tokens, seasonId, draftContent()).expect(201);
    const versionId = created.body.data.id as string;
    const writer = app.get(AuditWriterService);
    const append = jest
      .spyOn(writer, 'append')
      .mockRejectedValueOnce(new Error('injected regulation audit failure'));
    try {
      const failed = await updateRequest(manager.tokens, versionId, {
        expectedRevision: '1',
        squadLimit: 30,
        registrationWindows: [],
      });
      expect(failed.status).toBe(500);
      expect(failed.body.error.code).toBe('INTERNAL_ERROR');
    } finally {
      append.mockRestore();
    }

    const saved = await database.client.regulationVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: { registrationWindows: true },
    });
    expect(saved).toMatchObject({ revision: 1n, squadLimit: null });
    expect(saved.registrationWindows).toHaveLength(2);
    expect(
      await database.client.auditRecord.count({
        where: { actionCode: 'REGULATION_DRAFT_UPDATED', objectId: versionId },
      }),
    ).toBe(0);
  });

  it('serializes competing draft creation and rejects a draft mutation after the season closes', async () => {
    const manager = await createLiveAccount('T010S');
    const [season, otherSeason] = fixtures.seasons;
    const seasonId = season.id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    await grantSeasonRole(manager.account.id, otherSeason.id, 'SEASON_MANAGER');
    const created = await createRequest(manager.tokens, seasonId, {}).expect(201);
    const versionId = created.body.data.id as string;
    const duplicate = await createRequest(manager.tokens, seasonId, {}).expect(409);
    expect(duplicate.body.error.code).toBe('STATE_CONFLICT');
    const competing = await Promise.all([
      createRequest(manager.tokens, otherSeason.id, {}),
      createRequest(manager.tokens, otherSeason.id, {}),
    ]);
    expect(competing.map(({ status }) => status).sort()).toEqual([201, 409]);
    expect(
      await database.client.regulationVersion.count({ where: { seasonId: otherSeason.id } }),
    ).toBe(1);
    await database.client.season.update({ where: { id: seasonId }, data: { state: 'CLOSED' } });
    const closed = await updateRequest(manager.tokens, versionId, {
      expectedRevision: '1',
      squadLimit: 25,
    }).expect(409);
    expect(closed.body.error.code).toBe('STATE_CONFLICT');
    expect(
      await database.client.regulationVersion.findUniqueOrThrow({ where: { id: versionId } }),
    ).toMatchObject({ revision: 1n, squadLimit: null });
  });

  it('rechecks live session authority immediately before persisting draft edits', async () => {
    const manager = await createLiveAccount('T010X');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    const created = await createRequest(manager.tokens, seasonId, {}).expect(201);
    const versionId = created.body.data.id as string;
    const sessions = app.get(AuthService).sessions;
    const requireSession = sessions.require.bind(sessions);
    let checks = 0;
    const recheck = jest.spyOn(sessions, 'require').mockImplementation((...args) => {
      checks += 1;
      if (checks === 3)
        throw new ApplicationError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
      return requireSession(...args);
    });
    try {
      const expired = await updateRequest(manager.tokens, versionId, {
        expectedRevision: '1',
        squadLimit: 25,
      }).expect(401);
      expect(expired.body.error.code).toBe('SESSION_EXPIRED');
    } finally {
      recheck.mockRestore();
    }
    expect(checks).toBe(3);
    expect(
      await database.client.regulationVersion.findUniqueOrThrow({ where: { id: versionId } }),
    ).toMatchObject({ revision: 1n, squadLimit: null });
    expect(
      await database.client.auditRecord.count({
        where: { actionCode: 'REGULATION_DRAFT_UPDATED', objectId: versionId },
      }),
    ).toBe(0);
  });

  it('allows only an eligible officer with an active preparation grant to create a draft', async () => {
    const proposer = await createLiveAccount('T010D');
    const officer = await createLiveAccount('T010R');
    const [season] = fixtures.seasons;
    await grantSeasonRole(proposer.account.id, season.id, 'SEASON_MANAGER');
    await grantSeasonRole(officer.account.id, season.id, 'REGISTRATION_OFFICER');
    const now = await database.now();
    const delegationCase = await database.client.delegationCase.create({
      data: {
        seasonId: season.id,
        proposerId: proposer.account.id,
        recipientId: officer.account.id,
      },
    });
    const startsAt = new Date(now.getTime() - 60_000);
    const endsAt = new Date(now.getTime() + 3_600_000);
    const version = await database.client.delegationVersion.create({
      data: {
        caseId: delegationCase.id,
        versionNumber: 1,
        preparedBy: proposer.account.id,
        recipientId: officer.account.id,
        state: 'GRANTED',
        submittedAt: now,
        decidedAt: now,
        decidedBy: fixtures.accounts[0].id,
        decisionReason: 'Approved for fixture access',
        actionCode: 'PREPARE_REGULATION_CHANGE',
        startMode: 'SCHEDULED',
        startsAt,
        endsAt,
        reason: 'Prepare a regulation draft',
      },
    });
    await database.client.delegationCase.update({
      where: { id: delegationCase.id },
      data: { currentVersionId: version.id },
    });
    await database.client.delegationGrant.create({
      data: {
        approvedVersionId: version.id,
        recipientId: officer.account.id,
        seasonId: season.id,
        actionCode: 'PREPARE_REGULATION_CHANGE',
        startsAt,
        endsAt,
        grantedBy: fixtures.accounts[0].id,
        grantedAt: now,
      },
    });

    await readRequest(officer.tokens, `/api/v1/seasons/${season.id}/regulation-versions`).expect(
      200,
    );
    await createRequest(officer.tokens, season.id, { squadLimit: 25 }).expect(201);
  });
});
