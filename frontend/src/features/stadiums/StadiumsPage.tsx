import { useState } from 'react';
import { AdminDrawer } from '../accounts/AdminDrawer';
import { AdminIcon } from '../accounts/AdminIcon';
import { DisplayOptions, ListFeedback, Pagination } from '../accounts/AdminLists';
import { AdminSelect } from '../accounts/AdminSelect';
import { useAdminList } from '../accounts/use-admin-list';
import { useSearchTerm } from '../accounts/use-search-term';
import css from '../accounts/Administration.module.css';
import { MasterAvailability } from '../masters/MasterAvailability';
import { MasterForm, MasterHistory } from '../masters/MasterForms';
import type { SeasonHistoryMeta } from '../seasons/season-model';
import stadiumCss from './StadiumsPage.module.css';

type Stadium = {
  id: string;
  code: string;
  name: string;
  location: string | null;
  discontinuedAt: string | null;
};
type Detail = Stadium & { revision: string; capabilities: { canEdit: boolean } };
type Collection = {
  items: Stadium[];
  capabilities: { canEdit: boolean };
  counts: { total: number; active: number; discontinued: number };
};

const options = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Đang sử dụng' },
  { value: 'DISCONTINUED', label: 'Đã ngừng sử dụng' },
];

export function StadiumsPage() {
  const [searchDraft, setSearchDraft] = useState('');
  const search = useSearchTerm(searchDraft);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('code:asc');
  const [pageSize, setPageSize] = useState('20');
  const [availability, setAvailability] = useState('ALL');
  const [selected, setSelected] = useState<Stadium>();
  const [creating, setCreating] = useState(false);
  const query = new URLSearchParams({ page: String(page), pageSize, sort, availability, search });
  const list = useAdminList<Collection, SeasonHistoryMeta>(`/stadiums?${query}`);
  const items = list.data?.items ?? [];
  const counts = list.data?.counts;
  return (
    <section className={css.panel} aria-label="Quản lý sân vận động">
      <div className={css.sectionHeader}>
        <div>
          <h1>Quản lý sân vận động</h1>
          <p>Tra cứu và cập nhật hồ sơ sân vận động.</p>
        </div>
        {list.data?.capabilities.canEdit && (
          <button type="button" className={css.primary} onClick={() => setCreating(true)}>
            <AdminIcon name="plus" /> Thêm sân vận động
          </button>
        )}
      </div>
      {counts && (
        <dl className={stadiumCss.stats}>
          <div>
            <dt>Tổng số sân</dt>
            <dd>{counts.total}</dd>
          </div>
          <div>
            <dt>Đang sử dụng</dt>
            <dd>{counts.active}</dd>
          </div>
          <div>
            <dt>Đã ngừng sử dụng</dt>
            <dd>{counts.discontinued}</dd>
          </div>
        </dl>
      )}
      <div className={css.filters}>
        <label className={css.search}>
          <span className={css.srOnly}>Tìm sân vận động</span>
          <AdminIcon name="search" />
          <input
            value={searchDraft}
            placeholder="Tìm theo mã, tên hoặc địa điểm…"
            onChange={(event) => {
              setSearchDraft(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <AdminSelect
          label="Trạng thái sân vận động"
          value={availability}
          options={options}
          onChange={(value) => {
            setAvailability(value);
            setPage(1);
          }}
        />
        <button
          type="button"
          className={css.refresh}
          aria-label="Làm mới danh sách sân vận động"
          onClick={list.reload}
        >
          <AdminIcon name="refresh" />
        </button>
      </div>
      <DisplayOptions
        sort={sort}
        pageSize={pageSize}
        sorts={[
          { value: 'code:asc', label: 'Mã A–Z' },
          { value: 'name:asc', label: 'Tên A–Z' },
        ]}
        onSort={(value) => {
          setSort(value);
          setPage(1);
        }}
        onPageSize={(value) => {
          setPageSize(value);
          setPage(1);
        }}
      />
      <ListFeedback
        loading={list.loading}
        error={list.error}
        empty={!items.length}
        onRetry={list.reload}
      />
      {!!items.length && (
        <div className={css.scroll}>
          <table className={css.table}>
            <thead>
              <tr>
                <th scope="col">STT</th>
                <th scope="col">Mã sân</th>
                <th scope="col">Tên sân vận động</th>
                <th scope="col">Địa điểm</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((stadium, index) => (
                <tr key={stadium.id}>
                  <td>
                    {((list.meta?.page ?? page) - 1) * (list.meta?.pageSize ?? 20) + index + 1}
                  </td>
                  <td>{stadium.code}</td>
                  <td>{stadium.name}</td>
                  <td>{stadium.location ?? '—'}</td>
                  <td>
                    <span
                      className={css.badge}
                      data-state={stadium.discontinuedAt ? 'INACTIVE' : 'ACTIVE'}
                    >
                      {stadium.discontinuedAt ? 'Đã ngừng sử dụng' : 'Đang sử dụng'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelected(stadium)}
                      aria-label={`Chi tiết ${stadium.name}`}
                    >
                      <AdminIcon name="eye" /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.meta && <Pagination data={{ ...list.meta, items }} change={setPage} />}
      {selected && (
        <StadiumProfile
          stadium={selected}
          onClose={() => setSelected(undefined)}
          onChange={list.reload}
        />
      )}
      {creating && (
        <MasterForm
          master="stadiums"
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            setPage(1);
            list.reload();
          }}
        />
      )}
    </section>
  );
}

function StadiumProfile({
  stadium,
  onClose,
  onChange,
}: {
  stadium: Stadium;
  onClose: () => void;
  onChange: () => void;
}) {
  const resource = useAdminList<Detail>(`/stadiums/${stadium.id}`);
  const [history, setHistory] = useState(false);
  const [form, setForm] = useState<'edit' | 'correct'>();
  const detail = resource.data;
  const refresh = () => {
    resource.reload();
    onChange();
  };
  return (
    <AdminDrawer
      width={760}
      title={detail?.name ?? stadium.name}
      subtitle="Hồ sơ sân vận động"
      icon={<AdminIcon name="stadium" />}
      onClose={onClose}
    >
      <ListFeedback loading={resource.loading} error={resource.error} onRetry={resource.reload} />
      {detail && (
        <div className={css.details}>
          <dl className={css.detailGrid}>
            <div>
              <dt>Mã sân</dt>
              <dd>{detail.code}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>{detail.discontinuedAt ? 'Đã ngừng sử dụng' : 'Đang sử dụng'}</dd>
            </div>
            <div>
              <dt>Tên sân vận động</dt>
              <dd>{detail.name}</dd>
            </div>
            <div>
              <dt>Địa điểm</dt>
              <dd>{detail.location ?? '—'}</dd>
            </div>
          </dl>
          <div className={`${css.actions} ${css.profileActions}`}>
            {!resource.loading && !resource.error && detail.capabilities.canEdit && (
              <>
                <button type="button" className={css.primary} onClick={() => setForm('edit')}>
                  Chỉnh sửa thông tin
                </button>
                <MasterAvailability
                  master="stadiums"
                  id={detail.id}
                  revision={detail.revision}
                  discontinued={!!detail.discontinuedAt}
                  onChange={refresh}
                />
              </>
            )}
            <button type="button" aria-expanded={history} onClick={() => setHistory(!history)}>
              Lịch sử
            </button>
          </div>
          {history && <MasterHistory master="stadiums" id={detail.id} key={detail.revision} />}
          {form && (
            <MasterForm
              master="stadiums"
              detail={detail}
              onRevisionConflict={() => {
                setForm(undefined);
                refresh();
              }}
              correcting={form === 'correct'}
              onClose={() => setForm(undefined)}
              onSaved={() => {
                setForm(undefined);
                refresh();
              }}
            />
          )}
        </div>
      )}
    </AdminDrawer>
  );
}
