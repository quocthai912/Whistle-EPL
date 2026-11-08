import { useState, type FormEvent } from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';
import { AdminSelect } from '../accounts/AdminSelect';
import { useSearchTerm } from '../accounts/use-search-term';
import { AdminDrawer } from '../accounts/AdminDrawer';
import { AdminIcon } from '../accounts/AdminIcon';
import { ListFeedback } from '../accounts/AdminLists';
import type { List } from '../accounts/administration-model';
import {
  actionNames,
  permissionNames,
  roleNames,
  stateNames,
  grantStateNames,
} from '../accounts/administration-model';
import { useAdminList } from '../accounts/use-admin-list';
import shared from '../accounts/Administration.module.css';
import { actions, auditFilters, initialFilters, objectKinds } from './audit-filters';
import css from './Audit.module.css';

type Change = Record<string, string | number | boolean | null>;
type AuditRecord = {
  id: string;
  actorKind: string;
  actorId: string | null;
  actorName: string | null;
  operatorIdentity: string | null;
  occurredAt: string;
  actionCode: string;
  objectKind: string;
  objectId: string | null;
  objectName: string | null;
  seasonCode: string | null;
  seasonId: string | null;
  outcome: string;
  reason: string | null;
  before: Change | null;
  after: Change | null;
};
const time = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const results: Record<string, string> = {
  SUCCESS: 'Thành công',
  DENIED: 'Bị từ chối',
  FAILURE: 'Thất bại',
};
const changeLabels: Record<string, string> = {
  personnelCode: 'Mã nhân sự',
  fullName: 'Họ và tên',
  username: 'Tên đăng nhập',
  state: 'Trạng thái',
  reason: 'Lý do / căn cứ đề xuất',
  granted: 'Trạng thái cấp quyền',
  mustChangePassword: 'Yêu cầu đổi mật khẩu',
  roleCode: 'Vai trò',
  sessionsInvalidated: 'Số phiên vô hiệu hóa',
  reset: 'Đặt lại mật khẩu',
  unlock: 'Mở khóa',
  cause: 'Căn cứ',
  assignmentId: 'Mã phân công',
  grantId: 'Mã quyền',
  seasonId: 'Mã mùa giải',
  masterKind: 'Loại dữ liệu dùng chung',
  versionId: 'Mã phiên bản',
  versionNumber: 'Phiên bản',
  recipientId: 'Mã người nhận',
  actionCode: 'Nghiệp vụ',
  startMode: 'Cách bắt đầu',
  startsAt: 'Bắt đầu',
  endsAt: 'Kết thúc',
  effectiveAt: 'Thời điểm hiệu lực',
};
const label = (names: Record<string, string>, key: string) =>
  Object.hasOwn(names, key) ? names[key] : key;
const actor = (row: AuditRecord) =>
  row.actorKind === 'OPERATOR'
    ? (row.operatorIdentity ?? 'Người vận hành')
    : row.actorKind === 'SYSTEM'
      ? 'Hệ thống'
      : (row.actorName ?? row.actorId ?? '—');
const target = (row: AuditRecord) => row.objectName ?? label(objectKinds, row.objectKind);

/** Translates safe audit fields without reconstructing missing historical values. */
function changeValue(name: string, value: Change[string], actionCode: string, after: boolean) {
  if (value === null) return '—';
  if (name === 'granted' && typeof value === 'boolean')
    return value ? 'Đã được cấp' : after ? 'Đã thu hồi' : 'Chưa được cấp';
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (typeof value !== 'string') return String(value);
  const names: Record<string, Record<string, string>> = {
    roleCode: roleNames,
    masterKind: permissionNames,
    actionCode: actionNames,
    state:
      actionCode.startsWith('DELEGATION_') &&
      ![
        'DELEGATION_DRAFTED',
        'DELEGATION_EDITED',
        'DELEGATION_SUBMITTED',
        'DELEGATION_RETURNED',
        'DELEGATION_REJECTED',
        'DELEGATION_CANCELLED',
        'DELEGATION_GRANTED',
      ].includes(actionCode)
        ? grantStateNames
        : stateNames,
    startMode: { IMMEDIATE: 'Ngay khi cấp quyền', SCHEDULED: 'Theo thời gian chỉ định' },
  };
  if (Object.hasOwn(names, name)) return label(names[name], value);
  return ['startsAt', 'endsAt', 'effectiveAt'].includes(name) && Number.isFinite(Date.parse(value))
    ? time.format(new Date(value))
    : value;
}

