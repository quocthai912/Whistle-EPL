import { Drawer } from 'antd';
import type { ReactNode } from 'react';
import css from './Administration.module.css';

/** Gives administration detail panels the same heading, scrolling body and close footer. */
export function AdminDrawer({
  title,
  subtitle,
  icon,
  children,
  onClose,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <Drawer
      open
      onClose={onClose}
      size="min(560px, 100vw)"
      className={css.drawer}
      closeIcon={<span aria-hidden="true">×</span>}
      title={
        <div className={css.drawerHeading}>
          <span className={css.drawerIcon}>{icon}</span>
          <div>
            <strong>{title}</strong>
            <small>{subtitle}</small>
          </div>
        </div>
      }
      footer={
        <div className={css.drawerFooter}>
          <span>Whistle-EPL · Quản trị hệ thống</span>
          <button type="button" onClick={onClose}>
            Đóng
          </button>
        </div>
      }
    >
      {children}
    </Drawer>
  );
}
