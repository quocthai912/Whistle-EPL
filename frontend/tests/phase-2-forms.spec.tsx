import { ConfigProvider } from 'antd';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, test, vi } from 'vitest';
import { App } from '../src/app/App';

const seasonId = '00000000-0000-4000-8000-000000000021';
const account = {
  id: '00000000-0000-4000-8000-000000000001',
  personnelCode: 'STAFF-02',
  fullName: 'Quản lý mùa giải',
  username: 'season.manager',
  changeRequired: false,
  seasonRoles: [{ seasonId, roleCode: 'SEASON_MANAGER' }],
};
const baseSeason = {
  id: seasonId,
  code: 'MG-2028-2029',
  name: 'Mùa giải 2028/2029',
  competitionName: 'Giải Ngoại hạng',
  startDate: '2028-08-15',
  endDate: '2029-05-23',
  state: 'OPEN',
  revision: '1',
  effectiveRegulation: null,
  capabilities: { canEditMetadata: true },
};
const envelope = (data: unknown, meta?: unknown) =>
  Response.json({ data, ...(meta ? { meta } : {}), requestId: 'phase-2-forms-test' });
const wait = { timeout: 7_000 };

afterEach(() => vi.unstubAllGlobals());

function open(fetcher: typeof fetch) {
  vi.stubGlobal('fetch', fetcher);
  render(
    <ConfigProvider theme={{ token: { motion: false } }}>
      <MemoryRouter initialEntries={['/workspace/seasons']}>
        <App />
      </MemoryRouter>
    </ConfigProvider>,
  );
}

function pathOf(input: RequestInfo | URL) {
  return new URL(String(input), 'https://whistle.test').pathname;
}

function listResult(page = 1, total = 1, items = [baseSeason]) {
  return { data: { items }, meta: { page, pageSize: 20, total } };
}

test(
  'season list stays within assigned scope and resets paging for search and filters',
  { timeout: 15_000 },
  async () => {
    const requested: URL[] = [];
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const url = new URL(String(input), 'https://whistle.test');
      if (url.pathname.endsWith('/auth/session')) return envelope(account);
      if (url.pathname === '/api/v1/seasons') {
        requested.push(url);
        const page = Number(url.searchParams.get('page') ?? 1);
        const result = listResult(page, 41, [baseSeason]);
        return envelope(result.data, result.meta);
      }
      throw new Error(`Unexpected request: ${url.pathname}`);
    });
    open(fetcher);

    expect(await screen.findByText('MG-2028-2029', undefined, wait)).toBeVisible();
    expect(screen.getByRole('link', { name: 'Quản lý mùa giải' })).toHaveAttribute(
      'href',
      '/workspace/seasons',
    );
    expect(requested[0]?.searchParams.get('sort')).toBe('code:asc');
    expect(requested[0]?.searchParams.get('pageSize')).toBe('20');
    expect(screen.getByText(/trong tổng số 41 kết quả/)).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    await waitFor(() => expect(requested.at(-1)?.searchParams.get('page')).toBe('2'), wait);

    fireEvent.change(screen.getByLabelText('Tìm mùa giải'), { target: { value: '  2028  ' } });
    await waitFor(() => expect(requested.at(-1)?.searchParams.get('search')).toBe('2028'), {
      timeout: 7_000,
    });
    expect(requested.at(-1)?.searchParams.get('page')).toBe('1');

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Trạng thái mùa giải' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Đã đóng' }, wait));
    await waitFor(() => expect(requested.at(-1)?.searchParams.get('state')).toBe('CLOSED'), wait);
    expect(requested.at(-1)?.searchParams.get('page')).toBe('1');
  },
);

test('season officers receive a neutral workspace label', async () => {
  const officer = {
    ...account,
    seasonRoles: [{ seasonId, roleCode: 'REGISTRATION_OFFICER' }],
  };
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(officer);
    if (path === '/api/v1/seasons') {
      const result = listResult();
      return envelope(result.data, result.meta);
    }
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  await screen.findByText('MG-2028-2029', undefined, wait);
  expect(screen.getByText('Nghiệp vụ mùa giải')).toBeVisible();
  expect(screen.queryByText('Quản lý mùa giải', { selector: 'small' })).not.toBeInTheDocument();
});

