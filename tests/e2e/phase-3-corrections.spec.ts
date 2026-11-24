import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { DatabaseService } from '../../backend/src/platform/database.service';
import {
  browserAccount,
  browserAdministration,
} from '../../backend/tests/fixtures/browser-fixtures';
import { assertIsolatedTarget } from '../../backend/tests/fixtures/isolated-target.guard';
import { login } from './login';

async function pickOption(
  scope: Locator,
  page: Page,
  label: string,
  optionLabel: string,
  search?: string,
) {
  const control = scope.getByRole('combobox', { name: label, exact: true });
  await control.locator('..').click();
  await expect(control).toHaveAttribute('aria-expanded', 'true');
  if (search) await control.fill(search);
  const popup = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
  await popup.getByText(optionLabel, { exact: false }).first().click();
  await expect(control).toHaveAttribute('aria-expanded', 'false');
}

async function seedHistoricalRegulationR1AndR2(
  db: DatabaseService,
  params: {
    seasonId: string;
    managerId: string;
    r1ActiveFrom: Date;
    r2ActiveFrom: Date;
    r2DelayedProcessedAt: Date;
    r1SquadLimit: number;
    r2SquadLimit: number;
  },
) {
  let regCase = await db.client.regulationCase.findUnique({
    where: { seasonId: params.seasonId },
  });
  if (!regCase) {
    regCase = await db.client.regulationCase.create({ data: { seasonId: params.seasonId } });
  }

  // Clear any existing active flags on older seeded regulation versions
  await db.client.regulationVersion.updateMany({
    where: { seasonId: params.seasonId },
    data: { state: 'WITHDRAWN', activeFrom: null, activeUntil: null },
  });

  const latest = await db.client.regulationVersion.findFirst({
    where: { caseId: regCase.id },
    orderBy: { versionNumber: 'desc' },
    select: { id: true, versionNumber: true },
  });
  const r1Num = (latest?.versionNumber ?? 0) + 1;
  const r2Num = r1Num + 1;
  const r1Id = randomUUID();
  const r2Id = randomUUID();

  for (const spec of [
    {
      id: r1Id,
      versionNumber: r1Num,
      predecessorVersionId: latest?.id ?? null,
      squadLimit: params.r1SquadLimit,
      nonHomegrownLimit: params.r1SquadLimit,
      createdAt: params.r1ActiveFrom,
    },
    {
      id: r2Id,
      versionNumber: r2Num,
      predecessorVersionId: r1Id,
      squadLimit: params.r2SquadLimit,
      nonHomegrownLimit: params.r2SquadLimit,
      createdAt: params.r2ActiveFrom,
    },
  ]) {
    await db.client.regulationVersion.create({
      data: {
        id: spec.id,
        seasonId: params.seasonId,
        caseId: regCase.id,
        versionNumber: spec.versionNumber,
        preparedBy: params.managerId,
        predecessorVersionId: spec.predecessorVersionId,
        state: 'DRAFT',
        effectiveMode: 'IMMEDIATE',
        squadLimit: spec.squadLimit,
        nonHomegrownLimit: spec.nonHomegrownLimit,
        homegrownSeasons: 3,
        homegrownMonths: 36,
        homegrownAgeStart: 15,
        homegrownAgeEnd: 21,
        u21Cutoff: new Date('2005-01-01T00:00:00.000Z'),
        clubCount: 20,
        formatCode: 'DOUBLE_ROUND_ROBIN',
        legs: 2,
        plannedMinutes: 90,
        preparationMinutes: 30,
        releaseMinutes: 30,
        winPoints: 3,
        drawPoints: 1,
        lossPoints: 0,
        qualificationCount: 4,
        relegationCount: 3,
        createdAt: spec.createdAt,
      },
    });
    await db.client.rankingPriority.createMany({
      data: [
        { versionId: spec.id, position: 1, criterionCode: 'POINTS' },
        { versionId: spec.id, position: 2, criterionCode: 'GOAL_DIFFERENCE' },
        { versionId: spec.id, position: 3, criterionCode: 'GOALS_FOR' },
      ],
    });
    await db.client.goalType.createMany({
      data: [
        {
          regulationVersionId: spec.id,
          code: 'A',
          name: 'Bàn thường',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: spec.id,
          code: 'B',
          name: 'Phạt đền',
          isOwnGoal: false,
          enabled: true,
        },
      ],
    });
    await db.client.cardType.createMany({
      data: [
        {
          regulationVersionId: spec.id,
          code: 'Y',
          name: 'Thẻ vàng',
          meaning: 'YELLOW',
          enabled: true,
        },
        {
          regulationVersionId: spec.id,
          code: 'R',
          name: 'Thẻ đỏ',
          meaning: 'RED',
          enabled: true,
        },
      ],
    });
    // Closed windows in the past so we also verify BM1 and registration corrections work outside intake windows
    await db.client.registrationWindow.createMany({
      data: [
        {
          regulationVersionId: spec.id,
          intakeKind: 'CLUB_APPLICATION',
          opensAt: new Date(params.r1ActiveFrom.getTime() - 10 * 24 * 3600 * 1000),
          closesAt: new Date(params.r1ActiveFrom.getTime() - 5 * 24 * 3600 * 1000),
        },
        {
          regulationVersionId: spec.id,
          intakeKind: 'PLAYER_CHANGE',
          opensAt: new Date(params.r1ActiveFrom.getTime() - 10 * 24 * 3600 * 1000),
          closesAt: new Date(params.r1ActiveFrom.getTime() - 5 * 24 * 3600 * 1000),
        },
      ],
    });
  }

  await db.client.regulationVersion.update({
    where: { id: r1Id },
    data: {
      state: 'SUPERSEDED',
      submittedAt: params.r1ActiveFrom,
      approvedAt: params.r1ActiveFrom,
      decidedAt: params.r1ActiveFrom,
      decidedBy: params.managerId,
      decisionReason: 'Kích hoạt quy định giai đoạn 1.',
      activeFrom: params.r1ActiveFrom,
      activeUntil: params.r2ActiveFrom,
      activationProcessedAt: params.r1ActiveFrom,
    },
  });

  await db.client.regulationVersion.update({
    where: { id: r2Id },
    data: {
      state: 'EFFECTIVE',
      submittedAt: params.r2ActiveFrom,
      approvedAt: params.r2ActiveFrom,
      decidedAt: params.r2ActiveFrom,
      decidedBy: params.managerId,
      decisionReason: 'Kích hoạt quy định giai đoạn 2.',
      activeFrom: params.r2ActiveFrom,
      activeUntil: null,
      activationProcessedAt: params.r2DelayedProcessedAt,
    },
  });

  await db.client.season.update({
    where: { id: params.seasonId },
    data: { currentRegulationVersionId: r2Id, state: 'OPEN' },
  });

  return { r1Id, r1Num, r2Id, r2Num };
}

