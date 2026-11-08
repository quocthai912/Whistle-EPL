import { useId, useState } from 'react';
import type { AdminCommand } from './AdminDialog';
import { AdminDrawer } from './AdminDrawer';
import { AdminIcon } from './AdminIcon';
import { AdminSelect } from './AdminSelect';
import { StateBadge } from './AdminLists';
import {
  formatVietnamTime,
  permissionNames,
  roleNames,
  seasonLabel,
  type Account,
  type Season,
} from './administration-model';
import css from './Administration.module.css';

const seasonal = Object.entries(roleNames).filter(([code]) => code !== 'SYSTEM_ADMINISTRATOR');
const prerequisites = {
  CLUB_MASTER: 'SEASON_MANAGER',
  PLAYER_MASTER: 'REGISTRATION_OFFICER',
  STADIUM_MASTER: 'SCHEDULING_OFFICER',
} as const;
const tabs = ['Hồ sơ tài khoản', 'Vai trò mùa giải', 'Phân quyền chung', 'Quyền hệ thống'];
const descriptions: Record<string, string> = {
  SEASON_MANAGER: 'Giám sát và điều hành công tác tổ chức giải đấu.',
  REGISTRATION_OFFICER: 'Tiếp nhận và thẩm định hồ sơ đăng ký đội bóng, cầu thủ.',
  SCHEDULING_OFFICER: 'Xây dựng lịch thi đấu, phân bổ sân vận động và khung giờ.',
  RESULTS_OFFICER: 'Ghi nhận biên bản trận đấu, bàn thắng và thống kê thi đấu.',
};

