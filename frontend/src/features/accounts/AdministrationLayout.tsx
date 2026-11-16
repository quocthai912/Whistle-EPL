import { NavLink, useParams } from 'react-router';
import { LogoutButton } from '../auth/LogoutButton';
import { useSession } from '../../shared/http/use-session';
import { AccountsPage } from './AccountsPage';
import { DelegationsPage } from './DelegationsPage';
import { AuditPage } from '../audit/AuditPage';
import { AdminIcon } from './AdminIcon';
import css from './Administration.module.css';
import { SeasonsPage } from '../seasons/SeasonsPage';
import { RegulationVersionsPage } from '../regulations/RegulationVersionsPage';

/** Shows the selected administration page only to sessions with the corresponding role. */
export default function AdministrationLayout({
  page,
}: {
  page: 'accounts' | 'delegations' | 'audit' | 'seasons' | 'regulations';
}) {
  const { session } = useSession();
  const { seasonId } = useParams();
  const admin = session?.systemAdministrator;
  const manager = !!session?.seasonManagerIds?.length;
  const hasSeasonRole = !!session?.seasonRoles?.length || manager;
  const canCreateSeason = !!session?.canCreateSeason;
  const regulationSeasonIds = [
    ...new Set(
      [
        ...(session?.preparationCapabilities?.direct ?? []),
        ...(session?.preparationCapabilities?.delegated ?? []),
      ].map((capability) => capability.seasonId),
    ),
  ];
  const permitted =
    page === 'regulations'
      ? !!seasonId &&
        (!!session?.seasonManagerIds?.includes(seasonId) ||
          !!session?.preparationCapabilities?.direct.some(
            (item) => item.seasonId === seasonId && item.actionCode === 'PREPARE_REGULATION_CHANGE',
          ) ||
          !!session?.preparationCapabilities?.delegated.some(
            (item) => item.seasonId === seasonId && item.actionCode === 'PREPARE_REGULATION_CHANGE',
          ))
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
      {regulationSeasonIds.map((seasonId, index) => (
        <NavLink key={seasonId} to={`/workspace/seasons/${seasonId}/regulations`}>
          <AdminIcon name="season" />
          Quy định mùa giải {index + 1}
        </NavLink>
      ))}
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
            {(admin || hasSeasonRole || regulationSeasonIds.length > 0) && (
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
          page === 'audit' ? (
            <AuditPage />
          ) : page === 'accounts' ? (
            <AccountsPage />
          ) : page === 'delegations' ? (
            <DelegationsPage />
          ) : page === 'regulations' ? (
            <RegulationVersionsPage />
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
