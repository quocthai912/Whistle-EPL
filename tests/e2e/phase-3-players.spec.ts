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
  await control.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  if (search) {
    await control.click();
    await control.fill(search);
    await expect(control).toHaveAttribute('aria-expanded', 'true');
    const popup = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
    const option = popup.locator('.ant-select-item-option', { hasText: optionLabel }).first();
    await expect(popup.locator('.ant-select-item-option')).toHaveCount(1);
    await expect(option).toHaveClass(/ant-select-item-option-active/);
    await control.press('Enter');
  } else {
    await control.locator('..').click();
    await expect(control).toHaveAttribute('aria-expanded', 'true');
    const popup = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
    const option = popup.locator('.ant-select-item-option', { hasText: optionLabel }).first();
    await expect(option).toBeVisible();
    await option.hover();
    await expect(option).toHaveClass(/ant-select-item-option-active/);
    await control.press('Enter');
  }
  await expect(control).toHaveAttribute('aria-expanded', 'false');
}

const portraitPng = {
  name: 'portrait-synthetic.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAIAAAAPTiitAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFUlEQVQYlWMI1dlGEDGMKmKgWhAAADOpkckQKh4EAAAAAElFTkSuQmCC',
    'base64',
  ),
};

async function createPlayerMasterUser() {
  const { accounts } = await browserAdministration();
  const user = await browserAccount(false);
  const db = new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
  try {
    await db.client.sharedMasterGrant.create({
      data: {
        accountId: user.id,
        masterKind: 'PLAYER_MASTER',
        grantedBy: accounts[0].id,
        grantedAt: await db.now(),
      },
    });
    return { user, unprivileged: accounts[4] };
  } finally {
    await db.close();
  }
}

