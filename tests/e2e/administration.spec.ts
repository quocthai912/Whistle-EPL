import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import {
  browserAdministration,
  browserAccount,
} from '../../backend/tests/fixtures/browser-fixtures';

async function login(page: Page, account: { username: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('TÊN ĐĂNG NHẬP', { exact: false }).fill(account.username);
  await page.getByLabel(/^MẬT KHẨU \*/).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/internal$/);
}
const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const accountRow = (page: Page, username: string) =>
  page.getByRole('row').filter({ has: page.getByText(username, { exact: true }) });

test('checks direct navigation and administrator cancellation, account creation and season assignment', async ({
  page,
  browser,
  baseURL,
}, info) => {
  const {
    accounts: [admin],
    seasons: [season],
  } = await browserAdministration();
  const unauthorized = await browser.newPage({ baseURL });
  try {
    await unauthorized.goto('/admin/accounts');
    await expect(unauthorized).toHaveURL(/login$/);
    await login(unauthorized, await browserAccount());
    await unauthorized.goto('/admin/delegations');
    await expect(unauthorized.getByRole('alert')).toContainText(
      'Bạn không có quyền truy cập trang này.',
    );
  } finally {
    await unauthorized.close();
  }

  await login(page, admin);
  await page.getByRole('link', { name: 'Tài khoản và phân quyền' }).click();
  await expect(
    page.getByRole('heading', { name: 'Quản lý tài khoản và phân quyền' }),
  ).toBeVisible();
  const code = 'E2E-' + randomUUID().slice(0, 8).toUpperCase();
  const username = 'browser.staff.' + randomUUID().slice(0, 8);
  await button(page, '+ Thêm tài khoản mới').click();
  const create = page.getByRole('dialog', { name: 'Thêm tài khoản mới' });
  await create.getByRole('textbox', { name: 'Mã nhân sự *', exact: true }).fill(code);
  await button(page, 'Hủy').click();
  await expect(page.getByText(code, { exact: true })).toHaveCount(0);
  await button(page, '+ Thêm tài khoản mới').click();
  await create.getByRole('textbox', { name: 'Mã nhân sự *', exact: true }).fill(code);
  await create.getByLabel(/Họ và tên/).fill('Nhân viên quản trị kiểm thử');
  await create.getByLabel(/Tên đăng nhập/i).fill(username);
  await create.getByLabel(/Mật khẩu tạm/).fill('Synthetic temporary pass ' + randomUUID());
  await button(page, 'Xác nhận').click();
  const row = accountRow(page, username);
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Chi tiết' }).click();
  await page.getByRole('tab', { name: 'Phân công mùa giải' }).click();
  await button(page, 'Thêm phân công').click();
  const modal = page.getByRole('dialog', { name: 'Thêm phân công', exact: true });
  await modal.getByLabel(/Mùa giải/).selectOption(season.id);
  await modal.getByLabel(/Vai trò/).selectOption('SCHEDULING_OFFICER');
  await button(page, 'Xác nhận').click();
  await expect(row).toContainText('1 phân công mùa giải');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `.verification/mh08-${info.project.name}.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('requires explicit review before retrying a stale account edit', async ({ page, context }) => {
  const {
    accounts: [admin, target],
  } = await browserAdministration();
  await login(page, admin);
  await page.goto('/admin/accounts');
  const second = await context.newPage();
  try {
    await second.goto('/admin/accounts');
    for (const tab of [page, second]) {
      await accountRow(tab, target.username).getByRole('button', { name: 'Chi tiết' }).click();
      await button(tab, 'Sửa họ và tên').click();
    }
    await page.getByLabel(/Họ và tên/).fill('Tên mới đã lưu');
    await second.getByLabel(/Họ và tên/).fill('Tên nhập ở cửa sổ thứ hai');
    await button(page, 'Xác nhận').click();
    await expect(accountRow(page, target.username)).toContainText('Tên mới đã lưu');
    await button(second, 'Xác nhận').click();
    await expect(second.getByRole('alert')).toContainText('Dữ liệu đã thay đổi');
    await expect(second.getByLabel(/Họ và tên/)).toHaveValue('Tên nhập ở cửa sổ thứ hai');
    await button(second, 'Tải dữ liệu mới để xem lại').click();
    await expect(second.getByRole('dialog', { name: 'Chỉnh sửa tài khoản' })).toContainText(
      'Tên mới đã lưu',
    );
    await button(second, 'Dùng phiên bản đã xem').click();
    await button(second, 'Xác nhận').click();
    await expect(accountRow(second, target.username)).toContainText('Tên nhập ở cửa sổ thứ hai');
  } finally {
    await second.close();
  }
});

test('manager submits a real delegation and an independent administrator grants and revokes it', async ({
  page,
  browser,
  baseURL,
}, info) => {
  const {
    accounts: [admin, , manager, recipient],
    seasons: [season],
  } = await browserAdministration();
  await login(page, manager);
  await page.goto('/admin/accounts');
  await expect(page.getByRole('alert')).toContainText('Bạn không có quyền truy cập trang này.');
  await page.goto('/admin/delegations');
  await button(page, '+ Tạo đề xuất ủy quyền').click();
  await page.getByLabel(/Nghiệp vụ \*/).selectOption('APPROVE_SCHEDULE_ADJUSTMENT');
  await page.getByLabel(/Người nhận \*/).selectOption(recipient.id);
  const end = new Date(Date.now() + 24 * 3600000 + 7 * 3600000).toISOString().slice(0, 16);
  await page.getByLabel(/Kết thúc \(giờ Việt Nam\)/).fill(end);
  await page.getByLabel(/^Lý do$/).fill('Kiểm thử đề xuất điều chỉnh lịch');
  await button(page, 'Xác nhận').click();
  await button(page, 'Gửi đề xuất').click();
  await button(page, 'Xác nhận').click();
  await expect(page.getByRole('cell', { name: 'Chờ xử lý', exact: true })).toBeVisible();

  const administration = await browser.newPage({ baseURL });
  try {
    await login(administration, admin);
    await administration.goto('/admin/delegations');
    await administration.getByRole('combobox', { name: /Mùa giải/ }).selectOption(season.id);
    await button(administration, 'Cấp ủy quyền').click();
    await button(administration, 'Xác nhận').click();
    await expect(administration.getByRole('cell', { name: 'Đã cấp', exact: true })).toBeVisible();
    await administration.evaluate(() => document.fonts.ready);
    await administration.screenshot({ path: `.verification/mh09-${info.project.name}.png` });
    await administration.getByRole('tab', { name: 'Ủy quyền đã cấp' }).click();
    await button(administration, 'Thu hồi ủy quyền').click();
    await administration.getByLabel(/Lý do/).fill('Thu hồi theo quy trình kiểm thử');
    await button(administration, 'Xác nhận').click();
    await expect(administration.getByRole('cell', { name: /Đã thu hồi/ })).toBeVisible();
    await administration.getByRole('tab', { name: 'Đề xuất ủy quyền' }).click();
    await expect(administration.getByRole('cell', { name: 'Đã cấp', exact: true })).toBeVisible();
  } finally {
    await administration.close();
  }
});
