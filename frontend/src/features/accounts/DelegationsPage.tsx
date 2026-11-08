import { useState } from 'react';
import { AdminDrawer } from './AdminDrawer';
import { AdminIcon } from './AdminIcon';
import { AdminSelect } from './AdminSelect';
import { useSearchTerm } from './use-search-term';
import { useSession } from '../../shared/http/use-session';
import { AdminDialog, type AdminCommand, type Field } from './AdminDialog';
import { DisplayOptions, ListFeedback, Pagination, StateBadge } from './AdminLists';
import {
  actionNames,
  formatVietnamTime,
  stateNames,
  grantStateNames,
  seasonLabel,
  type Grant,
  type List,
  type Proposal,
  type ProposalList,
  type Person,
} from './administration-model';
import { useAdminList } from './use-admin-list';
import css from './Administration.module.css';

const proposalStates = ['DRAFT', 'PENDING', 'RETURNED', 'REJECTED', 'CANCELLED', 'GRANTED'];
const grantStates = ['SCHEDULED', 'ACTIVE', 'EXPIRED', 'REVOKED', 'TERMINATED'];
const displayDefaults = {
  proposals: { sort: 'createdAt:desc', pageSize: '20' },
  grants: { sort: 'grantedAt:desc', pageSize: '20' },
};
const labels = {
  submit: 'Gửi đề xuất',
  cancel: 'Hủy đề xuất',
  grant: 'Cấp ủy quyền',
  return: 'Yêu cầu bổ sung',
  reject: 'Từ chối đề xuất',
};
type Operation = keyof typeof labels;
const eligible: Record<keyof typeof actionNames, string[]> = {
  PREPARE_REGULATION_CHANGE: ['REGISTRATION_OFFICER', 'SCHEDULING_OFFICER', 'RESULTS_OFFICER'],
  APPROVE_SCHEDULE_ADJUSTMENT: ['SCHEDULING_OFFICER'],
  PREPARE_OFFICIAL_RESULT_CORRECTION: ['RESULTS_OFFICER'],
};
/** Formats a stored instant for a datetime input in Vietnam time. */
const dateInput = (value: string | null | undefined) =>
  value ? new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 16) : '';
/** Converts a Vietnam-local input to the UTC instant accepted by the delegation contract. */
const toInstant = (value: string | undefined) =>
  value ? new Date(value + '+07:00').toISOString() : undefined;
const reasonField: Field = { name: 'reason', label: 'Lý do', type: 'textarea' };
/** Builds the exact proposal basis displayed during confirmation and conflict review. */
const describe = (row: Proposal) => {
  const version = row.currentVersion;
  return [
    'Phiên bản ' + version.versionNumber + ' · ' + stateNames[version.state],
    row.proposer.fullName + ' → ' + row.recipient.fullName,
    row.season.name,
    actionNames[version.actionCode],
    (version.startMode === 'IMMEDIATE'
      ? 'Hiệu lực khi được cấp'
      : formatVietnamTime(version.startsAt)) +
      ' → ' +
      formatVietnamTime(version.endsAt),
    version.reason,
    version.decisionReason,
  ]
    .filter(Boolean)
    .join(' · ');
};

