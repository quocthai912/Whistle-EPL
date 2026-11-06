import { NavLink } from 'react-router';
import { LogoutButton } from '../auth/LogoutButton';
import { useSession } from '../../shared/http/use-session';
import { AccountsPage } from './AccountsPage';
import { DelegationsPage } from './DelegationsPage';
import { AuditPage } from '../audit/AuditPage';
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
  const audit = page === 'audit' && permitted;
  const navigation = (
    <nav className={css.nav} aria-label="Quản trị">
      {admin && <NavLink to="/admin/accounts">Tài khoản và phân quyền</NavLink>}
      {(admin || manager) && <NavLink to="/admin/delegations">Ủy quyền nghiệp vụ</NavLink>}
      {admin && <NavLink to="/admin/audit">Nhật ký hoạt động</NavLink>}
    </nav>
  );
  return (
    <div className={audit ? css.layout + ' ' + css.auditLayout : css.layout}>
      <header className={css.topbar}>
        <NavLink to="/internal" className={css.brand}>
          <img src="/images/Whistle-EPL-Logo.png" alt="" />
          <span>
            Whistle-EPL<small>HỆ THỐNG QUẢN TRỊ GIẢI ĐẤU</small>
          </span>
        </NavLink>
        <div className={css.account}>
          <span>{session?.account.fullName}</span>
          <NavLink to="/change-password">Đổi mật khẩu</NavLink>
          <LogoutButton />
        </div>
      </header>
      {audit && (
        <aside className={css.sidebar}>
          <strong>HỆ THỐNG QUẢN TRỊ</strong>
          {navigation}
        </aside>
      )}
      <main className={css.workspace}>
        {audit ? (
          <AuditPage />
        ) : permitted ? (
          <>
            <div className={css.hero}>
              <span className={css.kicker}>KHÔNG GIAN ĐIỀU HÀNH</span>
              <h1>
                {page === 'accounts'
                  ? 'Quản lý tài khoản và phân quyền'
                  : 'Quản lý ủy quyền nghiệp vụ'}
              </h1>
              <p>
                {page === 'accounts'
                  ? 'Quản lý nhân sự và quyền truy cập hệ thống.'
                  : 'Xử lý đề xuất và theo dõi quyền theo mùa giải.'}
              </p>
            </div>
            {navigation}
            {page === 'accounts' ? <AccountsPage /> : <DelegationsPage />}
          </>
        ) : (
          <section className={css.panel}>
            <h1>Truy cập bị từ chối</h1>
            <p role="alert">Bạn không có quyền truy cập trang này.</p>
            <NavLink to="/internal">Về trang nội bộ</NavLink>
          </section>
        )}
      </main>
      {audit && (
        <footer className={css.auditFooter}>
          Whistle-EPL · Cổng thông tin và quản lý giải bóng đá Ngoại hạng Anh.
        </footer>
      )}
    </div>
  );
}