function ChangeSummary({
  title,
  values,
  actionCode,
  after = false,
  empty,
}: {
  title: string;
  values: Change | null;
  actionCode: string;
  after?: boolean;
  empty: string;
}) {
  return (
    <div>
      <h3>{title}</h3>
      {!values && <p>{empty}</p>}
      {values && (
        <dl>
          {Object.entries(values).map(([name, value]) => (
            <div key={name}>
              <dt>{label(changeLabels, name)}</dt>
              <dd>{changeValue(name, value, actionCode, after)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function AuditPage() {
  const [draft, setDraft] = useState(initialFilters);
  const term = useSearchTerm(draft.search);
  const [applied, setApplied] = useState(() => auditFilters(initialFilters));
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  const [validation, setValidation] = useState<string>();
  const query = new URLSearchParams(applied);
  if (term) query.set('search', term);
  else query.delete('search');
  const { data, error, requestId, loading, reload } = useAdminList<List<AuditRecord>>(
    '/audit-logs?' + query + '&page=' + page,
  );
  const selected = error ? undefined : data?.items.find((row) => row.id === selectedId);
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)));
  function update(key: keyof typeof draft, value: string) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setPage(1);
    setSelectedId(undefined);
    if (key === 'search' || key === 'actorId' || key === 'objectId') return;
    try {
      setApplied(auditFilters(next));
      setValidation(undefined);
    } catch (error) {
      setValidation(error instanceof Error ? error.message : 'Bộ lọc không hợp lệ.');
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const next = auditFilters(draft);
      if (applied === next && page === 1) reload();
      setApplied(next);
      setPage(1);
      setSelectedId(undefined);
      setValidation(undefined);
    } catch (error) {
      setValidation(error instanceof Error ? error.message : 'Bộ lọc không hợp lệ.');
    }
  }
  function clear() {
    setDraft(initialFilters);
    setApplied(auditFilters(initialFilters));
    setPage(1);
    setSelectedId(undefined);
    setValidation(undefined);
    reload();
  }

  return (
    <section className={shared.panel} aria-labelledby="audit-heading">
      <header className={shared.sectionHeader}>
        <div>
          <h1 id="audit-heading">Tra cứu nhật ký hoạt động</h1>
          <p>
            Theo dõi lịch sử các thao tác quan trọng trong hệ thống. Thời gian hiển thị theo giờ
            Việt Nam (UTC+7).
          </p>
        </div>
      </header>
      <form className={css.filters} onSubmit={submit} aria-label="Bộ lọc nhật ký">
        <div className={css.toolbar}>
          <label className={shared.search}>
            <span className={shared.srOnly}>Tìm nhật ký</span>
            <AdminIcon name="search" />
            <input
              value={draft.search}
              onChange={(event) => update('search', event.target.value)}
              placeholder="Tìm theo người thực hiện hoặc đối tượng…"
            />
          </label>
          <label>
            <span className={shared.srOnly}>Từ ngày</span>
            <DatePicker
              aria-label="Từ ngày"
              format="DD/MM/YYYY"
              placeholder="Từ ngày"
              value={draft.from ? dayjs(draft.from) : null}
              onChange={(date) => update('from', date?.format('YYYY-MM-DD') ?? '')}
            />
          </label>
          <label>
            <span className={shared.srOnly}>Đến ngày</span>
            <DatePicker
              aria-label="Đến ngày"
              format="DD/MM/YYYY"
              placeholder="Đến ngày"
              value={draft.through ? dayjs(draft.through) : null}
              onChange={(date) => update('through', date?.format('YYYY-MM-DD') ?? '')}
            />
          </label>
          <AdminSelect
            label="Loại thao tác"
            value={draft.actionCode}
            onChange={(value) => update('actionCode', value)}
            options={[
              { value: '', label: 'Tất cả thao tác' },
              ...Object.entries(actions).map(([value, label]) => ({ value, label })),
            ]}
          />
          <button className={shared.primary} type="submit">
            Tra cứu
          </button>
          <button
            className={shared.refresh}
            type="button"
            onClick={clear}
            aria-label="Đặt lại"
            title="Đặt lại bộ lọc"
          >
            <AdminIcon name="refresh" />
          </button>
        </div>
        <details className={css.advanced}>
          <summary>Bộ lọc nâng cao</summary>
          <div className={css.advancedFields}>
            <label>
              Mã người thực hiện
              <input
                value={draft.actorId}
                onChange={(event) => update('actorId', event.target.value)}
                placeholder="UUID người thực hiện"
              />
            </label>
            <label>
              Mã đối tượng
              <input
                value={draft.objectId}
                onChange={(event) => update('objectId', event.target.value)}
                placeholder="UUID đối tượng"
              />
            </label>
            <AdminSelect
              hideLabel={false}
              label="Loại đối tượng"
              value={draft.objectKind}
              onChange={(value) => update('objectKind', value)}
              options={[
                { value: '', label: 'Tất cả đối tượng' },
                ...Object.entries(objectKinds).map(([value, label]) => ({ value, label })),
              ]}
            />
            <AdminSelect
              hideLabel={false}
              label="Thứ tự"
              value={draft.sort}
              onChange={(value) => update('sort', value)}
              options={[
                { value: 'occurredAt:desc', label: 'Mới nhất trước' },
                { value: 'occurredAt:asc', label: 'Cũ nhất trước' },
              ]}
            />
            <AdminSelect
              hideLabel={false}
              label="Số dòng mỗi trang"
              value={draft.pageSize}
              onChange={(value) => update('pageSize', value)}
              options={[20, 50, 100].map((size) => ({ value: String(size), label: String(size) }))}
            />
          </div>
        </details>
      </form>
      {validation && (
        <p className={shared.error} role="alert">
          {validation}
        </p>
      )}
      <ListFeedback
        loading={loading}
        error={requestId && error ? error + ' Mã yêu cầu ' + requestId : error}
        empty={data?.items.length === 0}
        onRetry={reload}
      />
      <div
        className={shared.scroll}
        tabIndex={0}
        role="region"
        aria-label="Kết quả nhật ký hoạt động"
      >
        <table className={shared.table + ' ' + css.table} aria-label="Nhật ký hoạt động">
          <thead>
            <tr>
              {[
                'STT',
                'Thời gian',
                'Người thực hiện',
                'Thao tác',
                'Đối tượng tác động',
                'Mùa giải',
                'Kết quả',
                'Thông tin',
              ].map((text) => (
                <th scope="col" key={text}>
                  {text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.items.map((row, index) => (
              <tr key={row.id}>
                <td>{(data.page - 1) * data.pageSize + index + 1}</td>
                <td>
                  <time dateTime={row.occurredAt}>{time.format(new Date(row.occurredAt))}</time>
                </td>
                <td className={css.actor}>
                  <span className={shared.person}>
                    <AdminIcon name="user" />
                    {actor(row)}
                  </span>
                </td>
                <td>{label(actions, row.actionCode)}</td>
                <td>{target(row)}</td>
                <td>{row.seasonCode ?? row.seasonId ?? 'Không áp dụng'}</td>
                <td>
                  <span className={css.outcome} data-outcome={row.outcome}>
                    {label(results, row.outcome)}
                  </span>
                </td>
                <td>
                  <button type="button" disabled={!!error} onClick={() => setSelectedId(row.id)}>
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && (
        <div className={css.footer} aria-label="Phân trang">
          <span>
            {data.items.length > 0 &&
              'Hiển thị ' +
                ((data.page - 1) * data.pageSize + 1) +
                '–' +
                ((data.page - 1) * data.pageSize + data.items.length) +
                ' trong tổng số '}
            {data.total} bản ghi nhật ký
          </span>
          <div className={shared.pagination}>
            <strong>
              Trang {data.page} / {pages}
            </strong>
            <button
              type="button"
              aria-label="Trang trước"
              disabled={loading || data.page <= 1}
              onClick={() => setPage(page - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Trang sau"
              disabled={loading || data.page >= pages}
              onClick={() => setPage(page + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}
      {selected && (
        <AdminDrawer
          title={'Chi tiết nhật ký · ' + selected.id}
          subtitle="Lịch sử thao tác quản trị và kiểm tra hệ thống"
          icon={<AdminIcon name="audit" />}
          onClose={() => setSelectedId(undefined)}
        >
          <div className={shared.details}>
            <dl className={shared.detailGrid}>
              <div className={shared.fullWidth}>
                <dt>Mã bản ghi</dt>
                <dd className={shared.code}>{selected.id}</dd>
              </div>
              <div>
                <dt>Thao tác</dt>
                <dd>{label(actions, selected.actionCode)}</dd>
              </div>
              <div>
                <dt>Thời gian (UTC+7)</dt>
                <dd>{time.format(new Date(selected.occurredAt))}</dd>
              </div>
              <div>
                <dt>Người thực hiện</dt>
                <dd>{actor(selected)}</dd>
              </div>
              {selected.actorId && (
                <div>
                  <dt>Mã người thực hiện</dt>
                  <dd>{selected.actorId}</dd>
                </div>
              )}
              <div>
                <dt>Đối tượng</dt>
                <dd>{target(selected)}</dd>
              </div>
              {selected.objectId && (
                <div>
                  <dt>Mã đối tượng</dt>
                  <dd>{selected.objectId}</dd>
                </div>
              )}
              <div>
                <dt>Mùa giải</dt>
                <dd>{selected.seasonCode ?? selected.seasonId ?? 'Không áp dụng'}</dd>
              </div>
              <div>
                <dt>Kết quả</dt>
                <dd>
                  <span className={css.outcome} data-outcome={selected.outcome}>
                    {label(results, selected.outcome)}
                  </span>
                </dd>
              </div>
              {selected.reason && (
                <div className={shared.fullWidth}>
                  <dt>Lý do</dt>
                  <dd>{selected.reason}</dd>
                </div>
              )}
            </dl>
            {(selected.before || selected.after) && (
              <>
                <h3>Nội dung thay đổi chi tiết</h3>
                {selected.actionCode.startsWith('CREATE_SEASON_') && <p>Quyền Tạo mùa giải</p>}
                <div className={css.changes}>
                  <ChangeSummary
                    title="Trước thay đổi"
                    values={selected.before}
                    actionCode={selected.actionCode}
                    empty={
                      selected.outcome === 'SUCCESS' &&
                      ['ACCOUNT_CREATED', 'ADMIN_BOOTSTRAPPED', 'DELEGATION_DRAFTED'].includes(
                        selected.actionCode,
                      )
                        ? 'Đối tượng chưa được tạo.'
                        : 'Không có dữ liệu trước thay đổi được ghi nhận.'
                    }
                  />
                  <ChangeSummary
                    title="Sau thay đổi"
                    values={selected.after}
                    actionCode={selected.actionCode}
                    after
                    empty="Không có dữ liệu sau thay đổi được ghi nhận."
                  />
                </div>
              </>
            )}
            {!selected.before && !selected.after && (
              <p>
                {['LOGIN_SUCCEEDED', 'LOGOUT_SUCCEEDED'].includes(selected.actionCode)
                  ? 'Sự kiện xác thực không có nội dung thay đổi dữ liệu nghiệp vụ để so sánh.'
                  : 'Không có dữ liệu thay đổi được ghi nhận hoặc được phép hiển thị.'}
              </p>
            )}
          </div>
        </AdminDrawer>
      )}
    </section>
  );
}