async function seedCorrectionsScenario() {
  const { accounts, seasons } = await browserAdministration();
  const officer = await browserAccount(false);
  const manager = await browserAccount(false);
  const dualEditorManager = await browserAccount(false);
  const season = seasons[0];

  const db = new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
  try {
    const now = await db.now();
    await db.client.seasonRoleAssignment.createMany({
      data: [
        {
          accountId: officer.id,
          seasonId: season.id,
          roleCode: 'REGISTRATION_OFFICER',
          grantedBy: accounts[0].id,
          grantedAt: now,
        },
        {
          accountId: manager.id,
          seasonId: season.id,
          roleCode: 'SEASON_MANAGER',
          grantedBy: accounts[0].id,
          grantedAt: now,
        },
        {
          accountId: dualEditorManager.id,
          seasonId: season.id,
          roleCode: 'REGISTRATION_OFFICER',
          grantedBy: accounts[0].id,
          grantedAt: now,
        },
        {
          accountId: dualEditorManager.id,
          seasonId: season.id,
          roleCode: 'SEASON_MANAGER',
          grantedBy: accounts[0].id,
          grantedAt: now,
        },
      ],
    });

    const r1ActiveFrom = new Date(now.getTime() - 20 * 24 * 3600 * 1000);
    const r2ActiveFrom = new Date(now.getTime() - 10 * 24 * 3600 * 1000);
    const r2DelayedProcessedAt = new Date(now.getTime() - 5 * 24 * 3600 * 1000);

    // R1 allows 2 counted players; R2 tightens squadLimit to 1 counted player
    const regs = await seedHistoricalRegulationR1AndR2(db, {
      seasonId: season.id,
      managerId: manager.id,
      r1ActiveFrom,
      r2ActiveFrom,
      r2DelayedProcessedAt,
      r1SquadLimit: 2,
      r2SquadLimit: 1,
    });

    const tag = randomUUID().slice(0, 5).toUpperCase();
    const stadiumOld = await db.client.stadium.create({
      data: {
        id: randomUUID(),
        code: `STDO${tag}`,
        name: `Sân Cũ ${tag}`,
        location: 'Manchester',
      },
    });
    const stadiumNew = await db.client.stadium.create({
      data: {
        id: randomUUID(),
        code: `STDN${tag}`,
        name: `Old Trafford ${tag}`,
        location: 'Manchester',
      },
    });
    const club = await db.client.club.create({
      data: {
        id: randomUUID(),
        code: `MUN${tag}`,
        name: `Manchester United ${tag}`,
        abbreviation: `M${tag.slice(0, 3)}`,
      },
    });

    // Approved Club Application v1
    const appCaseId = randomUUID();
    const appVer1Id = randomUUID();
    const receivedAt = new Date(r1ActiveFrom.getTime() + 24 * 3600 * 1000);
    await db.client.clubApplication.create({
      data: { id: appCaseId, seasonId: season.id, clubId: club.id },
    });
    await db.client.clubApplicationVersion.create({
      data: {
        id: appVer1Id,
        seasonId: season.id,
        caseId: appCaseId,
        versionNumber: 1,
        preparedBy: officer.id,
        state: 'APPROVED',
        receivedAt,
        submittedAt: receivedAt,
        decidedAt: receivedAt,
        decidedBy: manager.id,
        coachName: 'HLV Ghi Nhầm Ban Đầu',
        homeStadiumId: stadiumOld.id,
        representativeName: 'Đại Diện CLB',
        representativePhone: '0901112222',
        contactAddress: '100 Sir Matt Busby Way',
        receiptRegulationVersionId: regs.r1Id,
        receiptTimingStatus: 'ON_TIME',
        approvalRegulationVersionId: regs.r1Id,
      },
    });
    await db.client.clubApplication.update({
      where: { id: appCaseId },
      data: { currentAcceptedVersionId: appVer1Id },
    });

    // Senior teammate occupying 1 counted squad slot across [r1ActiveFrom + 1d, null)
    const teammate = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_TM_${tag}`,
        fullName: `Trần Đồng Đội ${tag}`,
        birthDate: new Date('1998-04-10T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'CM',
      },
    });
    const tmCaseId = randomUUID();
    const tmVerId = randomUUID();
    await db.client.playerRegistration.create({
      data: { id: tmCaseId, seasonId: season.id, clubId: club.id, playerId: teammate.id },
    });
    await db.client.registrationVersion.create({
      data: {
        id: tmVerId,
        seasonId: season.id,
        caseId: tmCaseId,
        versionNumber: 1,
        preparedBy: officer.id,
        state: 'VALID',
        shirtNumber: 8,
        playingStart: receivedAt,
        playingEnd: null,
        playingDisposition: 'ACTIVE',
        u21Finding: false,
        homegrownFinding: false,
        nonHomegrownOptIn: true,
        receivedAt,
        decidedAt: receivedAt,
        decidedBy: officer.id,
        receiptRegulationVersionId: regs.r1Id,
        receiptTimingStatus: 'ON_TIME',
        decisionRegulationVersionId: regs.r1Id,
      },
    });
    await db.client.playerRegistration.update({
      where: { id: tmCaseId },
      data: { currentValidatedVersionId: tmVerId },
    });

    // Target player: originally confirmed with snapshot birthDate 2006-01-10 (U21 = true),
    // while live Player record was corrected to 2004-01-10 (no longer U21 -> triggers pendingSourceCorrection banner and R1 MET / R2 UNMET!)
    const targetPlayer = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_CR_${tag}`,
        fullName: `Lê Minh Khôi ${tag}`,
        birthDate: new Date('2004-01-10T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'ST',
      },
    });
    const regCaseId = randomUUID();
    const regVer1Id = randomUUID();
    const playingStart = new Date(r1ActiveFrom.getTime() + 2 * 24 * 3600 * 1000);
    await db.client.playerRegistration.create({
      data: { id: regCaseId, seasonId: season.id, clubId: club.id, playerId: targetPlayer.id },
    });
    await db.client.registrationVersion.create({
      data: {
        id: regVer1Id,
        seasonId: season.id,
        caseId: regCaseId,
        versionNumber: 1,
        preparedBy: officer.id,
        state: 'VALID',
        shirtNumber: 21,
        playingStart,
        playingEnd: null,
        playingDisposition: 'ACTIVE',
        u21Finding: true,
        homegrownFinding: null,
        nonHomegrownOptIn: false,
        receivedAt,
        decidedAt: receivedAt,
        decidedBy: officer.id,
        receiptRegulationVersionId: regs.r1Id,
        receiptTimingStatus: 'ON_TIME',
        decisionRegulationVersionId: regs.r1Id,
        officialSnapshot: {
          capturedAt: receivedAt.toISOString(),
          player: {
            id: targetPlayer.id,
            fullName: targetPlayer.fullName,
            code: targetPlayer.code,
            birthDate: '2006-01-10',
          },
          club: {
            id: club.id,
            name: club.name,
            code: club.code,
          },
          registration: {
            caseId: regCaseId,
            versionId: regVer1Id,
            versionNumber: 1,
            shirtNumber: 21,
            playingStart: playingStart.toISOString(),
            playingEnd: null,
            u21Finding: true,
            homegrownFinding: null,
            nonHomegrownOptIn: false,
            playingDisposition: 'ACTIVE',
          },
          basis: {
            receiptRegulationVersionId: regs.r1Id,
            decisionRegulationVersionId: regs.r1Id,
            receiptTimingStatus: 'ON_TIME',
            squadLimit: 2,
            nonHomegrownLimit: 2,
          },
        },
      },
    });
    await db.client.playerRegistration.update({
      where: { id: regCaseId },
      data: { currentValidatedVersionId: regVer1Id },
    });

    return {
      officer,
      manager,
      dualEditorManager,
      season,
      club,
      stadiumOld,
      stadiumNew,
      targetPlayer,
      regs,
    };
  } finally {
    await db.close();
  }
}

