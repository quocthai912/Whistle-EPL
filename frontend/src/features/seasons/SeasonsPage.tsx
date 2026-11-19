import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useSession } from '../../shared/http/use-session';
import { AdminIcon } from '../accounts/AdminIcon';
import { AdminSelect } from '../accounts/AdminSelect';
import { DisplayOptions, ListFeedback, Pagination, StateBadge } from '../accounts/AdminLists';
import { useAdminList } from '../accounts/use-admin-list';
import { useSearchTerm } from '../accounts/use-search-term';
import shared from '../accounts/Administration.module.css';
import { SeasonCreateForm } from './SeasonCreateForm';
import { SeasonDetail } from './SeasonDetail';
import { SeasonLifecycleReview } from './SeasonLifecycleReview';
import type { SeasonList, SeasonPageMeta } from './season-model';
import { formatSeasonDate, formatSeasonInstant, regulationSeasonScope } from './season-model';
import css from './SeasonsPage.module.css';

const sortOptions = [
  { value: 'code:asc', label: 'Mã mùa giải A–Z' },
  { value: 'code:desc', label: 'Mã mùa giải Z–A' },
  { value: 'name:asc', label: 'Tên mùa giải A–Z' },
  { value: 'name:desc', label: 'Tên mùa giải Z–A' },
  { value: 'startDate:asc', label: 'Ngày bắt đầu sớm nhất' },
  { value: 'startDate:desc', label: 'Ngày bắt đầu muộn nhất' },
];

/** Shows the scoped list only to accounts that hold a role in at least one season. */
export function SeasonsPage() {
  const { session } = useSession();
  const hasSeasonReadScope = !!session?.seasonRoles?.length || !!session?.seasonManagerIds?.length;
  if (!hasSeasonReadScope)
    return session?.canCreateSeason ? (
      <SeasonCreateForm />
    ) : (
      <section className={shared.panel} aria-label="Quản lý mùa giải">
        <h1>Quản lý mùa giải</h1>
        <p role="alert">Bạn không có quyền truy cập trang này.</p>
      </section>
    );
  return <SeasonListPage canCreate={!!session?.canCreateSeason} />;
}

