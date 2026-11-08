import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

const envelope = (data: unknown) => Response.json({ data, requestId: 'fixture-request' });

afterEach(() => vi.unstubAllGlobals());

it.each([
  {
    actionCode: 'CREATE_SEASON_GRANTED',
    before: { granted: false },
    after: { granted: true },
    expected: ['Chưa được cấp', 'Đã được cấp', 'Quyền Tạo mùa giải'],
  },
  {
    actionCode: 'SYSTEM_ROLE_REVOKED',
    before: { roleCode: 'SYSTEM_ADMINISTRATOR', granted: true },
    after: { granted: false },
    expected: ['Quản trị hệ thống', 'Đã thu hồi'],
  },
  {
    actionCode: 'ACCOUNT_LOCKED',
    before: { state: 'ACTIVE' },
    after: { state: 'LOCKED' },
    expected: ['Đang hoạt động', 'Đã khóa'],
  },
  {
    actionCode: 'CREATE_SEASON_GRANTED',
    before: null,
    after: { grantId: 'legacy-grant' },
    expected: ['Không có dữ liệu trước thay đổi được ghi nhận.', 'legacy-grant'],
  },
  {
    actionCode: 'ACCOUNT_CREATED',
    before: null,
    after: { fullName: 'Nhân viên mới' },
    expected: ['Đối tượng chưa được tạo.', 'Nhân viên mới'],
  },
  {
    actionCode: 'LOGIN_SUCCEEDED',
    before: null,
    after: null,
    expected: ['Sự kiện xác thực không có nội dung thay đổi dữ liệu nghiệp vụ để so sánh.'],
  },
])(
  'explains recorded changes and absent history for $actionCode',
  async ({ expected, ...change }) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string) => {
        if (path.endsWith('/auth/session'))
          return envelope({
            id: 'admin',
            personnelCode: 'ADMIN',
            fullName: 'Quản trị viên',
            username: 'admin',
            changeRequired: false,
            systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }],
          });
        return envelope({
          items: [
            {
              id: 'audit-row',
              actorKind: 'SYSTEM',
              actorId: null,
              actorName: null,
              operatorIdentity: null,
              occurredAt: '2026-11-05T03:00:00Z',
              objectKind: 'Account',
              objectId: null,
              objectName: null,
              seasonCode: null,
              seasonId: null,
              outcome: 'SUCCESS',
              reason: null,
              ...change,
            },
          ],
          page: 1,
          pageSize: 20,
          total: 1,
        });
      }),
    );
    render(
      <MemoryRouter initialEntries={['/admin/audit']}>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Chi tiết' }, { timeout: 5000 }));
    if (change.before || change.after) {
      const before = within(screen.getByRole('heading', { name: 'Trước thay đổi' }).parentElement!);
      const after = within(screen.getByRole('heading', { name: 'Sau thay đổi' }).parentElement!);
      expect(before.getByText(expected[0])).toBeInTheDocument();
      expect(before.queryByText(expected[1])).not.toBeInTheDocument();
      expect(after.getByText(expected[1])).toBeInTheDocument();
      expect(after.queryByText(expected[0])).not.toBeInTheDocument();
      if (expected[2]) expect(screen.getByText(expected[2])).toBeInTheDocument();
    } else
      for (const text of expected)
        expect(await screen.findByText(text, undefined, { timeout: 5000 })).toBeInTheDocument();
  },
  15000,
);

it('sends only the applied audit filters, paginates, and retries a safe read error', async () => {
  const actorId = '12345678-1234-4234-8234-123456789012';
  let failed = false;
  const fetcher = vi.fn(async (path: string) => {
    if (path.endsWith('/auth/session'))
      return envelope({
        id: 'admin',
        personnelCode: 'ADMIN',
        fullName: 'Quản trị viên',
        username: 'admin',
        changeRequired: false,
        systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }],
      });
    const { searchParams } = new URL(path, 'https://whistle.test');
    if (searchParams.get('page') === '2') {
      if (!failed) {
        failed = true;
        return Response.json(
          {
            error: { code: 'INTERNAL_ERROR', message: 'raw database failure' },
            requestId: 'audit-error',
          },
          { status: 500 },
        );
      }
      return envelope({ items: [], page: 2, pageSize: 20, total: 21 });
    }
    return envelope({
      items: [],
      page: 1,
      pageSize: 20,
      total: searchParams.has('actorId') ? 21 : 0,
    });
  });
  vi.stubGlobal('fetch', fetcher);
  render(
    <MemoryRouter initialEntries={['/admin/audit']}>
      <App />
    </MemoryRouter>,
  );
  await screen.findByText('Chưa có dữ liệu phù hợp.', undefined, { timeout: 5000 });
  const reads = fetcher.mock.calls.length;
  fireEvent.change(screen.getByLabelText('Mã người thực hiện'), { target: { value: '1234' } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(fetcher.mock.calls).toHaveLength(reads);
  fireEvent.change(screen.getByLabelText('Mã người thực hiện'), { target: { value: actorId } });
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '05/11/2026' } });
  fireEvent.keyDown(screen.getByLabelText('Từ ngày'), { key: 'Enter', code: 'Enter' });
  fireEvent.blur(screen.getByLabelText('Từ ngày'));
  fireEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
  await screen.findByText(/21 bản ghi/);
  const query = new URL(fetcher.mock.calls.at(-1)![0], 'https://whistle.test');
  expect(query.pathname).toBe('/api/v1/audit-logs');
  expect(Object.fromEntries(query.searchParams)).toMatchObject({
    actorId,
    occurredFrom: '2026-11-04T17:00:00.000Z',
  });
  fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
  await screen.findByText(/Trang 2 \/ 2/);
  expect(screen.queryByText(/raw database failure/)).not.toBeInTheDocument();
}, 15000);
