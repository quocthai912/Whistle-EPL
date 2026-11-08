import { login } from './login';
import { openOptions, selectOption } from './select-option';
import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import {
  browserAdministration,
  browserAccount,
} from '../../backend/tests/fixtures/browser-fixtures';

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
  await page.screenshot({
    animations: 'disabled',
    path: `.verification/ui-review/mh08-create-${info.project.name}.png`,
  });
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
  await page.getByRole('tab', { name: 'Vai trò mùa giải' }).click();
  await button(page, 'Thêm phân công').click();
  await expect(page.getByRole('dialog', { name: 'Thêm phân công', exact: true })).toBeVisible();
  await selectOption(page, 'Mùa giải *', season.name + ' (' + season.code + ')');
  await selectOption(page, 'Vai trò *', 'Phụ trách lập lịch');
  await button(page, 'Xác nhận').click();
  await expect(row).toContainText('1 phân công mùa giải');
  for (const [index, name] of [
    'Hồ sơ tài khoản',
    'Vai trò mùa giải',
    'Phân quyền chung',
    'Quyền hệ thống',
  ].entries()) {
    await page.getByRole('tab', { name, exact: true }).click();
    await page.screenshot({
      path: `.verification/ui-review/mh08-detail-${index}-${info.project.name}.png`,
    });
  }
  await page.setViewportSize({ width: 360, height: 800 });
  const drawer = page.getByRole('dialog');
  await expect.poll(async () => (await drawer.boundingBox())?.width).toBeLessThanOrEqual(360);
  await expect.poll(async () => (await drawer.boundingBox())?.x).toBe(0);
  await expect(drawer.getByRole('button', { name: 'Đóng', exact: true }).last()).toBeInViewport();
  await page.screenshot({
    animations: 'disabled',
    path: `.verification/ui-review/mh08-mobile-${info.project.name}.png`,
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    animations: 'disabled',
    path: `.verification/mh08-${info.project.name}.png`,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('textbox', { name: 'Tìm tài khoản' }).fill(username);
  await expect(page.getByText(/trong tổng số 1 kết quả/)).toBeVisible();
  await selectOption(page, 'Vai trò', 'Phụ trách lập lịch');
  await expect(row).toBeVisible();
  await selectOption(page, 'Vai trò', 'Phụ trách kết quả');
  await expect(page.getByText('Chưa có dữ liệu phù hợp.', { exact: true })).toBeVisible();
  await expect(row).toHaveCount(0);
  await selectOption(page, 'Vai trò', 'Phụ trách lập lịch');
  await expect(row).toBeVisible();
  const stateMenu = await openOptions(page, 'Trạng thái', true);
  await expect(page.getByRole('option', { name: 'Đã khóa', exact: true })).toBeVisible();
  await stateMenu.getByRole('option').last().hover();
  await page.screenshot({ path: `.verification/ui-review/mh08-dropdown-${info.project.name}.png` });
  await page.keyboard.press('Escape');
  await expect(stateMenu).toBeHidden();
  await page.getByRole('button', { name: 'Làm mới danh sách tài khoản' }).click();
  await expect(page.getByRole('textbox', { name: 'Tìm tài khoản' })).toHaveValue('');
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
    await button(second, 'Dùng thông tin đã xem').click();
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
  await selectOption(page, 'Nghiệp vụ *', 'Phê duyệt yêu cầu điều chỉnh lịch thi đấu');
  const recipientLabel = await page.evaluate(async (id) => {
    const { data } = await (await fetch('/api/v1/delegation-proposals')).json();
    const person = data.recipients.find(
      (entry: { account: { id: string } }) => entry.account.id === id,
    ).account;
    return person.fullName + ' · ' + person.personnelCode;
  }, recipient.id);
  await selectOption(page, 'Người nhận *', recipientLabel);
  const end = new Date(Date.now() + 24 * 3600000 + 7 * 3600000).toISOString().slice(0, 16);
  await page.getByLabel(/Kết thúc \(giờ Việt Nam\)/).fill(end);
  await page.getByLabel(/^Lý do$/).fill('Kiểm thử đề xuất điều chỉnh lịch');
  await button(page, 'Xác nhận').click();
  await button(page, 'Chi tiết').click();
  await button(page, 'Gửi đề xuất').click();
  await button(page, 'Xác nhận').click();
  await expect(page.getByRole('cell', { name: 'Chờ xử lý', exact: true })).toBeVisible();

  const administration = await browser.newPage({ baseURL });
  try {
    await login(administration, admin);
    await administration.goto('/admin/delegations');
    await selectOption(administration, 'Mùa giải', season.name + ' (' + season.code + ')');
    await administration.getByRole('textbox', { name: 'Tìm ủy quyền' }).fill(manager.username);
    await expect(
      administration.getByRole('cell', { name: 'Chờ xử lý', exact: true }),
    ).toBeVisible();
    await selectOption(administration, 'Nghiệp vụ', 'Chuẩn bị/chỉnh sửa đề xuất thay đổi quy định');
    await expect(administration.getByText('Chưa có dữ liệu phù hợp.')).toBeVisible();
    await selectOption(administration, 'Nghiệp vụ', 'Phê duyệt yêu cầu điều chỉnh lịch thi đấu');
    const seasonMenu = await openOptions(administration, 'Mùa giải');
    await seasonMenu.getByRole('option').last().hover();
    await administration.screenshot({
      path: `.verification/ui-review/mh09-dropdown-${info.project.name}.png`,
    });
    await administration.getByRole('heading', { name: 'Quản lý ủy quyền nghiệp vụ' }).click();
    await expect(seasonMenu).toBeHidden();
    await button(administration, 'Chi tiết').click();
    await expect
      .poll(async () => (await administration.getByRole('dialog').boundingBox())?.x)
      .toBe(880);
    await administration.screenshot({
      path: `.verification/ui-review/mh09-detail-${info.project.name}.png`,
    });
    await button(administration, 'Cấp ủy quyền').click();
    await button(administration, 'Xác nhận').click();
    await expect(administration.getByRole('cell', { name: 'Đã cấp', exact: true })).toBeVisible();
    await administration.evaluate(() => document.fonts.ready);
    await administration.screenshot({
      animations: 'disabled',
      path: `.verification/mh09-${info.project.name}.png`,
    });
    await administration.getByRole('tab', { name: 'Ủy quyền đã cấp' }).click();
    await administration.getByRole('textbox', { name: 'Tìm ủy quyền' }).fill('lịch thi đấu');
    await expect(
      administration.getByRole('cell', { name: 'Đang hiệu lực', exact: true }),
    ).toBeVisible();
    await selectOption(administration, 'Người nhận', recipientLabel);
    await button(administration, 'Thu hồi ủy quyền').click();
    await administration.screenshot({
      path: `.verification/ui-review/mh09-revoke-${info.project.name}.png`,
    });
    await administration.getByLabel(/Lý do/).fill('Thu hồi theo quy trình kiểm thử');
    await button(administration, 'Xác nhận').click();
    await expect(administration.getByRole('cell', { name: /Đã thu hồi/ })).toBeVisible();
    await administration.getByRole('tab', { name: 'Đề xuất ủy quyền' }).click();
    await expect(administration.getByRole('cell', { name: 'Đã cấp', exact: true })).toBeVisible();
  } finally {
    await administration.close();
  }
});

