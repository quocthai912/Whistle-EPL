import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { Prisma } from '../../src/generated/prisma/client';
import type { LockResource, TransactionContext } from '../../src/platform/transaction-context';
import { DatabaseService } from '../../src/platform/database.service';
import {
  registrationClosingFactsProvider,
  registrationMasterImpactProvider,
  registrationPublicMediaBasisProvider,
} from '../../src/registry-registration/registration-dependency-facts';
import { SeasonDependenciesService } from '../../src/season-regulations/season-dependencies.service';
import { phase3Workflows } from '../fixtures/phase-3-workflows';
import { holdCommittedRow, runCommittedRace, waitForLockWaiters } from '../fixtures/committed-race';
import { setupPhase3HttpFixture } from './phase-3-fixtures';

describe('PHASE 3 T024 — live PHASE 2 dependency contracts', () => {
  const fixture = setupPhase3HttpFixture();
  const workflows = phase3Workflows(fixture);
  let reader: DatabaseService;
  beforeAll(() => {
    reader = new DatabaseService(process.env.TEST_DATABASE_URL!);
  });
  afterAll(async () => {
    await reader?.close();
  });

  function facts<T>(
    discover: (db: Prisma.TransactionClient) => Promise<readonly LockResource[]>,
    read: (context: TransactionContext) => Promise<T>,
  ) {
    return fixture.database.write(
      [],
      async () => {},
      read,
      async (db) => [...(await discover(db))],
    );
  }

  it('fails closed when the candidate rule is absent or belongs to another season', async () => {
    const seasonId = fixture.seasons[0].id;
    const other = await fixture.seedEffectiveRegulation(fixture.seasons[1].id);
    const sameSeason = await fixture.seedEffectiveRegulation(seasonId);
    const dependencies = fixture.app.get(SeasonDependenciesService);
    const readCandidate = (candidateVersionId: string) => {
      const request = { seasonId, candidateVersionId };
      return fixture.database.write(
        [],
        async () => {},
        (context) => dependencies.read('registrationCompatibility', context, request),
        async (db) => [
          ...(await dependencies.discover('registrationCompatibility', db, request)).locks,
        ],
      );
    };
    for (const candidateVersionId of [randomUUID(), other.versionId]) {
      expect(await readCandidate(candidateVersionId)).toMatchObject({
        status: 'UNAVAILABLE',
        facts: null,
        basis: { cause: 'PROVIDER_FAILURE' },
      });
    }
    expect((await readCandidate(sameSeason.versionId)).status).toBe('KNOWN');
  });

  it('reads official BM1, Player and registration facts in the caller transaction and fails closed for later composite owners', async () => {
    const seasonId = fixture.seasons[0].id;
    const rule = await workflows.rule(seasonId);
    expect(rule.approved.status).toBe(200);
    const player = await workflows.player('FACTS');
    const bm1 = await workflows.participation(seasonId, player.id, 'FACTS');
    const registration = await workflows.registration(seasonId, bm1.clubId, player.id);
    const impactRequest = { seasonId, resourceKind: 'PLAYER' as const, resourceId: player.id };
    const impact = await facts(
      (db) => registrationMasterImpactProvider.discoverLocks(db, impactRequest),
      (context) => registrationMasterImpactProvider.read(context, impactRequest),
    );
    expect(impact.basis.references).toEqual([bm1.caseId, registration.caseId].sort());
    const otherSeason = { ...impactRequest, seasonId: fixture.seasons[1].id };
    const scoped = await facts(
      (db) => registrationMasterImpactProvider.discoverLocks(db, otherSeason),
      (context) => registrationMasterImpactProvider.read(context, otherSeason),
    );
    expect(scoped.facts.affected).toEqual([]);
    const publicRequest = { seasonId, ownerKind: 'PLAYER' as const, ownerId: player.id };
    const basis = await facts(
      (db) => registrationPublicMediaBasisProvider.discoverLocks(db, publicRequest),
      (context) => registrationPublicMediaBasisProvider.read(context, publicRequest),
    );
    expect(basis).toEqual({ eligible: true, basisReference: registration.versionId });
    const closing = await facts(
      (db) => registrationClosingFactsProvider.discoverLocks(db, { seasonId }),
      (context) => registrationClosingFactsProvider.read(context, { seasonId }),
    );
    expect(closing.pendingRequests).toEqual([]);
    expect(closing.playingIntervals).toEqual([
      { registrationId: registration.caseId, playingEnd: null },
    ]);
    const dependencies = fixture.app.get(SeasonDependenciesService);
    for (const kind of ['seasonClosingReadiness', 'publicMediaScope', 'masterImpact'] as const) {
      const req =
        kind === 'publicMediaScope'
          ? publicRequest
          : kind === 'masterImpact'
            ? { ...impactRequest, resourceKind: 'CLUB' as const, resourceId: bm1.clubId }
            : { seasonId };
      const result = await facts(
        async (db) => (await dependencies.discover(kind, db, req)).locks,
        (context) => dependencies.read(kind, context, req),
      );
      expect(result.status).toBe('UNAVAILABLE');
    }
    // A real Player basis alone must not publish private media without the later public owner.
    const auth = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    const portrait = await workflows.portrait(auth, player.id, player.revision);
    expect(portrait.status).toBe(200);
    await request(fixture.app.getHttpServer())
      .get(`/api/v1/media/${portrait.body.data.mediaAssetId}`)
      .expect(404);
  });

  it.each([
    ['before', '2026-08-11T00:00:00.000Z'],
    ['equal', '2026-08-12T00:00:00.000Z'],
    ['after', '2026-08-13T00:00:00.000Z'],
    ['unspecified', null],
  ])(
    'preserves a real finite/unspecified interval end %s the trusted closing instant',
    async (_label, playingEnd) => {
      const seasonId = fixture.seasons[0].id;
      expect((await workflows.rule(seasonId)).approved.status).toBe(200);
      const player = await workflows.player('END');
      const bm1 = await workflows.participation(seasonId, player.id, 'END');
      const reg = await workflows.registration(seasonId, bm1.clubId, player.id, { playingEnd });
      fixture.clock.set(new Date('2026-08-12T00:00:00.000Z'));
      const closing = await facts(
        (db) => registrationClosingFactsProvider.discoverLocks(db, { seasonId }),
        (context) => registrationClosingFactsProvider.read(context, { seasonId }),
      );
      expect(closing.playingIntervals).toEqual([{ registrationId: reg.caseId, playingEnd }]);
      expect(closing.unresolvedFuturePlans).toEqual([]);
      // The PHASE 2 composite cannot close without the later summary/result owners.
      const manager = await fixture.authenticate(fixture.staff.seasonManagerA);
      const readiness = await fixture
        .apiRequest(manager, 'get', `/seasons/${seasonId}/lifecycle-requests`)
        .expect(200);
      expect(readiness.body.data.readiness).toBe('SUMMARY_REQUIRED');
    },
  );

  it('contributes received requests, confirmed future plans and prospective cancellation without inventing later closure facts', async () => {
    const seasonId = fixture.seasons[0].id;
    expect((await workflows.rule(seasonId)).approved.status).toBe(200);
    const player = await workflows.player('FUTURE');
    const bm1 = await workflows.participation(seasonId, player.id, 'FUTURE');
    const reg = await workflows.registration(seasonId, bm1.clubId, player.id, {
      playingStart: '2026-08-15T00:00:00.000Z',
    });
    const pendingPlayer = await workflows.player('PENDING', '2001-01-01');
    const pending = await workflows.registration(
      seasonId,
      bm1.clubId,
      pendingPlayer.id,
      { shirtNumber: 10 },
      false,
    );
    const read = () =>
      facts(
        (db) => registrationClosingFactsProvider.discoverLocks(db, { seasonId }),
        (context) => registrationClosingFactsProvider.read(context, { seasonId }),
      );
    expect(await read()).toMatchObject({
      pendingRequests: [{ kind: 'PLAYER_REGISTRATION', id: pending.caseId }],
      waitingEffects: [{ kind: 'REGISTRATION', versionId: reg.versionId }],
      unresolvedFuturePlans: [
        {
          registrationId: reg.caseId,
          versionId: reg.versionId,
          startsAt: '2026-08-15T00:00:00.000Z',
        },
      ],
    });
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    await fixture
      .apiRequest(
        officer,
        'post',
        `/player-registrations/${reg.caseId}/plan-cancel`,
        {
          versionId: reg.versionId,
          expectedRevision: reg.revision,
          reason: 'Hủy kế hoạch trước hiệu lực.',
        },
        randomUUID(),
      )
      .expect(200);
    await fixture
      .apiRequest(officer, 'post', `/player-registrations/${pending.caseId}/cancel`, {
        versionId: pending.versionId,
        expectedRevision: pending.revision,
        reason: 'Hủy hồ sơ đang chờ.',
      })
      .expect(200);
    expect(await read()).toMatchObject({
      pendingRequests: [],
      waitingEffects: [],
      unresolvedFuturePlans: [],
      playingIntervals: [],
    });
  });

  it('rolls due activation back with failed confirmation, then activates on a successful dependent write', async () => {
    const seasonId = fixture.seasons[0].id;
    const original = await workflows.rule(seasonId);
    expect(original.approved.status).toBe(200);
    const player = await workflows.player('DUE');
    const bm1 = await workflows.participation(seasonId, player.id, 'DUE');
    await workflows.registration(seasonId, bm1.clubId, player.id);
    const secondPlayer = await workflows.player('DUE2', '2001-01-01');
    const pending = await workflows.registration(
      seasonId,
      bm1.clubId,
      secondPlayer.id,
      { shirtNumber: 10, playingStart: '2026-08-10T11:00:00.000Z' },
      false,
    );
    const waiting = await workflows.rule(
      seasonId,
      {
        effectiveMode: 'SCHEDULED',
        proposedEffectiveAt: '2026-08-10T11:00:00.000Z',
        squadLimit: 1,
        nonHomegrownLimit: 1,
      },
      original.versionId,
    );
    expect(waiting.approved.status).toBe(200);
    fixture.clock.set(new Date('2026-08-10T11:00:00.000Z'));
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const failed = await fixture.apiRequest(
      officer,
      'post',
      `/player-registrations/${pending.caseId}/confirm-valid`,
      {
        versionId: pending.versionId,
        expectedRevision: pending.revision,
        reason: 'Thử vượt hạn mức sau kích hoạt.',
      },
      randomUUID(),
    );
    expect(failed.status).toBe(409);
    expect(failed.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'SQUAD_LIMIT', code: 'UNMET' })]),
    );
    expect(await reader.client.season.findUniqueOrThrow({ where: { id: seasonId } })).toMatchObject(
      { currentRegulationVersionId: original.versionId },
    );
    expect(
      await reader.client.regulationVersion.findUniqueOrThrow({ where: { id: waiting.versionId } }),
    ).toMatchObject({ state: 'APPROVED_WAITING', activationProcessedAt: null });
    expect(
      await reader.client.playerRegistration.findUniqueOrThrow({ where: { id: pending.caseId } }),
    ).toMatchObject({ currentValidatedVersionId: null });
    // Receipt of another draft succeeds under the same due resolver without reserving squad capacity.
    const third = await workflows.player('DUE3', '2002-01-01');
    await workflows.registration(seasonId, bm1.clubId, third.id, { shirtNumber: 11 }, false);
    expect(
      await reader.client.regulationVersion.findUniqueOrThrow({ where: { id: waiting.versionId } }),
    ).toMatchObject({ state: 'EFFECTIVE', activeFrom: new Date('2026-08-10T11:00:00.000Z') });
    expect(await reader.client.season.findUniqueOrThrow({ where: { id: seasonId } })).toMatchObject(
      { currentRegulationVersionId: waiting.versionId },
    );
  });

  it.each([false, true])(
    'rejects incompatible candidate rules against real %s future compositions',
    async (future) => {
      const seasonId = fixture.seasons[0].id;
      const original = await workflows.rule(seasonId);
      expect(original.approved.status).toBe(200);
      const first = await workflows.player('LIMIT1');
      const bm1 = await workflows.participation(seasonId, first.id, 'LIMIT');
      const start = future ? '2026-08-15T00:00:00.000Z' : '2026-08-10T10:00:00.000Z';
      await workflows.registration(seasonId, bm1.clubId, first.id, { playingStart: start });
      const second = await workflows.player('LIMIT2', '2001-01-01');
      await workflows.registration(seasonId, bm1.clubId, second.id, {
        playingStart: start,
        shirtNumber: 10,
      });
      fixture.clock.set(new Date('2026-08-10T10:01:00.000Z'));
      const incompatible = await workflows.rule(
        seasonId,
        { squadLimit: 1, nonHomegrownLimit: 1 },
        original.versionId,
      );
      expect(incompatible.approved.status).toBe(409);
      expect(incompatible.approved.body.error.code).toBe('BASIS_CHANGED');
      // Approval exposes a generic basis conflict; verify quota through the owning facts port.
      const dependencies = fixture.app.get(SeasonDependenciesService);
      const request = { seasonId, candidateVersionId: incompatible.versionId };
      const compatibility = await facts(
        async (db) => (await dependencies.discover('registrationCompatibility', db, request)).locks,
        (context) => dependencies.read('registrationCompatibility', context, request),
      );
      expect(compatibility.status).toBe('KNOWN');
      if (compatibility.status !== 'KNOWN') throw new Error('Compatibility facts unavailable');
      expect(
        compatibility.facts.intervalCompositions.map(
          (interval) =>
            interval.registrations.filter(
              (entry) =>
                entry.clubId === bm1.clubId && entry.u21 === false && entry.homegrown === false,
            ).length,
        ),
      ).toContain(2);
      expect(
        await reader.client.season.findUniqueOrThrow({ where: { id: seasonId } }),
      ).toMatchObject({ currentRegulationVersionId: original.versionId });
    },
  );

  it('tracks D100 and D057 successors and transfers through the existing fact interfaces with historical pointers retained', async () => {
    const seasonId = fixture.seasons[0].id;
    expect((await workflows.rule(seasonId)).approved.status).toBe(200);
    const player = await workflows.player('CORRECT');
    const bm1 = await workflows.participation(seasonId, player.id, 'CORRECT');
    const reg = await workflows.registration(seasonId, bm1.clubId, player.id);
    const { officer, manager } = await workflows.staff();
    const proposed = await fixture
      .apiRequest(officer, 'post', `/club-applications/${bm1.caseId}/corrections`, {
        baseAcceptedVersionId: bm1.versionId,
        correctionKind: 'ORIGINAL_RECORDING_ERROR',
        coachName: 'Huấn luyện viên đã đính chính',
        correctionReason: 'Sai tên khi ghi hồ sơ gốc.',
        correctionEvidence: 'Bản gốc BM1 đối chiếu.',
      })
      .expect(201);
    const correctionId = proposed.body.data.versionId as string;
    const submitted = await fixture
      .apiRequest(
        officer,
        'post',
        `/club-applications/${bm1.caseId}/corrections/${correctionId}/submit`,
        {
          expectedRevision: proposed.body.data.revision,
        },
      )
      .expect(200);
    const closingRequest = { seasonId };
    const pending = await facts(
      (db) => registrationClosingFactsProvider.discoverLocks(db, closingRequest),
      (c) => registrationClosingFactsProvider.read(c, closingRequest),
    );
    expect(pending.pendingRequests).toContainEqual({ kind: 'CLUB_APPLICATION', id: bm1.caseId });
    await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${bm1.caseId}/corrections/${correctionId}/approve`,
        {
          expectedRevision: submitted.body.data.revision,
          baseAcceptedVersionId: bm1.versionId,
          reason: 'Đối chiếu độc lập bản gốc.',
        },
        randomUUID(),
      )
      .expect(200);
    const d057 = await fixture
      .apiRequest(officer, 'post', `/player-registrations/${reg.caseId}/corrections`, {
        targetVersionId: reg.versionId,
        shirtNumber: 12,
        reason: 'Số áo đã ghi sai từ đầu.',
        basis: 'Phiếu đăng ký gốc số 12.',
      })
      .expect(201);
    const d057Id = d057.body.data.correctionVersionId as string;
    const d057Submitted = await fixture
      .apiRequest(
        officer,
        'post',
        `/player-registrations/${reg.caseId}/corrections/${d057Id}/submit`,
        { expectedRevision: d057.body.data.revision },
      )
      .expect(200);
    const pendingCorrection = await facts(
      (db) => registrationClosingFactsProvider.discoverLocks(db, closingRequest),
      (c) => registrationClosingFactsProvider.read(c, closingRequest),
    );
    expect(pendingCorrection.pendingRequests).toContainEqual({
      kind: 'REGISTRATION_CORRECTION',
      id: d057.body.data.correctionCaseId,
    });
    await fixture
      .apiRequest(
        manager,
        'post',
        `/player-registrations/${reg.caseId}/corrections/${d057Id}/approve`,
        {
          expectedRevision: d057Submitted.body.data.revision,
          targetVersionId: reg.versionId,
          reason: 'Đã đối chiếu phiếu gốc.',
        },
        randomUUID(),
      )
      .expect(200);
    const corrected = await reader.client.playerRegistration.findUniqueOrThrow({
      where: { id: reg.caseId },
      include: { currentValidatedVersion: true },
    });
    expect(corrected.currentValidatedVersionId).not.toBe(reg.versionId);
    expect(corrected.currentValidatedVersion).toMatchObject({
      id: corrected.currentValidatedVersionId,
      shirtNumber: 12,
    });
    const destination = await workflows.participation(seasonId, player.id, 'DEST');
    const transferred = await fixture
      .apiRequest(
        officer,
        'post',
        `/player-registrations/${reg.caseId}/transfer`,
        {
          oldVersionId: corrected.currentValidatedVersionId,
          expectedRevision: corrected.currentValidatedVersion!.revision.toString(),
          effectiveMode: 'SCHEDULED',
          effectiveAt: '2026-08-15T00:00:00.000Z',
          destinationSeasonId: seasonId,
          destinationClubId: destination.clubId,
          shirtNumber: 12,
          nonHomegrownOptIn: true,
          reason: 'Chuyển câu lạc bộ đúng thẩm quyền.',
        },
        randomUUID(),
      )
      .expect(200);
    expect(transferred.body.data).toBeDefined();
    const publicRequest = { seasonId, ownerKind: 'CLUB' as const, ownerId: bm1.clubId };
    expect(
      await facts(
        (db) => registrationPublicMediaBasisProvider.discoverLocks(db, publicRequest),
        (c) => registrationPublicMediaBasisProvider.read(c, publicRequest),
      ),
    ).toEqual({ eligible: true, basisReference: correctionId });
    expect(
      await reader.client.registrationVersion.findUniqueOrThrow({ where: { id: reg.versionId } }),
    ).toMatchObject({ state: 'VALID', shirtNumber: 9 });
    expect(
      await reader.client.clubApplicationVersion.findUniqueOrThrow({
        where: { id: bm1.versionId },
      }),
    ).toMatchObject({ state: 'APPROVED', coachName: 'Huấn luyện viên' });
  });

  it('serializes D099 discontinuation before new confirmation, preserves commitments and does not revive rejected/cancelled work on resumption', async () => {
    const seasonId = fixture.seasons[0].id;
    expect((await workflows.rule(seasonId)).approved.status).toBe(200);
    const player = await workflows.player('D099');
    const bm1 = await workflows.participation(seasonId, player.id, 'D099');
    const existing = await workflows.registration(seasonId, bm1.clubId, player.id);
    const next = await workflows.player('D099NEXT', '2001-01-01');
    const pending = await workflows.registration(
      seasonId,
      bm1.clubId,
      next.id,
      { shirtNumber: 10 },
      false,
    );
    const cancelledPlayer = await workflows.player('D099CANCEL', '2002-01-01');
    const cancelled = await workflows.registration(
      seasonId,
      bm1.clubId,
      cancelledPlayer.id,
      { shirtNumber: 11 },
      false,
    );
    const { officer, manager } = await workflows.staff();
    const rejectedProposal = await fixture
      .apiRequest(officer, 'post', `/club-applications/${bm1.caseId}/corrections`, {
        baseAcceptedVersionId: bm1.versionId,
        correctionKind: 'ORIGINAL_RECORDING_ERROR',
        coachName: 'Tên chưa đủ chứng cứ',
        correctionReason: 'Đề nghị sửa tên huấn luyện viên.',
        correctionEvidence: 'Chứng cứ cần rà soát.',
      })
      .expect(201);
    const rejectedId = rejectedProposal.body.data.versionId as string;
    const rejectedSubmission = await fixture
      .apiRequest(
        officer,
        'post',
        `/club-applications/${bm1.caseId}/corrections/${rejectedId}/submit`,
        { expectedRevision: rejectedProposal.body.data.revision },
      )
      .expect(200);
    await fixture
      .apiRequest(
        manager,
        'post',
        `/club-applications/${bm1.caseId}/corrections/${rejectedId}/reject`,
        {
          expectedRevision: rejectedSubmission.body.data.revision,
          reason: 'Không đủ chứng cứ sửa hồ sơ chính thức.',
        },
      )
      .expect(200);
    const rejectedBefore = await reader.client.clubApplicationVersion.findUniqueOrThrow({
      where: { id: rejectedId },
    });
    expect(rejectedBefore.state).toBe('REJECTED');
    await fixture
      .apiRequest(officer, 'post', `/player-registrations/${cancelled.caseId}/cancel`, {
        versionId: cancelled.versionId,
        expectedRevision: cancelled.revision,
        reason: 'Hủy theo yêu cầu.',
      })
      .expect(200);
    const release = await holdCommittedRow(reader, {
      kind: 'club',
      key: bm1.clubId,
      mode: 'exclusive',
    });
    const [discontinue, confirm] = await runCommittedRace<request.Response>(
      release,
      async (start) => {
        start(
          fixture.apiRequest(manager, 'post', `/clubs/${bm1.clubId}/discontinue`, {
            expectedRevision: '1',
            reason: 'Ngừng tiếp nhận nghiệp vụ mới.',
          }),
        );
        await waitForLockWaiters(reader, 'club');
        start(
          fixture.apiRequest(
            officer,
            'post',
            `/player-registrations/${pending.caseId}/confirm-valid`,
            {
              versionId: pending.versionId,
              expectedRevision: pending.revision,
              reason: 'Xác nhận đang tranh chấp.',
            },
            randomUUID(),
          ),
        );
        await waitForLockWaiters(reader, 'club', 2);
      },
    );
    expect(discontinue.status).toBe(200);
    expect(confirm.status).toBe(409);
    expect(
      await reader.client.playerRegistration.findUniqueOrThrow({ where: { id: existing.caseId } }),
    ).toMatchObject({ currentValidatedVersionId: existing.versionId });
    expect(
      await reader.client.playerRegistration.findUniqueOrThrow({ where: { id: pending.caseId } }),
    ).toMatchObject({ currentValidatedVersionId: null });
    await fixture
      .apiRequest(manager, 'post', `/clubs/${bm1.clubId}/resume`, {
        expectedRevision: '2',
        reason: 'Đủ điều kiện sử dụng trở lại.',
      })
      .expect(200);
    expect(
      await reader.client.registrationVersion.findUniqueOrThrow({
        where: { id: cancelled.versionId },
      }),
    ).toMatchObject({ state: 'CANCELLED' });
    expect(
      await reader.client.clubApplicationVersion.findUniqueOrThrow({ where: { id: rejectedId } }),
    ).toEqual(rejectedBefore);
    expect(
      await reader.client.clubApplication.findUniqueOrThrow({ where: { id: bm1.caseId } }),
    ).toMatchObject({ currentAcceptedVersionId: bm1.versionId });
  });
});
