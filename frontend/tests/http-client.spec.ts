import { expect, test, vi } from 'vitest';
import { HttpClient, HttpFailure } from '../src/shared/http/client';
import { SessionStore } from '../src/shared/http/session-store';

test('one Fetch layer bootstraps CSRF, handles conflicts and never automatically replays a write', async () => {
  const store = new SessionStore();
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { csrfToken: 'a'.repeat(43) }, requestId: 'trace' }), {
        status: 200,
      }),
    )
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { code: 'REVISION_CONFLICT', message: 'unsafe diagnostic' },
          requestId: 'trace',
        }),
        { status: 409 },
      ),
    );
  const client = new HttpClient(store, fetcher);
  await expect(
    client.request('/accounts/fixture/lock', { method: 'POST', body: { expectedRevision: '1' } }),
  ).rejects.toMatchObject({ status: 409, code: 'REVISION_CONFLICT' });
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls[1][1]).toMatchObject({
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { 'X-CSRF-Token': 'a'.repeat(43) },
  });
});

test('session loss clears internal memory and never displays arbitrary server diagnostics', async () => {
  const store = new SessionStore();
  store.acceptSession({
    account: { id: 'first', personnelCode: 'FIRST', fullName: 'First', username: 'first' },
    changeRequired: false,
  });
  store.remember('private-list', { secret: 'first-account-data' });
  const client = new HttpClient(
    store,
    vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'PERMISSION_CHANGED', message: 'SQL password=secret' },
          requestId: 'trace',
        }),
        { status: 401 },
      ),
    ),
  );
  let failure: unknown;
  try {
    await client.request('/auth/session');
  } catch (error) {
    failure = error;
  }
  expect(failure).toBeInstanceOf(HttpFailure);
  expect((failure as Error).message).toBe(
    'Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.',
  );
  expect(store.recall('private-list')).toBeUndefined();
  expect(store.getSnapshot().session).toBeNull();
});

test('late responses cannot deliver data from a previous account during JSON parsing', async () => {
  const store = new SessionStore();
  const first = {
    account: { id: 'first', personnelCode: 'FIRST', fullName: 'First', username: 'first' },
    changeRequired: false,
  };
  store.acceptSession(first);
  let release!: () => void;
  let parsing!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    parsing = resolve;
  });
  const response = new Response('{}', { status: 200 });
  vi.spyOn(response, 'json').mockImplementation(async () => {
    parsing();
    await gate;
    return { data: { private: 'first-account-only' }, requestId: 'trace' };
  });
  const client = new HttpClient(store, vi.fn<typeof fetch>().mockResolvedValue(response));
  const pending = client.request('/accounts');
  const rejected = expect(pending).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  await started;
  store.acceptSession({ ...first, account: { ...first.account, id: 'second' } });
  release();
  await rejected;
  expect(store.getSnapshot().session?.account.id).toBe('second');
});

test.each(['<html>expired</html>', 'null', '[]'])(
  'malformed 401 clears session memory: %s',
  async (body) => {
    const store = new SessionStore();
    store.acceptSession({
      account: { id: 'first', personnelCode: 'FIRST', fullName: 'First', username: 'first' },
      changeRequired: false,
    });
    store.remember('private', 'private-value');
    const client = new HttpClient(
      store,
      vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { status: 401 })),
    );
    await expect(client.request('/auth/session')).rejects.toBeInstanceOf(HttpFailure);
    expect(store.getSnapshot().session).toBeNull();
    expect(store.recall('private')).toBeUndefined();
  },
);
