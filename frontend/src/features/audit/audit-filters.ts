export const actions: Record<string, string> = {
  ADMIN_BOOTSTRAPPED: 'Khởi tạo quản trị viên',
  ADMIN_RECOVERED: 'Khôi phục quản trị viên',
  ACCOUNT_CREATED: 'Tạo tài khoản',
  ACCOUNT_UPDATED: 'Cập nhật tài khoản',
  ACCOUNT_LOCKED: 'Khóa tài khoản',
  ACCOUNT_UNLOCKED: 'Mở khóa tài khoản',
  PASSWORD_RESET: 'Cấp lại mật khẩu',
  PASSWORD_CHANGED: 'Đổi mật khẩu',
  LOGIN_SUCCEEDED: 'Đăng nhập hệ thống',
  LOGOUT_SUCCEEDED: 'Đăng xuất hệ thống',
  SESSIONS_INVALIDATED: 'Vô hiệu hóa phiên',
  SYSTEM_ROLE_GRANTED: 'Cấp vai trò hệ thống',
  SYSTEM_ROLE_REVOKED: 'Thu hồi vai trò hệ thống',
  SEASON_ROLE_GRANTED: 'Phân công vai trò mùa giải',
  SEASON_ROLE_REVOKED: 'Thu hồi vai trò mùa giải',
  SHARED_GRANT_GRANTED: 'Cấp quyền dùng chung',
  SHARED_GRANT_ENDED: 'Kết thúc quyền dùng chung',
  CREATE_SEASON_GRANTED: 'Cấp quyền tạo mùa giải',
  CREATE_SEASON_REVOKED: 'Thu hồi quyền tạo mùa giải',
  DELEGATION_DRAFTED: 'Tạo đề xuất ủy quyền',
  DELEGATION_EDITED: 'Sửa đề xuất ủy quyền',
  DELEGATION_SUBMITTED: 'Gửi đề xuất ủy quyền',
  DELEGATION_RETURNED: 'Trả lại đề xuất ủy quyền',
  DELEGATION_REJECTED: 'Từ chối đề xuất ủy quyền',
  DELEGATION_CANCELLED: 'Hủy đề xuất ủy quyền',
  DELEGATION_GRANTED: 'Cấp ủy quyền nghiệp vụ',
  DELEGATION_REVOKED: 'Thu hồi ủy quyền',
  DELEGATION_TERMINATED: 'Chấm dứt ủy quyền',
  DELEGATION_STARTED: 'Bắt đầu ủy quyền',
  DELEGATION_EXPIRED: 'Hết hạn ủy quyền',
};

export const objectKinds: Record<string, string> = {
  Account: 'Tài khoản',
  DelegationCase: 'Đề xuất ủy quyền',
  DelegationGrant: 'Quyền ủy quyền',
};

export const initialFilters = {
  search: '',
  actorId: '',
  objectId: '',
  objectKind: '',
  from: '',
  through: '',
  actionCode: '',
  sort: 'occurredAt:desc',
  pageSize: '20',
};

/** Validates identifiers and Vietnam-local date bounds before serializing an audit query. */
export function auditFilters(draft: typeof initialFilters) {
  const { actorId, objectId, from, through, objectKind, actionCode, sort, pageSize } = draft;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const identifiers = { actorId: actorId.trim(), objectId: objectId.trim() };
  if (Object.values(identifiers).some((value) => value && !uuid.test(value)))
    throw new Error('Mã người thực hiện và mã đối tượng phải có định dạng UUID.');
  /** Converts a local calendar boundary to its UTC instant, optionally advancing whole days. */
  const localMidnight = (date: string, days: number) => {
    if (!date) return '';
    const at = Date.parse(date + 'T00:00:00+07:00');
    if (!Number.isFinite(at)) throw new Error('Ngày tra cứu không hợp lệ.');
    return new Date(at + days * 86_400_000).toISOString();
  };
  if (from && through && from > through) throw new Error('Từ ngày phải trước hoặc bằng Đến ngày.');
  const filters = {
    search: draft.search.trim(),
    ...identifiers,
    objectKind,
    actionCode,
    sort,
    pageSize,
    occurredFrom: localMidnight(from, 0),
    occurredBefore: localMidnight(through, 1),
  };
  return new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
}
