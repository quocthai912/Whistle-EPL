import { randomUUID } from 'node:crypto';
import { expect, type Page } from '@playwright/test';
import { DatabaseService } from '../../backend/src/platform/database.service';
import { browserMasterManager } from '../../backend/tests/fixtures/browser-fixtures';
import { assertIsolatedTarget } from '../../backend/tests/fixtures/isolated-target.guard';
import { login } from './login';

export async function browserAvailabilityFlow(page: Page, kind: 'club' | 'stadium') {
  const club = kind === 'club';
  const owner = await browserMasterManager(club ? 'CLUB_MASTER' : 'STADIUM_MASTER');
  const id = randomUUID();
  const code = `D099_${id.slice(0, 8).toUpperCase()}`;
  const name = `${club ? 'Câu lạc bộ' : 'Sân vận động'} ${code.slice(-8)}`;
  const db = new DatabaseService(assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? ''));
  try {
    if (club) await db.client.club.create({ data: { id, code, name, abbreviation: 'D99' } });
    else await db.client.stadium.create({ data: { id, code, name } });
  } finally {
    await db.close();
  }
  await login(page, owner);
  await page.goto(club ? '/workspace/clubs' : '/workspace/stadiums');
  const search = club ? 'Tìm câu lạc bộ' : 'Tìm sân vận động';
  await page.getByLabel(search).fill(code);
  await page.getByRole('button', { name: `Chi tiết ${name}` }).click();
  const details = page
    .getByRole('dialog')
    .filter({ hasText: club ? 'Hồ sơ câu lạc bộ' : 'Hồ sơ sân vận động' });
  await details.getByRole('button', { name: 'Ngừng sử dụng hồ sơ' }).click();
  const stop = page.getByRole('dialog', { name: 'Ngừng sử dụng hồ sơ' });
  await expect(stop.getByRole('button', { name: 'Xác nhận' })).toBeDisabled();
  await stop.getByLabel('Lý do').fill('Tạm ngừng hồ sơ kiểm thử.');
  await stop.getByRole('button', { name: 'Xác nhận' }).click();
  await details.getByRole('button', { name: 'Sử dụng lại hồ sơ' }).click();
  const resume = page.getByRole('dialog', { name: 'Sử dụng lại hồ sơ' });
  await resume.getByLabel('Lý do').fill('Khôi phục khả năng sử dụng.');
  await resume.getByRole('button', { name: 'Xác nhận' }).click();
  await details.getByRole('button', { name: 'Lịch sử' }).click();
  await expect(details.getByText('Tạm ngừng hồ sơ kiểm thử.', { exact: true })).toBeVisible();
  await expect(details.getByText('Khôi phục khả năng sử dụng.', { exact: true })).toBeVisible();
  await expect(details.getByText(code, { exact: true }).first()).toBeVisible();
}