test(
  'season details keep code immutable and save normalized metadata against its revision',
  { timeout: 15_000 },
  async () => {
    const patchBodies: unknown[] = [];
    const historyRequests: URL[] = [];
    let detailReads = 0;
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const path = pathOf(input);
      if (path.endsWith('/auth/session')) return envelope(account);
      if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
      if (path === '/api/v1/seasons') {
        const result = listResult();
        return envelope(result.data, result.meta);
      }
      if (path === `/api/v1/seasons/${seasonId}` && init?.method === 'PATCH') {
        patchBodies.push(JSON.parse(String(init.body)));
        return envelope({ id: seasonId, revision: '2' });
      }
      if (path === `/api/v1/seasons/${seasonId}`) {
        detailReads++;
        return envelope({ ...baseSeason, revision: detailReads > 1 ? '2' : '1' });
      }
      if (path === `/api/v1/seasons/${seasonId}/history`) {
        historyRequests.push(new URL(String(input), 'https://whistle.test'));
        return envelope(
          {
            items: [
              {
                id: '00000000-0000-4000-8000-000000000091',
                actorKind: 'ACCOUNT',
                actorName: 'Quản lý mùa giải',
                operatorIdentity: null,
                occurredAt: '2028-08-16T03:00:00.000Z',
                actionCode: 'SEASON_UPDATED',
                outcome: 'SUCCESS',
                reason: null,
                before: { name: 'Tên cũ' },
                after: { name: 'Mùa mới' },
              },
            ],
          },
          { page: 1, pageSize: 20, total: 1 },
        );
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    open(fetcher);

    await screen.findByText('MG-2028-2029', undefined, wait);
    fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }));
    const drawer = await screen.findByRole('dialog', undefined, wait);
    expect(await within(drawer).findByText('Mã mùa giải', undefined, wait)).toBeVisible();
    expect(within(drawer).getByText('Chưa có quy định hiệu lực.')).toBeVisible();
    expect(within(drawer).queryByLabelText(/Mã mùa giải/)).not.toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole('button', { name: 'Chỉnh sửa thông tin mùa giải' }));
    const name = (await editDialog()).getByLabelText(/^Tên mùa giải/);
    fireEvent.change(name, { target: { value: '  Mùa   mới  ' } });
    expect((await editDialog()).getByText('Giá trị chuẩn hóa: Mùa mới')).toBeInTheDocument();
    fireEvent.click((await editDialog()).getByRole('button', { name: 'Lưu thông tin' }));

    await waitFor(() => expect(patchBodies).toHaveLength(1), wait);
    expect(patchBodies[0]).toEqual({ expectedRevision: '1', name: 'Mùa mới' });
    expect(
      await within(drawer).findByText('Đã cập nhật thông tin mùa giải.', undefined, wait),
    ).toBeVisible();
    expect(detailReads).toBeGreaterThan(1);

    fireEvent.click(within(drawer).getByRole('tab', { name: 'Lịch sử' }));
    expect(
      await within(drawer).findByText('Cập nhật thông tin mùa giải', undefined, wait),
    ).toBeVisible();
    expect(within(drawer).getByText('Tên cũ')).toBeVisible();
    expect(within(drawer).getByText('Mùa mới')).toBeVisible();
    fireEvent.mouseDown(within(drawer).getByRole('combobox', { name: 'Loại thao tác' }));
    fireEvent.click(await screen.findByRole('option', { name: 'Cập nhật mùa giải' }));
    fireEvent.change(within(drawer).getByLabelText('Từ thời điểm'), {
      target: { value: '16/08/2028 06:00' },
    });
    fireEvent.change(within(drawer).getByLabelText('Đến trước thời điểm'), {
      target: { value: '17/08/2028 06:00' },
    });
    fireEvent.click(within(drawer).getByRole('button', { name: 'Áp dụng bộ lọc' }));
    await waitFor(
      () => expect(historyRequests.at(-1)?.searchParams.get('actionCode')).toBe('SEASON_UPDATED'),
      wait,
    );
    const from = historyRequests.at(-1)?.searchParams.get('occurredFrom');
    const before = historyRequests.at(-1)?.searchParams.get('occurredBefore');
    expect(from).toBe(new Date('2028-08-16T06:00+07:00').toISOString());
    expect(before).toBe(new Date('2028-08-17T06:00+07:00').toISOString());
    expect(from).toMatch(/Z$/);
    expect(before).toMatch(/Z$/);
  },
);

