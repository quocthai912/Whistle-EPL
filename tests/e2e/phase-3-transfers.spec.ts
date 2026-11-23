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

function formatHcmDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

function formatDisplayInstant(date: Date): string {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

async function fillDateTime(scope: Locator, page: Page, label: string, text: string) {
  const input = scope.getByRole('textbox', { name: label });
  await input.click();
  const dropdown = page.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)');
  await expect(dropdown).toBeVisible();
  await input.fill(text);
  await input.press('Enter');
  await expect(dropdown).toBeHidden();
}

async function seedEffectiveRegulationVersion(
  db: DatabaseService,
  params: {
    seasonId: string;
    managerId: string;
    opensAt: Date;
    closesAt: Date;
    now: Date;
  },
) {
  let regCase = await db.client.regulationCase.findUnique({
    where: { seasonId: params.seasonId },
  });
  if (!regCase) {
    regCase = await db.client.regulationCase.create({ data: { seasonId: params.seasonId } });
  }
  const latest = await db.client.regulationVersion.findFirst({
    where: { caseId: regCase.id },
    orderBy: { versionNumber: 'desc' },
    select: { id: true, versionNumber: true },
  });
  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  const regVersionId = randomUUID();

  await db.client.regulationVersion.create({
    data: {
      id: regVersionId,
      seasonId: params.seasonId,
      caseId: regCase.id,
      versionNumber,
      preparedBy: params.managerId,
      predecessorVersionId: latest?.id ?? null,
      state: 'DRAFT',
      effectiveMode: 'IMMEDIATE',
      squadLimit: 25,
      nonHomegrownLimit: 17,
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
    },
  });
  await db.client.rankingPriority.createMany({
    data: [
      { versionId: regVersionId, position: 1, criterionCode: 'POINTS' },
      { versionId: regVersionId, position: 2, criterionCode: 'GOAL_DIFFERENCE' },
      { versionId: regVersionId, position: 3, criterionCode: 'GOALS_FOR' },
    ],
  });
  await db.client.goalType.createMany({
    data: [
      {
        regulationVersionId: regVersionId,
        code: 'A',
        name: 'Bàn thường',
        isOwnGoal: false,
        enabled: true,
      },
      {
        regulationVersionId: regVersionId,
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
        regulationVersionId: regVersionId,
        code: 'Y',
        name: 'Thẻ vàng',
        meaning: 'YELLOW',
        enabled: true,
      },
      {
        regulationVersionId: regVersionId,
        code: 'R',
        name: 'Thẻ đỏ',
        meaning: 'RED',
        enabled: true,
      },
    ],
  });
  await db.client.registrationWindow.createMany({
    data: [
      {
        regulationVersionId: regVersionId,
        intakeKind: 'CLUB_APPLICATION',
        opensAt: params.opensAt,
        closesAt: params.closesAt,
      },
      {
        regulationVersionId: regVersionId,
        intakeKind: 'PLAYER_CHANGE',
        opensAt: params.opensAt,
        closesAt: params.closesAt,
      },
    ],
  });

  await db.client.regulationVersion.updateMany({
    where: { seasonId: params.seasonId, state: 'EFFECTIVE' },
    data: { state: 'SUPERSEDED', activeUntil: params.now },
  });
  await db.client.regulationVersion.update({
    where: { id: regVersionId },
    data: {
      state: 'EFFECTIVE',
      submittedAt: params.now,
      approvedAt: params.now,
      decidedAt: params.now,
      decidedBy: params.managerId,
      decisionReason: `Phê duyệt quy định phiên bản ${versionNumber} cho kiểm thử chuyển câu lạc bộ.`,
      activeFrom: params.now,
      activationProcessedAt: params.now,
    },
  });
  await db.client.season.update({
    where: { id: params.seasonId },
    data: { currentRegulationVersionId: regVersionId, state: 'OPEN' },
  });

  return { id: regVersionId, versionNumber };
}

async function seedApprovedClubApplication(
  db: DatabaseService,
  params: {
    seasonId: string;
    clubId: string;
    stadiumId: string;
    officerId: string;
    managerId: string;
    regVersionId: string;
    now: Date;
  },
) {
  const appCaseId = randomUUID();
  const appVerId = randomUUID();
  await db.client.clubApplication.create({
    data: { id: appCaseId, seasonId: params.seasonId, clubId: params.clubId },
  });
  await db.client.clubApplicationVersion.create({
    data: {
      id: appVerId,
      seasonId: params.seasonId,
      caseId: appCaseId,
      versionNumber: 1,
      preparedBy: params.officerId,
      state: 'APPROVED',
      receivedAt: params.now,
      submittedAt: params.now,
      decidedAt: params.now,
      decidedBy: params.managerId,
      coachName: 'HLV Trưởng',
      homeStadiumId: params.stadiumId,
      representativeName: 'Đại diện câu lạc bộ',
      representativePhone: '0901234567',
      contactAddress: 'Đường Sân Vận Động',
      receiptRegulationVersionId: params.regVersionId,
      receiptTimingStatus: 'ON_TIME',
      approvalRegulationVersionId: params.regVersionId,
    },
  });
  await db.client.clubApplication.update({
    where: { id: appCaseId },
    data: { currentAcceptedVersionId: appVerId },
  });
}

