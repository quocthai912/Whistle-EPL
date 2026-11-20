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
  await popup.getByText(optionLabel, { exact: true }).first().click();
  await expect(control).toHaveAttribute('aria-expanded', 'false');
}

async function seedClubApplicationScenario(options: { lateWindow?: boolean } = {}) {
  const { accounts, seasons } = await browserAdministration();
  const officer = await browserAccount(false);
  const manager = await browserAccount(false);
  const outsider = accounts[4];
  const season = seasons[0];
  const otherSeason = seasons[1];

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

    // Seed effective regulation with either open or already-closed window relative to live server clock
    let regCase = await db.client.regulationCase.findUnique({ where: { seasonId: season.id } });
    if (!regCase) {
      regCase = await db.client.regulationCase.create({ data: { seasonId: season.id } });
    }
    const latest = await db.client.regulationVersion.findFirst({
      where: { caseId: regCase.id },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const opensAt = options.lateWindow
      ? new Date(now.getTime() - 48 * 3600 * 1000)
      : new Date(now.getTime() - 24 * 3600 * 1000);
    const closesAt = options.lateWindow
      ? new Date(now.getTime() - 24 * 3600 * 1000)
      : new Date(now.getTime() + 48 * 3600 * 1000);

    const regVersionId = randomUUID();
    await db.client.regulationVersion.create({
      data: {
        id: regVersionId,
        seasonId: season.id,
        caseId: regCase.id,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        preparedBy: manager.id,
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
          opensAt,
          closesAt,
        },
        {
          regulationVersionId: regVersionId,
          intakeKind: 'PLAYER_CHANGE',
          opensAt,
          closesAt,
        },
      ],
    });
    await db.client.regulationVersion.update({
      where: { id: regVersionId },
      data: {
        state: 'EFFECTIVE',
        submittedAt: now,
        approvedAt: now,
        decidedAt: now,
        decidedBy: accounts[2].id,
        decisionReason: 'Quy định thử nghiệm trình duyệt.',
        activeFrom: now,
        activationProcessedAt: now,
      },
    });
    await db.client.season.update({
      where: { id: season.id },
      data: { currentRegulationVersionId: regVersionId },
    });

    const suffix = randomUUID().slice(0, 6).toUpperCase();
    const club = await db.client.club.create({
      data: {
        id: randomUUID(),
        code: `CLB_${suffix}`,
        name: `Câu lạc bộ Trình duyệt ${suffix}`,
        abbreviation: `B${suffix.slice(0, 4)}`,
      },
    });
    const stadium = await db.client.stadium.create({
      data: {
        id: randomUUID(),
        code: `STD_${suffix}`,
        name: `Sân vận động Trình duyệt ${suffix}`,
        location: 'London',
      },
    });
    const player = await db.client.player.create({
      data: {
        id: randomUUID(),
        code: `PL_${suffix}`,
        fullName: `Cầu thủ Trình duyệt ${suffix}`,
        birthDate: new Date('2000-05-05T00:00:00.000Z'),
        nationalityCode: 'ENG',
        positionCode: 'CM',
      },
    });

    return { officer, manager, outsider, season, otherSeason, club, stadium, player };
  } finally {
    await db.close();
  }
}

