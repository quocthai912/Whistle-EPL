import { AdminSelect } from '../accounts/AdminSelect';
import { WorkspaceDialog as Modal } from '../accounts/WorkspaceDialog';
import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from '../../shared/http/use-session';
import { HttpFailure } from '../../shared/http/client';
import { formatSeasonInstant } from '../seasons/season-model';
import { RegulationActionPreview } from './RegulationReview';
import { useRegulationReviewContent } from './use-regulation-review-content';
import {
  regulationStateLabels,
  type RegulationState,
  type RegulationVersionSummary,
} from './regulation-model';
import css from './RegulationVersionsPage.module.css';

type Change = {
  id: string;
  versionId: string;
  revision: string;
  action: 'CANCEL' | 'REPLACE';
  state: RegulationState | 'APPROVED';
  waitingVersionId: string;
  replacementVersionId: string | null;
  currentBasisVersionId: string | null;
  cutoff: string | null;
  reason: string;
  decisionReason: string | null;
  capabilities: { canSubmit: boolean; canApprove: boolean };
};

type Review = { change: Change; action: 'submit' | 'approve'; key: string };
const actionLabel = { CANCEL: 'Hủy hiệu lực theo lịch', REPLACE: 'Thay thế quy định chờ hiệu lực' };

export function RegulationChangeReview({
  seasonId,
  waitingId,
  canManage,
  versions,
  onChanged,
}: {
  seasonId: string;
  waitingId?: string;
  canManage: boolean;
  versions: RegulationVersionSummary[];
  onChanged: () => void;
}) {
  const { client, epoch } = useSession();
  const [items, setItems] = useState<Change[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [creating, setCreating] = useState<{
    action: 'CANCEL' | 'REPLACE';
    waitingVersionId: string;
  }>();
  const [replacement, setReplacement] = useState('');
  const [review, setReview] = useState<Review>();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [unknown, setUnknown] = useState(false);
  const [conflict, setConflict] = useState(false);
  const collection = `/seasons/${encodeURIComponent(seasonId)}/regulation-change-requests`;
  const replacementId =
    review?.change.replacementVersionId ?? (creating?.action === 'REPLACE' ? replacement : null);
  const replacementContent = useRegulationReviewContent(replacementId);

  useEffect(() => {
    let active = true;
    void client
      .request<{ items: Change[] }>(collection)
      .then(({ data }) => {
        if (active) setItems(data.items);
      })
      .catch((failure: unknown) => {
        if (active && waitingId)
          setError(failure instanceof Error ? failure.message : 'Không thể tải đề nghị.');
      });
    return () => {
      active = false;
    };
  }, [client, collection, attempt, epoch, waitingId]);

  function close() {
    setCreating(undefined);
    setReview(undefined);
    setError(undefined);
    setReason('');
    setReplacement('');
    setUnknown(false);
    setConflict(false);
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = reason.normalize('NFC').trim();
    if (
      !normalized ||
      Array.from(normalized).length > 2000 ||
      busy ||
      conflict ||
      (creating?.action === 'REPLACE' && !replacement) ||
      (replacementId && !replacementContent?.detail && !unknown)
    )
      return;
    setBusy(true);
    setError(undefined);
    try {
      if (creating) {
        await client.request(collection, {
          method: 'POST',
          body: {
            action: creating.action,
            waitingVersionId: creating.waitingVersionId,
            reason: normalized,
            ...(creating.action === 'REPLACE' ? { replacementVersionId: replacement } : {}),
          },
        });
      } else if (review) {
        const { change, action, key } = review;
        await client.request(
          `/regulation-change-requests/${encodeURIComponent(change.id)}/${action}`,
          {
            method: 'POST',
            requestKey: action === 'approve' ? key : undefined,
            body: {
              expectedRevision: change.revision,
              submittedVersionId: change.versionId,
              reason: normalized,
              ...(action === 'approve' && change.action === 'REPLACE'
                ? { expectedCurrentVersionId: change.currentBasisVersionId }
                : {}),
            },
          },
        );
      }
      close();
      setAttempt((value) => value + 1);
      onChanged();
    } catch (failure) {
      const uncertain =
        review?.action === 'approve' && failure instanceof HttpFailure && failure.unknownOutcome;
      setUnknown(uncertain);
      setConflict(failure instanceof HttpFailure && failure.status === 409);
      setError(
        uncertain
          ? 'Chưa rõ kết quả. Gửi lại đúng nội dung đã xác nhận để kiểm tra.'
          : failure instanceof Error
            ? failure.message
            : 'Không thể ghi nhận đề nghị.',
      );
    } finally {
      setBusy(false);
    }
  }

  const candidates = versions.filter((item) => item.state === 'SUBMITTED');
  const title = creating
    ? actionLabel[creating.action]
    : review?.action === 'approve'
      ? 'Xác nhận phê duyệt đề nghị'
      : 'Xác nhận gửi đề nghị';
  if (!waitingId && items.length === 0) return null;
  return (
    <section
      className={`${css.versionPanel} ${css.changePanel}`}
      aria-label="Đề nghị thay đổi quy định"
    >
      <div className={css.panelHeading}>
        <h2>Đề nghị thay đổi quy định</h2>
      </div>
      {waitingId && canManage && (
        <div className={css.workflowActions}>
          <button
            type="button"
            onClick={() => {
              close();
              setCreating({ action: 'CANCEL', waitingVersionId: waitingId });
            }}
          >
            Đề nghị hủy
          </button>
          {candidates.length > 0 && (
            <button
              type="button"
              onClick={() => {
                close();
                setCreating({ action: 'REPLACE', waitingVersionId: waitingId });
              }}
            >
              Đề nghị thay thế
            </button>
          )}
        </div>
      )}
      {error && !creating && !review && <p role="alert">{error}</p>}
      {items.map((change) => (
        <article key={change.id}>
          <h3>{actionLabel[change.action]}</h3>
          <p>
            {change.state === 'APPROVED' ? 'Đã phê duyệt' : regulationStateLabels[change.state]} ·{' '}
            {change.reason}
          </p>
          {change.decisionReason && <p>{change.decisionReason}</p>}
          <div className={css.workflowActions}>
            {change.capabilities.canSubmit && (
              <button
                type="button"
                onClick={() => {
                  close();
                  setReview({ change, action: 'submit', key: crypto.randomUUID() });
                }}
              >
                Gửi đề nghị
              </button>
            )}
            {change.capabilities.canApprove && (
              <button
                type="button"
                onClick={() => {
                  close();
                  setReview({ change, action: 'approve', key: crypto.randomUUID() });
                }}
              >
                Phê duyệt đề nghị
              </button>
            )}
          </div>
        </article>
      ))}
      <Modal
        open={Boolean(creating || review)}
        title={title}
        footer={null}
        onCancel={busy || unknown ? undefined : close}
        closable={!busy && !unknown}
        keyboard={!busy && !unknown}
        mask={{ closable: false }}
      >
        <form onSubmit={(event) => void confirm(event)}>
          <dl>
            <dt>Phiên bản chờ</dt>
            <dd>{review?.change.waitingVersionId ?? creating?.waitingVersionId}</dd>
            {review?.change.replacementVersionId && (
              <>
                <dt>Phiên bản thay thế</dt>
                <dd>{review.change.replacementVersionId}</dd>
              </>
            )}
            {review?.change.cutoff && (
              <>
                <dt>Thời điểm hiệu lực đã duyệt</dt>
                <dd>{formatSeasonInstant(review.change.cutoff)}</dd>
              </>
            )}
            {review?.change.replacementVersionId && (
              <>
                <dt>Phiên bản đang hiệu lực được đối chiếu</dt>
                <dd>{review.change.currentBasisVersionId ?? 'Chưa có'}</dd>
              </>
            )}
            {review && (
              <>
                <dt>Phiên bản đề nghị</dt>
                <dd>
                  {review.change.versionId} · {review.change.revision}
                </dd>
                <dt>Lý do đề nghị</dt>
                <dd>{review.change.reason}</dd>
              </>
            )}
          </dl>
          {creating?.action === 'REPLACE' && (
            <AdminSelect
              hideLabel={false}
              label="Phiên bản thay thế"
              required
              value={replacement}
              onChange={(value) => setReplacement(value)}
              disabled={busy}

              options={[
                { value: '', label: 'Chọn phiên bản đã gửi' },
                ...candidates.map((item) => ({
                  value: item.id,
                  label: 'Phiên bản ' + item.versionNumber + ' · ' + item.id,
                })),
              ]}
            />
          )}
          {replacementId &&
            (replacementContent?.detail ? (
              <RegulationActionPreview
                content={replacementContent.detail.content}
                heading="Nội dung phiên bản thay thế đã gửi"
              />
            ) : replacementContent?.error ? (
              <p role="alert">{replacementContent.error}</p>
            ) : (
              <p role="status">Đang tải nội dung phiên bản thay thế…</p>
            ))}
          <label>
            Lý do
            <textarea
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={busy || unknown}
              maxLength={2000}
            />
          </label>
          {error && (
            <p role="alert" className={css.formError}>
              {error}
            </p>
          )}
          <div className={css.workflowActions}>
            <button type="button" onClick={close} disabled={busy || unknown}>
              Hủy
            </button>
            {conflict && (
              <button
                type="button"
                onClick={() => {
                  close();
                  setAttempt((value) => value + 1);
                  onChanged();
                }}
              >
                Tải lại đề nghị
              </button>
            )}
            <button
              type="submit"
              className={css.primary}
              disabled={
                busy ||
                conflict ||
                !reason.trim() ||
                (creating?.action === 'REPLACE' && !replacement) ||
                Boolean(replacementId && !replacementContent?.detail && !unknown)
              }
            >
              {unknown ? 'Kiểm tra kết quả phê duyệt' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
