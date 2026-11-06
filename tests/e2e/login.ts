import { expect, type Page } from '@playwright/test';

export async function submitLogin(page: Page, account: { username: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('TÊN ĐĂNG NHẬP', { exact: false }).fill(account.username);
  await page.getByLabel(/^MẬT KHẨU \*/).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

export async function login(page: Page, account: { username: string; password: string }) {
  await submitLogin(page, account);
  await expect(page).toHaveURL(/internal$/);
}
