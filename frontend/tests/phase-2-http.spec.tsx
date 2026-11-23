import { expect, test, vi } from 'vitest';
import { HttpClient, HttpFailure } from '../src/shared/http/client';
import { sessionView } from '../src/shared/http/session-view';
import { SessionStore } from '../src/shared/http/session-store';

const account = {
  id: '00000000-0000-4000-8000-000000000001',
  personnelCode: 'PHASE2',
  fullName: 'Phase Two',
  username: 'phase2',
};

test('FormData keeps its browser boundary and uses the protected same-origin session transport', async () => {
  const store = new SessionStore();
  store.acceptCsrf('a'.repeat(43), store.getSnapshot().epoch);
  const form = new FormData();
  form.append('file', new Blob(['validated image fixture'], { type: 'image/png' }), 'club.png');
  form.append('expectedRevision', '3');
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify({ data: { acknowledged: true }, requestId: 'trace' }), {
      status: 200,
    }),
  );

  await new HttpClient(store, fetcher).request('/clubs/club-1/logo', {
    method: 'POST',
    body: form,
  });

  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe('/api/v1/clubs/club-1/logo');
  expect(init?.body).toBe(form);
  expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin', cache: 'no-store' });
  expect(init?.headers).toMatchObject({
    Accept: 'application/json',
    'X-CSRF-Token': 'a'.repeat(43),
  });
  expect(init?.headers).not.toHaveProperty('Content-Type');
});

test('FormData writes keep the unknown-outcome signal on network failure without retry', async () => {
  const store = new SessionStore();
  store.acceptCsrf('b'.repeat(43), store.getSnapshot().epoch);
  const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('transport diagnostic'));
  const form = new FormData();
  form.append('file', new Blob(['fixture'], { type: 'image/png' }), 'club.png');

  await expect(
    new HttpClient(store, fetcher).request('/clubs/club-1/logo', { method: 'POST', body: form }),
  ).rejects.toMatchObject({ unknownOutcome: true });
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test('HTTP failures retain only validated field-error details', async () => {
  const store = new SessionStore();
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'SQL password=must-not-escape',
          details: [
            {
              field: 'expectedRevision',
              code: 'isString',
              message: 'Phiên bản phải là chuỗi.',
              diagnostic: 'secret',
            },
            { field: 'file[0]', code: 'maxSize', message: 'Kích thước ảnh vượt giới hạn.' },
            { field: 'nested.field', code: 'isDefined' },
            { field: 'bad field', code: 'unsafe' },
            { field: 'file', code: 'code with spaces' },
            { field: 'unsafeMessage', code: 'isString', message: '<img src=x onerror=alert(1)>' },
            { field: 'longMessage', code: 'isString', message: 'x'.repeat(241) },
          ],
        },
        requestId: 'trace',
      }),
      { status: 400 },
    ),
  );
  let failure: HttpFailure | undefined;
  try {
    await new HttpClient(store, fetcher).request('/clubs/club-1/logo', { method: 'POST' });
  } catch (error) {
    failure = error as HttpFailure;
  }

  expect(failure).toBeInstanceOf(HttpFailure);
  expect(failure?.details).toEqual([
    {
      field: 'expectedRevision',
      code: 'isString',
      message: 'Phiên bản phải là chuỗi.',
    },
    { field: 'file[0]', code: 'maxSize', message: 'Kích thước ảnh vượt giới hạn.' },
    { field: 'nested.field', code: 'isDefined' },
  ]);
  expect(failure?.message).not.toMatch(/SQL|password|must-not-escape/);
});

