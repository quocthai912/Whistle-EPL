import { SessionStore } from './session-store';

const notices: Record<string, string> = {
  LOGIN_FAILED: 'Tên đăng nhập hoặc mật khẩu không hợp lệ.',
  CURRENT_PASSWORD_INVALID: 'Mật khẩu hiện tại không hợp lệ.',
  PASSWORD_CHANGE_REQUIRED: 'Vui lòng đổi mật khẩu trước khi tiếp tục.',
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
  CSRF_INVALID: 'Thông tin bảo vệ yêu cầu đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.',
  CSRF_REJECTED: 'Thông tin bảo vệ yêu cầu đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.',
  ORIGIN_REJECTED: 'Nguồn yêu cầu không hợp lệ.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  LOGIN_THROTTLED: 'Có quá nhiều lần thử. Vui lòng thử lại sau.',
  MAINTENANCE: 'Hệ thống đang bảo trì. Vui lòng thử lại sau.',
  MEDIA_UNAVAILABLE: 'Tạm thời không thể truy cập nội dung logo.',
  LIFECYCLE_READINESS_UNAVAILABLE: 'Chưa thể xác minh điều kiện đóng mùa giải.',
  REGULATION_BASIS_UNRESOLVED: 'Đang chờ xác định quy định có hiệu lực. Vui lòng thử lại sau.',
};
export type FieldErrorDetail = Readonly<{ field: string; code: string; message?: string }>;
export type MasterNameCandidate = Readonly<{ id: string; code: string; name: string }>;

export class HttpFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
    readonly unknownOutcome = false,
    readonly details?: readonly FieldErrorDetail[],
    readonly candidates?: readonly MasterNameCandidate[],
  ) {
    super(notices[code] ?? 'Không thể hoàn tất yêu cầu. Vui lòng thử lại sau.');
  }
}
type Options = { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown; requestKey?: string };
type Envelope<T> = { data: T; meta?: unknown; requestId: string };
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function masterNameCandidates(value: unknown): readonly MasterNameCandidate[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const candidates: MasterNameCandidate[] = [];
  for (const item of value) {
    if (
      !record(item) ||
      typeof item.id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id) ||
      typeof item.code !== 'string' ||
      !/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(item.code) ||
      typeof item.name !== 'string' ||
      !item.name.trim() ||
      [...item.name].length > 200
    )
      return undefined;
    candidates.push({ id: item.id, code: item.code, name: item.name });
  }
  return candidates;
}
function fieldErrorDetails(value: unknown): readonly FieldErrorDetail[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const safeMessageCharacters = /^[\p{L}\p{M}\p{N} .,;:!?()%-]+$/u;
  const vietnameseDiacritics = /[\u00C0-\u024F\u1E00-\u1EFF]/u;
  const safeMessage = (message: unknown): message is string =>
    typeof message === 'string' &&
    message.length > 0 &&
    message.length <= 240 &&
    safeMessageCharacters.test(message) &&
    vietnameseDiacritics.test(message);
  const details: FieldErrorDetail[] = [];
  for (const item of value.slice(0, 64)) {
    if (
      record(item) &&
      typeof item.field === 'string' &&
      item.field.length <= 80 &&
      /^[A-Za-z][A-Za-z0-9_.-]*(?:\[\d+\][A-Za-z0-9_.-]*)*$/.test(item.field) &&
      typeof item.code === 'string' &&
      /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(item.code)
    ) {
      if (item.message !== undefined && !safeMessage(item.message)) continue;
      details.push({
        field: item.field,
        code: item.code,
        ...(item.message !== undefined ? { message: item.message } : {}),
      });
    }
  }
  return details.length ? details : undefined;
}
function formData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

export class HttpClient {
  private csrfPending: { epoch: number; promise: Promise<string> } | null = null;
  constructor(
    private readonly session: SessionStore,
    private readonly fetcher: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  private async csrf(epoch: number): Promise<string> {
    const existing = this.session.getCsrf();
    if (existing) return existing;
    if (this.csrfPending?.epoch === epoch) return this.csrfPending.promise;
    const promise = (async () => {
      // An expired authenticated cookie must retain its reason instead of silently
      // falling back to a prelogin CSRF context and losing that feedback.
      const active = this.session.getSnapshot().session;
      if (active) {
        const current = await this.request<{ id: string; changeRequired: boolean }>(
          '/auth/session',
        );
        if (
          current.data.id !== active.account.id ||
          current.data.changeRequired !== active.changeRequired
        ) {
          const failure = new HttpFailure(401, 'PERMISSION_CHANGED');
          this.session.clear(failure.message);
          throw failure;
        }
      }
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
    return (await this.send<T>(path, options, 'json')) as Envelope<T>;
  }

  /** Fetches an explicitly authorized media response as normalized image bytes. */
  async requestFile(path: string): Promise<Blob> {
    return (await this.send<never>(path, { method: 'GET' }, 'file')) as Blob;
  }

  private async send<T>(
    path: string,
    options: Options,
    responseMode: 'json' | 'file',
  ): Promise<Envelope<T> | Blob> {
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
    const multipart = formData(options.body);
    const headers: Record<string, string> = {
      Accept:
        responseMode === 'file'
          ? 'image/png, image/jpeg, image/webp, application/json'
          : 'application/json',
    };
    if (options.body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
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
      const requestBody =
        options.body === undefined
          ? undefined
          : multipart
            ? options.body
            : JSON.stringify(options.body);
      response = await this.fetcher(url.pathname + url.search, {
        method,
        headers,
        credentials: 'same-origin',
        cache: 'no-store',
        ...(requestBody === undefined ? {} : { body: requestBody as BodyInit }),
      });
    } catch {
      throw new HttpFailure(0, 'NETWORK_ERROR', undefined, writing);
    }
    // A late response from a previous account must not repopulate its successor's memory.
    if (this.session.getSnapshot().epoch !== epoch) throw new HttpFailure(401, 'AUTH_REQUIRED');
    if (responseMode === 'file' && response.ok) {
      const mimeType = response.headers.get('Content-Type')?.split(';', 1)[0]?.trim().toLowerCase();
      if (!mimeType || !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType))
        throw new HttpFailure(response.status, 'INVALID_RESPONSE');
      let blob: Blob;
      try {
        blob = await response.blob();
      } catch {
        if (this.session.getSnapshot().epoch !== epoch) throw new HttpFailure(401, 'AUTH_REQUIRED');
        throw new HttpFailure(response.status, 'INVALID_RESPONSE');
      }
      if (this.session.getSnapshot().epoch !== epoch) throw new HttpFailure(401, 'AUTH_REQUIRED');
      if (!blob.size || (blob.type && blob.type.toLowerCase() !== mimeType))
        throw new HttpFailure(response.status, 'INVALID_RESPONSE');
      return blob;
    }
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
        record(body.error) &&
          (body.error.code === 'VALIDATION_FAILED' || body.error.code === 'INVALID_INPUT')
          ? fieldErrorDetails(body.error.details)
          : undefined,
        code === 'BASIS_CHANGED' && record(body.error)
          ? masterNameCandidates(body.error.candidates)
          : undefined,
      );
      if (response.status === 401 && path !== '/auth/login') this.session.clear(failure.message);
      if (code === 'CSRF_INVALID' || code === 'CSRF_REJECTED') this.session.forgetCsrf();
      throw failure;
    }
    if (!('data' in body) || !requestId)
      throw new HttpFailure(response.status, 'INVALID_RESPONSE', requestId, writing);
    return body as Envelope<T>;
  }
}
