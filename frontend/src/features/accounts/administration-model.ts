export const roleNames = {
  SYSTEM_ADMINISTRATOR: 'Quản trị hệ thống',
  SEASON_MANAGER: 'Quản lý mùa giải',
  REGISTRATION_OFFICER: 'Phụ trách đăng ký',
  SCHEDULING_OFFICER: 'Phụ trách lập lịch',
  RESULTS_OFFICER: 'Phụ trách kết quả',
};
export const permissionNames = {
  CLUB_MASTER: 'Quản lý hồ sơ câu lạc bộ',
  PLAYER_MASTER: 'Quản lý hồ sơ cầu thủ',
  STADIUM_MASTER: 'Quản lý hồ sơ sân vận động',
  CREATE_SEASON: 'Tạo mùa giải',
};
export const actionNames = {
  PREPARE_REGULATION_CHANGE: 'Soạn thay đổi điều lệ',
  APPROVE_SCHEDULE_ADJUSTMENT: 'Duyệt điều chỉnh lịch thi đấu',
  PREPARE_OFFICIAL_RESULT_CORRECTION: 'Soạn đính chính kết quả chính thức',
};
export const stateNames: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Đã khóa',
  DRAFT: 'Bản nháp',
  PENDING: 'Chờ xử lý',
  RETURNED: 'Yêu cầu bổ sung',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
  GRANTED: 'Đã cấp',
  SCHEDULED: 'Chờ hiệu lực',
  EXPIRED: 'Hết hạn',
  REVOKED: 'Đã thu hồi',
  TERMINATED: 'Mất điều kiện',
};
export type Season = { id: string; code: string; name: string };
export type Person = { id: string; personnelCode: string; fullName: string };
export type Account = Person & {
  username: string;
  state: 'ACTIVE' | 'LOCKED';
  revision: string;
  mustChangePassword: boolean;
  systemRoles: { id: string; roleCode: 'SYSTEM_ADMINISTRATOR' }[];
  seasonRoles: { id: string; roleCode: keyof typeof roleNames; seasonId: string }[];
  sharedGrants: {
    id: string;
    masterKind: Exclude<keyof typeof permissionNames, 'CREATE_SEASON'>;
  }[];
  createSeasonGrants: { id: string }[];
};
export type List<T> = { items: T[]; page: number; pageSize: number; total: number };
export type AccountList = List<Account> & { seasons: Season[] };
export type Version = {
  id: string;
  versionNumber: number;
  state: string;
  actionCode: keyof typeof actionNames;
  startMode: 'IMMEDIATE' | 'SCHEDULED';
  startsAt: string | null;
  endsAt: string | null;
  reason: string | null;
  decisionReason: string | null;
  recipient: Person | null;
  editors: { accountId: string }[];
};
export type Proposal = {
  id: string;
  revision: string;
  season: Season;
  proposer: Person;
  recipient: Person;
  currentVersion: Version;
  versions: Version[];
};
export type ProposalList = List<Proposal> & {
  seasons: Season[];
  proposalSeasons: Season[];
  recipients: { seasonId: string; roleCode: keyof typeof roleNames; account: Person }[];
};
export type Grant = {
  id: string;
  revision: string;
  state: string;
  recipient: Person;
  proposer: Person;
  season: Season;
  actionCode: keyof typeof actionNames;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  basis: string | null;
};
/** Displays a stored instant in Vietnam time, with a placeholder for an absent value. */
export const formatVietnamTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';