test('INVALID_INPUT failures retain validated field-error details', async () => {
  const store = new SessionStore();
  store.acceptCsrf('c'.repeat(43), store.getSnapshot().epoch);
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        error: {
          code: 'INVALID_INPUT',
          message: 'Internal details stay private.',
          details: [
            {
              field: 'registrationWindows[0].closesAt',
              code: 'isDate',
              message: 'Thời điểm kết thúc không hợp lệ.',
            },
            { field: 'raw secret', code: 'not safe' },
          ],
        },
        requestId: 'trace',
      }),
      { status: 400 },
    ),
  );

  await expect(
    new HttpClient(store, fetcher).request('/seasons', { method: 'POST' }),
  ).rejects.toMatchObject({
    code: 'INVALID_INPUT',
    details: [
      {
        field: 'registrationWindows[0].closesAt',
        code: 'isDate',
        message: 'Thời điểm kết thúc không hợp lệ.',
      },
    ],
  });
});

test('STATE_CONFLICT, BASIS_CHANGED, and MASTER_DISCONTINUED retain validated details while hiding raw server messages', async () => {
  for (const [code, expectedNotice] of [
    ['STATE_CONFLICT', 'Trạng thái đã thay đổi. Vui lòng tải lại.'],
    ['BASIS_CHANGED', 'Cơ sở xử lý đã thay đổi. Vui lòng tải lại.'],
    [
      'MASTER_DISCONTINUED',
      'Câu lạc bộ hoặc đối tượng liên quan đã ngừng hoạt động và không thể sử dụng mới.',
    ],
  ] as const) {
    const store = new SessionStore();
    store.acceptCsrf('e'.repeat(43), store.getSnapshot().epoch);
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code,
            message: 'Internal conflict diagnostic stays hidden.',
            details: [
              {
                field: 'SHIRT_NUMBER',
                code: 'CONFLICT_DEPENDENCY',
                message: 'Trùng số áo 7 với cầu thủ khác kể từ 2026-11-24T09:00:00.000Z.',
              },
              { field: 'unsafe field', code: 'bad', message: '<script>alert(1)</script>' },
            ],
          },
          requestId: 'trace',
        }),
        { status: 409 },
      ),
    );

    let caught: HttpFailure | undefined;
    try {
      await new HttpClient(store, fetcher).request('/player-registrations/case-1/plan-cancel', {
        method: 'POST',
      });
    } catch (error) {
      caught = error as HttpFailure;
    }

    expect(caught).toBeInstanceOf(HttpFailure);
    expect(caught?.status).toBe(409);
    expect(caught?.code).toBe(code);
    expect(caught?.message).toBe(expectedNotice);
    expect(caught?.message).not.toContain('Internal conflict diagnostic');
    expect(caught?.details).toEqual([
      {
        field: 'SHIRT_NUMBER',
        code: 'CONFLICT_DEPENDENCY',
        message: 'Trùng số áo 7 với cầu thủ khác kể từ 2026-11-24T09:00:00.000Z.',
      },
    ]);
  }
});

test('circular and non-serializable JSON bodies retain typed HTTP failure handling', async () => {
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  for (const body of [circular, { revision: 1n }]) {
    const store = new SessionStore();
    store.acceptCsrf('d'.repeat(43), store.getSnapshot().epoch);
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      new HttpClient(store, fetcher).request('/seasons', { method: 'POST', body }),
    ).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR', unknownOutcome: true });
    expect(fetcher).not.toHaveBeenCalled();
  }
});

test('file requests accept only successful normalized image bytes while JSON errors stay protected', async () => {
  const store = new SessionStore();
  const bytes = new Uint8Array([137, 80, 78, 71]);
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      new Response(bytes, { status: 200, headers: { 'Content-Type': 'image/png' } }),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { code: 'NOT_FOUND', message: 'hidden' }, requestId: 'trace' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  const client = new HttpClient(store, fetcher) as unknown as {
    requestFile(path: string): Promise<Blob>;
  };

  const file = await client.requestFile('/media/current-logo');
  expect(file).toBeInstanceOf(Blob);
  expect(file.type).toBe('image/png');
  const call = fetcher.mock.calls[0][1];
  expect(call).toMatchObject({ method: 'GET', credentials: 'same-origin', cache: 'no-store' });
  expect(call?.headers).toMatchObject({ Accept: expect.stringContaining('image/png') });
  await expect(client.requestFile('/media/missing')).rejects.toMatchObject({
    status: 404,
    code: 'NOT_FOUND',
  });
});

