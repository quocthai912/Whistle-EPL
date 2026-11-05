import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  systemRoles: [],
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
});
