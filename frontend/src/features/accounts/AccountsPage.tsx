import { useState } from 'react';
import { useSession } from '../../shared/http/use-session';
import { AdminDialog, type AdminCommand } from './AdminDialog';
import { DisplayOptions, ListFeedback, Pagination, StateBadge } from './AdminLists';
import {
  permissionNames,
  roleNames,
  stateNames,
  type Account,
  type AccountList,
  type Season,
} from './administration-model';
import { GrantsPanel } from './GrantsPanel';
import { AdminIcon } from './AdminIcon';
import { AdminSelect } from './AdminSelect';
import { useSearchTerm } from './use-search-term';
import { useAdminList } from './use-admin-list';
import css from './Administration.module.css';

/** Summarizes the current account state and rights for explicit revision review. */
const describeAccount = (account: Account, seasons: Season[]) =>
  [
    account.fullName,
    account.personnelCode,
    stateNames[account.state],
    ...account.systemRoles.map(({ roleCode }) => roleNames[roleCode]),
    ...account.seasonRoles.map(
      ({ roleCode, seasonId }) =>
        roleNames[roleCode] + ' / ' + (seasons.find(({ id }) => id === seasonId)?.name ?? seasonId),
    ),
    ...account.sharedGrants.map(({ masterKind }) => permissionNames[masterKind]),
    ...(account.createSeasonGrants.length ? [permissionNames.CREATE_SEASON] : []),
  ].join(' · ');

