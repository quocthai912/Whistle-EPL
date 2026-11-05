import { useState } from 'react';
import { useSession } from '../../shared/http/use-session';
import { AdminDialog, type AdminCommand } from './AdminDialog';
import { ListFeedback, Pagination, StateBadge } from './AdminLists';
import {
  permissionNames,
  roleNames,
  stateNames,
  type Account,
  type AccountList,
  type Season,
} from './administration-model';
import { GrantsPanel } from './GrantsPanel';
import { useAdminList } from './use-admin-list';
import css from './Administration.module.css';

/** Summarizes the current account state and rights for explicit revision review. */
const describeAccount = (account: Account, seasons: Season[]) =>
  [
    account.fullName,
    account.personnelCode,
    stateNames[account.state],
    'phiên bản ' + account.revision,
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
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    sort: 'createdAt:desc',
    page: 1,
  });
  const [selected, setSelected] = useState<string>();
  const [command, setCommand] = useState<AdminCommand>();
  const [success, setSuccess] = useState(false);
  const query = new URLSearchParams({ page: String(filters.page), sort: filters.sort });
  if (filters.search) query.set('search', filters.search);
  if (filters.state) query.set('state', filters.state);
  const list = useAdminList<AccountList>('/accounts?' + query);
  const account = list.data?.items.find(({ id }) => id === selected);
  const close = () => setCommand(undefined);
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
      readBasis: async () => {
        const latest = await client.request<AccountList>(
          '/accounts?search=' + encodeURIComponent(row.username),
        );
        const match = latest.data.items.find(({ id }) => id === row.id);
        if (!match) throw new Error('Không tìm thấy dữ liệu.');
        return {
          revision: match.revision,
          description: describeAccount(match, latest.data.seasons),
        };
      },
    });
  }

  return (
    <section className={css.panel} aria-label="Danh sách tài khoản">
      <div className={css.sectionHeader}>
        <div>
          <h2>Danh sách tài khoản</h2>
          <p>Tra cứu nhân sự, quản lý trạng thái và phân quyền.</p>
        </div>
        <button
          className={css.primary}
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
          + Thêm tài khoản mới
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
        <label>
          Tìm tài khoản
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mã nhân sự, họ tên, tên đăng nhập"
          />
        </label>
        <label>
          Trạng thái
          <select
            value={filters.state}
            onChange={(event) => setFilters({ ...filters, state: event.target.value, page: 1 })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </label>
        <label>
          Sắp xếp
          <select
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value, page: 1 })}
          >
            <option value="createdAt:desc">Mới nhất</option>
            <option value="username:asc">Tên đăng nhập A–Z</option>
            <option value="fullName:asc">Họ tên A–Z</option>
            <option value="personnelCode:asc">Mã nhân sự A–Z</option>
          </select>
        </label>
        <button type="submit">Tìm kiếm</button>
      </form>
      <ListFeedback
        loading={list.loading}
        error={list.error}
        empty={list.data?.items.length === 0}
        onRetry={list.reload}
      />
      {!!list.data?.items.length && (
        <div className={css.scroll}>
          <table className={css.table}>
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
                  <td>{row.personnelCode}</td>
                  <td>
                    <strong>{row.fullName}</strong>
                  </td>
                  <td>{row.username}</td>
                  <td>
                    <StateBadge state={row.state} />
                    {row.mustChangePassword && <small>Chờ đổi mật khẩu</small>}
                  </td>
                  <td>
                    {row.systemRoles.length ? roleNames.SYSTEM_ADMINISTRATOR : 'Nhân viên'}
                    {row.seasonRoles.length > 0 && (
                      <small>{row.seasonRoles.length} phân công mùa giải</small>
                    )}
                  </td>
                  <td>
                    <div className={css.actions}>
                      <button type="button" onClick={() => setSelected(row.id)}>
                        Chi tiết
                      </button>
                      {row.id !== session?.account.id && (
                        <button
                          type="button"
                          onClick={() =>
                            accountCommand(row, {
                              title:
                                row.state === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
                              critical: true,
                              path:
                                '/accounts/' +
                                row.id +
                                (row.state === 'ACTIVE' ? '/lock' : '/unlock'),
                              description:
                                row.state === 'ACTIVE'
                                  ? 'Người dùng sẽ mất quyền truy cập và các phiên hiện tại sẽ kết thúc.'
                                  : 'Người dùng có thể đăng nhập lại bằng mật khẩu còn hiệu lực.',
                            })
                          }
                        >
                          {row.state === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                        </button>
                      )}
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
