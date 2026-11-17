import { selectOption } from './select-option';
import { expect, test, type Page } from '@playwright/test';
import {
  browserAccount,
  browserAdministration,
  grantBrowserSeasonManager,
} from '../../backend/tests/fixtures/browser-fixtures';
import { login } from './login';

function submitRegulation(page: Page, seasonId: string, mode: 'SCHEDULED' | 'IMMEDIATE') {
  return page.evaluate(
    async ({ seasonId, mode }) => {
      const session = await fetch('/api/v1/auth/csrf').then((response) => response.json());
      const headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': session.data.csrfToken,
      };
      const draft = await fetch(`/api/v1/seasons/${seasonId}/regulation-versions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          effectiveMode: mode,
          ...(mode === 'SCHEDULED' ? { proposedEffectiveAt: '2030-06-01T00:00:00Z' } : {}),
          squadLimit: 25,
          nonHomegrownLimit: 17,
          homegrownSeasons: 3,
          homegrownMonths: 36,
          homegrownAgeStart: 15,
          homegrownAgeEnd: 21,
          u21Cutoff: '2005-01-01',
          registrationWindows: ['CLUB_APPLICATION', 'PLAYER_CHANGE'].map((intakeKind) => ({
            intakeKind,
            opensAt: '2027-06-01T00:00:00Z',
            closesAt: '2027-07-01T00:00:00Z',
          })),
          clubCount: 20,
          formatCode: 'DOUBLE_ROUND_ROBIN',
          legs: 2,
          plannedMinutes: 90,
          preparationMinutes: 15,
          releaseMinutes: 10,
          winPoints: 3,
          drawPoints: 1,
          lossPoints: 0,
          rankingPriority: ['POINTS', 'GOAL_DIFFERENCE', 'GOALS_FOR'].map(
            (criterionCode, index) => ({
              criterionCode,
              position: index + 1,
            }),
          ),
          qualificationCount: 4,
          relegationCount: 3,
          goalTypes: [{ code: 'A', name: 'Goal', isOwnGoal: false, enabled: true }],
          cardTypes: [{ code: 'YELLOW', name: 'Yellow card', meaning: 'YELLOW', enabled: true }],
        }),
      });
      if (draft.status !== 201) throw new Error(`Unexpected draft status ${draft.status}`);
      const { data } = await draft.json();
      const submit = await fetch(`/api/v1/regulation-versions/${data.id}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          expectedRevision: data.revision,
          reason: 'Gửi phiên bản để duyệt.',
        }),
      });
      if (!submit.ok) throw new Error(`Unexpected submission status ${submit.status}`);
      return (await submit.json()).data as { id: string; revision: string };
    },
    { seasonId, mode },
  );
}

