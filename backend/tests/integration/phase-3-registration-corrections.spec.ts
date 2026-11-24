import { randomUUID } from 'node:crypto';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { DatabaseService } from '../../src/platform/database.service';
import { assertIsolatedTarget } from '../fixtures/isolated-target.guard';
import {
  DECLARED_TEST_ONLY_REGULATION,
  setupPhase3HttpFixture,
  type Phase3AuthTokens,
} from './phase-3-fixtures';

describe('PHASE 3 US5 — D057 & FR-020 historical correction rule segments and independent outcomes (T021/T022)', () => {
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
        coachName: 'HLV Kiểm thử Đính chính',
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

  async function seedRegulationHistoryR1AndR2(
    seasonId: string,
    options?: {
      r1ActiveFrom?: string;
      r2ActiveFrom?: string;
      r2ActivationProcessedAt?: string;
      r1SquadLimit?: number;
      r1NonHomegrownLimit?: number;
      r2SquadLimit?: number;
      r2NonHomegrownLimit?: number;
      r1U21Cutoff?: string;
      r2U21Cutoff?: string;
    },
  ) {
    const r1ActiveFrom = new Date(options?.r1ActiveFrom ?? '2026-08-01T00:00:00.000Z');
    const r2ActiveFrom = new Date(options?.r2ActiveFrom ?? '2026-09-01T00:00:00.000Z');
    const r2ActivationProcessedAt = new Date(
      options?.r2ActivationProcessedAt ?? '2026-09-05T14:30:00.000Z',
    );

    const { versionId: r1Id, caseId: regCaseId } = await fixture.seedEffectiveRegulation(seasonId, {
      activeFrom: r1ActiveFrom.toISOString(),
      squadLimit: options?.r1SquadLimit ?? 25,
      nonHomegrownLimit: options?.r1NonHomegrownLimit ?? 17,
      u21Cutoff: options?.r1U21Cutoff ?? '2005-01-01',
    });

    const r2Id = randomUUID();
    await fixture.database.client.regulationVersion.create({
      data: {
        id: r2Id,
        seasonId,
        caseId: regCaseId,
        versionNumber: 2,
        predecessorVersionId: r1Id,
        preparedBy: fixture.staff.seasonManagerA,
        state: 'DRAFT',
        effectiveMode: 'SCHEDULED',
        proposedEffectiveAt: r2ActiveFrom,
        squadLimit: options?.r2SquadLimit ?? 24,
        nonHomegrownLimit: options?.r2NonHomegrownLimit ?? 16,
        homegrownSeasons: DECLARED_TEST_ONLY_REGULATION.homegrownSeasons,
        homegrownMonths: DECLARED_TEST_ONLY_REGULATION.homegrownMonths,
        homegrownAgeStart: DECLARED_TEST_ONLY_REGULATION.homegrownAgeStart,
        homegrownAgeEnd: DECLARED_TEST_ONLY_REGULATION.homegrownAgeEnd,
        u21Cutoff: new Date(`${options?.r2U21Cutoff ?? '2005-01-01'}T00:00:00.000Z`),
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
        createdAt: r2ActiveFrom,
      },
    });
    await fixture.database.client.rankingPriority.createMany({
      data: [
        { versionId: r2Id, position: 1, criterionCode: 'POINTS' },
        { versionId: r2Id, position: 2, criterionCode: 'GOAL_DIFFERENCE' },
        { versionId: r2Id, position: 3, criterionCode: 'GOALS_FOR' },
      ],
    });
    await fixture.database.client.goalType.createMany({
      data: [
        {
          regulationVersionId: r2Id,
          code: 'A',
          name: 'Bàn thường',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: r2Id,
          code: 'B',
          name: 'Phạt đền',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: r2Id,
          code: 'C',
          name: 'Phản lưới',
          isOwnGoal: true,
          enabled: true,
        },
        {
          regulationVersionId: r2Id,
          code: 'D',
          name: 'Đá phạt trực tiếp',
          isOwnGoal: false,
          enabled: true,
        },
      ],
    });
    await fixture.database.client.cardType.createMany({
      data: [
        {
          regulationVersionId: r2Id,
          code: 'Y',
          name: 'Thẻ vàng',
          meaning: 'YELLOW',
          enabled: true,
        },
        {
          regulationVersionId: r2Id,
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
          regulationVersionId: r2Id,
          intakeKind: 'CLUB_APPLICATION',
          opensAt: new Date('2026-08-05T00:00:00.000Z'),
          closesAt: new Date('2026-08-20T00:00:00.000Z'),
        },
        {
          regulationVersionId: r2Id,
          intakeKind: 'PLAYER_CHANGE',
          opensAt: new Date('2026-08-05T00:00:00.000Z'),
          closesAt: new Date('2026-08-31T00:00:00.000Z'),
        },
      ],
    });

    // Supersede R1 at r2ActiveFrom and activate R2 with delayed activationProcessedAt
    await fixture.database.client.regulationVersion.update({
      where: { id: r1Id },
      data: {
        state: 'SUPERSEDED',
        activeUntil: r2ActiveFrom,
        revision: { increment: 1n },
      },
    });
    await fixture.database.client.regulationVersion.update({
      where: { id: r2Id },
      data: {
        state: 'EFFECTIVE',
        submittedAt: r2ActiveFrom,
        approvedAt: r2ActiveFrom,
        decidedAt: r2ActiveFrom,
        decidedBy: fixture.staff.seasonManagerB,
        decisionReason: 'Kích hoạt quy định R2 với thời điểm xử lý trễ.',
        activeFrom: r2ActiveFrom,
        activationProcessedAt: r2ActivationProcessedAt,
        revision: { increment: 1n },
      },
    });
    await fixture.database.client.season.update({
      where: { id: seasonId },
      data: { currentRegulationVersionId: r2Id, updatedAt: r2ActivationProcessedAt },
    });

    return { r1Id, r2Id, r1ActiveFrom, r2ActiveFrom, r2ActivationProcessedAt };
  }

  async function seedValidatedRegistration(params: {
    seasonId: string;
    clubId: string;
    playerId: string;
    playerBirthDateSnapshot?: string;
    receiptRegulationVersionId: string;
    decisionRegulationVersionId: string;
    shirtNumber: number;
    playingStart: Date;
    playingEnd: Date | null;
    u21Finding: boolean;
    homegrownFinding: boolean | null;
    nonHomegrownOptIn: boolean;
    receiptTimingStatus?: 'ON_TIME' | 'LATE';
    receivedAt?: Date;
    decidedAt?: Date;
  }) {
    const receivedAt = params.receivedAt ?? new Date('2026-08-06T09:00:00.000Z');
    const decidedAt = params.decidedAt ?? new Date('2026-08-07T10:00:00.000Z');
    const receiptTimingStatus = params.receiptTimingStatus ?? 'ON_TIME';
    const caseId = randomUUID();
    const versionId = randomUUID();

    await fixture.database.client.playerRegistration.create({
      data: {
        id: caseId,
        seasonId: params.seasonId,
        clubId: params.clubId,
        playerId: params.playerId,
        createdAt: receivedAt,
        updatedAt: decidedAt,
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
        receivedAt,
        decidedAt,
        decidedBy: fixture.staff.registrationOfficerA,
        decisionReason: 'Xác nhận hợp lệ ban đầu.',
        shirtNumber: params.shirtNumber,
        playingStart: params.playingStart,
        playingEnd: params.playingEnd,
        u21Finding: params.u21Finding,
        homegrownFinding: params.homegrownFinding,
        nonHomegrownOptIn: params.nonHomegrownOptIn,
        receiptRegulationVersionId: params.receiptRegulationVersionId,
        receiptTimingStatus,
        decisionRegulationVersionId: params.decisionRegulationVersionId,
        playingDisposition: 'ACTIVE',
        officialSnapshot: {
          capturedAt: decidedAt.toISOString(),
          player: {
            id: params.playerId,
            birthDate: params.playerBirthDateSnapshot ?? '2006-01-10',
          },
          registration: {
            caseId,
            versionId,
            versionNumber: 1,
            shirtNumber: params.shirtNumber,
            playingStart: params.playingStart.toISOString(),
            playingEnd: params.playingEnd ? params.playingEnd.toISOString() : null,
            u21Finding: params.u21Finding,
            homegrownFinding: params.homegrownFinding,
            nonHomegrownOptIn: params.nonHomegrownOptIn,
            playingDisposition: 'ACTIVE',
          },
          basis: {
            receiptRegulationVersionId: params.receiptRegulationVersionId,
            decisionRegulationVersionId: params.decisionRegulationVersionId,
            receiptTimingStatus,
          },
        },
        createdAt: receivedAt,
      },
    });
    await fixture.database.client.playerRegistration.update({
      where: { id: caseId },
      data: { currentValidatedVersionId: versionId, updatedAt: decidedAt },
    });

    return { caseId, versionId, receivedAt, decidedAt };
  }

  function postMutate(
    path: string,
    auth: Phase3AuthTokens,
    body: Record<string, unknown>,
    idempotencyKey?: string,
  ) {
    return fixture.apiRequest(auth, 'post', path, body, idempotencyKey);
  }

  it('evaluates R1 before and R2 from exact effectivity independent of delayed activationProcessedAt, enforces failed-segment disposition, and flags pending source correction and match references', async () => {
    const seasonId = fixture.seasons[0].id;
    // R1 [2026-08-01, 2026-09-01): squadLimit = 2, nonHomegrownLimit = 2
    // R2 [2026-09-01, +inf): squadLimit = 1, nonHomegrownLimit = 1, but activationProcessedAt was delayed to 2026-09-05!
    const { r1Id, r2Id } = await seedRegulationHistoryR1AndR2(seasonId, {
      r1ActiveFrom: '2026-08-01T00:00:00.000Z',
      r2ActiveFrom: '2026-09-01T00:00:00.000Z',
      r2ActivationProcessedAt: '2026-09-05T14:30:00.000Z',
      r1SquadLimit: 2,
      r1NonHomegrownLimit: 2,
      r2SquadLimit: 1,
      r2NonHomegrownLimit: 1,
    });

    const { club, stadium } = await fixture.seedClubAndStadium('D057_S1');
    await seedApprovedClubApplication(seasonId, club.id, stadium.id, r1Id);

    // Senior player occupying 1 counted slot across [2026-08-05, +inf)
    const seniorTeammate = await fixture.seedPlayer(
      'PL_D057_TM',
      'Đồng Đội Chiếm Hạn Mức',
      '1998-03-15',
      'ENG',
    );
    await seedValidatedRegistration({
      seasonId,
      clubId: club.id,
      playerId: seniorTeammate.id,
      playerBirthDateSnapshot: '1998-03-15',
      receiptRegulationVersionId: r1Id,
      decisionRegulationVersionId: r1Id,
      shirtNumber: 8,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: false,
      homegrownFinding: false,
      nonHomegrownOptIn: true,
    });

    // Target player originally recorded with birthDate 2006-01-10 (U21 = true, outside counted squad)
    const targetPlayer = await fixture.seedPlayer(
      'PL_D057_01',
      'Lê Minh Khôi',
      '2006-01-10',
      'ENG',
    );
    const targetReg = await seedValidatedRegistration({
      seasonId,
      clubId: club.id,
      playerId: targetPlayer.id,
      playerBirthDateSnapshot: '2006-01-10',
      receiptRegulationVersionId: r1Id,
      decisionRegulationVersionId: r1Id,
      shirtNumber: 21,
      playingStart: new Date('2026-08-10T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: true,
      homegrownFinding: null,
      nonHomegrownOptIn: false,
    });

    // Player master holder corrects player birthDate to 2004-01-10 (no longer U21!)
    fixture.clock.set(new Date('2026-09-10T10:00:00.000Z'));
    const masterGrantee = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    await fixture
      .apiRequest(masterGrantee, 'patch', `/players/${targetPlayer.id}`, {
        expectedRevision: '1',
        birthDate: '2004-01-10',
        correctionReason: 'Đính chính sai sót năm sinh trên hồ sơ gốc.',
        correctionBasis: 'Giấy khai sinh bản chính số 19/KS.',
      })
      .expect(200);

    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    // 1. GET /player-registrations/:caseId/corrections flags pendingSourceCorrection while keeping v1 official
    const listBefore = await fixture
      .apiRequest(officer, 'get', `/player-registrations/${targetReg.caseId}/corrections`)
      .expect(200);
    expect(listBefore.body.data.currentValidatedVersionId).toBe(targetReg.versionId);
    expect(listBefore.body.data.pendingSourceCorrection).toMatchObject({
      required: true,
      snapshotBirthDate: '2006-01-10',
      currentPlayerBirthDate: '2004-01-10',
    });

    // 2. Propose D057 correction keeping full open-ended interval [2026-08-10, null) and RETAIN_VALID
    // Because corrected player is non-U21 (2004-01-10) and non-homegrown:
    // - Segment 1: [2026-08-10T00:00:00.000Z, 2026-09-01T00:00:00.000Z) under R1 (squadLimit 2 -> counted 2/2) => MET
    // - Segment 2: [2026-09-01T00:00:00.000Z, null) under R2 (exact activeFrom 2026-09-01, NOT delayed 2026-09-05! squadLimit 1 -> counted 2/1) => UNMET
    const matchRefId = randomUUID();
    const proposedUnresolved = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections`,
      officer,
      {
        targetVersionId: targetReg.versionId,
        nonHomegrownOptIn: true,
        disposition: 'RETAIN_VALID',
        reason: 'Đánh giá lại phân loại U21 sau khi hiệu chỉnh ngày sinh cầu thủ.',
        basis: 'Quyết định hiệu chỉnh ngày sinh số 19/QĐ-BTC.',
        affectedReferences: [
          {
            kind: 'OFFICIAL_RESULT',
            referenceId: matchRefId,
            note: 'Cần rà soát biên bản trận đấu Vòng 4 cho UC19.',
          },
        ],
      },
    ).expect(201);

    const corrCaseId = proposedUnresolved.body.data.correctionCaseId as string;
    const corrV1Id = proposedUnresolved.body.data.correctionVersionId as string;
    const segments1 = proposedUnresolved.body.data.segments as Array<{
      segmentOrder: number;
      segmentStart: string;
      segmentEnd: string | null;
      regulationVersionId: string;
      outcome: string;
      requiredDisposition: string | null;
    }>;

    // Must split strictly at R2's exact activeFrom (2026-09-01T00:00:00.000Z), not delayed activationProcessedAt (2026-09-05)
    expect(segments1).toHaveLength(2);
    expect(segments1[0]).toMatchObject({
      segmentOrder: 1,
      segmentStart: '2026-08-10T00:00:00.000Z',
      segmentEnd: '2026-09-01T00:00:00.000Z',
      regulationVersionId: r1Id,
      outcome: 'MET',
      requiredDisposition: null,
    });
    expect(segments1[1]).toMatchObject({
      segmentOrder: 2,
      segmentStart: '2026-09-01T00:00:00.000Z',
      segmentEnd: null,
      regulationVersionId: r2Id,
      outcome: 'UNMET',
    });
    expect(segments1[1].requiredDisposition).toBeTruthy();

    // Submitting and attempting to approve with RETAIN_VALID while Segment 2 fails MUST be rejected (409)
    const subUnresolved = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections/${corrV1Id}/submit`,
      officer,
      { expectedRevision: proposedUnresolved.body.data.revision },
    ).expect(200);

    const blockedApproval = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections/${corrV1Id}/approve`,
      manager,
      {
        expectedRevision: subUnresolved.body.data.revision,
        targetVersionId: targetReg.versionId,
        reason: 'Thử phê duyệt khi phân đoạn R2 vượt hạn mức mà không có phương án xử lý.',
      },
      randomUUID(),
    );
    expect(blockedApproval.status).toBe(409);

    // Official pointer remains v1
    const regStillV1 = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: targetReg.caseId },
    });
    expect(regStillV1.currentValidatedVersionId).toBe(targetReg.versionId);

    // 3. Manager returns corrV1 for supplementation so officer can supply explicit END_EFFECTIVITY disposition
    await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections/${corrV1Id}/return`,
      manager,
      {
        expectedRevision: subUnresolved.body.data.revision,
        reason: 'Phân đoạn từ 01/09/2026 vượt hạn mức R2; cần chọn phương án xử lý hiệu lực.',
      },
    ).expect(200);

    // 4. Officer proposes successor corrV2 in the same correction case with RECORD_ERRONEOUS disposition
    // keeping the historical [2026-08-10, null) span across R1 (MET) and R2 (UNMET) and explicitly disposing the prior decision
    const proposedResolved = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections`,
      officer,
      {
        targetVersionId: targetReg.versionId,
        nonHomegrownOptIn: true,
        disposition: 'RECORD_ERRONEOUS',
        reason: 'Ghi nhận quyết định trước đây có sai sót do vượt hạn mức từ giai đoạn R2.',
        basis: 'Quyết định hiệu chỉnh ngày sinh số 19/QĐ-BTC và biên bản rà soát hạn mức.',
        affectedReferences: [
          {
            kind: 'OFFICIAL_RESULT',
            referenceId: matchRefId,
            note: 'Cần rà soát biên bản trận đấu Vòng 4 cho UC19.',
          },
        ],
      },
    ).expect(201);

    expect(proposedResolved.body.data.correctionCaseId).toBe(corrCaseId);
    expect(proposedResolved.body.data.versionNumber).toBe(2);
    expect(proposedResolved.body.data.predecessorVersionId).toBe(corrV1Id);
    const corrV2Id = proposedResolved.body.data.correctionVersionId as string;
    const proposedRegVId = proposedResolved.body.data.proposedVersionId as string;

    const subResolved = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections/${corrV2Id}/submit`,
      officer,
      { expectedRevision: proposedResolved.body.data.revision },
    ).expect(200);

    // 5. Independent manager approves corrV2 with critical command receipt
    const approveKey = randomUUID();
    const approved = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections/${corrV2Id}/approve`,
      manager,
      {
        expectedRevision: subResolved.body.data.revision,
        targetVersionId: targetReg.versionId,
        disposition: 'RECORD_ERRONEOUS',
        reason: 'Chấp thuận đính chính D057 với phương án ghi nhận quyết định trước có sai sót.',
      },
      approveKey,
    ).expect(200);

    expect(approved.body.data.state).toBe('APPROVED');
    expect(approved.body.data.currentValidatedVersionId).toBe(proposedRegVId);

    // Idempotent replay with same key returns same bounded outcome
    const replay = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections/${corrV2Id}/approve`,
      manager,
      {
        expectedRevision: subResolved.body.data.revision,
        targetVersionId: targetReg.versionId,
        disposition: 'RECORD_ERRONEOUS',
        reason: 'Chấp thuận đính chính D057 với phương án ghi nhận quyết định trước có sai sót.',
      },
      approveKey,
    ).expect(200);
    expect(replay.body.data.currentValidatedVersionId).toBe(proposedRegVId);

    // Verify committed database state via independent readerDb
    const [committedReg, originalV1, correctedV, persistedSegments] = await Promise.all([
      readerDb.client.playerRegistration.findUniqueOrThrow({
        where: { id: targetReg.caseId },
      }),
      readerDb.client.registrationVersion.findUniqueOrThrow({
        where: { id: targetReg.versionId },
      }),
      readerDb.client.registrationVersion.findUniqueOrThrow({
        where: { id: proposedRegVId },
      }),
      readerDb.client.registrationCorrectionSegment.findMany({
        where: { correctionVersionId: corrV2Id },
        orderBy: { segmentOrder: 'asc' },
      }),
    ]);

    expect(committedReg.currentValidatedVersionId).toBe(proposedRegVId);
    // Original v1 receipt and confirmation bases are preserved untouched
    expect(originalV1.state).toBe('VALID');
    expect(originalV1.receivedAt?.toISOString()).toBe(targetReg.receivedAt.toISOString());
    expect(originalV1.decidedAt?.toISOString()).toBe(targetReg.decidedAt.toISOString());
    expect(originalV1.receiptRegulationVersionId).toBe(r1Id);
    expect(originalV1.decisionRegulationVersionId).toBe(r1Id);
    expect(originalV1.u21Finding).toBe(true);

    // New official version preserves original receipt basis and records corrected facts & disposition
    expect(correctedV.state).toBe('VALID');
    expect(correctedV.predecessorVersionId).toBe(targetReg.versionId);
    expect(correctedV.receivedAt?.toISOString()).toBe(targetReg.receivedAt.toISOString());
    expect(correctedV.receiptRegulationVersionId).toBe(r1Id);
    expect(correctedV.u21Finding).toBe(false);
    expect(correctedV.homegrownFinding).toBe(false);
    expect(correctedV.playingDisposition).toBe('RECORDED_ERRONEOUS');

    // Exact R1 and R2 segments persisted on the approved correction version
    expect(persistedSegments).toHaveLength(2);
    expect(persistedSegments[0].regulationVersionId).toBe(r1Id);
    expect(persistedSegments[0].outcome).toBe('MET');
    expect(persistedSegments[1].regulationVersionId).toBe(r2Id);
    expect(persistedSegments[1].outcome).toBe('UNMET');
    expect(persistedSegments[1].requiredDisposition).toBe('RECORD_ERRONEOUS');

    // Related match reference is reported for UC19 review without altering any sporting result
    const listAfter = await fixture
      .apiRequest(manager, 'get', `/player-registrations/${targetReg.caseId}/corrections`)
      .expect(200);
    const approvedItem = listAfter.body.data.items.find(
      (item: { id: string }) => item.id === corrV2Id,
    );
    expect(approvedItem.affectedReferences).toMatchObject({
      uc19MatchReviewRequired: true,
      declared: [
        {
          kind: 'OFFICIAL_RESULT',
          referenceId: matchRefId,
          note: 'Cần rà soát biên bản trận đấu Vòng 4 cho UC19.',
        },
      ],
    });
  });

  it('blocks D057 approval when historical regulation basis is missing for an affected segment', async () => {
    const seasonId = fixture.seasons[0].id;
    // R1 only starts on 2026-08-15T00:00:00.000Z, leaving [2026-08-05, 2026-08-15) without an effective historical regulation!
    const { versionId: r1Id } = await fixture.seedEffectiveRegulation(seasonId, {
      activeFrom: '2026-08-15T00:00:00.000Z',
    });
    const { club, stadium } = await fixture.seedClubAndStadium('D057_MB');
    await seedApprovedClubApplication(seasonId, club.id, stadium.id, r1Id);

    const player = await fixture.seedPlayer(
      'PL_D057_MB',
      'Cầu Thủ Thiếu Quy Định Lịch Sử',
      '2001-04-04',
      'ENG',
    );
    const reg = await seedValidatedRegistration({
      seasonId,
      clubId: club.id,
      playerId: player.id,
      playerBirthDateSnapshot: '2001-04-04',
      receiptRegulationVersionId: r1Id,
      decisionRegulationVersionId: r1Id,
      shirtNumber: 10,
      playingStart: new Date('2026-08-15T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: false,
      homegrownFinding: false,
      nonHomegrownOptIn: true,
    });

    fixture.clock.set(new Date('2026-08-25T10:00:00.000Z'));
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    // Propose correcting playingStart back to 2026-08-05 (where no regulation was active in [2026-08-05, 2026-08-15))
    const proposed = await postMutate(`/player-registrations/${reg.caseId}/corrections`, officer, {
      targetVersionId: reg.versionId,
      playingStart: '2026-08-05T00:00:00.000Z',
      disposition: 'RETAIN_VALID',
      reason: 'Đính chính mốc bắt đầu hiệu lực về ngày 05/08/2026.',
      basis: 'Biên bản rà soát ngày hiệu lực gốc.',
    }).expect(201);

    const corrVId = proposed.body.data.correctionVersionId as string;
    const gapSegments = proposed.body.data.segments as Array<{
      segmentOrder: number;
      segmentStart: string;
      segmentEnd: string | null;
      regulationVersionId: string | null;
      regulationVersionNumber: number | null;
      outcome: string;
    }>;
    expect(gapSegments).toHaveLength(2);
    expect(gapSegments[0]).toMatchObject({
      segmentOrder: 1,
      segmentStart: '2026-08-05T00:00:00.000Z',
      segmentEnd: '2026-08-15T00:00:00.000Z',
      regulationVersionId: null,
      regulationVersionNumber: null,
      outcome: 'INSUFFICIENT_BASIS',
    });
    expect(gapSegments[1]).toMatchObject({
      segmentOrder: 2,
      segmentStart: '2026-08-15T00:00:00.000Z',
      segmentEnd: null,
      regulationVersionId: r1Id,
      outcome: 'MET',
    });

    const storedSegments = await readerDb.client.registrationCorrectionSegment.findMany({
      where: { correctionVersionId: corrVId },
      orderBy: { segmentOrder: 'asc' },
    });
    expect(storedSegments[0].regulationVersionId).toBeNull();
    expect(storedSegments[0].outcome).toBe('INSUFFICIENT_BASIS');
    expect(storedSegments[1].regulationVersionId).toBe(r1Id);

    const submitted = await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrVId}/submit`,
      officer,
      { expectedRevision: proposed.body.data.revision },
    ).expect(200);

    const approval = await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrVId}/approve`,
      manager,
      {
        expectedRevision: submitted.body.data.revision,
        targetVersionId: reg.versionId,
        reason: 'Thử phê duyệt khi thiếu căn cứ quy định lịch sử.',
      },
      randomUUID(),
    ).expect(409);
    expect(approval.body.error.code).toBe('STATE_CONFLICT');
    expect(approval.body.error.message).toMatch(/Thiếu phiên bản quy định lịch sử/i);

    const committed = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: reg.caseId },
    });
    expect(committed.currentValidatedVersionId).toBe(reg.versionId);
  });

  it('routes future-effective errors through D057 independent approval and rejects bypassing via D075 plan-change', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: r1Id } = await fixture.seedEffectiveRegulation(seasonId);
    const { club, stadium } = await fixture.seedClubAndStadium('D057_FUT');
    await seedApprovedClubApplication(seasonId, club.id, stadium.id, r1Id);

    const player = await fixture.seedPlayer(
      'PL_D057_FUT',
      'Cầu Thủ Kế Hoạch Tương Lai Sai Sót',
      '2001-08-08',
      'ENG',
    );
    // Confirmed future-effective registration (playingStart 2026-08-25 > clock 2026-08-10)
    const futureReg = await seedValidatedRegistration({
      seasonId,
      clubId: club.id,
      playerId: player.id,
      playerBirthDateSnapshot: '2001-08-08',
      receiptRegulationVersionId: r1Id,
      decisionRegulationVersionId: r1Id,
      shirtNumber: 18,
      playingStart: new Date('2026-08-25T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: false,
      homegrownFinding: false,
      nonHomegrownOptIn: true,
    });

    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);

    // 1. Attempting to bypass D057 via D075 /plan-change to backdate or alter error classification is rejected
    const bypassAttempt = await postMutate(
      `/player-registrations/${futureReg.caseId}/plan-change`,
      officer,
      {
        versionId: futureReg.versionId,
        expectedRevision: '1',
        playingStart: '2026-08-09T00:00:00.000Z',
        reason: 'Thử dùng D075 để sửa lỗi ngày bắt đầu về quá khứ mà không qua phê duyệt độc lập.',
      },
      randomUUID(),
    );
    expect(bypassAttempt.status).toBe(409);

    // 2. Proposing error correction on future-effective registration through D057 keeps v1 official until independent manager approval
    const proposed = await postMutate(
      `/player-registrations/${futureReg.caseId}/corrections`,
      officer,
      {
        targetVersionId: futureReg.versionId,
        shirtNumber: 28,
        playingStart: '2026-08-22T00:00:00.000Z',
        evidenceBranch: 'SEASONS',
        qualifyingValue: 3,
        evidenceSummary: 'Đào tạo 3 mùa tại học viện CLB từ 16 đến 19 tuổi.',
        evidenceReference: 'HG-CERT-2026-28',
        affiliatedAssociationBasis: true,
        nonHomegrownOptIn: false,
        disposition: 'RETAIN_VALID',
        reason:
          'Đính chính sai sót số áo, ngày bắt đầu và bổ sung căn cứ đào tạo nội địa đã ghi sai trên kế hoạch tương lai.',
        basis: 'Hồ sơ đăng ký gốc ngày 06/08/2026 và chứng nhận học viện.',
      },
    ).expect(201);

    const corrVId = proposed.body.data.correctionVersionId as string;
    const proposedRegVId = proposed.body.data.proposedVersionId as string;

    const submitted = await postMutate(
      `/player-registrations/${futureReg.caseId}/corrections/${corrVId}/submit`,
      officer,
      { expectedRevision: proposed.body.data.revision },
    ).expect(200);

    // Official pointer is still v1 before manager approval
    const beforeApprove = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: futureReg.caseId },
    });
    expect(beforeApprove.currentValidatedVersionId).toBe(futureReg.versionId);

    // Independent manager approves D057 correction on future-effective record
    await postMutate(
      `/player-registrations/${futureReg.caseId}/corrections/${corrVId}/approve`,
      manager,
      {
        expectedRevision: submitted.body.data.revision,
        targetVersionId: futureReg.versionId,
        disposition: 'RETAIN_VALID',
        reason: 'Phê duyệt độc lập đính chính sai sót trên kế hoạch tương lai theo D057.',
      },
      randomUUID(),
    ).expect(200);

    const afterApprove = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: futureReg.caseId },
      include: { currentValidatedVersion: true },
    });
    expect(afterApprove.currentValidatedVersionId).toBe(proposedRegVId);
    expect(afterApprove.currentValidatedVersion?.shirtNumber).toBe(28);
    expect(afterApprove.currentValidatedVersion?.homegrownFinding).toBe(true);
    expect(afterApprove.currentValidatedVersion?.playingStart?.toISOString()).toBe(
      '2026-08-22T00:00:00.000Z',
    );
  });

  it('records return for supplementation and rejection as separate outcomes while retaining the submitted version and current validated pointer, and enforces independent authority, stale basis and rollback', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: r1Id } = await fixture.seedEffectiveRegulation(seasonId);
    const { club, stadium } = await fixture.seedClubAndStadium('D057_ALT');
    await seedApprovedClubApplication(seasonId, club.id, stadium.id, r1Id);

    const player = await fixture.seedPlayer(
      'PL_D057_ALT',
      'Cầu Thủ Luồng Trả Lại Và Từ Chối',
      '2000-11-11',
      'ENG',
    );
    const reg = await seedValidatedRegistration({
      seasonId,
      clubId: club.id,
      playerId: player.id,
      playerBirthDateSnapshot: '2000-11-11',
      receiptRegulationVersionId: r1Id,
      decisionRegulationVersionId: r1Id,
      shirtNumber: 12,
      playingStart: new Date('2026-08-08T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: false,
      homegrownFinding: false,
      nonHomegrownOptIn: true,
    });

    // Grant seasonManagerA REGISTRATION_OFFICER so they can edit a draft and test former-editor exclusion
    await fixture.database.client.seasonRoleAssignment.create({
      data: {
        accountId: fixture.staff.seasonManagerA,
        seasonId,
        roleCode: 'REGISTRATION_OFFICER',
        grantedBy: fixture.staff.admin,
        grantedAt: await fixture.database.now(),
      },
    });

    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const dualRoleManagerA = await fixture.authenticate(fixture.staff.seasonManagerA);
    const independentManagerB = await fixture.authenticate(fixture.staff.seasonManagerB);

    // 1. Propose v1 correction, dualRoleManagerA edits draft, officer submits
    const c1 = await postMutate(`/player-registrations/${reg.caseId}/corrections`, officer, {
      targetVersionId: reg.versionId,
      shirtNumber: 22,
      disposition: 'RETAIN_VALID',
      reason: 'Đính chính số áo đăng ký lần 1.',
      basis: 'Văn bản đề nghị đính chính số 01.',
    }).expect(201);
    const corrV1Id = c1.body.data.correctionVersionId as string;
    const propRegV1Id = c1.body.data.proposedVersionId as string;

    const c1Edited = await fixture
      .apiRequest(
        dualRoleManagerA,
        'patch',
        `/player-registrations/${reg.caseId}/corrections/${corrV1Id}`,
        {
          expectedRevision: c1.body.data.revision,
          shirtNumber: 23,
        },
      )
      .expect(200);

    const c1Sub = await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrV1Id}/submit`,
      officer,
      { expectedRevision: c1Edited.body.data.revision },
    ).expect(200);

    // Former editor (dualRoleManagerA) is denied approve, return and reject (403)
    await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrV1Id}/approve`,
      dualRoleManagerA,
      {
        expectedRevision: c1Sub.body.data.revision,
        targetVersionId: reg.versionId,
        reason: 'Tự phê duyệt bản từng chỉnh sửa.',
      },
      randomUUID(),
    ).expect(403);

    await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrV1Id}/return`,
      dualRoleManagerA,
      {
        expectedRevision: c1Sub.body.data.revision,
        reason: 'Tự trả lại bản từng chỉnh sửa.',
      },
    ).expect(403);

    await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrV1Id}/reject`,
      dualRoleManagerA,
      {
        expectedRevision: c1Sub.body.data.revision,
        reason: 'Tự từ chối bản từng chỉnh sửa.',
      },
    ).expect(403);

    // 2. Independent manager B RETURNS corrV1 for supplementation -> state = RETURNED, pointer stays reg.versionId
    const returned = await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrV1Id}/return`,
      independentManagerB,
      {
        expectedRevision: c1Sub.body.data.revision,
        reason: 'Cần bổ sung bản chụp biểu mẫu đăng ký gốc.',
      },
    ).expect(200);
    expect(returned.body.data.state).toBe('RETURNED');

    const regAfterReturn = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: reg.caseId },
    });
    expect(regAfterReturn.currentValidatedVersionId).toBe(reg.versionId);

    const retainedCorrV1 = await readerDb.client.registrationCorrectionVersion.findUniqueOrThrow({
      where: { id: corrV1Id },
    });
    expect(retainedCorrV1.state).toBe('RETURNED');
    expect(retainedCorrV1.proposedVersionId).toBe(propRegV1Id);

    // 3. Officer proposes successor corrV2, submits, and independent manager B REJECTS -> state = REJECTED, pointer stays reg.versionId
    const c2 = await postMutate(`/player-registrations/${reg.caseId}/corrections`, officer, {
      targetVersionId: reg.versionId,
      shirtNumber: 24,
      disposition: 'RETAIN_VALID',
      reason: 'Đính chính số áo lần 2 sau khi bổ sung.',
      basis: 'Văn bản số 02.',
    }).expect(201);
    const corrV2Id = c2.body.data.correctionVersionId as string;
    const propRegV2Id = c2.body.data.proposedVersionId as string;
    expect(c2.body.data.predecessorVersionId).toBe(corrV1Id);

    const c2Sub = await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrV2Id}/submit`,
      officer,
      { expectedRevision: c2.body.data.revision },
    ).expect(200);

    const rejected = await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrV2Id}/reject`,
      independentManagerB,
      {
        expectedRevision: c2Sub.body.data.revision,
        reason: 'Không đủ căn cứ chứng minh sai sót ghi chép số áo ban đầu.',
      },
    ).expect(200);
    expect(rejected.body.data.state).toBe('REJECTED');

    const regAfterReject = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: reg.caseId },
    });
    expect(regAfterReject.currentValidatedVersionId).toBe(reg.versionId);

    const retainedCorrV2 = await readerDb.client.registrationCorrectionVersion.findUniqueOrThrow({
      where: { id: corrV2Id },
    });
    expect(retainedCorrV2.state).toBe('REJECTED');
    expect(retainedCorrV2.proposedVersionId).toBe(propRegV2Id);

    // Both submitted versions corrV1 (RETURNED) and corrV2 (REJECTED) remain in history with distinct outcomes
    const listAfterAlt = await fixture
      .apiRequest(independentManagerB, 'get', `/player-registrations/${reg.caseId}/corrections`)
      .expect(200);
    expect(listAfterAlt.body.data.currentValidatedVersionId).toBe(reg.versionId);
    expect(
      listAfterAlt.body.data.items.map((i: { id: string; state: string }) => ({
        id: i.id,
        state: i.state,
      })),
    ).toEqual([
      { id: corrV2Id, state: 'REJECTED' },
      { id: corrV1Id, state: 'RETURNED' },
    ]);

    // 4. Propose corrV3, test mid-transaction audit failure rollback and stale basis rejection
    const c3 = await postMutate(`/player-registrations/${reg.caseId}/corrections`, officer, {
      targetVersionId: reg.versionId,
      shirtNumber: 25,
      disposition: 'RETAIN_VALID',
      reason: 'Đính chính số áo lần 3 hợp lệ.',
      basis: 'Biên bản xác nhận số áo gốc có dấu CLB.',
    }).expect(201);
    const corrV3Id = c3.body.data.correctionVersionId as string;
    const propRegV3Id = c3.body.data.proposedVersionId as string;

    const c3Sub = await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrV3Id}/submit`,
      officer,
      { expectedRevision: c3.body.data.revision },
    ).expect(200);

    // Inject audit failure -> full transaction rolls back leaving currentValidatedVersionId at reg.versionId
    const auditSpy = jest
      .spyOn(AuditWriterService.prototype, 'append')
      .mockRejectedValueOnce(new Error('Simulated D057 audit failure'));

    await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrV3Id}/approve`,
      independentManagerB,
      {
        expectedRevision: c3Sub.body.data.revision,
        targetVersionId: reg.versionId,
        reason: 'Thử phê duyệt khi lỗi ghi audit.',
      },
      randomUUID(),
    ).expect(500);
    auditSpy.mockRestore();

    const regAfterRollback = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: reg.caseId },
    });
    expect(regAfterRollback.currentValidatedVersionId).toBe(reg.versionId);

    // Approve corrV3 cleanly
    await postMutate(
      `/player-registrations/${reg.caseId}/corrections/${corrV3Id}/approve`,
      independentManagerB,
      {
        expectedRevision: c3Sub.body.data.revision,
        targetVersionId: reg.versionId,
        reason: 'Phê duyệt đính chính lần 3 hợp lệ.',
      },
      randomUUID(),
    ).expect(200);

    // Attempting to propose against stale reg.versionId is now rejected with 409 BASIS_CHANGED
    const stalePropose = await postMutate(
      `/player-registrations/${reg.caseId}/corrections`,
      officer,
      {
        targetVersionId: reg.versionId,
        shirtNumber: 26,
        disposition: 'RETAIN_VALID',
        reason: 'Thử đề xuất trên phiên bản chính thức cũ.',
        basis: 'Văn bản.',
      },
    ).expect(409);
    expect(stalePropose.body.error.code).toBe('BASIS_CHANGED');

    const regFinal = await readerDb.client.playerRegistration.findUniqueOrThrow({
      where: { id: reg.caseId },
    });
    expect(regFinal.currentValidatedVersionId).toBe(propRegV3Id);
  });

  it('sets END_EFFECTIVITY cutoff playingEnd, isolates correction drafts from ordinary writes, refreshes on submit, guards post-submit birthDate drift, preserves homegrown regulation binding, and carries LATE receipt exception across chained corrections', async () => {
    const seasonId = fixture.seasons[0].id;
    const { r1Id, r2Id } = await seedRegulationHistoryR1AndR2(seasonId, {
      r1ActiveFrom: '2026-08-01T00:00:00.000Z',
      r2ActiveFrom: '2026-09-01T00:00:00.000Z',
      r2ActivationProcessedAt: '2026-09-05T14:30:00.000Z',
      r1SquadLimit: 2,
      r1NonHomegrownLimit: 2,
      r2SquadLimit: 1,
      r2NonHomegrownLimit: 1,
    });

    const { club, stadium } = await fixture.seedClubAndStadium('D057_PR');
    await seedApprovedClubApplication(seasonId, club.id, stadium.id, r1Id);

    const teammate = await fixture.seedPlayer(
      'PL_D057_PR_TM',
      'Đồng Đội Kiểm Chứng Cutoff',
      '1998-03-15',
      'ENG',
    );
    await seedValidatedRegistration({
      seasonId,
      clubId: club.id,
      playerId: teammate.id,
      playerBirthDateSnapshot: '1998-03-15',
      receiptRegulationVersionId: r1Id,
      decisionRegulationVersionId: r1Id,
      shirtNumber: 8,
      playingStart: new Date('2026-08-05T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: false,
      homegrownFinding: false,
      nonHomegrownOptIn: true,
    });

    const player = await fixture.seedPlayer(
      'PL_D057_PR_01',
      'Cầu Thủ Đính Chính Toàn Diện',
      '2006-01-10',
      'ENG',
    );
    const targetReg = await seedValidatedRegistration({
      seasonId,
      clubId: club.id,
      playerId: player.id,
      playerBirthDateSnapshot: '2006-01-10',
      receiptRegulationVersionId: r1Id,
      decisionRegulationVersionId: r1Id,
      receiptTimingStatus: 'LATE',
      shirtNumber: 21,
      playingStart: new Date('2026-08-10T00:00:00.000Z'),
      playingEnd: null,
      u21Finding: true,
      homegrownFinding: null,
      nonHomegrownOptIn: false,
    });

    // Attach an approved ReceiptExceptionVersion bound to targetReg v1
    const exCaseId = randomUUID();
    const exVerId = randomUUID();
    const lateAt = new Date('2026-08-06T09:00:00.000Z');
    await fixture.database.client.receiptExceptionCase.create({
      data: { id: exCaseId, seasonId, createdAt: lateAt, updatedAt: lateAt },
    });
    await fixture.database.client.receiptExceptionVersion.create({
      data: {
        id: exVerId,
        seasonId,
        caseId: exCaseId,
        versionNumber: 1,
        preparedBy: fixture.staff.registrationOfficerA,
        state: 'APPROVED',
        submittedAt: lateAt,
        decidedAt: lateAt,
        decidedBy: fixture.staff.seasonManagerA,
        decisionReason: 'Chấp thuận ngoại lệ tiếp nhận trễ.',
        registrationVersionId: targetReg.versionId,
        reason: 'Sự cố hệ thống truyền hồ sơ.',
        basis: 'Biên bản xác nhận.',
        createdAt: lateAt,
      },
    });
    await fixture.database.client.receiptExceptionCase.update({
      where: { id: exCaseId },
      data: { currentVersionId: exVerId, approvedVersionId: exVerId },
    });

    fixture.clock.set(new Date('2026-09-10T10:00:00.000Z'));
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const manager = await fixture.authenticate(fixture.staff.seasonManagerA);
    const masterGrantee = await fixture.authenticate(fixture.staff.playerMasterGrantee);

    // 1. Propose draft BEFORE birthDate changes; also verify ordinary write paths reject the correction's proposedVersionId
    const draft = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections`,
      officer,
      {
        targetVersionId: targetReg.versionId,
        nonHomegrownOptIn: true,
        disposition: 'END_EFFECTIVITY',
        reason: 'Kiểm tra đồng bộ khi trình duyệt và chấm dứt hiệu lực.',
        basis: 'Hồ sơ rà soát ban đầu.',
      },
    ).expect(201);
    const corr1Id = draft.body.data.correctionVersionId as string;
    const proposedV1Id = draft.body.data.proposedVersionId as string;

    // Ordinary write paths MUST reject correction-proposed DRAFT version (404)
    await fixture
      .apiRequest(
        officer,
        'patch',
        `/player-registrations/${targetReg.caseId}/versions/${proposedV1Id}`,
        {
          expectedRevision: '1',
          shirtNumber: 99,
        },
      )
      .expect(404);
    await postMutate(
      `/player-registrations/${targetReg.caseId}/versions/${proposedV1Id}/receive`,
      officer,
      { expectedRevision: '1' },
    ).expect(404);

    // 2. Now update player birthDate to 2004-01-10 AFTER draft creation, BEFORE submit
    await fixture
      .apiRequest(masterGrantee, 'patch', `/players/${player.id}`, {
        expectedRevision: '1',
        birthDate: '2004-01-10',
        correctionReason: 'Cập nhật năm sinh trước khi trình duyệt.',
        correctionBasis: 'Giấy khai sinh bản chính.',
      })
      .expect(200);

    // Submit MUST refresh proposedVersion fields & afterSummary & segments
    const sub1 = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections/${corr1Id}/submit`,
      officer,
      { expectedRevision: draft.body.data.revision },
    ).expect(200);

    const refreshedDraft = await readerDb.client.registrationCorrectionVersion.findUniqueOrThrow({
      where: { id: corr1Id },
      include: { proposedVersion: true, segments: { orderBy: { segmentOrder: 'asc' } } },
    });
    expect(refreshedDraft.proposedVersion.u21Finding).toBe(false);
    expect((refreshedDraft.afterSummary as { playerBirthDate?: string }).playerBirthDate).toBe(
      '2004-01-10',
    );
    expect(refreshedDraft.segments).toHaveLength(2);
    expect(refreshedDraft.segments[0].outcome).toBe('MET');
    expect(refreshedDraft.segments[1].outcome).toBe('UNMET');

    // 3. Change birthDate slightly AFTER submit (still non-U21: 2004-02-15) -> approve MUST reject BASIS_CHANGED
    await fixture
      .apiRequest(masterGrantee, 'patch', `/players/${player.id}`, {
        expectedRevision: '2',
        birthDate: '2004-02-15',
        correctionReason: 'Chỉnh ngày sinh sau khi trình duyệt.',
        correctionBasis: 'Bổ sung bản sao.',
      })
      .expect(200);

    const driftApprove = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections/${corr1Id}/approve`,
      manager,
      {
        expectedRevision: sub1.body.data.revision,
        targetVersionId: targetReg.versionId,
        disposition: 'END_EFFECTIVITY',
        reason: 'Thử phê duyệt khi ngày sinh đã lệch sau trình duyệt.',
      },
      randomUUID(),
    ).expect(409);
    expect(driftApprove.body.error.code).toBe('BASIS_CHANGED');

    // Restore birthDate back to 2004-01-10 and approve END_EFFECTIVITY
    await fixture
      .apiRequest(masterGrantee, 'patch', `/players/${player.id}`, {
        expectedRevision: '3',
        birthDate: '2004-01-10',
        correctionReason: 'Khôi phục đúng ngày sinh đã trình duyệt.',
        correctionBasis: 'Đối chiếu bản chính.',
      })
      .expect(200);

    await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections/${corr1Id}/approve`,
      manager,
      {
        expectedRevision: sub1.body.data.revision,
        targetVersionId: targetReg.versionId,
        disposition: 'END_EFFECTIVITY',
        reason: 'Chấp thuận chấm dứt hiệu lực từ mốc quy định R2.',
      },
      randomUUID(),
    ).expect(200);

    // Approved version MUST have playingEnd set to R2 cutoff (2026-09-01T00:00:00.000Z), preserving valid prefix
    const endedVersion = await readerDb.client.registrationVersion.findUniqueOrThrow({
      where: { id: proposedV1Id },
    });
    expect(endedVersion.playingDisposition).toBe('ENDED_BY_CORRECTION');
    expect(endedVersion.playingEnd?.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(
      (endedVersion.officialSnapshot as { registration?: { playingEnd?: string | null } })
        ?.registration?.playingEnd,
    ).toBe('2026-09-01T00:00:00.000Z');
    expect(
      (endedVersion.officialSnapshot as { basis?: { receiptExceptionVersionId?: string | null } })
        ?.basis?.receiptExceptionVersionId,
    ).toBe(exVerId);

    // 4. Subsequent correction targeting the LATE successor (proposedV1Id) MUST retain original approved receipt exception
    //    AND homegrown evidence verified under R1 MUST produce INSUFFICIENT_BASIS on R2 segment
    const chained = await postMutate(
      `/player-registrations/${targetReg.caseId}/corrections`,
      officer,
      {
        targetVersionId: proposedV1Id,
        shirtNumber: 22,
        playingStart: '2026-08-10T00:00:00.000Z',
        playingEnd: '2026-09-10T00:00:00.000Z',
        nonHomegrownOptIn: false,
        evidenceBranch: 'SEASONS',
        qualifyingValue: 3,
        evidenceSummary: 'Đào tạo đủ 3 mùa tại học viện.',
        evidenceReference: 'HG-REF-01',
        affiliatedAssociationBasis: true,
        verifiedRegulationVersionId: r1Id,
        disposition: 'RETAIN_VALID',
        reason:
          'Kiểm chứng ngoại lệ tiếp nhận trễ kế thừa và ràng buộc phiên bản xác minh nội địa.',
        basis: 'Hồ sơ học viện.',
      },
    ).expect(201);

    const chainedSegments = chained.body.data.segments as Array<{
      segmentOrder: number;
      regulationVersionId: string | null;
      outcome: string;
      findings: { criteria: Array<{ criterion: string; status: string }> };
    }>;
    expect(chainedSegments).toHaveLength(2);
    // Receipt timing criterion passes on BOTH segments because original LATE exception is inherited!
    expect(
      chainedSegments[0].findings.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status,
    ).toBe('MET');
    expect(
      chainedSegments[1].findings.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status,
    ).toBe('MET');
    // Segment 1 (R1) matches verifiedRegulationVersionId (r1Id) -> homegrown MET
    expect(
      chainedSegments[0].findings.criteria.find((c) => c.criterion === 'HOMEGROWN_VERIFICATION')
        ?.status,
    ).toBe('MET');
    // Segment 2 (R2) mismatches verifiedRegulationVersionId (r1Id !== r2Id) -> INSUFFICIENT_BASIS!
    expect(chainedSegments[1].regulationVersionId).toBe(r2Id);
    expect(
      chainedSegments[1].findings.criteria.find((c) => c.criterion === 'HOMEGROWN_VERIFICATION')
        ?.status,
    ).toBe('INSUFFICIENT_BASIS');
    expect(chainedSegments[1].outcome).toBe('INSUFFICIENT_BASIS');
  });
});
