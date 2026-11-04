import { useState } from 'react';
import { Button } from 'antd';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { sessionView } from '../../shared/http/session-view';
import styles from './Auth.module.css';

export function SessionResolution({ onResolved }: { onResolved: () => void }) {
  const { client, store } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className={styles.notice} role="status">
      <p>
        Chưa xác định được kết quả. Kiểm tra trạng thái phiên trước khi thực hiện thao tác tiếp
        theo.
      </p>
      {error && <p role="alert">{error}</p>}
      <Button
        htmlType="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setError(null);
          void client
            .request<unknown>('/auth/session')
            .then(({ data }) => {
              const session = sessionView(data);
              const current = store.getSnapshot().session;
              if (
                !current ||
                current.account.id !== session.account.id ||
                current.changeRequired !== session.changeRequired
              )
                store.acceptSession(session);
              onResolved();
            })
            .catch((failure: unknown) => {
              if (failure instanceof HttpFailure && failure.status === 401) onResolved();
              else
                setError(failure instanceof Error ? failure.message : 'Không thể kiểm tra phiên.');
            })
            .finally(() => setBusy(false));
        }}
      >
        Kiểm tra trạng thái phiên
      </Button>
    </div>
  );
}
