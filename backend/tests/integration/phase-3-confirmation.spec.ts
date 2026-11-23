import { randomUUID } from 'node:crypto';
import type { ApplicationError } from '../../src/platform/application-error';
import {
  evaluateRegistrationEligibilityForConfirmation,
  precheckRegistrationEligibility,
} from '../../src/registry-registration/registration-eligibility';
import {
  discoverSeasonWithDueRules,
  requireSeasonRegistrationOfficer,
  resolveEffectiveRegulationWithInstant,
} from '../../src/registry-registration/registration-execution';
import { RegulationActivationService } from '../../src/season-regulations/regulation-activation.service';
import { DECLARED_TEST_ONLY_REGULATION, setupPhase3HttpFixture } from './phase-3-fixtures';

describe('PHASE 3 US3 — Eligibility, quota and confirmation boundaries against PostgreSQL (T012/T013 integration)', () => {
  const fixture = setupPhase3HttpFixture('2026-08-10T10:00:00.000Z');

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
        coachName: 'HLV Kiểm thử',
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
    u21Finding: boolean;
    homegrownFinding: boolean | null;
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
        u21Finding: params.u21Finding,
        homegrownFinding: params.homegrownFinding,
        receiptRegulationVersionId: params.regulationVersionId,
        receiptTimingStatus: 'ON_TIME',
        decisionRegulationVersionId: params.regulationVersionId,
        playingDisposition: params.playingDisposition ?? null,
        createdAt: now,
      },
    });
    await fixture.database.client.playerRegistration.update({
      where: { id: caseId },
      data: { currentValidatedVersionId: versionId, updatedAt: now },
    });
    return { caseId, versionId };
  }

  it('enforces U21 cutoff equality, homegrown branches, corrected Player birthDate and pending participation against real records', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId, {
      u21Cutoff: '2005-01-01',
    });
    const { club, stadium } = await fixture.seedClubAndStadium('EL01');
    const player = await fixture.seedPlayer('PL_EL_01', 'Cầu thủ Cắt Ngưỡng', '2004-12-31', 'ENG');

    const activation = fixture.app.get(RegulationActivationService);
    const officerId = fixture.staff.registrationOfficerA;

    // 1) Club participation still pending -> precheck runs read-only and reports CLUB_PARTICIPATION UNMET
    const pendingAssessment = await fixture.database.write(
      [
        { kind: 'season', key: seasonId, mode: 'shared' },
        { kind: 'club', key: club.id, mode: 'shared' },
        { kind: 'player', key: player.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officerId, seasonId),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId,
          clubId: club.id,
          playerId: player.id,
          shirtNumber: 10,
          playingStart: new Date('2026-08-15T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: false,
          homegrownEvidence: {
            evidenceBranch: 'MONTHS',
            qualifyingValue: 36,
            evidenceSummary: '36 tháng đào tạo liên kết FA Anh',
            evidenceReference: 'FA-M-36',
            verifiedBy: officerId,
            verifiedAt: new Date('2026-08-10T09:00:00.000Z'),
            verifiedRegulationVersionId: regVersionId,
            affiliatedAssociationBasis: true,
          },
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officerId },
    );

    expect(pendingAssessment.eligibleForConfirmation).toBe(false);
    expect(
      pendingAssessment.criteria.find((c) => c.criterion === 'CLUB_PARTICIPATION')?.status,
    ).toBe('UNMET');
    expect(pendingAssessment.u21Finding).toBe(false);
    expect(pendingAssessment.homegrownFinding).toBe(true);

    // 2) Approve BM1 participation and correct Player birthDate to exact cutoff 2005-01-01 (FR-007)
    await seedApprovedClubApplication(seasonId, club.id, stadium.id, regVersionId);
    await fixture.database.client.player.update({
      where: { id: player.id },
      data: { birthDate: new Date('2005-01-01T00:00:00.000Z'), revision: { increment: 1n } },
    });

    const correctedAssessment = await fixture.database.write(
      [
        { kind: 'season', key: seasonId, mode: 'shared' },
        { kind: 'club', key: club.id, mode: 'shared' },
        { kind: 'player', key: player.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officerId, seasonId),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId,
          clubId: club.id,
          playerId: player.id,
          shirtNumber: 10,
          playingStart: new Date('2026-08-15T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: false,
          homegrownEvidence: null,
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officerId },
    );

    expect(correctedAssessment.u21Finding).toBe(true);
    expect(
      correctedAssessment.criteria.find((c) => c.criterion === 'U21_CLASSIFICATION')?.status,
    ).toBe('MET');
    expect(
      correctedAssessment.criteria.find((c) => c.criterion === 'CLUB_PARTICIPATION')?.status,
    ).toBe('MET');
    expect(correctedAssessment.eligibleForConfirmation).toBe(true);
  });

  it('enforces 25/17 quota, future composition boundaries, future shirt conflict and cross-season overlap', async () => {
    const season1 = fixture.seasons[0].id;
    const season2 = fixture.seasons[1].id;
    const { versionId: reg1 } = await fixture.seedEffectiveRegulation(season1);
    const { versionId: reg2 } = await fixture.seedEffectiveRegulation(season2);
    const { club: clubA, stadium: stadiumA } = await fixture.seedClubAndStadium('EL02A');
    const { club: clubB, stadium: stadiumB } = await fixture.seedClubAndStadium('EL02B');
    await seedApprovedClubApplication(season1, clubA.id, stadiumA.id, reg1);
    await seedApprovedClubApplication(season2, clubB.id, stadiumB.id, reg2);

    // 20 active today (15 non-HG + 5 HG) + 5 confirmed future starting 2026-10-01 (2 non-HG + 3 HG) = 25 counted / 17 non-HG at 2026-10-01
    for (let i = 1; i <= 20; i++) {
      const p = await fixture.seedPlayer(`PL_Q_${i}`, `Cầu thủ Hiện tại ${i}`, '2000-01-01');
      await seedValidatedRegistration({
        seasonId: season1,
        clubId: clubA.id,
        playerId: p.id,
        regulationVersionId: reg1,
        shirtNumber: i,
        playingStart: new Date('2026-08-01T00:00:00.000Z'),
        playingEnd: null,
        u21Finding: false,
        homegrownFinding: i > 15,
      });
    }
    for (let i = 21; i <= 25; i++) {
      const p = await fixture.seedPlayer(`PL_FQ_${i}`, `Cầu thủ Tương lai ${i}`, '2000-01-01');
      await seedValidatedRegistration({
        seasonId: season1,
        clubId: clubA.id,
        playerId: p.id,
        regulationVersionId: reg1,
        shirtNumber: i,
        playingStart: new Date('2026-10-01T00:00:00.000Z'),
        playingEnd: null,
        u21Finding: false,
        homegrownFinding: i > 22,
      });
    }

    const candidatePlayer = await fixture.seedPlayer('PL_CAND_1', 'Cầu thủ Mới', '2001-05-05');
    const activation = fixture.app.get(RegulationActivationService);
    const officer1 = fixture.staff.registrationOfficerA;
    const officer2 = fixture.staff.registrationOfficerSeason2;

    // Future quota breach + future shirt conflict (#21 taken starting 2026-10-01) even though today has only 20 players
    const futureConflict = await fixture.database.write(
      [
        { kind: 'season', key: season1, mode: 'shared' },
        { kind: 'club', key: clubA.id, mode: 'shared' },
        { kind: 'player', key: candidatePlayer.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officer1, season1),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId: season1,
          clubId: clubA.id,
          playerId: candidatePlayer.id,
          shirtNumber: 21,
          playingStart: new Date('2026-08-15T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: true,
          homegrownEvidence: null,
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officer1 },
    );

    expect(futureConflict.eligibleForConfirmation).toBe(false);
    expect(futureConflict.criteria.find((c) => c.criterion === 'SHIRT_NUMBER')?.status).toBe(
      'UNMET',
    );
    expect(futureConflict.criteria.find((c) => c.criterion === 'SQUAD_LIMIT')?.status).toBe(
      'UNMET',
    );
    expect(futureConflict.criteria.find((c) => c.criterion === 'NON_HOMEGROWN_LIMIT')?.status).toBe(
      'UNMET',
    );

    // Cross-season overlap vs adjacent interval
    const crossPlayer = await fixture.seedPlayer('PL_CROSS_1', 'Cầu thủ Liên mùa', '2001-04-04');
    await seedValidatedRegistration({
      seasonId: season1,
      clubId: clubA.id,
      playerId: crossPlayer.id,
      regulationVersionId: reg1,
      shirtNumber: 77,
      playingStart: new Date('2026-08-01T00:00:00.000Z'),
      playingEnd: new Date('2026-10-01T00:00:00.000Z'),
      u21Finding: true,
      homegrownFinding: null,
    });

    const overlappingSeason2 = await fixture.database.write(
      [
        { kind: 'season', key: season2, mode: 'shared' },
        { kind: 'club', key: clubB.id, mode: 'shared' },
        { kind: 'player', key: crossPlayer.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officer2, season2),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId: season2,
          clubId: clubB.id,
          playerId: crossPlayer.id,
          shirtNumber: 9,
          playingStart: new Date('2026-09-15T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: true,
          homegrownEvidence: null,
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officer2 },
    );
    expect(overlappingSeason2.eligibleForConfirmation).toBe(false);
    expect(overlappingSeason2.criteria.find((c) => c.criterion === 'PLAYER_OVERLAP')?.status).toBe(
      'UNMET',
    );

    const adjacentSeason2 = await fixture.database.write(
      [
        { kind: 'season', key: season2, mode: 'shared' },
        { kind: 'club', key: clubB.id, mode: 'shared' },
        { kind: 'player', key: crossPlayer.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officer2, season2),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId: season2,
          clubId: clubB.id,
          playerId: crossPlayer.id,
          shirtNumber: 9,
          playingStart: new Date('2026-10-01T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: true,
          homegrownEvidence: null,
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officer2 },
    );
    expect(adjacentSeason2.criteria.find((c) => c.criterion === 'PLAYER_OVERLAP')?.status).toBe(
      'MET',
    );
    expect(adjacentSeason2.eligibleForConfirmation).toBe(true);
  });

  it('does not activate due waiting regulations during precheck, and applies decision-time R2 while keeping R1 receipt basis at confirmation', async () => {
    const seasonId = fixture.seasons[0].id;
    const { versionId: reg1Id, caseId: regCaseId } = await fixture.seedEffectiveRegulation(
      seasonId,
      {
        u21Cutoff: '2005-01-01',
      },
    );
    const { club, stadium } = await fixture.seedClubAndStadium('EL03');
    await seedApprovedClubApplication(seasonId, club.id, stadium.id, reg1Id);
    const player = await fixture.seedPlayer('PL_RULE_CHG', 'Cầu thủ Đổi Quy định', '2005-06-01');

    // Seed RECEIVED registration version timely under R1
    const regCaseRowId = randomUUID();
    const regVersionRowId = randomUUID();
    const receivedAt = await fixture.clock.now();
    await fixture.database.client.playerRegistration.create({
      data: { id: regCaseRowId, seasonId, clubId: club.id, playerId: player.id },
    });
    await fixture.database.client.registrationVersion.create({
      data: {
        id: regVersionRowId,
        seasonId,
        caseId: regCaseRowId,
        versionNumber: 1,
        preparedBy: fixture.staff.registrationOfficerA,
        state: 'RECEIVED',
        receivedAt,
        shirtNumber: 18,
        playingStart: new Date('2026-08-20T00:00:00.000Z'),
        playingEnd: null,
        nonHomegrownOptIn: false,
        receiptRegulationVersionId: reg1Id,
        receiptTimingStatus: 'ON_TIME',
      },
    });

    // Seed APPROVED_WAITING R2 with stricter u21Cutoff = 2006-01-01 due at 2026-08-12T00:00:00.000Z
    const reg2Id = randomUUID();
    const dueAt = new Date('2026-08-12T00:00:00.000Z');
    await fixture.database.client.regulationVersion.create({
      data: {
        id: reg2Id,
        seasonId,
        caseId: regCaseId,
        versionNumber: 2,
        preparedBy: fixture.staff.seasonManagerA,
        predecessorVersionId: reg1Id,
        state: 'DRAFT',
        effectiveMode: 'SCHEDULED',
        proposedEffectiveAt: dueAt,
        squadLimit: DECLARED_TEST_ONLY_REGULATION.squadLimit,
        nonHomegrownLimit: DECLARED_TEST_ONLY_REGULATION.nonHomegrownLimit,
        homegrownSeasons: DECLARED_TEST_ONLY_REGULATION.homegrownSeasons,
        homegrownMonths: DECLARED_TEST_ONLY_REGULATION.homegrownMonths,
        homegrownAgeStart: DECLARED_TEST_ONLY_REGULATION.homegrownAgeStart,
        homegrownAgeEnd: DECLARED_TEST_ONLY_REGULATION.homegrownAgeEnd,
        u21Cutoff: new Date('2006-01-01T00:00:00.000Z'),
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
        { versionId: reg2Id, position: 1, criterionCode: 'POINTS' },
        { versionId: reg2Id, position: 2, criterionCode: 'GOAL_DIFFERENCE' },
        { versionId: reg2Id, position: 3, criterionCode: 'GOALS_FOR' },
      ],
    });
    await fixture.database.client.goalType.createMany({
      data: [
        {
          regulationVersionId: reg2Id,
          code: 'A',
          name: 'Bàn thường',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: reg2Id,
          code: 'B',
          name: 'Phạt đền',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: reg2Id,
          code: 'C',
          name: 'Phản lưới',
          isOwnGoal: true,
          enabled: true,
        },
        {
          regulationVersionId: reg2Id,
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
          regulationVersionId: reg2Id,
          code: 'Y',
          name: 'Thẻ vàng',
          meaning: 'YELLOW',
          enabled: true,
        },
        { regulationVersionId: reg2Id, code: 'R', name: 'Thẻ đỏ', meaning: 'RED', enabled: true },
      ],
    });
    await fixture.database.client.registrationWindow.createMany({
      data: [
        {
          regulationVersionId: reg2Id,
          intakeKind: 'CLUB_APPLICATION',
          opensAt: new Date('2026-08-01T00:00:00.000Z'),
          closesAt: new Date('2026-09-01T00:00:00.000Z'),
        },
        {
          regulationVersionId: reg2Id,
          intakeKind: 'PLAYER_CHANGE',
          opensAt: new Date('2026-08-01T00:00:00.000Z'),
          closesAt: new Date('2026-09-01T00:00:00.000Z'),
        },
      ],
    });
    await fixture.database.client.regulationVersion.update({
      where: { id: reg2Id },
      data: {
        state: 'APPROVED_WAITING',
        submittedAt: receivedAt,
        approvedAt: receivedAt,
        decidedAt: receivedAt,
        decidedBy: fixture.staff.seasonManagerB,
        decisionReason: 'Phê duyệt quy định R2 chờ hiệu lực.',
      },
    });

    // Advance clock past R2 dueAt
    fixture.clock.set(new Date('2026-08-12T01:00:00.000Z'));
    const activation = fixture.app.get(RegulationActivationService);
    const officerId = fixture.staff.registrationOfficerA;

    // Precheck MUST NOT activate R2 — throws REGULATION_BASIS_UNRESOLVED (503) and leaves R2 APPROVED_WAITING
    await expect(
      fixture.database.write(
        [
          { kind: 'season', key: seasonId, mode: 'shared' },
          { kind: 'club', key: club.id, mode: 'shared' },
          { kind: 'player', key: player.id, mode: 'shared' },
        ],
        (context) => requireSeasonRegistrationOfficer(context, officerId, seasonId),
        (context) =>
          precheckRegistrationEligibility(context, activation, {
            seasonId,
            clubId: club.id,
            playerId: player.id,
            versionId: regVersionRowId,
            shirtNumber: 18,
            playingStart: new Date('2026-08-20T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: false,
            homegrownEvidence: null,
          }),
        undefined,
        { kind: 'ACCOUNT', accountId: officerId },
      ),
    ).rejects.toMatchObject({
      status: 503,
      code: 'REGULATION_BASIS_UNRESOLVED',
    } satisfies Partial<ApplicationError>);

    const r2AfterPrecheck = await fixture.database.client.regulationVersion.findUniqueOrThrow({
      where: { id: reg2Id },
      select: { state: true },
    });
    expect(r2AfterPrecheck.state).toBe('APPROVED_WAITING');

    // In confirmation write transaction, due R2 activates; receipt timing stays R1 ON_TIME, eligibility uses R2!
    const confirmationAssessment = await fixture.database.write(
      [
        { kind: 'player', key: player.id, mode: 'exclusive' },
        { kind: 'club', key: club.id, mode: 'exclusive' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officerId, seasonId),
      async (context) => {
        const { regulation } = await resolveEffectiveRegulationWithInstant(
          context,
          seasonId,
          activation,
        );
        return evaluateRegistrationEligibilityForConfirmation(context, regulation, {
          seasonId,
          clubId: club.id,
          playerId: player.id,
          versionId: regVersionRowId,
          shirtNumber: 18,
          playingStart: new Date('2026-08-20T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: false,
          homegrownEvidence: null,
        });
      },
      async (db) => discoverSeasonWithDueRules(db, seasonId, activation),
      { kind: 'ACCOUNT', accountId: officerId },
    );

    expect(confirmationAssessment.regulationVersionId).toBe(reg2Id);
    expect(confirmationAssessment.receiptRegulationVersionId).toBe(reg1Id);
    expect(
      confirmationAssessment.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status,
    ).toBe('MET');
    expect(confirmationAssessment.u21Finding).toBe(false);
    expect(confirmationAssessment.eligibleForConfirmation).toBe(false);
    expect(
      confirmationAssessment.criteria.find((c) => c.criterion === 'HOMEGROWN_VERIFICATION')?.status,
    ).toBe('INSUFFICIENT_BASIS');
  });

  it('enforces LATE receipt with exact-version D053 exception, wrong-season version mismatch, D099 discontinued club, missing regulation and wrong-season officer denial (FR-011, FR-021, FR-025)', async () => {
    const season1 = fixture.seasons[0].id;
    const season2 = fixture.seasons[1].id;
    const { versionId: reg1Id } = await fixture.seedEffectiveRegulation(season1);
    const { club, stadium } = await fixture.seedClubAndStadium('EL04');
    await seedApprovedClubApplication(season1, club.id, stadium.id, reg1Id);
    const player = await fixture.seedPlayer('PL_EL04', 'Cầu thủ Ngoại lệ', '2001-03-03');
    const otherPlayer = await fixture.seedPlayer('PL_EL04_B', 'Cầu thủ Khác', '2001-04-04');

    const activation = fixture.app.get(RegulationActivationService);
    const officer1 = fixture.staff.registrationOfficerA;
    const officer2 = fixture.staff.registrationOfficerSeason2;
    const now = await fixture.clock.now();

    // 1) Wrong-season officer denied (FR-021 / SC-005)
    await expect(
      fixture.database.write(
        [
          { kind: 'season', key: season1, mode: 'shared' },
          { kind: 'club', key: club.id, mode: 'shared' },
          { kind: 'player', key: player.id, mode: 'shared' },
        ],
        (context) => requireSeasonRegistrationOfficer(context, officer2, season1),
        (context) =>
          precheckRegistrationEligibility(context, activation, {
            seasonId: season1,
            clubId: club.id,
            playerId: player.id,
            shirtNumber: 15,
            playingStart: new Date('2026-08-20T00:00:00.000Z'),
            playingEnd: null,
            nonHomegrownOptIn: true,
            homegrownEvidence: null,
          }),
        undefined,
        { kind: 'ACCOUNT', accountId: officer2 },
      ),
    ).rejects.toMatchObject({
      status: 403,
      code: 'ACCESS_DENIED',
    } satisfies Partial<ApplicationError>);

    // 2) Missing effective regulation on season2 blocks confirmation (FR-025)
    const noRegAssessment = await fixture.database.write(
      [
        { kind: 'season', key: season2, mode: 'shared' },
        { kind: 'club', key: club.id, mode: 'shared' },
        { kind: 'player', key: player.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officer2, season2),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId: season2,
          clubId: club.id,
          playerId: player.id,
          shirtNumber: 15,
          playingStart: new Date('2026-08-20T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: true,
          homegrownEvidence: null,
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officer2 },
    );
    expect(noRegAssessment.eligibleForConfirmation).toBe(false);
    expect(
      noRegAssessment.criteria.find((c) => c.criterion === 'EFFECTIVE_REGULATION')?.status,
    ).toBe('UNMET');

    // 3) LATE receipt without exception -> UNMET; with approved D053 exception on exact version -> MET
    const lateCaseId = randomUUID();
    const lateVersionId = randomUUID();
    await fixture.database.client.playerRegistration.create({
      data: { id: lateCaseId, seasonId: season1, clubId: club.id, playerId: player.id },
    });
    await fixture.database.client.registrationVersion.create({
      data: {
        id: lateVersionId,
        seasonId: season1,
        caseId: lateCaseId,
        versionNumber: 1,
        preparedBy: officer1,
        state: 'RECEIVED',
        receivedAt: now,
        shirtNumber: 15,
        playingStart: new Date('2026-08-20T00:00:00.000Z'),
        playingEnd: null,
        nonHomegrownOptIn: true,
        receiptRegulationVersionId: reg1Id,
        receiptTimingStatus: 'LATE',
      },
    });

    const lateBlocked = await fixture.database.write(
      [
        { kind: 'season', key: season1, mode: 'shared' },
        { kind: 'club', key: club.id, mode: 'shared' },
        { kind: 'player', key: player.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officer1, season1),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId: season1,
          clubId: club.id,
          playerId: player.id,
          versionId: lateVersionId,
          shirtNumber: 15,
          playingStart: new Date('2026-08-20T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: true,
          homegrownEvidence: null,
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officer1 },
    );
    expect(lateBlocked.eligibleForConfirmation).toBe(false);
    expect(lateBlocked.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status).toBe(
      'UNMET',
    );

    // Approve D053 receipt exception bound strictly to lateVersionId
    const exCaseId = randomUUID();
    const exVersionId = randomUUID();
    await fixture.database.client.receiptExceptionCase.create({
      data: { id: exCaseId, seasonId: season1, createdAt: now, updatedAt: now },
    });
    await fixture.database.client.receiptExceptionVersion.create({
      data: {
        id: exVersionId,
        seasonId: season1,
        caseId: exCaseId,
        versionNumber: 1,
        preparedBy: officer1,
        state: 'APPROVED',
        submittedAt: now,
        decidedAt: now,
        decidedBy: fixture.staff.seasonManagerA,
        registrationVersionId: lateVersionId,
        reason: 'Ngoại lệ D053 được duyệt.',
        basis: 'Văn bản BTC số 01.',
      },
    });
    await fixture.database.client.receiptExceptionCase.update({
      where: { id: exCaseId },
      data: { currentVersionId: exVersionId, approvedVersionId: exVersionId },
    });

    const lateApproved = await fixture.database.write(
      [
        { kind: 'season', key: season1, mode: 'shared' },
        { kind: 'club', key: club.id, mode: 'shared' },
        { kind: 'player', key: player.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officer1, season1),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId: season1,
          clubId: club.id,
          playerId: player.id,
          versionId: lateVersionId,
          shirtNumber: 15,
          playingStart: new Date('2026-08-20T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: true,
          homegrownEvidence: null,
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officer1 },
    );
    expect(lateApproved.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status).toBe('MET');
    expect(lateApproved.eligibleForConfirmation).toBe(true);

    // 3b) A late sibling version on the same case does NOT inherit the D053 waiver (version-specific!)
    const lateSiblingVersionId = randomUUID();
    await fixture.database.client.registrationVersion.create({
      data: {
        id: lateSiblingVersionId,
        seasonId: season1,
        caseId: lateCaseId,
        versionNumber: 2,
        predecessorVersionId: lateVersionId,
        preparedBy: officer1,
        state: 'RECEIVED',
        receivedAt: now,
        shirtNumber: 15,
        playingStart: new Date('2026-08-20T00:00:00.000Z'),
        playingEnd: null,
        nonHomegrownOptIn: true,
        receiptRegulationVersionId: reg1Id,
        receiptTimingStatus: 'LATE',
      },
    });
    const lateSiblingBlocked = await fixture.database.write(
      [
        { kind: 'season', key: season1, mode: 'shared' },
        { kind: 'club', key: club.id, mode: 'shared' },
        { kind: 'player', key: player.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officer1, season1),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId: season1,
          clubId: club.id,
          playerId: player.id,
          versionId: lateSiblingVersionId,
          shirtNumber: 15,
          playingStart: new Date('2026-08-20T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: true,
          homegrownEvidence: null,
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officer1 },
    );
    expect(lateSiblingBlocked.eligibleForConfirmation).toBe(false);
    expect(lateSiblingBlocked.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status).toBe(
      'UNMET',
    );

    // 4) Passing another player's versionId is rejected as ownership mismatch (never silently NOT_APPLICABLE)
    const mismatchAssessment = await fixture.database.write(
      [
        { kind: 'season', key: season1, mode: 'shared' },
        { kind: 'club', key: club.id, mode: 'shared' },
        { kind: 'player', key: otherPlayer.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officer1, season1),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId: season1,
          clubId: club.id,
          playerId: otherPlayer.id,
          versionId: lateVersionId,
          shirtNumber: 16,
          playingStart: new Date('2026-08-20T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: true,
          homegrownEvidence: null,
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officer1 },
    );
    expect(mismatchAssessment.eligibleForConfirmation).toBe(false);
    expect(mismatchAssessment.criteria.find((c) => c.criterion === 'RECEIPT_TIMING')?.status).toBe(
      'UNMET',
    );

    // 5) D099 discontinued club blocks confirmation
    await fixture.database.client.club.update({
      where: { id: club.id },
      data: { discontinuedAt: now, revision: { increment: 1n } },
    });
    const discontinuedAssessment = await fixture.database.write(
      [
        { kind: 'season', key: season1, mode: 'shared' },
        { kind: 'club', key: club.id, mode: 'shared' },
        { kind: 'player', key: player.id, mode: 'shared' },
      ],
      (context) => requireSeasonRegistrationOfficer(context, officer1, season1),
      (context) =>
        precheckRegistrationEligibility(context, activation, {
          seasonId: season1,
          clubId: club.id,
          playerId: player.id,
          versionId: lateVersionId,
          shirtNumber: 15,
          playingStart: new Date('2026-08-20T00:00:00.000Z'),
          playingEnd: null,
          nonHomegrownOptIn: true,
          homegrownEvidence: null,
        }),
      undefined,
      { kind: 'ACCOUNT', accountId: officer1 },
    );
    expect(discontinuedAssessment.eligibleForConfirmation).toBe(false);
    expect(
      discontinuedAssessment.criteria.find((c) => c.criterion === 'CLUB_PARTICIPATION')?.status,
    ).toBe('UNMET');
  });

  describe('UC10 HTTP receipt, validation, supplementation, cancellation and ordinary confirmation (T014)', () => {
    it('executes Draft -> Received -> Valid as an officer decision with D059 snapshot, audit and Idempotency-Key replay', async () => {
      const seasonId = fixture.seasons[0].id;
      const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId, {
        u21Cutoff: '2005-01-01',
        playerWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-12T00:00:00.000Z' },
      });
      const { club, stadium } = await fixture.seedClubAndStadium('UC10A');
      const player = await fixture.seedPlayer('PL_UC10_01', 'Trần Quốc Bảo', '2001-06-15', 'ENG');

      const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
      const manager = await fixture.authenticate(fixture.staff.seasonManagerA);
      const wrongOfficer = await fixture.authenticate(fixture.staff.registrationOfficerSeason2);

      // References endpoint exposes active regulation, clubs, players and officer capabilities
      const refs = await fixture
        .apiRequest(officer, 'get', `/seasons/${seasonId}/player-registrations/references`)
        .expect(200);
      expect(refs.body.data.effectiveRegulation.id).toBe(regVersionId);
      expect(refs.body.data.capabilities).toEqual({
        canManage: true,
        canDecideExceptions: false,
      });

      // Wrong-season officer is denied read (404) and write (403)
      await fixture
        .apiRequest(wrongOfficer, 'get', `/seasons/${seasonId}/player-registrations`)
        .expect(404);
      await fixture
        .apiRequest(wrongOfficer, 'post', `/seasons/${seasonId}/player-registrations`, {
          clubId: club.id,
          playerId: player.id,
        })
        .expect(403);

      // Create draft while club BM1 is still pending (FR-012)
      const created = await fixture
        .apiRequest(officer, 'post', `/seasons/${seasonId}/player-registrations`, {
          clubId: club.id,
          playerId: player.id,
          shirtNumber: 10,
          playingStart: '2026-08-15T00:00:00.000Z',
        })
        .expect(201);
      const caseId = created.body.data.caseId as string;
      const versionId = created.body.data.versionId as string;

      // Update draft with D054 homegrown evidence
      const patched = await fixture
        .apiRequest(officer, 'patch', `/player-registrations/${caseId}/draft`, {
          versionId,
          expectedRevision: '1',
          evidenceBranch: 'SEASONS',
          qualifyingValue: 3,
          evidenceSummary: '3 mùa giải đào tạo tại CLB thuộc FA Anh',
          evidenceReference: 'FA-HG-2026-01',
          affiliatedAssociationBasis: true,
          notes: 'Hồ sơ đăng ký cầu thủ nội địa.',
        })
        .expect(200);
      expect(patched.body.data.revision).toBe('2');

      // Receive on time inside [opensAt, closesAt)
      const received = await fixture
        .apiRequest(officer, 'post', `/player-registrations/${caseId}/receive`, {
          versionId,
          expectedRevision: '2',
        })
        .expect(200);
      expect(received.body.data).toMatchObject({
        state: 'RECEIVED',
        receiptTimingStatus: 'ON_TIME',
        receiptRegulationVersionId: regVersionId,
      });

      // Precheck while BM1 is pending -> read-only CLUB_PARTICIPATION UNMET
      const precheckPending = await fixture
        .apiRequest(officer, 'post', `/player-registrations/${caseId}/validate`, { versionId })
        .expect(200);
      expect(precheckPending.body.data.eligibleForConfirmation).toBe(false);
      expect(
        precheckPending.body.data.criteria.find(
          (c: { criterion: string }) => c.criterion === 'CLUB_PARTICIPATION',
        )?.status,
      ).toBe('UNMET');

      // Confirm-valid fails while BM1 is pending, leaving version RECEIVED
      await fixture
        .apiRequest(
          officer,
          'post',
          `/player-registrations/${caseId}/confirm-valid`,
          { versionId, expectedRevision: received.body.data.revision },
          randomUUID(),
        )
        .expect(409);

      // Season Manager cannot confirm-valid (initial confirmation is strictly Registration Officer decision)
      await seedApprovedClubApplication(seasonId, club.id, stadium.id, regVersionId);
      await fixture
        .apiRequest(
          manager,
          'post',
          `/player-registrations/${caseId}/confirm-valid`,
          { versionId, expectedRevision: received.body.data.revision },
          randomUUID(),
        )
        .expect(403);

      // Stale revision rejected
      await fixture
        .apiRequest(
          officer,
          'post',
          `/player-registrations/${caseId}/confirm-valid`,
          { versionId, expectedRevision: '1' },
          randomUUID(),
        )
        .expect(409);

      // Advance clock past intake close (Aug 12) while still before playingStart (Aug 15):
      // timely receipt remains valid for ordinary confirmation after intake closes.
      fixture.clock.set(new Date('2026-08-14T10:00:00.000Z'));
      const officerConfirm = await fixture.authenticate(fixture.staff.registrationOfficerA);
      const confirmKey = randomUUID();
      const confirmed = await fixture
        .apiRequest(
          officerConfirm,
          'post',
          `/player-registrations/${caseId}/confirm-valid`,
          { versionId, expectedRevision: received.body.data.revision },
          confirmKey,
        )
        .expect(200);
      expect(confirmed.body.data).toMatchObject({
        caseId,
        versionId,
        state: 'VALID',
      });

      // Exact-intent replay with same Idempotency-Key succeeds
      const replayed = await fixture
        .apiRequest(
          officerConfirm,
          'post',
          `/player-registrations/${caseId}/confirm-valid`,
          { versionId, expectedRevision: received.body.data.revision },
          confirmKey,
        )
        .expect(200);
      expect(replayed.body.data.versionId).toBe(versionId);

      // Same Idempotency-Key with different payload -> 409 IDEMPOTENCY_KEY_REUSED
      const conflictReplay = await fixture
        .apiRequest(
          officerConfirm,
          'post',
          `/player-registrations/${caseId}/confirm-valid`,
          {
            versionId,
            expectedRevision: received.body.data.revision,
            reason: 'Lý do khác gây xung đột intent',
          },
          confirmKey,
        )
        .expect(409);
      expect(conflictReplay.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');

      // Verify detail, D059 snapshot, playingEffectivityStatus and audit history
      const detail = await fixture
        .apiRequest(officerConfirm, 'get', `/player-registrations/${caseId}`)
        .expect(200);
      expect(detail.body.data.currentValidatedVersionId).toBe(versionId);
      expect(detail.body.data.playingEffectivityStatus).toBe('UPCOMING');
      expect(detail.body.data.versions[0].officialSnapshot).toMatchObject({
        club: { id: club.id },
        player: { id: player.id },
        registration: { shirtNumber: 10, u21Finding: false, homegrownFinding: true },
        basis: {
          receiptRegulationVersionId: regVersionId,
          decisionRegulationVersionId: regVersionId,
        },
      });

      const history = await fixture
        .apiRequest(officerConfirm, 'get', `/player-registrations/${caseId}/history`)
        .expect(200);
      const actions = history.body.data.items.map((i: { actionCode: string }) => i.actionCode);
      expect(actions).toContain('PLAYER_REGISTRATION_DRAFT_CREATED');
      expect(actions).toContain('PLAYER_REGISTRATION_RECEIVED');
      expect(actions).toContain('PLAYER_REGISTRATION_CONFIRMED');
    });

    it('supports supplementation, late re-receipt with D053 exception, pre-validity cancellation and Closed season gate', async () => {
      const seasonId = fixture.seasons[0].id;
      const { versionId: regVersionId } = await fixture.seedEffectiveRegulation(seasonId, {
        u21Cutoff: '2005-01-01',
        playerWindow: { opensAt: '2026-08-01T00:00:00.000Z', closesAt: '2026-08-12T00:00:00.000Z' },
      });
      const { club, stadium } = await fixture.seedClubAndStadium('UC10B');
      await seedApprovedClubApplication(seasonId, club.id, stadium.id, regVersionId);
      const player1 = await fixture.seedPlayer('PL_UC10_SUP', 'Phạm Gia Huy', '2006-02-02', 'ENG');
      const player2 = await fixture.seedPlayer('PL_UC10_CAN', 'Đỗ Minh Khôi', '2006-03-03', 'ENG');

      const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);

      // 1) Create, receive ON_TIME, return for supplementation, then supplement v2
      const created = await fixture
        .apiRequest(officer, 'post', `/seasons/${seasonId}/player-registrations`, {
          clubId: club.id,
          playerId: player1.id,
          shirtNumber: 22,
          playingStart: '2026-08-25T00:00:00.000Z',
        })
        .expect(201);
      const caseId = created.body.data.caseId as string;
      const v1Id = created.body.data.versionId as string;

      const r1 = await fixture
        .apiRequest(officer, 'post', `/player-registrations/${caseId}/receive`, {
          versionId: v1Id,
          expectedRevision: '1',
        })
        .expect(200);
      expect(r1.body.data.receiptTimingStatus).toBe('ON_TIME');

      const returned = await fixture
        .apiRequest(officer, 'post', `/player-registrations/${caseId}/return`, {
          versionId: v1Id,
          expectedRevision: r1.body.data.revision,
          reason: 'Cần cập nhật lại số áo theo yêu cầu câu lạc bộ.',
        })
        .expect(200);
      expect(returned.body.data.state).toBe('NEEDS_SUPPLEMENTATION');

      const v2 = await fixture
        .apiRequest(officer, 'post', `/player-registrations/${caseId}/supplement`, {
          versionId: v1Id,
          expectedRevision: returned.body.data.revision,
        })
        .expect(200);
      const v2Id = v2.body.data.versionId as string;
      expect(v2.body.data.versionNumber).toBe(2);
      expect(v2.body.data.state).toBe('DRAFT');

      // Advance clock AFTER closesAt -> v2 receipt is LATE
      fixture.clock.set(new Date('2026-08-15T10:00:00.000Z'));
      const officerLate = await fixture.authenticate(fixture.staff.registrationOfficerA);
      const managerLate = await fixture.authenticate(fixture.staff.seasonManagerA);

      const r2 = await fixture
        .apiRequest(officerLate, 'post', `/player-registrations/${caseId}/receive`, {
          versionId: v2Id,
          expectedRevision: '1',
        })
        .expect(200);
      expect(r2.body.data.receiptTimingStatus).toBe('LATE');

      // Confirm v2 without D053 exception -> blocked (409)
      await fixture
        .apiRequest(
          officerLate,
          'post',
          `/player-registrations/${caseId}/confirm-valid`,
          { versionId: v2Id, expectedRevision: r2.body.data.revision },
          randomUUID(),
        )
        .expect(409);

      // Propose and independently approve D053 exception for v2
      const exProposed = await fixture
        .apiRequest(officerLate, 'post', `/seasons/${seasonId}/receipt-exceptions`, {
          targetKind: 'PLAYER_REGISTRATION',
          targetVersionId: v2Id,
          reason: 'Bổ sung ngoài hạn theo công văn BTC.',
          basis: 'Công văn BTC số 10/2026.',
        })
        .expect(201);
      await fixture
        .apiRequest(
          managerLate,
          'post',
          `/receipt-exceptions/${exProposed.body.data.caseId}/approve`,
          {
            versionId: exProposed.body.data.versionId,
            expectedRevision: exProposed.body.data.revision,
            reason: 'Chấp thuận ngoại lệ tiếp nhận D053.',
          },
          randomUUID(),
        )
        .expect(200);

      // Now confirm v2 succeeds!
      const confirmedV2 = await fixture
        .apiRequest(
          officerLate,
          'post',
          `/player-registrations/${caseId}/confirm-valid`,
          { versionId: v2Id, expectedRevision: r2.body.data.revision },
          randomUUID(),
        )
        .expect(200);
      expect(confirmedV2.body.data.state).toBe('VALID');

      // 2) Pre-validity cancellation on a separate case
      const cancelDraft = await fixture
        .apiRequest(officerLate, 'post', `/seasons/${seasonId}/player-registrations`, {
          clubId: club.id,
          playerId: player2.id,
          shirtNumber: 23,
        })
        .expect(201);
      const cancelled = await fixture
        .apiRequest(
          officerLate,
          'post',
          `/player-registrations/${cancelDraft.body.data.caseId}/cancel`,
          {
            versionId: cancelDraft.body.data.versionId,
            expectedRevision: '1',
            reason: 'Câu lạc bộ rút yêu cầu đăng ký trước khi xác nhận.',
          },
        )
        .expect(200);
      expect(cancelled.body.data.state).toBe('CANCELLED');

      // 3) Closed season blocks writes while preserving authorized reads
      await fixture.database.client.season.update({
        where: { id: seasonId },
        data: { state: 'CLOSED', revision: { increment: 1n } },
      });
      await fixture
        .apiRequest(officerLate, 'post', `/seasons/${seasonId}/player-registrations`, {
          clubId: club.id,
          playerId: player2.id,
        })
        .expect(409);
      const listClosed = await fixture
        .apiRequest(officerLate, 'get', `/seasons/${seasonId}/player-registrations`)
        .expect(200);
      expect(listClosed.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('activates due R2 atomically on HTTP confirm-valid while preserving R1 receipt basis and enforces strict command allowlists', async () => {
      const seasonId = fixture.seasons[0].id;
      const { versionId: r1Id, caseId: regCaseId } = await fixture.seedEffectiveRegulation(
        seasonId,
        {
          u21Cutoff: '2006-01-01',
          playerWindow: {
            opensAt: '2026-08-01T00:00:00.000Z',
            closesAt: '2026-08-12T00:00:00.000Z',
          },
        },
      );
      const { club, stadium } = await fixture.seedClubAndStadium('UC10C');
      await seedApprovedClubApplication(seasonId, club.id, stadium.id, r1Id);
      // Player born 2005-06-01: NOT U21 under R1 (2006-01-01), IS U21 under R2 (2005-01-01)!
      const player = await fixture.seedPlayer('PL_UC10_R2', 'Lê Hoàng Minh', '2005-06-01', 'ENG');
      const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);

      // Missing playingStart on confirm-valid returns 409 STATE_CONFLICT (not 400)
      const noStartDraft = await fixture
        .apiRequest(officer, 'post', `/seasons/${seasonId}/player-registrations`, {
          clubId: club.id,
          playerId: player.id,
          shirtNumber: 31,
        })
        .expect(201);
      const noStartRecv = await fixture
        .apiRequest(
          officer,
          'post',
          `/player-registrations/${noStartDraft.body.data.caseId}/receive`,
          {
            versionId: noStartDraft.body.data.versionId,
            expectedRevision: '1',
          },
        )
        .expect(200);
      // Reject unexpected override field on non-validate action
      await fixture
        .apiRequest(
          officer,
          'post',
          `/player-registrations/${noStartDraft.body.data.caseId}/confirm-valid`,
          {
            versionId: noStartDraft.body.data.versionId,
            expectedRevision: noStartRecv.body.data.revision,
            shirtNumber: 99,
          },
          randomUUID(),
        )
        .expect(400);
      await fixture
        .apiRequest(
          officer,
          'post',
          `/player-registrations/${noStartDraft.body.data.caseId}/confirm-valid`,
          {
            versionId: noStartDraft.body.data.versionId,
            expectedRevision: noStartRecv.body.data.revision,
          },
          randomUUID(),
        )
        .expect(409);

      // Create timely registration under R1 with future playingStart and NO homegrown evidence
      const created = await fixture
        .apiRequest(officer, 'post', `/seasons/${seasonId}/player-registrations`, {
          clubId: club.id,
          playerId: player.id,
          shirtNumber: 32,
          playingStart: '2026-08-25T00:00:00.000Z',
        })
        .expect(201);
      const caseId = created.body.data.caseId as string;
      const versionId = created.body.data.versionId as string;

      const received = await fixture
        .apiRequest(officer, 'post', `/player-registrations/${caseId}/receive`, {
          versionId,
          expectedRevision: '1',
        })
        .expect(200);
      expect(received.body.data.receiptTimingStatus).toBe('ON_TIME');
      expect(received.body.data.receiptRegulationVersionId).toBe(r1Id);

      // Seed APPROVED_WAITING R2 (u21Cutoff = 2005-01-01) due at 2026-08-14T00:00:00Z
      const r2Id = randomUUID();
      const now = await fixture.clock.now();
      await fixture.database.client.regulationVersion.create({
        data: {
          id: r2Id,
          seasonId,
          caseId: regCaseId,
          versionNumber: 2,
          preparedBy: fixture.staff.seasonManagerA,
          predecessorVersionId: r1Id,
          state: 'DRAFT',
          effectiveMode: 'SCHEDULED',
          proposedEffectiveAt: new Date('2026-08-14T00:00:00.000Z'),
          squadLimit: DECLARED_TEST_ONLY_REGULATION.squadLimit,
          nonHomegrownLimit: DECLARED_TEST_ONLY_REGULATION.nonHomegrownLimit,
          homegrownSeasons: DECLARED_TEST_ONLY_REGULATION.homegrownSeasons,
          homegrownMonths: DECLARED_TEST_ONLY_REGULATION.homegrownMonths,
          homegrownAgeStart: DECLARED_TEST_ONLY_REGULATION.homegrownAgeStart,
          homegrownAgeEnd: DECLARED_TEST_ONLY_REGULATION.homegrownAgeEnd,
          u21Cutoff: new Date('2005-01-01T00:00:00.000Z'),
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
            name: 'Đá phạt',
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
          { regulationVersionId: r2Id, code: 'R', name: 'Thẻ đỏ', meaning: 'RED', enabled: true },
        ],
      });
      await fixture.database.client.registrationWindow.createMany({
        data: [
          {
            regulationVersionId: r2Id,
            intakeKind: 'CLUB_APPLICATION',
            opensAt: new Date('2026-08-01T00:00:00.000Z'),
            closesAt: new Date('2026-08-12T00:00:00.000Z'),
          },
          {
            regulationVersionId: r2Id,
            intakeKind: 'PLAYER_CHANGE',
            opensAt: new Date('2026-08-01T00:00:00.000Z'),
            closesAt: new Date('2026-08-12T00:00:00.000Z'),
          },
        ],
      });
      await fixture.database.client.regulationVersion.update({
        where: { id: r2Id },
        data: {
          state: 'APPROVED_WAITING',
          submittedAt: now,
          approvedAt: now,
          decidedAt: now,
          decidedBy: fixture.staff.seasonManagerB,
          decisionReason: 'Phê duyệt R2 nới mốc U21.',
        },
      });

      // Advance clock AFTER window close AND AFTER R2 dueAt
      fixture.clock.set(new Date('2026-08-15T10:00:00.000Z'));
      const officerAfterR2 = await fixture.authenticate(fixture.staff.registrationOfficerA);

      // HTTP precheck MUST NOT activate R2 -> 503
      await fixture
        .apiRequest(officerAfterR2, 'post', `/player-registrations/${caseId}/validate`, {
          versionId,
        })
        .expect(503);

      // HTTP confirm-valid atomically activates R2, confirms timely R1 version as VALID with u21Finding=true!
      const confirmed = await fixture
        .apiRequest(
          officerAfterR2,
          'post',
          `/player-registrations/${caseId}/confirm-valid`,
          { versionId, expectedRevision: received.body.data.revision },
          randomUUID(),
        )
        .expect(200);
      expect(confirmed.body.data.state).toBe('VALID');

      const detail = await fixture
        .apiRequest(officerAfterR2, 'get', `/player-registrations/${caseId}`)
        .expect(200);
      expect(detail.body.data.versions[0]).toMatchObject({
        state: 'VALID',
        u21Finding: true,
        receiptRegulationVersionId: r1Id,
        decisionRegulationVersionId: r2Id,
      });
    });
  });
});