test('independent managers approve and cancel exact scheduled regulations through confirmation dialogs', async ({
  page,
  browser,
  baseURL,
}, info) => {
  test.setTimeout(60_000);
  const {
    accounts: [admin, , preparer],
    seasons: [season],
  } = await browserAdministration();
  const approver = await browserAccount();
  await grantBrowserSeasonManager(approver.id, season.id, admin.id);
  await login(page, preparer);
  const version = await submitRegulation(page, season.id, 'SCHEDULED');
  const route = `/workspace/seasons/${season.id}/regulations`;
  await page.goto(route);
  await expect(page.getByRole('heading', { name: 'Phiên bản 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Phê duyệt phiên bản' })).toHaveCount(0);

  const reviewPage = await browser.newPage({ baseURL });
  try {
    await login(reviewPage, approver);
    await reviewPage.goto(route);
    const approve = reviewPage.getByRole('button', { name: 'Phê duyệt phiên bản', exact: true });
    await approve.click();
    const dialog = reviewPage.getByRole('dialog', { name: 'Xác nhận phê duyệt phiên bản' });
    await expect(dialog).toContainText(version.id);
    await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(approve).toBeVisible();
    await approve.click();
    await dialog.getByLabel(/Lý do/).fill('Đã đối chiếu đầy đủ nội dung.');
    const response = reviewPage.waitForResponse((item) =>
      item.url().endsWith(`/${version.id}/approve`),
    );
    await dialog.getByRole('button', { name: 'Xác nhận phê duyệt phiên bản' }).click();
    expect((await response).status()).toBe(200);
    await expect(reviewPage.getByText('Đã phê duyệt Phiên bản 1.')).toBeVisible();

    await reviewPage.getByRole('button', { name: 'Đề nghị hủy', exact: true }).click();
    const cancellation = reviewPage.getByRole('dialog', { name: 'Hủy hiệu lực theo lịch' });
    await expect(cancellation).toContainText(version.id);
    await cancellation.getByLabel('Lý do').fill('Đề nghị hủy lịch hiệu lực.');
    await cancellation.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await reviewPage.getByRole('button', { name: 'Gửi đề nghị', exact: true }).click();
    const submission = reviewPage.getByRole('dialog', { name: 'Xác nhận gửi đề nghị' });
    await submission.getByLabel('Lý do', { exact: true }).fill('Gửi đề nghị hủy để duyệt.');
    await submission.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(submission).toHaveCount(0);
    await expect(reviewPage.getByRole('button', { name: 'Phê duyệt đề nghị' })).toHaveCount(0);

    await page.reload();
    const approveCancellation = page.getByRole('button', {
      name: 'Phê duyệt đề nghị',
      exact: true,
    });
    await approveCancellation.click();
    const change = page.getByRole('dialog', { name: 'Xác nhận phê duyệt đề nghị' });
    await expect(change).toContainText(version.id);
    await change.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(change).toHaveCount(0);
    await approveCancellation.click();
    await change.getByLabel('Lý do', { exact: true }).fill('Đồng ý hủy lịch hiệu lực.');
    const cancelResponse = page.waitForResponse(
      (item) =>
        item.url().includes('/regulation-change-requests/') && item.url().endsWith('/approve'),
    );
    await change.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    expect((await cancelResponse).status()).toBe(200);
    await expect(page.getByText('Chưa có phiên bản chờ', { exact: true })).toBeVisible();

    const immediate = await submitRegulation(page, season.id, 'IMMEDIATE');
    await reviewPage.reload();
    await reviewPage.getByRole('button', { name: 'Phê duyệt phiên bản', exact: true }).click();
    await dialog.getByLabel(/Lý do/).fill('Đã đối chiếu nội dung hiệu lực ngay.');
    const approved = reviewPage.waitForResponse((item) =>
      item.url().endsWith(`/${immediate.id}/approve`),
    );
    await dialog.getByRole('button', { name: 'Xác nhận phê duyệt phiên bản' }).click();
    expect((await approved).status()).toBe(200);
    await reviewPage.getByRole('tab', { name: 'Quy định hiện hành', exact: true }).click();
    await expect(
      reviewPage.getByRole('heading', { name: '5 nhóm quy định kỹ thuật chính thức' }),
    ).toBeVisible();
    await expect(reviewPage.getByText('20 câu lạc bộ, thi đấu vòng tròn 2 lượt.')).toBeVisible();
    await reviewPage.screenshot({ path: info.outputPath('mh12-current-desktop.png') });
    await reviewPage.getByLabel('Xem chi tiết thể thức thi đấu', { exact: true }).click();
    await expect(
      reviewPage.getByText('Thời lượng dự kiến', { exact: true }).filter({ visible: true }),
    ).toBeVisible();
    await reviewPage.setViewportSize({ width: 390, height: 844 });
    await reviewPage.screenshot({ path: info.outputPath('mh12-current-mobile.png') });
    await expect
      .poll(() => reviewPage.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
  } finally {
    await reviewPage.close();
  }
});

test('an assigned manager can create and save an incomplete regulation draft', async ({ page }) => {
  const {
    accounts: [, , manager],
    seasons: [season],
  } = await browserAdministration();
  await login(page, manager);

  const regulationWrites: { method: string; path: string; body?: unknown }[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (
      path === `/api/v1/seasons/${season.id}/regulation-versions` ||
      /^\/api\/v1\/regulation-versions\/[^/]+$/.test(path)
    )
      regulationWrites.push({
        method: request.method(),
        path,
        ...(request.method() === 'POST' || request.method() === 'PATCH'
          ? { body: request.postDataJSON() }
          : {}),
      });
  });

  await page.goto(`/workspace/seasons/${season.id}/regulations`);
  await expect(page.getByRole('heading', { name: 'Quản lý quy định mùa giải' })).toHaveCSS(
    'font-weight',
    '700',
  );
  await expect(
    page.getByRole('combobox', { name: 'Mùa giải', exact: true }).locator('..'),
  ).toHaveText(season.name);
  await expect(page.getByRole('button', { name: 'Tạo bản nháp quy định' })).toBeVisible();
  await page.getByRole('button', { name: 'Tạo bản nháp quy định' }).click();

  await expect(page.getByRole('heading', { name: 'Phiên bản 1' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Phiên bản 1/ })).toHaveCSS(
    'justify-content',
    'stretch',
  );
  const draftNotice = page.getByRole('status').filter({ hasText: 'Đã tạo bản nháp trống' });
  await expect(draftNotice).toHaveCSS('margin-bottom', '14px');
  await expect(page.getByLabel('Giới hạn danh sách cầu thủ')).toHaveValue('');
  await expect(page.getByLabel('Ngày sinh giới hạn U21')).toHaveValue('');
  await expect(page.getByLabel('Điểm thắng')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Lưu bản nháp' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gửi thẩm định' })).toBeVisible();
  await expect(page.getByRole('button', { name: /phê duyệt|approve/i })).toHaveCount(0);

  await page.getByLabel('Giới hạn danh sách cầu thủ').fill('24');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(
    page.getByRole('listitem').filter({ hasText: `${manager.fullName} · lần đầu` }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Đã lưu bản nháp. Nội dung chưa được gửi thẩm định' }),
  ).toBeVisible();
  await expect
    .poll(() => regulationWrites.filter(({ method }) => method === 'PATCH').length)
    .toBe(1);
  expect(regulationWrites.filter(({ method }) => method === 'POST')).toEqual([
    {
      method: 'POST',
      path: `/api/v1/seasons/${season.id}/regulation-versions`,
      body: {},
    },
  ]);
  expect(regulationWrites.find(({ method }) => method === 'PATCH')).toMatchObject({
    method: 'PATCH',
    body: { expectedRevision: '1', squadLimit: 24 },
  });
  expect(JSON.stringify(regulationWrites)).not.toMatch(/"(?:submit|approve|action)"/i);

  await page.reload();
  await expect(page.getByLabel('Giới hạn danh sách cầu thủ')).toHaveValue('24');
  await expect(page.getByLabel('Ngày sinh giới hạn U21')).toHaveValue('');
  const cutoff = page.getByLabel('Ngày sinh giới hạn U21');
  await cutoff.fill('01/01/2009');
  await cutoff.press('Tab');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect
    .poll(() => regulationWrites.filter(({ method }) => method === 'PATCH').at(-1)?.body)
    .toMatchObject({ u21Cutoff: '2009-01-01' });
  await expect(cutoff).toHaveValue('01/01/2009');
});

