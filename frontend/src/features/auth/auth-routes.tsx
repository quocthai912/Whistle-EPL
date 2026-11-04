import { Navigate, Link } from 'react-router';
import { Button } from 'antd';
import { useSession } from '../../shared/http/use-session';
import { LoginPage } from './LoginPage';
import { ChangePasswordPage } from './ChangePasswordPage';
import { LogoutButton } from './LogoutButton';

export function AuthRoute({ page }: { page: 'login' | 'change' | 'internal' }) {
  const { ready, session, bootstrapError, retry } = useSession();
  if (!ready) return <p role="status">Đang kiểm tra phiên đăng nhập…</p>;
  if (bootstrapError)
    return (
      <div role="alert">
        <p>{bootstrapError}</p>
        <Button onClick={retry}>Thử lại</Button>
      </div>
    );
  if (!session) return page === 'login' ? <LoginPage /> : <Navigate to="/login" replace />;
  if (page === 'change') return <ChangePasswordPage />;
  if (session.changeRequired) return <Navigate to="/change-password" replace />;
  if (page === 'login') return <Navigate to="/internal" replace />;
  return (
    <main style={{ padding: 32 }}>
      <h1>Whistle-EPL</h1>
      <p>Xin chào, {session.account.fullName}.</p>
      <p>Chưa có chức năng nội bộ được triển khai cho tài khoản này.</p>
      <Link to="/change-password">Đổi mật khẩu</Link>
      <LogoutButton />
    </main>
  );
}
