import { login } from './login';
import { randomUUID } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { browserAdministration } from '../../backend/tests/fixtures/browser-fixtures';
import { assertIsolatedTarget } from '../../backend/tests/fixtures/isolated-target.guard';
import { DatabaseService } from '../../backend/src/platform/database.service';
import { RecoverAdminService } from '../../backend/src/cli/recover-admin.service';
import { TechnicalCleanupService } from '../../backend/src/operations/technical-cleanup.service';

/** Checks access with the browser's current cookies and returns only the HTTP status. */
const auditStatus = (page: Page) =>
  page.evaluate(async () => (await fetch('/api/v1/audit-logs')).status);

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
    expect(await auditStatus(outsider)).toBe(401);
    await login(outsider, staff);
    await outsider.goto('/admin/audit');
    await expect(outsider.getByRole('alert')).toContainText(
      'Bạn không có quyền truy cập trang này.',
    );
    expect(await auditStatus(outsider)).toBe(403);
    await outsider.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(outsider).toHaveURL(/login$/);
  } finally {
    await outsider.close();
  }

  await login(page, admin);
  /** Sends a protected fixture command and keeps credentials out of test-runner diagnostics. */
  async function command(path: string, data: object, method = 'POST', status = 200) {
    const result = await page.evaluate(
      async ({ path, data, method }) => {
        const csrf = await fetch('/api/v1/auth/csrf', { cache: 'no-store' });
        if (!csrf.ok)
          throw new Error('Could not obtain request protection for the fixture command.');
        const {
          data: { csrfToken },
        } = await csrf.json();
        const response = await fetch('/api/v1' + path, {
          method,
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'Idempotency-Key': crypto.randomUUID(),
          },
        });
        const { data: saved } = await response.json();
        return {
          status: response.status,
          id: saved?.id as string,
          revision: saved?.revision as string,
        };
      },
      { path, data, method },
    );
    expect(result.status, path).toBe(status);
    return result;
  }
  const password = 'Temporary synthetic ' + randomUUID();
  const displayedText = '<img src=x onerror=alert(1)>';
  const subject = await command(
    '/accounts',
    {
      personnelCode: 'AUDIT-' + randomUUID().slice(0, 8),
      fullName: displayedText,
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
  let revision = grant.revision;
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
  const database = new DatabaseService(
    assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''),
  );
  try {
    /** Reads the same ordered audit rows before and after locking the fixture account. */
    const subjectHistory = () =>
      database.client.auditRecord.findMany({
        where: { objectId: subject.id },
        orderBy: { id: 'asc' },
      });
    const beforeLock = await subjectHistory();
    await command('/accounts/' + subject.id + '/lock', { expectedRevision: revision });
    const afterLock = await subjectHistory();
    expect(afterLock.filter((row) => row.actionCode !== 'ACCOUNT_LOCKED')).toEqual(beforeLock);
    expect(afterLock.filter((row) => row.actionCode === 'ACCOUNT_LOCKED')).toHaveLength(1);
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
    /** Counts the logged-out fixture's sessions so cleanup can be observed directly. */
    const staffSessions = () => database.client.session.count({ where: { accountId: staff.id } });
    expect(await staffSessions()).toBe(1);
    await new TechnicalCleanupService(database).execute();
    expect(await staffSessions()).toBe(0);
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
    await expect(detail.getByText(displayedText, { exact: true })).toBeVisible();
    await expect(detail.locator('img')).toHaveCount(0);
    const detailText = await detail.innerText();
    expect(detailText.includes(password)).toBe(false);
    expect(detailText).not.toMatch(/passwordHash|tokenHash|csrfToken/);
    await page.keyboard.press('Escape');
    await expect(detail).toHaveCount(0);
    await page.getByRole('button', { name: 'Trang trước' }).click();
    await expect(table).toHaveText(firstPage, { useInnerText: true });
    expect(await database.client.auditRecord.findMany({ orderBy: { id: 'asc' } })).toEqual(
      retained,
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: '.verification/mh10-' + info.project.name + '.png' });
    for (const [width, height] of [
      [360, 800],
      [768, 1024],
      [1366, 768],
    ]) {
      await page.setViewportSize({ width, height });
      await page.getByLabel('Mã đối tượng').fill(subject.id);
      await page.getByRole('button', { name: 'Tra cứu' }).click();
      await expect(page.getByText(/23 bản ghi nhật ký/)).toBeVisible();
      await page.getByRole('button', { name: 'Trang sau' }).click();
      await table
        .getByRole('row')
        .filter({ hasText: 'Tạo tài khoản' })
        .getByRole('button', { name: 'Chi tiết' })
        .click();
      await expect(detail.getByText(displayedText, { exact: true })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(detail).toHaveCount(0);
      await page.getByRole('button', { name: 'Trang trước' }).click();
      await expect(table).toHaveText(firstPage, { useInnerText: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.getByRole('button', { name: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(/login$/);
    await login(page, staff);
    await page.goto('/admin/audit');
    await expect(page.getByRole('alert')).toContainText('Bạn không có quyền truy cập trang này.');
    await expect(table).toHaveCount(0);
    expect(
      await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })),
    ).toEqual({ local: 0, session: 0 });
  } finally {
    await database.close();
  }
});