test(
  'season metadata editing allows names with 200 astral code points',
  { timeout: 15000 },
  async () => {
    const longName = '😀'.repeat(200);
    let patchBody: unknown;
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const path = pathOf(input);
      if (path.endsWith('/auth/session')) return envelope(account);
      if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
      if (path === '/api/v1/seasons') {
        const result = listResult();
        return envelope(result.data, result.meta);
      }
      if (path === `/api/v1/seasons/${seasonId}` && init?.method === 'PATCH') {
        patchBody = JSON.parse(String(init.body));
        return envelope({ id: seasonId, revision: '2' });
      }
      if (path === `/api/v1/seasons/${seasonId}`)
        return envelope({ ...baseSeason, waitingRegulation: null });
      throw new Error(`Unexpected request: ${path}`);
    });
    open(fetcher);

    await screen.findByText('MG-2028-2029', undefined, wait);
    fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }));
    const drawer = await screen.findByRole('dialog', undefined, wait);
    fireEvent.click(
      await within(drawer).findByRole('button', { name: 'Chỉnh sửa thông tin mùa giải' }, wait),
    );
    const name = (await editDialog()).getByLabelText(/^Tên mùa giải/);
    expect(name).not.toHaveAttribute('maxLength');
    fireEvent.change(name, { target: { value: longName } });
    fireEvent.click((await editDialog()).getByRole('button', { name: 'Lưu thông tin' }));

    await waitFor(() => expect(patchBody).toEqual({ expectedRevision: '1', name: longName }), wait);
  },
);

test(
  'season edit stays disabled while a fresh detail response is pending',
  { timeout: 15000 },
  async () => {
    let detailReads = 0;
    let releaseRefresh: (() => void) | undefined;
    let editedName = 'Tên sau khi lưu';
    const refresh = new Promise<Response>((resolve) => {
      releaseRefresh = () =>
        resolve(
          envelope({ ...baseSeason, name: editedName, revision: '2', waitingRegulation: null }),
        );
    });
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const path = pathOf(input);
      if (path.endsWith('/auth/session')) return envelope(account);
      if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
      if (path === '/api/v1/seasons') {
        const result = listResult();
        return envelope(result.data, result.meta);
      }
      if (path === `/api/v1/seasons/${seasonId}` && init?.method === 'PATCH') {
        editedName = JSON.parse(String(init.body)).name;
        return envelope({ id: seasonId, revision: '2' });
      }
      if (path === `/api/v1/seasons/${seasonId}`) {
        detailReads++;
        return detailReads === 1 ? envelope({ ...baseSeason, waitingRegulation: null }) : refresh;
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    open(fetcher);

    await screen.findByText('MG-2028-2029', undefined, wait);
    fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }));
    const drawer = await screen.findByRole('dialog', undefined, wait);
    fireEvent.click(
      await within(drawer).findByRole('button', { name: 'Chỉnh sửa thông tin mùa giải' }, wait),
    );
    fireEvent.change((await editDialog()).getByLabelText(/^Tên mùa giải/), {
      target: { value: 'Tên sau khi lưu' },
    });
    fireEvent.click((await editDialog()).getByRole('button', { name: 'Lưu thông tin' }));

    const editButton = await within(drawer).findByRole('button', {
      name: 'Chỉnh sửa thông tin mùa giải',
    });
    await waitFor(() => expect(editButton).toBeDisabled(), wait);
    expect(within(drawer).getByText('Đang tải lại thông tin mùa giải…')).toBeVisible();
    releaseRefresh?.();
    await waitFor(() => expect(editButton).toBeEnabled(), wait);
    fireEvent.click(editButton);
    expect((await editDialog()).getByLabelText(/^Tên mùa giải/)).toHaveValue('Tên sau khi lưu');
  },
);

test('closed season metadata stays read-only while a manager can propose reopening', async () => {
  const closedSeason = {
    ...baseSeason,
    state: 'CLOSED',
    capabilities: { canEditMetadata: true },
  };
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path === '/api/v1/seasons') {
      const result = listResult(1, 1, [closedSeason]);
      return envelope(result.data, result.meta);
    }
    if (path === `/api/v1/seasons/${seasonId}`)
      return envelope({ ...closedSeason, effectiveRegulation: null, waitingRegulation: null });
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  await screen.findByText('Đã đóng', undefined, wait);
  fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }));
  const drawer = await screen.findByRole('dialog', undefined, wait);
  expect(
    await within(drawer).findByText(/chỉ có thể chỉnh sửa sau khi được mở lại/i, undefined, wait),
  ).toBeVisible();
  expect(
    within(drawer).queryByRole('button', { name: 'Chỉnh sửa thông tin mùa giải' }),
  ).not.toBeInTheDocument();
  expect(within(drawer).getByRole('button', { name: 'Đề xuất mở lại mùa giải' })).toBeVisible();
  expect(within(drawer).queryByRole('button', { name: 'Mở lại mùa giải' })).not.toBeInTheDocument();
});

