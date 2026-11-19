import { openOptions, selectOption } from './select-option';
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

test('MH11 drafts a close proposal from the season drawer and displays the current blocker', async ({
  page,
}) => {
  const {
    accounts: [, , manager],
    seasons: [assigned],
  } = await browserAdministration();
  await login(page, manager);
  await page.goto('/workspace/seasons');
  await page
    .getByRole('row')
    .filter({ hasText: assigned.code })
    .getByRole('button', { name: 'Chi tiết' })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Đề xuất đóng mùa giải' }).click();
  await expect(page.getByRole('tab', { name: 'Đề xuất đóng/mở mùa giải' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const draft = page.getByRole('dialog', { name: 'Tạo đề xuất' });
  await draft.getByLabel('Lý do đề xuất').fill('Rà soát trước khi kết thúc mùa giải.');
  await draft.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(draft).not.toBeVisible();
  await expect(page.getByText(/Cần bản tổng kết đã xác nhận/)).toBeVisible();
  await page.getByRole('button', { name: 'Chi tiết đề xuất' }).click();
  const request = page.getByRole('dialog').filter({ hasText: 'Phiên bản 1' });
  await expect(request.getByText('Rà soát trước khi kết thúc mùa giải.')).toBeVisible();
  await expect(request.getByRole('button', { name: 'Phê duyệt', exact: true })).toHaveCount(0);
});

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
  const starts = dialog.getByLabel(/^Ngày bắt đầu/);
  await starts.fill('14/08/2028');
  await starts.press('Tab');
  await starts.click();
  await page.locator('td[title="2028-08-15"]:visible').click();
  await expect(starts).toHaveValue('15/08/2028');
  // A picker blur must not erase the first submit's date-order error.
  await dialog.getByLabel(/^Ngày kết thúc/).fill('14/08/2028');
  await dialog.getByRole('button', { name: 'Xác nhận tạo mùa giải' }).click();
  await expect(dialog.getByRole('alert')).toContainText(
    'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
  );
  const startBox = await starts.boundingBox();
  const endBox = await dialog.getByLabel(/^Ngày kết thúc/).boundingBox();
  expect(Math.abs(startBox!.y - endBox!.y)).toBeLessThanOrEqual(1);
  expect(seasonRequests).toEqual([]);
  await dialog.getByLabel(/^Ngày kết thúc/).fill('23/05/2029');
  await dialog.getByRole('button', { name: 'Xác nhận tạo mùa giải' }).click();

  await expect(page.getByRole('status')).toContainText('Đã tạo mùa giải ');
  await expect(page.getByRole('status')).not.toContainText('Mã định danh');
  expect(seasonRequests).toEqual(['POST']);

  await button(page, 'Đăng xuất').click();
  await login(page, admin);
  await page.goto('/admin/audit');
  await expect(page.getByRole('cell', { name: 'Tạo mùa giải', exact: true }).first()).toBeVisible();
  await expect(page.getByRole('cell', { name: 'SEASON_CREATED', exact: true })).toHaveCount(0);
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
  const drawer = page.getByRole('dialog').first();
  await expect(drawer.getByText(assignedSeason.name, { exact: true })).toBeVisible();
  await drawer.getByRole('button', { name: 'Chỉnh sửa thông tin mùa giải' }).click();
  const editor = page.getByRole('dialog', { name: 'Chỉnh sửa thông tin mùa giải' });
  await expect(editor.getByLabel('Tên mùa giải *')).toHaveCSS('border-radius', '8px');
  await expect(editor.getByLabel('Tên giải đấu *')).toHaveCSS('border-radius', '8px');
  await expect(editor.getByLabel('Ngày bắt đầu *', { exact: true })).toHaveValue(
    /^\d{2}\/\d{2}\/\d{4}$/,
  );
  await expect(editor.getByLabel('Ngày kết thúc *', { exact: true })).toHaveValue(
    /^\d{2}\/\d{2}\/\d{4}$/,
  );
  await editor.getByLabel('Tên mùa giải *').fill('  Mùa   giải đã chỉnh sửa  ');
  await editor.getByRole('button', { name: 'Lưu thông tin' }).click();
  await expect(drawer.getByText('Đã cập nhật thông tin mùa giải.', { exact: true })).toBeVisible();
  await expect(drawer.getByText('Mùa giải đã chỉnh sửa', { exact: true })).toBeVisible();

  await drawer.getByRole('tab', { name: 'Lịch sử' }).click();
  await expect(drawer.getByLabel('Từ thời điểm', { exact: true })).toHaveAttribute(
    'placeholder',
    'DD/MM/YYYY HH:mm',
  );
  await expect(drawer.getByText('Cập nhật thông tin mùa giải', { exact: true })).toBeVisible();
  await expect(drawer.getByText(assignedSeason.name, { exact: true })).toBeVisible();
  const actions = await openOptions(page, 'Loại thao tác');
  const updateOption = actions.getByRole('option', { name: 'Cập nhật mùa giải' });
  await updateOption.hover();
  await expect(updateOption).toHaveClass(/ant-select-item-option-active/);
  await expect(updateOption).toHaveCSS('font-family', /Be Vietnam Pro/);
  await updateOption.click();
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

  await page.setViewportSize({ width: 390, height: 840 });
  for (const field of [
    drawer.getByLabel('Loại thao tác'),
    drawer.getByLabel('Từ thời điểm', { exact: true }),
    drawer.getByLabel('Đến trước thời điểm', { exact: true }),
  ]) {
    await expect
      .poll(async () => {
        const bounds = await field.boundingBox();
        return Boolean(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390);
      })
      .toBe(true);
  }
  const mobileActions = await openOptions(page, 'Loại thao tác', true);
  await expect(mobileActions.getByRole('option', { name: 'Cập nhật mùa giải' })).toBeVisible();
});

test('selects the same authorized regulation season from both entry points without page overflow', async ({
  page,
}) => {
  const {
    accounts: [, , manager],
    seasons: [season, outside],
  } = await browserAdministration();
  const db = new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
  const longName = 'Mùa giải thử bố cục ' + 'TênDài'.repeat(20);
  try {
    await db.client.season.update({
      where: { id: season.id },
      data: { name: longName },
    });
  } finally {
    await db.close();
  }
  await login(page, manager);
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 840 });
    await page.goto('/workspace/seasons');
    const row = page.getByRole('row').filter({ hasText: season.code });
    await expect(row).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    await row.getByRole('link', { name: 'Quy định', exact: true }).click();
    await expect(
      page.getByRole('combobox', { name: 'Mùa giải', exact: true }).locator('..'),
    ).toHaveText(longName);
    await expect(page.getByRole('region', { name: 'Quy định đang hiệu lực' })).toContainText(
      'Chưa có quy định hiệu lực',
    );
    await page.getByRole('tab', { name: 'Phiên bản và phê duyệt' }).click();
    await expect(page.getByRole('heading', { name: 'Phiên bản', exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(width);
    await page.getByRole('link', { name: 'Quản lý quy định mùa giải', exact: true }).click();
    const choices = page.getByRole('list', { name: 'Danh sách mùa giải' });
    await expect(choices).toContainText(season.code);
    await expect(choices).not.toContainText(outside.code);
    const choice = choices.getByRole('link', { name: new RegExp(season.code) });
    await expect(choice).toHaveCSS('text-decoration-line', 'none');
    if (width === 390) {
      await selectOption(page, 'Mùa giải', longName);
    } else {
      await choice.click();
    }
    await expect(page).toHaveURL(new RegExp(`${season.id}/regulations$`));
  }
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
  await expect(drawer.getByRole('button', { name: 'Đề xuất mở lại mùa giải' })).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Mở lại mùa giải', exact: true })).toHaveCount(0);
});
