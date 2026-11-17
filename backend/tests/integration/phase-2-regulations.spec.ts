import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import { SecurityPrimitivesService } from '../../src/identity-access/security-primitives.service';
import { DatabaseService } from '../../src/platform/database.service';
import { ClockService } from '../../src/platform/clock.service';
import { SafeErrorFilter } from '../../src/platform/error.filter';
import { ResponseEnvelopeInterceptor } from '../../src/platform/response-envelope.interceptor';
import { SafeValidationPipe } from '../../src/platform/validation.pipe';
import { createPhase1Fixtures, resetPhase1Fixtures } from '../fixtures/phase-1-fixtures';
import { SeasonDependenciesService } from '../../src/season-regulations/season-dependencies.service';
import { RegulationJobsService } from '../../src/season-regulations/regulation-jobs.service';

describe('PHASE 2 regulation submission and successor HTTP contract', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL!;
  const clock = new ClockService();
  const database = new DatabaseService(databaseUrl, clock);
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
        passwordHash: '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',
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
    roleCode: 'SEASON_MANAGER' | 'REGISTRATION_OFFICER',
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

  async function grantPreparationDelegation(
    proposerId: string,
    recipientId: string,
    seasonId: string,
  ) {
    const now = await database.now();
    const delegationCase = await database.client.delegationCase.create({
      data: { seasonId, proposerId, recipientId },
    });
    const startsAt = new Date(now.getTime() - 60_000);
    const endsAt = new Date(now.getTime() + 3_600_000);
    const version = await database.client.delegationVersion.create({
      data: {
        caseId: delegationCase.id,
        versionNumber: 1,
        preparedBy: proposerId,
        recipientId,
        state: 'GRANTED',
        submittedAt: now,
        decidedAt: now,
        decidedBy: fixtures.accounts[0].id,
        decisionReason: 'Approved isolated preparation fixture.',
        actionCode: 'PREPARE_REGULATION_CHANGE',
        startMode: 'SCHEDULED',
        startsAt,
        endsAt,
        reason: 'Prepare this isolated regulation fixture.',
      },
    });
    await database.client.delegationCase.update({
      where: { id: delegationCase.id },
      data: { currentVersionId: version.id },
    });
    await database.client.delegationGrant.create({
      data: {
        approvedVersionId: version.id,
        recipientId,
        seasonId,
        actionCode: 'PREPARE_REGULATION_CHANGE',
        startsAt,
        endsAt,
        grantedBy: fixtures.accounts[0].id,
        grantedAt: now,
      },
    });
  }

  function authenticatedMutation(
    tokens: { token: string; csrfToken: string },
    method: 'post' | 'patch',
    path: string,
    body: Record<string, unknown>,
  ) {
    const httpRequest = request(app.getHttpServer());
    const actionRequest = method === 'post' ? httpRequest.post(path) : httpRequest.patch(path);
    return actionRequest
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', 'https://whistle.test')
      .set('X-CSRF-Token', tokens.csrfToken)
      .send(body);
  }

  const fullContent = () => ({
    effectiveMode: 'SCHEDULED',
    proposedEffectiveAt: '2030-06-01T00:00:00Z',
    squadLimit: 25,
    nonHomegrownLimit: 17,
    homegrownSeasons: 3,
    homegrownMonths: 36,
    homegrownAgeStart: 15,
    homegrownAgeEnd: 21,
    u21Cutoff: '2005-01-01',
    registrationWindows: [
      {
        intakeKind: 'CLUB_APPLICATION',
        opensAt: '2027-06-01T00:00:00Z',
        closesAt: '2027-07-01T00:00:00Z',
      },
      {
        intakeKind: 'PLAYER_CHANGE',
        opensAt: '2027-07-01T00:00:00Z',
        closesAt: '2027-08-01T00:00:00Z',
      },
    ],
    clubCount: 20,
    formatCode: 'DOUBLE_ROUND_ROBIN',
    legs: 2,
    plannedMinutes: 90,
    preparationMinutes: 15,
    releaseMinutes: 10,
    winPoints: 3,
    drawPoints: 1,
    lossPoints: 0,
    rankingPriority: [
      { position: 1, criterionCode: 'POINTS' },
      { position: 2, criterionCode: 'GOAL_DIFFERENCE' },
      { position: 3, criterionCode: 'GOALS_FOR' },
    ],
    qualificationCount: 4,
    relegationCount: 3,
    goalTypes: [{ code: 'A', name: 'Goal', isOwnGoal: false, enabled: true }],
    cardTypes: [{ code: 'YELLOW', name: 'Yellow card', meaning: 'YELLOW', enabled: true }],
  });

  function createDraft(
    actor: { tokens: { token: string; csrfToken: string } },
    seasonId: string,
    content: Record<string, unknown> = fullContent(),
    predecessorVersionId?: string,
  ) {
    return authenticatedMutation(
      actor.tokens,
      'post',
      `/api/v1/seasons/${seasonId}/regulation-versions`,
      { ...content, ...(predecessorVersionId ? { predecessorVersionId } : {}) },
    );
  }

  function act(
    actor: { tokens: { token: string; csrfToken: string } },
    versionId: string,
    action: 'submit' | 'withdraw' | 'return' | 'reject' | 'approve',
    body: Record<string, unknown>,
  ) {
    return authenticatedMutation(
      actor.tokens,
      'post',
      `/api/v1/regulation-versions/${versionId}/${action}`,
      action === 'approve' ? { expectedCurrentVersionId: null, ...body } : body,
    );
  }

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

  it('independently approves exact scheduled content and replays the approval without creating an effective basis', async () => {
    const preparer = await createLiveAccount('PREPARER');
    const approver = await createLiveAccount('APPROVER');
    const season = fixtures.seasons[0];
    await grantSeasonRole(preparer.account.id, season.id, 'SEASON_MANAGER');
    await grantSeasonRole(approver.account.id, season.id, 'SEASON_MANAGER');
    const draft = await createDraft(preparer, season.id).expect(201);
    const versionId = draft.body.data.id;
    const submitted = await act(preparer, versionId, 'submit', {
      expectedRevision: draft.body.data.revision,
      reason: 'Submit complete content.',
    }).expect(200);
    const body = {
      expectedRevision: submitted.body.data.revision,
      submittedVersionId: versionId,
      reason: 'Approve reviewed rules.',
    };
    const key = randomUUID();
    await act(preparer, versionId, 'approve', body)
      .set('Idempotency-Key', randomUUID())
      .expect(403);
    const approved = await act(approver, versionId, 'approve', body)
      .set('Idempotency-Key', key)
      .expect(200);
    const replay = await act(approver, versionId, 'approve', body)
      .set('Idempotency-Key', key)
      .expect(200);
    expect(replay.body.data).toEqual(approved.body.data);
    await act(approver, versionId, 'approve', { ...body, reason: 'Changed approval reason.' })
      .set('Idempotency-Key', key)
      .expect(409);
    expect(
      await database.client.regulationVersion.findUnique({ where: { id: versionId } }),
    ).toMatchObject({
      state: 'APPROVED_WAITING',
      decidedBy: approver.account.id,
      proposedEffectiveAt: new Date('2030-06-01T00:00:00Z'),
      activeFrom: null,
      activationProcessedAt: null,
    });
    expect(await database.client.season.findUnique({ where: { id: season.id } })).toMatchObject({
      currentRegulationVersionId: null,
    });
    const second = await createDraft(preparer, season.id, {
      ...fullContent(),
      effectiveMode: 'IMMEDIATE',
      proposedEffectiveAt: null,
    }).expect(201);
    const secondId = second.body.data.id;
    const secondSubmission = await act(preparer, secondId, 'submit', {
      expectedRevision: second.body.data.revision,
      reason: 'Submit immediate alternative.',
    }).expect(200);
    await act(approver, secondId, 'approve', {
      ...body,
      expectedRevision: secondSubmission.body.data.revision,
      submittedVersionId: secondId,
    })
      .set('Idempotency-Key', randomUUID())
      .expect(409);

    const createRequest = await authenticatedMutation(
      approver.tokens,
      'post',
      `/api/v1/seasons/${season.id}/regulation-change-requests`,
      { action: 'CANCEL', waitingVersionId: versionId, reason: 'Cancel the future regulation.' },
    ).expect(201);
    const change = createRequest.body.data;
    const route = `/api/v1/regulation-change-requests/${change.id}`;
    const submittedChange = await authenticatedMutation(
      approver.tokens,
      'post',
      `${route}/submit`,
      {
        expectedRevision: change.revision,
        submittedVersionId: change.versionId,
        reason: 'Submit cancellation.',
      },
    ).expect(200);
    const decision = {
      expectedRevision: submittedChange.body.data.revision,
      submittedVersionId: change.versionId,
      reason: 'Approve cancellation.',
    };
    await authenticatedMutation(approver.tokens, 'post', `${route}/approve`, decision)
      .set('Idempotency-Key', randomUUID())
      .expect(403);
    await authenticatedMutation(preparer.tokens, 'post', `${route}/approve`, decision)
      .set('Idempotency-Key', randomUUID())
      .expect(200);
    expect(
      await database.client.regulationVersion.findUnique({ where: { id: versionId } }),
    ).toMatchObject({ state: 'CANCELLED', activeFrom: null });
  });

  it('immediately activates each independent approval and closes the prior interval at the same instant', async () => {
    const preparer = await createLiveAccount('PREPARER');
    const approver = await createLiveAccount('APPROVER');
    const season = fixtures.seasons[0];
    await grantSeasonRole(preparer.account.id, season.id, 'SEASON_MANAGER');
    await grantSeasonRole(approver.account.id, season.id, 'SEASON_MANAGER');
    const approvedIds: string[] = [];
    for (const squadLimit of [25, 24]) {
      const draft = await createDraft(preparer, season.id, {
        ...fullContent(),
        effectiveMode: 'IMMEDIATE',
        proposedEffectiveAt: null,
        squadLimit,
      }).expect(201);
      const id = draft.body.data.id as string;
      const submission = await act(preparer, id, 'submit', {
        expectedRevision: draft.body.data.revision,
        reason: 'Submit rules.',
      }).expect(200);
      const approval = {
        expectedRevision: submission.body.data.revision,
        submittedVersionId: id,
        reason: 'Approve rules.',
        expectedCurrentVersionId: approvedIds.at(-1) ?? null,
      };
      const key = randomUUID();
      if (approvedIds.length === 1) {
        const staleBasis = await act(approver, id, 'approve', {
          ...approval,
          expectedCurrentVersionId: null,
        })
          .set('Idempotency-Key', key)
          .expect(409);
        expect(staleBasis.body.error.code).toBe('BASIS_CHANGED');
        const ports = app.get(SeasonDependenciesService);
        const read = jest.spyOn(ports, 'read').mockResolvedValueOnce({
          status: 'UNAVAILABLE',
          facts: null,
          locks: [],
          basis: {
            owner: 'registry-registration',
            cause: 'PROVIDER_FAILURE',
            presentRelations: [],
            registeredWriters: ['registry-registration'],
          },
        });
        try {
          await act(approver, id, 'approve', approval).set('Idempotency-Key', key).expect(503);
        } finally {
          read.mockRestore();
        }
        const append = jest
          .spyOn(app.get(AuditWriterService), 'append')
          .mockRejectedValueOnce(new Error('injected approval audit failure'));
        try {
          await act(approver, id, 'approve', approval).set('Idempotency-Key', key).expect(500);
        } finally {
          append.mockRestore();
        }
        expect(
          await database.client.season.findUniqueOrThrow({ where: { id: season.id } }),
        ).toMatchObject({ currentRegulationVersionId: approvedIds[0] });
        expect(
          await database.client.regulationVersion.findUniqueOrThrow({ where: { id } }),
        ).toMatchObject({ state: 'SUBMITTED', approvedAt: null, activeFrom: null });
      }
      await act(approver, id, 'approve', approval).set('Idempotency-Key', key).expect(200);
      approvedIds.push(id);
    }
    const first = await database.client.regulationVersion.findUniqueOrThrow({
      where: { id: approvedIds[0] },
    });
    const second = await database.client.regulationVersion.findUniqueOrThrow({
      where: { id: approvedIds[1] },
    });
    expect(first).toMatchObject({
      state: 'SUPERSEDED',
      squadLimit: 25,
      activeUntil: second.approvedAt,
    });
    expect(second).toMatchObject({
      state: 'EFFECTIVE',
      squadLimit: 24,
      activeFrom: second.approvedAt,
      activationProcessedAt: second.approvedAt,
      activeUntil: null,
    });
    expect(second.approvedAt).toBeInstanceOf(Date);
    expect(
      await database.client.season.findUniqueOrThrow({ where: { id: season.id } }),
    ).toMatchObject({
      currentRegulationVersionId: second.id,
    });
  });

  it.each(['recover', 'block'] as const)(
    'protects read-only basis at the due boundary and resolves the waiting version (%s)',
    async (outcome) => {
      const preparer = await createLiveAccount('PREPARER');
      const approver = await createLiveAccount('APPROVER');
      const season = fixtures.seasons[0];
      await grantSeasonRole(preparer.account.id, season.id, 'SEASON_MANAGER');
      await grantSeasonRole(approver.account.id, season.id, 'SEASON_MANAGER');
      const due = new Date((await database.now()).getTime() + 60_000);
      const draft = await createDraft(preparer, season.id, {
        ...fullContent(),
        proposedEffectiveAt: due.toISOString(),
      }).expect(201);
      const id = draft.body.data.id as string;
      const submitted = await act(preparer, id, 'submit', {
        expectedRevision: draft.body.data.revision,
        reason: 'Submit scheduled rules.',
      }).expect(200);
      const decision = {
        expectedRevision: submitted.body.data.revision,
        submittedVersionId: id,
        reason: 'Approve schedule.',
      };
      const key = randomUUID();
      const boundary = jest.spyOn(clock, 'now').mockResolvedValue(due);
      try {
        await act(approver, id, 'approve', decision).set('Idempotency-Key', key).expect(409);
      } finally {
        boundary.mockRestore();
      }
      await act(approver, id, 'approve', decision).set('Idempotency-Key', key).expect(200);
      const competing =
        outcome === 'recover'
          ? await createDraft(preparer, season.id, {
              ...fullContent(),
              effectiveMode: 'IMMEDIATE',
              proposedEffectiveAt: null,
            }).expect(201)
          : null;
      const competingSubmission =
        competing &&
        (await act(preparer, competing.body.data.id, 'submit', {
          expectedRevision: competing.body.data.revision,
          reason: 'Submit alternative.',
        }).expect(200));
      const receipts = await database.client.commandReceipt.findMany({
        where: { accountId: approver.account.id },
        orderBy: { id: 'asc' },
      });
      const trustedClock = jest.spyOn(clock, 'now').mockResolvedValue(due);
      try {
        await request(app.getHttpServer())
          .get(`/api/v1/seasons/${season.id}/regulation-versions`)
          .set('Cookie', `${SESSION_COOKIE}=${approver.tokens.token}`)
          .expect(503);
        expect(
          await database.client.regulationVersion.findUniqueOrThrow({ where: { id } }),
        ).toMatchObject({
          state: 'APPROVED_WAITING',
          activeFrom: null,
          activationProcessedAt: null,
        });
        expect(
          await database.client.season.findUniqueOrThrow({ where: { id: season.id } }),
        ).toMatchObject({ currentRegulationVersionId: null });
        expect(
          await database.client.auditRecord.count({
            where: {
              objectId: id,
              actionCode: { in: ['REGULATION_ACTIVATED', 'REGULATION_ACTIVATION_BLOCKED'] },
            },
          }),
        ).toBe(0);
        expect(
          await database.client.commandReceipt.findMany({
            where: { accountId: approver.account.id },
            orderBy: { id: 'asc' },
          }),
        ).toEqual(receipts);
        const processedAt = new Date(due.getTime() + 10_000);
        trustedClock.mockResolvedValue(processedAt);
        const jobs = app.get(RegulationJobsService);
        if (outcome === 'block') {
          const ports = app.get(SeasonDependenciesService);
          const originalRead = ports.read.bind(ports);
          const read = jest.spyOn(ports, 'read').mockImplementation((kind, context, input) => {
            if (kind === 'scheduleFreeze')
              return Promise.resolve({
                status: 'KNOWN',
                locks: [],
                facts: {
                  structure: { clubCount: 18, formatCode: 'DOUBLE_ROUND_ROBIN', legs: 2 },
                  planning: null,
                  initialApprovalVersionId: id,
                  frozenAt: processedAt.toISOString(),
                  affectedScheduleVersionIds: [id],
                },
                basis: { owner: 'scheduling', sourceRevision: '1', references: [id] },
              }) as ReturnType<typeof ports.read>;
            return originalRead(kind, context, input);
          });
          try {
            await expect(jobs.processDue()).resolves.toMatchObject({
              activated: 0,
              blocked: 1,
              failed: 0,
            });
          } finally {
            read.mockRestore();
          }
          await expect(jobs.processDue()).resolves.toEqual({
            activated: 0,
            blocked: 0,
            failed: 0,
            skipped: 0,
          });
          expect(
            await database.client.regulationVersion.findUniqueOrThrow({ where: { id } }),
          ).toMatchObject({
            state: 'ACTIVATION_BLOCKED',
            activeFrom: null,
            activationProcessedAt: processedAt,
          });
          expect(
            await database.client.auditRecord.count({
              where: {
                objectId: id,
                actionCode: 'REGULATION_ACTIVATION_BLOCKED',
              },
            }),
          ).toBe(1);
          return;
        }
        const maintenance = randomUUID();
        await database.setMaintenance(true, maintenance);
        try {
          await expect(jobs.processDue()).resolves.toMatchObject({
            activated: 0,
            blocked: 0,
            failed: 1,
          });
        } finally {
          await database.setMaintenance(false, maintenance);
        }
        const read = jest.spyOn(app.get(SeasonDependenciesService), 'read').mockResolvedValueOnce({
          status: 'UNAVAILABLE',
          facts: null,
          locks: [],
          basis: {
            owner: 'registry-registration',
            cause: 'PROVIDER_FAILURE',
            presentRelations: [],
            registeredWriters: ['registry-registration'],
          },
        });
        try {
          await expect(jobs.processDue()).resolves.toMatchObject({
            activated: 0,
            blocked: 0,
            failed: 1,
          });
        } finally {
          read.mockRestore();
        }
        expect(
          await database.client.regulationVersion.findUniqueOrThrow({ where: { id } }),
        ).toMatchObject({
          state: 'APPROVED_WAITING',
          proposedEffectiveAt: due,
          activationProcessedAt: null,
        });
        const originalMode = process.env.NODE_ENV;
        let restarted: INestApplication | undefined;
        const startup = jest.spyOn(RegulationJobsService.prototype, 'processDue');
        try {
          process.env.NODE_ENV = 'production';
          const requestRace = act(approver, competingSubmission!.body.data.id, 'approve', {
            expectedRevision: competingSubmission!.body.data.revision,
            submittedVersionId: competingSubmission!.body.data.id,
            expectedCurrentVersionId: null,
            reason: 'Approve against reviewed empty basis.',
          })
            .set('Idempotency-Key', randomUUID())
            .expect(409);
          await Promise.all([
            startApplication(database).then((app) => {
              restarted = app;
            }),
            requestRace,
          ]);
          expect(startup).toHaveBeenCalledTimes(1);
        } finally {
          if (originalMode === undefined) delete process.env.NODE_ENV;
          else process.env.NODE_ENV = originalMode;
          await restarted?.close();
          startup.mockRestore();
        }
        expect(await jobs.processDue({ kind: 'operator', identity: 'fixture-operator' })).toEqual({
          activated: 0,
          blocked: 0,
          skipped: 0,
          failed: 0,
        });
        const response = await request(app.getHttpServer())
          .get(`/api/v1/seasons/${season.id}/regulation-versions`)
          .set('Cookie', `${SESSION_COOKIE}=${approver.tokens.token}`)
          .expect(200);
        expect(response.body.data.overview.currentEffective).toMatchObject({
          id,
          activeFrom: due.toISOString(),
        });
        expect(
          await database.client.regulationVersion.findUniqueOrThrow({ where: { id } }),
        ).toMatchObject({
          state: 'EFFECTIVE',
          activeFrom: due,
          activationProcessedAt: processedAt,
        });
        expect(
          await database.client.auditRecord.count({
            where: {
              objectId: id,
              actionCode: 'REGULATION_ACTIVATED',
            },
          }),
        ).toBe(1);
      } finally {
        trustedClock.mockRestore();
      }
    },
  );

  it('atomically replaces the waiting version and excludes an editor of the replacement alone', async () => {
    const original = await createLiveAccount('ORIGINAL');
    const editor = await createLiveAccount('REPLACEMENT');
    const proposer = await createLiveAccount('PROPOSER');
    const approver = await createLiveAccount('APPROVER');
    const season = fixtures.seasons[0];
    for (const actor of [original, editor, proposer, approver])
      await grantSeasonRole(actor.account.id, season.id, 'SEASON_MANAGER');
    const cutoff = new Date((await database.now()).getTime() + 90_000);
    const first = await createDraft(original, season.id, {
      ...fullContent(),
      proposedEffectiveAt: cutoff.toISOString(),
    }).expect(201);
    const waitingId = first.body.data.id as string;
    const submitted = await act(original, waitingId, 'submit', {
      expectedRevision: first.body.data.revision,
      reason: 'Submit first schedule.',
    }).expect(200);
    await act(approver, waitingId, 'approve', {
      expectedRevision: submitted.body.data.revision,
      submittedVersionId: waitingId,
      reason: 'Approve first schedule.',
    })
      .set('Idempotency-Key', randomUUID())
      .expect(200);
    const second = await createDraft(editor, season.id).expect(201);
    const replacementId = second.body.data.id as string;
    await act(editor, replacementId, 'submit', {
      expectedRevision: second.body.data.revision,
      reason: 'Submit replacement.',
    }).expect(200);
    const created = await authenticatedMutation(
      proposer.tokens,
      'post',
      `/api/v1/seasons/${season.id}/regulation-change-requests`,
      {
        action: 'REPLACE',
        waitingVersionId: waitingId,
        replacementVersionId: replacementId,
        reason: 'Replace the waiting version.',
      },
    ).expect(201);
    const change = created.body.data;
    const route = `/api/v1/regulation-change-requests/${change.id}`;
    const ready = await authenticatedMutation(proposer.tokens, 'post', `${route}/submit`, {
      expectedRevision: change.revision,
      submittedVersionId: change.versionId,
      reason: 'Submit request.',
    }).expect(200);
    expect(
      await database.client.auditRecord.findFirst({
        where: { objectId: change.id, actionCode: 'REGULATION_CHANGE_SUBMITTED' },
      }),
    ).toMatchObject({ seasonId: season.id });
    const decision = {
      expectedRevision: ready.body.data.revision,
      submittedVersionId: change.versionId,
      reason: 'Approve replacement.',
      expectedCurrentVersionId: null,
    };
    const key = randomUUID();
    await authenticatedMutation(editor.tokens, 'post', `${route}/approve`, decision)
      .set('Idempotency-Key', randomUUID())
      .expect(403);
    const boundary = jest.spyOn(clock, 'now').mockResolvedValue(cutoff);
    try {
      await authenticatedMutation(approver.tokens, 'post', `${route}/approve`, decision)
        .set('Idempotency-Key', key)
        .expect(409);
    } finally {
      boundary.mockRestore();
    }
    const writer = app.get(AuditWriterService);
    const appendEvent = writer.append.bind(writer);
    const append = jest.spyOn(writer, 'append').mockImplementation((context, event) => {
      if (event.action === 'REGULATION_CHANGE_APPROVED')
        throw new Error('injected change audit failure');
      return appendEvent(context, event);
    });
    try {
      await authenticatedMutation(approver.tokens, 'post', `${route}/approve`, decision)
        .set('Idempotency-Key', key)
        .expect(500);
    } finally {
      append.mockRestore();
    }
    expect(
      await database.client.regulationVersion.findUniqueOrThrow({ where: { id: waitingId } }),
    ).toMatchObject({ state: 'APPROVED_WAITING', proposedEffectiveAt: cutoff });
    expect(
      await database.client.regulationVersion.findUniqueOrThrow({ where: { id: replacementId } }),
    ).toMatchObject({ state: 'SUBMITTED', approvedAt: null });
    const result = await authenticatedMutation(
      approver.tokens,
      'post',
      `${route}/approve`,
      decision,
    )
      .set('Idempotency-Key', key)
      .expect(200);
    const replay = await authenticatedMutation(
      approver.tokens,
      'post',
      `${route}/approve`,
      decision,
    )
      .set('Idempotency-Key', key)
      .expect(200);
    expect(replay.body.data).toEqual(result.body.data);
    expect(
      await database.client.regulationVersion.findMany({
        where: { seasonId: season.id, state: 'APPROVED_WAITING' },
        select: { id: true },
      }),
    ).toEqual([{ id: replacementId }]);
  });

  it('submits complete content exactly once, records a scoped reason, and keeps submitted content immutable', async () => {
    const manager = await createLiveAccount('T011S');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    const created = await createDraft(manager, seasonId).expect(201);
    const versionId = created.body.data.id as string;

    const submitted = await act(manager, versionId, 'submit', {
      expectedRevision: '1',
      reason: 'Submitted for independent review.',
    }).expect(200);

    expect(submitted.body).toMatchObject({
      data: { id: versionId, revision: '2' },
      requestId: expect.any(String),
    });
    expect(Object.keys(submitted.body.data)).toEqual(['id', 'revision']);
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
      state: 'SUBMITTED',
      revision: 2n,
      submittedAt: expect.any(Date),
      squadLimit: 25,
      nonHomegrownLimit: 17,
      winPoints: 3,
      relegationCount: 3,
    });
    expect(saved.registrationWindows).toHaveLength(2);
    expect(saved.rankingPriority).toHaveLength(3);
    expect(saved.goalTypes).toHaveLength(1);
    expect(saved.cardTypes).toHaveLength(1);
    await expect(
      database.client.regulationVersion.update({
        where: { id: versionId },
        data: { squadLimit: 30 },
      }),
    ).rejects.toThrow();
    await expect(
      act(manager, versionId, 'submit', {
        expectedRevision: '2',
        reason: 'Duplicate submission.',
      }),
    ).resolves.toMatchObject({ status: 409 });
    expect(
      await database.client.auditRecord.findFirst({
        where: {
          actionCode: 'REGULATION_SUBMITTED',
          objectKind: 'RegulationVersion',
          objectId: versionId,
        },
      }),
    ).toMatchObject({
      actorKind: 'ACCOUNT',
      actorId: manager.account.id,
      seasonId,
      reason: 'Submitted for independent review.',
      afterData: { versionId, versionNumber: 1, state: 'SUBMITTED', revision: '2' },
    });
  });

  it('rejects incomplete, stale, mismatched-target, unauthorized and reasonless transitions without changing the version', async () => {
    const manager = await createLiveAccount('T011M');
    const officer = await createLiveAccount('T011O');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    await grantSeasonRole(officer.account.id, seasonId, 'REGISTRATION_OFFICER');
    const incomplete = await createDraft(manager, seasonId, {}).expect(201);
    const versionId = incomplete.body.data.id as string;

    const incompleteSubmit = await act(manager, versionId, 'submit', {
      expectedRevision: '1',
      reason: 'Incomplete content must fail.',
    }).expect(400);
    expect(incompleteSubmit.body.error.code).toMatch(/VALIDATION_FAILED|INVALID_INPUT/);
    expect(
      await database.client.regulationVersion.findUniqueOrThrow({ where: { id: versionId } }),
    ).toMatchObject({ state: 'DRAFT', revision: 1n, submittedAt: null });

    await createDraft(manager, seasonId, fullContent()).expect(409);
  });

  it('returns and rejects only the exact submitted version, and creates an editable successor after return', async () => {
    const manager = await createLiveAccount('T011R');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    const created = await createDraft(manager, seasonId).expect(201);
    const originalId = created.body.data.id as string;
    await act(manager, originalId, 'submit', {
      expectedRevision: '1',
      reason: 'Submitted for review.',
    }).expect(200);

    await act(manager, originalId, 'return', {
      expectedRevision: '1',
      submittedVersionId: randomUUID(),
      reason: 'Target mismatch must fail.',
    }).expect(409);
    await act(manager, originalId, 'return', {
      expectedRevision: '2',
      submittedVersionId: originalId,
    }).expect(400);
    const returned = await act(manager, originalId, 'return', {
      expectedRevision: '2',
      submittedVersionId: originalId,
      reason: 'Correct the age limits.',
    }).expect(200);
    expect(returned.body.data).toEqual({ id: originalId, revision: '3' });
    const returnedDetail = await request(app.getHttpServer())
      .get(`/api/v1/regulation-versions/${originalId}`)
      .set('Cookie', `${SESSION_COOKIE}=${manager.tokens.token}`)
      .expect(200);
    expect(returnedDetail.body.data).toMatchObject({
      submittedAt: expect.any(String),
      decidedAt: expect.any(String),
      decidedBy: { id: manager.account.id },
      decisionReason: 'Correct the age limits.',
    });
    const history = await request(app.getHttpServer())
      .get(`/api/v1/regulation-versions/${originalId}/history`)
      .set('Cookie', `${SESSION_COOKIE}=${manager.tokens.token}`)
      .expect(200);
    expect(history.body.meta).toEqual({ page: 1, pageSize: 20, total: 3 });
    expect(history.body.data.items.map((item: { actionCode: string }) => item.actionCode)).toEqual([
      'REGULATION_RETURNED',
      'REGULATION_SUBMITTED',
      'REGULATION_DRAFT_CREATED',
    ]);
    const returnedOnly = await request(app.getHttpServer())
      .get(`/api/v1/regulation-versions/${originalId}/history?actionCode=REGULATION_RETURNED`)
      .set('Cookie', `${SESSION_COOKIE}=${manager.tokens.token}`)
      .expect(200);
    expect(returnedOnly.body.meta.total).toBe(1);
    expect(returnedOnly.body.data.items[0]).toMatchObject({
      actionCode: 'REGULATION_RETURNED',
      reason: 'Correct the age limits.',
      after: { state: 'RETURNED' },
    });

    const successor = await createDraft(manager, seasonId, { squadLimit: 26 }, originalId).expect(
      201,
    );
    const successorId = successor.body.data.id as string;
    expect(successor.body.data).toMatchObject({ revision: '1' });
    const detail = await request(app.getHttpServer())
      .get(`/api/v1/regulation-versions/${successorId}`)
      .set('Cookie', `${SESSION_COOKIE}=${manager.tokens.token}`)
      .expect(200);
    expect(detail.body.data).toMatchObject({
      id: successorId,
      versionNumber: 2,
      revision: '1',
      state: 'DRAFT',
      predecessorVersionId: originalId,
      content: { squadLimit: 26, nonHomegrownLimit: 17, winPoints: 3, relegationCount: 3 },
      capabilities: { canEditDraft: true },
    });
    await authenticatedMutation(
      manager.tokens,
      'patch',
      `/api/v1/regulation-versions/${successorId}`,
      {
        expectedRevision: '1',
        squadLimit: 27,
      },
    ).expect(200);
    expect(
      await database.client.regulationVersion.findUniqueOrThrow({ where: { id: originalId } }),
    ).toMatchObject({ state: 'RETURNED', revision: 3n, squadLimit: 25 });
    expect(
      await database.client.regulationVersionEditor.findMany({
        where: { versionId: { in: [originalId, successorId] } },
        select: { versionId: true, accountId: true },
      }),
    ).toEqual(
      expect.arrayContaining([
        { versionId: originalId, accountId: manager.account.id },
        { versionId: successorId, accountId: manager.account.id },
      ]),
    );
  });

  it('inherits the database-seeded preparer when a different manager creates the returned-content successor', async () => {
    const preparer = await createLiveAccount('T011A');
    const successorPreparer = await createLiveAccount('T011B');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(preparer.account.id, seasonId, 'SEASON_MANAGER');
    await grantSeasonRole(successorPreparer.account.id, seasonId, 'SEASON_MANAGER');

    const created = await createDraft(preparer, seasonId).expect(201);
    const originalId = created.body.data.id as string;
    expect(
      await database.client.regulationVersionEditor.findMany({
        where: { versionId: originalId },
        select: { accountId: true },
      }),
    ).toEqual([{ accountId: preparer.account.id }]);
    await act(preparer, originalId, 'submit', {
      expectedRevision: '1',
      reason: 'Submit the original content.',
    }).expect(200);
    await act(successorPreparer, originalId, 'return', {
      expectedRevision: '2',
      submittedVersionId: originalId,
      reason: 'Return to the preparer.',
    }).expect(200);

    const createdSuccessor = await createDraft(
      successorPreparer,
      seasonId,
      { squadLimit: 26 },
      originalId,
    ).expect(201);
    const successorId = createdSuccessor.body.data.id as string;
    const successor = await database.client.regulationVersion.findUniqueOrThrow({
      where: { id: successorId },
      select: { caseId: true, predecessorVersionId: true, preparedBy: true, state: true },
    });
    const original = await database.client.regulationVersion.findUniqueOrThrow({
      where: { id: originalId },
      select: { caseId: true },
    });
    expect(successor.caseId).toBe(original.caseId);
    expect(successor).toMatchObject({
      predecessorVersionId: originalId,
      preparedBy: successorPreparer.account.id,
      state: 'DRAFT',
    });
    const successorEditors = await database.client.regulationVersionEditor.findMany({
      where: { versionId: successorId },
      select: { accountId: true },
      orderBy: { accountId: 'asc' },
    });
    expect(successorEditors).toHaveLength(2);
    expect(successorEditors).toEqual(
      expect.arrayContaining([
        { accountId: preparer.account.id },
        { accountId: successorPreparer.account.id },
      ]),
    );
  });

  it('withdraws only by a current authorized version editor, and keeps D019 preparation out of manager decisions', async () => {
    const manager = await createLiveAccount('T011W');
    const otherManager = await createLiveAccount('T011X');
    const officer = await createLiveAccount('T011O');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    await grantSeasonRole(otherManager.account.id, seasonId, 'SEASON_MANAGER');
    await grantSeasonRole(officer.account.id, seasonId, 'REGISTRATION_OFFICER');
    const selectable = (token: string) =>
      request(app.getHttpServer())
        .get('/api/v1/regulation-seasons')
        .set('Cookie', `${SESSION_COOKIE}=${token}`)
        .expect(200);
    expect((await selectable(officer.tokens.token)).body.data.items).toEqual([]);
    await grantPreparationDelegation(manager.account.id, officer.account.id, seasonId);
    for (const actor of [manager, officer]) {
      expect((await selectable(actor.tokens.token)).body.data.items).toEqual([
        expect.objectContaining({ id: seasonId, state: 'OPEN', name: expect.any(String) }),
      ]);
    }
    const created = await createDraft(manager, seasonId).expect(201);
    const versionId = created.body.data.id as string;
    await authenticatedMutation(
      officer.tokens,
      'patch',
      `/api/v1/regulation-versions/${versionId}`,
      {
        expectedRevision: '1',
        squadLimit: 26,
      },
    ).expect(200);
    await act(manager, versionId, 'submit', {
      expectedRevision: '2',
      reason: 'Submit for review.',
    }).expect(200);

    await act(otherManager, versionId, 'withdraw', {
      expectedRevision: '3',
      reason: 'Not an editor.',
    }).expect(403);
    await act(officer, versionId, 'return', {
      expectedRevision: '3',
      submittedVersionId: versionId,
      reason: 'Delegated preparer cannot return manager decisions.',
    }).expect(403);
    const withdrawn = await act(officer, versionId, 'withdraw', {
      expectedRevision: '3',
      reason: 'Authorized editor withdrawal.',
    }).expect(200);
    expect(withdrawn.body.data).toEqual({ id: versionId, revision: '4' });
    const successor = await createDraft(officer, seasonId, { squadLimit: 27 }, versionId).expect(
      201,
    );
    const successorId = successor.body.data.id as string;
    const successorDetail = await request(app.getHttpServer())
      .get(`/api/v1/regulation-versions/${successorId}`)
      .set('Cookie', `${SESSION_COOKIE}=${officer.tokens.token}`)
      .expect(200);
    expect(successorDetail.body.data).toMatchObject({
      versionNumber: 2,
      state: 'DRAFT',
      predecessorVersionId: versionId,
      preparedBy: { id: officer.account.id },
      content: { squadLimit: 27, nonHomegrownLimit: 17, winPoints: 3 },
    });
    expect(successorDetail.body.data.editors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          accountId: manager.account.id,
          fullName: manager.account.fullName,
        }),
        expect.objectContaining({
          accountId: officer.account.id,
          fullName: officer.account.fullName,
        }),
      ]),
    );
    expect(
      await database.client.regulationVersion.findUniqueOrThrow({ where: { id: versionId } }),
    ).toMatchObject({ state: 'WITHDRAWN', revision: 4n, squadLimit: 26 });
  });

  it('records rejected state and does not permit resuming rejected content', async () => {
    const manager = await createLiveAccount('T011J');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    const created = await createDraft(manager, seasonId).expect(201);
    const versionId = created.body.data.id as string;
    await act(manager, versionId, 'submit', {
      expectedRevision: '1',
      reason: 'Submit for review.',
    }).expect(200);
    const rejected = await act(manager, versionId, 'reject', {
      expectedRevision: '2',
      submittedVersionId: versionId,
      reason: 'Proposal does not satisfy the stated requirements.',
    }).expect(200);
    expect(rejected.body.data).toEqual({ id: versionId, revision: '3' });
    await createDraft(manager, seasonId, fullContent(), versionId).expect(409);
  });

  it('rolls back submission and its audit event if audit append fails', async () => {
    const manager = await createLiveAccount('T011F');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    const created = await createDraft(manager, seasonId).expect(201);
    const versionId = created.body.data.id as string;
    const writer = app.get(AuditWriterService);
    const append = jest
      .spyOn(writer, 'append')
      .mockRejectedValueOnce(new Error('injected audit failure'));
    try {
      await act(manager, versionId, 'submit', {
        expectedRevision: '1',
        reason: 'Submit for review.',
      }).expect(500);
    } finally {
      append.mockRestore();
    }
    expect(
      await database.client.regulationVersion.findUniqueOrThrow({ where: { id: versionId } }),
    ).toMatchObject({ state: 'DRAFT', revision: 1n, submittedAt: null });
    expect(
      await database.client.auditRecord.count({ where: { actionCode: 'REGULATION_SUBMITTED' } }),
    ).toBe(0);
  });
});
