import { Modal } from 'antd';
import type { ComponentProps } from 'react';
import css from './WorkspaceDialog.module.css';

/** Keeps portal dialogs on the workspace's typography, spacing and command hierarchy. */
export function WorkspaceDialog({ className, ...props }: ComponentProps<typeof Modal>) {
  return <Modal centered {...props} className={`${css.dialog} ${className ?? ''}`} />;
}
