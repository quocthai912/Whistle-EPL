import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

const timeout = { timeout: 5000 };
const admin = {
  id: 'admin',
  fullName: 'Quản trị viên',
  personnelCode: 'ADMIN',
  username: 'admin',
  changeRequired: false,
  systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }],
};
const envelope = (data: unknown) => Response.json({ data, requestId: 'list-state' });

beforeAll(async () => {
  await import('../src/features/accounts/AdministrationLayout');
});
afterEach(() => vi.unstubAllGlobals());

/** Mounts the actual routed list and records requests while keeping pagination available. */
function mountList(route: string) {
  const requests: URL[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      if (path.endsWith('/auth/session')) return envelope(admin);
      const url = new URL(path, 'https://whistle.test');
      requests.push(url);
      return envelope({
        items: [],
        page: Number(url.searchParams.get('page') ?? 1),
        pageSize: 20,
        total: 60,
        seasons: [],
        proposalSeasons: [],
        recipients: [],
      });
    }),
  );
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
  return requests;
}

it.each([
  ['/admin/accounts', '/accounts', 'Tìm tài khoản', false],
  ['/admin/delegations', '/delegation-proposals', 'Tìm ủy quyền', false],
  ['/admin/delegations', '/delegation-grants', 'Tìm ủy quyền', true],
] as const)(
  'resets the page when a search commits in %s (%s)',
  async (route, endpoint, label, grants) => {
    const requests = mountList(route);
    const input = await screen.findByRole('textbox', { name: label }, timeout);
    if (grants) fireEvent.click(screen.getByRole('tab', { name: 'Ủy quyền đã cấp' }));
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Trang sau' })).toBeEnabled(),
      timeout,
    );
    const next = screen.getByRole('button', { name: 'Trang sau' });
    // Both actions occur before the debounce timer can commit the new term.
    fireEvent.change(input, { target: { value: 'An' } });
    fireEvent.click(next);
    await waitFor(
      () =>
        expect(
          requests.some(
            (url) => url.pathname.endsWith(endpoint) && url.searchParams.get('search') === 'An',
          ),
        ).toBe(true),
      timeout,
    );
    const matches = requests.filter(
      (url) => url.pathname.endsWith(endpoint) && url.searchParams.get('search') === 'An',
    );
    expect(matches.map((url) => url.searchParams.get('page'))).toEqual(['1']);
  },
  15000,
);

it('disables audit pagination while search input is ahead of the committed term', async () => {
  const requests = mountList('/admin/audit');
  const input = await screen.findByRole('textbox', { name: 'Tìm nhật ký' }, timeout);
  const next = await screen.findByRole('button', { name: 'Trang sau' }, timeout);
  await waitFor(() => expect(next).toBeEnabled(), timeout);
  fireEvent.change(input, { target: { value: 'An' } });
  expect(next).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled();
  await waitFor(
    () => expect(requests.some((url) => url.searchParams.get('search') === 'An')).toBe(true),
    timeout,
  );
  await waitFor(
    () => expect(screen.getByRole('button', { name: 'Trang sau' })).toBeEnabled(),
    timeout,
  );
}, 15000);

it('keeps submitted audit identifiers when an automatic filter changes during identifier editing', async () => {
  const requests = mountList('/admin/audit');
  await screen.findByRole('textbox', { name: 'Tìm nhật ký' }, timeout);
  const actorId = '12345678-1234-4234-8234-123456789012';
  const objectId = '22345678-1234-4234-8234-123456789012';
  fireEvent.change(screen.getByLabelText('Mã người thực hiện'), { target: { value: actorId } });
  fireEvent.change(screen.getByLabelText('Mã đối tượng'), { target: { value: objectId } });
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
  await waitFor(() => expect(requests.at(-1)?.searchParams.get('actorId')).toBe(actorId), timeout);
  fireEvent.change(screen.getByLabelText('Mã người thực hiện'), { target: { value: '1234' } });
  fireEvent.change(screen.getByLabelText('Mã đối tượng'), { target: { value: '' } });
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Số dòng mỗi trang' }));
  fireEvent.click(await screen.findByRole('option', { name: '50' }, timeout));
  await waitFor(() => expect(requests.at(-1)?.searchParams.get('pageSize')).toBe('50'), timeout);
  expect(requests.at(-1)?.searchParams.get('actorId')).toBe(actorId);
  expect(requests.at(-1)?.searchParams.get('objectId')).toBe(objectId);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Mã người thực hiện')).toHaveValue('1234');
  expect(screen.getByLabelText('Mã đối tượng')).toHaveValue('');
  expect(screen.getByText(/Mã người thực hiện chưa áp dụng/)).toHaveTextContent(actorId);
  expect(screen.getByText(/Mã đối tượng chưa áp dụng/)).toHaveTextContent(objectId);
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('định dạng UUID');
}, 15000);

