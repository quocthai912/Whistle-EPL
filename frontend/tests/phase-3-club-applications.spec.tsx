import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { expect, it, vi } from 'vitest';
import { ClubApplicationsPage } from '../src/features/registrations/ClubApplicationsPage';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('../src/shared/http/use-session', () => {
  const client = { request };
  const session = { seasonManagerIds: ['assigned'] };
  return { useSession: () => ({ client, session }) };
});

const assignedSeason = {
  id: 'assigned',
  name: 'Mùa giải được phân công',
  code: 'EPL',
  state: 'OPEN',
};
const emptyNotice = /Bạn chưa được phân công mùa giải nào/;

it.each([true, false])(
  'recovers a failed season page (assigned season found: %s)',
  async (assigned) => {
    request.mockReset();
    request
      .mockResolvedValueOnce({ data: { items: [] }, meta: { page: 1, pageSize: 100, total: 201 } })
      .mockRejectedValueOnce(new Error('Temporarily unavailable'))
      .mockResolvedValueOnce({ data: { items: assigned ? [assignedSeason] : [] } })
      .mockResolvedValueOnce({ data: { items: [] } });

    render(
      <MemoryRouter>
        <ClubApplicationsPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText(emptyNotice)).not.toBeInTheDocument();
    const failure = await screen.findByRole('alert');
    expect(failure).toHaveTextContent('trang 2');
    if (assigned) {
      expect(await screen.findByRole('link', { name: /Mùa giải được phân công/ })).toBeVisible();
    } else {
      expect(screen.queryByText(emptyNotice)).not.toBeInTheDocument();
    }

    fireEvent.click(within(failure).getByRole('button', { name: 'Thử lại' }));

    if (assigned) {
      expect(screen.getByRole('link', { name: /Mùa giải được phân công/ })).toBeVisible();
      expect(screen.queryByText(emptyNotice)).not.toBeInTheDocument();
    } else {
      expect(await screen.findByText(emptyNotice)).toBeVisible();
    }
    expect(request.mock.calls.map(([url]) => url)).toEqual(
      [1, 2, 3, 2].map((page) => `/seasons?page=${page}&pageSize=100`),
    );
  },
);
