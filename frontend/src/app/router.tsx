import { Alert, Empty, Spin } from 'antd';
import { Navigate, Route, Routes } from 'react-router';
import { useSession } from '../shared/http/use-session';

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

function ProtectedShell() {
  const { session } = useSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.changeRequired) return <Navigate to="/change-password" replace />;
  return <EmptyState />;
}
function LoginShell() {
  const { notice } = useSession();
  return (
    <>
      {notice && <Alert type="warning" title={notice} />}
      <EmptyState />
    </>
  );
}
export function FoundationRouter() {
  return (
    <Routes>
      <Route path="/" element={<EmptyState />} />
      <Route path="/login" element={<LoginShell />} />
      <Route path="/change-password" element={<ChangePasswordShell />} />
      <Route path="/internal" element={<ProtectedShell />} />
      <Route path="*" element={<ErrorState />} />
    </Routes>
  );
}
function ChangePasswordShell() {
  const { session } = useSession();
  return session ? <EmptyState /> : <Navigate to="/login" replace />;
}