test('session view exposes only approved current hints and preserves account-epoch isolation', () => {
  const view = sessionView({
    ...account,
    changeRequired: false,
    canCreateSeason: true,
    createSeason: true,
    systemRoles: [{ roleCode: 'SYSTEM_ADMINISTRATOR' }],
    seasonRoles: [
      { seasonId: 'season-1', roleCode: 'SEASON_MANAGER' },
      { seasonId: 'season-1', roleCode: 'RESULTS_OFFICER' },
    ],
    sharedGrants: [{ masterKind: 'CLUB_MASTER', id: 'must-not-be-retained' }],
    preparationCapabilities: {
      direct: [
        { seasonId: 'season-1', actionCode: 'PREPARE_REGULATION_CHANGE' },
        { seasonId: 'season-1', actionCode: 'PREPARE_OFFICIAL_RESULT_CORRECTION' },
      ],
      delegated: [{ seasonId: 'season-2', actionCode: 'PREPARE_REGULATION_CHANGE' }],
      approvals: [{ seasonId: 'season-2', actionCode: 'APPROVE_SCHEDULE_ADJUSTMENT' }],
    },
    csrfToken: 'must-not-be-retained',
  });
  const store = new SessionStore();
  store.acceptSession(view);
  store.remember('private', 'prior-account-data');
  const next = sessionView({
    ...account,
    id: '00000000-0000-4000-8000-000000000002',
    changeRequired: true,
  });
  store.acceptSession(next);

  expect(view).toMatchObject({
    canCreateSeason: true,
    systemAdministrator: true,
    seasonManagerIds: ['season-1'],
    sharedMasterKinds: ['CLUB_MASTER'],
    preparationCapabilities: {
      direct: [{ seasonId: 'season-1', actionCode: 'PREPARE_REGULATION_CHANGE' }],
      delegated: [{ seasonId: 'season-2', actionCode: 'PREPARE_REGULATION_CHANGE' }],
    },
  });
  expect(view).not.toHaveProperty('csrfToken');
  expect(JSON.stringify(view)).not.toContain('must-not-be-retained');
  expect(JSON.stringify(view)).not.toContain('APPROVE_SCHEDULE_ADJUSTMENT');
  expect(store.getSnapshot().session?.account.id).toBe(next.account.id);
  expect(store.recall('private')).toBeUndefined();
});

test('session view reads the legacy createSeason capability alias', () => {
  expect(sessionView({ ...account, changeRequired: false, createSeason: true })).toMatchObject({
    canCreateSeason: true,
  });
});

test('a late HTTP response from the prior session epoch cannot repopulate client state', async () => {
  const store = new SessionStore();
  store.acceptSession(sessionView({ ...account, changeRequired: false }));
  store.remember('season-list', ['private prior-account data']);

  let finishResponse!: (response: Response) => void;
  const fetcher = vi.fn<typeof fetch>().mockImplementation(
    () =>
      new Promise<Response>((resolve) => {
        finishResponse = resolve;
      }),
  );
  const pending = new HttpClient(store, fetcher).request('/seasons');
  store.acceptSession(
    sessionView({
      ...account,
      id: '00000000-0000-4000-8000-000000000002',
      changeRequired: false,
    }),
  );
  finishResponse(
    new Response(JSON.stringify({ data: [{ id: 'private' }], requestId: 'late-response' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

  await expect(pending).rejects.toMatchObject({ status: 401, code: 'AUTH_REQUIRED' });
  expect(store.recall('season-list')).toBeUndefined();
});

test('password-change sessions do not retain capability hints', () => {
  expect(
    sessionView({
      ...account,
      changeRequired: true,
      canCreateSeason: true,
      seasonRoles: [{ seasonId: 'season-1', roleCode: 'SEASON_MANAGER' }],
      preparationCapabilities: { direct: [], delegated: [] },
    }),
  ).toEqual({ account, changeRequired: true });
});
