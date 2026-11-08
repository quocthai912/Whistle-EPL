import { submitLogin as login } from './login';
import { test, expect, type Page } from '@playwright/test';
import {
  browserAccount,
  changeBrowserBasis,
  expireBrowserPrelogin,
} from '../../backend/tests/fixtures/browser-fixtures';

test('expired prelogin protection renews only on an explicit retry and keeps safe input', async ({
  page,
  context,
}) => {
  const account = await browserAccount();
  await login(page, { ...account, password: 'Wrong synthetic credential' });
  await expect(page.getByRole('alert')).toContainText('Tên đăng nhập hoặc mật khẩu không hợp lệ.');
  const prelogin = (await context.cookies()).find(
    (cookie) => cookie.name === '__Host-whistle-csrf-context',
  );
  if (!prelogin) throw new Error('Expected prelogin test context.');
  await expireBrowserPrelogin(prelogin.value);
  await page.getByLabel(/^MẬT KHẨU \*/).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Thông tin bảo vệ yêu cầu');
  await expect(page.getByLabel('TÊN ĐĂNG NHẬP', { exact: false })).toHaveValue(account.username);
  await page.getByLabel(/^MẬT KHẨU \*/).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/internal$/);
});

test('lost connection does not replay login and requires an explicit session check', async ({
  page,
  context,
}) => {
  const account = await browserAccount();
  await login(page, { ...account, password: 'Wrong synthetic credential' });
  await expect(page.getByRole('alert')).toContainText('Tên đăng nhập hoặc mật khẩu không hợp lệ.');
  await context.setOffline(true);
  await page.getByLabel(/^MẬT KHẨU \*/).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Kiểm tra trạng thái phiên' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeDisabled();
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Kiểm tra trạng thái phiên' }).click();
  await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeEnabled();
  await login(page, account);
  await expect(page).toHaveURL(/internal$/);
});

test.beforeAll(async ({ browser }, info) => {
  info.annotations.push({
    type: 'browser-version',
    description: `${info.project.name}: ${browser.version()}`,
  });
  console.log(
    `${info.project.name}: ${browser.version()}; trusted HTTPS, synthetic isolated fixtures`,
  );
});

