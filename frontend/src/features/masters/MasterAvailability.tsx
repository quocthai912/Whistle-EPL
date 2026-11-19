import { WorkspaceDialog as Modal } from '../accounts/WorkspaceDialog';
import { useState, type FormEvent } from 'react';
import { useSession } from '../../shared/http/use-session';
import css from '../accounts/Administration.module.css';
import dialogCss from '../seasons/SeasonCreateForm.module.css';

export function MasterAvailability({
  master,
  id,
  revision,
  discontinued,
  onChange,
}: {
  master: 'clubs' | 'stadiums';
  id: string;
  revision: string;
  discontinued: boolean;
  onChange: () => void;
}) {
  const { client } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const action = discontinued ? 'resume' : 'discontinue';
  const title = discontinued ? 'Sử dụng lại hồ sơ' : 'Ngừng sử dụng hồ sơ';

  function close() {
    setOpen(false);
    setReason('');
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !reason.trim()) return;
    setError('');
    setBusy(true);
    try {
      await client.request(`/${master}/${id}/${action}`, {
        method: 'POST',
        body: { expectedRevision: revision, reason },
      });
      close();
      onChange();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể cập nhật trạng thái.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {title}
      </button>
      {open && (
        <Modal
          open
          title={title}
          className={dialogCss.dialog}
          footer={null}
          onCancel={busy ? undefined : close}
          closable={!busy}
          keyboard={!busy}
          mask={{ closable: !busy }}
        >
          <form
            className={css.form}
            onSubmit={(event) => {
              void submit(event);
            }}
          >
            <p>
              {discontinued
                ? 'Hồ sơ có thể được chọn cho nghiệp vụ mới sau khi xác nhận.'
                : 'Hồ sơ sẽ không còn được chọn cho nghiệp vụ mới. Các tham chiếu đã duyệt được giữ nguyên.'}
            </p>
            <label>
              Lý do
              <textarea
                required
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            {error && (
              <p role="alert" className={css.error}>
                {error}
              </p>
            )}
            <div className={css.actions}>
              <button type="button" disabled={busy} onClick={close}>
                Hủy
              </button>
              <button type="submit" className={css.primary} disabled={busy || !reason.trim()}>
                {busy ? 'Đang ghi nhận…' : 'Xác nhận'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
