import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
const uiWait = { timeout: 5_000 };
afterEach(() => vi.unstubAllGlobals());

describe('administration navigation and confirmation', () => {
  it.each([true, false])(
    'offers self-service password change only for the signed-in account (self=%s)',
    { timeout: 15000 },
    async (self) => {
      const item = { ...row, id: self ? account.id : row.id };
      const fetcher = vi.fn(async (path: string) =>
        path.endsWith('/auth/session')
          ? envelope({ ...account, systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }] })
          : envelope({ items: [item], page: 1, pageSize: 20, total: 1, seasons: [] }),
      );
      vi.stubGlobal('fetch', fetcher);
      render(
        <MemoryRouter initialEntries={['/admin/accounts']}>
          <App />
        </MemoryRouter>,
      );
      const detail = await screen.findByRole('button', { name: 'Chi tiết' }, uiWait);
      expect(
        within(screen.getByRole('banner')).queryByRole('link', { name: 'Đổi mật khẩu' }),
      ).not.toBeInTheDocument();
      fireEvent.click(detail);
      if (self) {
        expect(screen.queryByRole('button', { name: 'Đặt lại mật khẩu' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
        expect(await screen.findByRole('heading', { name: 'Đổi mật khẩu' }, uiWait)).toBeVisible();
        expect(screen.getByLabelText(/^Mật khẩu hiện tại \*/i)).toBeVisible();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      } else {
        expect(screen.queryByRole('button', { name: 'Đổi mật khẩu' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Đặt lại mật khẩu' }));
        const temporaryPassword = await screen.findByLabelText('Mật khẩu tạm *', undefined, uiWait);
        expect(temporaryPassword).toHaveAttribute('type', 'password');
        expect(temporaryPassword).toBeRequired();
        expect(screen.queryByLabelText(/^Mật khẩu hiện tại \*/i)).not.toBeInTheDocument();
      }
      expect(fetcher.mock.calls.some(([path]) => path.endsWith('/reset-password'))).toBe(false);
    },
  );
  it('does not load account data for a non-administrator on direct navigation', async () => {
    const fetcher = vi.fn(async () => envelope(account));
    vi.stubGlobal('fetch', fetcher);
    render(
      <MemoryRouter initialEntries={['/admin/accounts']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('Bạn không có quyền truy cập trang này.', undefined, uiWait);
    expect(screen.queryByText('Quản lý mùa giải')).not.toBeInTheDocument();
    expect(fetcher.mock.calls).toHaveLength(1);
  });
  it('cancels a lock without submitting a command', { timeout: 15000 }, async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }));
    fireEvent.click(screen.getByRole('button', { name: 'Khóa' }));
    const cancel = await screen.findByRole('button', { name: /^Hủy$/ });
    const confirmation = cancel.closest('[role="dialog"]');
    expect(confirmation).toBeInTheDocument();
    fireEvent.click(cancel);
    await waitFor(() => expect(confirmation).not.toBeInTheDocument());
    expect(fetcher.mock.calls.map(([path]) => path)).not.toContain(
      '/api/v1/accounts/employee/lock',
    );
  });

  it(
    'keeps the selected grants tab open while a failed refresh is retried',
    { timeout: 30_000 },
    async () => {
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
      fireEvent.click(await screen.findByRole('button', { name: 'Chi tiết' }, uiWait));
      fireEvent.click(screen.getByRole('tab', { name: 'Quyền hệ thống' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cấp vai trò quản trị' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }, uiWait));

      await screen.findByText('Đang tải dữ liệu…', undefined, uiWait);
      expect(screen.getByRole('cell', { name: row.fullName })).toBeVisible();
      expect(screen.getByRole('tab', { name: 'Quyền hệ thống' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      failRefresh(Response.json({ error: { code: 'REQUEST_FAILED' } }, { status: 500 }));
      const retry = await screen.findByRole('button', { name: 'Thử lại' }, uiWait);
      expect(screen.getByRole('cell', { name: row.fullName })).toBeVisible();
      expect(screen.getByRole('tab', { name: 'Quyền hệ thống' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      fireEvent.click(retry);
      await screen.findByRole('button', { name: 'Thu hồi vai trò quản trị' }, uiWait);
      expect(screen.getByRole('tab', { name: 'Quyền hệ thống' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    },
  );

  it(
    'reviews and retries a conflict for an account beyond the first search page',
    { timeout: 30_000 },
    async () => {
      const fresh = { ...row, fullName: 'Nguyễn An cập nhật', revision: '7' };
      const matches = [
        ...Array.from({ length: 100 }, (_, index) => ({
          ...row,
          id: 'other-' + index,
          username: row.username + '.' + index,
        })),
        fresh,
      ];
      const submitted: string[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn(async (path: string, init?: RequestInit) => {
          if (path.endsWith('/auth/session'))
            return envelope({ ...account, systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }] });
          if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'a'.repeat(43) });
          if (path.endsWith('/accounts/employee/lock')) {
            submitted.push(String(init?.body));
            return submitted.length === 1
              ? Response.json({ error: { code: 'REVISION_CONFLICT' } }, { status: 409 })
              : envelope({ id: row.id, revision: '8' });
          }
          const query = new URL(path, 'https://example.test').searchParams;
          const page = Number(query.get('page') ?? '1');
          const pageSize = Number(query.get('pageSize') ?? '20');
          const rows = query.has('search') ? matches : [row];
          return envelope({
            items: rows.slice((page - 1) * pageSize, page * pageSize),
            page,
            pageSize,
            total: rows.length,
            seasons: [],
          });
        }),
      );
      render(
        <MemoryRouter initialEntries={['/admin/accounts']}>
          <App />
        </MemoryRouter>,
      );
      fireEvent.click(await screen.findByRole('button', { name: 'Chi tiết' }, uiWait));
      fireEvent.click(await screen.findByRole('button', { name: 'Khóa' }, uiWait));
      fireEvent.click(await screen.findByRole('button', { name: 'Xác nhận' }, uiWait));
      fireEvent.click(
        await screen.findByRole('button', { name: 'Tải dữ liệu mới để xem lại' }, uiWait),
      );
      expect(await screen.findByText(/Nguyễn An cập nhật/, undefined, uiWait)).toBeInTheDocument();
      fireEvent.click(await screen.findByRole('button', { name: 'Dùng thông tin đã xem' }, uiWait));
      fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }));
      await screen.findByText('Đã lưu thay đổi.', undefined, uiWait);
      expect(submitted).toEqual(['{"expectedRevision":"1"}', '{"expectedRevision":"7"}']);
    },
  );

  it(
    'shows loading for a returning query until its new request finishes',
    { timeout: 15000 },
    async () => {
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
      fireEvent.mouseDown(stateFilter);
      fireEvent.click(await screen.findByRole('option', { name: 'Đã khóa' }));
      await screen.findByText('Đang tải dữ liệu…');
      fireEvent.mouseDown(stateFilter);
      fireEvent.click(await screen.findByRole('option', { name: 'Tất cả trạng thái' }));
      expect(unfilteredReads).toBe(2);
      expect(screen.getByText(row.fullName)).toBeVisible();
      expect(screen.getByText('Đang tải dữ liệu…')).toBeVisible();

      await act(async () => finishLocked(list('Kết quả bộ lọc cũ')));
      expect(screen.getByText('Đang tải dữ liệu…')).toBeVisible();
      expect(screen.queryByText('Kết quả bộ lọc cũ')).not.toBeInTheDocument();
      await act(async () => finishReturning(list('Nguyễn An mới')));
      expect(screen.getByText('Nguyễn An mới')).toBeVisible();
      expect(screen.queryByText('Đang tải dữ liệu…')).not.toBeInTheDocument();
    },
  );
});
