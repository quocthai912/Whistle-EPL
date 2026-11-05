import { stateNames, type List } from './administration-model';
import css from './Administration.module.css';

export function StateBadge({ state }: { state: string }) {
  return (
    <span className={css.badge} data-state={state}>
      {stateNames[state] ?? state}
    </span>
  );
}
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
        {data.total} kết quả · Trang {data.page}/{pages}
      </span>
      <button disabled={data.page <= 1} onClick={() => change(data.page - 1)}>
        Trang trước
      </button>
      <button disabled={data.page >= pages} onClick={() => change(data.page + 1)}>
        Trang sau
      </button>
    </div>
  );
}
