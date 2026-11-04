import { Button } from 'antd';
import { useSession } from '../../shared/http/use-session';
import { useAuthCommand } from './use-auth-command';
import { SessionResolution } from './SessionResolution';
import styles from './Auth.module.css';

export function LogoutButton() {
  const { store } = useSession();
  const { error, busy, uncertain, execute, resolved } = useAuthCommand();
  return (
    <div>
      <Button
        htmlType="button"
        className={styles.logout}
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5M21 12H9" />
          </svg>
        }
        disabled={busy || uncertain}
        onClick={() => {
          void execute('/auth/logout').then((result) => {
            if (result) store.clear('Bạn đã đăng xuất.');
          });
        }}
      >
        {busy ? 'Đang đăng xuất…' : 'Đăng xuất'}
      </Button>
      {error && <p role="alert">{error}</p>}
      {uncertain && <SessionResolution onResolved={resolved} />}
    </div>
  );
}
