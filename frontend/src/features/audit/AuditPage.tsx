import { Modal } from 'antd';
import { useState, type FormEvent } from 'react';
import { ListFeedback } from '../accounts/AdminLists';
import type { List } from '../accounts/administration-model';
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
  dateStyle: 'short',
  timeStyle: 'medium',
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

function ChangeSummary({ title, values }: { title: string; values: Change }) {
  return (
    <div>
      <h3>{title}</h3>
      <dl>
        {Object.entries(values).map(([name, value]) => (
          <div key={name}>
            <dt>{label(changeLabels, name)}</dt>
            <dd>
              {value === null
                ? '—'
                : typeof value === 'boolean'
                  ? value
                    ? 'Có'
                    : 'Không'
                  : typeof value === 'string' &&
                      ['startsAt', 'endsAt', 'effectiveAt'].includes(name) &&
                      Number.isFinite(Date.parse(value))
                    ? time.format(new Date(value))
                    : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function AuditPage() {
  const [draft, setDraft] = useState(initialFilters);
  const [applied, setApplied] = useState(() => auditFilters(initialFilters));
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>();
  const [validation, setValidation] = useState<string>();
  const { data, error, requestId, loading, reload } = useAdminList<List<AuditRecord>>(
    '/audit-logs?' + applied + '&page=' + page,
  );
  const selected = error ? undefined : data?.items.find((row) => row.id === selectedId);
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 20)));
  const update = (key: keyof typeof draft, value: string) =>
    setDraft((previous) => ({ ...previous, [key]: value }));
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
      <header className={css.heading}>
        <h1 id="audit-heading">Tra cứu nhật ký hoạt động</h1>
        <p>
          Theo dõi lịch sử các thao tác quan trọng trong hệ thống. Thời gian hiển thị theo giờ Việt
          Nam (UTC+7).
        </p>
      </header>
      <form className={css.filters} onSubmit={submit} aria-label="Bộ lọc nhật ký">
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
        <label>
          Từ ngày
          <input
            type="date"
            value={draft.from}
            onChange={(event) => update('from', event.target.value)}
          />
        </label>
        <label>
          Đến ngày
          <input
            type="date"
            value={draft.through}
            onChange={(event) => update('through', event.target.value)}
          />
        </label>
        <label>
          Loại thao tác
          <select
            value={draft.actionCode}
            onChange={(event) => update('actionCode', event.target.value)}
          >
            <option value="">Tất cả thao tác</option>
            {Object.entries(actions).map(([code, text]) => (
              <option value={code} key={code}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <label>
          Loại đối tượng
          <select
            value={draft.objectKind}
            onChange={(event) => update('objectKind', event.target.value)}
          >
            <option value="">Tất cả đối tượng</option>
            {Object.entries(objectKinds).map(([code, text]) => (
              <option value={code} key={code}>
                {text}
              </option>
            ))}
          </select>
        </label>
        <label>
          Thứ tự
          <select value={draft.sort} onChange={(event) => update('sort', event.target.value)}>
            <option value="occurredAt:desc">Mới nhất trước</option>
            <option value="occurredAt:asc">Cũ nhất trước</option>
          </select>
        </label>
        <label>
          Số dòng mỗi trang
          <select
            value={draft.pageSize}
            onChange={(event) => update('pageSize', event.target.value)}
          >
            {[20, 50, 100].map((size) => (
              <option value={size} key={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className={css.filterActions}>
          <button className={shared.primary} type="submit">
            Tra cứu
          </button>
          <button type="button" onClick={clear}>
            Đặt lại
          </button>
        </div>
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
        <table className={shared.table} aria-label="Nhật ký hoạt động">
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
                <td className={css.actor}>{actor(row)}</td>
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
      <Modal
        title="Chi tiết bản ghi nhật ký"
        open={!!selected}
        onCancel={() => setSelectedId(undefined)}
        footer={null}
        destroyOnHidden
      >
        {selected && (
          <div className={css.detail}>
            <dl>
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
                <dd>{label(results, selected.outcome)}</dd>
              </div>
              {selected.reason && (
                <div>
                  <dt>Lý do</dt>
                  <dd>{selected.reason}</dd>
                </div>
              )}
            </dl>
            {selected.before && <ChangeSummary title="Trước thay đổi" values={selected.before} />}
            {selected.after && <ChangeSummary title="Sau thay đổi" values={selected.after} />}
          </div>
        )}
      </Modal>
    </section>
  );
}
