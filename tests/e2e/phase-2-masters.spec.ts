import { randomUUID } from 'node:crypto';
import { expect, test, type Locator } from '@playwright/test';
import { DatabaseService } from '../../backend/src/platform/database.service';
import {
  browserAdministration,
  browserMasterManager,
} from '../../backend/tests/fixtures/browser-fixtures';
import { assertIsolatedTarget } from '../../backend/tests/fixtures/isolated-target.guard';
import { login } from './login';
import { openOptions } from './select-option';

/** Exercises the user-visible spacing invariant, including the native scrollbar gutter. */
async function expectBalancedDialog(dialog: Locator) {
  await expect
    .poll(async () =>
      dialog.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const form = element.querySelector('form')!.getBoundingClientRect();
        const heading = element.querySelector('.ant-modal-title')!.getBoundingClientRect();
        return Math.max(
          Math.abs(form.left - box.left - (box.right - form.right)),
          Math.abs(form.left - heading.left),
        );
      }),
    )
    .toBeLessThanOrEqual(1);
}

const logoFixture = {
  name: 'synthetic.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAIAAAAPTiitAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFUlEQVQYlWMI1dlGEDGMKmKgWhAAADOpkckQKh4EAAAAAElFTkSuQmCC',
    'base64',
  ),
};

for (const viewport of [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1366, height: 768 },
]) {
  test(`master list preserves all 25 records and usable controls at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const manager = await browserMasterManager('CLUB_MASTER');
    const prefix = 'VIEW_' + randomUUID().slice(0, 8).toUpperCase();
    const records = Array.from({ length: 25 }, (_, index) => ({
      id: randomUUID(),
      code: prefix + '_' + String(index).padStart(2, '0'),
      name: 'Câu lạc bộ kiểm thử màn hình ' + index,
      abbreviation: 'UI' + index,
    }));
    const db = new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
    try {
      await db.client.club.createMany({ data: records });
    } finally {
      await db.close();
    }
    await login(page, manager);
    await page.goto('/workspace/clubs');
    await page.getByLabel('Tìm câu lạc bộ').fill(prefix);
    await expect(page.getByText('Trang 1 / 2', { exact: true })).toBeVisible();
    await expect
      .poll(async () => {
        const codes = await page
          .getByRole('table')
          .locator('tbody tr td:nth-child(3)')
          .allTextContents();
        return codes.length === 20 && codes.every((code) => code.startsWith(prefix));
      })
      .toBe(true);
    const first = await page
      .getByRole('table')
      .locator('tbody tr td:nth-child(3)')
      .allTextContents();
    expect(first).toHaveLength(20);
    await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
    await expect(page.getByText('Trang 2 / 2', { exact: true })).toBeVisible();
    const second = await page
      .getByRole('table')
      .locator('tbody tr td:nth-child(3)')
      .allTextContents();
    expect(second).toHaveLength(5);
    expect(new Set([...first, ...second])).toEqual(new Set(records.map(({ code }) => code)));
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const scroll = page.getByRole('table').locator('..');
    await scroll.evaluate((element) => {
      element.scrollLeft = element.scrollWidth;
    });
    const container = await scroll.boundingBox();
    const action = await page.getByRole('table').getByRole('button').last().boundingBox();
    expect(container).not.toBeNull();
    expect(action).not.toBeNull();
    expect(action!.x).toBeGreaterThanOrEqual(container!.x);
    expect(action!.x + action!.width).toBeLessThanOrEqual(container!.x + container!.width);
    await expect(page.getByRole('button', { name: 'Thêm câu lạc bộ' })).toBeVisible();
    await page.getByRole('button', { name: 'Thêm câu lạc bộ' }).click();
    const form = page.getByRole('dialog', { name: 'Thêm câu lạc bộ' });
    await expect(form.getByLabel('Tên câu lạc bộ')).toBeVisible();
    await form.getByLabel('Tên câu lạc bộ').fill('Câu lạc bộ Đà Nẵng');
    await form.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(form).not.toBeVisible();
    await page.getByRole('table').getByRole('button').last().click();
    const profile = page.getByRole('dialog').filter({ hasText: 'Hồ sơ câu lạc bộ' });
    const fallback = profile.getByRole('img', { name: /chưa có ảnh khả dụng/ });
    await expect(fallback).toBeVisible();
    await profile.getByLabel('Chọn ảnh logo').setInputFiles(logoFixture);
    await profile.getByRole('button', { name: 'Tải logo lên' }).click();
    const logo = profile.locator('img');
    await expect(logo).toBeVisible();
    await expect
      .poll(() => logo.evaluate((image) => (image as HTMLImageElement).naturalWidth > 0))
      .toBe(true);
    for (const control of [
      logo,
      profile.getByLabel('Chọn ảnh thay logo'),
      profile.getByRole('button', { name: 'Gỡ logo', exact: true }),
    ]) {
      await control.scrollIntoViewIfNeeded();
      const bounds = await control.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    }
    await profile.getByRole('button', { name: 'Gỡ logo', exact: true }).click();
    await profile.getByRole('button', { name: 'Xác nhận gỡ logo' }).click();
    await expect(fallback).toBeVisible();
    await profile.getByRole('button', { name: 'Đóng', exact: true }).last().click();
    await expect(profile).not.toBeVisible();
  });
}

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
  await expectBalancedDialog(create);
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
  await profile.getByLabel('Chọn ảnh logo').setInputFiles(logoFixture);
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
  await expectBalancedDialog(modal);
  await expect(modal.getByLabel('Sức chứa')).toHaveCount(0);
  const code = `E2E_GROUND_${randomUUID().slice(0, 8).toUpperCase()}`;
  await modal.getByLabel('Mã sân').fill(code);
  await modal.getByLabel('Tên sân vận động').fill(`Sân ${code.slice(-8)}`);
  await modal.getByRole('button', { name: 'Lưu hồ sơ' }).click();
  await expect(page.getByRole('cell', { name: code, exact: true })).toBeVisible();
});

test('creating a club can upload its optional crest and opens the persisted profile', async ({
  page,
}) => {
  const manager = await browserMasterManager('CLUB_MASTER');
  const code = `LOGO_${randomUUID().slice(0, 8).toUpperCase()}`;
  await login(page, manager);
  await page.goto('/workspace/clubs');
  await page.getByRole('button', { name: 'Thêm câu lạc bộ', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Thêm câu lạc bộ' });
  await form.getByLabel('Mã CLB', { exact: true }).fill(code);
  await form.getByLabel('Tên câu lạc bộ', { exact: true }).fill(`Câu lạc bộ biểu trưng ${code}`);
  await form.getByLabel('Tên viết tắt', { exact: true }).fill('LOG');
  await form
    .getByLabel('Biểu trưng câu lạc bộ (không bắt buộc)', { exact: true })
    .setInputFiles(logoFixture);
  await form.getByRole('button', { name: 'Lưu hồ sơ', exact: true }).click();
  await expect(form).not.toBeVisible();
  await page.getByLabel('Tìm câu lạc bộ', { exact: true }).fill(code);
  await page
    .getByRole('row')
    .filter({ hasText: code })
    .getByRole('button', { name: /Chi tiết/ })
    .click();
  const profile = page.getByRole('dialog').filter({ hasText: 'Hồ sơ câu lạc bộ' });
  await expect(profile.locator('img')).toBeVisible();
  await expect
    .poll(() =>
      profile.locator('img').evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
});