/** Separates proposal processing from granted authority and exposes actions for the caller's current roles. */
export function DelegationsPage() {
  const { session, client } = useSession();
  const administrator = session?.systemAdministrator ?? false;
  const [tab, setTab] = useState<'proposals' | 'grants'>('proposals');
  const [display, setDisplay] = useState(displayDefaults);
  const [filter, setFilter] = useState({
    seasonId: '',
    state: '',
    actionCode: '',
    recipientId: '',
    page: 1,
  });
  const [search, setSearch] = useState('');
  const term = useSearchTerm(search);
  const [command, setCommand] = useState<AdminCommand>();
  const [detail, setDetail] = useState<Proposal>();
  const [grantDetail, setGrantDetail] = useState<Grant>();
  const [success, setSuccess] = useState(false);
  const query = new URLSearchParams({ page: String(filter.page), ...display[tab] });
  if (filter.seasonId) query.set('seasonId', filter.seasonId);
  if (filter.state) query.set('state', filter.state);
  if (term) query.set('search', term);
  if (tab === 'proposals' && filter.actionCode) query.set('actionCode', filter.actionCode);
  if (tab === 'grants' && filter.recipientId) query.set('recipientId', filter.recipientId);
  const proposals = useAdminList<ProposalList>(
    '/delegation-proposals?' + (tab === 'proposals' ? query : 'page=1'),
  );
  const grants = useAdminList<List<Grant> & { recipients?: Person[] }>(
    '/delegation-grants?' + (tab === 'grants' ? query : 'page=1'),
  );
  const list = tab === 'proposals' ? proposals : grants;
  const metadata = proposals.data;

  function open(action: AdminCommand) {
    setSuccess(false);
    setDetail(undefined);
    setGrantDetail(undefined);
    setCommand(action);
  }

  /** Finds the exact target in the authorized paginated list when the user requests a fresh command basis. */
  async function readRow<T extends { id: string }>(path: string, id: string) {
    for (let page = 1; ; page++) {
      const { data } = await client.request<List<T>>(path + '&pageSize=100&page=' + page);
      const row = data.items.find((item) => item.id === id);
      if (row) return row;
      if (page * data.pageSize >= data.total) throw new Error('Không tìm thấy dữ liệu.');
    }
  }

  function basis(row: Proposal) {
    return { revision: row.revision, versionId: row.currentVersion.id, description: describe(row) };
  }
  async function readProposal(row: Proposal) {
    return readRow<Proposal>('/delegation-proposals?seasonId=' + row.season.id, row.id);
  }
  /** Prepares a transition bound to the selected version and requests a reason for return or rejection. */
  function process(row: Proposal, operation: Operation) {
    open({
      title: labels[operation],
      path: '/delegation-proposals/' + row.id + '/' + operation,
      critical: operation === 'grant',
      basis: basis(row),
      readBasis: async () => basis(await readProposal(row)),
      fields: operation === 'return' || operation === 'reject' ? [reasonField] : [],
      description:
        operation === 'grant' ? 'Quyền được cấp theo đúng nội dung phiên bản đã gửi.' : undefined,
    });
  }
  /** Prepares the draft form, constraining recipient choices by season and operation. */
  function edit(row?: Proposal) {
    if (!metadata) return;
    const version = row?.currentVersion;
    const selectable = metadata.proposalSeasons;
    /** Derives draft fields and eligible recipients from the current form selections. */
    const fields = (values: Record<string, string>): Field[] => {
      const seasonId = row?.season.id ?? values.seasonId;
      const roles = eligible[values.actionCode as keyof typeof eligible] ?? [];
      const choices = new Map(
        metadata.recipients
          .filter((entry) => entry.seasonId === seasonId && roles.includes(entry.roleCode))
          .map(({ account }) => [
            account.id,
            { value: account.id, label: account.fullName + ' · ' + account.personnelCode },
          ]),
      );
      if (row && values.recipientId === row.recipient.id && !choices.has(row.recipient.id))
        choices.set(row.recipient.id, {
          value: row.recipient.id,
          label: row.recipient.fullName + ' · Kiểm tra lại điều kiện',
        });
      return [
        ...(!row
          ? [
              {
                name: 'seasonId',
                label: 'Mùa giải',
                options: selectable.map((season) => ({
                  value: season.id,
                  label: seasonLabel(season),
                })),
              },
            ]
          : []),
        {
          name: 'actionCode',
          label: 'Nghiệp vụ',
          options: Object.entries(actionNames).map(([value, label]) => ({ value, label })),
        },
        { name: 'recipientId', label: 'Người nhận', options: [...choices.values()] },
        {
          name: 'startMode',
          label: 'Bắt đầu',
          options: [
            { value: 'IMMEDIATE', label: 'Khi được cấp' },
            { value: 'SCHEDULED', label: 'Theo lịch' },
          ],
        },
        ...(values.startMode === 'SCHEDULED'
          ? [
              {
                name: 'startsAt',
                label: 'Bắt đầu (giờ Việt Nam)',
                type: 'datetime-local' as const,
                required: false,
              },
            ]
          : []),
        {
          name: 'endsAt',
          label: 'Kết thúc (giờ Việt Nam)',
          type: 'datetime-local',
          required: false,
        },
        { ...reasonField, required: false },
      ];
    };
    open({
      title: row ? 'Chỉnh sửa đề xuất' : 'Tạo đề xuất ủy quyền',
      description: 'Bản nháp có thể lưu trước. Thời hạn và lý do là bắt buộc khi gửi đề xuất.',
      path: row ? '/delegation-proposals/' + row.id : '/delegation-proposals',
      method: row ? 'PATCH' : 'POST',
      fields,
      initial: {
        startMode: version?.startMode ?? 'IMMEDIATE',
        actionCode: version?.actionCode ?? '',
        recipientId: row?.recipient.id ?? '',
        startsAt: dateInput(version?.startsAt),
        endsAt: dateInput(version?.endsAt),
        reason: version?.reason ?? '',
        seasonId: row?.season.id ?? selectable[0]?.id ?? '',
      },
      body: (values) => ({
        ...(row ? {} : { seasonId: values.seasonId }),
        actionCode: values.actionCode,
        recipientId: values.recipientId,
        startMode: values.startMode,
        ...(values.startMode === 'SCHEDULED' && { startsAt: toInstant(values.startsAt) }),
        endsAt: toInstant(values.endsAt),
        reason: values.reason || undefined,
      }),
      ...(row && {
        basis: { revision: row.revision, description: describe(row) },
        readBasis: async () => {
          const current = await readProposal(row);
          return { revision: current.revision, description: describe(current) };
        },
      }),
    });
  }
  function revoke(row: Grant) {
    const basis = (item: Grant) => ({
      revision: item.revision,
      description: [
        item.recipient.fullName,
        actionNames[item.actionCode],
        item.season.name,
        grantStateNames[item.state],
        formatVietnamTime(item.startsAt) + ' → ' + formatVietnamTime(item.endsAt),
      ].join(' · '),
    });
    open({
      title: 'Xác nhận thu hồi ủy quyền',
      path: '/delegation-grants/' + row.id + '/revoke',
      critical: true,
      basis: basis(row),
      fields: [reasonField],
      description: 'Quyền sẽ kết thúc và người nhận phải đăng nhập lại.',
      readBasis: async () =>
        basis(
          await readRow<Grant>(
            '/delegation-grants?recipientId=' + row.recipient.id + '&seasonId=' + row.season.id,
            row.id,
          ),
        ),
    });
  }
  /** Offers proposer and administrator actions according to the proposal state and person-separation rules. */
  function proposalActions(row: Proposal) {
    const own =
      row.proposer.id === session?.account.id && session.seasonManagerIds?.includes(row.season.id);
    const state = row.currentVersion.state;
    return (
      <div className={css.actions}>
        {own && ['DRAFT', 'RETURNED'].includes(state) && (
          <button onClick={() => edit(row)}>Chỉnh sửa</button>
        )}
        {own && state === 'DRAFT' && (
          <button onClick={() => process(row, 'submit')}>Gửi đề xuất</button>
        )}
        {own && ['DRAFT', 'RETURNED', 'PENDING'].includes(state) && (
          <button onClick={() => process(row, 'cancel')}>Hủy đề xuất</button>
        )}
        {administrator && state === 'PENDING' && (
          <>
            <button
              className={css.primary}
              disabled={
                row.proposer.id === session?.account.id ||
                row.recipient.id === session?.account.id ||
                row.currentVersion.editors.some(
                  ({ accountId }) => accountId === session?.account.id,
                )
              }
              onClick={() => process(row, 'grant')}
            >
              Cấp ủy quyền
            </button>
            <button onClick={() => process(row, 'return')}>Yêu cầu bổ sung</button>
            <button className={css.danger} onClick={() => process(row, 'reject')}>
              Từ chối đề xuất
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <section className={css.panel} aria-label="Quản lý ủy quyền nghiệp vụ">
      <div className={css.sectionHeader}>
        <div>
          <h1>Quản lý ủy quyền nghiệp vụ</h1>
          <p>Theo dõi, xét duyệt và quản lý các ủy quyền nghiệp vụ theo mùa giải.</p>
        </div>
        {!!metadata?.proposalSeasons.length && (
          <button className={css.primary} onClick={() => edit()}>
            + Tạo đề xuất ủy quyền
          </button>
        )}
      </div>
      {success && (
        <p role="status" className={css.success}>
          Đã lưu thay đổi.
        </p>
      )}
      <div className={css.tabs} role="tablist" aria-label="Loại danh sách ủy quyền">
        {(['proposals', 'grants'] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => {
              setTab(value);
              setSearch('');
              setFilter({ ...filter, state: '', page: 1 });
            }}
          >
            {value === 'proposals' ? 'Đề xuất ủy quyền' : 'Ủy quyền đã cấp'}
          </button>
        ))}
      </div>
      <div className={css.filters}>
        <label className={css.search}>
          <span className={css.srOnly}>Tìm ủy quyền</span>
          <AdminIcon name="search" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setFilter({ ...filter, page: 1 });
            }}
            placeholder={
              tab === 'proposals'
                ? 'Tìm theo người đề xuất hoặc người nhận…'
                : 'Tìm theo người nhận hoặc nghiệp vụ…'
            }
          />
        </label>
        <AdminSelect
          label="Mùa giải"
          value={filter.seasonId}
          onChange={(seasonId) => setFilter({ ...filter, seasonId, page: 1 })}
          options={[
            { value: '', label: 'Tất cả mùa giải' },
            ...(metadata?.seasons ?? []).map((season) => ({
              value: season.id,
              label: seasonLabel(season),
            })),
          ]}
        />
        <AdminSelect
          label="Trạng thái"
          value={filter.state}
          onChange={(state) => setFilter({ ...filter, state, page: 1 })}
          options={[
            { value: '', label: 'Tất cả trạng thái' },
            ...(tab === 'proposals' ? proposalStates : grantStates).map((value) => ({
              value,
              label: (tab === 'grants' ? grantStateNames : stateNames)[value],
            })),
          ]}
        />
        {tab === 'proposals' ? (
          <AdminSelect
            label="Nghiệp vụ"
            value={filter.actionCode}
            onChange={(actionCode) => setFilter({ ...filter, actionCode, page: 1 })}
            options={[
              { value: '', label: 'Tất cả nghiệp vụ' },
              ...Object.entries(actionNames).map(([value, label]) => ({ value, label })),
            ]}
          />
        ) : (
          <AdminSelect
            label="Người nhận"
            value={filter.recipientId}
            onChange={(recipientId) => setFilter({ ...filter, recipientId, page: 1 })}
            options={[
              { value: '', label: 'Tất cả người nhận' },
              ...(grants.data?.recipients ?? []).map(({ id, fullName, personnelCode }) => ({
                value: id,
                label: fullName + ' · ' + personnelCode,
              })),
            ]}
          />
        )}
        <button
          className={css.refresh}
          aria-label="Làm mới danh sách ủy quyền"
          title="Làm mới danh sách ủy quyền"
          onClick={() => {
            setSearch('');
            setFilter({ seasonId: '', state: '', actionCode: '', recipientId: '', page: 1 });
            setDisplay({ ...display, [tab]: displayDefaults[tab] });
            proposals.reload();
            grants.reload();
          }}
        >
          <AdminIcon name="refresh" />
        </button>
      </div>
      <DisplayOptions
        sort={display[tab].sort}
        pageSize={display[tab].pageSize}
        onSort={(sort) => {
          setDisplay({ ...display, [tab]: { ...display[tab], sort } });
          setFilter({ ...filter, page: 1 });
        }}
        onPageSize={(pageSize) => {
          setDisplay({ ...display, [tab]: { ...display[tab], pageSize } });
          setFilter({ ...filter, page: 1 });
        }}
        sorts={
          tab === 'proposals'
            ? [
                { value: 'createdAt:desc', label: 'Mới nhất' },
                { value: 'createdAt:asc', label: 'Cũ nhất' },
              ]
            : [
                { value: 'grantedAt:desc', label: 'Cấp gần nhất' },
                { value: 'grantedAt:asc', label: 'Cấp sớm nhất' },
                { value: 'startsAt:asc', label: 'Bắt đầu sớm nhất' },
                { value: 'endsAt:asc', label: 'Kết thúc sớm nhất' },
              ]
        }
      />
      <ListFeedback
        loading={list.loading}
        error={list.error}
        empty={list.data?.items.length === 0}
        onRetry={list.reload}
      />
      {tab === 'proposals' && !!proposals.data?.items.length && (
        <div className={css.scroll}>
          <table className={css.table}>
            <thead>
              <tr>
                {[
                  'Mã đề xuất',
                  'Người đề xuất → Người nhận',
                  'Nghiệp vụ',
                  'Mùa giải',
                  'Trạng thái',
                  'Thao tác',
                ].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proposals.data.items.map((row) => (
                <tr key={row.id}>
                  <td className={css.code}>
                    {row.id.slice(0, 8).toUpperCase()}
                    <small>Phiên bản {row.currentVersion.versionNumber}</small>
                  </td>
                  <td>
                    <span className={css.person}>
                      <AdminIcon name="user" />
                      {row.proposer.fullName}
                    </span>
                    <small>→ {row.recipient.fullName}</small>
                  </td>
                  <td>{actionNames[row.currentVersion.actionCode]}</td>
                  <td>{row.season.name}</td>
                  <td>
                    <StateBadge state={row.currentVersion.state} />
                  </td>
                  <td>
                    <div className={css.actions}>
                      <button onClick={() => setDetail(row)}>
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
      {tab === 'grants' && !!grants.data?.items.length && (
        <div className={css.scroll}>
          <table className={css.table}>
            <thead>
              <tr>
                {[
                  'Người nhận',
                  'Nghiệp vụ',
                  'Mùa giải',
                  'Bắt đầu',
                  'Kết thúc',
                  'Trạng thái',
                  'Thao tác',
                ].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grants.data.items.map((row) => (
                <tr key={row.id}>
                  <td>
                    {row.recipient.fullName}
                    <small>{row.recipient.personnelCode}</small>
                  </td>
                  <td>{actionNames[row.actionCode]}</td>
                  <td>{row.season.name}</td>
                  <td>{formatVietnamTime(row.startsAt)}</td>
                  <td>{formatVietnamTime(row.endsAt)}</td>
                  <td>
                    <StateBadge state={row.state} grant />
                    {row.reason && <small>{row.reason}</small>}
                  </td>
                  <td>
                    <div className={css.actions}>
                      <button onClick={() => setGrantDetail(row)}>Chi tiết</button>
                      {administrator && ['SCHEDULED', 'ACTIVE'].includes(row.state) && (
                        <button className={css.danger} onClick={() => revoke(row)}>
                          Thu hồi ủy quyền
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
        <Pagination data={list.data} change={(page) => setFilter({ ...filter, page })} />
      )}
      {detail && (
        <AdminDrawer
          onClose={() => setDetail(undefined)}
          title={'Chi tiết đề xuất · ' + detail.id.slice(0, 8).toUpperCase()}
          subtitle="Thẩm quyền phê duyệt và cấp ủy quyền nghiệp vụ"
          icon={<AdminIcon name="delegations" />}
        >
          <div className={css.details}>
            <div className={css.notice}>
              <strong>Thẩm quyền phê duyệt độc lập</strong>
              <p>
                Người đề xuất, người nhận và quản trị viên cấp quyền phải là ba người khác nhau.
                Người đã chỉnh sửa phiên bản đề xuất không được cấp quyền cho phiên bản đó.
              </p>
            </div>
            <dl className={css.detailGrid}>
              <div>
                <dt>Mã đề xuất</dt>
                <dd className={css.code}>{detail.id}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  <StateBadge state={detail.currentVersion.state} />
                </dd>
              </div>
              <div>
                <dt>Người đề xuất</dt>
                <dd>
                  {detail.proposer.fullName}
                  <small> · {detail.proposer.personnelCode}</small>
                </dd>
              </div>
              <div>
                <dt>Người nhận ủy quyền</dt>
                <dd>
                  {detail.recipient.fullName}
                  <small> · {detail.recipient.personnelCode}</small>
                </dd>
              </div>
              <div className={css.fullWidth}>
                <dt>Nghiệp vụ ủy quyền</dt>
                <dd>{actionNames[detail.currentVersion.actionCode]}</dd>
              </div>
              <div>
                <dt>Mùa giải áp dụng</dt>
                <dd>{detail.season.name}</dd>
              </div>
              <div>
                <dt>Thời hạn hiệu lực (UTC+7)</dt>
                <dd>
                  {detail.currentVersion.startMode === 'IMMEDIATE'
                    ? 'Khi được cấp'
                    : formatVietnamTime(detail.currentVersion.startsAt)}{' '}
                  → {formatVietnamTime(detail.currentVersion.endsAt)}
                </dd>
              </div>
              <div className={css.fullWidth}>
                <dt>Lý do / Căn cứ đề xuất</dt>
                <dd>{detail.currentVersion.reason ?? 'Chưa bổ sung'}</dd>
              </div>
              {detail.currentVersion.decisionReason && (
                <div className={css.fullWidth}>
                  <dt>Lý do xử lý</dt>
                  <dd>{detail.currentVersion.decisionReason}</dd>
                </div>
              )}
            </dl>
            {proposalActions(detail)}
            <details>
              <summary>Lịch sử phiên bản ({detail.versions.length})</summary>
              <div className={css.details}>
                {detail.versions.map((version) => (
                  <section key={version.id}>
                    <h3>
                      Phiên bản {version.versionNumber} · <StateBadge state={version.state} />
                    </h3>
                    <p>
                      {version.recipient?.fullName ??
                        (version.id === detail.currentVersion.id
                          ? detail.recipient.fullName
                          : 'Chưa xác định người nhận')}{' '}
                      · {actionNames[version.actionCode]}
                    </p>
                    <p>
                      {version.startMode === 'IMMEDIATE'
                        ? 'Hiệu lực khi được cấp'
                        : formatVietnamTime(version.startsAt)}{' '}
                      → {formatVietnamTime(version.endsAt)}
                    </p>
                    {version.reason && <p>Lý do đề xuất: {version.reason}</p>}
                    {version.decisionReason && <p>Lý do xử lý: {version.decisionReason}</p>}
                  </section>
                ))}
              </div>
            </details>
          </div>
        </AdminDrawer>
      )}
      {grantDetail && (
        <AdminDrawer
          title="Chi tiết ủy quyền đã cấp"
          subtitle="Theo dõi hiệu lực và căn cứ cấp quyền"
          icon={<AdminIcon name="shield" />}
          onClose={() => setGrantDetail(undefined)}
        >
          <div className={css.details}>
            <dl className={css.detailGrid}>
              <div>
                <dt>Người nhận</dt>
                <dd>{grantDetail.recipient.fullName}</dd>
              </div>
              <div>
                <dt>Người đề xuất</dt>
                <dd>{grantDetail.proposer.fullName}</dd>
              </div>
              <div className={css.fullWidth}>
                <dt>Nghiệp vụ</dt>
                <dd>{actionNames[grantDetail.actionCode]}</dd>
              </div>
              <div>
                <dt>Mùa giải</dt>
                <dd>{grantDetail.season.name}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  <StateBadge state={grantDetail.state} grant />
                </dd>
              </div>
              <div>
                <dt>Bắt đầu (UTC+7)</dt>
                <dd>{formatVietnamTime(grantDetail.startsAt)}</dd>
              </div>
              <div>
                <dt>Kết thúc (UTC+7)</dt>
                <dd>{formatVietnamTime(grantDetail.endsAt)}</dd>
              </div>
              <div className={css.fullWidth}>
                <dt>Căn cứ cấp quyền</dt>
                <dd>{grantDetail.basis ?? 'Không có thông tin bổ sung'}</dd>
              </div>
              {grantDetail.reason && (
                <div className={css.fullWidth}>
                  <dt>Lý do kết thúc</dt>
                  <dd>{grantDetail.reason}</dd>
                </div>
              )}
            </dl>
            {administrator && ['SCHEDULED', 'ACTIVE'].includes(grantDetail.state) && (
              <div className={css.actions}>
                <button className={css.danger} onClick={() => revoke(grantDetail)}>
                  Thu hồi ủy quyền
                </button>
              </div>
            )}
          </div>
        </AdminDrawer>
      )}
      {command && (
        <AdminDialog
          command={command}
          onClose={() => setCommand(undefined)}
          onSuccess={() => {
            setCommand(undefined);
            setSuccess(true);
            proposals.reload();
            grants.reload();
          }}
        />
      )}
    </section>
  );
}
