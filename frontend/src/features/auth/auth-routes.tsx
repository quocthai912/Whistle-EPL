import { Navigate } from 'react-router';
import { lazy, Suspense } from 'react';
import { Button } from 'antd';
import { useSession } from '../../shared/http/use-session';
import { LoginPage } from './LoginPage';
import { ChangePasswordPage } from './ChangePasswordPage';
const AdministrationLayout = lazy(() => import('../accounts/AdministrationLayout'));

/** Resolves session and password-change requirements before rendering a protected route. */
export function AuthRoute({
  page,
}: {
  page:
    | 'login'
    | 'change'
    | 'internal'
    | 'accounts'
    | 'delegations'
    | 'audit'
    | 'seasons'
    | 'clubs'
    | 'stadiums'
    | 'players'
    | 'club-applications'
    | 'regulations';
}) {
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
  if (
    page === 'accounts' ||
    page === 'delegations' ||
    page === 'audit' ||
    page === 'seasons' ||
    page === 'clubs' ||
    page === 'stadiums' ||
    page === 'players' ||
    page === 'club-applications' ||
    page === 'regulations'
  )
    return (
      <Suspense fallback={<p role="status">Đang tải trang quản trị…</p>}>
        <AdministrationLayout page={page} />
      </Suspense>
    );
  return (
    <Suspense fallback={<p role="status">Đang tải trang quản trị…</p>}>
      <AdministrationLayout page="home" />
    </Suspense>
  );
}
