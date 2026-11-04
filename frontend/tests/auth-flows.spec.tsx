import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, test, vi } from 'vitest';
import { App } from '../src/app/App';

afterEach(() => vi.unstubAllGlobals());
const account = {
  id: 'staff',
  personnelCode: 'STAFF',
  fullName: 'Nhân viên thử nghiệm',
  username: 'staff',
};
const ok = (data: unknown) => new Response(JSON.stringify({ data, requestId: 'test-request' }));
const failure = (code: string, status = 401) =>
  new Response(JSON.stringify({ error: { code }, requestId: 'test-request' }), { status });
function open(path = '/login') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test('temporary credentials lead only to password change, including direct internal navigation', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      if (path.endsWith('/session')) return failure('AUTH_REQUIRED');
      if (path.endsWith('/csrf')) return ok({ csrfToken: 'c'.repeat(43) });
      return ok({ ...account, changeRequired: true });
    }),
  );
  open('/internal');
  fireEvent.change(await screen.findByLabelText(/TÊN ĐĂNG NHẬP/i), { target: { value: 'staff' } });
  fireEvent.change(screen.getByLabelText(/^MẬT KHẨU \*/i), {
    target: { value: 'Temporary credential 2026' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByRole('heading', { name: 'Đổi mật khẩu' })).toBeVisible();
  expect(screen.getByLabelText(/^Xác nhận mật khẩu mới \*/i)).toBeVisible();
  expect(screen.queryByText('Nhân viên thử nghiệm')).toBeNull();
});

test('existing full session restores the own-account landing after reload', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ok({ ...account, changeRequired: false })),
  );
  open('/internal');
  expect(await screen.findByText('Xin chào, Nhân viên thử nghiệm.')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Đổi mật khẩu' })).toBeVisible();
});

test('lost login response requires a read to resolve the outcome before another submit', async () => {
  const fetcher = vi.fn(async (path: string) => {
    if (path.endsWith('/session')) return failure('AUTH_REQUIRED');
    if (path.endsWith('/csrf')) return ok({ csrfToken: 'c'.repeat(43) });
    throw new TypeError('Network disconnected');
  });
  vi.stubGlobal('fetch', fetcher);
  open();
  fireEvent.change(await screen.findByLabelText(/TÊN ĐĂNG NHẬP/i), { target: { value: 'staff' } });
  fireEvent.change(screen.getByLabelText(/^MẬT KHẨU \*/i), {
    target: { value: 'Synthetic credential 🦉 only' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByRole('button', { name: 'Kiểm tra trạng thái phiên' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeDisabled();
  expect(fetcher.mock.calls.filter(([path]) => path.endsWith('/login'))).toHaveLength(1);
});

test('credential validation failure preserves username, clears password and never enumerates accounts', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path: string) => {
      if (path.endsWith('/session')) return failure('AUTH_REQUIRED');
      if (path.endsWith('/csrf')) return ok({ csrfToken: 'c'.repeat(43) });
      return failure('LOGIN_FAILED');
    }),
  );
  open();
  fireEvent.change(await screen.findByLabelText(/TÊN ĐĂNG NHẬP/i), { target: { value: 'staff' } });
  fireEvent.change(screen.getByLabelText(/^MẬT KHẨU \*/i), {
    target: { value: 'Wrong synthetic credential' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Tên đăng nhập hoặc mật khẩu không hợp lệ.',
  );
  expect(screen.getByLabelText(/TÊN ĐĂNG NHẬP/i)).toHaveValue('staff');
  expect(screen.getByLabelText(/^MẬT KHẨU \*/i)).toHaveValue('');
});

test('password confirmation mismatch clears secrets without sending a write', async () => {
  const fetcher = vi.fn(async () => ok({ ...account, changeRequired: true }));
  vi.stubGlobal('fetch', fetcher);
  open('/change-password');
  fireEvent.change(await screen.findByLabelText(/^Mật khẩu hiện tại \*/i), {
    target: { value: 'Current synthetic credential' },
  });
  fireEvent.change(screen.getByLabelText(/^Mật khẩu mới \*/i), {
    target: { value: 'New synthetic credential' },
  });
  fireEvent.change(screen.getByLabelText(/^Xác nhận mật khẩu mới \*/i), {
    target: { value: 'Different synthetic credential' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Xác nhận mật khẩu mới không khớp.');
  expect(screen.getByLabelText(/^Mật khẩu mới \*/i)).toHaveValue('');
  expect(fetcher.mock.calls).toHaveLength(1);
});

test('returning to a revoked session clears the internal account view and displays the approved notice', async () => {
  let revoked = false;
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      revoked ? failure('PERMISSION_CHANGED') : ok({ ...account, changeRequired: false }),
    ),
  );
  open('/internal');
  await screen.findByText('Xin chào, Nhân viên thử nghiệm.');
  revoked = true;
  await act(async () => {
    window.dispatchEvent(new Event('focus'));
  });
  expect(await screen.findByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent(
    'Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.',
  );
  expect(screen.queryByText('Xin chào, Nhân viên thử nghiệm.')).toBeNull();
});

test('a failed session lookup shows retry rather than exposing internal content', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => failure('MAINTENANCE', 503)),
  );
  open('/internal');
  expect(await screen.findByRole('alert')).toHaveTextContent('Hệ thống đang bảo trì.');
  expect(screen.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  expect(screen.queryByText('Xin chào, Nhân viên thử nghiệm.')).toBeNull();
});

test('explicit retry renews rejected CSRF and keeps the username without automatic write replay', async () => {
  let attempts = 0;
  let bootstraps = 0;
  const fetcher = vi.fn(async (path: string) => {
    if (path.endsWith('/session')) return failure('AUTH_REQUIRED');
    if (path.endsWith('/csrf')) {
      bootstraps++;
      return ok({ csrfToken: (bootstraps === 1 ? 'a' : 'b').repeat(43) });
    }
    attempts++;
    return attempts === 1
      ? failure('CSRF_INVALID', 403)
      : ok({ ...account, changeRequired: false });
  });
  vi.stubGlobal('fetch', fetcher);
  open();
  fireEvent.change(await screen.findByLabelText(/TÊN ĐĂNG NHẬP/i), { target: { value: 'staff' } });
  fireEvent.change(screen.getByLabelText(/^MẬT KHẨU \*/i), {
    target: { value: 'Synthetic credential 🦉 only' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Thông tin bảo vệ yêu cầu');
  expect(attempts).toBe(1);
  expect(bootstraps).toBe(1);
  expect(screen.getByLabelText(/TÊN ĐĂNG NHẬP/i)).toHaveValue('staff');
  fireEvent.change(screen.getByLabelText(/^MẬT KHẨU \*/i), {
    target: { value: 'Synthetic credential 🦉 only' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(await screen.findByText('Xin chào, Nhân viên thử nghiệm.')).toBeVisible();
  expect(attempts).toBe(2);
  expect(bootstraps).toBe(2);
});