test(
  'a revision conflict retains the draft, reviews fresh values, and rebases only attempted fields',
  { timeout: 15_000 },
  async () => {
    const patchBodies: Record<string, string>[] = [];
    let detailReads = 0;
    let currentSeason = { ...baseSeason, waitingRegulation: null };
    let releaseConflictRead: (() => void) | undefined;
    const conflictRead = new Promise<Response>((resolve) => {
      releaseConflictRead = () => resolve(envelope(currentSeason));
    });
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const path = pathOf(input);
      if (path.endsWith('/auth/session')) return envelope(account);
      if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
      if (path === '/api/v1/seasons') {
        const result = listResult();
        return envelope(result.data, result.meta);
      }
      if (path === `/api/v1/seasons/${seasonId}` && init?.method === 'PATCH') {
        const body = JSON.parse(String(init.body)) as Record<string, string>;
        patchBodies.push(body);
        if (patchBodies.length === 1) {
          currentSeason = {
            ...currentSeason,
            revision: '2',
            name: 'Tên đã được cập nhật ở nơi khác',
            competitionName: 'Giải đã được cập nhật ở nơi khác',
          };
          return Response.json(
            { error: { code: 'REVISION_CONFLICT' }, requestId: 'stale-season' },
            { status: 409 },
          );
        }
        currentSeason = { ...currentSeason, ...body, revision: '3' };
        return envelope({ id: seasonId, revision: '3' });
      }
      if (path === `/api/v1/seasons/${seasonId}`) {
        detailReads++;
        if (detailReads === 1) return envelope({ ...baseSeason, waitingRegulation: null });
        if (detailReads === 2) return conflictRead;
        return envelope(currentSeason);
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    open(fetcher);
    await screen.findByText('MG-2028-2029', undefined, wait);
    fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }));
    const drawer = await screen.findByRole('dialog', undefined, wait);
    fireEvent.click(
      await within(drawer).findByRole('button', { name: 'Chỉnh sửa thông tin mùa giải' }, wait),
    );
    fireEvent.change((await editDialog()).getByLabelText(/^Tên mùa giải/), {
      target: { value: 'Nội dung đang sửa' },
    });
    fireEvent.click((await editDialog()).getByRole('button', { name: 'Lưu thông tin' }));

    expect(await (await editDialog()).findByRole('alert', undefined, wait)).toHaveTextContent(
      'Dữ liệu đã thay đổi. Vui lòng tải lại và xem xét trước khi lưu.',
    );
    expect((await editDialog()).getByLabelText(/^Tên mùa giải/)).toHaveValue('Nội dung đang sửa');
    fireEvent.click(
      (await editDialog()).getByRole('button', { name: 'Tải lại và so sánh thay đổi' }),
    );
    expect(
      await within(drawer).findByText(
        'Đang tải dữ liệu mới; nội dung đã nhập được giữ lại.',
        undefined,
        wait,
      ),
    ).toBeVisible();
    releaseConflictRead?.();

    const review = await within(drawer).findByRole(
      'region',
      { name: 'So sánh thay đổi đã nhập' },
      wait,
    );
    expect(review).toHaveTextContent('Hiện tại: Tên đã được cập nhật ở nơi khác');
    expect(review).toHaveTextContent('Đã nhập: Nội dung đang sửa');
    expect(review).not.toHaveTextContent('Giải đã được cập nhật ở nơi khác');
    expect(within(drawer).queryByRole('button', { name: 'Lưu thông tin' })).not.toBeInTheDocument();
    expect(patchBodies).toHaveLength(1);

    fireEvent.click(
      within(drawer).getByRole('button', { name: 'Tiếp tục với thay đổi đã xem xét' }),
    );
    expect((await editDialog()).getByLabelText(/^Tên mùa giải/)).toHaveValue('Nội dung đang sửa');
    expect((await editDialog()).getByLabelText(/^Tên giải đấu/)).toHaveValue(
      'Giải đã được cập nhật ở nơi khác',
    );
    fireEvent.click((await editDialog()).getByRole('button', { name: 'Lưu thông tin' }));

    await waitFor(
      () => expect(patchBodies[1]).toEqual({ expectedRevision: '2', name: 'Nội dung đang sửa' }),
      wait,
    );
    expect(patchBodies).toHaveLength(2);
    expect(
      await within(drawer).findByText('Đã cập nhật thông tin mùa giải.', undefined, wait),
    ).toBeVisible();
  },
);

