import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { expect, vi } from 'vitest';
import { MasterAvailability } from '../src/features/masters/MasterAvailability';
import { SessionProvider } from '../src/shared/http/session-context';
import { useSession } from '../src/shared/http/use-session';
import type { ComponentProps } from 'react';

function SignedInAvailability(props: ComponentProps<typeof MasterAvailability>) {
  const { ready, session } = useSession();
  return ready && session ? <MasterAvailability {...props} /> : null;
}

export async function verifyAvailabilityConfirmation(
  master: 'clubs' | 'stadiums',
  discontinued: boolean,
) {
  const id = '00000000-0000-4000-8000-000000000001';
  const action = discontinued ? 'resume' : 'discontinue';
  const title = discontinued ? 'Sử dụng lại hồ sơ' : 'Ngừng sử dụng hồ sơ';
  const reason = 'Lý do kiểm thử xác nhận.';
  const saved = vi.fn();
  const envelope = (data: unknown) => Response.json({ data, requestId: 'availability-test' });
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = new URL(String(input), 'https://whistle.test').pathname;
    if (path === '/api/v1/auth/session')
      return envelope({
        id,
        username: 'test.master',
        fullName: 'Tài khoản kiểm thử',
        personnelCode: 'TEST',
        changeRequired: false,
      });
    if (path === '/api/v1/auth/csrf') return envelope({ csrfToken: 'a'.repeat(43) });
    if (path === `/api/v1/${master}/${id}/${action}` && init?.method === 'POST')
      return envelope({ id, revision: '8' });
    throw new Error(`Unexpected request for ${path}`);
  });
  vi.stubGlobal('fetch', fetcher);
  try {
    render(
      <SessionProvider>
        <SignedInAvailability
          master={master}
          id={id}
          revision="7"
          discontinued={discontinued}
          onChange={saved}
        />
      </SessionProvider>,
    );
    fireEvent.click(await screen.findByRole('button', { name: title }));
    const dialog = within(await screen.findByRole('dialog', { name: title }));
    const confirmation = dialog.getByRole('button', { name: 'Xác nhận' });
    expect(confirmation).toBeDisabled();
    fireEvent.click(dialog.getByRole('button', { name: 'Hủy' }));
    expect(fetcher.mock.calls.every(([, init]) => init?.method !== 'POST')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: title }));
    const reopened = within(await screen.findByRole('dialog', { name: title }));
    fireEvent.change(reopened.getByLabelText('Lý do'), { target: { value: reason } });
    fireEvent.click(reopened.getByRole('button', { name: 'Xác nhận' }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    const sent = fetcher.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(sent?.[0]).toBe(`/api/v1/${master}/${id}/${action}`);
    expect(sent?.[1]?.body).toBe(JSON.stringify({ expectedRevision: '7', reason }));
  } finally {
    vi.unstubAllGlobals();
  }
}
