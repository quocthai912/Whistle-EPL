import { useEffect, useState } from 'react';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { AdminIcon } from '../accounts/AdminIcon';
import shared from '../accounts/Administration.module.css';
import { LogoFileField } from '../clubs/LogoFileField';
import clubCss from '../clubs/ClubsPage.module.css';

export type PortraitReference = { id: string; url: string; width: number; height: number };

export function PlayerPortrait({
  name,
  portrait,
  small = false,
}: {
  name: string;
  portrait: PortraitReference | null;
  small?: boolean;
}) {
  const { client, epoch } = useSession();
  const expectedUrl =
    portrait && portrait.url === `/api/v1/media/${portrait.id}` ? portrait.url : undefined;
  const [image, setImage] = useState<{ source: string; blob: string; epoch: number }>();
  const active =
    image && image.source === expectedUrl && image.epoch === epoch ? image.blob : undefined;

  useEffect(() => {
    if (!expectedUrl) return;
    let disposed = false;
    let blob: string | undefined;
    void client
      .requestFile(expectedUrl.slice('/api/v1'.length))
      .then((bytes) => {
        if (!disposed) {
          blob = URL.createObjectURL(bytes);
          setImage({ source: expectedUrl, blob, epoch });
        }
      })
      .catch(() => {
        if (!disposed) setImage(undefined);
      });
    return () => {
      disposed = true;
      if (blob) URL.revokeObjectURL(blob);
    };
  }, [client, epoch, expectedUrl]);

  const label = `Ảnh chân dung của ${name}`;
  return (
    <span className={small ? clubCss.smallMark : clubCss.mark}>
      {active && portrait ? (
        <img
          src={active}
          alt={label}
          width={portrait.width}
          height={portrait.height}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          onError={() => setImage(undefined)}
        />
      ) : (
        <span role="img" aria-label={`${label} chưa có ảnh khả dụng`}>
          <AdminIcon name="user" />
        </span>
      )}
    </span>
  );
}

export function PlayerPortraitActions({
  playerId,
  revision,
  portrait,
  onChange,
}: {
  playerId: string;
  revision: string;
  portrait: PortraitReference | null;
  onChange: () => void;
}) {
  const { client } = useSession();
  const [file, setFile] = useState<File>();
  const [remove, setRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reloadRequired, setReloadRequired] = useState(false);

  async function submit() {
    if (busy || reloadRequired || (remove ? !portrait : !file)) return;
    setBusy(true);
    setError('');
    try {
      if (remove && portrait) {
        await client.request(`/players/${playerId}/portrait/remove`, {
          method: 'POST',
          body: { mediaAssetId: portrait.id, expectedRevision: revision },
        });
      } else if (file) {
        const body = new FormData();
        body.append('expectedRevision', revision);
        body.append('file', file);
        await client.request(`/players/${playerId}/portrait`, { method: 'POST', body });
      }
      setFile(undefined);
      setRemove(false);
      setReloadRequired(true);
      onChange();
    } catch (failure) {
      const uncertain =
        failure instanceof HttpFailure &&
        (failure.unknownOutcome || ['REVISION_CONFLICT', 'BASIS_CHANGED'].includes(failure.code));
      setReloadRequired(uncertain);
      setError(
        uncertain
          ? 'Hãy tải lại hồ sơ để kiểm tra ảnh chân dung hiện tại trước khi gửi yêu cầu mới.'
          : failure instanceof Error
            ? failure.message
            : 'Không thể cập nhật ảnh chân dung.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={clubCss.logoActions}>
      <LogoFileField
        label={portrait ? 'Chọn ảnh thay thế' : 'Chọn ảnh chân dung'}
        file={file}
        disabled={busy || reloadRequired || remove}
        onChange={(next) => {
          if (next && next.size > 2097152) {
            setError('Ảnh chân dung không được vượt quá 2 MiB.');
            setFile(undefined);
          } else {
            setError('');
            setFile(next);
          }
        }}
      />
      {remove && <p>Gỡ ảnh chân dung hiện tại khỏi hồ sơ cầu thủ?</p>}
      {error && (
        <p role="alert" className={shared.error}>
          {error}
        </p>
      )}
      <div className={shared.actions}>
        {!remove && (
          <button
            type="button"
            disabled={!file || busy || reloadRequired}
            onClick={() => {
              void submit();
            }}
          >
            {portrait ? 'Thay ảnh chân dung' : 'Tải ảnh lên'}
          </button>
        )}
        {portrait && !remove && (
          <button type="button" disabled={busy || reloadRequired} onClick={() => setRemove(true)}>
            Gỡ ảnh chân dung
          </button>
        )}
        {remove && (
          <>
            <button type="button" disabled={busy} onClick={() => setRemove(false)}>
              Hủy
            </button>
            <button
              type="button"
              className={shared.danger}
              disabled={busy || reloadRequired}
              onClick={() => {
                void submit();
              }}
            >
              Xác nhận gỡ ảnh
            </button>
          </>
        )}
        {reloadRequired && error && (
          <button type="button" onClick={onChange}>
            Tải lại hồ sơ
          </button>
        )}
      </div>
    </div>
  );
}
