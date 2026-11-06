import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

const account = {
  id: 'admin',
  personnelCode: 'ADMIN',
  fullName: 'Quản trị viên',
  username: 'admin',
  changeRequired: false,
};
const envelope = (data: unknown) => Response.json({ data, requestId: 'audit-request' });
const openAudit = () =>
  render(
    <MemoryRouter initialEntries={['/admin/audit']}>
      <App />
    </MemoryRouter>,
  );
afterEach(() => vi.unstubAllGlobals());

it('denies direct audit navigation without requesting records for ordinary accounts', async () => {
  const fetcher = vi.fn(async () => envelope(account));
  vi.stubGlobal('fetch', fetcher);
  openAudit();
  await screen.findByText('Bạn không có quyền truy cập trang này.', undefined, { timeout: 5000 });
  expect(fetcher.mock.calls).toHaveLength(1);
});

it('shows read-only metadata in Vietnamese and renders stored text literally', async () => {
  const label = '<img src=x onerror=alert(1)>';
  const fetcher = vi.fn(async (path: string) =>
    path.endsWith('/auth/session')
      ? envelope({ ...account, systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }] })
      : envelope({
          page: 1,
          pageSize: 20,
          total: 1,
          items: [
            {
              id: 'row',
              actorKind: 'ACCOUNT',
              actorId: 'admin',
              actorName: 'Nguyễn An',
              occurredAt: '2026-11-05T03:00:00Z',
              actionCode: 'ACCOUNT_UPDATED',
              objectKind: 'Account',
              objectName: label,
              outcome: 'SUCCESS',
              reason: label,
              after: { fullName: label },
            },
          ],
        }),
  );
  vi.stubGlobal('fetch', fetcher);
  openAudit();
  await screen.findByRole('heading', { name: 'Tra cứu nhật ký hoạt động' }, { timeout: 5000 });
  expect(await screen.findByRole('cell', { name: label })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Chi tiết' }));
  const detail = await screen.findByRole('dialog');
  expect(detail).toHaveTextContent(label);
  expect(detail.querySelector('img')).toBeNull();
  expect(screen.queryByRole('button', { name: /xuất nhật ký|chỉnh sửa|xóa bản ghi/i })).toBeNull();
  expect(fetcher.mock.calls).toHaveLength(2);
});
