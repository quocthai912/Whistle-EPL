import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import {
  browserAccount,
  browserAdministration,
} from '../../backend/tests/fixtures/browser-fixtures';
import { assertIsolatedTarget } from '../../backend/tests/fixtures/isolated-target.guard';
import { DatabaseService } from '../../backend/src/platform/database.service';
import { login } from './login';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const accountRow = (page: Page, username: string) =>
  page.getByRole('row').filter({ has: page.getByText(username, { exact: true }) });

test('a direct season-creation grant lets a create-only account create without reading seasons', async ({
  page,
}) => {
  const {
    accounts: [admin],
  } = await browserAdministration();
  const creator = await browserAccount();

  await login(page, admin);
  await page.goto('/admin/accounts');
  await accountRow(page, creator.username).getByRole('button', { name: 'Chi tiết' }).click();
  const detailDrawer = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('tablist', { name: 'Chi tiết phân quyền' }) });
  await detailDrawer.getByRole('tab', { name: 'Quyền hệ thống' }).click();
  const createSeasonGrant = page
    .getByRole('tabpanel')
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Quyền Tạo mùa giải', exact: true }) });
  await createSeasonGrant.getByRole('button', { name: 'Cấp quyền', exact: true }).click();
  await button(page, 'Xác nhận').click();
  await expect(createSeasonGrant.getByText('Đã cấp', { exact: true })).toBeVisible();
  await detailDrawer.getByText('Đóng', { exact: true }).click();
  await expect(detailDrawer).not.toBeVisible();

  await button(page, 'Đăng xuất').click();
  await expect(page).toHaveURL(/login$/);
  await login(page, creator);

  const seasonRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/api/v1/seasons'))
      seasonRequests.push(request.method());
  });
  await page.goto('/workspace/seasons');
  await expect(page.getByRole('heading', { name: 'Quản lý mùa giải' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Quản lý mùa giải' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tài khoản và phân quyền' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ủy quyền nghiệp vụ' })).toHaveCount(0);

  await button(page, 'Tạo mùa giải').click();
  const dialog = page.getByRole('dialog', { name: 'Tạo mùa giải mới' });
  await dialog.getByLabel(/^Mã mùa giải/).fill('  e2e_' + randomUUID().slice(0, 8) + '  ');
  await dialog.getByLabel(/^Tên mùa giải/).fill('  Mùa   giải kiểm thử trình duyệt  ');
  await dialog.getByLabel(/^Tên giải đấu/).fill('  Giải Ngoại hạng kiểm thử  ');
  await dialog.getByLabel(/^Ngày bắt đầu/).fill('2028-08-15');
  await dialog.getByLabel(/^Ngày kết thúc/).fill('2029-05-23');
  await dialog.getByRole('button', { name: 'Xác nhận tạo mùa giải' }).click();

  await expect(page.getByRole('status')).toContainText('Đã tạo mùa giải. Mã định danh:');
  await expect(page.getByRole('status')).toContainText('phiên bản 1');
  expect(seasonRequests).toEqual(['POST']);
});

test('an assigned manager can search, edit, and inspect history for only their assigned seasons', async ({
  page,
}) => {
  const {
    accounts: [, , manager],
    seasons: [assignedSeason, otherSeason],
  } = await browserAdministration();
  await login(page, manager);

  const seasonRequests: { method: string; pathname: string; actionCode: string | null }[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith('/api/v1/seasons'))
      seasonRequests.push({
        method: request.method(),
        pathname: url.pathname,
        actionCode: url.searchParams.get('actionCode'),
      });
  });
  await page.goto('/workspace/seasons');

  await expect(page.getByRole('heading', { name: 'Quản lý mùa giải' })).toBeVisible();
  await expect(page.getByText(assignedSeason.code, { exact: true })).toBeVisible();
  await expect(page.getByText(otherSeason.code, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Tạo mùa giải', exact: true })).toHaveCount(0);

  await page.getByLabel('Tìm mùa giải').fill(assignedSeason.code);
  const row = page.getByRole('row').filter({ hasText: assignedSeason.code });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Chi tiết' }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByText(assignedSeason.name, { exact: true })).toBeVisible();
  await drawer.getByRole('button', { name: 'Chỉnh sửa thông tin mùa giải' }).click();
  await drawer.getByLabel('Tên mùa giải *').fill('  Mùa   giải đã chỉnh sửa  ');
  await drawer.getByRole('button', { name: 'Lưu thông tin' }).click();
  await expect(drawer.getByText('Đã cập nhật thông tin mùa giải.', { exact: true })).toBeVisible();
  await expect(drawer.getByText('Mùa giải đã chỉnh sửa', { exact: true })).toBeVisible();

  await drawer.getByRole('tab', { name: 'Lịch sử' }).click();
  await expect(drawer.getByText('Cập nhật thông tin mùa giải', { exact: true })).toBeVisible();
  await expect(drawer.getByText(assignedSeason.name, { exact: true })).toBeVisible();
  await drawer.getByLabel('Loại thao tác').selectOption('SEASON_UPDATED');
  await drawer.getByRole('button', { name: 'Áp dụng bộ lọc' }).click();
  await expect
    .poll(() =>
      seasonRequests.some(
        ({ method, pathname, actionCode }) =>
          method === 'GET' &&
          pathname === `/api/v1/seasons/${assignedSeason.id}/history` &&
          actionCode === 'SEASON_UPDATED',
      ),
    )
    .toBe(true);
  await expect(drawer.getByText('Cập nhật thông tin mùa giải', { exact: true })).toBeVisible();

  expect(
    seasonRequests.some(
      ({ method, pathname }) => method === 'GET' && pathname === '/api/v1/seasons',
    ),
  ).toBe(true);
  expect(seasonRequests.some(({ method }) => method === 'PATCH')).toBe(true);
  expect(
    seasonRequests.some(({ pathname }) => pathname === `/api/v1/seasons/${otherSeason.id}`),
  ).toBe(false);
});

test('closed season metadata is displayed read-only without lifecycle actions', async ({
  page,
}) => {
  const {
    accounts: [, , manager],
    seasons: [season],
  } = await browserAdministration();
  const database = new DatabaseService(
    assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''),
  );
  try {
    await database.client.season.update({ where: { id: season.id }, data: { state: 'CLOSED' } });
  } finally {
    await database.close();
  }

  await login(page, manager);
  await page.goto('/workspace/seasons');
  const row = page.getByRole('row').filter({ hasText: season.code });
  await expect(row.getByText('Đã đóng', { exact: true })).toBeVisible();
  await row.getByRole('button', { name: 'Chi tiết' }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByText(/chỉ có thể chỉnh sửa sau khi được mở lại/i)).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Chỉnh sửa thông tin mùa giải' })).toHaveCount(0);
  await expect(drawer.getByRole('button', { name: /đóng mùa giải|mở lại mùa giải/i })).toHaveCount(
    0,
  );
});
