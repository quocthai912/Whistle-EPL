import { useState, type FormEvent } from 'react';
import { Button, Input } from 'antd';
import { useSession } from '../../shared/http/use-session';
import { sessionView } from '../../shared/http/session-view';
import { AuthLayout } from './AuthLayout';
import { PasswordField } from './PasswordField';
import { SessionResolution } from './SessionResolution';
import { useAuthCommand } from './use-auth-command';
import styles from './Auth.module.css';

export function LoginPage() {
  const { store, notice, noticeTone } = useSession();
  const { error, busy, uncertain, execute, reject, resolved } = useAuthCommand();
  const [secretVersion, setSecretVersion] = useState(0);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uncertain) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const username = String(fields.get('username') ?? '');
    const password = String(fields.get('password') ?? '');
    if (!/^[a-z0-9][a-z0-9._-]{2,49}$/i.test(username) || !password) {
      reject('Vui lòng nhập tên đăng nhập hợp lệ (3–50 ký tự) và mật khẩu.');
      setSecretVersion((version) => version + 1);
      return;
    }
    try {
      const result = await execute('/auth/login', { username, password });
      if (result) store.acceptSession(sessionView(result.data));
    } catch (failure) {
      reject(failure instanceof Error ? failure.message : 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setSecretVersion((version) => version + 1);
    }
  }
  return (
    <AuthLayout>
      <h2>Đăng nhập</h2>
      <p className={styles.description}>Nhập thông tin tài khoản được cấp để tiếp tục.</p>
      {notice && (
        <p className={noticeTone === 'success' ? styles.success : styles.notice} role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {uncertain && <SessionResolution onResolved={resolved} />}
      <form noValidate onSubmit={(event) => void submit(event)} aria-busy={busy}>
        <div className={styles.field}>
          <label htmlFor="username">
            TÊN ĐĂNG NHẬP <span>*</span>
          </label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            placeholder="Nhập tên đăng nhập"
            required
          />
        </div>
        <PasswordField
          key={secretVersion}
          name="password"
          label="MẬT KHẨU"
          placeholder="Nhập mật khẩu"
        />
        <Button className={styles.submit} disabled={busy || uncertain} htmlType="submit">
          {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </Button>
      </form>
      <p className={styles.help}>Gặp vấn đề về tài khoản? Liên hệ Quản trị viên hệ thống.</p>
    </AuthLayout>
  );
}