test('a manager submits, withdraws, and edits an explicit successor without changing the submitted version', async ({
  page,
}) => {
  const {
    accounts: [, , manager],
    seasons: [season],
  } = await browserAdministration();
  await login(page, manager);

  const regulationWrites: { method: string; path: string; body?: unknown }[] = [];
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    if (
      path === `/api/v1/seasons/${season.id}/regulation-versions` ||
      /^\/api\/v1\/regulation-versions\/[^/]+(?:\/(?:submit|withdraw))?$/.test(path)
    )
      regulationWrites.push({
        method: request.method(),
        path,
        ...(request.method() === 'POST' || request.method() === 'PATCH'
          ? { body: request.postDataJSON() }
          : {}),
      });
  });

  await page.goto(`/workspace/seasons/${season.id}/regulations`);
  await page.getByRole('button', { name: 'Tạo bản nháp quy định' }).click();
  await expect(page.getByRole('heading', { name: 'Phiên bản 1' })).toBeVisible();

  await page.getByRole('button', { name: 'Xem và xác nhận giá trị đề xuất từ nguồn' }).click();
  const sourceDialog = page.getByRole('dialog', { name: 'Xác nhận điền giá trị đề xuất' });
  await expect(sourceDialog).toContainText('20 câu lạc bộ');
  await sourceDialog.getByRole('button', { name: 'Xác nhận điền' }).click();
  await page.getByRole('button', { name: 'Xem và xác nhận giá trị đề xuất R = 3' }).click();
  await page
    .getByRole('dialog', { name: 'Xác nhận điền giá trị đề xuất' })
    .getByRole('button', { name: 'Xác nhận điền' })
    .click();

  await selectOption(page, 'Cách đề xuất hiệu lực', 'Hiệu lực ngay sau khi được duyệt');
  await page.getByLabel('Độ tuổi đào tạo từ').fill('16');
  await page.getByLabel('Độ tuổi đào tạo đến').fill('21');
  await page.getByLabel('Ngày sinh giới hạn U21').fill('01/01/2009');
  await selectOption(page, 'Thể thức', 'Vòng tròn hai lượt');
  await selectOption(page, 'Số lượt', 'Hai lượt');
  await page.getByLabel('Thời lượng thi đấu dự kiến (phút)').fill('90');
  await page.getByLabel('Thời gian chuẩn bị (phút)').fill('15');
  await page.getByLabel('Thời gian nghỉ sau trận (phút)').fill('15');
  await page.getByLabel('Điểm thắng').fill('3');
  await page.getByLabel('Điểm hòa').fill('1');
  await page.getByLabel('Điểm thua').fill('0');
  await page.getByLabel('Số vị trí giành quyền tham dự (Q)').fill('4');

  await page.getByRole('button', { name: 'Thêm đợt tiếp nhận' }).click();
  await page.getByLabel('Mở từ đợt 1').fill('25/11/2026 09:00');
  await page.getByLabel('Đóng trước đợt 1').fill('30/11/2026 17:00');
  await page.getByLabel('Đóng trước đợt 1').press('Tab');
  await expect(page.getByLabel('Mở từ đợt 1')).toHaveValue('25/11/2026 09:00');
  await page.getByRole('button', { name: 'Thêm đợt tiếp nhận' }).click();
  await selectOption(page, 'Nhóm tiếp nhận đợt 2', 'Thay đổi đăng ký cầu thủ');
  await page.getByLabel('Mở từ đợt 2').fill('15/01/2027 09:00');
  await page.getByLabel('Đóng trước đợt 2').fill('15/02/2027 17:00');
  await page.getByLabel('Đóng trước đợt 2').press('Tab');

  await page.getByRole('button', { name: 'Thêm tiêu chí xếp hạng' }).click();
  await page.getByRole('button', { name: 'Thêm tiêu chí xếp hạng' }).click();
  await page.getByRole('button', { name: 'Thêm tiêu chí xếp hạng' }).click();
  await page.getByRole('button', { name: 'Thêm loại bàn thắng' }).click();
  await page.getByLabel('Mã loại bàn thắng 1').fill('A');
  await page.getByLabel('Tên loại bàn thắng 1').fill('Bàn thắng thường');
  await page.getByRole('button', { name: 'Thêm loại thẻ' }).click();
  await page.getByLabel('Mã loại thẻ 1').fill('YELLOW');
  await page.getByLabel('Tên loại thẻ 1').fill('Thẻ vàng');

  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Đã lưu bản nháp. Nội dung chưa được gửi thẩm định' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Gửi thẩm định' }).click();
  const submitDialog = page.getByRole('dialog', { name: 'Xác nhận gửi thẩm định' });
  await submitDialog.getByLabel('Lý do').fill('Đề nghị thẩm định phiên bản 1.');
  await submitDialog.getByRole('button', { name: 'Xác nhận gửi thẩm định' }).click();
  await expect(page.getByRole('heading', { name: 'Phiên bản 1' })).toBeVisible();
  await expect(page.getByLabel('Cách đề xuất hiệu lực')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Phê duyệt' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Rút phiên bản' })).toBeVisible();

  await page.getByRole('button', { name: 'Rút phiên bản' }).click();
  const withdrawDialog = page.getByRole('dialog', { name: 'Xác nhận rút phiên bản' });
  await withdrawDialog.getByLabel('Lý do').fill('Rút để cập nhật đề xuất.');
  await withdrawDialog.getByRole('button', { name: 'Xác nhận rút phiên bản' }).click();
  await expect(
    page.getByRole('button', { name: 'Tạo phiên bản kế tiếp để chỉnh sửa' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Tạo phiên bản kế tiếp để chỉnh sửa' }).click();
  await expect(page.getByRole('heading', { name: 'Phiên bản 2' })).toBeVisible();
  await expect(page.getByLabel('Giới hạn danh sách cầu thủ')).toHaveValue('25');
  await page.getByLabel('Giới hạn danh sách cầu thủ').fill('24');
  await page.getByRole('button', { name: 'Lưu bản nháp' }).click();
  await expect(
    page
      .getByRole('status')
      .filter({ hasText: 'Đã lưu bản nháp. Nội dung chưa được gửi thẩm định' }),
  ).toBeVisible();

  const submittedVersionRow = page.getByRole('button', { name: /Phiên bản 1/ });
  await submittedVersionRow.click();
  await expect(page.getByLabel('Giới hạn danh sách cầu thủ')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Chi tiết phiên bản quy định' })).toContainText(
    '25',
  );
  await page.getByRole('button', { name: /Phiên bản 2/ }).click();
  await expect(page.getByLabel('Giới hạn danh sách cầu thủ')).toHaveValue('24');

  expect(regulationWrites.filter(({ path }) => path.endsWith('/submit'))).toHaveLength(1);
  expect(regulationWrites.filter(({ path }) => path.endsWith('/withdraw'))).toHaveLength(1);
  expect(regulationWrites.find(({ path }) => path.endsWith('/submit'))?.body).toMatchObject({
    expectedRevision: '2',
    reason: 'Đề nghị thẩm định phiên bản 1.',
  });
  expect(regulationWrites.find(({ path }) => path.endsWith('/withdraw'))?.body).toMatchObject({
    expectedRevision: '3',
    reason: 'Rút để cập nhật đề xuất.',
  });
  expect(
    regulationWrites
      .filter(({ method, path }) => method === 'POST' && path.endsWith('regulation-versions'))
      .map(({ body }) => body),
  ).toEqual([{}, { predecessorVersionId: expect.any(String) }]);
});
