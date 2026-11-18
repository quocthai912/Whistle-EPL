import { Modal } from 'antd';
import { useState, type FormEvent } from 'react';
import { HttpFailure, type MasterNameCandidate } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { ListFeedback, Pagination } from '../accounts/AdminLists';
import { AdminSelect } from '../accounts/AdminSelect';
import { useAdminList } from '../accounts/use-admin-list';
import css from '../accounts/Administration.module.css';
import dialogCss from '../seasons/SeasonCreateForm.module.css';
import {
  formatSeasonInstant,
  type SeasonHistory,
  type SeasonHistoryMeta,
  type SeasonList,
} from '../seasons/season-model';
import { actions } from '../audit/audit-filters';
import reviewCss from './MasterForms.module.css';

type Master = 'clubs' | 'stadiums';
type Impact = {
  status: 'KNOWN' | 'VERIFIED_NOT_INTRODUCED' | 'UNAVAILABLE';
  affected: { id: string; kind: 'REGISTRATION' | 'SCHEDULE' | 'RESULT' }[] | null;
};

function CorrectionImpact({ master, id }: { master: Master; id: string }) {
  const { session } = useSession();
  const [seasonId, setSeasonId] = useState('');
  const [page, setPage] = useState(1);
  const seasons = useAdminList<SeasonList, SeasonHistoryMeta>(`/seasons?page=${page}`);
  const role = master === 'clubs' ? 'SEASON_MANAGER' : 'SCHEDULING_OFFICER';
  const items = seasons.data?.items ?? [];
  const eligible = items.filter(
    (season) =>
      session?.seasonRoles?.some(
        (assignment) => assignment.seasonId === season.id && assignment.roleCode === role,
      ) ||
      (role === 'SEASON_MANAGER' && session?.seasonManagerIds?.includes(season.id)),
  );
  const selected = eligible.find((season) => season.id === seasonId) ?? eligible[0];
  return (
    <section className={reviewCss.review} aria-label="Nghiệp vụ cần rà soát">
      <strong>Nghiệp vụ cần rà soát</strong>
      <ListFeedback
        loading={seasons.loading}
        error={seasons.error}
        empty={eligible.length === 0}
        onRetry={seasons.reload}
      />
      {selected && (
        <>
          <AdminSelect
            label="Mùa giải cần rà soát"
            hideLabel={false}
            value={selected.id}
            options={eligible.map((season) => ({ value: season.id, label: season.name }))}
            onChange={setSeasonId}
          />
          <CorrectionImpactResults
            path={`/${master}/${id}/correction-impact?seasonId=${selected.id}`}
          />
        </>
      )}
      {seasons.meta && seasons.meta.total > seasons.meta.pageSize && (
        <Pagination data={{ ...seasons.meta, items }} change={setPage} />
      )}
    </section>
  );
}

function CorrectionImpactResults({ path }: { path: string }) {
  const result = useAdminList<Impact>(path);
  const labels = { REGISTRATION: 'Hồ sơ đăng ký', SCHEDULE: 'Lịch thi đấu', RESULT: 'Kết quả' };
  return (
    <>
      <ListFeedback loading={result.loading} error={result.error} onRetry={result.reload} />
      {result.data?.status === 'UNAVAILABLE' && <p>Chưa thể xác minh nghiệp vụ liên quan.</p>}
      {result.data?.status === 'VERIFIED_NOT_INTRODUCED' && (
        <p>Nguồn dữ liệu nghiệp vụ liên quan chưa được triển khai.</p>
      )}
      {result.data?.status === 'KNOWN' &&
        (result.data.affected?.length ? (
          <ul>
            {result.data.affected.map((record) => (
              <li key={record.id}>
                {labels[record.kind]} · {record.id}
              </li>
            ))}
          </ul>
        ) : (
          <p>Không phát hiện hồ sơ cần rà soát trong mùa giải này.</p>
        ))}
    </>
  );
}
function historyValue(field: string, value: unknown): string {
  if (typeof value !== 'string') return '—';
  return ['effectiveAt', 'discontinuedAt'].includes(field) ? formatSeasonInstant(value) : value;
}

const historyLabels: Record<string, string> = {
  code: 'Mã hồ sơ',
  name: 'Tên',
  abbreviation: 'Tên viết tắt',
  location: 'Địa điểm',
  correctionBasis: 'Căn cứ hiệu chỉnh',
  discontinuedAt: 'Thời điểm ngừng sử dụng',
  effectiveAt: 'Thời điểm ghi nhận',
};
export function MasterHistory({ master, id }: { master: Master; id: string }) {
  const [page, setPage] = useState(1);
  const list = useAdminList<SeasonHistory, SeasonHistoryMeta>(
    `/${master}/${id}/history?page=${page}`,
  );
  const items = list.data?.items ?? [];
  return (
    <div className={reviewCss.history}>
      <ListFeedback
        loading={list.loading}
        error={list.error}
        empty={!items.length}
        onRetry={list.reload}
      />
      {items.map((item) => (
        <article key={item.id}>
          <strong>{actions[item.actionCode] ?? 'Cập nhật hồ sơ'}</strong>
          <p>
            {item.actorName ?? 'Hệ thống'} · {formatSeasonInstant(item.occurredAt)}
          </p>
          {item.reason && <p>{item.reason}</p>}
          <dl className={css.detailGrid}>
            {Object.entries(historyLabels).map(
              ([field, label]) =>
                item.after &&
                Object.hasOwn(item.after, field) && (
                  <div key={field}>
                    <dt>{label}</dt>
                    <dd>
                      {typeof item.before?.[field] === 'string' && (
                        <>
                          <del>{historyValue(field, item.before[field])}</del>
                          <br />
                        </>
                      )}
                      {historyValue(field, item.after[field])}
                    </dd>
                  </div>
                ),
            )}
          </dl>
        </article>
      ))}
      {list.meta && <Pagination data={{ ...list.meta, items }} change={setPage} />}
    </div>
  );
}

