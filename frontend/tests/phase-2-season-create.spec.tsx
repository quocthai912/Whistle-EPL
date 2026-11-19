import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, expect, test, vi } from 'vitest';
import { App } from '../src/app/App';

const account = {
  id: '00000000-0000-4000-8000-000000000001',
  personnelCode: 'STAFF-01',
  fullName: 'Nhân viên tạo mùa giải',
  username: 'season.creator',
  changeRequired: false,
  canCreateSeason: true,
};
const envelope = (data: unknown, meta?: unknown) =>
  Response.json({ data, ...(meta ? { meta } : {}), requestId: 'season-create-test' });
const wait = { timeout: 5_000 };

afterEach(() => vi.unstubAllGlobals());

function open(path: string, fetcher: typeof fetch) {
  vi.stubGlobal('fetch', fetcher);
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

test('a create-only session can reach the season shell without loading season data', async () => {
  const fetcher = vi.fn<typeof fetch>(async () => envelope(account));
  open('/internal', fetcher);

  fireEvent.click(await screen.findByRole('link', { name: 'Quản lý mùa giải' }, wait));

  expect(await screen.findByRole('heading', { name: 'Quản lý mùa giải' }, wait)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Tạo mùa giải' })).toBeVisible();
  expect(
    screen.getByText('Mùa giải mới sẽ ở trạng thái Mở, chưa có quy định nào có hiệu lực.'),
  ).toBeVisible();
  expect(screen.getByRole('link', { name: 'Quản lý mùa giải' })).toHaveAttribute(
    'href',
    '/workspace/seasons',
  );
  expect(screen.queryByRole('link', { name: 'Ủy quyền nghiệp vụ' })).not.toBeInTheDocument();
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual(['/api/v1/auth/session']);
});

test('an assigned manager can read scoped seasons but cannot create without that capability', async () => {
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    const path = String(input);
    if (path.endsWith('/auth/session'))
      return envelope({
        ...account,
        canCreateSeason: false,
        systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }],
        seasonRoles: [{ seasonId: 'season-1', roleCode: 'SEASON_MANAGER' }],
      });
    if (path.includes('/seasons?'))
      return envelope(
        {
          items: [
            {
              id: '00000000-0000-4000-8000-000000000011',
              code: 'MG-ASSIGNED',
              name: 'Mùa được phân công',
              competitionName: 'Giải được phân công',
              startDate: '2028-08-01',
              endDate: '2029-05-31',
              state: 'OPEN',
              revision: '1',
              effectiveRegulation: null,
              capabilities: { canEditMetadata: true },
            },
          ],
        },
        { page: 1, pageSize: 20, total: 1 },
      );
    throw new Error('Unexpected request: ' + path);
  });
  open('/workspace/seasons', fetcher);

  expect(await screen.findByText('MG-ASSIGNED', undefined, wait)).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Tạo mùa giải' })).not.toBeInTheDocument();
  expect(fetcher.mock.calls.map(([path, init]) => [String(path), init?.method ?? 'GET'])).toEqual([
    ['/api/v1/auth/session', 'GET'],
    [expect.stringMatching('/api/v1/seasons?'), 'GET'],
  ]);
});

test('administrator-only status does not grant season discovery or creation', async () => {
  const fetcher = vi.fn<typeof fetch>(async () =>
    envelope({
      ...account,
      canCreateSeason: false,
      systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }],
      seasonRoles: [],
    }),
  );
  open('/workspace/seasons', fetcher);

  expect(
    await screen.findByText(
      'Bạn đã đăng nhập. Chức năng này yêu cầu quyền riêng; liên hệ Quản trị viên nếu cần sử dụng.',
      undefined,
      wait,
    ),
  ).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Tạo mùa giải' })).not.toBeInTheDocument();
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual(['/api/v1/auth/session']);
});

