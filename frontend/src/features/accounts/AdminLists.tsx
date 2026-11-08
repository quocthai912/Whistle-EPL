import { grantStateNames, stateNames, type List } from './administration-model';
import css from './Administration.module.css';

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
