import { randomUUID } from 'node:crypto';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { DatabaseService } from '../../src/platform/database.service';
import { assertIsolatedTarget } from '../fixtures/isolated-target.guard';
import { setupPhase3HttpFixture, type Phase3AuthTokens } from './phase-3-fixtures';

describe('PHASE 3 US4 — Playing intervals, paired transfers, prospective plans and concurrency (T016/T017)', () => {
  const fixture = setupPhase3HttpFixture('2026-08-10T10:00:00.000Z');
  let readerDb: DatabaseService;

  beforeAll(() => {
    const databaseUrl = assertIsolatedTarget(process.env.TEST_DATABASE_URL ?? '');
    readerDb = new DatabaseService(databaseUrl);
  });

  afterAll(async () => {
    await readerDb?.close();
  });

  async function seedApprovedClubApplication(
    seasonId: string,
    clubId: string,
    stadiumId: string,
    regulationVersionId: string,
  ) {
    const now = await fixture.clock.now();
    const caseId = randomUUID();
    const versionId = randomUUID();
    await fixture.database.client.clubApplication.create({
      data: { id: caseId, seasonId, clubId, createdAt: now, updatedAt: now },
    });
    await fixture.database.client.clubApplicationVersion.create({
      data: {
        id: versionId,
        seasonId,
        caseId,
        versionNumber: 1,
        preparedBy: fixture.staff.registrationOfficerA,
        state: 'APPROVED',
        receivedAt: now,
        submittedAt: now,
        decidedAt: now,
        decidedBy: fixture.staff.seasonManagerA,
        coachName: 'HLV Kiểm thử Chuyển nhượng',
        homeStadiumId: stadiumId,
        representativeName: 'Đại diện CLB',
        representativePhone: '0901234567',
        contactAddress: '100 Stadium Way',
        receiptRegulationVersionId: regulationVersionId,
        receiptTimingStatus: 'ON_TIME',
        approvalRegulationVersionId: regulationVersionId,
        createdAt: now,
      },
    });
    await fixture.database.client.clubApplication.update({
      where: { id: caseId },
      data: { currentAcceptedVersionId: versionId, updatedAt: now },
    });
    return { caseId, versionId };
  }

  async function seedValidatedRegistration(params: {
    seasonId: string;
    clubId: string;
    playerId: string;
    regulationVersionId: string;
    shirtNumber: number;
    playingStart: Date;
    playingEnd: Date | null;
    u21Finding?: boolean;
    homegrownFinding?: boolean | null;
    nonHomegrownOptIn?: boolean;
    playingDisposition?: string | null;
  }) {
    const now = await fixture.clock.now();
    const caseId = randomUUID();
    const versionId = randomUUID();
    await fixture.database.client.playerRegistration.create({
      data: {
        id: caseId,
        seasonId: params.seasonId,
        clubId: params.clubId,
        playerId: params.playerId,
        createdAt: now,
        updatedAt: now,
      },
    });
    await fixture.database.client.registrationVersion.create({
      data: {
        id: versionId,
        seasonId: params.seasonId,
        caseId,
        versionNumber: 1,
        preparedBy: fixture.staff.registrationOfficerA,
        state: 'VALID',
        receivedAt: now,
        decidedAt: now,
        decidedBy: fixture.staff.registrationOfficerA,
        shirtNumber: params.shirtNumber,
        playingStart: params.playingStart,
        playingEnd: params.playingEnd,
        u21Finding: params.u21Finding ?? false,
        homegrownFinding: params.homegrownFinding ?? false,
        nonHomegrownOptIn: params.nonHomegrownOptIn ?? true,
        receiptRegulationVersionId: params.regulationVersionId,
        receiptTimingStatus: 'ON_TIME',
        decisionRegulationVersionId: params.regulationVersionId,
        playingDisposition: params.playingDisposition ?? 'ACTIVE',
        officialSnapshot: {
          capturedAt: now.toISOString(),
          registration: {
            caseId,
            versionId,
            versionNumber: 1,
            shirtNumber: params.shirtNumber,
            playingStart: params.playingStart.toISOString(),
            playingEnd: params.playingEnd ? params.playingEnd.toISOString() : null,
            u21Finding: params.u21Finding ?? false,
            homegrownFinding: params.homegrownFinding ?? false,
            nonHomegrownOptIn: params.nonHomegrownOptIn ?? true,
          },
        },
        createdAt: now,
      },
    });
    await fixture.database.client.playerRegistration.update({
      where: { id: caseId },
      data: { currentValidatedVersionId: versionId, updatedAt: now },
    });
    return { caseId, versionId, revision: '1' };
  }

  async function seedSeasonOfficerRole(accountId: string, seasonId: string) {
    const now = await fixture.clock.now();
    await fixture.database.client.seasonRoleAssignment.create({
      data: {
        accountId,
        seasonId,
        roleCode: 'REGISTRATION_OFFICER',
        grantedBy: fixture.staff.admin,
        grantedAt: now,
      },
    });
  }

  function postMutate(
    path: string,
    auth: Phase3AuthTokens,
    body: Record<string, unknown>,
    idempotencyKey = randomUUID(),
  ) {
    return fixture.apiRequest(auth, 'post', path, body, idempotencyKey);
  }

  function getRead(path: string, auth: Phase3AuthTokens) {
    return fixture.apiRequest(auth, 'get', path);
  }

  it('supports ordinary termination and same-instant paired transfer with exact lineage, audit and idempotent replay', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId);
    const { club: clubA, stadium: stadiumA } = await fixture.seedClubAndStadium('TR01');
    const { club: clubB, stadium: stadiumB } = await fixture.seedClubAndStadium('TR02');
    await seedApprovedClubApplication(seasonId, clubA.id, stadiumA.id, regVersionId);
    await seedApprovedClubApplication(seasonId, clubB.id, stadiumB.id, regVersionId);

    const player1 = await fixture.seedPlayer('PL_TR_01', 'Cầu thủ Kết thúc', '2000-05-10', 'ENG');
    const player2 = await fixture.seedPlayer('PL_TR_02', 'Cầu thủ Chuyển CLB', '2000-06-15', 'ENG');

    const reg1 = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: player1.id,
      regulationVersionId: regVersionId,
      shirtNumber: 7,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });
    const reg2 = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: player2.id,
      regulationVersionId: regVersionId,
      shirtNumber: 9,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });

    const officerAuth = await fixture.authenticate(fixture.staff.registrationOfficerA);

    // 1) Ordinary scheduled termination on reg1
    const terminateAt = '2026-08-20T12:00:00.000Z';
    const terminateKey = randomUUID();
    const termRes = await postMutate(
      `/player-registrations/${reg1.caseId}/terminate`,
      officerAuth,
      {
        versionId: reg1.versionId,
        expectedRevision: reg1.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: terminateAt,
        reason: 'Chấm dứt hợp đồng theo thỏa thuận hai bên.',
      },
      terminateKey,
    );
    expect(termRes.status).toBe(200);
    expect(termRes.body.data.playingEnd).toBe(terminateAt);
    expect(termRes.body.data.predecessorVersionId).toBe(reg1.versionId);

    // Independent committed-state reader verifies version lineage & audit
    const committedReg1 = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: reg1.caseId },
      include: { currentValidatedVersion: true, versions: { orderBy: { versionNumber: 'asc' } } },
    });
    expect(committedReg1.versions).toHaveLength(2);
    expect(committedReg1.versions[0].playingEnd).toBeNull();
    expect(committedReg1.currentValidatedVersion?.versionNumber).toBe(2);
    expect(committedReg1.currentValidatedVersion?.predecessorVersionId).toBe(reg1.versionId);
    expect(committedReg1.currentValidatedVersion?.playingEnd?.toISOString()).toBe(terminateAt);

    // 2) Same-instant paired transfer of player2 from clubA -> clubB
    const transferAt = '2026-08-15T00:00:00.000Z';
    const transferKey = randomUUID();
    const transferBody = {
      oldVersionId: reg2.versionId,
      expectedRevision: reg2.revision,
      effectiveMode: 'SCHEDULED',
      effectiveAt: transferAt,
      destinationSeasonId: seasonId,
      destinationClubId: clubB.id,
      shirtNumber: 11,
      nonHomegrownOptIn: true,
      reason: 'Chuyển nhượng cầu thủ giữa hai câu lạc bộ trong mùa giải.',
    };
    const transferRes = await postMutate(
      `/player-registrations/${reg2.caseId}/transfer`,
      officerAuth,
      transferBody,
      transferKey,
    );
    expect(transferRes.status).toBe(200);
    const transferData = transferRes.body.data;
    expect(transferData.effectiveAt).toBe(transferAt);
    expect(transferData.oldCaseId).toBe(reg2.caseId);
    expect(transferData.oldBeforeVersionId).toBe(reg2.versionId);
    expect(transferData.oldAfterVersionId).not.toBe(reg2.versionId);
    expect(transferData.newCaseId).not.toBe(reg2.caseId);
    expect(transferData.transferOperationId).toBeTruthy();

    // Same-key replay returns the bounded outcome without duplicating transfer operations
    const replayRes = await postMutate(
      `/player-registrations/${reg2.caseId}/transfer`,
      officerAuth,
      transferBody,
      transferKey,
    );
    expect(replayRes.status).toBe(200);
    expect(replayRes.body.data.transferOperationId).toBe(transferData.transferOperationId);

    // Separate committed-state reader verifies paired versions, TransferOperation and audit records
    const [committedOld, committedNew, transferOps, auditRows] = await Promise.all([
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: reg2.caseId },
        include: { currentValidatedVersion: true },
      }),
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: transferData.newCaseId },
        include: { currentValidatedVersion: true },
      }),
      readerDb.client.transferOperation.findMany({ where: { playerId: player2.id } }),
      readerDb.client.auditRecord.findMany({
        where: {
          objectKind: 'PlayerRegistration',
          objectId: { in: [reg2.caseId, transferData.newCaseId] },
          actionCode: 'PLAYER_TRANSFER_EXECUTED',
        },
      }),
    ]);

    expect(transferOps).toHaveLength(1);
    expect(transferOps[0].operationKind).toBe('TRANSFER');
    expect(transferOps[0].oldBeforeVersionId).toBe(reg2.versionId);
    expect(transferOps[0].oldAfterVersionId).toBe(committedOld.currentValidatedVersionId);
    expect(transferOps[0].newVersionId).toBe(committedNew.currentValidatedVersionId);
    expect(transferOps[0].effectiveAt.toISOString()).toBe(transferAt);
    expect(committedOld.currentValidatedVersion?.playingEnd?.toISOString()).toBe(transferAt);
    expect(committedNew.currentValidatedVersion?.playingStart?.toISOString()).toBe(transferAt);
    expect(committedNew.currentValidatedVersion?.playingEnd).toBeNull();
    expect(committedNew.currentValidatedVersion?.shirtNumber).toBe(11);
    expect(auditRows).toHaveLength(2);

    // Plans read endpoint surfaces paired transfer and intervals
    const plansRes = await getRead(`/player-registrations/${reg2.caseId}/plans`, officerAuth);
    expect(plansRes.status).toBe(200);
    expect(plansRes.body.data.activeTransferPlan?.id).toBe(transferData.transferOperationId);
    expect(plansRes.body.data.transferHistory).toHaveLength(1);
  });

  it('supports paired transfer via pre-received destination version with an approved D053 receipt exception outside intake window', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId, {
      playerWindow: {
        opensAt: '2026-08-01T00:00:00.000Z',
        closesAt: '2026-08-08T00:00:00.000Z',
      },
    });
    const { club: clubA, stadium: stadiumA } = await fixture.seedClubAndStadium('TR19');
    const { club: clubB, stadium: stadiumB } = await fixture.seedClubAndStadium('TR20');
    await seedApprovedClubApplication(seasonId, clubA.id, stadiumA.id, regVersionId);
    await seedApprovedClubApplication(seasonId, clubB.id, stadiumB.id, regVersionId);

    const player = await fixture.seedPlayer(
      'PL_TR_EX',
      'Cầu thủ Ngoại lệ Chuyển CLB',
      '2000-04-12',
      'ENG',
    );
    const oldReg = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: player.id,
      regulationVersionId: regVersionId,
      shirtNumber: 17,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });

    const officerAuth = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const managerAuth = await fixture.authenticate(fixture.staff.seasonManagerA);
    const transferAt = '2026-08-18T00:00:00.000Z';

    // Create destination draft -> receive LATE (clock is 2026-08-10 > closesAt 2026-08-08)
    const draftRes = await postMutate(`/seasons/${seasonId}/player-registrations`, officerAuth, {
      clubId: clubB.id,
      playerId: player.id,
      shirtNumber: 19,
      playingStart: transferAt,
      nonHomegrownOptIn: true,
    });
    expect(draftRes.status).toBe(201);
    const destCaseId = draftRes.body.data.caseId as string;
    const destVersionId = draftRes.body.data.versionId as string;

    const receiveRes = await postMutate(
      `/player-registrations/${destCaseId}/receive`,
      officerAuth,
      { versionId: destVersionId, expectedRevision: '1' },
    );
    expect(receiveRes.status).toBe(200);
    expect(receiveRes.body.data.receiptTimingStatus).toBe('LATE');
    const receivedRevision = receiveRes.body.data.revision as string;

    // Transfer referencing late destination WITHOUT exception -> rejected (409)
    const blockedLate = await postMutate(
      `/player-registrations/${oldReg.caseId}/transfer`,
      officerAuth,
      {
        oldVersionId: oldReg.versionId,
        expectedRevision: oldReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: transferAt,
        destinationCaseId: destCaseId,
        destinationVersionId: destVersionId,
        destinationExpectedRevision: receivedRevision,
        reason: 'Chuyển nhượng ngoài hạn chưa có ngoại lệ.',
      },
    );
    expect(blockedLate.status).toBe(409);

    // Propose & independently approve D053 receipt exception for destVersionId
    const exPropose = await postMutate(`/seasons/${seasonId}/receipt-exceptions`, officerAuth, {
      targetKind: 'PLAYER_REGISTRATION',
      targetVersionId: destVersionId,
      reason: 'Hồ sơ chuyển nhượng khẩn cấp theo chấp thuận BTC.',
      basis: 'Văn bản số 01/BTC-CN',
      submitImmediately: true,
    });
    expect(exPropose.status).toBe(201);
    const exApprove = await postMutate(
      `/receipt-exceptions/${exPropose.body.data.caseId}/approve`,
      managerAuth,
      {
        versionId: exPropose.body.data.versionId,
        expectedRevision: exPropose.body.data.revision,
        reason: 'Phê duyệt ngoại lệ tiếp nhận cho đúng phiên bản đích.',
      },
    );
    expect(exApprove.status).toBe(200);

    // Now paired transfer with approved D053 exception SUCCEEDS atomically!
    const okTransfer = await postMutate(
      `/player-registrations/${oldReg.caseId}/transfer`,
      officerAuth,
      {
        oldVersionId: oldReg.versionId,
        expectedRevision: oldReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: transferAt,
        destinationCaseId: destCaseId,
        destinationVersionId: destVersionId,
        destinationExpectedRevision: receivedRevision,
        reason: 'Chuyển nhượng ngoài hạn sau khi có ngoại lệ tiếp nhận được duyệt.',
      },
    );
    expect(okTransfer.status).toBe(200);
    expect(okTransfer.body.data.newCaseId).toBe(destCaseId);
    expect(okTransfer.body.data.newVersionId).toBe(destVersionId);

    const committedDest = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: destCaseId },
      include: { currentValidatedVersion: true },
    });
    expect(committedDest.currentValidatedVersionId).toBe(destVersionId);
    expect(committedDest.currentValidatedVersion?.state).toBe('VALID');
    expect(committedDest.currentValidatedVersion?.playingStart?.toISOString()).toBe(transferAt);
  });

  it('rejects backdating, empty or reversed intervals, and post-effectivity D075 plan operations', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId);
    const { club: clubA, stadium: stadiumA } = await fixture.seedClubAndStadium('TR03');
    const { club: clubB, stadium: stadiumB } = await fixture.seedClubAndStadium('TR04');
    await seedApprovedClubApplication(seasonId, clubA.id, stadiumA.id, regVersionId);
    await seedApprovedClubApplication(seasonId, clubB.id, stadiumB.id, regVersionId);

    const player = await fixture.seedPlayer(
      'PL_TR_03',
      'Cầu thủ Mốc Thời Gian',
      '2000-01-01',
      'ENG',
    );
    const activeReg = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: player.id,
      regulationVersionId: regVersionId,
      shirtNumber: 8,
      playingStart: new Date('2026-08-08T00:00:00.000Z'),
      playingEnd: null,
    });
    const officerAuth = await fixture.authenticate(fixture.staff.registrationOfficerA);

    // Backdated termination (< now 2026-08-10T10:00:00Z)
    const backdatedTerm = await postMutate(
      `/player-registrations/${activeReg.caseId}/terminate`,
      officerAuth,
      {
        versionId: activeReg.versionId,
        expectedRevision: activeReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-09T10:00:00.000Z',
        reason: 'Thử chấm dứt hồi tố.',
      },
    );
    expect(backdatedTerm.status).toBe(409);

    // Backdated transfer (< now)
    const backdatedTransfer = await postMutate(
      `/player-registrations/${activeReg.caseId}/transfer`,
      officerAuth,
      {
        oldVersionId: activeReg.versionId,
        expectedRevision: activeReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-09T10:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubB.id,
        shirtNumber: 8,
        nonHomegrownOptIn: true,
        reason: 'Thử chuyển nhượng hồi tố.',
      },
    );
    expect(backdatedTransfer.status).toBe(409);

    // Empty destination interval (playingEnd === effectiveAt)
    const emptyInterval = await postMutate(
      `/player-registrations/${activeReg.caseId}/transfer`,
      officerAuth,
      {
        oldVersionId: activeReg.versionId,
        expectedRevision: activeReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-15T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubB.id,
        shirtNumber: 8,
        playingEnd: '2026-08-15T00:00:00.000Z',
        nonHomegrownOptIn: true,
        reason: 'Thử khoảng thi đấu rỗng.',
      },
    );
    expect(emptyInterval.status).toBe(400);

    // Reversed destination interval (playingEnd < effectiveAt)
    const reversedInterval = await postMutate(
      `/player-registrations/${activeReg.caseId}/transfer`,
      officerAuth,
      {
        oldVersionId: activeReg.versionId,
        expectedRevision: activeReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-15T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubB.id,
        shirtNumber: 8,
        playingEnd: '2026-08-14T00:00:00.000Z',
        nonHomegrownOptIn: true,
        reason: 'Thử khoảng thi đấu đảo ngược.',
      },
    );
    expect(reversedInterval.status).toBe(400);

    // Empty/reversed source interval when terminating a future-start registration at or before its start
    const futurePlayer = await fixture.seedPlayer(
      'PL_TR_03B',
      'Cầu thủ Tương Lai',
      '2000-02-02',
      'ENG',
    );
    const futureReg = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: futurePlayer.id,
      regulationVersionId: regVersionId,
      shirtNumber: 12,
      playingStart: new Date('2026-08-20T00:00:00.000Z'),
      playingEnd: null,
    });
    const termBeforeStart = await postMutate(
      `/player-registrations/${futureReg.caseId}/terminate`,
      officerAuth,
      {
        versionId: futureReg.versionId,
        expectedRevision: futureReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-20T00:00:00.000Z',
        reason: 'Thử kết thúc trùng thời điểm bắt đầu.',
      },
    );
    expect(termBeforeStart.status).toBe(409);

    // Standalone prospective plan-change & plan-cancel succeed before playingStart
    const standaloneChange = await postMutate(
      `/player-registrations/${futureReg.caseId}/plan-change`,
      officerAuth,
      {
        versionId: futureReg.versionId,
        expectedRevision: futureReg.revision,
        playingStart: '2026-08-22T00:00:00.000Z',
        shirtNumber: 13,
        reason: 'Điều chỉnh ngày bắt đầu và số áo kế hoạch tương lai.',
      },
    );
    expect(standaloneChange.status).toBe(200);
    const standaloneCancel = await postMutate(
      `/player-registrations/${futureReg.caseId}/plan-cancel`,
      officerAuth,
      {
        versionId: standaloneChange.body.data.versionId,
        expectedRevision: standaloneChange.body.data.revision,
        reason: 'Hủy kế hoạch đăng ký tương lai trước ngày hiệu lực.',
      },
    );
    expect(standaloneCancel.status).toBe(200);

    const cancelledStandalone = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: futureReg.caseId },
      include: { currentValidatedVersion: true, versions: true },
    });
    expect(cancelledStandalone.currentValidatedVersion?.state).toBe('VALID');
    expect(cancelledStandalone.currentValidatedVersion?.playingDisposition).toBe(
      'CANCELLED_BEFORE_EFFECTIVITY',
    );
    expect(cancelledStandalone.versions).toHaveLength(3);

    // Post-effectivity D075 plan-cancel rejected on already-active registration
    const postEffectCancel = await postMutate(
      `/player-registrations/${activeReg.caseId}/plan-cancel`,
      officerAuth,
      {
        versionId: activeReg.versionId,
        expectedRevision: activeReg.revision,
        reason: 'Thử hủy kế hoạch đã bắt đầu hiệu lực.',
      },
    );
    expect(postEffectCancel.status).toBe(409);

    const committed = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: activeReg.caseId },
    });
    expect(committed.currentValidatedVersionId).toBe(activeReg.versionId);
  });

  it('enforces two-season authority on cross-season transfer, plan change and plan cancellation', async () => {
    const season1Id = fixture.seasons[0].id;
    const season2Id = fixture.seasons[1].id;
    const { versionId: regV1 } = await fixture.seedEffectiveRegulation(season1Id);
    const { versionId: regV2 } = await fixture.seedEffectiveRegulation(season2Id);
    const { club: clubA, stadium: stadiumA } = await fixture.seedClubAndStadium('TR05');
    const { club: clubB, stadium: stadiumB } = await fixture.seedClubAndStadium('TR06');
    await seedApprovedClubApplication(season1Id, clubA.id, stadiumA.id, regV1);
    await seedApprovedClubApplication(season2Id, clubB.id, stadiumB.id, regV2);

    const player = await fixture.seedPlayer('PL_TR_04', 'Cầu thủ Liên Mùa', '2000-03-03', 'ENG');
    const oldReg = await seedValidatedRegistration({
      seasonId: season1Id,
      clubId: clubA.id,
      playerId: player.id,
      regulationVersionId: regV1,
      shirtNumber: 14,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });

    // Officer A only has Season 1 (missing Season 2) -> denied
    const officerS1Only = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const deniedMissingDest = await postMutate(
      `/player-registrations/${oldReg.caseId}/transfer`,
      officerS1Only,
      {
        oldVersionId: oldReg.versionId,
        expectedRevision: oldReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-20T00:00:00.000Z',
        destinationSeasonId: season2Id,
        destinationClubId: clubB.id,
        shirtNumber: 14,
        nonHomegrownOptIn: true,
        reason: 'Chuyển liên mùa không có quyền mùa đích.',
      },
    );
    expect(deniedMissingDest.status).toBe(403);

    // Officer S2 only has Season 2 (missing Season 1) -> denied
    const officerS2Only = await fixture.authenticate(fixture.staff.registrationOfficerSeason2);
    const deniedMissingSource = await postMutate(
      `/player-registrations/${oldReg.caseId}/transfer`,
      officerS2Only,
      {
        oldVersionId: oldReg.versionId,
        expectedRevision: oldReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-20T00:00:00.000Z',
        destinationSeasonId: season2Id,
        destinationClubId: clubB.id,
        shirtNumber: 14,
        nonHomegrownOptIn: true,
        reason: 'Chuyển liên mùa không có quyền mùa nguồn.',
      },
    );
    expect(deniedMissingSource.status).toBe(403);

    // Grant officerA Season 2 role as well -> cross-season transfer succeeds
    await seedSeasonOfficerRole(fixture.staff.registrationOfficerA, season2Id);
    const okCrossSeason = await postMutate(
      `/player-registrations/${oldReg.caseId}/transfer`,
      officerS1Only,
      {
        oldVersionId: oldReg.versionId,
        expectedRevision: oldReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-20T00:00:00.000Z',
        destinationSeasonId: season2Id,
        destinationClubId: clubB.id,
        shirtNumber: 14,
        nonHomegrownOptIn: true,
        reason: 'Chuyển liên mùa với đầy đủ quyền ở cả hai mùa giải.',
      },
    );
    expect(okCrossSeason.status).toBe(200);
    const newCaseId = okCrossSeason.body.data.newCaseId as string;
    const newVersionId = okCrossSeason.body.data.newVersionId as string;
    const transferOpId = okCrossSeason.body.data.transferOperationId as string;

    // Officer S2 only cannot plan-change or plan-cancel the cross-season transfer
    const deniedPlanChange = await postMutate(
      `/player-registrations/${newCaseId}/plan-change`,
      officerS2Only,
      {
        versionId: newVersionId,
        expectedRevision: '1',
        transferOperationId: transferOpId,
        playingStart: '2026-08-22T00:00:00.000Z',
        reason: 'Thử đổi ngày chuyển liên mùa khi thiếu quyền mùa nguồn.',
      },
    );
    expect(deniedPlanChange.status).toBe(403);

    const deniedPlanCancel = await postMutate(
      `/player-registrations/${newCaseId}/plan-cancel`,
      officerS2Only,
      {
        versionId: newVersionId,
        expectedRevision: '1',
        transferOperationId: transferOpId,
        reason: 'Thử hủy chuyển liên mùa khi thiếu quyền mùa nguồn.',
      },
    );
    expect(deniedPlanCancel.status).toBe(403);

    const committedNew = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: newCaseId },
      include: { currentValidatedVersion: true },
    });
    expect(committedNew.currentValidatedVersion?.playingStart?.toISOString()).toBe(
      '2026-08-20T00:00:00.000Z',
    );
    expect(committedNew.currentValidatedVersion?.playingDisposition).toBe('ACTIVE');
  });

  it('allows authorized transfer out of a discontinued club without re-confirming source, while blocking transfer into a discontinued club', async () => {
    const season1Id = fixture.seasons[0].id;
    const season2Id = fixture.seasons[1].id;
    // Source season has CLOSED intake window (in the past) and discontinued source club
    const { versionId: regV1 } = await fixture.seedEffectiveRegulation(season1Id, {
      playerWindow: {
        opensAt: '2026-08-01T00:00:00.000Z',
        closesAt: '2026-08-05T00:00:00.000Z',
      },
    });
    // Destination season has OPEN intake window
    const { versionId: regV2 } = await fixture.seedEffectiveRegulation(season2Id);
    const { club: discontinuedClub, stadium: stadiumA } = await fixture.seedClubAndStadium('TR07');
    const { club: eligibleDestClub, stadium: stadiumB } = await fixture.seedClubAndStadium('TR08');
    await seedApprovedClubApplication(season1Id, discontinuedClub.id, stadiumA.id, regV1);
    await seedApprovedClubApplication(season2Id, eligibleDestClub.id, stadiumB.id, regV2);

    const player = await fixture.seedPlayer(
      'PL_TR_05',
      'Cầu thủ Rời CLB Ngừng',
      '1999-07-07',
      'ENG',
    );
    const oldReg = await seedValidatedRegistration({
      seasonId: season1Id,
      clubId: discontinuedClub.id,
      playerId: player.id,
      regulationVersionId: regV1,
      shirtNumber: 15,
      playingStart: new Date('2026-08-02T00:00:00.000Z'),
      playingEnd: null,
    });

    // Discontinue source club AFTER existing approved registration
    await fixture.database.client.club.update({
      where: { id: discontinuedClub.id },
      data: { discontinuedAt: new Date('2026-08-08T00:00:00.000Z'), revision: { increment: 1n } },
    });

    await seedSeasonOfficerRole(fixture.staff.registrationOfficerA, season2Id);
    const officerAuth = await fixture.authenticate(fixture.staff.registrationOfficerA);

    // 1) Transfer OUT of discontinuedClub into eligibleDestClub -> SUCCEEDS without source re-intake/confirmation
    const transferOut = await postMutate(
      `/player-registrations/${oldReg.caseId}/transfer`,
      officerAuth,
      {
        oldVersionId: oldReg.versionId,
        expectedRevision: oldReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-15T00:00:00.000Z',
        destinationSeasonId: season2Id,
        destinationClubId: eligibleDestClub.id,
        shirtNumber: 16,
        nonHomegrownOptIn: true,
        reason: 'Chuyển cầu thủ rời câu lạc bộ đã ngừng hoạt động sang câu lạc bộ đủ điều kiện.',
      },
    );
    expect(transferOut.status).toBe(200);

    const [committedOld, committedNew] = await Promise.all([
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: oldReg.caseId },
        include: { currentValidatedVersion: true },
      }),
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: transferOut.body.data.newCaseId },
        include: { currentValidatedVersion: true },
      }),
    ]);
    expect(committedOld.currentValidatedVersion?.playingEnd?.toISOString()).toBe(
      '2026-08-15T00:00:00.000Z',
    );
    expect(committedNew.currentValidatedVersion?.playingStart?.toISOString()).toBe(
      '2026-08-15T00:00:00.000Z',
    );

    // 2) Attempting to transfer another player INTO a discontinued club in an OPEN intake window -> REJECTED (MASTER_DISCONTINUED)
    const { club: discontinuedDestClub, stadium: stadiumDiscontinuedDest } =
      await fixture.seedClubAndStadium('TR08B');
    await seedApprovedClubApplication(
      season2Id,
      discontinuedDestClub.id,
      stadiumDiscontinuedDest.id,
      regV2,
    );
    await fixture.database.client.club.update({
      where: { id: discontinuedDestClub.id },
      data: { discontinuedAt: new Date('2026-08-08T00:00:00.000Z'), revision: { increment: 1n } },
    });

    const player2 = await fixture.seedPlayer(
      'PL_TR_06',
      'Cầu thủ Vào CLB Ngừng',
      '1999-08-08',
      'ENG',
    );
    const reg2 = await seedValidatedRegistration({
      seasonId: season2Id,
      clubId: eligibleDestClub.id,
      playerId: player2.id,
      regulationVersionId: regV2,
      shirtNumber: 22,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });
    const transferIntoDiscontinued = await postMutate(
      `/player-registrations/${reg2.caseId}/transfer`,
      officerAuth,
      {
        oldVersionId: reg2.versionId,
        expectedRevision: reg2.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-16T00:00:00.000Z',
        destinationSeasonId: season2Id,
        destinationClubId: discontinuedDestClub.id,
        shirtNumber: 22,
        nonHomegrownOptIn: true,
        reason: 'Thử chuyển vào câu lạc bộ đã ngừng hoạt động.',
      },
    );
    expect(transferIntoDiscontinued.status).toBe(409);
    expect(transferIntoDiscontinued.body.error.code).toBe('MASTER_DISCONTINUED');

    const reg2After = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: reg2.caseId },
      include: { currentValidatedVersion: true },
    });
    expect(reg2After.currentValidatedVersionId).toBe(reg2.versionId);
    expect(reg2After.currentValidatedVersion?.playingEnd).toBeNull();
  });

  it('leaves source registration unchanged when destination confirmation fails (unapproved BM1, shirt/quota conflict, late window without exception)', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId, {
      squadLimit: 1,
      nonHomegrownLimit: 1,
    });
    const { club: clubA, stadium: stadiumA } = await fixture.seedClubAndStadium('TR09');
    const { club: clubNoBm1 } = await fixture.seedClubAndStadium('TR10');
    const { club: clubFull, stadium: stadiumFull } = await fixture.seedClubAndStadium('TR11');
    const { club: clubOpen, stadium: stadiumOpen } = await fixture.seedClubAndStadium('TR11B');
    await seedApprovedClubApplication(seasonId, clubA.id, stadiumA.id, regVersionId);
    await seedApprovedClubApplication(seasonId, clubFull.id, stadiumFull.id, regVersionId);
    await seedApprovedClubApplication(seasonId, clubOpen.id, stadiumOpen.id, regVersionId);

    const player = await fixture.seedPlayer('PL_TR_07', 'Cầu thủ Đích Lỗi', '1998-04-04', 'ENG');
    const occupant = await fixture.seedPlayer(
      'PL_TR_08',
      'Cầu thủ Đang Giữ Chỗ',
      '1998-05-05',
      'ENG',
    );

    const oldReg = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: player.id,
      regulationVersionId: regVersionId,
      shirtNumber: 18,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });

    // Future occupant fills the single squad slot & shirt #20 in clubFull starting Aug 25
    await seedValidatedRegistration({
      seasonId,
      clubId: clubFull.id,
      playerId: occupant.id,
      regulationVersionId: regVersionId,
      shirtNumber: 20,
      playingStart: new Date('2026-08-25T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: false,
      homegrownFinding: false,
      nonHomegrownOptIn: true,
    });

    const officerAuth = await fixture.authenticate(fixture.staff.registrationOfficerA);

    // 1) Unapproved destination BM1
    const noBm1Res = await postMutate(
      `/player-registrations/${oldReg.caseId}/transfer`,
      officerAuth,
      {
        oldVersionId: oldReg.versionId,
        expectedRevision: oldReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-15T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubNoBm1.id,
        shirtNumber: 18,
        nonHomegrownOptIn: true,
        reason: 'CLB đích chưa được duyệt hồ sơ tham dự.',
      },
    );
    expect(noBm1Res.status).toBe(409);

    // 2) Future quota & shirt conflict at clubFull (even though Aug 15..25 is free, [Aug 15, +inf) collides on Aug 25!)
    const quotaFailRes = await postMutate(
      `/player-registrations/${oldReg.caseId}/transfer`,
      officerAuth,
      {
        oldVersionId: oldReg.versionId,
        expectedRevision: oldReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-15T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubFull.id,
        shirtNumber: 20,
        nonHomegrownOptIn: true,
        reason: 'Xung đột hạn mức và số áo trong kế hoạch tương lai.',
      },
    );
    expect(quotaFailRes.status).toBe(409);

    // 3) Outside D053 PLAYER_CHANGE intake window without exception (using approved clubOpen with spare capacity)
    fixture.clock.set(new Date('2026-09-20T10:00:00.000Z'));
    const lateOfficerAuth = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const lateRes = await postMutate(
      `/player-registrations/${oldReg.caseId}/transfer`,
      lateOfficerAuth,
      {
        oldVersionId: oldReg.versionId,
        expectedRevision: oldReg.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-09-25T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubOpen.id,
        shirtNumber: 21,
        playingEnd: '2026-09-26T00:00:00.000Z',
        nonHomegrownOptIn: true,
        reason: 'Ngoài khung thời gian tiếp nhận D053.',
      },
    );
    expect(lateRes.status).toBe(409);
    expect(lateRes.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'RECEIPT_WINDOW',
          code: 'OUTSIDE_WINDOW',
        }),
      ]),
    );

    // Separate committed-state reader verifies source registration untouched and zero transfer operations
    const [committedOld, opsCount] = await Promise.all([
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: oldReg.caseId },
        include: { currentValidatedVersion: true, versions: true },
      }),
      readerDb.client.transferOperation.count({ where: { playerId: player.id } }),
    ]);
    expect(committedOld.currentValidatedVersionId).toBe(oldReg.versionId);
    expect(committedOld.currentValidatedVersion?.playingEnd).toBeNull();
    expect(committedOld.versions).toHaveLength(1);
    expect(opsCount).toBe(0);
  });

  it('supports paired prospective plan change with D053, valid cancellation restoring original end, and blocks conflicting restoration without cascading', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId, {
      squadLimit: 25,
      nonHomegrownLimit: 17,
      playerWindow: {
        opensAt: '2026-08-05T00:00:00.000Z',
        closesAt: '2026-08-31T00:00:00.000Z',
      },
    });
    const { club: clubA, stadium: stadiumA } = await fixture.seedClubAndStadium('TR12');
    const { club: clubB, stadium: stadiumB } = await fixture.seedClubAndStadium('TR13');
    await seedApprovedClubApplication(seasonId, clubA.id, stadiumA.id, regVersionId);
    await seedApprovedClubApplication(seasonId, clubB.id, stadiumB.id, regVersionId);

    const player1 = await fixture.seedPlayer(
      'PL_TR_09',
      'Cầu thủ Đổi Và Hủy Kế Hoạch',
      '2000-09-09',
      'ENG',
    );
    const player2 = await fixture.seedPlayer(
      'PL_TR_10',
      'Cầu thủ Xung Đột Khôi Phục',
      '2000-10-10',
      'ENG',
    );
    const blocker = await fixture.seedPlayer(
      'PL_TR_11',
      'Cầu thủ Chiếm Số Áo',
      '2000-11-11',
      'ENG',
    );

    const reg1 = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: player1.id,
      regulationVersionId: regVersionId,
      shirtNumber: 23,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: new Date('2026-12-31T00:00:00.000Z'),
    });
    const reg2 = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: player2.id,
      regulationVersionId: regVersionId,
      shirtNumber: 24,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });

    const officerAuth = await fixture.authenticate(fixture.staff.registrationOfficerA);

    // 1) Create prospective transfer for player1 at Sep 10 -> change date to Sep 15 -> test D053 block after window closes -> cancel and verify restoration to Dec 31!
    const t1 = await postMutate(`/player-registrations/${reg1.caseId}/transfer`, officerAuth, {
      oldVersionId: reg1.versionId,
      expectedRevision: reg1.revision,
      effectiveMode: 'SCHEDULED',
      effectiveAt: '2026-09-10T00:00:00.000Z',
      destinationSeasonId: seasonId,
      destinationClubId: clubB.id,
      shirtNumber: 23,
      nonHomegrownOptIn: true,
      reason: 'Kế hoạch chuyển nhượng tương lai ban đầu.',
    });
    expect(t1.status).toBe(200);
    const t1NewCaseId = t1.body.data.newCaseId as string;
    const t1NewVersionId = t1.body.data.newVersionId as string;
    const t1OpId = t1.body.data.transferOperationId as string;

    // Paired plan-change within open D053 window shifts both old end and new start together to Sep 15
    const pc1 = await postMutate(`/player-registrations/${t1NewCaseId}/plan-change`, officerAuth, {
      versionId: t1NewVersionId,
      expectedRevision: '1',
      transferOperationId: t1OpId,
      playingStart: '2026-09-15T00:00:00.000Z',
      shirtNumber: 25,
      reason: 'Điều chỉnh ngày hiệu lực chuyển nhượng và số áo.',
    });
    expect(pc1.status).toBe(200);
    expect(pc1.body.data.effectiveAt).toBe('2026-09-15T00:00:00.000Z');
    const pc1NewVersionId = pc1.body.data.newVersionId as string;
    const pc1OpId = pc1.body.data.transferOperationId as string;

    // Advance clock past PLAYER_CHANGE window close (Sep 02 > Aug 31, still before Sep 15 start) -> D053 blocks prospective plan-change!
    fixture.clock.set(new Date('2026-09-02T10:00:00.000Z'));
    const lateOfficerAuth = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const latePlanChange = await postMutate(
      `/player-registrations/${t1NewCaseId}/plan-change`,
      lateOfficerAuth,
      {
        versionId: pc1NewVersionId,
        expectedRevision: '1',
        transferOperationId: pc1OpId,
        playingStart: '2026-09-18T00:00:00.000Z',
        reason: 'Thử điều chỉnh kế hoạch sau khi hết khung thời gian tiếp nhận D053.',
      },
    );
    expect(latePlanChange.status).toBe(409);

    // Reset clock within window (Aug 10) and cancel the paired transfer -> restores original Dec 31 end!
    fixture.clock.set(new Date('2026-08-10T10:00:00.000Z'));
    const cancel1 = await postMutate(
      `/player-registrations/${t1NewCaseId}/plan-cancel`,
      officerAuth,
      {
        versionId: pc1NewVersionId,
        expectedRevision: '1',
        transferOperationId: pc1OpId,
        reason: 'Hủy kế hoạch chuyển nhượng trước khi bắt đầu hiệu lực.',
      },
    );
    expect(cancel1.status).toBe(200);

    const [p1Old, p1New, p1Ops] = await Promise.all([
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: reg1.caseId },
        include: { currentValidatedVersion: true, versions: { orderBy: { versionNumber: 'asc' } } },
      }),
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: t1NewCaseId },
        include: { currentValidatedVersion: true, versions: { orderBy: { versionNumber: 'asc' } } },
      }),
      readerDb.client.transferOperation.findMany({
        where: { playerId: player1.id },
      }),
    ]);
    expect(p1Old.currentValidatedVersion?.playingEnd?.toISOString()).toBe(
      '2026-12-31T00:00:00.000Z',
    );
    expect(p1Old.versions).toHaveLength(4);
    expect(p1New.currentValidatedVersion?.state).toBe('VALID');
    expect(p1New.currentValidatedVersion?.playingDisposition).toBe('CANCELLED_BEFORE_EFFECTIVITY');
    // Reconstruct exact lineage starting from supersedesOperationId === null without createdAt/id tiebreakers
    const roots = p1Ops.filter((op) => op.supersedesOperationId === null);
    expect(roots).toHaveLength(1);
    const orderedOps: typeof p1Ops = [];
    let currentOp: (typeof p1Ops)[number] | undefined = roots[0];
    while (currentOp) {
      orderedOps.push(currentOp);
      const nextMatches = p1Ops.filter((op) => op.supersedesOperationId === currentOp!.id);
      expect(nextMatches.length).toBeLessThanOrEqual(1);
      currentOp = nextMatches[0];
    }
    expect(orderedOps).toHaveLength(p1Ops.length);
    expect(orderedOps.map((op) => op.operationKind)).toEqual([
      'TRANSFER',
      'PLAN_CHANGE',
      'PLAN_CANCEL',
    ]);
    expect(orderedOps[1].supersedesOperationId).toBe(orderedOps[0].id);
    expect(orderedOps[2].supersedesOperationId).toBe(orderedOps[1].id);

    // 2) Cancelled-plan restoration conflict: transfer player2 out of clubA at Aug 20, then assign shirt #24 at clubA to blocker starting Aug 20!
    const t2 = await postMutate(`/player-registrations/${reg2.caseId}/transfer`, officerAuth, {
      oldVersionId: reg2.versionId,
      expectedRevision: reg2.revision,
      effectiveMode: 'SCHEDULED',
      effectiveAt: '2026-08-20T00:00:00.000Z',
      destinationSeasonId: seasonId,
      destinationClubId: clubB.id,
      shirtNumber: 24,
      nonHomegrownOptIn: true,
      reason: 'Chuyển cầu thủ 2 từ CLB A sang CLB B.',
    });
    expect(t2.status).toBe(200);
    const t2NewCaseId = t2.body.data.newCaseId as string;
    const t2NewVersionId = t2.body.data.newVersionId as string;
    const t2OpId = t2.body.data.transferOperationId as string;

    // Blocker takes shirt #24 at clubA starting Aug 20
    const blockerReg = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: blocker.id,
      regulationVersionId: regVersionId,
      shirtNumber: 24,
      playingStart: new Date('2026-08-20T00:00:00.000Z'),
      playingEnd: null,
    });

    // Cancelling player2's transfer MUST FAIL because restoring clubA [Aug 05, null) conflicts with blocker's shirt #24!
    const blockedCancel = await postMutate(
      `/player-registrations/${t2NewCaseId}/plan-cancel`,
      officerAuth,
      {
        versionId: t2NewVersionId,
        expectedRevision: '1',
        transferOperationId: t2OpId,
        reason: 'Thử hủy khi số áo cũ đã được cấp cho cầu thủ khác.',
      },
    );
    expect(blockedCancel.status).toBe(409);
    expect(blockedCancel.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'SHIRT_NUMBER',
          code: 'CONFLICT_DEPENDENCY',
          message: expect.stringContaining('Cầu thủ Chiếm Số Áo'),
        }),
      ]),
    );

    // Separate committed-state reader verifies prior transfer plan AND blocker plan are completely preserved (no cascade!)
    const [p2Old, p2New, blockerAfter] = await Promise.all([
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: reg2.caseId },
        include: { currentValidatedVersion: true },
      }),
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: t2NewCaseId },
        include: { currentValidatedVersion: true },
      }),
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: blockerReg.caseId },
        include: { currentValidatedVersion: true },
      }),
    ]);
    expect(p2Old.currentValidatedVersion?.playingEnd?.toISOString()).toBe(
      '2026-08-20T00:00:00.000Z',
    );
    expect(p2New.currentValidatedVersion?.playingDisposition).toBe('ACTIVE');
    expect(blockerAfter.currentValidatedVersion?.playingDisposition).toBe('ACTIVE');
  });

  it('rolls back the entire transfer atomically when a failure occurs after writing the first side', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId);
    const { club: clubA, stadium: stadiumA } = await fixture.seedClubAndStadium('TR14');
    const { club: clubB, stadium: stadiumB } = await fixture.seedClubAndStadium('TR15');
    await seedApprovedClubApplication(seasonId, clubA.id, stadiumA.id, regVersionId);
    await seedApprovedClubApplication(seasonId, clubB.id, stadiumB.id, regVersionId);

    const player = await fixture.seedPlayer('PL_TR_12', 'Cầu thủ Hoàn Tác', '2000-12-12', 'ENG');
    const oldReg = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: player.id,
      regulationVersionId: regVersionId,
      shirtNumber: 27,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });

    const officerAuth = await fixture.authenticate(fixture.staff.registrationOfficerA);

    // Inject failure on the second audit append (AFTER oldAfterVersion, newCase/newVersion, TransferOperation and first audit are written inside tx!)
    const audit = fixture.app.get(AuditWriterService);
    const originalAppend = audit.append.bind(audit);
    let appendCount = 0;
    const spy = jest.spyOn(audit, 'append').mockImplementation(async (context, event) => {
      appendCount += 1;
      if (appendCount === 2) {
        throw new Error('INJECTED_FAILURE_AFTER_FIRST_SIDE');
      }
      return originalAppend(context, event);
    });

    try {
      const failedRes = await postMutate(
        `/player-registrations/${oldReg.caseId}/transfer`,
        officerAuth,
        {
          oldVersionId: oldReg.versionId,
          expectedRevision: oldReg.revision,
          effectiveMode: 'SCHEDULED',
          effectiveAt: '2026-08-18T00:00:00.000Z',
          destinationSeasonId: seasonId,
          destinationClubId: clubB.id,
          shirtNumber: 27,
          nonHomegrownOptIn: true,
          reason: 'Kiểm tra hoàn tác giao dịch khi lỗi xảy ra sau khi ghi phía thứ nhất.',
        },
      );
      expect(failedRes.status).toBe(500);
      expect(appendCount).toBe(2);
    } finally {
      spy.mockRestore();
    }

    // Separate committed-state reader verifies ZERO partial state persisted
    const [committedRegs, committedOps, committedAudits] = await Promise.all([
      readerDb.client.playerRegistration.findMany({
        where: { playerId: player.id },
        include: { currentValidatedVersion: true, versions: true },
      }),
      readerDb.client.transferOperation.findMany({ where: { playerId: player.id } }),
      readerDb.client.auditRecord.findMany({
        where: { actionCode: 'PLAYER_TRANSFER_EXECUTED' },
      }),
    ]);

    expect(committedRegs).toHaveLength(1);
    expect(committedRegs[0].id).toBe(oldReg.caseId);
    expect(committedRegs[0].currentValidatedVersionId).toBe(oldReg.versionId);
    expect(committedRegs[0].currentValidatedVersion?.playingEnd).toBeNull();
    expect(committedRegs[0].versions).toHaveLength(1);
    expect(committedOps).toHaveLength(0);
    expect(committedAudits).toHaveLength(0);
  });

  it('serializes racing future quota, shirt and same-player transfers and preserves committed consistency', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId, {
      squadLimit: 1,
      nonHomegrownLimit: 1,
    });
    const { club: clubA, stadium: stadiumA } = await fixture.seedClubAndStadium('TR16');
    const { club: clubB, stadium: stadiumB } = await fixture.seedClubAndStadium('TR17');
    const { club: clubC, stadium: stadiumC } = await fixture.seedClubAndStadium('TR18');
    await seedApprovedClubApplication(seasonId, clubA.id, stadiumA.id, regVersionId);
    await seedApprovedClubApplication(seasonId, clubB.id, stadiumB.id, regVersionId);
    await seedApprovedClubApplication(seasonId, clubC.id, stadiumC.id, regVersionId);

    // Race 1A: Quota-only race (different shirts #30 vs #31 competing for the single squad slot at clubB)
    const racer1 = await fixture.seedPlayer('PL_RC_01', 'Cầu thủ Đua 1', '1999-01-01', 'ENG');
    const racer2 = await fixture.seedPlayer('PL_RC_02', 'Cầu thủ Đua 2', '1999-02-02', 'ENG');
    const regR1 = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: racer1.id,
      regulationVersionId: regVersionId,
      shirtNumber: 30,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });
    const regR2 = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: racer2.id,
      regulationVersionId: regVersionId,
      shirtNumber: 31,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });

    const officerA = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const officerB = await fixture.authenticate(fixture.staff.registrationOfficerB);

    const [resR1, resR2] = await Promise.all([
      postMutate(`/player-registrations/${regR1.caseId}/transfer`, officerA, {
        oldVersionId: regR1.versionId,
        expectedRevision: regR1.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-20T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubB.id,
        shirtNumber: 30,
        nonHomegrownOptIn: true,
        reason: 'Đua suất đội hình cuối cùng (áo #30).',
      }),
      postMutate(`/player-registrations/${regR2.caseId}/transfer`, officerB, {
        oldVersionId: regR2.versionId,
        expectedRevision: regR2.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-20T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubB.id,
        shirtNumber: 31,
        nonHomegrownOptIn: true,
        reason: 'Đua suất đội hình cuối cùng (áo #31).',
      }),
    ]);

    const statuses1 = [resR1.status, resR2.status].sort((a, b) => a - b);
    expect(statuses1).toEqual([200, 409]);
    const quotaLoserRes = resR1.status === 409 ? resR1 : resR2;
    expect(quotaLoserRes.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'SQUAD_LIMIT',
          code: 'UNMET',
        }),
      ]),
    );

    // Separate committed-state reader verifies exactly 1 registration at clubB and the loser remains active at clubA
    const clubBRegs = await readerDb.client.playerRegistration.findMany({
      where: { seasonId, clubId: clubB.id, currentValidatedVersionId: { not: null } },
      include: { currentValidatedVersion: true },
    });
    expect(clubBRegs).toHaveLength(1);
    const loserCaseId = resR1.status === 200 ? regR2.caseId : regR1.caseId;
    const loserReg = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: loserCaseId },
      include: { currentValidatedVersion: true },
    });
    expect(loserReg.currentValidatedVersion?.playingEnd).toBeNull();

    // Race 1B: Shirt-only race with spare squad capacity (two U21 players competing for shirt #35 at clubC)
    const shirtRacer1 = await fixture.seedPlayer(
      'PL_RC_SH1',
      'Cầu thủ Đua Số Áo 1',
      '2006-03-01',
      'ENG',
    );
    const shirtRacer2 = await fixture.seedPlayer(
      'PL_RC_SH2',
      'Cầu thủ Đua Số Áo 2',
      '2006-04-01',
      'ENG',
    );
    const regSh1 = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: shirtRacer1.id,
      regulationVersionId: regVersionId,
      shirtNumber: 35,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: true,
      homegrownFinding: null,
      nonHomegrownOptIn: false,
    });
    const regSh2 = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: shirtRacer2.id,
      regulationVersionId: regVersionId,
      shirtNumber: 36,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: true,
      homegrownFinding: null,
      nonHomegrownOptIn: false,
    });

    const [resSh1, resSh2] = await Promise.all([
      postMutate(`/player-registrations/${regSh1.caseId}/transfer`, officerA, {
        oldVersionId: regSh1.versionId,
        expectedRevision: regSh1.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-20T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubC.id,
        shirtNumber: 35,
        reason: 'Đua số áo #35 với quỹ đội hình còn chỗ (yêu cầu 1).',
      }),
      postMutate(`/player-registrations/${regSh2.caseId}/transfer`, officerB, {
        oldVersionId: regSh2.versionId,
        expectedRevision: regSh2.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-20T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubC.id,
        shirtNumber: 35,
        reason: 'Đua số áo #35 với quỹ đội hình còn chỗ (yêu cầu 2).',
      }),
    ]);

    const shirtStatuses = [resSh1.status, resSh2.status].sort((a, b) => a - b);
    expect(shirtStatuses).toEqual([200, 409]);
    const shirtLoserRes = resSh1.status === 409 ? resSh1 : resSh2;
    expect(shirtLoserRes.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'SHIRT_NUMBER',
          code: 'UNMET',
        }),
      ]),
    );
    const clubCShirt35Regs = await readerDb.client.playerRegistration.findMany({
      where: {
        seasonId,
        clubId: clubC.id,
        currentValidatedVersion: { shirtNumber: 35 },
      },
      include: { currentValidatedVersion: true },
    });
    expect(clubCShirt35Regs).toHaveLength(1);
    const shirtLoserCaseId = resSh1.status === 200 ? regSh2.caseId : regSh1.caseId;
    const shirtLoserReg = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: shirtLoserCaseId },
      include: { currentValidatedVersion: true },
    });
    expect(shirtLoserReg.currentValidatedVersion?.playingEnd).toBeNull();

    // Race 2: Same player racing two transfers to clubB vs clubC simultaneously
    const racer3 = await fixture.seedPlayer(
      'PL_RC_03',
      'Cầu thủ Đua Hai Đích',
      '2006-05-05',
      'ENG',
    );
    const regR3 = await seedValidatedRegistration({
      seasonId,
      clubId: clubA.id,
      playerId: racer3.id,
      regulationVersionId: regVersionId,
      shirtNumber: 32,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: true,
      homegrownFinding: null,
      nonHomegrownOptIn: false,
    });

    const [samePlayerRes1, samePlayerRes2] = await Promise.all([
      postMutate(`/player-registrations/${regR3.caseId}/transfer`, officerA, {
        oldVersionId: regR3.versionId,
        expectedRevision: regR3.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-21T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubB.id,
        shirtNumber: 33,
        reason: 'Đua chuyển cùng cầu thủ sang CLB B.',
      }),
      postMutate(`/player-registrations/${regR3.caseId}/transfer`, officerB, {
        oldVersionId: regR3.versionId,
        expectedRevision: regR3.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-21T00:00:00.000Z',
        destinationSeasonId: seasonId,
        destinationClubId: clubC.id,
        shirtNumber: 34,
        reason: 'Đua chuyển cùng cầu thủ sang CLB C.',
      }),
    ]);

    const statuses2 = [samePlayerRes1.status, samePlayerRes2.status].sort((a, b) => a - b);
    expect(statuses2).toEqual([200, 409]);

    const racer3Ops = await readerDb.client.transferOperation.findMany({
      where: { playerId: racer3.id },
    });
    expect(racer3Ops).toHaveLength(1);
  });

  it('enforces idempotent replay/conflict across terminate/transfer/planChange/planCancel, prevents pre-auth/cross-season leaks, and guards transfer invariants', async () => {
    const season1Id = fixture.seasons[0].id;
    const season2Id = fixture.seasons[1].id;
    const { versionId: regV1 } = await fixture.seedEffectiveRegulation(season1Id);
    const { versionId: regV2 } = await fixture.seedEffectiveRegulation(season2Id);
    const { club: clubA, stadium: stadiumA } = await fixture.seedClubAndStadium('TR21');
    const { club: clubB, stadium: stadiumB } = await fixture.seedClubAndStadium('TR22');
    await seedApprovedClubApplication(season1Id, clubA.id, stadiumA.id, regV1);
    await seedApprovedClubApplication(season2Id, clubB.id, stadiumB.id, regV2);

    const player1 = await fixture.seedPlayer(
      'PL_TR_H1',
      'Cầu thủ Kiểm Soát 1',
      '2000-01-10',
      'ENG',
    );
    const player2 = await fixture.seedPlayer(
      'PL_TR_H2',
      'Cầu thủ Kiểm Soát 2',
      '2000-02-10',
      'ENG',
    );
    const blockerSpecial = await fixture.seedPlayer(
      'PL_TR_H3',
      "O'Brien & Co",
      '2000-03-10',
      'ENG',
    );

    const reg1 = await seedValidatedRegistration({
      seasonId: season1Id,
      clubId: clubA.id,
      playerId: player1.id,
      regulationVersionId: regV1,
      shirtNumber: 40,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: new Date('2026-09-01T00:00:00.000Z'),
    });
    const reg2 = await seedValidatedRegistration({
      seasonId: season1Id,
      clubId: clubA.id,
      playerId: player2.id,
      regulationVersionId: regV1,
      shirtNumber: 41,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });

    await seedSeasonOfficerRole(fixture.staff.registrationOfficerA, season2Id);
    const officerBoth = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const officerS1Only = await fixture.authenticate(fixture.staff.registrationOfficerB);
    const officerS2Only = await fixture.authenticate(fixture.staff.registrationOfficerSeason2);
    const unprivileged = await fixture.authenticate(fixture.staff.unprivilegedUser);

    // 0) Reject offset-less ISO date-time string while accepting explicit numeric offset (+07:00)
    const noOffsetRes = await postMutate(
      `/player-registrations/${reg2.caseId}/terminate`,
      officerBoth,
      {
        versionId: reg2.versionId,
        expectedRevision: reg2.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-25T00:00:00',
        reason: 'Thử gửi thời gian thiếu múi giờ.',
      },
    );
    expect(noOffsetRes.status).toBe(400);

    // 1) Terminate replay & same-key different-intent conflict (using explicit +07:00 offset = 2026-08-25T00:00:00.000Z)
    const termKey = randomUUID();
    const termBody = {
      versionId: reg2.versionId,
      expectedRevision: reg2.revision,
      effectiveMode: 'SCHEDULED',
      effectiveAt: '2026-08-25T07:00:00+07:00',
      reason: 'Chấm dứt để kiểm tra replay.',
    };
    const termFirst = await postMutate(
      `/player-registrations/${reg2.caseId}/terminate`,
      officerBoth,
      termBody,
      termKey,
    );
    expect(termFirst.status).toBe(200);
    expect(termFirst.body.data.playingEnd).toBe('2026-08-25T00:00:00.000Z');
    const termReplay = await postMutate(
      `/player-registrations/${reg2.caseId}/terminate`,
      officerBoth,
      termBody,
      termKey,
    );
    expect(termReplay.status).toBe(200);
    expect(termReplay.body.data.versionId).toBe(termFirst.body.data.versionId);
    const termConflict = await postMutate(
      `/player-registrations/${reg2.caseId}/terminate`,
      officerBoth,
      { ...termBody, effectiveAt: '2026-08-26T00:00:00.000Z' },
      termKey,
    );
    expect(termConflict.status).toBe(409);
    expect(termConflict.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');

    // 2) Cross-season transfer on reg1 (which has finite original playingEnd 2026-09-01)
    const trKey = randomUUID();
    const trBody = {
      oldVersionId: reg1.versionId,
      expectedRevision: reg1.revision,
      effectiveMode: 'SCHEDULED',
      effectiveAt: '2026-08-18T00:00:00.000Z',
      destinationSeasonId: season2Id,
      destinationClubId: clubB.id,
      shirtNumber: 40,
      nonHomegrownOptIn: true,
      reason: 'Chuyển liên mùa kiểm tra giới hạn nguồn và redaction.',
    };
    const trRes = await postMutate(
      `/player-registrations/${reg1.caseId}/transfer`,
      officerBoth,
      trBody,
      trKey,
    );
    expect(trRes.status).toBe(200);
    const {
      newCaseId,
      newVersionId,
      oldAfterVersionId,
      transferOperationId: op1Id,
    } = trRes.body.data as {
      newCaseId: string;
      newVersionId: string;
      oldAfterVersionId: string;
      transferOperationId: string;
    };

    // Inline transfer same-key conflict when nonHomegrownOptIn changes
    const trKeyConflict = await postMutate(
      `/player-registrations/${reg1.caseId}/transfer`,
      officerBoth,
      { ...trBody, nonHomegrownOptIn: false },
      trKey,
    );
    expect(trKeyConflict.status).toBe(409);
    expect(trKeyConflict.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');

    // Cross-season plans() redaction: destination-only reader sees restricted marker ONLY for source (no season/club/case/version/start/effectivity)
    const s2Plans = await getRead(`/player-registrations/${newCaseId}/plans`, officerS2Only);
    expect(s2Plans.status).toBe(200);
    const s2ActivePlan = s2Plans.body.data.activeTransferPlan;
    expect(s2ActivePlan.counterpartAccessRestricted).toBe(true);
    expect(s2ActivePlan.oldSide).toEqual({
      accessRestricted: true,
      caseId: null,
      season: null,
      club: null,
      beforeVersion: null,
      afterVersion: null,
    });
    expect(s2ActivePlan.newSide.accessRestricted).toBe(false);
    expect(s2ActivePlan.newSide.caseId).toBe(newCaseId);
    expect(s2ActivePlan.newSide.version?.shirtNumber).toBe(40);
    expect(s2Plans.body.data.dependencies).toEqual([
      {
        caseId: null,
        season: null,
        club: null,
        shirtNumber: null,
        playingStart: null,
        playingEnd: null,
        playingEffectivityStatus: null,
        accessRestricted: true,
      },
    ]);

    // Cross-season plans() redaction: source-only reader sees restricted marker ONLY for destination
    const s1Plans = await getRead(`/player-registrations/${reg1.caseId}/plans`, officerS1Only);
    expect(s1Plans.status).toBe(200);
    const s1ActivePlan = s1Plans.body.data.activeTransferPlan;
    expect(s1ActivePlan.counterpartAccessRestricted).toBe(true);
    expect(s1ActivePlan.newSide).toEqual({
      accessRestricted: true,
      caseId: null,
      season: null,
      club: null,
      version: null,
    });
    expect(s1ActivePlan.oldSide.accessRestricted).toBe(false);
    expect(s1ActivePlan.oldSide.caseId).toBe(reg1.caseId);
    expect(s1Plans.body.data.dependencies).toEqual([
      {
        caseId: null,
        season: null,
        club: null,
        shirtNumber: null,
        playingStart: null,
        playingEnd: null,
        playingEffectivityStatus: null,
        accessRestricted: true,
      },
    ]);

    // Dual-season reader receives full projection on both sides and dependencies
    const bothPlans = await getRead(`/player-registrations/${newCaseId}/plans`, officerBoth);
    expect(bothPlans.status).toBe(200);
    expect(bothPlans.body.data.activeTransferPlan.counterpartAccessRestricted).toBe(false);
    expect(bothPlans.body.data.activeTransferPlan.oldSide.caseId).toBe(reg1.caseId);
    expect(bothPlans.body.data.activeTransferPlan.oldSide.season.id).toBe(season1Id);
    expect(bothPlans.body.data.activeTransferPlan.oldSide.club.id).toBe(clubA.id);
    expect(bothPlans.body.data.dependencies[0].accessRestricted).toBe(false);
    expect(bothPlans.body.data.dependencies[0].caseId).toBe(reg1.caseId);
    expect(bothPlans.body.data.dependencies[0].season.id).toBe(season1Id);
    expect(bothPlans.body.data.dependencies[0].playingStart).toBeTruthy();

    // Cross-season history() redaction: source-only and destination-only readers do NOT receive counterpartCaseId/ClubId/SeasonId
    const [s1Hist, s2Hist, bothS1Hist, bothS2Hist] = await Promise.all([
      getRead(`/player-registrations/${reg1.caseId}/history`, officerS1Only),
      getRead(`/player-registrations/${newCaseId}/history`, officerS2Only),
      getRead(`/player-registrations/${reg1.caseId}/history`, officerBoth),
      getRead(`/player-registrations/${newCaseId}/history`, officerBoth),
    ]);
    expect(s1Hist.status).toBe(200);
    expect(s2Hist.status).toBe(200);
    const s1TransferEv = s1Hist.body.data.items.find(
      (i: { actionCode: string }) => i.actionCode === 'PLAYER_TRANSFER_EXECUTED',
    );
    const s2TransferEv = s2Hist.body.data.items.find(
      (i: { actionCode: string }) => i.actionCode === 'PLAYER_TRANSFER_EXECUTED',
    );
    expect(s1TransferEv).toBeDefined();
    expect(s1TransferEv.after.counterpartCaseId).toBeUndefined();
    expect(s1TransferEv.after.counterpartClubId).toBeUndefined();
    expect(s1TransferEv.after.counterpartSeasonId).toBeUndefined();
    expect(s2TransferEv).toBeDefined();
    expect(s2TransferEv.after.counterpartCaseId).toBeUndefined();
    expect(s2TransferEv.after.counterpartClubId).toBeUndefined();
    expect(s2TransferEv.after.counterpartSeasonId).toBeUndefined();

    const bothS1TransferEv = bothS1Hist.body.data.items.find(
      (i: { actionCode: string }) => i.actionCode === 'PLAYER_TRANSFER_EXECUTED',
    );
    const bothS2TransferEv = bothS2Hist.body.data.items.find(
      (i: { actionCode: string }) => i.actionCode === 'PLAYER_TRANSFER_EXECUTED',
    );
    expect(bothS1TransferEv.after.counterpartCaseId).toBe(newCaseId);
    expect(bothS1TransferEv.after.counterpartClubId).toBe(clubB.id);
    expect(bothS1TransferEv.after.counterpartSeasonId).toBe(season2Id);
    expect(bothS2TransferEv.after.counterpartCaseId).toBe(reg1.caseId);
    expect(bothS2TransferEv.after.counterpartClubId).toBe(clubA.id);
    expect(bothS2TransferEv.after.counterpartSeasonId).toBe(season1Id);

    // Pre-auth security: unprivileged caller guessing transferOperationId gets 403, never 409 leak!
    const preAuthGuess = await postMutate(
      `/player-registrations/${newCaseId}/plan-cancel`,
      unprivileged,
      {
        versionId: newVersionId,
        expectedRevision: '1',
        transferOperationId: op1Id,
        reason: 'Người không có quyền đoán mã chuyển nhượng.',
      },
    );
    expect(preAuthGuess.status).toBe(403);

    // terminate is blocked on oldCase while active future transfer exists
    const orphanTerminate = await postMutate(
      `/player-registrations/${reg1.caseId}/terminate`,
      officerBoth,
      {
        versionId: oldAfterVersionId,
        expectedRevision: '1',
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-15T00:00:00.000Z',
        reason: 'Thử chấm dứt độc lập hồ sơ nguồn đang gắn chuyển nhượng tương lai.',
      },
    );
    expect(orphanTerminate.status).toBe(409);

    // Paired planChange CANNOT push transfer date past original source playingEnd (2026-09-01)
    const pastOrigEnd = await postMutate(
      `/player-registrations/${newCaseId}/plan-change`,
      officerBoth,
      {
        versionId: newVersionId,
        expectedRevision: '1',
        transferOperationId: op1Id,
        playingStart: '2026-09-05T00:00:00.000Z',
        reason: 'Thử dời ngày chuyển vượt quá ngày kết thúc gốc của đăng ký nguồn.',
      },
    );
    expect(pastOrigEnd.status).toBe(409);

    // Activate a newer regulation version in season2Id before planChange to prove successor snapshot rebuilds basis/criteria
    // from the fresh assessment while predecessor snapshot preserves its original basis/criteria untouched!
    const predBefore = await readerDb.client.registrationVersion.findUniqueOrThrow({
      where: { id: newVersionId },
      select: { officialSnapshot: true },
    });
    const predBasisBefore = (predBefore.officialSnapshot as Record<string, unknown>)
      .basis as Record<string, unknown>;
    expect(predBasisBefore.squadLimit).toBe(25);
    expect(predBasisBefore.decisionRegulationVersionId).toBe(regV2);
    const oldRegRow = await fixture.database.client.regulationVersion.findUniqueOrThrow({
      where: { id: regV2 },
    });
    const omittedRegKeys = new Set([
      'id',
      'revision',
      'state',
      'submittedAt',
      'approvedAt',
      'decidedAt',
      'decidedBy',
      'decisionReason',
      'activeFrom',
      'activationProcessedAt',
      'createdAt',
    ]);
    const clonedRegFields = Object.fromEntries(
      Object.entries(oldRegRow).filter(([k]) => !omittedRegKeys.has(k)),
    ) as Omit<
      typeof oldRegRow,
      | 'id'
      | 'revision'
      | 'state'
      | 'submittedAt'
      | 'approvedAt'
      | 'decidedAt'
      | 'decidedBy'
      | 'decisionReason'
      | 'activeFrom'
      | 'activationProcessedAt'
      | 'createdAt'
    >;
    const regV2NextId = randomUUID();
    const regV2NextActiveFrom = new Date('2026-08-09T00:00:00.000Z');
    await fixture.database.client.regulationVersion.create({
      data: {
        ...clonedRegFields,
        id: regV2NextId,
        versionNumber: oldRegRow.versionNumber + 1,
        state: 'DRAFT',
        squadLimit: 24,
        nonHomegrownLimit: 16,
        createdAt: regV2NextActiveFrom,
      },
    });
    await fixture.database.client.rankingPriority.createMany({
      data: [
        { versionId: regV2NextId, position: 1, criterionCode: 'POINTS' },
        { versionId: regV2NextId, position: 2, criterionCode: 'GOAL_DIFFERENCE' },
        { versionId: regV2NextId, position: 3, criterionCode: 'GOALS_FOR' },
      ],
    });
    await fixture.database.client.goalType.createMany({
      data: [
        {
          regulationVersionId: regV2NextId,
          code: 'A',
          name: 'Bàn thường',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: regV2NextId,
          code: 'B',
          name: 'Phạt đền',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: regV2NextId,
          code: 'C',
          name: 'Phản lưới',
          isOwnGoal: true,
          enabled: true,
        },
      ],
    });
    await fixture.database.client.cardType.createMany({
      data: [
        {
          regulationVersionId: regV2NextId,
          code: 'Y',
          name: 'Thẻ vàng',
          meaning: 'YELLOW',
          enabled: true,
        },
        {
          regulationVersionId: regV2NextId,
          code: 'R',
          name: 'Thẻ đỏ',
          meaning: 'RED',
          enabled: true,
        },
      ],
    });
    await fixture.database.client.registrationWindow.createMany({
      data: [
        {
          regulationVersionId: regV2NextId,
          intakeKind: 'CLUB_APPLICATION',
          opensAt: new Date('2026-08-01T00:00:00.000Z'),
          closesAt: new Date('2026-09-15T00:00:00.000Z'),
        },
        {
          regulationVersionId: regV2NextId,
          intakeKind: 'PLAYER_CHANGE',
          opensAt: new Date('2026-08-01T00:00:00.000Z'),
          closesAt: new Date('2026-09-15T00:00:00.000Z'),
        },
      ],
    });
    await fixture.database.client.regulationVersion.update({
      where: { id: regV2 },
      data: { state: 'SUPERSEDED', activeUntil: regV2NextActiveFrom },
    });
    await fixture.database.client.regulationVersion.update({
      where: { id: regV2NextId },
      data: {
        state: 'EFFECTIVE',
        submittedAt: regV2NextActiveFrom,
        approvedAt: regV2NextActiveFrom,
        decidedAt: regV2NextActiveFrom,
        decidedBy: fixture.staff.seasonManagerB,
        decisionReason: 'Kích hoạt quy định v2 để kiểm tra cập nhật officialSnapshot.',
        activeFrom: regV2NextActiveFrom,
        activationProcessedAt: regV2NextActiveFrom,
      },
    });
    await fixture.database.client.season.update({
      where: { id: season2Id },
      data: { currentRegulationVersionId: regV2NextId },
    });

    // Paired planChange succeeds within original end, replays idempotently on superseded op1Id, and rejects playingEnd: null mismatch
    const pcKey = randomUUID();
    const pcBody = {
      versionId: newVersionId,
      expectedRevision: '1',
      transferOperationId: op1Id,
      playingStart: '2026-08-22T00:00:00.000Z',
      reason: 'Dời ngày chuyển hợp lệ trong phạm vi nguồn.',
    };
    const pcFirst = await postMutate(
      `/player-registrations/${newCaseId}/plan-change`,
      officerBoth,
      pcBody,
      pcKey,
    );
    expect(pcFirst.status).toBe(200);

    const [predAfter, succAfter] = await Promise.all([
      readerDb.client.registrationVersion.findUniqueOrThrow({
        where: { id: newVersionId },
        select: { officialSnapshot: true },
      }),
      readerDb.client.registrationVersion.findUniqueOrThrow({
        where: { id: pcFirst.body.data.newVersionId },
        select: { officialSnapshot: true },
      }),
    ]);
    const predBasisAfter = (predAfter.officialSnapshot as Record<string, unknown>).basis as Record<
      string,
      unknown
    >;
    const succSnapshot = succAfter.officialSnapshot as Record<string, unknown>;
    const succBasis = succSnapshot.basis as Record<string, unknown>;
    const succCriteria = succSnapshot.criteria as Array<{
      criterion: string;
      status: string;
      regulationVersionId: string | null;
    }>;
    expect(predBasisAfter.squadLimit).toBe(25);
    expect(predBasisAfter.decisionRegulationVersionId).toBe(regV2);
    expect(succBasis.squadLimit).toBe(24);
    expect(succBasis.nonHomegrownLimit).toBe(16);
    expect(succBasis.decisionRegulationVersionId).toBe(regV2NextId);
    expect(succCriteria.some((c) => c.regulationVersionId === regV2NextId)).toBe(true);

    const pcReplay = await postMutate(
      `/player-registrations/${newCaseId}/plan-change`,
      officerBoth,
      pcBody,
      pcKey,
    );
    expect(pcReplay.status).toBe(200);
    expect(pcReplay.body.data.transferOperationId).toBe(pcFirst.body.data.transferOperationId);

    const pcNullConflict = await postMutate(
      `/player-registrations/${newCaseId}/plan-change`,
      officerBoth,
      { ...pcBody, playingEnd: null },
      pcKey,
    );
    expect(pcNullConflict.status).toBe(409);
    expect(pcNullConflict.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');

    // Special characters in conflicting player name ("O'Brien & Co") still pass SafeErrorFilter in error.details!
    await seedValidatedRegistration({
      seasonId: season1Id,
      clubId: clubA.id,
      playerId: blockerSpecial.id,
      regulationVersionId: regV1,
      shirtNumber: 40,
      playingStart: new Date('2026-08-22T00:00:00.000Z'),
      playingEnd: null,
    });
    const specialConflict = await postMutate(
      `/player-registrations/${newCaseId}/plan-cancel`,
      officerBoth,
      {
        versionId: pcFirst.body.data.newVersionId,
        expectedRevision: '1',
        transferOperationId: pcFirst.body.data.transferOperationId,
        reason: 'Kiểm tra hiển thị chi tiết xung đột khi tên cầu thủ có ký tự đặc biệt.',
      },
    );
    expect(specialConflict.status).toBe(409);
    expect(specialConflict.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'SHIRT_NUMBER',
          code: 'CONFLICT_DEPENDENCY',
          message: expect.stringContaining('Brien'),
        }),
      ]),
    );

    // Paired implicit planChange + implicit planCancel replay: succeeds while both roles active, returns 403 after counterpart role revoked!
    const playerClean = await fixture.seedPlayer(
      'PL_TR_H4',
      'Cầu thủ Replay Hủy',
      '2000-04-10',
      'ENG',
    );
    const regClean = await seedValidatedRegistration({
      seasonId: season1Id,
      clubId: clubA.id,
      playerId: playerClean.id,
      regulationVersionId: regV1,
      shirtNumber: 45,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
    });
    const trClean = await postMutate(
      `/player-registrations/${regClean.caseId}/transfer`,
      officerBoth,
      {
        oldVersionId: regClean.versionId,
        expectedRevision: regClean.revision,
        effectiveMode: 'SCHEDULED',
        effectiveAt: '2026-08-24T00:00:00.000Z',
        destinationSeasonId: season2Id,
        destinationClubId: clubB.id,
        shirtNumber: 45,
        nonHomegrownOptIn: true,
        reason: 'Tạo kế hoạch để kiểm tra replay thao tác ẩn định danh chuyển nhượng.',
      },
    );
    expect(trClean.status).toBe(200);

    // Implicit paired planChange (omits transferOperationId, called on source case regClean.caseId)
    const implicitPcKey = randomUUID();
    const implicitPcBody = {
      versionId: trClean.body.data.oldAfterVersionId,
      expectedRevision: '1',
      playingStart: '2026-08-25T00:00:00.000Z',
      reason: 'Điều chỉnh kế hoạch ghép ẩn định danh chuyển nhượng.',
    };
    const implicitPcFirst = await postMutate(
      `/player-registrations/${regClean.caseId}/plan-change`,
      officerBoth,
      implicitPcBody,
      implicitPcKey,
    );
    expect(implicitPcFirst.status).toBe(200);

    // Implicit paired planCancel (omits transferOperationId, supersedes the planChange above so neither is active anymore)
    const cancelKey = randomUUID();
    const cancelBody = {
      versionId: implicitPcFirst.body.data.oldAfterVersionId,
      expectedRevision: '1',
      reason: 'Hủy kế hoạch ẩn định danh và kiểm tra replay cùng khóa.',
    };
    const cancelFirst = await postMutate(
      `/player-registrations/${regClean.caseId}/plan-cancel`,
      officerBoth,
      cancelBody,
      cancelKey,
    );
    expect(cancelFirst.status).toBe(200);

    // While officerBoth still holds BOTH season roles, replaying BOTH inactive/superseded implicit receipts succeeds (200)
    const implicitPcReplayOk = await postMutate(
      `/player-registrations/${regClean.caseId}/plan-change`,
      officerBoth,
      implicitPcBody,
      implicitPcKey,
    );
    expect(implicitPcReplayOk.status).toBe(200);
    expect(implicitPcReplayOk.body.data.transferOperationId).toBe(
      implicitPcFirst.body.data.transferOperationId,
    );
    const cancelReplayOk = await postMutate(
      `/player-registrations/${regClean.caseId}/plan-cancel`,
      officerBoth,
      cancelBody,
      cancelKey,
    );
    expect(cancelReplayOk.status).toBe(200);
    expect(cancelReplayOk.body.data.transferOperationId).toBe(
      cancelFirst.body.data.transferOperationId,
    );

    // Revoke officerBoth's counterpart (season2Id) role -> replaying either implicit paired receipt MUST return 403!
    await fixture.database.client.seasonRoleAssignment.updateMany({
      where: { accountId: fixture.staff.registrationOfficerA, seasonId: season2Id },
      data: { revokedAt: new Date('2026-08-10T10:05:00.000Z') },
    });
    const [revokedPcReplay, revokedCancelReplay] = await Promise.all([
      postMutate(
        `/player-registrations/${regClean.caseId}/plan-change`,
        officerBoth,
        implicitPcBody,
        implicitPcKey,
      ),
      postMutate(
        `/player-registrations/${regClean.caseId}/plan-cancel`,
        officerBoth,
        cancelBody,
        cancelKey,
      ),
    ]);
    expect(revokedPcReplay.status).toBe(403);
    expect(revokedCancelReplay.status).toBe(403);
  });
});
