import { useState } from 'react';
import { Drawer } from 'antd';
import type { AdminCommand } from './AdminDialog';
import { permissionNames, roleNames, type Account, type Season } from './administration-model';
import css from './Administration.module.css';

const seasonal = Object.entries(roleNames).filter(([code]) => code !== 'SYSTEM_ADMINISTRATOR');
const prerequisites = {
  CLUB_MASTER: 'SEASON_MANAGER',
  PLAYER_MASTER: 'REGISTRATION_OFFICER',
  STADIUM_MASTER: 'SCHEDULING_OFFICER',
};
const tabs = ['Thông tin tài khoản', 'Vai trò hệ thống', 'Phân công mùa giải', 'Quyền dùng chung'];

/** Separates account details, system roles, season assignments and shared rights in the account drawer. */
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

  return (
    <Drawer
      open
      onClose={onClose}
      size="large"
      title={account.fullName + ' · ' + account.personnelCode}
    >
      <div className={css.details}>
        <div className={css.tabs} role="tablist" aria-label="Chi tiết phân quyền">
          {tabs.map((label, index) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={index === tab}
              onClick={() => setTab(index)}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 0 && (
          <section role="tabpanel">
            <h3>Thông tin tài khoản</h3>
            <p>Tên đăng nhập: {account.username}</p>
            {account.mustChangePassword && <p>Yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.</p>}
            <div className={css.actions}>
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
          </section>
        )}
        {tab === 1 && (
          <section role="tabpanel">
            <h3>Vai trò hệ thống</h3>
            {account.systemRoles.map(({ id }) => (
              <div className={css.detailRow} key={id}>
                <span>Quản trị hệ thống</span>
                <button
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
              </div>
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
          </section>
        )}
        {tab === 2 && (
          <section role="tabpanel">
            <h3>Phân công theo mùa giải</h3>
            {account.seasonRoles.length === 0 && <p>Chưa có phân công.</p>}
            {account.seasonRoles.map(({ id, seasonId, roleCode }) => (
              <div className={css.detailRow} key={id}>
                <span>
                  {seasons.find((season) => season.id === seasonId)?.name ?? seasonId} ·{' '}
                  {roleNames[roleCode]}
                </span>
                <button
                  onClick={() =>
                    confirm('Thu hồi phân công mùa giải', '/role-assignments/' + id + '/revoke')
                  }
                >
                  Thu hồi phân công
                </button>
              </div>
            ))}
            <button
              disabled={!canExpand || !seasons.length}
              onClick={() =>
                onCommand({
                  title: 'Thêm phân công',
                  path: prefix + '/role-assignments',
                  critical: true,
                  fields: [
                    {
                      name: 'seasonId',
                      label: 'Mùa giải',
                      options: seasons.map((season) => ({ value: season.id, label: season.name })),
                    },
                    {
                      name: 'roleCode',
                      label: 'Vai trò',
                      options: seasonal.map(([value, label]) => ({ value, label })),
                    },
                  ],
                })
              }
            >
              Thêm phân công
            </button>
          </section>
        )}
        {tab === 3 && (
          <section role="tabpanel">
            <h3>Quyền dùng chung và quyền tạo mùa giải</h3>
            {(Object.keys(permissionNames) as (keyof typeof permissionNames)[]).map((kind) => {
              const grant =
                kind === 'CREATE_SEASON'
                  ? account.createSeasonGrants[0]
                  : account.sharedGrants.find((item) => item.masterKind === kind);
              const eligible =
                kind === 'CREATE_SEASON' ||
                account.seasonRoles.some(({ roleCode }) => roleCode === prerequisites[kind]);
              return (
                <div className={css.detailRow} key={kind}>
                  <span>
                    {permissionNames[kind]}
                    {!eligible && !grant && ' · Cần vai trò phù hợp'}
                  </span>
                  {grant ? (
                    <button
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
              );
            })}
          </section>
        )}
        {self && <p>Việc mở rộng quyền của chính mình cần quản trị viên khác thực hiện.</p>}
      </div>
    </Drawer>
  );
}