test('exercises account-profile actions and all three permission groups through the redesigned panels', async ({
  page,
}, info) => {
  test.setTimeout(60_000);
  const {
    accounts: [admin, , , target],
    seasons: [season],
  } = await browserAdministration();
  await login(page, admin);
  await page.goto('/admin/accounts');
  await accountRow(page, target.username).getByRole('button', { name: 'Chi tiết' }).click();
  const panel = page.getByRole('tabpanel');
  const card = (name: string) =>
    panel.locator('section').filter({ has: page.getByRole('heading', { name, exact: true }) });

  await page.getByRole('tab', { name: 'Phân quyền chung' }).click();
  const shared = card('Quản lý hồ sơ sân vận động');
  await shared.getByRole('button', { name: 'Cấp quyền', exact: true }).click();
  await button(page, 'Xác nhận').click();
  await expect(shared.getByText('Đã cấp', { exact: true })).toBeVisible();
  await page.screenshot({
    path: '.verification/ui-review/mh08-shared-granted-' + info.project.name + '.png',
  });
  await shared.getByRole('button', { name: 'Thu hồi quyền' }).click();
  await button(page, 'Xác nhận').click();
  await expect(shared.getByText('Chưa cấp', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Quyền hệ thống' }).click();
  await button(page, 'Cấp vai trò quản trị').click();
  await expect(page.getByRole('dialog').last()).not.toContainText(/phiên bản \d/i);
  await button(page, 'Xác nhận').click();
  await button(page, 'Thu hồi vai trò quản trị').click();
  await button(page, 'Xác nhận').click();
  await expect(button(page, 'Cấp vai trò quản trị')).toBeVisible();
  const createSeason = card('Quyền Tạo mùa giải');
  await createSeason.getByRole('button', { name: 'Cấp quyền', exact: true }).click();
  await button(page, 'Xác nhận').click();
  await expect(createSeason.getByText('Đã cấp', { exact: true })).toBeVisible();
  await createSeason.getByRole('button', { name: 'Thu hồi quyền' }).click();
  await button(page, 'Xác nhận').click();
  await expect(createSeason.getByText('Chưa cấp', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Vai trò mùa giải' }).click();
  await selectOption(page, 'Mùa giải phân công', season.name + ' (' + season.code + ')');
  const assignment = card('Phụ trách lập lịch');
  await assignment.getByRole('button', { name: 'Thu hồi phân công', exact: true }).click();
  await button(page, 'Xác nhận').click();
  await expect(assignment.getByText('Chưa phân công', { exact: true })).toBeVisible();
  await assignment.getByRole('button', { name: 'Phân công', exact: true }).click();
  await button(page, 'Xác nhận').click();
  await expect(assignment.getByText('Đã phân công', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Hồ sơ tài khoản' }).click();
  await button(page, 'Khóa').click();
  await button(page, 'Xác nhận').click();
  await expect(panel.getByText('Đã khóa', { exact: true })).toBeVisible();
  await button(page, 'Mở khóa').click();
  await button(page, 'Xác nhận').click();
  await expect(panel.getByText('Đang hoạt động', { exact: true })).toBeVisible();
  await button(page, 'Đặt lại mật khẩu').click();
  await page
    .getByLabel('Mật khẩu tạm *', { exact: true })
    .fill('Synthetic reset only ' + randomUUID());
  await button(page, 'Xác nhận').click();
  await expect(panel.getByText('Yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await accountRow(page, admin.username).getByRole('button', { name: 'Chi tiết' }).click();
  await page.getByRole('tab', { name: 'Quyền hệ thống' }).click();
  await expect(button(page, 'Thu hồi vai trò quản trị')).toBeDisabled();
  await expect(
    card('Quyền Tạo mùa giải').getByRole('button', { name: 'Cấp quyền', exact: true }),
  ).toBeDisabled();
});