function SeasonListPage({ canCreate }: { canCreate: boolean }) {
  const { session } = useSession();
  const regulationSeasons = regulationSeasonScope(session);
  const [searchDraft, setSearchDraft] = useState('');
  const search = useSearchTerm(searchDraft);
  const [filters, setFilters] = useState({ state: '', sort: 'code:asc', pageSize: '20', page: 1 });
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>();
  const [workspace, setWorkspace] = useState<'list' | 'lifecycle'>('list');
  const [lifecycleIntent, setLifecycleIntent] = useState<{ id: string; name: string }>();

  const query = new URLSearchParams({
    page: String(filters.page),
    pageSize: filters.pageSize,
    sort: filters.sort,
  });
  if (search) query.set('search', search);
  if (filters.state) query.set('state', filters.state);

  const list = useAdminList<SeasonList, SeasonPageMeta>('/seasons?' + query.toString());
  const listError = list.error;
  const data = listError ? undefined : list.data;
  const paginationData = data
    ? {
        items: data.items,
        ...(list.meta ?? {
          page: filters.page,
          pageSize: Number(filters.pageSize),
          total: data.items.length,
        }),
      }
    : undefined;

  function resetFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <section className={shared.panel} aria-label="Danh sách mùa giải">
      <div className={shared.sectionHeader}>
        <div>
          <h1>Quản lý mùa giải</h1>
          <p>Tra cứu thông tin mùa giải trong phạm vi được phân công.</p>
        </div>
        {canCreate && workspace === 'list' && (
          <SeasonCreateForm compact onCreated={() => list.reload()} />
        )}
      </div>
      <div className={shared.tabs} role="tablist" aria-label="Chức năng mùa giải">
        <button
          type="button"
          role="tab"
          aria-selected={workspace === 'list'}
          id="season-list-tab"
          onClick={() => {
            setLifecycleIntent(undefined);
            setWorkspace('list');
          }}
        >
          Danh sách mùa giải
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={workspace === 'lifecycle'}
          id="season-lifecycle-tab"
          onClick={() => setWorkspace('lifecycle')}
        >
          Đề xuất đóng/mở mùa giải
        </button>
      </div>

      {workspace === 'lifecycle' ? (
        <div role="tabpanel" aria-labelledby="season-lifecycle-tab">
          <SeasonLifecycleReview
            initialSeason={lifecycleIntent}
            prepare={!!lifecycleIntent}
            onUpdated={list.reload}
          />
        </div>
      ) : (
        <div role="tabpanel" aria-labelledby="season-list-tab">
          <form className={shared.filters} onSubmit={resetFilters}>
            <label className={shared.search}>
              <span className={shared.srOnly}>Tìm mùa giải</span>
              <AdminIcon name="search" />
              <input
                value={searchDraft}
                onChange={(event) => {
                  setSearchDraft(event.target.value);
                  setFilters((current) => (current.page === 1 ? current : { ...current, page: 1 }));
                }}
                placeholder="Tìm theo mã hoặc tên mùa giải…"
              />
            </label>
            <AdminSelect
              label="Trạng thái mùa giải"
              value={filters.state}
              onChange={(state) => setFilters((current) => ({ ...current, state, page: 1 }))}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'OPEN', label: 'Đang mở' },
                { value: 'CLOSED', label: 'Đã đóng' },
              ]}
            />
            <button
              type="button"
              className={shared.refresh}
              aria-label="Làm mới danh sách mùa giải"
              title="Làm mới danh sách mùa giải"
              onClick={() => {
                setSearchDraft('');
                setFilters({ state: '', sort: 'code:asc', pageSize: '20', page: 1 });
                list.reload();
              }}
            >
              <AdminIcon name="refresh" />
            </button>
          </form>

          <DisplayOptions
            sort={filters.sort}
            pageSize={filters.pageSize}
            sorts={sortOptions}
            onSort={(sort) => setFilters((current) => ({ ...current, sort, page: 1 }))}
            onPageSize={(pageSize) => setFilters((current) => ({ ...current, pageSize, page: 1 }))}
          />

          <ListFeedback
            loading={list.loading}
            error={listError}
            empty={!!data && data.items.length === 0}
            onRetry={list.reload}
          />

          {!!data?.items.length && (
            <div
              className={shared.scroll}
              role="region"
              aria-label="Danh sách mùa giải"
              tabIndex={0}
            >
              <table className={`${shared.table} ${css.seasonTable}`}>
                <thead>
                  <tr>
                    <th scope="col">STT</th>
                    <th scope="col">Mã mùa giải</th>
                    <th scope="col">Tên mùa giải</th>
                    <th scope="col">Tên giải đấu</th>
                    <th scope="col">Bắt đầu</th>
                    <th scope="col">Kết thúc</th>
                    <th scope="col">Quy định hiệu lực</th>
                    <th scope="col">Trạng thái</th>
                    <th scope="col">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((season, index) => (
                    <tr key={season.id}>
                      <td>
                        {((paginationData?.page ?? 1) - 1) * (paginationData?.pageSize ?? 20) +
                          index +
                          1}
                      </td>
                      <td className={shared.code}>{season.code}</td>
                      <td>{season.name}</td>
                      <td>{season.competitionName}</td>
                      <td>{formatSeasonDate(season.startDate)}</td>
                      <td>{formatSeasonDate(season.endDate)}</td>
                      <td>
                        {season.effectiveRegulation ? (
                          <span>
                            Phiên bản {season.effectiveRegulation.versionNumber}
                            <small className={css.regulationDate}>
                              {season.effectiveRegulation.activeFrom
                                ? `Từ ${formatSeasonInstant(season.effectiveRegulation.activeFrom)}`
                                : 'Chưa ghi nhận ngày hiệu lực'}
                            </small>
                          </span>
                        ) : (
                          'Chưa có quy định hiệu lực'
                        )}
                      </td>
                      <td>
                        <StateBadge state={season.state} />
                      </td>
                      <td>
                        <div className={shared.actions}>
                          <button type="button" onClick={() => setSelectedSeasonId(season.id)}>
                            Chi tiết
                          </button>
                          {regulationSeasons.has(season.id) && (
                            <Link to={`/workspace/seasons/${season.id}/regulations`}>Quy định</Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {paginationData && paginationData.total > paginationData.pageSize && (
            <Pagination
              data={paginationData}
              change={(page) => setFilters((current) => ({ ...current, page }))}
            />
          )}
          {selectedSeasonId && (
            <SeasonDetail
              seasonId={selectedSeasonId}
              onClose={() => setSelectedSeasonId(undefined)}
              onUpdated={list.reload}
              onLifecycle={(season) => {
                setLifecycleIntent(season);
                setSelectedSeasonId(undefined);
                setWorkspace('lifecycle');
              }}
            />
          )}
        </div>
      )}
    </section>
  );
}
