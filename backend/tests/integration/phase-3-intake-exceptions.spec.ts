import { randomUUID } from 'node:crypto';
import { DECLARED_TEST_ONLY_REGULATION, setupPhase3HttpFixture } from './phase-3-fixtures';

describe('PHASE 3 US1 — Shared exact-version intake timing and D053 receipt exceptions (T006)', () => {
  const fixture = setupPhase3HttpFixture();

  it('approves an exact-version timing exception independently and rejects cross-version, cross-season and missing-basis requests', async () => {
    const seasonA = fixture.seasons[0].id;
    const seasonB = fixture.seasons[1].id;
    await fixture.seedEffectiveRegulation(seasonA, {
      clubWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-10T00:00:00.000Z' },
    });
    await fixture.seedEffectiveRegulation(seasonB, {
      clubWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-10T00:00:00.000Z' },
    });
    const { club, stadium } = await fixture.seedClubAndStadium('EXC');
    const player = await fixture.seedPlayer('PL_EXC_01', 'Đỗ Minh Khôi', '2001-06-15');

    // Grant seasonManagerB REGISTRATION_OFFICER too to test self-approval exclusion on exceptions
    await fixture.database.client.seasonRoleAssignment.create({
      data: {
        accountId: fixture.staff.seasonManagerB,
        seasonId: seasonA,
        roleCode: 'REGISTRATION_OFFICER',
        grantedBy: fixture.staff.admin,
        grantedAt: await fixture.database.now(),
      },
    });

    // Receive AFTER closesAt -> LATE
    fixture.clock.set(new Date('2026-08-12T09:00:00.000Z'));
    const officerA = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const managerA = await fixture.authenticate(fixture.staff.seasonManagerA);
    const dualRole = await fixture.authenticate(fixture.staff.seasonManagerB);
    const officerB = await fixture.authenticate(fixture.staff.registrationOfficerSeason2);

    const created = await fixture
      .apiRequest(officerA, 'post', `/seasons/${seasonA}/club-applications`, {
        clubId: club.id,
        coachName: 'HLV Ngoại Lệ',
        homeStadiumId: stadium.id,
        representativeName: 'Nguyễn Đại Diện',
        representativePhone: '0912345678',
        contactAddress: '200 Avenue, London',
        proposedPlayers: [{ playerId: player.id, shirtNumber: 7 }],
      })
      .expect(201);
    const caseId = created.body.data.caseId as string;
    const v1 = created.body.data.versionId as string;

    // Cannot propose exception for unreceived draft
    await fixture
      .apiRequest(officerA, 'post', `/seasons/${seasonA}/receipt-exceptions`, {
        targetKind: 'CLUB_APPLICATION',
        targetVersionId: v1,
        reason: 'Lý do thử nghiệm',
        basis: 'Căn cứ thử nghiệm',
      })
      .expect(409);

    const rec1 = await fixture
      .apiRequest(officerA, 'post', `/club-applications/${caseId}/receive`, {
        versionId: v1,
        expectedRevision: '1',
      })
      .expect(200);
    expect(rec1.body.data.receiptTimingStatus).toBe('LATE');

    // Submit blocked without approved exception
    await fixture
      .apiRequest(officerA, 'post', `/club-applications/${caseId}/submit`, {
        versionId: v1,
        expectedRevision: rec1.body.data.revision,
      })
      .expect(409);

    // Missing basis is rejected with 400
    await fixture
      .apiRequest(officerA, 'post', `/seasons/${seasonA}/receipt-exceptions`, {
        targetKind: 'CLUB_APPLICATION',
        targetVersionId: v1,
        reason: 'Sự cố truyền tải',
        basis: '   ',
      })
      .expect(400);

    // Cross-season exception target is rejected with 404
    await fixture
      .apiRequest(officerB, 'post', `/seasons/${seasonB}/receipt-exceptions`, {
        targetKind: 'CLUB_APPLICATION',
        targetVersionId: v1,
        reason: 'Ngoại lệ sai mùa',
        basis: 'Căn cứ sai mùa',
      })
      .expect(404);

    // Dual-role proposes exception for v1 -> cannot approve own proposal!
    const ex1 = await fixture
      .apiRequest(dualRole, 'post', `/seasons/${seasonA}/receipt-exceptions`, {
        targetKind: 'CLUB_APPLICATION',
        targetVersionId: v1,
        reason: 'CLB gửi hồ sơ bị gián đoạn hệ thống bưu chính.',
        basis: 'Biên bản xác nhận gửi đúng hạn trước khi đóng cửa.',
        submitImmediately: true,
      })
      .expect(201);
    const exCaseId = ex1.body.data.caseId as string;
    const exV1 = ex1.body.data.versionId as string;

    await fixture
      .apiRequest(
        dualRole,
        'post',
        `/receipt-exceptions/${exCaseId}/approve`,
        { versionId: exV1, expectedRevision: '1', reason: 'Tự phê duyệt.' },
        randomUUID(),
      )
      .expect(403);

    // Independent manager returns exV1 -> officer re-proposes exV2 -> manager approves exV2
    await fixture
      .apiRequest(managerA, 'post', `/receipt-exceptions/${exCaseId}/return`, {
        versionId: exV1,
        expectedRevision: '1',
        reason: 'Bổ sung số công văn xác nhận.',
      })
      .expect(200);

    const ex2 = await fixture
      .apiRequest(officerA, 'post', `/seasons/${seasonA}/receipt-exceptions`, {
        targetKind: 'CLUB_APPLICATION',
        targetVersionId: v1,
        reason: 'CLB gửi hồ sơ bị gián đoạn hệ thống bưu chính.',
        basis: 'Công văn số 15/BTC-2026 xác nhận lý do khách quan.',
        submitImmediately: false,
      })
      .expect(201);
    expect(ex2.body.data.caseId).toBe(exCaseId);
    expect(ex2.body.data.versionNumber).toBe(2);
    const exV2 = ex2.body.data.versionId as string;

    const ex2Sub = await fixture
      .apiRequest(officerA, 'post', `/receipt-exceptions/${exCaseId}/submit`, {
        versionId: exV2,
        expectedRevision: '1',
      })
      .expect(200);

    const exApproveKey = randomUUID();
    const exApproved = await fixture
      .apiRequest(
        managerA,
        'post',
        `/receipt-exceptions/${exCaseId}/approve`,
        {
          versionId: exV2,
          expectedRevision: ex2Sub.body.data.revision,
          reason: 'Chấp thuận ngoại lệ tiếp nhận cho đúng phiên bản 1.',
        },
        exApproveKey,
      )
      .expect(200);
    expect(exApproved.body.data.state).toBe('APPROVED');

    // Replay with same Idempotency-Key succeeds identically
    const exReplay = await fixture
      .apiRequest(
        managerA,
        'post',
        `/receipt-exceptions/${exCaseId}/approve`,
        {
          versionId: exV2,
          expectedRevision: ex2Sub.body.data.revision,
          reason: 'Chấp thuận ngoại lệ tiếp nhận cho đúng phiên bản 1.',
        },
        exApproveKey,
      )
      .expect(200);
    expect(exReplay.body.data).toEqual(exApproved.body.data);

    // Now v1 CAN be submitted!
    const sub1 = await fixture
      .apiRequest(officerA, 'post', `/club-applications/${caseId}/submit`, {
        versionId: v1,
        expectedRevision: rec1.body.data.revision,
      })
      .expect(200);
    expect(sub1.body.data.state).toBe('PENDING_APPROVAL');

    // Return v1 for supplementation -> create v2 (still late!) -> v1's exception MUST NOT carry over to v2!
    await fixture
      .apiRequest(managerA, 'post', `/club-applications/${caseId}/return`, {
        versionId: v1,
        expectedRevision: sub1.body.data.revision,
        reason: 'Cập nhật lại ghi chú sân nhà.',
      })
      .expect(200);

    const r2 = await fixture
      .apiRequest(officerA, 'post', `/seasons/${seasonA}/club-applications`, {
        clubId: club.id,
        coachName: 'HLV Ngoại Lệ',
        homeStadiumId: stadium.id,
        representativeName: 'Nguyễn Đại Diện',
        representativePhone: '0912345678',
        contactAddress: '200 Avenue, London',
        notes: 'Phiên bản bổ sung 2',
        proposedPlayers: [{ playerId: player.id, shirtNumber: 7 }],
      })
      .expect(201);
    const v2 = r2.body.data.versionId as string;

    const rec2 = await fixture
      .apiRequest(officerA, 'post', `/club-applications/${caseId}/receive`, {
        versionId: v2,
        expectedRevision: '1',
      })
      .expect(200);
    expect(rec2.body.data.receiptTimingStatus).toBe('LATE');

    // v2 CANNOT reuse v1's approved exception!
    await fixture
      .apiRequest(officerA, 'post', `/club-applications/${caseId}/submit`, {
        versionId: v2,
        expectedRevision: rec2.body.data.revision,
      })
      .expect(409);

    // Save a DRAFT exception for v2 and withdraw it while still in DRAFT
    const ex2Draft = await fixture
      .apiRequest(officerA, 'post', `/seasons/${seasonA}/receipt-exceptions`, {
        targetKind: 'CLUB_APPLICATION',
        targetVersionId: v2,
        reason: 'Nháp ngoại lệ v2 để rút.',
        basis: 'Căn cứ nháp v2.',
        submitImmediately: false,
      })
      .expect(201);
    await fixture
      .apiRequest(officerA, 'post', `/receipt-exceptions/${ex2Draft.body.data.caseId}/withdraw`, {
        versionId: ex2Draft.body.data.versionId,
        expectedRevision: '1',
        reason: 'Rút bản nháp ngoại lệ.',
      })
      .expect(200);

    // Submit a new exception proposal for v2 while v2 is still RECEIVED
    const ex2Submitted = await fixture
      .apiRequest(officerA, 'post', `/seasons/${seasonA}/receipt-exceptions`, {
        targetKind: 'CLUB_APPLICATION',
        targetVersionId: v2,
        reason: 'Đề xuất ngoại lệ cho v2 trước khi hủy v2.',
        basis: 'Căn cứ v2.',
        submitImmediately: true,
      })
      .expect(201);

    // Cancel v2 -> cannot propose or approve an exception for cancelled v2
    await fixture
      .apiRequest(officerA, 'post', `/club-applications/${caseId}/cancel`, {
        versionId: v2,
        expectedRevision: rec2.body.data.revision,
        reason: 'Hủy phiên bản 2.',
      })
      .expect(200);

    // Manager attempts to approve the already-submitted exception for cancelled v2 -> rejected with 409!
    await fixture
      .apiRequest(
        managerA,
        'post',
        `/receipt-exceptions/${ex2Submitted.body.data.caseId}/approve`,
        {
          versionId: ex2Submitted.body.data.versionId,
          expectedRevision: '1',
          reason: 'Thử duyệt ngoại lệ cho phiên bản đã hủy.',
        },
        randomUUID(),
      )
      .expect(409);

    await fixture
      .apiRequest(officerA, 'post', `/seasons/${seasonA}/receipt-exceptions`, {
        targetKind: 'CLUB_APPLICATION',
        targetVersionId: v2,
        reason: 'Xin ngoại lệ bản đã hủy',
        basis: 'Căn cứ không hợp lệ',
      })
      .expect(409);
  });

  it('activates an overdue waiting regulation inside receive and evaluates timing against the newly effective calendar', async () => {
    const seasonId = fixture.seasons[0].id;
    const { caseId: regCaseId } = await fixture.seedEffectiveRegulation(seasonId, {
      clubWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-10T00:00:00.000Z' },
    });

    // Seed a waiting regulation v2 that opens a second window [2026-08-15, 2026-08-25) effective at 2026-08-15T00:00:00Z
    const waitingId = randomUUID();
    await fixture.database.client.regulationVersion.create({
      data: {
        id: waitingId,
        seasonId,
        caseId: regCaseId,
        versionNumber: 2,
        preparedBy: fixture.staff.seasonManagerA,
        state: 'DRAFT',
        effectiveMode: 'SCHEDULED',
        proposedEffectiveAt: new Date('2026-08-15T00:00:00.000Z'),
        squadLimit: DECLARED_TEST_ONLY_REGULATION.squadLimit,
        nonHomegrownLimit: DECLARED_TEST_ONLY_REGULATION.nonHomegrownLimit,
        homegrownSeasons: DECLARED_TEST_ONLY_REGULATION.homegrownSeasons,
        homegrownMonths: DECLARED_TEST_ONLY_REGULATION.homegrownMonths,
        homegrownAgeStart: DECLARED_TEST_ONLY_REGULATION.homegrownAgeStart,
        homegrownAgeEnd: DECLARED_TEST_ONLY_REGULATION.homegrownAgeEnd,
        u21Cutoff: new Date(`${DECLARED_TEST_ONLY_REGULATION.u21Cutoff}T00:00:00.000Z`),
        clubCount: DECLARED_TEST_ONLY_REGULATION.clubCount,
        formatCode: DECLARED_TEST_ONLY_REGULATION.formatCode,
        legs: DECLARED_TEST_ONLY_REGULATION.legs,
        plannedMinutes: DECLARED_TEST_ONLY_REGULATION.plannedMinutes,
        preparationMinutes: DECLARED_TEST_ONLY_REGULATION.preparationMinutes,
        releaseMinutes: DECLARED_TEST_ONLY_REGULATION.releaseMinutes,
        winPoints: DECLARED_TEST_ONLY_REGULATION.winPoints,
        drawPoints: DECLARED_TEST_ONLY_REGULATION.drawPoints,
        lossPoints: DECLARED_TEST_ONLY_REGULATION.lossPoints,
        qualificationCount: DECLARED_TEST_ONLY_REGULATION.qualificationCount,
        relegationCount: DECLARED_TEST_ONLY_REGULATION.relegationCount,
      },
    });
    await fixture.database.client.rankingPriority.createMany({
      data: [
        { versionId: waitingId, position: 1, criterionCode: 'POINTS' },
        { versionId: waitingId, position: 2, criterionCode: 'GOAL_DIFFERENCE' },
        { versionId: waitingId, position: 3, criterionCode: 'GOALS_FOR' },
      ],
    });
    await fixture.database.client.goalType.createMany({
      data: [
        {
          regulationVersionId: waitingId,
          code: 'A',
          name: 'Bàn thường',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: waitingId,
          code: 'B',
          name: 'Phạt đền',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: waitingId,
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
          regulationVersionId: waitingId,
          code: 'Y',
          name: 'Thẻ vàng',
          meaning: 'YELLOW',
          enabled: true,
        },
        {
          regulationVersionId: waitingId,
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
          regulationVersionId: waitingId,
          intakeKind: 'CLUB_APPLICATION',
          opensAt: new Date('2026-08-15T00:00:00.000Z'),
          closesAt: new Date('2026-08-25T00:00:00.000Z'),
        },
        {
          regulationVersionId: waitingId,
          intakeKind: 'PLAYER_CHANGE',
          opensAt: new Date('2026-08-15T00:00:00.000Z'),
          closesAt: new Date('2026-08-30T00:00:00.000Z'),
        },
      ],
    });
    await fixture.database.client.regulationVersion.update({
      where: { id: waitingId },
      data: {
        state: 'APPROVED_WAITING',
        submittedAt: new Date('2026-08-10T00:00:00.000Z'),
        approvedAt: new Date('2026-08-10T01:00:00.000Z'),
        decidedAt: new Date('2026-08-10T01:00:00.000Z'),
        decidedBy: fixture.staff.seasonManagerB,
        decisionReason: 'Mở đợt tiếp nhận bổ sung.',
      },
    });

    const { club, stadium } = await fixture.seedClubAndStadium('DUE');
    const player = await fixture.seedPlayer('PL_DUE_01', 'Trần Quá Hạn', '2000-01-01');

    // Clock is PAST waiting regulation's proposedEffectiveAt (2026-08-15T00:00:00Z)
    fixture.clock.set(new Date('2026-08-16T08:00:00.000Z'));
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);

    const created = await fixture
      .apiRequest(officer, 'post', `/seasons/${seasonId}/club-applications`, {
        clubId: club.id,
        coachName: 'HLV Quá Hạn',
        homeStadiumId: stadium.id,
        representativeName: 'Đại diện Quá Hạn',
        representativePhone: '0987654321',
        contactAddress: '300 High St',
        proposedPlayers: [{ playerId: player.id }],
      })
      .expect(201);

    const rec = await fixture
      .apiRequest(officer, 'post', `/club-applications/${created.body.data.caseId}/receive`, {
        versionId: created.body.data.versionId,
        expectedRevision: '1',
      })
      .expect(200);

    // Waiting regulation v2 was activated atomically, so receipt is ON_TIME under waitingId!
    expect(rec.body.data).toMatchObject({
      state: 'RECEIVED',
      receiptTimingStatus: 'ON_TIME',
      receiptRegulationVersionId: waitingId,
    });
  });
});
