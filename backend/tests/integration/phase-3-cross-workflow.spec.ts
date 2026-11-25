import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import { DatabaseService } from '../../src/platform/database.service';
import { phase3Workflows } from '../fixtures/phase-3-workflows';
import { holdCommittedRow, waitForLockWaiters } from '../fixtures/committed-race';
import { setupPhase3HttpFixture } from './phase-3-fixtures';

describe('PHASE 3 T026 — cross-workflow authority, races and regression', () => {
  const fixture = setupPhase3HttpFixture();
  const workflows = phase3Workflows(fixture);
  let reader: DatabaseService;
  beforeAll(() => {
    reader = new DatabaseService(process.env.TEST_DATABASE_URL!);
  });
  afterAll(async () => {
    await reader?.close();
  });

  it('denies twelve distinct direct-access/forgery cases without a committed business change', async () => {
    const player = await workflows.player('SECURITY');
    const { officer, playerManager } = await workflows.staff();
    const admin = await fixture.authenticate(fixture.staff.admin);
    const outsider = await fixture.authenticate(fixture.staff.unprivilegedUser);
    const otherSeason = await fixture.authenticate(fixture.staff.registrationOfficerSeason2);
    const profile = {
      code: 'P_DENIED',
      fullName: 'Không được tạo',
      birthDate: '2000-01-01',
      nationalityCode: 'ENG',
      positionCode: 'CM',
    };
    const checks: Array<() => PromiseLike<unknown>> = [
      () => request(fixture.app.getHttpServer()).get('/api/v1/players').expect(401),
      () => fixture.apiRequest(admin, 'post', '/players', profile).expect(403),
      () => fixture.apiRequest(officer, 'post', '/players', profile).expect(403),
      () => fixture.apiRequest(outsider, 'get', '/players').expect(403),
      () => fixture.apiRequest(outsider, 'get', '/players/catalogs').expect(403),
      () =>
        fixture
          .apiRequest(otherSeason, 'get', `/seasons/${fixture.seasons[0].id}/player-registrations`)
          .expect(404),
      () =>
        fixture
          .apiRequest(admin, 'get', `/seasons/${fixture.seasons[0].id}/club-applications`)
          .expect(404),
      () => fixture.apiRequest(outsider, 'get', `/players/${player.id}/history`).expect(403),
      () => fixture.apiRequest(officer, 'get', '/audit-logs').expect(403),
      () => fixture.apiRequest(admin, 'get', '/audit-logs/export').expect(404),
      () =>
        request(fixture.app.getHttpServer())
          .patch(`/api/v1/players/${player.id}`)
          .set('Cookie', `${SESSION_COOKIE}=${playerManager.token}`)
          .set('Origin', 'https://forged.test')
          .set('X-CSRF-Token', playerManager.csrfToken)
          .send({ expectedRevision: '1', fullName: 'Forged' })
          .expect(403),
      () =>
        request(fixture.app.getHttpServer())
          .patch(`/api/v1/players/${player.id}`)
          .set('Cookie', `${SESSION_COOKIE}=${playerManager.token}`)
          .set('Origin', fixture.origin)
          .set('X-CSRF-Token', 'forged-token')
          .send({ expectedRevision: '1', fullName: 'Forged' })
          .expect(403),
    ];
    for (const check of checks) await check();
    expect(checks).toHaveLength(12);
    expect(
      await reader.client.player.findUniqueOrThrow({ where: { id: player.id } }),
    ).toMatchObject({ fullName: 'Cầu thủ SECURITY', revision: 1n });
    expect(await reader.client.player.count()).toBe(1);
  });

  it('keeps UC09 and portrait management available after closure with the same session and assignments', async () => {
    const player = await workflows.player('CLOSED');
    const actor = await workflows.login(fixture.staff.playerMasterGrantee);
    const beforeAssignments = await reader.client.seasonRoleAssignment.findMany({
      where: { accountId: actor.accountId },
    });
    const beforeGrant = await reader.client.sharedMasterGrant.findMany({
      where: { accountId: actor.accountId },
    });
    // D090 fixture: later summary/result owners are absent, so this is a closed-state guard test.
    await fixture.database.client.season.updateMany({ data: { state: 'CLOSED' } });
    const edited = await fixture
      .apiRequest(actor, 'patch', `/players/${player.id}`, {
        expectedRevision: '1',
        fullName: 'Cầu thủ sau đóng mùa',
        correctionReason: 'Đối chiếu hồ sơ gốc.',
        correctionBasis: 'Bản gốc được xác minh.',
      })
      .expect(200);
    const uploaded = await workflows.portrait(actor, player.id, edited.body.data.revision);
    expect(uploaded.status).toBe(200);
    await fixture.apiRequest(actor, 'get', `/media/${uploaded.body.data.mediaAssetId}`).expect(200);
    await fixture.apiRequest(actor, 'get', '/auth/session').expect(200);
    expect(
      await reader.client.seasonRoleAssignment.findMany({ where: { accountId: actor.accountId } }),
    ).toEqual(beforeAssignments);
    expect(
      await reader.client.sharedMasterGrant.findMany({ where: { accountId: actor.accountId } }),
    ).toEqual(beforeGrant);
    expect(
      await reader.client.session.findUniqueOrThrow({ where: { tokenHash: actor.tokenHash } }),
    ).toMatchObject({ revokedAt: null });
  });

  it('ends PLAYER_MASTER only on last corresponding role removal and never revives it on reassignment', async () => {
    const player = await workflows.player('ROLES');
    const accountId = fixture.staff.playerMasterGrantee;
    const admin = await fixture.authenticate(fixture.staff.admin);
    const revision = async () =>
      (
        await reader.client.account.findUniqueOrThrow({ where: { id: accountId } })
      ).revision.toString();
    const initial = await reader.client.seasonRoleAssignment.findFirstOrThrow({
      where: { accountId, revokedAt: null },
    });
    const added = await fixture
      .apiRequest(
        admin,
        'post',
        `/accounts/${accountId}/role-assignments`,
        {
          expectedRevision: await revision(),
          seasonId: fixture.seasons[1].id,
          roleCode: 'REGISTRATION_OFFICER',
        },
        randomUUID(),
      )
      .expect(201);
    await fixture
      .apiRequest(
        admin,
        'post',
        `/accounts/${accountId}/role-assignments/${initial.id}/revoke`,
        { expectedRevision: await revision() },
        randomUUID(),
      )
      .expect(200);
    expect(
      await reader.client.sharedMasterGrant.findFirstOrThrow({
        where: { accountId, masterKind: 'PLAYER_MASTER' },
      }),
    ).toMatchObject({ endedAt: null });
    const remaining = await workflows.login(accountId);
    expect((await workflows.portrait(remaining, player.id, '1')).status).toBe(200);
    await fixture
      .apiRequest(
        admin,
        'post',
        `/accounts/${accountId}/role-assignments/${added.body.data.relatedId}/revoke`,
        { expectedRevision: await revision() },
        randomUUID(),
      )
      .expect(200);
    await fixture.apiRequest(remaining, 'get', '/auth/session').expect(401);
    const ended = await reader.client.sharedMasterGrant.findFirstOrThrow({
      where: { accountId, masterKind: 'PLAYER_MASTER' },
    });
    expect(ended.endedAt).not.toBeNull();
    await fixture
      .apiRequest(
        admin,
        'post',
        `/accounts/${accountId}/role-assignments`,
        {
          expectedRevision: await revision(),
          seasonId: fixture.seasons[0].id,
          roleCode: 'REGISTRATION_OFFICER',
        },
        randomUUID(),
      )
      .expect(201);
    const reassigned = await workflows.login(accountId);
    expect((await workflows.portrait(reassigned, player.id, '2')).status).toBe(403);
    expect(
      (await reader.client.sharedMasterGrant.findUniqueOrThrow({ where: { id: ended.id } }))
        .endedAt,
    ).toEqual(ended.endedAt);
  });

  it('invalidates sessions on lock and grant changes, retains still-valid grants across unlock and requires fresh login', async () => {
    const player = await workflows.player('LOCK');
    const accountId = fixture.staff.playerMasterGrantee;
    const actor = await workflows.login(accountId);
    const admin = await fixture.authenticate(fixture.staff.admin);
    const revision = async () =>
      (
        await reader.client.account.findUniqueOrThrow({ where: { id: accountId } })
      ).revision.toString();
    const grant = await reader.client.sharedMasterGrant.findFirstOrThrow({
      where: { accountId, masterKind: 'PLAYER_MASTER' },
    });
    await fixture
      .apiRequest(
        admin,
        'post',
        `/accounts/${accountId}/lock`,
        { expectedRevision: await revision() },
        randomUUID(),
      )
      .expect(200);
    await fixture.apiRequest(actor, 'get', '/auth/session').expect(401);
    expect(
      await reader.client.sharedMasterGrant.findUniqueOrThrow({ where: { id: grant.id } }),
    ).toMatchObject({ endedAt: null });
    await fixture
      .apiRequest(
        admin,
        'post',
        `/accounts/${accountId}/unlock`,
        { expectedRevision: await revision() },
        randomUUID(),
      )
      .expect(200);
    await fixture.apiRequest(actor, 'get', '/auth/session').expect(401);
    const fresh = await workflows.login(accountId);
    expect((await workflows.portrait(fresh, player.id, '1')).status).toBe(200);
    await fixture
      .apiRequest(
        admin,
        'post',
        `/accounts/${accountId}/permission-grants/${grant.id}/revoke`,
        {
          expectedRevision: await revision(),
          kind: 'PLAYER_MASTER',
        },
        randomUUID(),
      )
      .expect(200);
    await fixture.apiRequest(fresh, 'get', '/auth/session').expect(401);
    const revoked = await workflows.login(accountId);
    expect((await workflows.portrait(revoked, player.id, '2')).status).toBe(403);
  });

  it('allows UC04 metadata without Player object authority and denies audit export', async () => {
    const player = await workflows.player('AUDIT');
    const admin = await fixture.authenticate(fixture.staff.admin);
    const logs = await fixture
      .apiRequest(admin, 'get', `/audit-logs?objectId=${player.id}`)
      .expect(200);
    expect(logs.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          objectId: player.id,
          actionCode: 'PLAYER_CREATED',
          before: null,
          after: null,
        }),
      ]),
    );
    expect(JSON.stringify(logs.body.data)).not.toContain('Cầu thủ AUDIT');
    await fixture.apiRequest(admin, 'get', `/players/${player.id}`).expect(403);
    await fixture.apiRequest(admin, 'get', '/audit-logs/export').expect(404);
  });

  it('serializes the last quota slot, safely replays the winner and rejects stale intent without duplicated effects', async () => {
    const seasonId = fixture.seasons[0].id;
    expect(
      (await workflows.rule(seasonId, { squadLimit: 1, nonHomegrownLimit: 1 })).approved.status,
    ).toBe(200);
    const player = await workflows.player('SLOT1');
    const bm1 = await workflows.participation(seasonId, player.id, 'SLOT');
    const first = await workflows.registration(seasonId, bm1.clubId, player.id, {}, false);
    const secondPlayer = await workflows.player('SLOT2', '2001-01-01');
    const second = await workflows.registration(
      seasonId,
      bm1.clubId,
      secondPlayer.id,
      { shirtNumber: 10 },
      false,
    );
    const officers = await Promise.all([
      fixture.authenticate(fixture.staff.registrationOfficerA),
      fixture.authenticate(fixture.staff.registrationOfficerB),
    ]);
    const keys = [randomUUID(), randomUUID()];
    const targets = [first, second];
    const confirm = (index: number) =>
      fixture.apiRequest(
        officers[index],
        'post',
        `/player-registrations/${targets[index].caseId}/confirm-valid`,
        {
          versionId: targets[index].versionId,
          expectedRevision: targets[index].revision,
          reason: 'Xác nhận vào suất còn lại.',
        },
        keys[index],
      );
    const release = await holdCommittedRow(reader, {
      kind: 'club',
      key: bm1.clubId,
      mode: 'exclusive',
    });
    let attempts!: Array<Promise<request.Response>>;
    try {
      attempts = [confirm(0).then((res) => res)];
      await waitForLockWaiters(reader, 'club');
      attempts.push(confirm(1).then((res) => res));
      await waitForLockWaiters(reader, 'season');
    } finally {
      await release();
    }
    const outcomes = await Promise.all(attempts);
    expect(outcomes.map((r) => r.status).sort()).toEqual([200, 409]);
    const winner = outcomes.findIndex((r) => r.status === 200);
    expect(
      await reader.client.playerRegistration.count({
        where: { seasonId, currentValidatedVersionId: { not: null } },
      }),
    ).toBe(1);
    const replay = await confirm(winner).expect(200);
    expect(replay.body.data).toEqual(outcomes[winner].body.data);
    expect(
      await reader.client.auditRecord.count({
        where: { objectId: targets[winner].caseId, actionCode: 'PLAYER_REGISTRATION_CONFIRMED' },
      }),
    ).toBe(1);
    await fixture
      .apiRequest(
        officers[winner],
        'post',
        `/player-registrations/${targets[winner].caseId}/confirm-valid`,
        {
          versionId: targets[winner].versionId,
          expectedRevision: '999',
          reason: 'Intent khác cùng khóa.',
        },
        keys[winner],
      )
      .expect(409);
    const grantee = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    await fixture
      .apiRequest(grantee, 'patch', `/players/${player.id}`, {
        expectedRevision: '1',
        positionCode: 'ST',
        correctionReason: 'Sai vị trí gốc.',
        correctionBasis: 'Phiếu gốc.',
      })
      .expect(200);
    await fixture
      .apiRequest(grantee, 'patch', `/players/${player.id}`, {
        expectedRevision: '1',
        positionCode: 'GK',
        correctionReason: 'Ghi đè từ bản cũ.',
        correctionBasis: 'Phiếu cũ.',
      })
      .expect(409);
    expect(
      (await reader.client.player.findUniqueOrThrow({ where: { id: player.id } })).positionCode,
    ).toBe('ST');
  });

  it('rechecks a queued confirmation after role revocation commits and refuses the invalidated session', async () => {
    const seasonId = fixture.seasons[0].id;
    expect((await workflows.rule(seasonId)).approved.status).toBe(200);
    const player = await workflows.player('REVOKE');
    const bm1 = await workflows.participation(seasonId, player.id, 'REVOKE');
    const pending = await workflows.registration(seasonId, bm1.clubId, player.id, {}, false);
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const admin = await fixture.authenticate(fixture.staff.admin);
    const assignment = await reader.client.seasonRoleAssignment.findFirstOrThrow({
      where: { accountId: officer.accountId, revokedAt: null },
    });
    const release = await holdCommittedRow(reader, {
      kind: 'account',
      key: officer.accountId,
      mode: 'exclusive',
    });
    let revoked!: Promise<request.Response>;
    let confirmed!: Promise<request.Response>;
    try {
      revoked = fixture
        .apiRequest(
          admin,
          'post',
          `/accounts/${officer.accountId}/role-assignments/${assignment.id}/revoke`,
          { expectedRevision: '1' },
          randomUUID(),
        )
        .then((res) => res);
      await waitForLockWaiters(reader, 'account');
      confirmed = fixture
        .apiRequest(
          officer,
          'post',
          `/player-registrations/${pending.caseId}/confirm-valid`,
          { versionId: pending.versionId, expectedRevision: pending.revision },
          randomUUID(),
        )
        .then((res) => res);
      await waitForLockWaiters(reader, 'account', 2);
    } finally {
      await release();
    }
    expect((await revoked).status).toBe(200);
    expect((await confirmed).status).toBe(401);
    expect(
      (await reader.client.playerRegistration.findUniqueOrThrow({ where: { id: pending.caseId } }))
        .currentValidatedVersionId,
    ).toBeNull();
  });

  it('serializes concurrent due activation with real confirmations and records one activation', async () => {
    const seasonId = fixture.seasons[0].id;
    const original = await workflows.rule(seasonId);
    expect(original.approved.status).toBe(200);
    const player = await workflows.player('ACT1');
    const bm1 = await workflows.participation(seasonId, player.id, 'ACT');
    const first = await workflows.registration(
      seasonId,
      bm1.clubId,
      player.id,
      { playingStart: '2026-08-10T11:00:00.000Z' },
      false,
    );
    const secondPlayer = await workflows.player('ACT2', '2001-01-01');
    const second = await workflows.registration(
      seasonId,
      bm1.clubId,
      secondPlayer.id,
      { shirtNumber: 10, playingStart: '2026-08-10T11:00:00.000Z' },
      false,
    );
    const waiting = await workflows.rule(
      seasonId,
      { effectiveMode: 'SCHEDULED', proposedEffectiveAt: '2026-08-10T11:00:00.000Z' },
      original.versionId,
    );
    expect(waiting.approved.status).toBe(200);
    fixture.clock.set(new Date('2026-08-10T11:00:00.000Z'));
    const officers = await Promise.all([
      fixture.authenticate(fixture.staff.registrationOfficerA),
      fixture.authenticate(fixture.staff.registrationOfficerB),
    ]);
    const release = await holdCommittedRow(reader, {
      kind: 'season',
      key: seasonId,
      mode: 'exclusive',
    });
    let attempts!: Array<Promise<request.Response>>;
    try {
      attempts = [first, second].map((target, index) =>
        fixture
          .apiRequest(
            officers[index],
            'post',
            `/player-registrations/${target.caseId}/confirm-valid`,
            { versionId: target.versionId, expectedRevision: target.revision },
            randomUUID(),
          )
          .then((res) => res),
      );
      await waitForLockWaiters(reader, 'season', 2);
    } finally {
      await release();
    }
    expect((await Promise.all(attempts)).map((r) => r.status)).toEqual([200, 200]);
    expect(
      await reader.client.regulationVersion.findUniqueOrThrow({ where: { id: waiting.versionId } }),
    ).toMatchObject({ state: 'EFFECTIVE', activeFrom: new Date('2026-08-10T11:00:00.000Z') });
    expect(
      await reader.client.auditRecord.count({
        where: { objectId: waiting.versionId, actionCode: 'REGULATION_ACTIVATED' },
      }),
    ).toBe(1);
    expect(
      await reader.client.playerRegistration.count({
        where: { seasonId, currentValidatedVersionId: { not: null } },
      }),
    ).toBe(2);
  });

  it('races actual closure submission against confirmation without supplying a later summary or changing season state', async () => {
    const seasonId = fixture.seasons[0].id;
    expect((await workflows.rule(seasonId)).approved.status).toBe(200);
    const player = await workflows.player('CLOSE_RACE');
    const bm1 = await workflows.participation(seasonId, player.id, 'CLOSE');
    const pending = await workflows.registration(seasonId, bm1.clubId, player.id, {}, false);
    const { officer, manager } = await workflows.staff();
    const draft = await fixture
      .apiRequest(manager, 'post', `/seasons/${seasonId}/lifecycle-requests`, {
        action: 'CLOSE',
        reason: 'Yêu cầu đóng mùa đang tranh chấp.',
      })
      .expect(201);
    const release = await holdCommittedRow(reader, {
      kind: 'season',
      key: seasonId,
      mode: 'exclusive',
    });
    let closing!: Promise<request.Response>;
    let confirmed!: Promise<request.Response>;
    try {
      closing = fixture
        .apiRequest(manager, 'post', `/season-lifecycle-requests/${draft.body.data.id}/submit`, {
          expectedRevision: draft.body.data.revision,
          submittedVersionId: draft.body.data.relatedId,
          reason: 'Nộp yêu cầu đóng mùa.',
        })
        .then((res) => res);
      await waitForLockWaiters(reader, 'season');
      confirmed = fixture
        .apiRequest(
          officer,
          'post',
          `/player-registrations/${pending.caseId}/confirm-valid`,
          { versionId: pending.versionId, expectedRevision: pending.revision },
          randomUUID(),
        )
        .then((res) => res);
      await waitForLockWaiters(reader, 'season', 2);
    } finally {
      await release();
    }
    expect((await closing).status).toBe(409);
    expect((await confirmed).status).toBe(200);
    expect((await reader.client.season.findUniqueOrThrow({ where: { id: seasonId } })).state).toBe(
      'OPEN',
    );
    expect(
      (await reader.client.playerRegistration.findUniqueOrThrow({ where: { id: pending.caseId } }))
        .currentValidatedVersionId,
    ).toBe(pending.versionId);
  });
});
