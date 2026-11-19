import { useDialogFeedback } from '../accounts/use-dialog-feedback';
import { WorkspaceDialog as Modal } from '../accounts/WorkspaceDialog';
import { useRef, useState, type FormEvent } from 'react';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { AdminDrawer } from '../accounts/AdminDrawer';
import { AdminIcon } from '../accounts/AdminIcon';
import { DisplayOptions, ListFeedback, Pagination, StateBadge } from '../accounts/AdminLists';
import { AdminSelect } from '../accounts/AdminSelect';
import { useAdminList } from '../accounts/use-admin-list';
import css from '../accounts/Administration.module.css';
import dialogCss from './SeasonCreateForm.module.css';
import { formatSeasonInstant, type SeasonHistoryMeta, type SeasonList } from './season-model';

type LifecycleAction = 'CLOSE' | 'REOPEN';
type Command = 'submit' | 'withdraw' | 'return' | 'reject' | 'approve';
type LifecycleRequest = {
  id: string;
  revision: string;
  versionId: string;
  versionNumber: number;
  state: string;
  action: LifecycleAction;
  preparerName: string;
  editors: string[];
  reason: string | null;
  decisionReason: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  summaryVersionNumber: number | null;
  capabilities: { canEdit: boolean; canSubmit: boolean; canWithdraw: boolean; canReview: boolean };
};
type LifecycleList = {
  items: LifecycleRequest[];
  seasonState: 'OPEN' | 'CLOSED';
  readiness: string | null;
  canPrepare: boolean;
};

const actionNames: Record<LifecycleAction, string> = {
  CLOSE: 'Đóng mùa giải',
  REOPEN: 'Mở lại mùa giải',
};
const stateNames: Record<string, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Chờ phê duyệt',
  RETURNED: 'Đã trả lại',
  WITHDRAWN: 'Đã rút',
  REJECTED: 'Đã từ chối',
  APPROVED: 'Đã phê duyệt',
};
const commandNames: Record<Command, string> = {
  submit: 'Gửi phê duyệt',
  withdraw: 'Rút đề xuất',
  return: 'Trả lại',
  reject: 'Từ chối',
  approve: 'Phê duyệt',
};
const blockers: Record<string, string> = {
  SUMMARY_REQUIRED: 'Cần bản tổng kết đã xác nhận và còn hiệu lực để gửi đề xuất đóng.',
  READINESS_UNAVAILABLE: 'Chưa thể xác minh dữ liệu cần thiết để đóng mùa giải.',
  READINESS_BLOCKED: 'Còn yêu cầu, thay đổi chờ hiệu lực hoặc khoảng thi đấu chưa hoàn tất.',
};
const blockerDetails: Record<string, string> = {
  PENDING_REQUESTS: 'Còn yêu cầu nghiệp vụ chờ xử lý.',
  WAITING_EFFECTS: 'Còn thay đổi đã duyệt chờ hiệu lực.',
  PLAYING_INTERVALS: 'Còn khoảng thi đấu chưa kết thúc tại thời điểm kiểm tra.',
  FUTURE_PLANS: 'Còn kế hoạch đăng ký trong tương lai cần xử lý.',
};

