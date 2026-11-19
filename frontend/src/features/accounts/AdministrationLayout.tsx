import { Link, NavLink, useParams } from 'react-router';
import { LogoutButton } from '../auth/LogoutButton';
import { useSession } from '../../shared/http/use-session';
import { AccountsPage } from './AccountsPage';
import { DelegationsPage } from './DelegationsPage';
import { AuditPage } from '../audit/AuditPage';
import { AdminIcon } from './AdminIcon';
import css from './Administration.module.css';
import { SeasonsPage } from '../seasons/SeasonsPage';
import { regulationSeasonScope } from '../seasons/season-model';
import { RegulationWorkspace } from '../regulations/RegulationWorkspace';
import { ClubsPage } from '../clubs/ClubsPage';
import { StadiumsPage } from '../stadiums/StadiumsPage';

/** Shows the selected administration page only to sessions with the corresponding role. */
export default function AdministrationLayout({
  page,
}: {
  page:
    | 'home'
    | 'accounts'
    | 'delegations'
    | 'audit'
    | 'seasons'
    | 'regulations'
    | 'clubs'
    | 'stadiums';
}) {
  const { session } = useSession();
  const { seasonId } = useParams();
  const admin = session?.systemAdministrator;
  const manager = !!session?.seasonManagerIds?.length;
  const canReadClubs = manager || session?.sharedMasterKinds?.includes('CLUB_MASTER');
  const canReadStadiums =
    session?.sharedMasterKinds?.includes('STADIUM_MASTER') ||
    session?.seasonRoles?.some(({ roleCode }) => roleCode === 'SCHEDULING_OFFICER');
  const hasSeasonRole = !!session?.seasonRoles?.length || manager;
  const canCreateSeason = !!session?.canCreateSeason;
  const regulationSeasonIds = regulationSeasonScope(session);
  const permitted =
    page === 'home'
      ? true
      : page === 'stadiums'
        ? canReadStadiums
        : page === 'clubs'
          ? canReadClubs
          : page === 'regulations'
            ? seasonId
              ? regulationSeasonIds.has(seasonId)
              : regulationSeasonIds.size > 0
            : page === 'seasons'
              ? canCreateSeason || hasSeasonRole
              : page === 'delegations'
                ? admin || manager
                : admin;
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
      {(canCreateSeason || hasSeasonRole) && (
        <NavLink to="/workspace/seasons" end aria-label="Quản lý mùa giải">
          <AdminIcon name="season" />
          Quản lý mùa giải
        </NavLink>
      )}
      {regulationSeasonIds.size > 0 && (
        <Link
          to="/workspace/seasons/regulations"
          aria-current={page === 'regulations' ? 'page' : undefined}
        >
          <AdminIcon name="regulations" />
          Quản lý quy định mùa giải
        </Link>
      )}
      {canReadClubs && (
        <NavLink to="/workspace/clubs">
          <AdminIcon name="club" />
          Quản lý hồ sơ câu lạc bộ
        </NavLink>
      )}
      {canReadStadiums && (
        <NavLink to="/workspace/stadiums">
          <AdminIcon name="stadium" />
          Quản lý sân vận động
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
            {(admin || hasSeasonRole || regulationSeasonIds.size > 0) && (
              <small>
                {admin
                  ? 'Quản trị viên hệ thống'
                  : manager
                    ? 'Quản lý mùa giải'
                    : 'Nghiệp vụ mùa giải'}
              </small>
            )}
          </div>
          <LogoutButton />
        </div>
      </header>
      <aside className={css.sidebar}>
        <strong>HỆ THỐNG QUẢN TRỊ</strong>
        {navigation}
      </aside>
      <main className={css.workspace}>
        {permitted ? (
          page === 'home' ? (
            <section className={css.panel}>
              <h1>Xin chào, {session?.account.fullName}.</h1>
              <p>Chọn chức năng trong thanh điều hướng để bắt đầu làm việc.</p>
              {!admin &&
                !hasSeasonRole &&
                !canCreateSeason &&
                !canReadClubs &&
                !canReadStadiums && (
                  <p className={css.notice}>
                    Chưa có chức năng nội bộ được triển khai cho tài khoản này.
                  </p>
                )}
              <Link to="/change-password">Đổi mật khẩu</Link>
            </section>
          ) : page === 'audit' ? (
            <AuditPage />
          ) : page === 'accounts' ? (
            <AccountsPage />
          ) : page === 'delegations' ? (
            <DelegationsPage />
          ) : page === 'regulations' ? (
            <RegulationWorkspace />
          ) : page === 'clubs' ? (
            <ClubsPage />
          ) : page === 'stadiums' ? (
            <StadiumsPage />
          ) : (
            <SeasonsPage />
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
