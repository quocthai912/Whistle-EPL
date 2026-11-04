import { useState, type FormEvent } from 'react';
import { Button } from 'antd';
import { useSession } from '../../shared/http/use-session';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { LogoutButton } from './LogoutButton';
import { SessionResolution } from './SessionResolution';
import { useAuthCommand } from './use-auth-command';
import styles from './Auth.module.css';

export function ChangePasswordPage() {
  const { store, session } = useSession();
  const { error, busy, uncertain, execute, reject, resolved } = useAuthCommand();
  const [secretVersion, setSecretVersion] = useState(0);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uncertain) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const currentPassword = String(fields.get('currentPassword') ?? '');
    const newPassword = String(fields.get('newPassword') ?? '');
    const confirm = String(fields.get('confirmPassword') ?? '');
    const size = [...newPassword].length;
    if (!currentPassword || size < 15 || size > 128 || newPassword !== confirm) {
      reject(
        !currentPassword
          ? 'Vui lòng nhập mật khẩu hiện tại.'
          : size < 15 || size > 128
            ? 'Mật khẩu phải có từ 15 đến 128 ký tự.'
            : newPassword !== confirm
              ? 'Xác nhận mật khẩu mới không khớp.'
              : 'Vui lòng nhập mật khẩu hiện tại.',
      );
      setSecretVersion((version) => version + 1);
      return;
    }
    try {
      const result = await execute('/auth/password/change', { currentPassword, newPassword });
      if (result) store.clear('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.', 'success');
    } finally {
      setSecretVersion((version) => version + 1);
    }
  }
  return (
    <AuthLayout change action={<LogoutButton />}>
      <h2>Đổi mật khẩu</h2>
      <p className={styles.description}>
        {session?.changeRequired
          ? 'Vui lòng thiết lập mật khẩu mới trước khi tiếp tục sử dụng hệ thống.'
          : 'Nhập mật khẩu hiện tại và thiết lập mật khẩu mới cho tài khoản.'}
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {uncertain && <SessionResolution onResolved={resolved} />}
      <form noValidate onSubmit={(event) => void submit(event)} aria-busy={busy}>
        <PasswordField
          key={`current-${secretVersion}`}
          name="currentPassword"
          label="Mật khẩu hiện tại"
          placeholder="Nhập mật khẩu hiện tại"
        />
        <PasswordField
          key={`new-${secretVersion}`}
          name="newPassword"
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          autoComplete="new-password"
        />
        <p className={styles.hint}>ⓘ Mật khẩu phải có từ 15 đến 128 ký tự.</p>
        <PasswordField
          key={`confirm-${secretVersion}`}
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
        />
        <Button className={styles.submit} disabled={busy || uncertain} htmlType="submit">
          {busy ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
        </Button>
      </form>
      <p className={styles.help}>
        Sau khi cập nhật thành công, tất cả phiên làm việc sẽ được đăng xuất để bảo đảm an toàn.
      </p>
    </AuthLayout>
  );
}
