import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { DatabaseService } from '../../backend/src/platform/database.service';
import { browserAdministration } from '../../backend/tests/fixtures/browser-fixtures';
import { assertIsolatedTarget } from '../../backend/tests/fixtures/isolated-target.guard';
import { login } from './login';
import { openOptions } from './select-option';

test('MH13 Club form, current logo and D099 cycle use the administration visual system', async ({
  page,
}) => {
  const {
    accounts: [admin, , manager],
  } = await browserAdministration();
  const db = new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
  try {
    await db.client.sharedMasterGrant.create({
      data: {
        accountId: manager.id,
        masterKind: 'CLUB_MASTER',
        grantedBy: admin.id,
        grantedAt: await db.now(),
      },
    });
  } finally {
    await db.close();
  }
  await login(page, manager);
  await page.goto('/workspace/clubs');
  await expect(page.getByRole('heading', { name: 'Quản lý hồ sơ câu lạc bộ' })).toHaveCSS(
    'font-family',
    /Be Vietnam Pro/,
  );
  const code = `E2E_CLUB_${randomUUID().slice(0, 8).toUpperCase()}`;
  await page.getByRole('button', { name: 'Thêm câu lạc bộ' }).click();
  const create = page.getByRole('dialog', { name: 'Thêm câu lạc bộ' });
  const name = `Câu lạc bộ ${code.slice(-8)}`;
  await expect(create.getByLabel('Tên câu lạc bộ')).toHaveCSS('border-radius', '8px');
  await create.getByLabel('Tên câu lạc bộ').fill(name);
  await create.getByLabel('Mã CLB').fill(code);
  await create.getByLabel('Tên viết tắt').fill('CLB');
  await create.getByRole('button', { name: 'Lưu hồ sơ' }).click();
  await expect(create).not.toBeVisible();
  await page.getByLabel('Tìm câu lạc bộ').fill(code);
  await page.getByRole('button', { name: `Chi tiết ${name}` }).click();
  const profile = page.getByRole('dialog').filter({ hasText: 'Hồ sơ câu lạc bộ' });
  await expect(
    profile.getByRole('img', { name: `Logo của ${name} chưa có ảnh khả dụng` }),
  ).toBeVisible();
  await profile.getByLabel('Chọn ảnh logo').setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAIAAAAPTiitAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFUlEQVQYlWMI1dlGEDGMKmKgWhAAADOpkckQKh4EAAAAAElFTkSuQmCC',
      'base64',
    ),
  });
  await profile.getByRole('button', { name: 'Tải logo lên' }).click();
  await expect(profile.getByRole('img', { name: `Logo của ${name}`, exact: true })).toBeVisible();
  await profile.getByRole('button', { name: 'Ngừng sử dụng hồ sơ' }).click();
  const confirmation = page.getByRole('dialog', { name: 'Ngừng sử dụng hồ sơ' });
  await confirmation.getByLabel('Lý do').fill('Kiểm thử ngừng sử dụng.');
  await confirmation.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(profile.getByRole('button', { name: 'Sử dụng lại hồ sơ' })).toBeVisible();
  await profile.getByRole('button', { name: 'Lịch sử' }).click();
  await expect(profile.getByText('Kiểm thử ngừng sử dụng.')).toBeVisible();
});

test('MH17 Stadium shows real filters and only approved master fields', async ({ page }) => {
  const {
    accounts: [admin, , , scheduler],
  } = await browserAdministration();
  const db = new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
  try {
    await db.client.sharedMasterGrant.create({
      data: {
        accountId: scheduler.id,
        masterKind: 'STADIUM_MASTER',
        grantedBy: admin.id,
        grantedAt: await db.now(),
      },
    });
  } finally {
    await db.close();
  }
  await login(page, scheduler);
  await page.goto('/workspace/stadiums');
  await expect(page.getByRole('heading', { name: 'Quản lý sân vận động' })).toBeVisible();
  await expect(page.getByText('Tổng số sân')).toBeVisible();
  const menu = await openOptions(page, 'Trạng thái sân vận động');
  const active = menu.getByRole('option', { name: 'Đang sử dụng', exact: true });
  await active.hover();
  await expect(active).toHaveClass(/ant-select-item-option-active/);
  await active.click();
  await page.getByRole('button', { name: 'Thêm sân vận động' }).click();
  const modal = page.getByRole('dialog', { name: 'Thêm sân vận động' });
  await expect(modal.getByLabel('Địa điểm')).toBeVisible();
  await expect(modal.getByLabel('Sức chứa')).toHaveCount(0);
  const code = `E2E_GROUND_${randomUUID().slice(0, 8).toUpperCase()}`;
  await modal.getByLabel('Mã sân').fill(code);
  await modal.getByLabel('Tên sân vận động').fill(`Sân ${code.slice(-8)}`);
  await modal.getByRole('button', { name: 'Lưu hồ sơ' }).click();
  await expect(page.getByRole('cell', { name: code, exact: true })).toBeVisible();
});