test('T008: BM1 draft, supplementation round, independent approval, safe direct access and Vietnamese search', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const { officer, manager, outsider, season, otherSeason, club, stadium, player } =
    await seedClubApplicationScenario({ lateWindow: false });

  // 1. Safe direct access denial for outsider
  await login(page, outsider);
  await page.goto(`/workspace/seasons/${season.id}/club-applications`);
  await expect(page.getByText('Bạn chưa có quyền truy cập')).toBeVisible();

  // 2. Officer cannot directly access unrelated Season B
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, officer);
  await page.goto(`/workspace/seasons/${otherSeason.id}/club-applications`);
  await expect(page.getByText('Bạn chưa có quyền truy cập')).toBeVisible();

  // 3. Officer opens Season A BM1 workbench & creates draft
  await page.goto(`/workspace/seasons/${season.id}/club-applications`);
  await expect(page.getByText(/Quy định đang áp dụng/)).toBeVisible();

  await page.getByRole('button', { name: 'Tạo hồ sơ tham dự' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tạo hồ sơ đăng ký tham dự câu lạc bộ' });

  await pickOption(dialog, page, 'Câu lạc bộ', `${club.name} (${club.code})`, club.code);

  await dialog.getByLabel('Huấn luyện viên trưởng').fill('HLV Nguyễn Minh');
  await pickOption(
    dialog,
    page,
    'Sân nhà đăng ký',
    `${stadium.name} (${stadium.code})`,
    stadium.code,
  );

  await dialog.getByLabel('Người đại diện').fill('Lê Đại Diện');
  await dialog.getByLabel('Số điện thoại đại diện').fill('0901234567');
  await dialog.getByLabel('Địa chỉ liên hệ').fill('100 Stadium Road, London');
  await dialog.getByRole('button', { name: 'Thêm cầu thủ' }).click();

  await pickOption(
    dialog,
    page,
    'Chọn cầu thủ dự kiến',
    `${player.fullName} (${player.code} · CM)`,
    player.code,
  );
  await dialog.getByLabel('Số áo dự kiến').fill('8');
  await dialog.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(dialog).not.toBeVisible();

  // Drawer opens automatically for created case: Receive (on-time) -> Return for supplementation
  const drawer = page.getByRole('dialog').filter({ hasText: club.name });
  await expect(drawer.getByText('Phiên bản 1 · Nháp')).toBeVisible();

  await drawer.getByRole('button', { name: 'Ghi nhận tiếp nhận' }).click();
  await page.getByRole('button', { name: 'Xác nhận tiếp nhận' }).click();
  await expect(drawer.getByText(/Tiếp nhận đúng hạn/)).toBeVisible();

  await drawer.getByRole('button', { name: 'Yêu cầu bổ sung' }).click();
  const returnDialog = page.getByRole('dialog', { name: 'Yêu cầu bổ sung hồ sơ' });
  await returnDialog.getByLabel(/Lý do/).fill('Cập nhật thêm ghi chú liên hệ.');
  await returnDialog.getByRole('button', { name: 'Yêu cầu bổ sung' }).click();
  await expect(drawer.getByText('Phiên bản 1 · Cần bổ sung')).toBeVisible();

  // Create Round 2 (same case!) -> Receive -> Submit
  await drawer.getByRole('button', { name: 'Tạo phiên bản bổ sung mới' }).click();
  const round2Dialog = page.getByRole('dialog', {
    name: 'Tạo phiên bản bổ sung mới trong cùng hồ sơ',
  });
  await round2Dialog.getByLabel('Ghi chú (không bắt buộc)').fill('Đã bổ sung thông tin liên hệ.');
  await round2Dialog.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(drawer.getByText('Phiên bản 2 · Nháp')).toBeVisible();

  await drawer.getByRole('button', { name: 'Ghi nhận tiếp nhận' }).click();
  await page.getByRole('button', { name: 'Xác nhận tiếp nhận' }).click();
  await expect(drawer.getByText('Phiên bản 2 · Đã tiếp nhận')).toBeVisible();

  await drawer.getByRole('button', { name: 'Trình phê duyệt' }).click();
  await page
    .getByRole('dialog', { name: 'Trình phê duyệt hồ sơ tham dự' })
    .getByRole('button', { name: 'Trình phê duyệt' })
    .click();
  await expect(drawer.getByText('Phiên bản 2 · Chờ phê duyệt')).toBeVisible();

  // Close drawer, search Vietnamese club name, capture screenshot
  await drawer.getByRole('button', { name: 'Đóng' }).last().click();
  await page.getByLabel('Tìm hồ sơ tham dự').fill(club.code);
  await expect(page.getByText(club.name)).toBeVisible();

  if (process.env.E2E_CAPTURE_SCREENSHOTS === '1') {
    await mkdir('.verification', { recursive: true });
    await page.screenshot({
      path: '.verification/t008-club-applications-list-1366.png',
      fullPage: false,
    });
  }

  // 4. Independent Season Manager logs in and approves Version 2
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, manager);
  await page.goto(`/workspace/seasons/${season.id}/club-applications`);
  await page.getByLabel('Tìm hồ sơ tham dự').fill(club.code);
  await page.getByRole('button', { name: `Chi tiết hồ sơ ${club.name}` }).click();

  const managerDrawer = page.getByRole('dialog').filter({ hasText: club.name });
  await managerDrawer.getByRole('button', { name: 'Phê duyệt hồ sơ' }).click();
  const approveDialog = page.getByRole('dialog', { name: 'Phê duyệt hồ sơ tham dự câu lạc bộ' });
  await approveDialog.getByLabel(/Lý do/).fill('Hồ sơ đạt yêu cầu tham dự giải đấu.');
  await approveDialog.getByRole('button', { name: 'Phê duyệt hồ sơ' }).click();

  await expect(managerDrawer.getByText('Nội dung chính thức')).toBeVisible();
  if (process.env.E2E_CAPTURE_SCREENSHOTS === '1') {
    await page.screenshot({
      path: '.verification/t008-club-application-approved-1366.png',
      fullPage: false,
    });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('T008: Late-received BM1 requires independent timing exception approval before submission', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const { officer, manager, season, club, stadium, player } = await seedClubApplicationScenario({
    lateWindow: true,
  });

  await login(page, officer);
  await page.goto(`/workspace/seasons/${season.id}/club-applications`);
  await page.getByRole('button', { name: 'Tạo hồ sơ tham dự' }).click();
  const dialog = page.getByRole('dialog', { name: 'Tạo hồ sơ đăng ký tham dự câu lạc bộ' });

  await pickOption(dialog, page, 'Câu lạc bộ', `${club.name} (${club.code})`, club.code);
  await dialog.getByLabel('Huấn luyện viên trưởng').fill('HLV Ngoài Hạn');
  await pickOption(
    dialog,
    page,
    'Sân nhà đăng ký',
    `${stadium.name} (${stadium.code})`,
    stadium.code,
  );
  await dialog.getByLabel('Người đại diện').fill('Trần Ngoài Hạn');
  await dialog.getByLabel('Số điện thoại đại diện').fill('0912345678');
  await dialog.getByLabel('Địa chỉ liên hệ').fill('200 Late Ave');
  await dialog.getByRole('button', { name: 'Thêm cầu thủ' }).click();
  await pickOption(
    dialog,
    page,
    'Chọn cầu thủ dự kiến',
    `${player.fullName} (${player.code} · CM)`,
    player.code,
  );
  await dialog.getByRole('button', { name: 'Lưu bản nháp' }).click();

  const drawer = page.getByRole('dialog').filter({ hasText: club.name });
  await drawer.getByRole('button', { name: 'Ghi nhận tiếp nhận' }).click();
  await page.getByRole('button', { name: 'Xác nhận tiếp nhận' }).click();
  await expect(drawer.getByText(/Tiếp nhận ngoài hạn/)).toBeVisible();

  // Propose timing exception
  await drawer.getByRole('button', { name: 'Đề xuất ngoại lệ tiếp nhận' }).click();
  const exDialog = page.getByRole('dialog', { name: 'Đề xuất ngoại lệ tiếp nhận ngoài hạn' });
  await exDialog.getByLabel('Lý do đề xuất ngoại lệ').fill('Gián đoạn đường truyền hồ sơ.');
  await exDialog.getByLabel('Căn cứ xác nhận').fill('Công văn số 22/BTC-2026.');
  await exDialog.getByRole('button', { name: 'Gửi đề xuất ngoại lệ' }).click();
  await expect(drawer.getByText('Đề xuất lần 1')).toBeVisible();

  // Independent Season Manager approves the timing exception
  await drawer.getByRole('button', { name: 'Đóng' }).last().click();
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, manager);
  await page.goto(`/workspace/seasons/${season.id}/club-applications`);
  await page.getByLabel('Tìm hồ sơ tham dự').fill(club.code);
  await page.getByRole('button', { name: `Chi tiết hồ sơ ${club.name}` }).click();

  const managerDrawer = page.getByRole('dialog').filter({ hasText: club.name });
  await managerDrawer.getByRole('button', { name: 'Phê duyệt ngoại lệ' }).click();
  const approveEx = page.getByRole('dialog', { name: 'Phê duyệt ngoại lệ tiếp nhận' });
  await approveEx.getByLabel(/Lý do/).fill('Chấp thuận ngoại lệ cho đúng phiên bản 1.');
  await approveEx.getByRole('button', { name: 'Phê duyệt ngoại lệ' }).click();
  await expect(managerDrawer.getByText(/Đã phê duyệt ngoại lệ tiếp nhận/)).toBeVisible();
});