export function MasterForm({
  master,
  detail,
  correcting,
  onClose,
  onSaved,
}: {
  master: Master;
  detail?: { id: string; revision: string; code: string; name: string } & (
    { abbreviation: string; location?: never } | { location: string | null; abbreviation?: never }
  );
  correcting?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { client } = useSession();
  const club = master === 'clubs';
  const noun = club ? 'câu lạc bộ' : 'sân vận động';
  const root = '/' + master;
  const [code, setCode] = useState(detail?.code ?? '');
  const [name, setName] = useState(detail?.name ?? '');
  const originalSecondaryValue = club ? detail?.abbreviation : detail?.location;
  const [secondaryValue, setSecondaryValue] = useState(originalSecondaryValue ?? '');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionBasis, setCorrectionBasis] = useState('');
  const [duplicateReason, setDuplicateReason] = useState('');
  const [candidates, setCandidates] = useState<readonly MasterNameCandidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const title = correcting
    ? `Hiệu chỉnh thông tin ${noun}`
    : detail
      ? `Chỉnh sửa ${noun}`
      : `Thêm ${noun}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await client.request(detail ? `${root}/${detail.id}` : root, {
        method: detail ? 'PATCH' : 'POST',
        body: {
          ...(detail ? { expectedRevision: detail.revision } : { code }),
          name,
          ...(club ? { abbreviation: secondaryValue } : { location: secondaryValue || null }),
          ...(correcting ? { correctionReason, correctionBasis } : {}),
          ...(candidates.length
            ? {
                duplicateReview: {
                  acknowledged: true,
                  reason: duplicateReason,
                  candidateIds: candidates.map(({ id }) => id),
                },
              }
            : {}),
        },
      });
      onSaved();
    } catch (failure) {
      if (failure instanceof HttpFailure && failure.candidates) {
        setCandidates(failure.candidates);
        setDuplicateReason('');
      }
      setError(failure instanceof Error ? failure.message : 'Không thể lưu hồ sơ.');
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
      mask={{ closable: !busy }}
      keyboard={!busy}
    >
      <form
        className={`${css.form} ${reviewCss.form}`}
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <label>
          {club ? 'Mã CLB' : 'Mã sân'}{' '}
          <input
            required
            readOnly={!!detail}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </label>
        <label>
          Tên {noun}{' '}
          <input
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setCandidates([]);
              setDuplicateReason('');
            }}
          />
        </label>
        <label>
          {club ? 'Tên viết tắt' : 'Địa điểm'}{' '}
          <input
            required={club}
            value={secondaryValue}
            onChange={(event) => setSecondaryValue(event.target.value)}
          />
        </label>
        {correcting && (
          <>
            <label>
              Lý do hiệu chỉnh{' '}
              <textarea
                required
                value={correctionReason}
                onChange={(event) => setCorrectionReason(event.target.value)}
              />
            </label>
            <label>
              Căn cứ hiệu chỉnh{' '}
              <textarea
                required
                value={correctionBasis}
                onChange={(event) => setCorrectionBasis(event.target.value)}
              />
            </label>
          </>
        )}
        {correcting && detail && (
          <>
            <section className={reviewCss.review} aria-label="Đối chiếu thông tin hiệu chỉnh">
              <strong>Đối chiếu thông tin hiệu chỉnh</strong>
              <dl className={css.detailGrid}>
                <div>
                  <dt>Tên hiện tại</dt>
                  <dd>{detail.name}</dd>
                </div>
                <div>
                  <dt>Tên sau hiệu chỉnh</dt>
                  <dd>{name || '—'}</dd>
                </div>
                <div>
                  <dt>{club ? 'Tên viết tắt hiện tại' : 'Địa điểm hiện tại'}</dt>
                  <dd>{originalSecondaryValue || '—'}</dd>
                </div>
                <div>
                  <dt>{club ? 'Tên viết tắt sau hiệu chỉnh' : 'Địa điểm sau hiệu chỉnh'}</dt>
                  <dd>{secondaryValue || '—'}</dd>
                </div>
              </dl>
            </section>
            <CorrectionImpact master={master} id={detail.id} />
          </>
        )}
        {!!candidates.length && (
          <div className={reviewCss.review}>
            <strong>Đã có hồ sơ trùng tên</strong>
            <ul>
              {candidates.map((item) => (
                <li key={item.id}>
                  {item.name} · {item.code}
                </li>
              ))}
            </ul>
            <label>
              Lý do xác nhận đây là {noun} khác
              <textarea
                required
                value={duplicateReason}
                onChange={(event) => setDuplicateReason(event.target.value)}
              />
            </label>
          </div>
        )}
        {error && (
          <p className={css.error} role="alert">
            {error}
          </p>
        )}
        <div className={css.actions}>
          <button type="button" onClick={onClose} disabled={busy}>
            Hủy
          </button>
          <button type="submit" className={css.primary} disabled={busy}>
            {busy ? 'Đang lưu…' : candidates.length ? 'Xác nhận lưu hồ sơ riêng' : 'Lưu hồ sơ'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