async function seedValidatedRegistration(
  db: DatabaseService,
  params: {
    seasonId: string;
    clubId: string;
    playerId: string;
    shirtNumber: number;
    playingStart: Date;
    playingEnd: Date | null;
    officerId: string;
    regVersionId: string;
    now: Date;
  },
) {
  const caseId = randomUUID();
  const versionId = randomUUID();
  await db.client.playerRegistration.create({
    data: {
      id: caseId,
      seasonId: params.seasonId,
      clubId: params.clubId,
      playerId: params.playerId,
    },
  });
  await db.client.registrationVersion.create({
    data: {
      id: versionId,
      seasonId: params.seasonId,
      caseId,
      versionNumber: 1,
      preparedBy: params.officerId,
      state: 'VALID',
      shirtNumber: params.shirtNumber,
      playingStart: params.playingStart,
      playingEnd: params.playingEnd,
      playingDisposition: 'ACTIVE',
      nonHomegrownOptIn: false,
      u21Finding: true,
      homegrownFinding: false,
      receivedAt: params.now,
      decidedAt: params.now,
      decidedBy: params.officerId,
      receiptRegulationVersionId: params.regVersionId,
      receiptTimingStatus: 'ON_TIME',
      decisionRegulationVersionId: params.regVersionId,
    },
  });
  await db.client.playerRegistration.update({
    where: { id: caseId },
    data: { currentValidatedVersionId: versionId },
  });
  return { caseId, versionId };
}

