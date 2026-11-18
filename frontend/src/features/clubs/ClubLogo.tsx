import { useEffect, useState } from 'react';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { AdminIcon } from '../accounts/AdminIcon';
import shared from '../accounts/Administration.module.css';
import css from './ClubsPage.module.css';

export type LogoReference = { id: string; url: string; width: number; height: number };

export function ClubLogo({
  name,
  logo,
  small = false,
}: {
  name: string;
  logo: LogoReference | null;
  small?: boolean;
}) {
  const { client, epoch } = useSession();
  const expectedUrl = logo && logo.url === `/api/v1/media/${logo.id}` ? logo.url : undefined;
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

  const label = `Logo của ${name}`;
  return (
    <span className={small ? css.smallMark : css.mark}>
      {active && logo ? (
        <img
          src={active}
          alt={label}
          width={logo.width}
          height={logo.height}
          onError={() => setImage(undefined)}
        />
      ) : (
        <span role="img" aria-label={`${label} chưa có ảnh khả dụng`}>
          <AdminIcon name="shield" />
        </span>
      )}
    </span>
  );
}

export function ClubLogoActions({
  clubId,
  revision,
  logo,
  onChange,
}: {
  clubId: string;
  revision: string;
  logo: LogoReference | null;
  onChange: () => void;
}) {
  const { client } = useSession();
  const [file, setFile] = useState<File>();
  const [remove, setRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reloadRequired, setReloadRequired] = useState(false);

  async function submit() {
    if (busy || reloadRequired || (remove ? !logo : !file)) return;
    setBusy(true);
    setError('');
    try {
      if (remove && logo) {
        await client.request(`/clubs/${clubId}/logo/remove`, {
          method: 'POST',
          body: { mediaAssetId: logo.id, expectedRevision: revision },
        });
      } else if (file) {
        const body = new FormData();
        body.append('expectedRevision', revision);
        body.append('file', file);
        await client.request(`/clubs/${clubId}/logo`, { method: 'POST', body });
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
          ? 'Hãy tải lại hồ sơ để kiểm tra logo hiện tại trước khi gửi yêu cầu mới.'
          : failure instanceof Error
            ? failure.message
            : 'Không thể cập nhật logo.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={css.logoActions}>
      <label>
        {logo ? 'Chọn ảnh thay logo' : 'Chọn ảnh logo'}
        <input
          key={file ? 'picked' : 'empty'}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={busy || reloadRequired || remove}
          onChange={(event) => {
            const next = event.target.files?.[0];
            if (next && next.size > 2_097_152) {
              setError('Logo không được vượt quá 2 MiB.');
              setFile(undefined);
            } else {
              setError('');
              setFile(next);
            }
            event.target.value = '';
          }}
        />
      </label>
      {file && <p>{file.name}</p>}
      {remove && <p>Gỡ logo hiện tại khỏi hồ sơ câu lạc bộ?</p>}
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
            {logo ? 'Thay logo' : 'Tải logo lên'}
          </button>
        )}
        {logo && !remove && (
          <button type="button" disabled={busy || reloadRequired} onClick={() => setRemove(true)}>
            Gỡ logo
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
              Xác nhận gỡ logo
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