function LifecycleEvidence({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const review = useAdminList<
    {
      readiness: string | null;
      blockers: string[];
      items: Pick<
        LifecycleRequest,
        | 'versionId'
        | 'versionNumber'
        | 'state'
        | 'preparerName'
        | 'editors'
        | 'reason'
        | 'decisionReason'
      >[];
    },
    SeasonHistoryMeta
  >(`/season-lifecycle-requests/${id}?page=${page}`);
  const evidence = review.data;
  const status = evidence?.readiness;
  return (
    <>
      <ListFeedback loading={review.loading} error={review.error} onRetry={review.reload} />
      {status && (
        <div className={css.notice} role="status">
          {status === 'READY'
            ? 'Đã xác minh các điều kiện đóng tại thời điểm kiểm tra.'
            : blockers[status]}
          {!!evidence?.blockers.length && (
            <ul>
              {evidence.blockers.map((item) => (
                <li key={item}>{blockerDetails[item]}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {evidence && (review.meta?.total ?? 0) > 1 && (
        <details>
          <summary>Các phiên bản đề xuất</summary>
          <ol>
            {evidence.items.map((item) => (
              <li key={item.versionId}>
                <strong>
                  Phiên bản {item.versionNumber} · {stateNames[item.state]}
                </strong>
                <p>
                  {item.preparerName} · {item.reason}
                </p>
                {!!item.editors.length && <p>Người đã chỉnh sửa: {item.editors.join(', ')}</p>}
                {item.decisionReason && <p>{item.decisionReason}</p>}
              </li>
            ))}
          </ol>
          {review.meta && review.meta.total > review.meta.pageSize && (
            <Pagination data={{ ...review.meta, items: evidence.items }} change={setPage} />
          )}
        </details>
      )}
    </>
  );
}

export function SeasonLifecycleReview({
  initialSeason,
  prepare,
  onUpdated,
}: {
  initialSeason?: { id: string; name: string };
  prepare: boolean;
  onUpdated: () => void;
}) {
  const [seasonsPage, setSeasonsPage] = useState(1);
  const seasons = useAdminList<SeasonList, SeasonHistoryMeta>(
    `/seasons?sort=name:asc&page=${seasonsPage}`,
  );
  const [season, setSeason] = useState(initialSeason);
  const [openOnLoad, setOpenOnLoad] = useState(prepare);
  const visible = seasons.data?.items ?? [];
  const current = season ?? visible[0];
  const options = [
    ...(current && !visible.some(({ id }) => id === current.id)
      ? [{ value: current.id, label: current.name }]
      : []),
    ...visible.map(({ id, name }) => ({ value: id, label: name })),
  ];
  return (
    <section aria-label="Đề xuất đóng/mở mùa giải">
      <ListFeedback
        loading={seasons.loading}
        error={seasons.error}
        empty={!current}
        onRetry={seasons.reload}
      />
      {current && !seasons.error && (
        <>
          <div className={css.filters}>
            <AdminSelect
              className={css.wideSelect}
              label="Mùa giải của đề xuất"
              hideLabel={false}
              value={current.id}
              options={options}
              onChange={(id) => {
                setOpenOnLoad(false);
                setSeason(visible.find((item) => item.id === id));
              }}
            />
          </div>
          {seasons.meta && seasons.meta.total > seasons.meta.pageSize && (
            <Pagination data={{ ...seasons.meta, items: visible }} change={setSeasonsPage} />
          )}
          <SeasonRequests
            key={current.id}
            season={current}
            openOnLoad={openOnLoad}
            onUpdated={onUpdated}
          />
        </>
      )}
    </section>
  );
}

function SeasonRequests({
  season,
  openOnLoad,
  onUpdated,
}: {
  season: { id: string; name: string };
  openOnLoad: boolean;
  onUpdated: () => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState('20');
  const [action, setAction] = useState('');
  const [state, setState] = useState('');
  const [selectedId, setSelectedId] = useState<string>();
  const [form, setForm] = useState<{ request?: LifecycleRequest; command?: Command } | undefined>(
    openOnLoad ? {} : undefined,
  );
  const [success, setSuccess] = useState('');
  const path = `/seasons/${season.id}/lifecycle-requests`;
  const query = new URLSearchParams({
    page: String(page),
    pageSize,
    ...(action ? { action } : {}),
    ...(state ? { state } : {}),
  });
  const list = useAdminList<LifecycleList, SeasonHistoryMeta>(`${path}?${query}`);
  const items = list.data?.items ?? [];
  const selected = items.find(({ id }) => id === selectedId);
  const data = list.data;
  const readiness = data?.readiness ? blockers[data.readiness] : undefined;
  return (
    <>
      <div className={css.sectionHeader}>
        <div>{data && <StateBadge state={data.seasonState} />}</div>
        {data?.canPrepare && (
          <button type="button" className={css.primary} onClick={() => setForm({})}>
            <AdminIcon name="plus" /> Tạo đề xuất
          </button>
        )}
      </div>
      {readiness && (
        <p role="status" className={css.notice}>
          {readiness}
        </p>
      )}
      {success && (
        <p role="status" className={css.success}>
          {success}
        </p>
      )}
      <div className={css.filters}>
        <AdminSelect
          label="Loại đề xuất"
          value={action}
          options={[
            { value: '', label: 'Tất cả loại đề xuất' },
            ...Object.entries(actionNames).map(([value, label]) => ({ value, label })),
          ]}
          onChange={(value) => {
            setAction(value);
            setPage(1);
            setSelectedId(undefined);
          }}
        />
        <AdminSelect
          label="Trạng thái đề xuất"
          value={state}
          options={[
            { value: '', label: 'Tất cả trạng thái' },
            ...Object.entries(stateNames).map(([value, label]) => ({ value, label })),
          ]}
          onChange={(value) => {
            setState(value);
            setPage(1);
            setSelectedId(undefined);
          }}
        />
      </div>
      <DisplayOptions
        sort="createdAt:desc"
        pageSize={pageSize}
        sorts={[{ value: 'createdAt:desc', label: 'Mới nhất trước' }]}
        onSort={() => setPage(1)}
        onPageSize={(value) => {
          setPageSize(value);
          setPage(1);
          setSelectedId(undefined);
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
                <th scope="col">Mùa giải</th>
                <th scope="col">Loại đề xuất</th>
                <th scope="col">Người đề xuất</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, index) => (
                <tr key={row.id}>
                  <td>{(page - 1) * Number(pageSize) + index + 1}</td>
                  <td>{season.name}</td>
                  <td>{actionNames[row.action]}</td>
                  <td>{row.preparerName}</td>
                  <td>
                    <span className={css.badge} data-state={row.state}>
                      {stateNames[row.state]}
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={() => setSelectedId(row.id)}>
                      <AdminIcon name="eye" /> Chi tiết đề xuất
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {list.meta && list.meta.total > list.meta.pageSize && (
        <Pagination data={{ ...list.meta, items }} change={setPage} />
      )}
      {selected && (
        <AdminDrawer
          title={actionNames[selected.action]}
          subtitle={`${season.name} · Phiên bản ${selected.versionNumber}`}
          icon={<AdminIcon name="season" />}
          onClose={() => setSelectedId(undefined)}
        >
          <div className={css.details}>
            <dl className={css.detailGrid}>
              <div>
                <dt>Trạng thái</dt>
                <dd>{stateNames[selected.state]}</dd>
              </div>
              <div>
                <dt>Người đề xuất</dt>
                <dd>{selected.preparerName}</dd>
              </div>
              <div>
                <dt>Người đã chỉnh sửa</dt>
                <dd>{selected.editors.join(', ') || '—'}</dd>
              </div>
              <div>
                <dt>Đã gửi</dt>
                <dd>{formatSeasonInstant(selected.submittedAt)}</dd>
              </div>
              <div className={css.fullWidth}>
                <dt>Lý do đề xuất</dt>
                <dd>{selected.reason}</dd>
              </div>
              {selected.summaryVersionNumber !== null && (
                <div>
                  <dt>Bản tổng kết đã xác nhận</dt>
                  <dd>Phiên bản {selected.summaryVersionNumber}</dd>
                </div>
              )}
              {selected.decidedAt && (
                <div>
                  <dt>Thời điểm xử lý</dt>
                  <dd>{formatSeasonInstant(selected.decidedAt)}</dd>
                </div>
              )}
              {selected.decisionReason && (
                <div className={css.fullWidth}>
                  <dt>Lý do xử lý</dt>
                  <dd>{selected.decisionReason}</dd>
                </div>
              )}
            </dl>
            <LifecycleEvidence id={selected.id} key={selected.revision} />
            <div className={css.actions}>
              {selected.capabilities.canEdit && (
                <button type="button" onClick={() => setForm({ request: selected })}>
                  Sửa bản nháp
                </button>
              )}
              {selected.capabilities.canSubmit && (
                <button
                  type="button"
                  onClick={() => setForm({ request: selected, command: 'submit' })}
                >
                  Gửi phê duyệt
                </button>
              )}
              {selected.capabilities.canWithdraw && (
                <button
                  type="button"
                  onClick={() => setForm({ request: selected, command: 'withdraw' })}
                >
                  Rút đề xuất
                </button>
              )}
              {selected.capabilities.canReview &&
                (['return', 'reject', 'approve'] as const).map((command) => (
                  <button
                    key={command}
                    type="button"
                    className={command === 'approve' ? css.primary : undefined}
                    onClick={() => setForm({ request: selected, command })}
                  >
                    {commandNames[command]}
                  </button>
                ))}
            </div>
          </div>
        </AdminDrawer>
      )}
      {form && data && (form.request || data.canPrepare) && (
        <LifecycleForm
          {...form}
          path={path}
          onRecover={() => {
            setForm(undefined);
            setSelectedId(undefined);
            list.reload();
            onUpdated();
          }}
          action={data.seasonState === 'OPEN' ? 'CLOSE' : 'REOPEN'}
          onClose={() => setForm(undefined)}
          onSaved={(message) => {
            setSuccess(message);
            setForm(undefined);
            setSelectedId(undefined);
            list.reload();
            onUpdated();
          }}
        />
      )}
    </>
  );
}

function LifecycleForm({
  request,
  command,
  action,
  path,
  onClose,
  onSaved,
  onRecover,
}: {
  request?: LifecycleRequest;
  command?: Command;
  action: LifecycleAction;
  path: string;
  onClose: () => void;
  onSaved: (message: string) => void;
  onRecover: () => void;
}) {
  const { client } = useSession();
  const [reason, setReason] = useState(command ? '' : (request?.reason ?? ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const idempotencyKey = useRef<string | undefined>(undefined);
  const formFeedback = useDialogFeedback(error);
  const title = command
    ? commandNames[command]
    : request
      ? 'Sửa bản nháp đề xuất'
      : `Tạo đề xuất ${actionNames[action].toLowerCase()}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !reason.trim() || (uncertain && command !== 'approve')) return;
    setBusy(true);
    setError('');
    try {
      if (request && command) {
        if (command === 'approve') idempotencyKey.current ??= crypto.randomUUID();
        await client.request(`/season-lifecycle-requests/${request.id}/${command}`, {
          method: 'POST',
          requestKey: idempotencyKey.current,
          body: {
            expectedRevision: request.revision,
            submittedVersionId: request.versionId,
            reason,
          },
        });
      } else {
        await client.request(request ? `/season-lifecycle-requests/${request.id}/draft` : path, {
          method: request ? 'PATCH' : 'POST',
          body: { action, reason, ...(request ? { expectedRevision: request.revision } : {}) },
        });
      }
      onSaved(command ? 'Đã ghi nhận thao tác.' : 'Đã lưu bản nháp đề xuất.');
    } catch (failure) {
      const unknownOutcome = failure instanceof HttpFailure && failure.unknownOutcome;
      setUncertain((previous) => previous || unknownOutcome);
      setError(
        unknownOutcome && command !== 'approve'
          ? 'Hãy tải lại danh sách để kiểm tra kết quả trước khi gửi yêu cầu mới.'
          : failure instanceof Error
            ? failure.message
            : 'Không thể ghi nhận đề xuất.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      title={title}
      className={dialogCss.dialog}
      footer={null}
      onCancel={busy ? undefined : onClose}
      closable={!busy}
      keyboard={!busy}
      mask={{ closable: !busy }}
    >
      <form
        ref={formFeedback}
        className={css.form}
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        {request && (
          <p>
            {actionNames[request.action]}
            {` · Phiên bản ${request.versionNumber}`}
          </p>
        )}
        <label>
          {command ? 'Lý do xử lý' : 'Lý do đề xuất'}
          <textarea
            required
            value={reason}
            readOnly={busy || uncertain}
            onChange={(event) => {
              setReason(event.target.value);
              idempotencyKey.current = undefined;
            }}
          />
        </label>
        {error && (
          <p role="alert" className={css.error}>
            {error}
          </p>
        )}
        <div className={css.actions}>
          {uncertain && (
            <button type="button" disabled={busy} onClick={onRecover}>
              Tải lại danh sách để kiểm tra
            </button>
          )}
          <button type="button" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            type="submit"
            className={css.primary}
            disabled={busy || !reason.trim() || (uncertain && command !== 'approve')}
          >
            {busy
              ? 'Đang ghi nhận…'
              : uncertain
                ? 'Thử lại yêu cầu'
                : command
                  ? 'Xác nhận'
                  : 'Lưu bản nháp'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