async function seedTransferScenario() {
  const { accounts, seasons } = await browserAdministration();
  const officerS1 = await browserAccount(false);
  const managerS1 = await browserAccount(false);
  const dualOfficer = await browserAccount(false);
  const season1 = seasons[0];
  const season2 = seasons[1];

  const db = new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
  try {
    const now = await db.now();
    await db.client.seasonRoleAssignment.createMany({
      data: [
        {
          accountId: officerS1.id,
          seasonId: season1.id,
          roleCode: 'REGISTRATION_OFFICER',
          grantedBy: accounts[0].id,
          grantedAt: now,
        },
        {
          accountId: managerS1.id,
          seasonId: season1.id,
          roleCode: 'SEASON_MANAGER',
          grantedBy: accounts[0].id,
          grantedAt: now,
        },
        {
          accountId: dualOfficer.id,
          seasonId: season1.id,
          roleCode: 'REGISTRATION_OFFICER',
          grantedBy: accounts[0].id,
          grantedAt: now,
        },
        {
          accountId: dualOfficer.id,
          seasonId: season2.id,
          roleCode: 'REGISTRATION_OFFICER',
          grantedBy: accounts[0].id,
          grantedAt: now,
        },
      ],
    });

    const opensAt = new Date(now.getTime() - 24 * 3600 * 1000);
    const closesAt = new Date(now.getTime() + 72 * 3600 * 1000);
    const reg1 = await seedEffectiveRegulationVersion(db, {
      seasonId: season1.id,
      managerId: managerS1.id,
      opensAt,
      closesAt,
      now,
    });
    const reg2 = await seedEffectiveRegulationVersion(db, {
      seasonId: season2.id,
      managerId: managerS1.id,
      opensAt,
      closesAt,
      now,
    });

    const tag = randomUUID().slice(0, 5).toUpperCase();
    const stadium = await db.client.stadium.create({
      data: {
        id: randomUUID(),
        code: `STD${tag}`,
        name: `Sân Vận Động ${tag}`,
        location: 'London',
      },
    });
    const clubSource = await db.client.club.create({
      data: {
        id: randomUUID(),
        code: `LIV${tag}`,
        name: `Liverpool ${tag}`,
        abbreviation: `L${tag.slice(0, 3)}`,
      },
    });
    const clubDest = await db.client.club.create({
      data: {
        id: randomUUID(),
        code: `CHE${tag}`,
        name: `Chelsea ${tag}`,
        abbreviation: `C${tag.slice(0, 3)}`,
      },
    });
    const clubSeason2 = await db.client.club.create({
      data: {
        id: randomUUID(),
        code: `MCI${tag}`,
        name: `Manchester City ${tag}`,
        abbreviation: `M${tag.slice(0, 3)}`,
      },
    });

    await seedApprovedClubApplication(db, {
      seasonId: season1.id,
      clubId: clubSource.id,
      stadiumId: stadium.id,
      officerId: officerS1.id,
      managerId: managerS1.id,
      regVersionId: reg1.id,
      now,
    });
    await seedApprovedClubApplication(db, {
      seasonId: season1.id,
      clubId: clubDest.id,
      stadiumId: stadium.id,
      officerId: officerS1.id,
      managerId: managerS1.id,
      regVersionId: reg1.id,
      now,
    });
    await seedApprovedClubApplication(db, {
      seasonId: season2.id,
      clubId: clubSeason2.id,
      stadiumId: stadium.id,
      officerId: dualOfficer.id,
      managerId: managerS1.id,
      regVersionId: reg2.id,
      now,
    });

    const activeStart = new Date(now.getTime() - 2 * 3600 * 1000);
    const futureT = new Date(now.getTime() + 18 * 3600 * 1000);

    // Player 1: Active open-ended at clubSource for live UI transfer -> plan-change -> plan-cancel -> terminate
    const playerLifecycle = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_TR_${tag}`,
        fullName: `Phạm Minh Đức ${tag}`,
        birthDate: new Date('2006-05-10T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'RW',
      },
    });
    await seedValidatedRegistration(db, {
      seasonId: season1.id,
      clubId: clubSource.id,
      playerId: playerLifecycle.id,
      shirtNumber: 9,
      playingStart: activeStart,
      playingEnd: null,
      officerId: officerS1.id,
      regVersionId: reg1.id,
      now,
    });

    // Player 2 + Player 3: Paired future transfer where restoring clubSource collides on shirt #7 with Player 3
    const playerConflict = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_CF_${tag}`,
        fullName: `Lê Hoàng Nam ${tag}`,
        birthDate: new Date('2006-03-20T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'CM',
      },
    });
    const playerBlocker = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_BK_${tag}`,
        fullName: `Đỗ Tuấn Kiệt ${tag}`,
        birthDate: new Date('2006-07-12T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'CM',
      },
    });

    const conflictOld = await seedValidatedRegistration(db, {
      seasonId: season1.id,
      clubId: clubSource.id,
      playerId: playerConflict.id,
      shirtNumber: 7,
      playingStart: activeStart,
      playingEnd: null,
      officerId: officerS1.id,
      regVersionId: reg1.id,
      now,
    });
    const conflictOldAfterId = randomUUID();
    await db.client.registrationVersion.create({
      data: {
        id: conflictOldAfterId,
        seasonId: season1.id,
        caseId: conflictOld.caseId,
        versionNumber: 2,
        predecessorVersionId: conflictOld.versionId,
        preparedBy: officerS1.id,
        state: 'VALID',
        shirtNumber: 7,
        playingStart: activeStart,
        playingEnd: futureT,
        playingDisposition: 'ACTIVE',
        nonHomegrownOptIn: false,
        u21Finding: true,
        homegrownFinding: false,
        receivedAt: now,
        decidedAt: now,
        decidedBy: officerS1.id,
        decisionReason: 'Chuyển câu lạc bộ dự kiến sang Chelsea.',
        receiptRegulationVersionId: reg1.id,
        receiptTimingStatus: 'ON_TIME',
        decisionRegulationVersionId: reg1.id,
      },
    });
    await db.client.playerRegistration.update({
      where: { id: conflictOld.caseId },
      data: { currentValidatedVersionId: conflictOldAfterId },
    });
    const conflictNew = await seedValidatedRegistration(db, {
      seasonId: season1.id,
      clubId: clubDest.id,
      playerId: playerConflict.id,
      shirtNumber: 22,
      playingStart: futureT,
      playingEnd: null,
      officerId: officerS1.id,
      regVersionId: reg1.id,
      now,
    });
    await db.client.transferOperation.create({
      data: {
        id: randomUUID(),
        operationKind: 'TRANSFER',
        playerId: playerConflict.id,
        oldCaseId: conflictOld.caseId,
        oldBeforeVersionId: conflictOld.versionId,
        oldAfterVersionId: conflictOldAfterId,
        newCaseId: conflictNew.caseId,
        newVersionId: conflictNew.versionId,
        effectiveAt: futureT,
        reason: 'Kế hoạch chuyển câu lạc bộ dự kiến kiểm thử xung đột khôi phục.',
        actorId: officerS1.id,
      },
    });
    // Player 3 occupies shirt #7 at clubSource from futureT onward, blocking restoration of Player 2
    await seedValidatedRegistration(db, {
      seasonId: season1.id,
      clubId: clubSource.id,
      playerId: playerBlocker.id,
      shirtNumber: 7,
      playingStart: futureT,
      playingEnd: null,
      officerId: officerS1.id,
      regVersionId: reg1.id,
      now,
    });

    // Player 4: Cross-season paired future transfer (Season 1 -> Season 2) to verify scope denial for officerS1
    const playerCrossSeason = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_CS_${tag}`,
        fullName: `Vũ Khánh Linh ${tag}`,
        birthDate: new Date('2006-08-08T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'LW',
      },
    });
    const crossOld = await seedValidatedRegistration(db, {
      seasonId: season1.id,
      clubId: clubSource.id,
      playerId: playerCrossSeason.id,
      shirtNumber: 14,
      playingStart: activeStart,
      playingEnd: null,
      officerId: dualOfficer.id,
      regVersionId: reg1.id,
      now,
    });
    const crossOldAfterId = randomUUID();
    await db.client.registrationVersion.create({
      data: {
        id: crossOldAfterId,
        seasonId: season1.id,
        caseId: crossOld.caseId,
        versionNumber: 2,
        predecessorVersionId: crossOld.versionId,
        preparedBy: dualOfficer.id,
        state: 'VALID',
        shirtNumber: 14,
        playingStart: activeStart,
        playingEnd: futureT,
        playingDisposition: 'ACTIVE',
        nonHomegrownOptIn: false,
        u21Finding: true,
        homegrownFinding: false,
        receivedAt: now,
        decidedAt: now,
        decidedBy: dualOfficer.id,
        decisionReason: 'Chuyển liên mùa sang mùa giải tiếp theo.',
        receiptRegulationVersionId: reg1.id,
        receiptTimingStatus: 'ON_TIME',
        decisionRegulationVersionId: reg1.id,
      },
    });
    await db.client.playerRegistration.update({
      where: { id: crossOld.caseId },
      data: { currentValidatedVersionId: crossOldAfterId },
    });
    const crossNew = await seedValidatedRegistration(db, {
      seasonId: season2.id,
      clubId: clubSeason2.id,
      playerId: playerCrossSeason.id,
      shirtNumber: 20,
      playingStart: futureT,
      playingEnd: null,
      officerId: dualOfficer.id,
      regVersionId: reg2.id,
      now,
    });
    await db.client.transferOperation.create({
      data: {
        id: randomUUID(),
        operationKind: 'TRANSFER',
        playerId: playerCrossSeason.id,
        oldCaseId: crossOld.caseId,
        oldBeforeVersionId: crossOld.versionId,
        oldAfterVersionId: crossOldAfterId,
        newCaseId: crossNew.caseId,
        newVersionId: crossNew.versionId,
        effectiveAt: futureT,
        reason: 'Chuyển câu lạc bộ liên mùa giải kiểm thử giới hạn phạm vi.',
        actorId: dualOfficer.id,
      },
    });

    // Player 5: Standalone upcoming validated registration to verify standalone plan-change & plan-cancel
    const playerStandalone = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_ST_${tag}`,
        fullName: `Hoàng Anh Tú ${tag}`,
        birthDate: new Date('2006-04-14T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'RB',
      },
    });
    await seedValidatedRegistration(db, {
      seasonId: season1.id,
      clubId: clubSource.id,
      playerId: playerStandalone.id,
      shirtNumber: 27,
      playingStart: futureT,
      playingEnd: null,
      officerId: officerS1.id,
      regVersionId: reg1.id,
      now,
    });

    // Player 6: Active registration at a discontinued club to verify D099 transfer-out UX
    const clubDiscontinued = await db.client.club.create({
      data: {
        id: randomUUID(),
        code: `OLD${tag}`,
        name: `Oldham Discontinued ${tag}`,
        abbreviation: `O${tag.slice(0, 3)}`,
        discontinuedAt: now,
      },
    });
    const playerDiscontinued = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_DC_${tag}`,
        fullName: `Trịnh Văn Hậu ${tag}`,
        birthDate: new Date('2006-09-09T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'CB',
      },
    });
    await seedValidatedRegistration(db, {
      seasonId: season1.id,
      clubId: clubDiscontinued.id,
      playerId: playerDiscontinued.id,
      shirtNumber: 33,
      playingStart: activeStart,
      playingEnd: null,
      officerId: officerS1.id,
      regVersionId: reg1.id,
      now,
    });

    return {
      officerS1,
      managerS1,
      season1,
      season2,
      now,
      clubSource,
      clubDest,
      clubSeason2,
      clubDiscontinued,
      playerLifecycle,
      playerConflict,
      playerCrossSeason,
      playerStandalone,
      playerDiscontinued,
    };
  } finally {
    await db.close();
  }
}