/** Displays the filtered account list and coordinates its account and permission commands. */
export function AccountsPage() {
  const { client, session } = useSession();
  const [search, setSearch] = useState('');
  const term = useSearchTerm(search);
  const [pageTerm, setPageTerm] = useState(term);
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    roleCode: '',
    sort: 'createdAt:desc',
    pageSize: '20',
    page: 1,
  });
  const [selected, setSelected] = useState<string>();
  const [command, setCommand] = useState<AdminCommand>();
  const [success, setSuccess] = useState(false);
  // Bind pagination to the committed term, including navigation during debounce.
  if (pageTerm !== term) {
    setPageTerm(term);
    setFilters({ ...filters, page: 1 });
  }
  const query = new URLSearchParams({
    page: String(pageTerm === term ? filters.page : 1),
    sort: filters.sort,
    pageSize: filters.pageSize,
  });
  if (term) query.set('search', term);
  if (filters.state) query.set('state', filters.state);
  if (filters.roleCode) query.set('roleCode', filters.roleCode);
  const list = useAdminList<AccountList>('/accounts?' + query);
  const account = list.data?.items.find(({ id }) => id === selected);
  /** Dismisses the pending account command without issuing a request. */
  const close = () => setCommand(undefined);
  /** Closes a completed command and reloads authoritative account data. */
  const onSuccess = () => {
    close();
    setSuccess(true);
    list.reload();
  };

  /** Binds the selected account revision and provides an explicit reload when a command conflicts. */
  function accountCommand(row: Account, operation: Omit<AdminCommand, 'basis' | 'readBasis'>) {
    setSuccess(false);
    setCommand({
      ...operation,
      basis: {
        revision: row.revision,
        description: describeAccount(row, list.data?.seasons ?? []),
      },
      /** Searches all matching pages for the selected account ID before offering a new revision. */
      readBasis: async () => {
        const query = new URLSearchParams({ search: row.username, pageSize: '100' });
        for (let page = 1; ; page++) {
          query.set('page', String(page));
          const { data } = await client.request<AccountList>('/accounts?' + query);
          const match = data.items.find(({ id }) => id === row.id);
          if (match)
            return {
              revision: match.revision,
              description: describeAccount(match, data.seasons),
            };
          if (page * data.pageSize >= data.total) throw new Error('Không tìm thấy dữ liệu.');
        }
      },
    });
  }

  return (
    <section className={css.panel} aria-label="Danh sách tài khoản">
      <div className={css.sectionHeader}>
        <div>
          <h1>Quản lý tài khoản và phân quyền</h1>
          <p>Quản lý tài khoản nhân sự, trạng thái sử dụng và quyền truy cập trong hệ thống.</p>
        </div>
        <button
          className={css.primary}
          aria-label="+ Thêm tài khoản mới"
          onClick={() => {
            setSuccess(false);
            setCommand({
              title: 'Thêm tài khoản mới',
              path: '/accounts',
              description:
                'Đối chiếu mã nhân sự với hồ sơ trước khi tạo. Mỗi người sử dụng một tài khoản riêng. Mật khẩu tạm dài 15–128 ký tự và có hiệu lực 24 giờ.',
              preview: ({ personnelCode }) =>
                personnelCode?.trim()
                  ? 'Mã nhân sự sẽ lưu: ' + personnelCode.trim().toUpperCase()
                  : undefined,
              fields: [
                { name: 'personnelCode', label: 'Mã nhân sự' },
                { name: 'fullName', label: 'Họ và tên' },
                { name: 'username', label: 'Tên đăng nhập' },
                { name: 'temporaryPassword', label: 'Mật khẩu tạm', type: 'password' },
              ],
            });
          }}
        >
          <AdminIcon name="plus" />
          <span>Thêm tài khoản</span>
        </button>
      </div>
      {success && (
        <p className={css.success} role="status">
          Đã lưu thay đổi.
        </p>
      )}
      <form
        className={css.filters}
        onSubmit={(event) => {
          event.preventDefault();
          setFilters({ ...filters, search: search.trim(), page: 1 });
        }}
      >
        <label className={css.search}>
          <span className={css.srOnly}>Tìm tài khoản</span>
          <AdminIcon name="search" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setFilters({ ...filters, page: 1 });
            }}
            placeholder="Tìm theo mã nhân sự, họ tên hoặc tên đăng nhập…"
          />
        </label>
        <AdminSelect
          label="Trạng thái"
          value={filters.state}
          onChange={(state) => setFilters({ ...filters, state, page: 1 })}
          options={[
            { value: '', label: 'Tất cả trạng thái' },
            { value: 'ACTIVE', label: 'Đang hoạt động' },
            { value: 'LOCKED', label: 'Đã khóa' },
          ]}
        />
        <AdminSelect
          label="Vai trò"
          value={filters.roleCode}
          onChange={(roleCode) => setFilters({ ...filters, roleCode, page: 1 })}
          options={[
            { value: '', label: 'Tất cả vai trò' },
            ...Object.entries(roleNames).map(([value, label]) => ({ value, label })),
          ]}
        />
        <button
          type="button"
          className={css.refresh}
          aria-label="Làm mới danh sách tài khoản"
          title="Làm mới danh sách tài khoản"
          onClick={() => {
            setSearch('');
            setFilters({
              search: '',
              state: '',
              roleCode: '',
              sort: 'createdAt:desc',
              pageSize: '20',
              page: 1,
            });
            list.reload();
          }}
        >
          <AdminIcon name="refresh" />
        </button>
      </form>
      <DisplayOptions
        sort={filters.sort}
        pageSize={filters.pageSize}
        onSort={(sort) => setFilters({ ...filters, sort, page: 1 })}
        onPageSize={(pageSize) => setFilters({ ...filters, pageSize, page: 1 })}
        sorts={[
          { value: 'createdAt:desc', label: 'Mới nhất' },
          { value: 'username:asc', label: 'Tên đăng nhập A–Z' },
          { value: 'fullName:asc', label: 'Họ tên A–Z' },
          { value: 'personnelCode:asc', label: 'Mã nhân sự A–Z' },
        ]}
      />
      <ListFeedback
        loading={list.loading}
        error={list.error}
        empty={list.data?.items.length === 0}
        onRetry={list.reload}
      />
      {!!list.data?.items.length && (
        <div className={css.scroll}>
          <table className={css.table + ' ' + css.accountTable}>
            <colgroup>
              {['5%', '13%', '17%', '14%', '14%', '25%', '12%'].map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {[
                  'STT',
                  'Mã nhân sự',
                  'Họ và tên',
                  'Tên đăng nhập',
                  'Trạng thái',
                  'Vai trò / Phân công',
                  'Thao tác',
                ].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.data.items.map((row, index) => (
                <tr key={row.id}>
                  <td>{(list.data!.page - 1) * list.data!.pageSize + index + 1}</td>
                  <td className={css.code}>{row.personnelCode}</td>
                  <td>
                    <strong>{row.fullName}</strong>
                  </td>
                  <td className={css.truncate} title={row.username}>
                    {row.username}
                  </td>
                  <td>
                    <StateBadge state={row.state} />
                    {row.mustChangePassword && <small>Chờ đổi mật khẩu</small>}
                  </td>
                  <td>
                    <div className={css.roleTags}>
                      {row.systemRoles.map(({ id, roleCode }) => (
                        <span key={id} className={css.roleTag}>
                          {roleNames[roleCode]}
                        </span>
                      ))}
                      {row.seasonRoles.map(({ id, roleCode, seasonId }) => (
                        <span key={id} className={css.roleTag}>
                          {roleNames[roleCode]} (
                          {list.data!.seasons.find((season) => season.id === seasonId)?.name ??
                            seasonId}
                          )
                        </span>
                      ))}
                      {!row.systemRoles.length && !row.seasonRoles.length && (
                        <span>Chưa phân công</span>
                      )}
                    </div>
                    {row.seasonRoles.length > 0 && (
                      <small>{row.seasonRoles.length} phân công mùa giải</small>
                    )}
                  </td>
                  <td>
                    <div className={css.actions}>
                      <button type="button" onClick={() => setSelected(row.id)}>
                        <AdminIcon name="eye" />
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.data && (
        <Pagination data={list.data} change={(page) => setFilters({ ...filters, page })} />
      )}
      {account && list.data && (
        <GrantsPanel
          account={account}
          seasons={list.data.seasons}
          self={account.id === session?.account.id}
          onClose={() => setSelected(undefined)}
          onCommand={(operation) => accountCommand(account, operation)}
        />
      )}
      {command && <AdminDialog command={command} onClose={close} onSuccess={onSuccess} />}
    </section>
  );
}
