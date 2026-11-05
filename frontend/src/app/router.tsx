import { Alert, Empty, Spin } from 'antd';
import { Link, Route, Routes } from 'react-router';
import { AuthRoute } from '../features/auth/auth-routes';

export function LoadingState() {
  return (
    <Spin tip="Đang tải...">
      <div style={{ minHeight: 80 }} />
    </Spin>
  );
}
export function EmptyState() {
  return <Empty description="Chưa có dữ liệu." />;
}
export function ErrorState() {
  return <Alert type="error" title="Không thể tải dữ liệu. Vui lòng thử lại." />;
}

export function FoundationRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <main style={{ padding: 32 }}>
            <h1>Whistle-EPL</h1>
            <h2>Nền tảng quản trị giải đấu</h2>
            <EmptyState />
            <Link to="/login">Đăng nhập</Link>
          </main>
        }
      />
      <Route path="/login" element={<AuthRoute page="login" />} />
      <Route path="/change-password" element={<AuthRoute page="change" />} />
      <Route path="/internal" element={<AuthRoute page="internal" />} />
      <Route path="/admin/accounts" element={<AuthRoute page="accounts" />} />
      <Route path="/admin/delegations" element={<AuthRoute page="delegations" />} />
      <Route path="/admin/*" element={<AuthRoute page="internal" />} />
      <Route path="*" element={<ErrorState />} />
    </Routes>
  );
}
