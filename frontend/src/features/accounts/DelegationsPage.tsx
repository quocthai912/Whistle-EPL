import { useState } from 'react';
import { Drawer } from 'antd';
import { useSession } from '../../shared/http/use-session';
import { AdminDialog, type AdminCommand, type Field } from './AdminDialog';
import { ListFeedback, Pagination, StateBadge } from './AdminLists';
import {
  actionNames,
  formatVietnamTime,
  stateNames,
  type Grant,
  type List,
  type Proposal,
  type ProposalList,
} from './administration-model';
import { useAdminList } from './use-admin-list';
import css from './Administration.module.css';

const proposalStates = ['DRAFT', 'PENDING', 'RETURNED', 'REJECTED', 'CANCELLED', 'GRANTED'];
const grantStates = ['SCHEDULED', 'ACTIVE', 'EXPIRED', 'REVOKED', 'TERMINATED'];
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
const dateInput = (value: string | null | undefined) =>
  value ? new Date(new Date(value).getTime() + 7 * 3600000).toISOString().slice(0, 16) : '';
const toInstant = (value: string | undefined) =>
  value ? new Date(value + '+07:00').toISOString() : undefined;
const reasonField: Field = { name: 'reason', label: 'Lý do', type: 'textarea' };
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

export function DelegationsPage() {
  const { session, client } = useSession();
  const administrator = session?.systemAdministrator ?? false;
  const [tab, setTab] = useState<'proposals' | 'grants'>('proposals');
  const [filter, setFilter] = useState({ seasonId: '', state: '', page: 1 });
  const [command, setCommand] = useState<AdminCommand>();
  const [detail, setDetail] = useState<Proposal>();
  const [success, setSuccess] = useState(false);
  const query = new URLSearchParams({ page: String(filter.page) });
  if (filter.seasonId) query.set('seasonId', filter.seasonId);
  if (filter.state) query.set('state', filter.state);
  const proposals = useAdminList<ProposalList>(
    '/delegation-proposals?' + (tab === 'proposals' ? query : 'page=1'),
  );
  const grants = useAdminList<List<Grant>>(
    '/delegation-grants?' + (tab === 'grants' ? query : 'page=1'),
  );
  const list = tab === 'proposals' ? proposals : grants;
  const metadata = proposals.data;

  function open(action: AdminCommand) {
    setSuccess(false);
    setDetail(undefined);
    setCommand(action);
  }

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
  function edit(row?: Proposal) {
    if (!metadata) return;
    const version = row?.currentVersion;
    const selectable = metadata.proposalSeasons;
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
                options: selectable.map(({ id, name }) => ({ value: id, label: name })),
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
        stateNames[item.state],
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
  function proposalActions(row: Proposal) {
    const own =
      row.proposer.id === session?.account.id && session.seasonManagerIds?.includes(row.season.id);
    const state = row.currentVersion.state;
    return (
      <div className={css.actions}>
        <button onClick={() => setDetail(row)}>Chi tiết</button>
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
            <button onClick={() => process(row, 'reject')}>Từ chối đề xuất</button>
          </>
        )}
      </div>
    );
  }

  return (
    <section className={css.panel} aria-label="Quản lý ủy quyền nghiệp vụ">
      <div className={css.sectionHeader}>
        <div>
          <h2>Ủy quyền theo mùa giải</h2>
          <p>Theo dõi đề xuất và thời hạn của từng quyền nghiệp vụ.</p>
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
              setFilter({ ...filter, state: '', page: 1 });
            }}
          >
            {value === 'proposals' ? 'Đề xuất ủy quyền' : 'Ủy quyền đã cấp'}
          </button>
        ))}
      </div>
      <div className={css.filters}>
        <label>
          Mùa giải
          <select
            value={filter.seasonId}
            onChange={(event) => setFilter({ ...filter, seasonId: event.target.value, page: 1 })}
          >
            <option value="">Tất cả mùa giải</option>
            {metadata?.seasons.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Trạng thái
          <select
            value={filter.state}
            onChange={(event) => setFilter({ ...filter, state: event.target.value, page: 1 })}
          >
            <option value="">Tất cả trạng thái</option>
            {(tab === 'proposals' ? proposalStates : grantStates).map((state) => (
              <option key={state} value={state}>
                {stateNames[state]}
              </option>
            ))}
          </select>
        </label>
      </div>
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
                  <td>
                    {row.id.slice(0, 8).toUpperCase()}
                    <small>Phiên bản {row.currentVersion.versionNumber}</small>
                  </td>
                  <td>
                    {row.proposer.fullName} → {row.recipient.fullName}
                  </td>
                  <td>{actionNames[row.currentVersion.actionCode]}</td>
                  <td>{row.season.name}</td>
                  <td>
                    <StateBadge state={row.currentVersion.state} />
                  </td>
                  <td>{proposalActions(row)}</td>
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
                    <StateBadge state={row.state} />
                    {row.reason && <small>{row.reason}</small>}
                  </td>
                  <td>
                    {administrator && ['SCHEDULED', 'ACTIVE'].includes(row.state) && (
                      <button onClick={() => revoke(row)}>Thu hồi ủy quyền</button>
                    )}
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
        <Drawer
          open
          onClose={() => setDetail(undefined)}
          size="large"
          title={'Chi tiết đề xuất · ' + detail.id.slice(0, 8).toUpperCase()}
        >
          <div className={css.details}>
            <p>{describe(detail)}</p>
            <h3>Lịch sử phiên bản</h3>
            {detail.versions.map((version) => (
              <section key={version.id}>
                <h3>
                  Phiên bản {version.versionNumber} · <StateBadge state={version.state} />
                </h3>
                <p>
                  {version.recipient?.fullName ?? detail.recipient.fullName} ·{' '}
                  {actionNames[version.actionCode]}
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
            {proposalActions(detail)}
          </div>
        </Drawer>
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
