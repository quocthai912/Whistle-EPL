import { SessionStore } from './session-store';

const notices: Record<string, string> = {
  PERMISSION_CHANGED:
    'Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.',
  AUTH_REQUIRED: 'Vui lòng đăng nhập lại.',
  SESSION_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  REVISION_CONFLICT: 'Dữ liệu đã thay đổi. Vui lòng tải lại và xem xét trước khi lưu.',
  STATE_CONFLICT: 'Trạng thái đã thay đổi. Vui lòng tải lại.',
  BASIS_CHANGED: 'Cơ sở xử lý đã thay đổi. Vui lòng tải lại.',
  IDEMPOTENCY_KEY_REUSED: 'Định danh lệnh đã được dùng cho nội dung khác.',
  DUPLICATE_CODE: 'Mã đã tồn tại.',
  INVALID_INPUT: 'Dữ liệu không hợp lệ.',
  VALIDATION_FAILED: 'Vui lòng kiểm tra dữ liệu đã nhập.',
  ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
  CSRF_INVALID: 'Thông tin bảo vệ yêu cầu không hợp lệ. Vui lòng tải lại.',
  ORIGIN_REJECTED: 'Nguồn yêu cầu không hợp lệ.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  LOGIN_THROTTLED: 'Có quá nhiều lần thử. Vui lòng thử lại sau.',
  MAINTENANCE: 'Hệ thống đang bảo trì. Vui lòng thử lại sau.',
};
export class HttpFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
    readonly unknownOutcome = false,
  ) {
    super(notices[code] ?? 'Không thể hoàn tất yêu cầu. Vui lòng thử lại sau.');
  }
}
type Options = { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown; requestKey?: string };
type Envelope<T> = { data: T; meta?: unknown; requestId: string };
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export class HttpClient {
  private csrfPending: { epoch: number; promise: Promise<string> } | null = null;
  constructor(
    private readonly session: SessionStore,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private async csrf(epoch: number): Promise<string> {
    const existing = this.session.getCsrf();
    if (existing) return existing;
    if (this.csrfPending?.epoch === epoch) return this.csrfPending.promise;
    const promise = (async () => {
      const result = await this.request<{ csrfToken: string }>('/auth/csrf');
      const token = result.data?.csrfToken;
      if (
        typeof token !== 'string' ||
        !/^[A-Za-z0-9_-]{43}$/.test(token) ||
        this.session.getSnapshot().epoch !== epoch
      )
        throw new HttpFailure(401, 'AUTH_REQUIRED');
      this.session.acceptCsrf(token, epoch);
      return token;
    })();
    this.csrfPending = { epoch, promise };
    try {
      return await promise;
    } finally {
      if (this.csrfPending?.promise === promise) this.csrfPending = null;
    }
  }

  async request<T>(path: string, options: Options = {}): Promise<Envelope<T>> {
    const url = new URL(`/api/v1${path}`, 'https://whistle.invalid');
    if (
      !path.startsWith('/') ||
      path.startsWith('//') ||
      path.includes('\\') ||
      url.origin !== 'https://whistle.invalid' ||
      !url.pathname.startsWith('/api/v1/')
    )
      throw new HttpFailure(400, 'INVALID_INPUT');
    const method = options.method ?? 'GET';
    const writing = method !== 'GET';
    const epoch = this.session.getSnapshot().epoch;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.requestKey) {
      if (
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          options.requestKey,
        )
      )
        throw new HttpFailure(400, 'INVALID_INPUT');
      headers['Idempotency-Key'] = options.requestKey;
    }
    if (writing) headers['X-CSRF-Token'] = await this.csrf(epoch);
    if (this.session.getSnapshot().epoch !== epoch) throw new HttpFailure(401, 'AUTH_REQUIRED');
    let response: Response;
    try {
      response = await this.fetcher(url.pathname + url.search, {
        method,
        headers,
        credentials: 'same-origin',
        cache: 'no-store',
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      });
    } catch {
      throw new HttpFailure(0, 'NETWORK_ERROR', undefined, writing);
    }
    // A late response from a previous account must not repopulate its successor's memory.
    if (this.session.getSnapshot().epoch !== epoch) throw new HttpFailure(401, 'AUTH_REQUIRED');
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      if (this.session.getSnapshot().epoch !== epoch) throw new HttpFailure(401, 'AUTH_REQUIRED');
      if (response.status === 401) {
        const failure = new HttpFailure(401, 'AUTH_REQUIRED');
        this.session.clear(failure.message);
        throw failure;
      }
      throw new HttpFailure(response.status, 'INVALID_RESPONSE', undefined, writing);
    }
    if (this.session.getSnapshot().epoch !== epoch) throw new HttpFailure(401, 'AUTH_REQUIRED');
    if (!record(body)) {
      if (response.status === 401) {
        const failure = new HttpFailure(401, 'AUTH_REQUIRED');
        this.session.clear(failure.message);
        throw failure;
      }
      throw new HttpFailure(response.status, 'INVALID_RESPONSE', undefined, writing);
    }
    const requestId =
      typeof body.requestId === 'string' && /^[A-Za-z0-9-]{1,80}$/.test(body.requestId)
        ? body.requestId
        : undefined;
    if (!response.ok) {
      const code =
        record(body.error) && typeof body.error.code === 'string' && body.error.code in notices
          ? body.error.code
          : response.status === 401
            ? 'AUTH_REQUIRED'
            : 'REQUEST_FAILED';
      const failure = new HttpFailure(
        response.status,
        code,
        requestId,
        writing && response.status >= 500,
      );
      if (response.status === 401) this.session.clear(failure.message);
      throw failure;
    }
    if (!('data' in body) || !requestId)
      throw new HttpFailure(response.status, 'INVALID_RESPONSE', requestId, writing);
    return body as Envelope<T>;
  }
}
