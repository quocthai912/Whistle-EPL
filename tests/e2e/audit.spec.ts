import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { browserAdministration } from '../../backend/tests/fixtures/browser-fixtures';
import { assertIsolatedTarget } from '../../backend/tests/fixtures/isolated-target.guard';
import { DatabaseService } from '../../backend/src/platform/database.service';
import { RecoverAdminService } from '../../backend/src/cli/recover-admin.service';
import { TechnicalCleanupService } from '../../backend/src/operations/technical-cleanup.service';

async function login(page: Page, account: { username: string; password: string }) {
  await page.goto('/login');
  await page.getByLabel('TÊN ĐĂNG NHẬP', { exact: false }).fill(account.username);
  await page.getByLabel(/^MẬT KHẨU \*/).fill(account.password);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/internal$/);
}

test('traces real administration and authentication events across pages and technical cleanup', async ({
  page,
  browser,
  baseURL,
}, info) => {
  const {
    accounts: [admin, recoveryTarget, staff],
    seasons: [season],
  } = await browserAdministration();
  const outsider = await browser.newPage({ baseURL });
  try {
    await outsider.goto('/admin/audit');
    await expect(outsider).toHaveURL(/login$/);
    expect((await outsider.request.get('/api/v1/audit-logs')).status()).toBe(401);
    await login(outsider, staff);
    await outsider.goto('/admin/audit');
    await expect(outsider.getByRole('alert')).toContainText(
      'Bạn không có quyền truy cập trang này.',
    );
    expect((await outsider.request.get('/api/v1/audit-logs')).status()).toBe(403);
    await outsider.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(outsider).toHaveURL(/login$/);
  } finally {
    await outsider.close();
  }

  await login(page, admin);
  const csrf = await page.request.get('/api/v1/auth/csrf');
  expect(csrf.ok()).toBe(true);
  const token = (await csrf.json()).data.csrfToken as string;
  async function command(path: string, data: object, method = 'POST', status = 200) {
    const response = await page.request.fetch('/api/v1' + path, {
      method,
      data,
      headers: { Origin: baseURL!, 'X-CSRF-Token': token, 'Idempotency-Key': randomUUID() },
    });
    expect(response.status(), path).toBe(status);
    return (await response.json()).data;
  }
  const password = 'Temporary synthetic ' + randomUUID();
  const subject = await command(
    '/accounts',
    {
      personnelCode: 'AUDIT-' + randomUUID().slice(0, 8),
      fullName: 'Nhân viên đối chiếu nhật ký',
      username: 'audit.' + randomUUID().slice(0, 8),
      temporaryPassword: password,
    },
    'POST',
    201,
  );
  const grant = await command(
    '/accounts/' + subject.id + '/role-assignments',
    {
      expectedRevision: subject.revision,
      seasonId: season.id,
      roleCode: 'SCHEDULING_OFFICER',
    },
    'POST',
    201,
  );
  let revision = grant.revision as string;
  for (let index = 1; index <= 20; index++) {
    const updated = await command(
      '/accounts/' + subject.id,
      {
        expectedRevision: revision,
        fullName: 'Nhân viên kiểm thử ' + index,
      },
      'PATCH',
    );
    revision = updated.revision;
  }
  await command('/accounts/' + subject.id + '/lock', { expectedRevision: revision });

  const database = new DatabaseService(
    assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''),
  );
  try {
    await new RecoverAdminService(database).execute(
      {
        target: recoveryTarget.username,
        reason: 'Diễn tập khôi phục quản trị',
        reset: false,
        unlock: true,
      },
      'synthetic-browser-operator',
    );
    const retained = await database.client.auditRecord.findMany({ orderBy: { id: 'asc' } });
    await new TechnicalCleanupService(database).execute();
    expect(await database.client.auditRecord.findMany({ orderBy: { id: 'asc' } })).toEqual(
      retained,
    );

    await page.getByRole('link', { name: 'Nhật ký hoạt động' }).click();
    await expect(page.getByRole('heading', { name: 'Tra cứu nhật ký hoạt động' })).toBeVisible();
    const table = page.getByRole('table', { name: 'Nhật ký hoạt động' });
    for (const [code, label] of [
      ['ADMIN_RECOVERED', 'synthetic-browser-operator'],
      ['LOGIN_SUCCEEDED', 'Đăng nhập hệ thống'],
      ['LOGOUT_SUCCEEDED', 'Đăng xuất hệ thống'],
      ['SEASON_ROLE_GRANTED', 'Phân công vai trò mùa giải'],
    ]) {
      await page.getByLabel('Loại thao tác').selectOption(code);
      await page.getByRole('button', { name: 'Tra cứu' }).click();
      await expect(table.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await page.getByLabel('Loại thao tác').selectOption('');
    await page.getByLabel('Mã đối tượng').fill(subject.id);
    await page.getByRole('button', { name: 'Tra cứu' }).click();
    await expect(page.getByText(/23 bản ghi nhật ký/)).toBeVisible();
    const firstPage = await table.innerText();
    await page.getByRole('button', { name: 'Trang sau' }).click();
    await expect(table.getByText('Tạo tài khoản', { exact: true })).toBeVisible();
    await table
      .getByRole('row')
      .filter({ hasText: 'Tạo tài khoản' })
      .getByRole('button', { name: 'Chi tiết' })
      .click();
    const detail = page.getByRole('dialog');
    await expect(detail.getByText('Sau thay đổi')).toBeVisible();
    const detailText = await detail.innerText();
    expect(detailText.includes(password)).toBe(false);
    expect(detailText).not.toMatch(/passwordHash|tokenHash|csrfToken/);
    await page.keyboard.press('Escape');
    await expect(detail).toHaveCount(0);
    await page.getByRole('button', { name: 'Trang trước' }).click();
    await expect(table).toHaveText(firstPage.replace(/\s+/g, ' ').trim());
    expect(await database.client.auditRecord.findMany({ orderBy: { id: 'asc' } })).toEqual(
      retained,
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: '.verification/mh10-' + info.project.name + '.png' });
    for (const width of [768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  } finally {
    await database.close();
  }
});
