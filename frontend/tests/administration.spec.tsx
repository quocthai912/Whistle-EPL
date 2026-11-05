import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

const account = {
  id: 'admin',
  personnelCode: 'ADMIN',
  fullName: 'Quản trị viên',
  username: 'admin',
  changeRequired: false,
};
const row = {
  id: 'employee',
  personnelCode: 'STAFF-01',
  fullName: 'Nguyễn An',
  username: 'staff.01',
  state: 'ACTIVE',
  mustChangePassword: false,
  revision: '1',
  systemRoles: [] as { id: string; roleCode: string }[],
  seasonRoles: [],
  sharedGrants: [],
  createSeasonGrants: [],
};
const envelope = (data: unknown) => Response.json({ data, requestId: 'request-1' });
afterEach(() => vi.unstubAllGlobals());

describe('administration navigation and confirmation', () => {
  it('does not load account data for a non-administrator on direct navigation', async () => {
    const fetcher = vi.fn(async () => envelope(account));
    vi.stubGlobal('fetch', fetcher);
    render(
      <MemoryRouter initialEntries={['/admin/accounts']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('Bạn không có quyền truy cập trang này.');
    expect(fetcher.mock.calls).toHaveLength(1);
  });
  it('cancels a lock without submitting a command', async () => {
    const fetcher = vi.fn(async (path: string) =>
      path.includes('/auth/session')
        ? envelope({ ...account, systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }] })
        : envelope({ items: [row], page: 1, pageSize: 20, total: 1, seasons: [] }),
    );
    vi.stubGlobal('fetch', fetcher);
    render(
      <MemoryRouter initialEntries={['/admin/accounts']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('Nguyễn An');
    fireEvent.click(screen.getByRole('button', { name: 'Khóa' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /^Hủy$/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(fetcher.mock.calls.map(([path]) => path)).not.toContain(
      '/api/v1/accounts/employee/lock',
    );
  });

  it('keeps the selected grants tab open while a failed refresh is retried', async () => {
    let failRefresh!: (response: Response) => void;
    const refresh = new Promise<Response>((resolve) => {
      failRefresh = resolve;
    });
    let listReads = 0;
    const list = (item: typeof row) =>
      envelope({ items: [item], page: 1, pageSize: 20, total: 1, seasons: [] });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path.endsWith('/auth/session'))
          return envelope({ ...account, systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }] });
        if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'a'.repeat(43) });
        if (path.endsWith('/system-role-assignments'))
          return envelope({ id: row.id, revision: '2' });
        listReads++;
        if (listReads === 1) return list(row);
        if (listReads === 2) return refresh;
        return list({
          ...row,
          revision: '2',
          systemRoles: [{ id: 'assignment', roleCode: 'SYSTEM_ADMINISTRATOR' }],
        });
      }),
    );
    render(
      <MemoryRouter initialEntries={['/admin/accounts']}>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Chi tiết' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Vai trò hệ thống' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cấp vai trò quản trị' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }));

    await screen.findByText('Đang tải dữ liệu…');
    expect(screen.getByRole('tab', { name: 'Vai trò hệ thống' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    failRefresh(Response.json({ error: { code: 'REQUEST_FAILED' } }, { status: 500 }));
    const retry = await screen.findByRole('button', { name: 'Thử lại' });
    expect(screen.getByRole('tab', { name: 'Vai trò hệ thống' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    fireEvent.click(retry);
    await screen.findByRole('button', { name: 'Thu hồi vai trò quản trị' });
    expect(screen.getByRole('tab', { name: 'Vai trò hệ thống' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('shows loading for a returning query until its new request finishes', async () => {
    let finishLocked!: (response: Response) => void;
    let finishReturning!: (response: Response) => void;
    const locked = new Promise<Response>((resolve) => {
      finishLocked = resolve;
    });
    const returning = new Promise<Response>((resolve) => {
      finishReturning = resolve;
    });
    let unfilteredReads = 0;
    const list = (fullName: string) =>
      envelope({ items: [{ ...row, fullName }], page: 1, pageSize: 20, total: 1, seasons: [] });
    const fetcher = vi.fn(async (path: string) => {
      if (path.endsWith('/auth/session'))
        return envelope({ ...account, systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }] });
      if (path.includes('state=LOCKED')) return locked;
      return ++unfilteredReads === 1 ? list(row.fullName) : returning;
    });
    vi.stubGlobal('fetch', fetcher);
    render(
      <MemoryRouter initialEntries={['/admin/accounts']}>
        <App />
      </MemoryRouter>,
    );

    await screen.findByText(row.fullName);
    const stateFilter = screen.getByRole('combobox', { name: /Trạng thái/ });
    fireEvent.change(stateFilter, { target: { value: 'LOCKED' } });
    await screen.findByText('Đang tải dữ liệu…');
    fireEvent.change(stateFilter, { target: { value: '' } });
    expect(unfilteredReads).toBe(2);
    expect(screen.getByText(row.fullName)).toBeVisible();
    expect(screen.getByText('Đang tải dữ liệu…')).toBeVisible();

    await act(async () => finishLocked(list('Kết quả bộ lọc cũ')));
    expect(screen.getByText('Đang tải dữ liệu…')).toBeVisible();
    expect(screen.queryByText('Kết quả bộ lọc cũ')).not.toBeInTheDocument();
    await act(async () => finishReturning(list('Nguyễn An mới')));
    expect(screen.getByText('Nguyễn An mới')).toBeVisible();
    expect(screen.queryByText('Đang tải dữ liệu…')).not.toBeInTheDocument();
  });
});