test(
  'a failed conflict reload preserves the draft and a newly closed season cannot resume editing',
  { timeout: 15_000 },
  async () => {
    let detailReads = 0;
    let patchCount = 0;
    let currentSeason = { ...baseSeason, waitingRegulation: null };
    const fetcher = vi.fn<typeof fetch>(async (input, init) => {
      const path = pathOf(input);
      if (path.endsWith('/auth/session')) return envelope(account);
      if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
      if (path === '/api/v1/seasons') {
        const result = listResult();
        return envelope(result.data, result.meta);
      }
      if (path === `/api/v1/seasons/${seasonId}` && init?.method === 'PATCH') {
        patchCount++;
        currentSeason = {
          ...currentSeason,
          state: 'CLOSED',
          revision: '2',
          name: 'Tên mùa giải đã đóng',
          capabilities: { canEditMetadata: false },
        };
        return Response.json(
          { error: { code: 'REVISION_CONFLICT' }, requestId: 'closed-season-conflict' },
          { status: 409 },
        );
      }
      if (path === `/api/v1/seasons/${seasonId}`) {
        detailReads++;
        if (detailReads === 1) return envelope({ ...baseSeason, waitingRegulation: null });
        if (detailReads === 2)
          return Response.json(
            { error: { code: 'MAINTENANCE' }, requestId: 'temporary-season-read-failure' },
            { status: 503 },
          );
        return envelope(currentSeason);
      }
      throw new Error(`Unexpected request: ${path}`);
    });
    open(fetcher);

    await screen.findByText('MG-2028-2029', undefined, wait);
    fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }));
    const drawer = await screen.findByRole('dialog', undefined, wait);
    fireEvent.click(
      await within(drawer).findByRole('button', { name: 'Chỉnh sửa thông tin mùa giải' }, wait),
    );
    fireEvent.change((await editDialog()).getByLabelText(/^Tên mùa giải/), {
      target: { value: 'Nội dung chưa lưu' },
    });
    fireEvent.click((await editDialog()).getByRole('button', { name: 'Lưu thông tin' }));
    await (await editDialog()).findByRole('alert', undefined, wait);
    expect(patchCount).toBe(1);

    fireEvent.click(
      (await editDialog()).getByRole('button', { name: 'Tải lại và so sánh thay đổi' }),
    );
    expect(
      await within(drawer).findByText(/Nội dung đã nhập vẫn được giữ lại/, undefined, wait),
    ).toBeVisible();
    fireEvent.click(within(drawer).getByRole('button', { name: 'Thử lại' }));

    const review = await within(drawer).findByRole(
      'region',
      { name: 'So sánh thay đổi đã nhập' },
      wait,
    );
    expect(review).toHaveTextContent('Hiện tại: Tên mùa giải đã đóng');
    expect(review).toHaveTextContent('Đã nhập: Nội dung chưa lưu');
    expect(
      within(drawer).queryByRole('button', { name: 'Tiếp tục với thay đổi đã xem xét' }),
    ).not.toBeInTheDocument();
    expect(within(drawer).getByText(/không còn cho phép sửa thông tin/i)).toBeVisible();

    fireEvent.click(within(drawer).getByRole('button', { name: 'Bỏ nội dung đã nhập' }));
    expect(
      within(drawer).queryByRole('button', { name: 'Chỉnh sửa thông tin mùa giải' }),
    ).not.toBeInTheDocument();
    expect(
      await within(drawer).findByText(
        'Mùa giải đã đóng. Tên mùa giải, tên giải đấu và ngày chỉ có thể chỉnh sửa sau khi được mở lại bằng phê duyệt độc lập.',
        undefined,
        wait,
      ),
    ).toBeVisible();
  },
);

test('season list shows only persisted effective regulation versions and uses response metadata', async () => {
  const seasonWithRegulation = {
    ...baseSeason,
    effectiveRegulation: {
      versionId: '00000000-0000-4000-8000-000000000031',
      versionNumber: 3,
      activeFrom: '2028-08-15T00:00:00.000Z',
      activeUntil: null,
    },
  };
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    const path = pathOf(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path === '/api/v1/seasons')
      return envelope({ items: [seasonWithRegulation] }, { page: 1, pageSize: 20, total: 21 });
    throw new Error(`Unexpected request: ${path}`);
  });
  open(fetcher);

  const row = await screen.findByRole('row', { name: /MG-2028-2029/ }, wait);
  expect(within(row).getByText(/Phiên bản 3/)).toBeVisible();
  expect(screen.getByText(/trong tổng số 21 kết quả/)).toBeVisible();
});

// rc-util uses a constant title id under NODE_ENV=test; nested portal dialogs share it.
// Real browser coverage checks the accessible title and animations.
async function editDialog() {
  const heading = await screen.findByText(
    'Chỉnh sửa thông tin mùa giải',
    { selector: '.ant-modal-title' },
    wait,
  );
  return within(heading.closest('[role="dialog"]') as HTMLElement);
}