test('T023: Official corrections for club applications and player registrations across historical rule segments with return, rejection, and independent approval', async ({
  page,
}) => {
  test.setTimeout(90000);
  await mkdir('.verification/t023', { recursive: true });
  await page.setViewportSize({ width: 1366, height: 768 });

  const scenario = await seedCorrectionsScenario();

  // =========================================================================
  // PART A: CLUB APPLICATION DESCRIPTIVE CORRECTION (OUTSIDE INTAKE WINDOW)
  // =========================================================================
  await login(page, scenario.officer);
  await page.goto(`/workspace/seasons/${scenario.season.id}/club-applications`);
  await expect(
    page.getByRole('heading', { name: 'Hồ sơ đăng ký tham dự câu lạc bộ' }),
  ).toBeVisible();

  await page.getByRole('button', { name: `Chi tiết hồ sơ ${scenario.club.name}` }).click();
  const clubDrawer = page.getByRole('dialog').filter({ hasText: scenario.club.name });
  await expect(clubDrawer).toBeVisible();

  const clubCorrPanel = clubDrawer.getByRole('region', {
    name: 'Đính chính thông tin hồ sơ tham dự',
  });
  await expect(clubCorrPanel).toBeVisible();
  await expect(clubCorrPanel.getByText('Nội dung chính thức: Phiên bản 1')).toBeVisible();

  // Verify no technical codes appear in the panel
  const initialClubPanelText = (await clubCorrPanel.textContent()) ?? '';
  expect(initialClubPanelText).not.toMatch(/\b(D057|D100|FR-020|BM1|UC14|UC19)\b/);

  // 1) Officer proposes descriptive correction v2
  await clubCorrPanel.getByRole('button', { name: 'Đề xuất đính chính hồ sơ' }).click();
  const clubProposeModal = page.getByRole('dialog', {
    name: 'Tạo đề xuất đính chính hồ sơ tham dự',
  });
  await expect(clubProposeModal).toBeVisible();
  await clubProposeModal.getByLabel('Huấn luyện viên trưởng *').fill('HLV Đính Chính Chính Xác');
  await pickOption(clubProposeModal, page, 'Sân nhà đăng ký *', scenario.stadiumNew.name);
  await clubProposeModal
    .getByLabel('Lý do đính chính *')
    .fill('Nhập sai tên huấn luyện viên trưởng và sân nhà so với bản giấy gốc.');
  await clubProposeModal
    .getByLabel('Căn cứ / tài liệu chứng minh *')
    .fill('Công văn số 42/CV-CLB kèm bản chụp hồ sơ gốc.');
  await clubProposeModal
    .getByLabel('Hồ sơ / lịch thi đấu liên quan cần rà soát (tùy chọn)')
    .fill('Lịch thi đấu các trận sân nhà lượt đi');
  await clubProposeModal.getByRole('button', { name: 'Trình phê duyệt' }).click();
  await expect(clubProposeModal).toBeHidden();

  // Verify 3-column comparison table and retained official pointer
  await expect(clubCorrPanel.getByText('Phiên bản 2 · Chờ phê duyệt')).toBeVisible();
  await expect(clubCorrPanel.getByText('Có cập nhật sân nhà')).toBeVisible();
  const clubDiffTable = clubCorrPanel.getByRole('table', {
    name: 'Đối chiếu thông tin hồ sơ tham dự',
  });
  await expect(clubDiffTable).toBeVisible();
  await expect(clubDiffTable.getByText('HLV Ghi Nhầm Ban Đầu')).toBeVisible();
  await expect(clubDiffTable.getByText('HLV Đính Chính Chính Xác')).toBeVisible();
  await expect(clubDiffTable.getByText(scenario.stadiumNew.name)).toBeVisible();
  await expect(
    clubCorrPanel.getByText('Phiên bản 1 vẫn là hồ sơ chính thức hiện hành.'),
  ).toBeVisible();

  await clubCorrPanel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.verification/t023/01-club-correction-pending-1366.png' });
  await clubDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // =========================================================================
  // PART B: PLAYER REGISTRATION HISTORICAL CORRECTION (R1 MET / R2 UNMET)
  // =========================================================================
  await page.goto(`/workspace/seasons/${scenario.season.id}/player-registrations`);
  await expect(page.getByRole('heading', { name: 'Đăng ký cầu thủ theo mùa' })).toBeVisible();

  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.targetPlayer.fullName}` })
    .click();
  const regDrawer = page.getByRole('dialog').filter({ hasText: scenario.targetPlayer.fullName });
  await expect(regDrawer).toBeVisible();

  const regCorrPanel = regDrawer.getByRole('region', {
    name: 'Đính chính hồ sơ đăng ký',
  });
  await expect(regCorrPanel).toBeVisible();
  await expect(
    regCorrPanel.getByText(/Hồ sơ cầu thủ vừa cập nhật ngày sinh \(10\/01\/2004\)/),
  ).toBeVisible();

  // 1) Officer proposes Attempt 1 with "Thu hồi hiệu lực do quyết định sai sót" across R1 and R2
  await regCorrPanel.getByRole('button', { name: 'Đề xuất đính chính đăng ký' }).click();
  const regProposeModal = page.getByRole('dialog', {
    name: 'Tạo đề xuất đính chính đăng ký cầu thủ',
  });
  await expect(regProposeModal).toBeVisible();
  await pickOption(
    regProposeModal,
    page,
    'Phương án xử lý hiệu lực *',
    'Thu hồi hiệu lực do quyết định sai sót',
  );
  await regProposeModal
    .getByLabel('Xử lý theo diện ngoài đào tạo nội địa (nếu không thuộc diện U21)')
    .check();
  await regProposeModal
    .getByLabel('Lý do đính chính *')
    .fill('Cập nhật lại diện cầu thủ trẻ và hạn mức đội hình theo ngày sinh đã hiệu chỉnh.');
  await regProposeModal
    .getByLabel('Căn cứ / tài liệu chứng minh *')
    .fill('Quyết định hiệu chỉnh ngày sinh và bản sao giấy khai sinh gốc.');
  await regProposeModal
    .getByLabel('Trận đấu liên quan cần rà soát riêng (tùy chọn)')
    .fill('Vòng 4 (05/09/2026)');
  await expect(page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toBeHidden();
  await page.screenshot({ path: '.verification/t023/02-reg-propose-modal-1366.png' });
  await regProposeModal.getByRole('button', { name: 'Trình phê duyệt' }).click();
  await expect(regProposeModal).toBeHidden();

  // Verify 3-column diff table and 2 historical segments (R1: Đạt, R2: Chưa đạt)
  await expect(regCorrPanel.getByText('Đề xuất lần 1 · Chờ phê duyệt')).toBeVisible();
  const regDiffTable = regCorrPanel.getByRole('table', {
    name: 'Đối chiếu nội dung đính chính',
  });
  await expect(regDiffTable).toBeVisible();
  await expect(regDiffTable.getByText('10/01/2006')).toBeVisible();
  await expect(regDiffTable.getByText('10/01/2004')).toBeVisible();
  await expect(regDiffTable.getByText('Cầu thủ trẻ U21')).toBeVisible();
  await expect(regDiffTable.getByText('Ngoài đào tạo nội địa')).toBeVisible();
  await expect(
    regCorrPanel.getByText('Kết quả kiểm tra theo giai đoạn quy định (2 giai đoạn)'),
  ).toBeVisible();
  await expect(
    regCorrPanel.getByText(`Quy định phiên bản ${scenario.regs.r1Num}`, { exact: false }),
  ).toBeVisible();
  await expect(
    regCorrPanel.getByText(`Quy định phiên bản ${scenario.regs.r2Num}`, { exact: false }),
  ).toBeVisible();
  await expect(regCorrPanel.getByText('Đạt', { exact: true })).toBeVisible();
  await expect(regCorrPanel.getByText('Chưa đạt', { exact: true })).toBeVisible();

  // Verify zero technical codes appear on the live panel
  const liveRegPanelText = (await regCorrPanel.textContent()) ?? '';
  expect(liveRegPanelText).not.toMatch(/\b(D057|D100|FR-020|BM1|UC14|UC19|R1|R2)\b/);

  await regCorrPanel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.verification/t023/03-reg-correction-segments-1366.png' });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.screenshot({ path: '.verification/t023/04-reg-correction-segments-1600.png' });
  await page.setViewportSize({ width: 1366, height: 768 });
  await regDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // =========================================================================
  // PART C: INDEPENDENT SEASON MANAGER RETURNS ATTEMPT 1, REJECTS ATTEMPT 2, APPROVES ATTEMPT 3 & CLUB CORRECTION
  // =========================================================================
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, scenario.manager);

  // 1) Manager approves Club Application correction v2
  await page.goto(`/workspace/seasons/${scenario.season.id}/club-applications`);
  await page.getByRole('button', { name: `Chi tiết hồ sơ ${scenario.club.name}` }).click();
  const mgrClubDrawer = page.getByRole('dialog').filter({ hasText: scenario.club.name });
  const mgrClubCorr = mgrClubDrawer.getByRole('region', {
    name: 'Đính chính thông tin hồ sơ tham dự',
  });
  await mgrClubCorr.getByRole('button', { name: 'Phê duyệt' }).click();
  const clubApproveModal = page.getByRole('dialog', {
    name: 'Phê duyệt đề xuất đính chính hồ sơ tham dự',
  });
  await clubApproveModal
    .getByLabel('Ý kiến quyết định *')
    .fill('Xác nhận sai sót ghi chép ban đầu và phê duyệt đính chính thông tin hồ sơ tham dự.');
  await clubApproveModal.getByRole('button', { name: 'Phê duyệt' }).click();
  await expect(clubApproveModal).toBeHidden();
  await expect(mgrClubCorr.getByText('Phiên bản 2 · Đã phê duyệt')).toBeVisible();
  await expect(
    mgrClubCorr.getByText('Phiên bản 2 đang là hồ sơ chính thức hiện hành.'),
  ).toBeVisible();
  await mgrClubDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 2) Manager returns Player Registration correction Attempt 1 for supplementation
  await page.goto(`/workspace/seasons/${scenario.season.id}/player-registrations`);
  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.targetPlayer.fullName}` })
    .click();
  const mgrRegDrawer = page.getByRole('dialog').filter({ hasText: scenario.targetPlayer.fullName });
  const mgrRegCorr = mgrRegDrawer.getByRole('region', {
    name: 'Đính chính hồ sơ đăng ký',
  });
  await mgrRegCorr.getByRole('button', { name: 'Trả lại bổ sung' }).click();
  const regReturnModal = page.getByRole('dialog', {
    name: 'Trả lại đề xuất đính chính để bổ sung',
  });
  await regReturnModal
    .getByLabel('Ý kiến quyết định *')
    .fill('Đề nghị bổ sung số hiệu biên bản đối chiếu giấy khai sinh gốc.');
  await regReturnModal.getByRole('button', { name: 'Trả lại bổ sung' }).click();
  await expect(regReturnModal).toBeHidden();

  await expect(mgrRegCorr.getByText('Đề xuất lần 1 · Cần bổ sung')).toBeVisible();
  await expect(mgrRegCorr.getByText(/Đã trả lại để bổ sung:/)).toBeVisible();
  await expect(
    mgrRegCorr.getByText('Phiên bản 1 vẫn là hồ sơ chính thức hiện hành.'),
  ).toBeVisible();
  await mgrRegDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 3) Dual-role user creates Attempt 2, submits, and verifies self-approval restriction
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, scenario.dualEditorManager);
  await page.goto(`/workspace/seasons/${scenario.season.id}/player-registrations`);
  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.targetPlayer.fullName}` })
    .click();
  const dualDrawer = page.getByRole('dialog').filter({ hasText: scenario.targetPlayer.fullName });
  const dualCorr = dualDrawer.getByRole('region', {
    name: 'Đính chính hồ sơ đăng ký',
  });
  await dualCorr.getByRole('button', { name: 'Tạo phiên bản bổ sung mới' }).click();
  const attempt2Modal = page.getByRole('dialog', {
    name: 'Tạo đề xuất đính chính đăng ký cầu thủ',
  });
  await pickOption(
    attempt2Modal,
    page,
    'Phương án xử lý hiệu lực *',
    'Thu hồi hiệu lực do quyết định sai sót',
  );
  await attempt2Modal
    .getByLabel('Xử lý theo diện ngoài đào tạo nội địa (nếu không thuộc diện U21)')
    .check();
  await attempt2Modal
    .getByLabel('Lý do đính chính *')
    .fill('Trình bổ sung lần 2 để kiểm tra phân quyền độc lập.');
  await attempt2Modal
    .getByLabel('Căn cứ / tài liệu chứng minh *')
    .fill('Bản chụp chưa công chứng.');
  await attempt2Modal.getByRole('button', { name: 'Trình phê duyệt' }).click();
  await expect(attempt2Modal).toBeHidden();

  await expect(dualCorr.getByText('Đề xuất lần 2 · Chờ phê duyệt')).toBeVisible();
  await expect(
    dualCorr.getByText('Người từng soạn thảo hoặc chỉnh sửa đề xuất này không thể tự phê duyệt.'),
  ).toBeVisible();
  await expect(dualCorr.getByRole('button', { name: 'Phê duyệt' })).toHaveCount(0);
  await dualDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 4) Independent Manager rejects Attempt 2 -> pointer stays Phiên bản 1
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, scenario.manager);
  await page.goto(`/workspace/seasons/${scenario.season.id}/player-registrations`);
  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.targetPlayer.fullName}` })
    .click();
  const mgrRejectDrawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.targetPlayer.fullName });
  const mgrRejectCorr = mgrRejectDrawer.getByRole('region', {
    name: 'Đính chính hồ sơ đăng ký',
  });
  await mgrRejectCorr.getByRole('button', { name: 'Từ chối' }).click();
  const rejectModal = page.getByRole('dialog', {
    name: 'Từ chối đề xuất đính chính đăng ký cầu thủ',
  });
  await rejectModal
    .getByLabel('Ý kiến quyết định *')
    .fill('Tài liệu chưa công chứng hợp lệ nên từ chối đề xuất lần 2.');
  await rejectModal.getByRole('button', { name: 'Từ chối' }).click();
  await expect(rejectModal).toBeHidden();

  await expect(mgrRejectCorr.getByText('Đề xuất lần 2 · Bị từ chối')).toBeVisible();
  await expect(mgrRejectCorr.getByText(/Đã từ chối đề xuất:/)).toBeVisible();
  await expect(
    mgrRejectCorr.getByText('Phiên bản 1 vẫn là hồ sơ chính thức hiện hành.'),
  ).toBeVisible();
  await mgrRejectDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 5) Officer creates Attempt 3 and Independent Manager approves -> official version advances
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, scenario.officer);
  await page.goto(`/workspace/seasons/${scenario.season.id}/player-registrations`);
  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.targetPlayer.fullName}` })
    .click();
  const offDrawer3 = page.getByRole('dialog').filter({ hasText: scenario.targetPlayer.fullName });
  const offCorr3 = offDrawer3.getByRole('region', {
    name: 'Đính chính hồ sơ đăng ký',
  });
  await offCorr3.getByRole('button', { name: 'Tạo phiên bản bổ sung mới' }).click();
  const attempt3Modal = page.getByRole('dialog', {
    name: 'Tạo đề xuất đính chính đăng ký cầu thủ',
  });
  await pickOption(
    attempt3Modal,
    page,
    'Phương án xử lý hiệu lực *',
    'Thu hồi hiệu lực do quyết định sai sót',
  );
  await attempt3Modal
    .getByLabel('Xử lý theo diện ngoài đào tạo nội địa (nếu không thuộc diện U21)')
    .check();
  await attempt3Modal
    .getByLabel('Lý do đính chính *')
    .fill('Đính chính phân loại cầu thủ và xử lý hiệu lực khi giai đoạn 2 vượt hạn mức.');
  await attempt3Modal
    .getByLabel('Căn cứ / tài liệu chứng minh *')
    .fill('Quyết định hiệu chỉnh số 19/QĐ và bản sao giấy khai sinh công chứng.');
  await attempt3Modal
    .getByLabel('Trận đấu liên quan cần rà soát riêng (tùy chọn)')
    .fill('Vòng 4 (05/09/2026)');
  await attempt3Modal.getByRole('button', { name: 'Trình phê duyệt' }).click();
  await expect(attempt3Modal).toBeHidden();
  await offDrawer3.getByRole('button', { name: 'Đóng' }).last().click();

  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, scenario.manager);
  await page.goto(`/workspace/seasons/${scenario.season.id}/player-registrations`);
  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.targetPlayer.fullName}` })
    .click();
  const mgrApproveDrawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.targetPlayer.fullName });
  const mgrApproveCorr = mgrApproveDrawer.getByRole('region', {
    name: 'Đính chính hồ sơ đăng ký',
  });
  await mgrApproveCorr.getByRole('button', { name: 'Phê duyệt' }).click();
  const regApproveModal = page.getByRole('dialog', {
    name: 'Phê duyệt đề xuất đính chính đăng ký cầu thủ',
  });
  await expect(regApproveModal).toBeVisible();
  await regApproveModal
    .getByLabel('Ý kiến quyết định *')
    .fill(
      'Phê duyệt đính chính và ghi nhận phương án thu hồi hiệu lực do vượt hạn mức từ giai đoạn 2.',
    );
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.verification/t023/05-reg-approve-modal-1366.png' });
  await regApproveModal.getByRole('button', { name: 'Phê duyệt' }).click();
  await expect(regApproveModal).toBeHidden();

  await expect(mgrApproveCorr.getByText('Đề xuất lần 3 · Đã phê duyệt')).toBeVisible();
  await expect(mgrApproveCorr.getByText(/Đã phê duyệt đính chính:/)).toBeVisible();
  await expect(mgrApproveCorr.getByText('Lịch sử các lần đính chính (3 bản ghi)')).toBeVisible();
  await mgrApproveCorr.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.verification/t023/06-reg-correction-approved-1366.png' });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.screenshot({ path: '.verification/t023/07-reg-correction-approved-1600.png' });
  await mgrApproveDrawer.getByRole('button', { name: 'Đóng' }).last().click();
});
