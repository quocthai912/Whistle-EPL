import { NavLink } from 'react-router';
import { LogoutButton } from '../auth/LogoutButton';
import { useSession } from '../../shared/http/use-session';
import { AccountsPage } from './AccountsPage';
import { DelegationsPage } from './DelegationsPage';
import css from './Administration.module.css';

export default function AdministrationLayout({ page }: { page: 'accounts' | 'delegations' }) {
  const { session } = useSession();
  const admin = session?.systemAdministrator;
  const manager = !!session?.seasonManagerIds?.length;
  const permitted = page === 'accounts' ? admin : admin || manager;
  return (
    <div className={css.layout}>
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
      <main className={css.workspace}>
        {permitted ? (
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
            <nav className={css.nav} aria-label="Quản trị">
              {admin && <NavLink to="/admin/accounts">Tài khoản và phân quyền</NavLink>}
              {(admin || manager) && <NavLink to="/admin/delegations">Ủy quyền nghiệp vụ</NavLink>}
            </nav>
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
    </div>
  );
}
