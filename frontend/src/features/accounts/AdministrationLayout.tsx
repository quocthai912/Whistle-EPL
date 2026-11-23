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
import { PlayersPage } from '../players/PlayersPage';
import { ClubApplicationsPage } from '../registrations/ClubApplicationsPage';
import { PlayerRegistrationsPage } from '../registrations/PlayerRegistrationsPage';

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
    | 'stadiums'
    | 'players'
    | 'club-applications'
    | 'player-registrations';
}) {
  const { session } = useSession();
  const { seasonId } = useParams();
  const admin = session?.systemAdministrator;
  const manager = !!session?.seasonManagerIds?.length;
  const canReadClubs = manager || session?.sharedMasterKinds?.includes('CLUB_MASTER');
  const canReadStadiums =
    session?.sharedMasterKinds?.includes('STADIUM_MASTER') ||
    session?.seasonRoles?.some(({ roleCode }) => roleCode === 'SCHEDULING_OFFICER');
  const registrationSeasonIds = new Set<string>([
    ...(session?.seasonManagerIds ?? []),
    ...(session?.seasonRoles
      ?.filter(
        ({ roleCode }) => roleCode === 'REGISTRATION_OFFICER' || roleCode === 'SEASON_MANAGER',
      )
      .map((entry) => entry.seasonId) ?? []),
  ]);
  const canReadPlayers =
    session?.sharedMasterKinds?.includes('PLAYER_MASTER') || registrationSeasonIds.size > 0;
  const hasSeasonRole = !!session?.seasonRoles?.length || manager;
  const canCreateSeason = !!session?.canCreateSeason;
  const regulationSeasonIds = regulationSeasonScope(session);
  const hasWorkspaceAccess = !!(
    admin ||
    hasSeasonRole ||
    canCreateSeason ||
    canReadClubs ||
    canReadStadiums ||
    canReadPlayers ||
    registrationSeasonIds.size ||
    regulationSeasonIds.size
  );
  const permitted =
    page === 'home'
      ? true
      : page === 'stadiums'
        ? canReadStadiums
        : page === 'clubs'
          ? canReadClubs
          : page === 'players'
            ? canReadPlayers
            : page === 'club-applications' || page === 'player-registrations'
              ? seasonId
                ? registrationSeasonIds.has(seasonId)
                : registrationSeasonIds.size > 0
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
      {registrationSeasonIds.size > 0 && (
        <>
          <Link
            to="/workspace/seasons/club-applications"
            aria-current={page === 'club-applications' ? 'page' : undefined}
          >
            <AdminIcon name="application" />
            Hồ sơ tham dự câu lạc bộ
          </Link>
          <Link
            to="/workspace/seasons/player-registrations"
            aria-current={page === 'player-registrations' ? 'page' : undefined}
          >
            <AdminIcon name="shield" />
            Đăng ký cầu thủ theo mùa
          </Link>
        </>
      )}
      {canReadPlayers && (
        <NavLink to="/workspace/players">
          <AdminIcon name="user" />
          Quản lý hồ sơ cầu thủ
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
            <section className={css.messagePanel}>
              <div className={css.messageHeader}>
                <span className={css.messageIcon} aria-hidden="true">
                  <img src="/images/Whistle-EPL-Logo.png" alt="" />
                </span>
                <div>
                  <p className={css.messageEyebrow}>KHÔNG GIAN LÀM VIỆC</p>
                  <h1>Xin chào, {session?.account.fullName}.</h1>
                </div>
              </div>
              <p className={css.messageDescription}>
                {hasWorkspaceAccess
                  ? 'Chọn chức năng trong thanh điều hướng để bắt đầu làm việc.'
                  : 'Tài khoản của bạn chưa được phân công quyền nghiệp vụ. Vui lòng liên hệ Quản trị viên để được phân công.'}
              </p>
              <div className={css.messageActions}>
                <Link to="/change-password" className={css.workspaceLink}>
                  Đổi mật khẩu
                </Link>
              </div>
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
          ) : page === 'players' ? (
            <PlayersPage />
          ) : page === 'club-applications' ? (
            <ClubApplicationsPage />
          ) : page === 'player-registrations' ? (
            <PlayerRegistrationsPage />
          ) : (
            <SeasonsPage />
          )
        ) : (
          <section className={css.messagePanel}>
            <div className={css.messageHeader}>
              <span className={css.messageIcon} aria-hidden="true">
                <img src="/images/Whistle-EPL-Logo.png" alt="" />
              </span>
              <div>
                <p className={css.messageEyebrow}>QUYỀN TRUY CẬP</p>
                <h1>Bạn chưa có quyền truy cập</h1>
              </div>
            </div>
            <p className={css.messageDescription} role="alert">
              Chức năng này yêu cầu quyền được phân công. Vui lòng liên hệ Quản trị viên nếu bạn cần
              sử dụng.
            </p>
            <div className={css.messageActions}>
              <NavLink to="/internal" className={css.workspaceLink}>
                <span aria-hidden="true">←</span> Về trang làm việc
              </NavLink>
            </div>
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
