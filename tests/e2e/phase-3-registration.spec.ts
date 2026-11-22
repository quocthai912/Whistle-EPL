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

async function seedEffectiveRegulationVersion(
  db: DatabaseService,
  params: {
    seasonId: string;
    managerId: string;
    u21Cutoff: string;
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
      u21Cutoff: new Date(`${params.u21Cutoff}T00:00:00.000Z`),
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
      {
        regulationVersionId: regVersionId,
        code: 'C',
        name: 'Phản lưới',
        isOwnGoal: true,
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
      decisionReason: `Phê duyệt quy định phiên bản ${versionNumber} cho kiểm thử E2E.`,
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

async function seedRegistrationScenario() {
  const { accounts, seasons } = await browserAdministration();
  const officer = await browserAccount(false);
  const manager = await browserAccount(false);
  const outsider = accounts[4];
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
      ],
    });

    const opensAt = new Date(now.getTime() - 24 * 3600 * 1000);
    const closesAt = new Date(now.getTime() + 48 * 3600 * 1000);
    const r1 = await seedEffectiveRegulationVersion(db, {
      seasonId: season.id,
      managerId: manager.id,
      u21Cutoff: '2005-01-01',
      opensAt,
      closesAt,
      now,
    });

    const tag = randomUUID().slice(0, 5).toUpperCase();
    const stadium = await db.client.stadium.create({
      data: {
        id: randomUUID(),
        code: `OTF${tag}`,
        name: `Old Trafford ${tag}`,
        location: 'Manchester',
      },
    });
    const approvedClub = await db.client.club.create({
      data: {
        id: randomUUID(),
        code: `MUN${tag}`,
        name: `Manchester United ${tag}`,
        abbreviation: `M${tag.slice(0, 3)}`,
      },
    });
    const pendingClub = await db.client.club.create({
      data: {
        id: randomUUID(),
        code: `ARS${tag}`,
        name: `Arsenal ${tag}`,
        abbreviation: `A${tag.slice(0, 3)}`,
      },
    });

    // Approve club application for approvedClub only
    const appCaseId = randomUUID();
    const appVerId = randomUUID();
    await db.client.clubApplication.create({
      data: { id: appCaseId, seasonId: season.id, clubId: approvedClub.id },
    });
    await db.client.clubApplicationVersion.create({
      data: {
        id: appVerId,
        seasonId: season.id,
        caseId: appCaseId,
        versionNumber: 1,
        preparedBy: officer.id,
        state: 'APPROVED',
        receivedAt: now,
        submittedAt: now,
        decidedAt: now,
        decidedBy: manager.id,
        coachName: 'HLV Erik',
        homeStadiumId: stadium.id,
        representativeName: 'Đại diện CLB',
        representativePhone: '0901234567',
        contactAddress: 'Sir Matt Busby Way',
        receiptRegulationVersionId: r1.id,
        receiptTimingStatus: 'ON_TIME',
        approvalRegulationVersionId: r1.id,
      },
    });
    await db.client.clubApplication.update({
      where: { id: appCaseId },
      data: { currentAcceptedVersionId: appVerId },
    });

    const adultPlayer = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_AD_${tag}`,
        fullName: `Trần Quốc Bảo ${tag}`,
        birthDate: new Date('2001-06-15T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'CM',
      },
    });
    const u21ChangedRulePlayer = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_U21_${tag}`,
        fullName: `Nguyễn Gia Huy ${tag}`,
        birthDate: new Date('2005-06-01T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'ST',
      },
    });

    return {
      officer,
      manager,
      outsider,
      season,
      r1,
      opensAt,
      closesAt,
      now,
      approvedClub,
      pendingClub,
      adultPlayer,
      u21ChangedRulePlayer,
    };
  } finally {
    await db.close();
  }
}