test('required-field feedback stays Vietnamese in an English browser and layouts fit desktop/mobile', async ({
  page,
}, info) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Vui lòng nhập tên đăng nhập hợp lệ');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
  for (const [width, height] of [
    [1536, 734],
    [1366, 650],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(page.getByRole('contentinfo')).toBeInViewport({ ratio: 1 });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `.verification/mh06-${info.project.name}.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
  const account = await browserAccount(true);
  await login(page, account);
  await expect(page).toHaveURL(/change-password$/);
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(page.getByRole('alert')).toHaveText('Vui lòng nhập mật khẩu hiện tại.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  for (const [width, height] of [
    [1536, 734],
    [1366, 650],
  ]) {
    await page.setViewportSize({ width, height });
    await expect(page.getByRole('contentinfo')).toBeInViewport({ ratio: 1 });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: `.verification/mh07-${info.project.name}.png`, fullPage: true });
});

test('temporary login, restricted routing, Unicode change, all-session invalidation and new login', async ({
  page,
  browser,
}) => {
  const account = await browserAccount(true);
  const other = await browser.newContext();
  try {
    const second = await other.newPage();
    await login(second, account);
    await expect(second).toHaveURL(/change-password$/);
    await login(page, account);
    await expect(page).toHaveURL(/change-password$/);
    await page.goto('/internal');
    await expect(page).toHaveURL(/change-password$/);
    const password = '  Mật khẩu mới 🦉 2026 đủ dài  ';
    await page.getByLabel(/^Mật khẩu hiện tại \*/i).fill(account.password);
    await page.getByLabel(/^Mật khẩu mới \*/i).fill(password);
    await page.getByLabel(/^Xác nhận mật khẩu mới \*/i).fill(password);
    await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
    await expect(page).toHaveURL(/login$/);
    await expect(page.getByRole('status')).toContainText('Đổi mật khẩu thành công');
    await second.goto('/internal');
    await expect(second).toHaveURL(/login$/);
    await login(page, { ...account, password });
    await expect(page).toHaveURL(/internal$/);
    await expect(page.getByText('Xin chào, Nhân viên trình duyệt.')).toBeVisible();
    expect(
      await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
    ).toEqual({ local: 0, session: 0 });
  } finally {
    await other.close();
  }
});

test('same-session tabs share CSRF; logout clears those tabs and leaves an independent session valid', async ({
  page,
  context,
  browser,
}) => {
  const account = await browserAccount();
  const independent = await browser.newContext();
  try {
    await login(page, account);
    await expect(page).toHaveURL(/internal$/);
    const second = await context.newPage();
    await second.goto('/internal');
    const third = await independent.newPage();
    await login(third, account);
    await expect(third).toHaveURL(/internal$/);
    const protection = async (tab: Page) =>
      tab.evaluate(
        async () => (await (await fetch('/api/v1/auth/csrf')).json()).data.csrfToken as string,
      );
    expect(await protection(page)).toBe(await protection(second));
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === '__Host-whistle-session')).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
    });
    await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await expect(page).toHaveURL(/login$/);
    await second.bringToFront();
    await second.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(second).toHaveURL(/login$/);
    await third.reload();
    await expect(third).toHaveURL(/internal$/);
  } finally {
    await independent.close();
  }
});

for (const change of ['idle', 'absolute', 'revoke', 'lock'] as const) {
  test(`${change} invalidates access and never replays a pending password write`, async ({
    page,
  }) => {
    const account = await browserAccount();
    await login(page, account);
    await expect(page).toHaveURL(/internal$/);
    await page.getByRole('link', { name: 'Đổi mật khẩu' }).click();
    await page.getByLabel(/^Mật khẩu hiện tại \*/i).fill(account.password);
    await page.getByLabel(/^Mật khẩu mới \*/i).fill('New synthetic credential 🦉 only');
    await page.getByLabel(/^Xác nhận mật khẩu mới \*/i).fill('New synthetic credential 🦉 only');
    await changeBrowserBasis(account.id, change);
    let writes = 0;
    page.on('request', (request) => {
      if (request.url().endsWith('/password/change')) writes++;
    });
    await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
    await expect(page).toHaveURL(/login$/);
    await expect(page.getByRole('status')).toContainText(
      change === 'idle' || change === 'absolute' ? 'hết hạn' : 'quyền truy cập đã thay đổi',
    );
    expect(writes).toBeLessThanOrEqual(1);
    if (change !== 'lock') {
      await login(page, account);
      await expect(page).toHaveURL(/internal$/);
    }
    expect(writes).toBeLessThanOrEqual(1);
  });
}

test('generic credential failure preserves username, clears password, and supports retry', async ({
  page,
}) => {
  const account = await browserAccount();
  await login(page, { ...account, password: 'Wrong synthetic credential' });
  await expect(page.getByRole('alert')).toContainText('Tên đăng nhập hoặc mật khẩu không hợp lệ.');
  await expect(page.getByLabel('TÊN ĐĂNG NHẬP', { exact: false })).toHaveValue(account.username);
  await expect(page.getByLabel(/^MẬT KHẨU \*/)).toHaveValue('');
  await page.getByLabel(/^MẬT KHẨU \*/).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/internal$/);
});

test('wrong current password and confirmation errors keep the change screen and clear secret fields', async ({
  page,
}) => {
  const account = await browserAccount(true);
  await login(page, account);
  await expect(page).toHaveURL(/change-password$/);
  await page.getByLabel(/^Mật khẩu hiện tại \*/i).fill('Wrong synthetic credential');
  await page.getByLabel(/^Mật khẩu mới \*/i).fill('New synthetic credential 🦉 only');
  await page.getByLabel(/^Xác nhận mật khẩu mới \*/i).fill('New synthetic credential 🦉 only');
  await page.getByRole('button', { name: 'Cập nhật mật khẩu' }).click();
  await expect(page.getByRole('alert')).toHaveText('Mật khẩu hiện tại không hợp lệ.');
  await expect(page.getByLabel(/^Mật khẩu hiện tại \*/i)).toHaveValue('');
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/login$/);
});
