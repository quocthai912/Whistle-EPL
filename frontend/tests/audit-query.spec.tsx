import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../src/app/App';

const envelope = (data: unknown) => Response.json({ data, requestId: 'fixture-request' });

afterEach(() => vi.unstubAllGlobals());

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
  fireEvent.change(screen.getByLabelText('Mã người thực hiện'), { target: { value: actorId } });
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-11-05' } });
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
});