test('T015: Precheck insufficient basis, changed rules (R1 -> R2), confirmation and role restrictions', async ({
  page,
}) => {
  test.setTimeout(60000);
  await mkdir('.verification/t015', { recursive: true });
  await page.setViewportSize({ width: 1366, height: 768 });

  const scenario = await seedRegistrationScenario();
  const futureStartText = formatHcmDateTime(new Date(scenario.now.getTime() + 72 * 3600 * 1000));

  // 1) Officer navigates via sidebar to Player Registrations
  await login(page, scenario.officer);
  await page.getByRole('link', { name: 'Đăng ký cầu thủ theo mùa' }).click();
  await expect(page).toHaveURL(
    new RegExp(`/workspace/seasons/${scenario.season.id}/player-registrations`),
  );
  await expect(page.getByRole('heading', { name: 'Đăng ký cầu thủ theo mùa' })).toBeVisible();
  await expect(page.getByText(new RegExp(`Phiên bản ${scenario.r1.versionNumber}`))).toBeVisible();

  // 2) Create draft with pending club and missing homegrown basis -> Precheck reports both!
  await page.getByRole('button', { name: 'Tạo đăng ký cầu thủ' }).click();
  const createDialog = page.getByRole('dialog', { name: 'Tạo bản nháp đăng ký cầu thủ' });
  await pickOption(
    createDialog,
    page,
    'Câu lạc bộ *',
    scenario.pendingClub.name,
    scenario.pendingClub.code,
  );
  await pickOption(
    createDialog,
    page,
    'Cầu thủ *',
    scenario.adultPlayer.fullName,
    scenario.adultPlayer.code,
  );
  await createDialog.getByLabel('Số áo đăng ký (1–99)').fill('10');
  const startInput = createDialog.getByRole('textbox', { name: 'Bắt đầu hiệu lực thi đấu' });
  await startInput.fill(futureStartText);
  await startInput.press('Tab');
  await createDialog.getByText('Tạo bản nháp đăng ký cầu thủ').click();
  await page.screenshot({ path: '.verification/t015/01-draft-modal-1366.png' });
  await createDialog.getByRole('button', { name: 'Lưu bản nháp' }).click();

  const pendingDrawer = page.getByRole('dialog').filter({ hasText: scenario.adultPlayer.fullName });
  await expect(pendingDrawer).toBeVisible();
  await expect(pendingDrawer.getByText('Hồ sơ: Nháp')).toBeVisible();
  await expect(pendingDrawer.getByText('Hiệu lực thi đấu: Chưa xác nhận')).toBeVisible();

  await pendingDrawer.getByRole('button', { name: 'Kiểm tra điều kiện' }).click();
  await expect(pendingDrawer.getByText(/Chưa đủ điều kiện/)).toBeVisible();
  await expect(pendingDrawer.getByText('Chưa đạt').first()).toBeVisible();
  await expect(pendingDrawer.getByText('Chưa đủ căn cứ').first()).toBeVisible();
  // Ensure no leaked internal spec codes appear in drawer UI
  const drawerText = (await pendingDrawer.textContent()) ?? '';
  expect(drawerText).not.toMatch(/\b(D053|D054|D056|D059|D099|UC10|UC11|BM1)\b/);
  await page.screenshot({ path: '.verification/t015/02-precheck-drawer-1366.png' });
  await pendingDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 3) Create draft for U21 player under R1, receive ON_TIME, then activate stricter R2!
  await page.getByRole('button', { name: 'Tạo đăng ký cầu thủ' }).click();
  const u21Dialog = page.getByRole('dialog', { name: 'Tạo bản nháp đăng ký cầu thủ' });
  await pickOption(
    u21Dialog,
    page,
    'Câu lạc bộ *',
    scenario.approvedClub.name,
    scenario.approvedClub.code,
  );
  await pickOption(
    u21Dialog,
    page,
    'Cầu thủ *',
    scenario.u21ChangedRulePlayer.fullName,
    scenario.u21ChangedRulePlayer.code,
  );
  await u21Dialog.getByLabel('Số áo đăng ký (1–99)').fill('18');
  const u21StartInput = u21Dialog.getByRole('textbox', { name: 'Bắt đầu hiệu lực thi đấu' });
  await u21StartInput.fill(futureStartText);
  await u21StartInput.press('Tab');
  await u21Dialog.getByRole('button', { name: 'Lưu bản nháp' }).click();

  const u21Drawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.u21ChangedRulePlayer.fullName });
  await u21Drawer.getByRole('button', { name: 'Ghi nhận tiếp nhận' }).click();
  await page.getByRole('button', { name: 'Xác nhận tiếp nhận' }).click();
  await expect(u21Drawer.getByText(/Tiếp nhận đúng hạn/)).toBeVisible();

  // Activate R2 with stricter u21Cutoff = 2006-01-01 while registration is RECEIVED
  const db = new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
  let r2VersionNumber: number;
  try {
    const r2 = await seedEffectiveRegulationVersion(db, {
      seasonId: scenario.season.id,
      managerId: scenario.manager.id,
      u21Cutoff: '2006-01-01',
      opensAt: scenario.opensAt,
      closesAt: scenario.closesAt,
      now: await db.now(),
    });
    r2VersionNumber = r2.versionNumber;
  } finally {
    await db.close();
  }

  // Reload page so workspace reflects R2, open the received registration -> notice changed rule banner
  await page.reload();
  await expect(page.getByText(new RegExp(`Phiên bản ${r2VersionNumber}`))).toBeVisible();
  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.u21ChangedRulePlayer.fullName}` })
    .click();
  const changedRuleDrawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.u21ChangedRulePlayer.fullName });
  await expect(
    changedRuleDrawer.getByText(/Quy định mùa giải đã thay đổi sau khi tiếp nhận/),
  ).toBeVisible();

  // Precheck under R2 shows INSUFFICIENT_BASIS for homegrown because player is no longer U21!
  await changedRuleDrawer.getByRole('button', { name: 'Kiểm tra điều kiện' }).click();
  await expect(changedRuleDrawer.getByText('Chưa đủ căn cứ').first()).toBeVisible();

  // Attempt confirm-valid under R2 -> blocked with actionable error; stays RECEIVED
  await changedRuleDrawer.getByRole('button', { name: 'Xác nhận hợp lệ' }).click();
  const confirmModal = page.getByRole('dialog', { name: 'Xác nhận hợp lệ đăng ký cầu thủ' });
  await confirmModal.getByRole('button', { name: 'Xác nhận hợp lệ' }).click();
  await expect(confirmModal.getByRole('alert')).toBeVisible();
  await confirmModal.getByRole('button', { name: 'Hủy' }).click();
  await expect(changedRuleDrawer.getByText('Hồ sơ: Đã tiếp nhận')).toBeVisible();

  // Return for supplementation -> create Version 2 -> opt-in non-homegrown -> receive -> confirm valid!
  await changedRuleDrawer.getByRole('button', { name: 'Yêu cầu bổ sung' }).click();
  const returnModal = page.getByRole('dialog', { name: 'Yêu cầu bổ sung hồ sơ đăng ký' });
  await returnModal
    .getByLabel(/Lý do/)
    .fill('Cập nhật diện ngoài đào tạo nội địa theo quy định mới.');
  await returnModal.getByRole('button', { name: 'Yêu cầu bổ sung' }).click();
  await expect(changedRuleDrawer.getByText('Hồ sơ: Cần bổ sung')).toBeVisible();

  await changedRuleDrawer.getByRole('button', { name: 'Tạo phiên bản bổ sung' }).click();
  await page
    .getByRole('dialog', { name: 'Tạo phiên bản bổ sung mới' })
    .getByRole('button', { name: 'Tạo phiên bản bổ sung' })
    .click();
  await expect(changedRuleDrawer.getByRole('tab', { name: /Phiên bản 2 · Nháp/ })).toBeVisible();

  await changedRuleDrawer.getByRole('button', { name: 'Chỉnh sửa bản nháp' }).click();
  const editModal = page.getByRole('dialog', { name: /Chỉnh sửa bản nháp/ });
  await editModal.getByLabel('Xử lý diện cầu thủ ngoài đào tạo nội địa').check();
  await editModal.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(editModal).toBeHidden();
  await expect(changedRuleDrawer.getByText('Có chọn')).toBeVisible();

  await changedRuleDrawer.getByRole('button', { name: 'Ghi nhận tiếp nhận' }).click();
  await page.getByRole('button', { name: 'Xác nhận tiếp nhận' }).click();
  await expect(changedRuleDrawer.getByText('Hồ sơ: Đã tiếp nhận')).toBeVisible();

  await changedRuleDrawer.getByRole('button', { name: 'Xác nhận hợp lệ' }).click();
  const confirmV2Modal = page.getByRole('dialog', { name: 'Xác nhận hợp lệ đăng ký cầu thủ' });
  await confirmV2Modal.getByRole('button', { name: 'Xác nhận hợp lệ' }).click();

  // Verified VALID + UPCOMING playing effectivity + Official Snapshot!
  await expect(changedRuleDrawer.getByText('Hồ sơ: Hợp lệ')).toBeVisible();
  await expect(changedRuleDrawer.getByText('Hiệu lực thi đấu: Chờ hiệu lực')).toBeVisible();
  await expect(changedRuleDrawer.getByText('Hồ sơ chính thức')).toBeVisible();
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.screenshot({ path: '.verification/t015/03-validated-drawer-1600.png' });

  // Open History modal to verify Vietnamese audit labels
  await changedRuleDrawer.getByRole('button', { name: 'Lịch sử thao tác' }).click();
  const historyModal = page.getByRole('dialog', { name: /Lịch sử thao tác/ });
  await expect(historyModal.getByText('Xác nhận hợp lệ đăng ký cầu thủ')).toBeVisible();
  await historyModal.getByRole('button', { name: 'Đóng' }).last().click();
  await changedRuleDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // Capture desktop list at both 1600x1000 and 1366x768
  await page.screenshot({ path: '.verification/t015/04-list-1600.png' });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: '.verification/t015/05-list-1366.png' });

  // 4) Season Manager sees read-only registration workspace (no create / no confirm-valid)
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, scenario.manager);
  await page.goto(`/workspace/seasons/${scenario.season.id}/player-registrations`);
  await expect(page.getByRole('button', { name: 'Tạo đăng ký cầu thủ' })).toHaveCount(0);
  await page
    .getByRole('button', { name: `Chi tiết đăng ký ${scenario.u21ChangedRulePlayer.fullName}` })
    .click();
  const mgrDrawer = page
    .getByRole('dialog')
    .filter({ hasText: scenario.u21ChangedRulePlayer.fullName });
  await expect(mgrDrawer.getByText('Hồ sơ: Hợp lệ')).toBeVisible();
  await expect(mgrDrawer.getByRole('button', { name: 'Xác nhận hợp lệ' })).toHaveCount(0);
  await expect(mgrDrawer.getByRole('button', { name: 'Lịch sử thao tác' })).toBeVisible();
  await mgrDrawer.getByRole('button', { name: 'Đóng' }).last().click();

  // 5) Outsider / unassigned user is denied on direct route access
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, scenario.outsider);
  await page.goto(`/workspace/seasons/${scenario.season.id}/player-registrations`);
  await expect(page.getByRole('heading', { name: 'Bạn chưa có quyền truy cập' })).toBeVisible();
});
