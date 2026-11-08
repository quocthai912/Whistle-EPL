import { grantStateNames, stateNames, type List } from './administration-model';
import css from './Administration.module.css';
import { AdminSelect } from './AdminSelect';

/** Shares display preferences while leaving each list in control of its server query. */
export function DisplayOptions({
  sort,
  pageSize,
  sorts,
  onSort,
  onPageSize,
}: {
  sort: string;
  pageSize: string;
  sorts: { value: string; label: string }[];
  onSort: (sort: string) => void;
  onPageSize: (pageSize: string) => void;
}) {
  return (
    <details className={css.listOptions}>
      <summary>Tùy chọn hiển thị</summary>
      <div className={css.listOptionFields}>
        <AdminSelect
          label="Sắp xếp"
          hideLabel={false}
          value={sort}
          onChange={onSort}
          options={sorts}
        />
        <AdminSelect
          label="Số dòng mỗi trang"
          hideLabel={false}
          value={pageSize}
          onChange={onPageSize}
          options={[20, 50, 100].map((size) => ({ value: String(size), label: String(size) }))}
        />
      </div>
    </details>
  );
}

/** Displays the localized label for a persisted account, proposal or grant state. */
export function StateBadge({ state, grant = false }: { state: string; grant?: boolean }) {
  return (
    <span className={css.badge} data-state={state}>
      {(grant ? grantStateNames : stateNames)[state] ?? state}
    </span>
  );
}
/** Shows request progress, a retryable failure or an empty result independently of visible rows. */
export function ListFeedback({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading: boolean;
  error?: string;
  empty?: boolean;
  onRetry: () => void;
}) {
  if (loading) return <p role="status">Đang tải dữ liệu…</p>;
  if (error)
    return (
      <p className={css.error} role="alert">
        {error} <button onClick={onRetry}>Thử lại</button>
      </p>
    );
  if (empty) return <p role="status">Chưa có dữ liệu phù hợp.</p>;
  return null;
}
/** Displays server-counted page bounds and offers valid previous/next navigation. */
export function Pagination({
  data,
  change,
}: {
  data: List<unknown>;
  change: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return (
    <div className={css.pagination} aria-label="Phân trang">
      <span>
        {data.items.length > 0
          ? `Hiển thị ${(data.page - 1) * data.pageSize + 1}–${(data.page - 1) * data.pageSize + data.items.length} trong tổng số ${data.total} kết quả`
          : `${data.total} kết quả`}
      </span>
      <div className={css.actions}>
        <span>
          Trang {data.page} / {pages}
        </span>
        <button
          aria-label="Trang trước"
          disabled={data.page <= 1}
          onClick={() => change(data.page - 1)}
        >
          ‹
        </button>
        <button
          aria-label="Trang sau"
          disabled={data.page >= pages}
          onClick={() => change(data.page + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
}
