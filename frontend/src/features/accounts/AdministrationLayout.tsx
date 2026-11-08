import { NavLink } from 'react-router';
import { LogoutButton } from '../auth/LogoutButton';
import { useSession } from '../../shared/http/use-session';
import { AccountsPage } from './AccountsPage';
import { DelegationsPage } from './DelegationsPage';
import { AuditPage } from '../audit/AuditPage';
import { AdminIcon } from './AdminIcon';
import css from './Administration.module.css';

/** Shows the selected administration page only to sessions with the corresponding role. */
export default function AdministrationLayout({
  page,
}: {
  page: 'accounts' | 'delegations' | 'audit';
}) {
  const { session } = useSession();
  const admin = session?.systemAdministrator;
  const manager = !!session?.seasonManagerIds?.length;
  const permitted = page === 'delegations' ? admin || manager : admin;
  const navigation = (
    <nav className={css.nav} aria-label="Quản trị">
      {admin && (
        <NavLink to="/admin/accounts" aria-label="Tài khoản và phân quyền">
          <AdminIcon name="accounts" />
          Tài khoản &amp; Phân quyền
        </NavLink>
      )}
      {(admin || manager) && (
        <NavLink to="/admin/delegations">
          <AdminIcon name="delegations" />
          Ủy quyền nghiệp vụ
        </NavLink>
      )}
      {admin && (
        <NavLink to="/admin/audit">
          <AdminIcon name="audit" />
          Nhật ký hoạt động
        </NavLink>
      )}
    </nav>
  );
  return (
    <div className={css.layout}>
      <header className={css.topbar}>
        <NavLink to="/internal" className={css.brand}>
          <img src="/images/Whistle-EPL-Logo.png" alt="" />
          <span>
            Whistle-EPL<small>Cổng thông tin &amp; Quản trị hệ thống</small>
          </span>
        </NavLink>
        <div className={css.account}>
          <span className={css.avatar}>
            <AdminIcon name="user" />
          </span>
          <div className={css.accountName}>
            <strong>{session?.account.fullName}</strong>
            {(admin || manager) && (
              <small>{admin ? 'Quản trị viên hệ thống' : 'Quản lý mùa giải'}</small>
            )}
          </div>
          <NavLink className={css.passwordLink} to="/change-password">
            Đổi mật khẩu
          </NavLink>
          <LogoutButton />
        </div>
      </header>
      <aside className={css.sidebar}>
        <strong>HỆ THỐNG QUẢN TRỊ</strong>
        {navigation}
      </aside>
      <main className={css.workspace}>
        {permitted ? (
          page === 'audit' ? (
            <AuditPage />
          ) : page === 'accounts' ? (
            <AccountsPage />
          ) : (
            <DelegationsPage />
          )
        ) : (
          <section className={css.panel}>
            <h1>Truy cập bị từ chối</h1>
            <p role="alert">Bạn không có quyền truy cập trang này.</p>
            <NavLink to="/internal">Về trang nội bộ</NavLink>
          </section>
        )}
      </main>
      <footer className={css.auditFooter}>
        © {new Date().getFullYear()} Whistle-EPL · Cổng thông tin và quản lý giải bóng đá Ngoại hạng
        Anh.
      </footer>
    </div>
  );
}