test('creation previews normalized fields and sends only the minimal receipt-bearing command', async () => {
  const acknowledgement = {
    id: '00000000-0000-4000-8000-000000000010',
    revision: '1',
  };
  const fetcher = vi.fn<typeof fetch>(async (path) => {
    const url = String(path);
    if (url.endsWith('/auth/session')) return envelope(account);
    if (url.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (url.endsWith('/seasons'))
      return Response.json({ data: acknowledgement, requestId: 'season-created' }, { status: 201 });
    throw new Error('Unexpected request: ' + path);
  });
  open('/workspace/seasons', fetcher);

  fireEvent.click(await screen.findByRole('button', { name: 'Tạo mùa giải' }, wait));
  const dialog = await screen.findByRole('dialog', undefined, wait);
  expect(
    within(dialog).getByText('Nhập hoặc chọn ngày theo định dạng DD/MM/YYYY.'),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/Mã mùa giải/i), {
    target: { value: '  mg-2028-2029  ' },
  });
  fireEvent.change(screen.getByLabelText(/Tên mùa giải/i), {
    target: { value: '  Mùa   giải 2028/2029  ' },
  });
  fireEvent.change(screen.getByLabelText(/Tên giải đấu/i), {
    target: { value: '  Giải   Ngoại hạng  ' },
  });
  fireEvent.change(screen.getByLabelText(/Ngày bắt đầu/i), { target: { value: '15/08/2028' } });
  fireEvent.change(screen.getByLabelText(/Ngày kết thúc/i), { target: { value: '23/05/2029' } });

  expect(screen.getByText('Mã sẽ lưu: MG-2028-2029')).toBeInTheDocument();
  expect(screen.getByText('Tên mùa giải sẽ lưu: Mùa giải 2028/2029')).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận tạo mùa giải' }));

  expect(await screen.findByText(/Đã tạo mùa giải/i, undefined, wait)).toBeVisible();
  const createCall = fetcher.mock.calls.find(([path]) => path === '/api/v1/seasons');
  expect(createCall).toBeDefined();
  const [, init] = createCall!;
  expect(init).toMatchObject({
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  expect(init?.headers).toMatchObject({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-CSRF-Token': 'c'.repeat(43),
  });
  const requestKey = new Headers(init?.headers).get('Idempotency-Key');
  expect(requestKey).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  expect(JSON.parse(String(init?.body))).toEqual({
    code: 'MG-2028-2029',
    name: 'Mùa giải 2028/2029',
    competitionName: 'Giải Ngoại hạng',
    startDate: '2028-08-15',
    endDate: '2029-05-23',
  });
  expect(
    fetcher.mock.calls.filter(([path]) => String(path).includes('/api/v1/seasons')),
  ).toHaveLength(1);
  expect(screen.getByText('Đã tạo mùa giải MG-2028-2029.')).toBeVisible();
});

test('creation accepts 200 astral code points for both normalized names', async () => {
  const longName = '😀'.repeat(200);
  let createdBody: unknown;
  const fetcher = vi.fn<typeof fetch>(async (path, init) => {
    const url = String(path);
    if (url.endsWith('/auth/session')) return envelope(account);
    if (url.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (url.endsWith('/seasons')) {
      createdBody = JSON.parse(String(init?.body));
      return Response.json(
        {
          data: { id: '00000000-0000-4000-8000-000000000010', revision: '1' },
          requestId: 'created',
        },
        { status: 201 },
      );
    }
    throw new Error('Unexpected request: ' + path);
  });
  open('/workspace/seasons', fetcher);

  fireEvent.click(await screen.findByRole('button', { name: 'Tạo mùa giải' }, wait));
  const dialog = await screen.findByRole('dialog', undefined, wait);
  const name = within(dialog).getByLabelText(/Tên mùa giải/i);
  const competition = within(dialog).getByLabelText(/Tên giải đấu/i);
  expect(name).not.toHaveAttribute('maxLength');
  expect(competition).not.toHaveAttribute('maxLength');
  fireEvent.change(name, { target: { value: longName } });
  fireEvent.change(competition, { target: { value: longName } });
  fireEvent.change(within(dialog).getByLabelText(/Mã mùa giải/i), {
    target: { value: 'MG-ASTRAL' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Ngày bắt đầu/i), {
    target: { value: '15/08/2028' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Ngày kết thúc/i), {
    target: { value: '23/05/2029' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận tạo mùa giải' }));

  expect(await screen.findByText(/Đã tạo mùa giải/i, undefined, wait)).toBeVisible();
  expect(createdBody).toEqual({
    code: 'MG-ASTRAL',
    name: longName,
    competitionName: longName,
    startDate: '2028-08-15',
    endDate: '2029-05-23',
  });
});

test(
  'cancelling an unsubmitted season leaves no request and clears the next draft',
  { timeout: 15_000 },
  async () => {
    const fetcher = vi.fn<typeof fetch>(async () => envelope(account));
    open('/workspace/seasons', fetcher);

    fireEvent.click(await screen.findByRole('button', { name: 'Tạo mùa giải' }, wait));
    const dialog = await screen.findByRole('dialog', undefined, wait);
    const code = within(dialog).getByLabelText(/Mã mùa giải/i);
    fireEvent.change(code, { target: { value: 'MG-UNSENT' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), wait);

    fireEvent.click(screen.getByRole('button', { name: 'Tạo mùa giải' }));
    expect(
      within(await screen.findByRole('dialog', undefined, wait)).getByLabelText(/Mã mùa giải/i),
    ).toHaveValue('');
    expect(fetcher.mock.calls.map(([path]) => path)).toEqual(['/api/v1/auth/session']);
  },
);

test('date order is checked locally and invalid values remain available for correction', async () => {
  const fetcher = vi.fn<typeof fetch>(async () => envelope(account));
  open('/workspace/seasons', fetcher);
  fireEvent.click(await screen.findByRole('button', { name: 'Tạo mùa giải' }, wait));
  const dialog = await screen.findByRole('dialog', undefined, wait);
  fireEvent.change(within(dialog).getByLabelText(/Mã mùa giải/i), {
    target: { value: 'MG-2028-2029' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Tên mùa giải/i), {
    target: { value: 'Mùa giải 2028/2029' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Tên giải đấu/i), {
    target: { value: 'Giải Ngoại hạng' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Ngày bắt đầu/i), {
    target: { value: '31/02/2029' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Ngày kết thúc/i), {
    target: { value: '15/08/2028' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận tạo mùa giải' }));
  expect(
    await within(dialog).findByText('Ngày bắt đầu phải là ngày hợp lệ theo dạng DD/MM/YYYY.'),
  ).toBeInTheDocument();
  expect(within(dialog).getByLabelText(/^Ngày bắt đầu \*/)).toHaveValue('31/02/2029');
  fireEvent.change(within(dialog).getByLabelText(/Ngày bắt đầu/i), {
    target: { value: '23/05/2029' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận tạo mùa giải' }));

  expect(
    await within(dialog).findByText(
      'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.',
      undefined,
      wait,
    ),
  ).toBeInTheDocument();
  expect(within(dialog).getByLabelText(/^Ngày bắt đầu \*/)).toHaveValue('23/05/2029');
  expect(within(dialog).getByLabelText(/^Ngày kết thúc \*/)).toHaveValue('15/08/2028');
  expect(fetcher.mock.calls.map(([path]) => path)).toEqual(['/api/v1/auth/session']);
});

test.each(['ß', 'ſ'])(
  'season codes reject non-ASCII characters before uppercase conversion: %s',
  async (code) => {
    const fetcher = vi.fn<typeof fetch>(async () => envelope(account));
    open('/workspace/seasons', fetcher);
    fireEvent.click(await screen.findByRole('button', { name: 'Tạo mùa giải' }, wait));
    const dialog = await screen.findByRole('dialog', undefined, wait);
    fireEvent.change(within(dialog).getByLabelText(/Mã mùa giải/i), { target: { value: code } });
    fireEvent.change(within(dialog).getByLabelText(/Tên mùa giải/i), {
      target: { value: 'Mùa giải kiểm thử' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Tên giải đấu/i), {
      target: { value: 'Giải kiểm thử' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Ngày bắt đầu/i), {
      target: { value: '15/08/2028' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Ngày kết thúc/i), {
      target: { value: '23/05/2029' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận tạo mùa giải' }));

    expect(
      await within(dialog).findByText(/Mã phải có 1–32 ký tự ASCII/, undefined, wait),
    ).toBeInTheDocument();
    expect(fetcher.mock.calls.map(([path]) => String(path))).toEqual(['/api/v1/auth/session']);
  },
);

// Complete dialog render/input/response flow exceeds 5s in host JSDOM; assertions keep their own bounds.
test(
  'localized backend field errors stay attached to the field and keep entered values',
  { timeout: 15000 },
  async () => {
    const fetcher = vi.fn<typeof fetch>(async (input) => {
      const path = String(input);
      if (path.endsWith('/auth/session')) return envelope(account);
      if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
      if (path.endsWith('/seasons'))
        return Response.json(
          {
            error: {
              code: 'VALIDATION_FAILED',
              details: [
                {
                  field: 'competitionName',
                  code: 'INVALID_TEXT',
                  message: 'Tên giải đấu không hợp lệ.',
                },
              ],
            },
            requestId: 'field-error',
          },
          { status: 400 },
        );
      throw new Error('Unexpected request: ' + path);
    });
    open('/workspace/seasons', fetcher);
    fireEvent.click(await screen.findByRole('button', { name: 'Tạo mùa giải' }, wait));
    const dialog = await screen.findByRole('dialog', undefined, wait);
    fireEvent.change(within(dialog).getByLabelText(/Mã mùa giải/i), {
      target: { value: 'mg-2028-2029' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Tên mùa giải/i), {
      target: { value: 'Mùa   giải 2028/2029' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Tên giải đấu/i), {
      target: { value: 'Giải Ngoại hạng' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Ngày bắt đầu/i), {
      target: { value: '15/08/2028' },
    });
    fireEvent.change(within(dialog).getByLabelText(/Ngày kết thúc/i), {
      target: { value: '23/05/2029' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận tạo mùa giải' }));

    const error = await within(dialog).findByRole('alert', undefined, wait);
    expect(error).toHaveTextContent('Tên giải đấu không hợp lệ.');
    expect(within(dialog).getByLabelText(/Tên giải đấu/i)).toHaveValue('Giải Ngoại hạng');
    expect(within(dialog).getByLabelText(/Tên mùa giải/i)).toHaveValue('Mùa   giải 2028/2029');
  },
);

test('unknown create outcome retries only the same body with the original idempotency key', async () => {
  const calls: { init: RequestInit | undefined }[] = [];
  let posts = 0;
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) return envelope({ csrfToken: 'c'.repeat(43) });
    if (path.endsWith('/seasons')) {
      posts++;
      calls.push({ init });
      if (posts === 1) throw new TypeError('Network disconnected');
      return Response.json(
        {
          data: { id: '00000000-0000-4000-8000-000000000010', revision: '1' },
          requestId: 'replayed-create',
        },
        { status: 201 },
      );
    }
    throw new Error('Unexpected request: ' + path);
  });
  open('/workspace/seasons', fetcher);
  fireEvent.click(await screen.findByRole('button', { name: 'Tạo mùa giải' }, wait));
  const dialog = await screen.findByRole('dialog', undefined, wait);
  fireEvent.change(within(dialog).getByLabelText(/Mã mùa giải/i), {
    target: { value: ' mg-2028-2029 ' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Tên mùa giải/i), {
    target: { value: 'Mùa giải 2028/2029' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Tên giải đấu/i), {
    target: { value: 'Giải Ngoại hạng' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Ngày bắt đầu/i), {
    target: { value: '15/08/2028' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Ngày kết thúc/i), {
    target: { value: '23/05/2029' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận tạo mùa giải' }));

  expect(await within(dialog).findByRole('status', undefined, wait)).toHaveTextContent(
    'Chưa xác định kết quả',
  );
  expect(posts).toBe(1);
  expect(within(dialog).getByLabelText(/Mã mùa giải/i)).toBeDisabled();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Kiểm tra kết quả' }));

  expect(await screen.findByText(/Đã tạo mùa giải/i, undefined, wait)).toBeVisible();
  expect(posts).toBe(2);
  expect(new Headers(calls[0].init?.headers).get('Idempotency-Key')).toBe(
    new Headers(calls[1].init?.headers).get('Idempotency-Key'),
  );
  expect(calls[0].init?.body).toBe(calls[1].init?.body);
  expect(JSON.parse(String(calls[0].init?.body))).toEqual({
    code: 'MG-2028-2029',
    name: 'Mùa giải 2028/2029',
    competitionName: 'Giải Ngoại hạng',
    startDate: '2028-08-15',
    endDate: '2029-05-23',
  });
  expect(
    fetcher.mock.calls.filter(([path]) => String(path).includes('/api/v1/seasons')),
  ).toHaveLength(2);
});

test('a pre-receipt retry denial keeps the original unknown create intent pinned', async () => {
  const createCalls: Array<{ body: string; key: string | null }> = [];
  let posts = 0;
  let csrfResponses = 0;
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/auth/session')) return envelope(account);
    if (path.endsWith('/auth/csrf')) {
      csrfResponses++;
      return envelope({ csrfToken: 'c'.repeat(43) });
    }
    if (path.endsWith('/seasons')) {
      posts++;
      createCalls.push({
        body: String(init?.body),
        key: new Headers(init?.headers).get('Idempotency-Key'),
      });
      if (posts === 1) throw new TypeError('Network disconnected');
      if (posts === 2)
        return Response.json(
          { error: { code: 'CSRF_REJECTED' }, requestId: 'pre-receipt-denial' },
          { status: 403 },
        );
      return Response.json(
        {
          data: { id: '00000000-0000-4000-8000-000000000010', revision: '1' },
          requestId: 'replayed-create',
        },
        { status: 201 },
      );
    }
    throw new Error('Unexpected request: ' + path);
  });
  open('/workspace/seasons', fetcher);
  fireEvent.click(await screen.findByRole('button', { name: 'Tạo mùa giải' }, wait));
  const dialog = await screen.findByRole('dialog', undefined, wait);
  fireEvent.change(within(dialog).getByLabelText(/Mã mùa giải/i), {
    target: { value: 'mg-2028-2029' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Tên mùa giải/i), {
    target: { value: 'Mùa giải 2028/2029' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Tên giải đấu/i), {
    target: { value: 'Giải Ngoại hạng' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Ngày bắt đầu/i), {
    target: { value: '15/08/2028' },
  });
  fireEvent.change(within(dialog).getByLabelText(/Ngày kết thúc/i), {
    target: { value: '23/05/2029' },
  });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Xác nhận tạo mùa giải' }));
  expect(await within(dialog).findByRole('status', undefined, wait)).toHaveTextContent(
    'Chưa xác định kết quả',
  );

  fireEvent.click(within(dialog).getByRole('button', { name: 'Kiểm tra kết quả' }));
  expect(await within(dialog).findByRole('alert', undefined, wait)).toHaveTextContent(
    'Thông tin bảo vệ yêu cầu đã hết hạn hoặc không hợp lệ.',
  );
  expect(within(dialog).getByRole('status')).toHaveTextContent('Chưa xác định kết quả');
  expect(within(dialog).getByRole('button', { name: 'Kiểm tra kết quả' })).toBeEnabled();
  expect(within(dialog).getByLabelText(/Mã mùa giải/i)).toBeDisabled();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Kiểm tra kết quả' }));
  expect(await screen.findByText(/Đã tạo mùa giải/i, undefined, wait)).toBeVisible();
  expect(posts).toBe(3);
  expect(csrfResponses).toBe(2);
  expect(createCalls[0]).toEqual(createCalls[1]);
  expect(createCalls[1]).toEqual(createCalls[2]);
}, 15_000);