test('T018: Paired transfer, prospective change/cancellation, restoration conflict preservation, and scope denial', async ({
  page,
}) => {
  test.setTimeout(90000);
  await mkdir('.verification/t018', { recursive: true });
  await page.setViewportSize({ width: 1366, height: 768 });

  const scenario = await seedTransferScenario();
  const transferAtDate = new Date(scenario.now.getTime() + 12 * 3600 * 1000);
  const changedAtDate = new Date(scenario.now.getTime() + 24 * 3600 * 1000);
  const terminateAtDate = new Date(scenario.now.getTime() + 6 * 3600 * 1000);
  const transferAtText = formatHcmDateTime(transferAtDate);
  const changedAtText = formatHcmDateTime(changedAtDate);
  const terminateAtText = formatHcmDateTime(terminateAtDate);
  const transferAtDisplay = formatDisplayInstant(transferAtDate);
  const changedAtDisplay = formatDisplayInstant(changedAtDate);
  const terminateAtDisplay = formatDisplayInstant(terminateAtDate);

  // 1) Officer S1 logs in and opens validated registration for playerLifecycle
  await login(page, scenario.officerS1);
  await page.goto(`/workspace/seasons/${scenario.season1.id}/player-registrations`);
  await expect(page.getByRole('heading', { name: 'Đăng ký cầu thủ theo mùa' })).toBeVisible();

  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.playerLifecycle.fullName}` })
    .click();
  const drawer = page.getByRole('dialog').filter({ hasText: scenario.playerLifecycle.fullName });
  await expect(drawer).toBeVisible();

  const plansSection = drawer.getByRole('region', {
    name: 'Khoảng hiệu lực thi đấu và kế hoạch chuyển câu lạc bộ',
  });
  await expect(plansSection).toBeVisible();
  await expect(plansSection.getByText('Đang hiệu lực', { exact: true }).first()).toBeVisible();
  await expect(plansSection.getByText('#9 · Phiên bản 1')).toBeVisible();
  await expect(plansSection.getByRole('button', { name: 'Chuyển câu lạc bộ' })).toBeVisible();
  await expect(plansSection.getByRole('button', { name: 'Chấm dứt hiệu lực' })).toBeVisible();

  // Verify zero technical spec jargon or raw internal enum codes appear in the drawer
  const initialDrawerText = (await drawer.textContent()) ?? '';
  expect(initialDrawerText).not.toMatch(
    /\b(T015|T018|D053|D075|D099|BM1|UC10|UC11|UC12|PLAN_CHANGE|PLAN_CANCEL|CANCELLED_BEFORE_EFFECTIVITY)\b/,
  );

  await plansSection.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.verification/t018/01-active-panel-1366.png' });

  // 2) Execute paired future transfer (clubSource -> clubDest at transferAtText, shirt #11)
  await plansSection.getByRole('button', { name: 'Chuyển câu lạc bộ' }).click();
  const transferModal = page.getByRole('dialog', { name: 'Chuyển câu lạc bộ cho cầu thủ' });
  await expect(transferModal).toBeVisible();
  await expect(
    transferModal.getByText('Xem trước tác động hai phía cùng mốc hiệu lực'),
  ).toBeVisible();

  await pickOption(
    transferModal,
    page,
    'Câu lạc bộ đích *',
    scenario.clubDest.name,
    scenario.clubDest.code,
  );
  await transferModal.getByLabel('Số áo tại câu lạc bộ đích (1–99) *').fill('11');
  await fillDateTime(transferModal, page, 'Thời điểm chuyển câu lạc bộ', transferAtText);
  await transferModal
    .getByLabel('Lý do chuyển câu lạc bộ *')
    .fill('Thống nhất chuyển câu lạc bộ dự kiến sang Chelsea.');

  await transferModal
    .getByText('Xem trước tác động hai phía cùng mốc hiệu lực')
    .scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.verification/t018/02-transfer-modal-1366.png' });
  await transferModal.getByRole('button', { name: 'Xác nhận chuyển câu lạc bộ' }).click();
  await expect(transferModal).toBeHidden();

  // Verify active paired transfer card shows BOTH clubs, shared instant, dependencies, and prospective controls
  await expect(
    plansSection.getByText('Đã ghi nhận chuyển câu lạc bộ ghép cặp thành công.'),
  ).toBeVisible();
  const pairedCard = plansSection.getByLabel('Kế hoạch chuyển câu lạc bộ ghép cặp');
  await expect(pairedCard).toBeVisible();
  await expect(pairedCard.getByText(scenario.clubSource.name)).toBeVisible();
  await expect(pairedCard.getByText(scenario.clubDest.name)).toBeVisible();
  await expect(pairedCard.getByText(transferAtDisplay).first()).toBeVisible();
  await expect(pairedCard.getByText(/Số áo #11/)).toBeVisible();
  await expect(plansSection.getByText('1 hồ sơ hợp lệ khác')).toBeVisible();
  await expect(plansSection.getByRole('button', { name: 'Điều chỉnh kế hoạch' })).toBeVisible();
  await expect(
    plansSection.getByRole('button', { name: 'Hủy kế hoạch trước hiệu lực' }),
  ).toBeVisible();
  await expect(plansSection.getByRole('button', { name: 'Chấm dứt hiệu lực' })).toHaveCount(0);

  await plansSection.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.verification/t018/03-active-transfer-plan-1366.png' });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.screenshot({ path: '.verification/t018/04-active-transfer-plan-1600.png' });

  // 3) Prospective paired plan-change -> move effective instant to changedAtText and shirt to #15
  await plansSection.getByRole('button', { name: 'Điều chỉnh kế hoạch' }).click();
  const planChangeModal = page.getByRole('dialog', {
    name: 'Điều chỉnh kế hoạch chuyển câu lạc bộ tương lai',
  });
  await expect(planChangeModal).toBeVisible();
  await expect(planChangeModal.getByText('Đối chiếu trước → sau điều chỉnh')).toBeVisible();

  await fillDateTime(planChangeModal, page, 'Mốc hiệu lực mới', changedAtText);
  await planChangeModal.getByLabel('Số áo mới tại câu lạc bộ đích (1–99)').fill('15');
  await planChangeModal
    .getByLabel('Lý do điều chỉnh kế hoạch *')
    .fill('Điều chỉnh mốc hiệu lực và cập nhật số áo đích sang 15.');
  await planChangeModal.getByRole('button', { name: 'Lưu điều chỉnh kế hoạch' }).click();
  await expect(planChangeModal).toBeHidden();

  await expect(
    plansSection.getByText('Đã cập nhật đồng bộ cả hai phía của kế hoạch chuyển câu lạc bộ.'),
  ).toBeVisible();
  await expect(pairedCard.getByText(changedAtDisplay).first()).toBeVisible();
  await expect(pairedCard.getByText(/Số áo #15/)).toBeVisible();
  await page.screenshot({ path: '.verification/t018/05-after-plan-change-1600.png' });

  // 4) Valid paired plan-cancel -> destination marked Hủy trước hiệu lực, source restored to open-ended
  await page.setViewportSize({ width: 1366, height: 768 });
  await plansSection.getByRole('button', { name: 'Hủy kế hoạch trước hiệu lực' }).click();
  const planCancelModal = page.getByRole('dialog', {
    name: 'Hủy kế hoạch chuyển câu lạc bộ trước hiệu lực',
  });
  await expect(planCancelModal).toBeVisible();
  await expect(planCancelModal.getByText('Hủy trước hiệu lực')).toBeVisible();
  await expect(planCancelModal.getByText('Chưa ấn định')).toBeVisible();
  await planCancelModal
    .getByLabel('Lý do hủy kế hoạch trước hiệu lực *')
    .fill('Hủy thỏa thuận chuyển câu lạc bộ trước khi có hiệu lực.');
  await planCancelModal.getByRole('button', { name: 'Xác nhận hủy kế hoạch' }).click();
  await expect(planCancelModal).toBeHidden();

  await expect(
    plansSection.getByText(
      'Đã hủy kế hoạch chuyển câu lạc bộ trước hiệu lực và khôi phục hồ sơ nguồn.',
    ),
  ).toBeVisible();
  await expect(plansSection.getByText('Hồ sơ đích: Hủy trước hiệu lực')).toBeVisible();
  await expect(plansSection.getByText('Chưa ấn định').first()).toBeVisible();
  await expect(plansSection.getByRole('button', { name: 'Chuyển câu lạc bộ' })).toBeVisible();
  await expect(plansSection.getByRole('button', { name: 'Chấm dứt hiệu lực' })).toBeVisible();
  await plansSection.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.verification/t018/06-after-plan-cancel-1366.png' });

  // Verify Vietnamese audit labels and accurate source role in Lịch sử thao tác
  await drawer.getByRole('button', { name: 'Lịch sử thao tác' }).click();
  const historyModal = page.getByRole('dialog', { name: /Lịch sử thao tác/ });
  const transferRow = historyModal
    .getByRole('row')
    .filter({ hasText: 'Chuyển câu lạc bộ cho cầu thủ' })
    .first();
  await expect(transferRow).toBeVisible();
  await expect(transferRow).toContainText('Vai trò: Câu lạc bộ nguồn');
  await expect(
    historyModal.getByText('Điều chỉnh kế hoạch đăng ký tương lai').first(),
  ).toBeVisible();
  await expect(historyModal.getByText('Hủy kế hoạch đăng ký trước hiệu lực').first()).toBeVisible();
  await historyModal.getByRole('button', { name: 'Đóng' }).last().click();

  // 5) Ordinary scheduled termination on restored registration
  await plansSection.getByRole('button', { name: 'Chấm dứt hiệu lực' }).click();
  const terminateModal = page.getByRole('dialog', { name: 'Chấm dứt hiệu lực thi đấu' });
  await expect(terminateModal).toBeVisible();
  await fillDateTime(terminateModal, page, 'Thời điểm kết thúc hiệu lực', terminateAtText);
  await terminateModal
    .getByLabel('Lý do chấm dứt hiệu lực *')
    .fill('Chấm dứt hiệu lực thi đấu theo thỏa thuận hai bên.');
  await terminateModal.getByRole('button', { name: 'Xác nhận chấm dứt' }).click();
  await expect(terminateModal).toBeHidden();
  await expect(
    plansSection.getByText('Đã ghi nhận chấm dứt hiệu lực thi đấu thành công.'),
  ).toBeVisible();
  await expect(plansSection.getByText(terminateAtDisplay).first()).toBeVisible();
  await drawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 5b) Standalone prospective plan-change (showing before/after interval preview) and plan-cancel
  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.playerStandalone.fullName}` })
    .click();
  const standaloneDrawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.playerStandalone.fullName });
  const standalonePlans = standaloneDrawer.getByRole('region', {
    name: 'Khoảng hiệu lực thi đấu và kế hoạch chuyển câu lạc bộ',
  });
  await expect(standalonePlans.getByText('Chờ hiệu lực').first()).toBeVisible();
  await standalonePlans.getByRole('button', { name: 'Điều chỉnh kế hoạch' }).click();
  const standaloneChangeModal = page.getByRole('dialog', {
    name: 'Điều chỉnh kế hoạch đăng ký tương lai',
  });
  await expect(standaloneChangeModal.getByText('Đối chiếu trước → sau điều chỉnh')).toBeVisible();
  await expect(standaloneChangeModal.getByText('Kế hoạch hiện tại')).toBeVisible();
  await expect(standaloneChangeModal.getByText('Kế hoạch đề xuất')).toBeVisible();
  await standaloneChangeModal.getByLabel('Số áo đăng ký mới (1–99)').fill('28');
  await standaloneChangeModal
    .getByLabel('Lý do điều chỉnh kế hoạch *')
    .fill('Điều chỉnh số áo cho kế hoạch đăng ký tương lai.');
  await standaloneChangeModal.getByRole('button', { name: 'Lưu điều chỉnh kế hoạch' }).click();
  await expect(standaloneChangeModal).toBeHidden();
  await expect(standalonePlans.getByText('#28 · Phiên bản 2')).toBeVisible();

  await standalonePlans.getByRole('button', { name: 'Hủy kế hoạch trước hiệu lực' }).click();
  const standaloneCancelModal = page.getByRole('dialog', {
    name: 'Hủy kế hoạch đăng ký trước hiệu lực',
  });
  await standaloneCancelModal
    .getByLabel('Lý do hủy kế hoạch trước hiệu lực *')
    .fill('Hủy kế hoạch đăng ký tương lai trước khi bắt đầu hiệu lực.');
  await standaloneCancelModal.getByRole('button', { name: 'Xác nhận hủy kế hoạch' }).click();
  await expect(standaloneCancelModal).toBeHidden();
  await expect(standalonePlans.getByText('Hủy trước hiệu lực').first()).toBeVisible();
  await expect(
    standalonePlans.getByText('Kế hoạch đã bị hủy trước khi bắt đầu hiệu lực'),
  ).toBeVisible();
  await standaloneDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 5c) Discontinued source club transfer-out UX (no source re-confirmation)
  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.playerDiscontinued.fullName}` })
    .click();
  const discDrawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.playerDiscontinued.fullName });
  const discPlans = discDrawer.getByRole('region', {
    name: 'Khoảng hiệu lực thi đấu và kế hoạch chuyển câu lạc bộ',
  });
  await expect(discPlans.getByText(/Câu lạc bộ nguồn đã ngừng hoạt động/)).toBeVisible();
  await expect(
    discPlans.getByRole('button', { name: 'Chuyển rời câu lạc bộ ngừng hoạt động' }),
  ).toBeVisible();
  await discDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 6) Failed plan-cancel due to shirt restoration conflict preserves prior transfer plan after reload
  await page
    .getByRole('row')
    .filter({ hasText: scenario.playerConflict.fullName })
    .filter({ hasText: scenario.clubSource.name })
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.playerConflict.fullName}` })
    .click();
  const conflictDrawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.playerConflict.fullName });
  const conflictPlans = conflictDrawer.getByRole('region', {
    name: 'Khoảng hiệu lực thi đấu và kế hoạch chuyển câu lạc bộ',
  });
  await expect(conflictPlans.getByLabel('Kế hoạch chuyển câu lạc bộ ghép cặp')).toBeVisible();
  await conflictPlans.getByRole('button', { name: 'Hủy kế hoạch trước hiệu lực' }).click();

  const conflictCancelModal = page.getByRole('dialog', {
    name: 'Hủy kế hoạch chuyển câu lạc bộ trước hiệu lực',
  });
  await conflictCancelModal
    .getByLabel('Lý do hủy kế hoạch trước hiệu lực *')
    .fill('Kiểm thử từ chối hủy khi số áo nguồn đã trùng cầu thủ khác.');
  await conflictCancelModal.getByRole('button', { name: 'Xác nhận hủy kế hoạch' }).click();

  const conflictAlert = conflictCancelModal.getByRole('alert');
  await expect(conflictAlert).toBeVisible();
  await expect(conflictAlert).toContainText(/số áo|khôi phục|trùng/i);
  await page.screenshot({ path: '.verification/t018/07-plan-cancel-conflict-1366.png' });

  await conflictCancelModal.getByRole('button', { name: 'Đóng' }).last().click();
  await conflictDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // Full page reload confirms prior transfer plan was completely preserved!
  await page.reload();
  await page
    .getByRole('row')
    .filter({ hasText: scenario.playerConflict.fullName })
    .filter({ hasText: scenario.clubSource.name })
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.playerConflict.fullName}` })
    .click();
  const reloadedConflictDrawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.playerConflict.fullName });
  await expect(
    reloadedConflictDrawer.getByLabel('Kế hoạch chuyển câu lạc bộ ghép cặp'),
  ).toBeVisible();
  await reloadedConflictDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 7) Scope denial: officerS1 lacks Season 2 authority on cross-season transfer -> restricted banner, no paired mutations
  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.playerCrossSeason.fullName}` })
    .click();
  const crossDrawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.playerCrossSeason.fullName });
  const crossPlans = crossDrawer.getByRole('region', {
    name: 'Khoảng hiệu lực thi đấu và kế hoạch chuyển câu lạc bộ',
  });
  await expect(crossPlans.getByText(/Hạn chế phạm vi quyền liên mùa giải/)).toBeVisible();
  await expect(crossPlans.getByText(/Ngoài phạm vi xem chi tiết/).first()).toBeVisible();
  await expect(crossPlans.getByRole('button', { name: 'Điều chỉnh kế hoạch' })).toHaveCount(0);
  await expect(crossPlans.getByRole('button', { name: 'Hủy kế hoạch trước hiệu lực' })).toHaveCount(
    0,
  );
  await crossPlans.scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.verification/t018/08-scope-restricted-1366.png' });
  await crossDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 8) Scope denial: SEASON_MANAGER is read-only for transfer / plan controls
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, scenario.managerS1);
  await page.goto(`/workspace/seasons/${scenario.season1.id}/player-registrations`);
  await page
    .getByRole('row')
    .filter({ hasText: scenario.playerConflict.fullName })
    .filter({ hasText: scenario.clubSource.name })
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.playerConflict.fullName}` })
    .click();
  const managerDrawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.playerConflict.fullName });
  const managerPlans = managerDrawer.getByRole('region', {
    name: 'Khoảng hiệu lực thi đấu và kế hoạch chuyển câu lạc bộ',
  });
  await expect(managerPlans.getByText(/Chế độ chỉ xem/)).toBeVisible();
  await expect(managerPlans.getByLabel('Kế hoạch chuyển câu lạc bộ ghép cặp')).toBeVisible();
  await expect(managerPlans.getByRole('button', { name: 'Chuyển câu lạc bộ' })).toHaveCount(0);
  await expect(managerPlans.getByRole('button', { name: 'Chấm dứt hiệu lực' })).toHaveCount(0);
  await expect(managerPlans.getByRole('button', { name: 'Điều chỉnh kế hoạch' })).toHaveCount(0);
  await expect(
    managerPlans.getByRole('button', { name: 'Hủy kế hoạch trước hiệu lực' }),
  ).toHaveCount(0);
  await managerDrawer.getByRole('button', { name: 'Đóng' }).last().click();
});