test('T011: Player profile creation, distinct-person duplicate review, D036 correction, portrait upload/fallback and form preservation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const { user, unprivileged } = await createPlayerMasterUser();
  const uniqueCode = `007_${randomUUID().slice(0, 6).toUpperCase()}`;
  const secondCode = `008_${randomUUID().slice(0, 6).toUpperCase()}`;
  const playerName = `Nguyễn Minh Trí ${uniqueCode}`;

  // 1. Unprivileged user cannot access /workspace/players
  await login(page, unprivileged);
  await page.goto('/workspace/players');
  await expect(page.getByText('Bạn chưa có quyền truy cập')).toBeVisible();

  // 2. Authorized PLAYER_MASTER grantee logs in and navigates to /workspace/players
  await page.getByRole('button', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, user);
  await page.getByRole('link', { name: 'Quản lý hồ sơ cầu thủ' }).click();
  await expect(page).toHaveURL(/\/workspace\/players$/);

  // 3. Form preserves valid values on validation error, then creates first player cleanly
  await page.getByRole('button', { name: 'Thêm cầu thủ' }).click();
  const dialog = page.getByRole('dialog', { name: 'Thêm hồ sơ cầu thủ' });
  await dialog.getByLabel('Họ và tên').fill(playerName);
  await dialog.getByRole('button', { name: 'Tạo hồ sơ' }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  // Valid entered full name is retained!
  await expect(dialog.getByLabel('Họ và tên')).toHaveValue(playerName);

  await dialog.getByLabel('Mã cầu thủ').fill(uniqueCode);
  // Select Nationality and Position cleanly, then fill DateOnlyPicker
  await pickOption(dialog, page, 'Quốc tịch', 'Việt Nam (VN)', 'Việt Nam');
  await pickOption(dialog, page, 'Vị trí thi đấu', 'CAM · Tiền vệ tấn công trung tâm');
  const dobInput = dialog.getByLabel('Ngày sinh');
  await dobInput.fill('12/04/1999');
  await dobInput.press('Tab');
  await dialog.getByRole('button', { name: 'Tạo hồ sơ' }).click();
  await expect(dialog).not.toBeVisible();

  // Search for created player
  await page.getByLabel('Tìm cầu thủ').fill(uniqueCode);
  await expect(page.getByRole('cell', { name: playerName, exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: '12/04/1999', exact: true })).toBeVisible();

  // 4. Distinct-person duplicate review modal (same normalized name, birthDate, nationality)
  await page.getByRole('button', { name: 'Thêm cầu thủ' }).click();
  const dupDialog = page.getByRole('dialog', { name: 'Thêm hồ sơ cầu thủ' });
  await dupDialog.getByLabel('Mã cầu thủ').fill(secondCode);
  await dupDialog.getByLabel('Họ và tên').fill(playerName.toLowerCase());
  await pickOption(dupDialog, page, 'Quốc tịch', 'Việt Nam (VN)', 'Việt Nam');
  await pickOption(dupDialog, page, 'Vị trí thi đấu', 'ST · Tiền đạo cắm');
  const dob2 = dupDialog.getByLabel('Ngày sinh');
  await dob2.fill('12/04/1999');
  await dob2.press('Tab');
  await dupDialog.getByRole('button', { name: 'Tạo hồ sơ' }).click();

  await expect(dupDialog.getByText('Cảnh báo nghi ngờ trùng hồ sơ')).toBeVisible();
  await expect(dupDialog.getByText(uniqueCode)).toBeVisible();
  await dupDialog.getByRole('checkbox').check();
  await dupDialog
    .getByLabel('Lý do xác nhận')
    .fill('Hai cầu thủ độc lập trùng họ tên, ngày sinh và quốc tịch.');
  await dupDialog.getByRole('button', { name: 'Tạo hồ sơ' }).click();
  await expect(dupDialog).not.toBeVisible();

  // 5. Open profile drawer: verify accessible fallback, upload portrait, verify rendered <img>, remove back to fallback
  await page.getByLabel('Tìm cầu thủ').fill(uniqueCode);
  await page.getByRole('button', { name: `Chi tiết ${playerName}`, exact: true }).click();
  const drawer = page.getByRole('dialog').filter({ hasText: 'Hồ sơ cầu thủ' });
  await expect(drawer.getByRole('img', { name: /chưa có ảnh khả dụng/ })).toBeVisible();

  await drawer.getByLabel('Chọn ảnh chân dung').setInputFiles(portraitPng);
  await drawer.getByRole('button', { name: 'Tải ảnh lên' }).click();
  const portraitImg = drawer.locator('img');
  await expect(portraitImg).toBeVisible();
  await expect
    .poll(() => portraitImg.evaluate((img) => (img as HTMLImageElement).naturalWidth > 0))
    .toBe(true);

  if (process.env.E2E_CAPTURE_SCREENSHOTS === '1') {
    await mkdir('.verification', { recursive: true });
    await page.screenshot({ path: '.verification/t011-player-drawer-1366.png', fullPage: false });
  }

  // Remove portrait -> returns to accessible fallback
  await drawer.getByRole('button', { name: 'Gỡ ảnh chân dung' }).click();
  await drawer.getByRole('button', { name: 'Xác nhận gỡ ảnh' }).click();
  await expect(drawer.getByRole('img', { name: /chưa có ảnh khả dụng/ })).toBeVisible();

  // A changed birth date also needs correction evidence in the ordinary edit form.
  await drawer.getByRole('button', { name: 'Cập nhật thông tin' }).click();
  const editDialog = page.getByRole('dialog', { name: 'Cập nhật hồ sơ cầu thủ' });
  await expect(editDialog.getByLabel('Lý do hiệu chỉnh')).toHaveCount(0);
  const editBirthDate = editDialog.getByLabel('Ngày sinh');
  await editBirthDate.fill('13/04/1999');
  await editBirthDate.press('Tab');
  await editDialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(editDialog.getByRole('alert')).toContainText('nhập đầy đủ lý do và căn cứ');
  await editDialog.getByLabel('Lý do hiệu chỉnh').fill('Sửa ngày sinh theo hồ sơ gốc.');
  await editDialog.getByLabel('Căn cứ hiệu chỉnh').fill('Giấy khai sinh đã đối chiếu.');
  await editDialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(editDialog).not.toBeVisible();
  await expect(drawer.getByText('13/04/1999', { exact: true })).toBeVisible();

  // 6. D036 Correction with reason + basis & verify history
  await drawer.getByRole('button', { name: 'Hiệu chỉnh thông tin sai sót' }).click();
  const corrDialog = page.getByRole('dialog', { name: 'Hiệu chỉnh thông tin sai sót' });
  await pickOption(corrDialog, page, 'Vị trí thi đấu', 'RW · Tiền đạo cánh phải');
  await corrDialog.getByLabel('Lý do hiệu chỉnh').fill('Cập nhật lại vị trí theo hồ sơ gốc.');
  await corrDialog.getByLabel('Căn cứ hiệu chỉnh').fill('Công văn đính chính số 05/2026.');
  await corrDialog.getByRole('button', { name: 'Lưu hiệu chỉnh' }).click();
  await expect(corrDialog).not.toBeVisible();

  await drawer.getByRole('button', { name: 'Lịch sử' }).click();
  const positionCorrection = drawer.getByRole('article').filter({ hasText: 'CAM → RW' });
  await expect(positionCorrection.getByText('Đính chính hồ sơ cầu thủ')).toBeVisible();
});

test('T011: Vietnamese search and scoped pagination across >20 players without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const { user } = await createPlayerMasterUser();
  const prefix = `PG_${randomUUID().slice(0, 6).toUpperCase()}`;
  const db = new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
  try {
    await db.client.player.createMany({
      data: Array.from({ length: 24 }, (_, idx) => ({
        id: randomUUID(),
        code: `${prefix}_${String(idx + 1).padStart(2, '0')}`,
        fullName: `Cầu thủ Kiểm thử Phân trang ${String(idx + 1).padStart(2, '0')} ${prefix}`,
        birthDate: new Date('2001-01-15T00:00:00.000Z'),
        nationalityCode: 'VN',
        positionCode: 'CM',
      })),
    });
  } finally {
    await db.close();
  }

  await login(page, user);
  await page.goto('/workspace/players');
  await page.getByLabel('Tìm cầu thủ').fill(prefix);
  await expect(page.getByText('Trang 1 / 2', { exact: true })).toBeVisible();
  if (process.env.E2E_CAPTURE_SCREENSHOTS === '1') {
    await mkdir('.verification', { recursive: true });
    await page.screenshot({ path: '.verification/t011-players-list-1366.png', fullPage: false });
  }
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.getByText('Trang 2 / 2', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