/** Separates account details and the three independent kinds of permission in the account drawer. */
export function GrantsPanel({
  account,
  seasons,
  self,
  onClose,
  onCommand,
}: {
  account: Account;
  seasons: Season[];
  self: boolean;
  onClose: () => void;
  onCommand: (action: Omit<AdminCommand, 'basis' | 'readBasis'>) => void;
}) {
  const [tab, setTab] = useState(0);
  const [seasonId, setSeasonId] = useState(seasons[0]?.id ?? '');
  const tabId = useId();
  const prefix = '/accounts/' + account.id;
  const canExpand = !self && account.state === 'ACTIVE';
  const confirm = (title: string, path: string, body?: Record<string, string>) =>
    onCommand({
      title,
      path: prefix + path,
      critical: true,
      body: () => body ?? {},
      description: 'Thay đổi quyền sẽ kết thúc các phiên đăng nhập hiện tại của tài khoản.',
    });

  function addAssignment(roleCode = '') {
    onCommand({
      title: 'Thêm phân công',
      path: prefix + '/role-assignments',
      critical: true,
      initial: { seasonId, roleCode },
      fields: [
        {
          name: 'seasonId',
          label: 'Mùa giải',
          options: seasons.map((season) => ({ value: season.id, label: seasonLabel(season) })),
        },
        {
          name: 'roleCode',
          label: 'Vai trò',
          options: seasonal.map(([value, label]) => ({ value, label })),
        },
      ],
    });
  }

  return (
    <AdminDrawer
      title={'Chi tiết nhân sự · ' + account.fullName + ' (' + account.personnelCode + ')'}
      subtitle="Quản lý tài khoản và phân quyền nghiệp vụ giải đấu"
      icon={account.fullName.trim().slice(0, 1).toLocaleUpperCase('vi-VN')}
      onClose={onClose}
    >
      <div className={css.tabs} role="tablist" aria-label="Chi tiết phân quyền">
        {tabs.map((label, index) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={tabId + '-tab-' + index}
            aria-controls={tabId + '-panel'}
            aria-selected={index === tab}
            tabIndex={index === tab ? 0 : -1}
            onKeyDown={(event) => {
              const next =
                event.key === 'ArrowRight'
                  ? (index + 1) % tabs.length
                  : event.key === 'ArrowLeft'
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? tabs.length - 1
                        : undefined;
              if (next === undefined) return;
              event.preventDefault();
              setTab(next);
              document.getElementById(tabId + '-tab-' + next)?.focus();
            }}
            onClick={() => setTab(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={css.details}
        role="tabpanel"
        id={tabId + '-panel'}
        aria-labelledby={tabId + '-tab-' + tab}
      >
        {tab === 0 && (
          <>
            <dl className={css.detailGrid}>
              <div>
                <dt>Họ và tên</dt>
                <dd>{account.fullName}</dd>
              </div>
              <div>
                <dt>Mã nhân sự</dt>
                <dd className={css.code}>{account.personnelCode}</dd>
              </div>
              <div>
                <dt>Tên đăng nhập</dt>
                <dd>{account.username}</dd>
              </div>
              <div>
                <dt>Trạng thái</dt>
                <dd>
                  <StateBadge state={account.state} />
                </dd>
              </div>
              {account.createdAt && (
                <div className={css.fullWidth}>
                  <dt>Ngày tạo tài khoản</dt>
                  <dd>{formatVietnamTime(account.createdAt)}</dd>
                </div>
              )}
            </dl>
            <div className={css.notice}>
              <strong>Lần đăng nhập gần nhất</strong>
              <p>
                {account.lastLoginAt
                  ? formatVietnamTime(account.lastLoginAt)
                  : 'Chưa ghi nhận lần đăng nhập'}
              </p>
            </div>
            {account.mustChangePassword && (
              <p className={css.notice}>Yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.</p>
            )}
            <h3>Thao tác tài khoản</h3>
            <div className={css.actions}>
              {!self && (
                <button
                  className={account.state === 'ACTIVE' ? css.danger : undefined}
                  onClick={() =>
                    onCommand({
                      title: account.state === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
                      critical: true,
                      path: prefix + (account.state === 'ACTIVE' ? '/lock' : '/unlock'),
                      description:
                        account.state === 'ACTIVE'
                          ? 'Người dùng sẽ mất quyền truy cập và các phiên hiện tại sẽ kết thúc.'
                          : 'Người dùng có thể đăng nhập lại bằng mật khẩu còn hiệu lực.',
                    })
                  }
                >
                  {account.state === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                </button>
              )}
              <button
                onClick={() =>
                  onCommand({
                    title: 'Chỉnh sửa tài khoản',
                    path: prefix,
                    method: 'PATCH',
                    fields: [{ name: 'fullName', label: 'Họ và tên' }],
                    initial: { fullName: account.fullName },
                  })
                }
              >
                Sửa họ và tên
              </button>
              <button
                onClick={() =>
                  onCommand({
                    title: 'Đặt lại mật khẩu',
                    path: prefix + '/reset-password',
                    description:
                      'Mật khẩu tạm có hiệu lực 24 giờ. Người dùng phải đổi mật khẩu sau khi đăng nhập.',
                    fields: [
                      { name: 'temporaryPassword', label: 'Mật khẩu tạm', type: 'password' },
                    ],
                  })
                }
              >
                Đặt lại mật khẩu
              </button>
            </div>
          </>
        )}
        {tab === 1 && (
          <>
            <div className={css.detailRow}>
              <AdminSelect
                label="Mùa giải phân công"
                value={seasonId}
                onChange={setSeasonId}
                options={seasons.map((season) => ({
                  value: season.id,
                  label: seasonLabel(season),
                }))}
              />
              <button disabled={!canExpand || !seasons.length} onClick={() => addAssignment()}>
                <AdminIcon name="plus" />
                Thêm phân công
              </button>
            </div>
            {!seasons.length && <p>Chưa có mùa giải để phân công.</p>}
            <div className={css.permissionGrid}>
              {seasonal.map(([roleCode, name]) => {
                const assignment = account.seasonRoles.find(
                  (role) => role.seasonId === seasonId && role.roleCode === roleCode,
                );
                return (
                  <section
                    className={css.permissionCard}
                    data-granted={!!assignment}
                    key={roleCode}
                  >
                    <h3>{name}</h3>
                    <span className={css.badge} data-state={assignment ? 'GRANTED' : 'DRAFT'}>
                      {assignment ? 'Đã phân công' : 'Chưa phân công'}
                    </span>
                    <p>{descriptions[roleCode]}</p>
                    <div className={css.cardFooter}>
                      <span>
                        {seasons.find((season) => season.id === seasonId)?.name ??
                          'Chưa có mùa giải'}
                      </span>
                      {assignment ? (
                        <button
                          className={css.danger}
                          onClick={() =>
                            confirm(
                              'Thu hồi phân công mùa giải',
                              '/role-assignments/' + assignment.id + '/revoke',
                            )
                          }
                        >
                          Thu hồi phân công
                        </button>
                      ) : (
                        <button
                          disabled={!canExpand || !seasonId}
                          onClick={() => addAssignment(roleCode)}
                        >
                          Phân công
                        </button>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
        {tab === 2 && (
          <>
            <h3>Quyền dùng chung</h3>
            <p className={css.notice}>
              Quản lý quyền chỉnh sửa hồ sơ dùng chung. Các quyền được cấp riêng, không tự động kế
              thừa từ vai trò theo mùa giải.
            </p>
            {(Object.keys(prerequisites) as (keyof typeof prerequisites)[]).map((kind) => {
              const grant = account.sharedGrants.find((item) => item.masterKind === kind);
              const eligible = account.seasonRoles.some(
                ({ roleCode }) => roleCode === prerequisites[kind],
              );
              return (
                <section className={css.permissionCard} key={kind}>
                  <div className={css.detailRow}>
                    <h3>{permissionNames[kind]}</h3>
                    <span className={css.badge} data-state={grant ? 'GRANTED' : 'DRAFT'}>
                      {grant ? 'Đã cấp' : eligible ? 'Chưa cấp' : 'Không đủ điều kiện'}
                    </span>
                  </div>
                  <p>
                    Điều kiện phân quyền · Có vai trò {roleNames[prerequisites[kind]]} trong ít nhất
                    một mùa giải.
                  </p>
                  <div className={css.cardFooter}>
                    <span>
                      {!eligible && !grant
                        ? 'Chưa đạt điều kiện vai trò'
                        : 'Quyền được cấp độc lập'}
                    </span>
                    {grant ? (
                      <button
                        className={css.danger}
                        onClick={() =>
                          confirm(
                            'Thu hồi ' + permissionNames[kind],
                            '/permission-grants/' + grant.id + '/revoke',
                            { kind },
                          )
                        }
                      >
                        Thu hồi quyền
                      </button>
                    ) : (
                      <button
                        disabled={!canExpand || !eligible}
                        onClick={() =>
                          confirm('Cấp ' + permissionNames[kind], '/permission-grants', { kind })
                        }
                      >
                        Cấp quyền
                      </button>
                    )}
                  </div>
                </section>
              );
            })}
            <p className={css.notice}>
              Khi mất phân công vai trò tương ứng cuối cùng, quyền dùng chung liên quan sẽ chấm dứt.
              Phân công lại vai trò không tự khôi phục quyền.
            </p>
          </>
        )}
        {tab === 3 && (
          <>
            <div className={css.notice}>
              <h3>Quyền hệ thống</h3>
              <p>Vai trò Quản trị viên hệ thống và quyền Tạo mùa giải được cấp độc lập.</p>
            </div>
            <section className={css.permissionCard} data-granted={!!account.systemRoles.length}>
              <div className={css.detailRow}>
                <h3>Quản trị viên hệ thống</h3>
                <span
                  className={css.badge}
                  data-state={account.systemRoles.length ? 'GRANTED' : 'DRAFT'}
                >
                  {account.systemRoles.length ? 'Đã cấp' : 'Chưa cấp'}
                </span>
              </div>
              <p>
                Quản lý tài khoản và phân quyền theo thẩm quyền. Các quyền nghiệp vụ theo mùa giải
                được phân công riêng.
              </p>
              <div className={css.cardFooter}>
                <span>{self ? 'Tài khoản đang đăng nhập' : 'Vai trò quản trị hệ thống'}</span>
                {account.systemRoles.map(({ id }) => (
                  <button
                    key={id}
                    className={css.danger}
                    disabled={self}
                    onClick={() =>
                      confirm(
                        'Thu hồi vai trò quản trị',
                        '/system-role-assignments/' + id + '/revoke',
                      )
                    }
                  >
                    Thu hồi vai trò quản trị
                  </button>
                ))}
                {!account.systemRoles.length && (
                  <button
                    disabled={!canExpand}
                    onClick={() =>
                      confirm('Cấp vai trò quản trị', '/system-role-assignments', {
                        roleCode: 'SYSTEM_ADMINISTRATOR',
                      })
                    }
                  >
                    Cấp vai trò quản trị
                  </button>
                )}
              </div>
            </section>
            <section className={css.permissionCard}>
              <div className={css.detailRow}>
                <h3>Quyền Tạo mùa giải</h3>
                <span
                  className={css.badge}
                  data-state={account.createSeasonGrants.length ? 'GRANTED' : 'DRAFT'}
                >
                  {account.createSeasonGrants.length ? 'Đã cấp' : 'Chưa cấp'}
                </span>
              </div>
              <p>
                Cho phép tạo mùa giải mới. Quyền được cấp riêng, không tự động phát sinh từ vai trò
                khác.
              </p>
              <div className={css.cardFooter}>
                <span>Quyền độc lập cấp hệ thống</span>
                {account.createSeasonGrants.map(({ id }) => (
                  <button
                    key={id}
                    className={css.danger}
                    onClick={() =>
                      confirm(
                        'Thu hồi ' + permissionNames.CREATE_SEASON,
                        '/permission-grants/' + id + '/revoke',
                        { kind: 'CREATE_SEASON' },
                      )
                    }
                  >
                    Thu hồi quyền
                  </button>
                ))}
                {!account.createSeasonGrants.length && (
                  <button
                    disabled={!canExpand}
                    onClick={() =>
                      confirm('Cấp ' + permissionNames.CREATE_SEASON, '/permission-grants', {
                        kind: 'CREATE_SEASON',
                      })
                    }
                  >
                    Cấp quyền
                  </button>
                )}
              </div>
            </section>
            <p className={css.notice}>
              <AdminIcon name="shield" /> Mọi thay đổi phân quyền hệ thống được ghi nhận trong nhật
              ký hoạt động.
            </p>
          </>
        )}
        {self && (
          <p className={css.notice}>
            Việc mở rộng quyền của chính mình cần quản trị viên khác thực hiện.
          </p>
        )}
      </div>
    </AdminDrawer>
  );
}