it('submits audit search and actor together without requesting the previous search', async () => {
  const requests = mountList('/admin/audit');
  const input = await screen.findByRole('textbox', { name: 'Tìm nhật ký' }, timeout);
  fireEvent.change(input, { target: { value: 'old search' } });
  await waitFor(
    () => expect(requests.at(-1)?.searchParams.get('search')).toBe('old search'),
    timeout,
  );
  const actorId = '12345678-1234-4234-8234-123456789012';
  fireEvent.change(input, { target: { value: 'new search' } });
  fireEvent.change(screen.getByLabelText('Mã người thực hiện'), { target: { value: actorId } });
  const beforeSubmit = requests.length;
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
  await waitFor(() => expect(requests.at(-1)?.searchParams.get('actorId')).toBe(actorId), timeout);
  const submitted = requests
    .slice(beforeSubmit)
    .filter((url) => url.pathname.endsWith('/audit-logs'));
  expect(submitted.length).toBeGreaterThan(0);
  expect(submitted.every((url) => url.searchParams.get('search') === 'new search')).toBe(true);
  await waitFor(
    () => expect(screen.getByRole('button', { name: 'Trang sau' })).toBeEnabled(),
    timeout,
  );
  expect(requests.at(-1)?.searchParams.get('search')).toBe('new search');
  // Submit and restore the already-settled value before the timer can change it.
  fireEvent.change(input, { target: { value: 'submitted search' } });
  const beforeRestore = requests.length;
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
  fireEvent.change(input, { target: { value: 'new search' } });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
  const restored = requests
    .slice(beforeRestore)
    .filter((url) => url.pathname.endsWith('/audit-logs'));
  const submittedIndex = restored.findIndex(
    (url) => url.searchParams.get('search') === 'submitted search',
  );
  expect(submittedIndex).toBeGreaterThanOrEqual(0);
  expect(
    restored
      .slice(submittedIndex + 1)
      .some((url) => url.searchParams.get('search') === 'new search'),
  ).toBe(true);
  fireEvent.change(input, { target: { value: 'pending search' } });
  const beforeReset = requests.length;
  fireEvent.click(screen.getByRole('button', { name: 'Đặt lại' }));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
  const reset = requests.slice(beforeReset).filter((url) => url.pathname.endsWith('/audit-logs'));
  expect(reset.length).toBeGreaterThan(0);
  expect(reset.every((url) => !url.searchParams.has('search'))).toBe(true);
}, 15000);

it('refreshes an open grant drawer from new results and closes it when that grant disappears', async () => {
  const grant = {
    id: 'grant',
    revision: '1',
    state: 'ACTIVE',
    recipient: { id: 'recipient', fullName: 'Người nhận', personnelCode: 'STAFF' },
    proposer: { id: 'proposer', fullName: 'Người đề xuất', personnelCode: 'MANAGER' },
    season: { id: 'season', name: '2026/2027', code: '2026/2027' },
    actionCode: 'APPROVE_SCHEDULE_ADJUSTMENT',
    startsAt: '2026-11-01T00:00:00Z',
    endsAt: '2026-12-01T00:00:00Z',
    reason: null,
    basis: 'Hỗ trợ',
  };
  let items = [grant];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      if (path.endsWith('/auth/session')) return envelope(admin);
      return envelope({
        items: path.includes('/delegation-grants') ? items : [],
        page: 1,
        pageSize: 20,
        total: 1,
        seasons: [],
        proposalSeasons: [],
        recipients: [],
      });
    }),
  );
  render(
    <MemoryRouter initialEntries={['/admin/delegations']}>
      <App />
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('tab', { name: 'Ủy quyền đã cấp' }, timeout));
  fireEvent.click(await screen.findByRole('button', { name: 'Chi tiết' }, timeout));
  expect(within(screen.getByRole('dialog')).getByText('Đang hiệu lực')).toBeInTheDocument();
  items = [{ ...grant, state: 'EXPIRED', revision: '2' }];
  fireEvent.click(screen.getByRole('button', { name: 'Làm mới danh sách ủy quyền' }));
  await waitFor(
    () => expect(within(screen.getByRole('dialog')).getByText('Hết hạn')).toBeInTheDocument(),
    timeout,
  );
  expect(
    within(screen.getByRole('dialog')).queryByRole('button', { name: 'Thu hồi ủy quyền' }),
  ).not.toBeInTheDocument();
  items = [];
  fireEvent.click(screen.getByRole('button', { name: 'Làm mới danh sách ủy quyền' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), timeout);
}, 15000);
