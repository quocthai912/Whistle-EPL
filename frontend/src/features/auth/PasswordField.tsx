import { useState } from 'react';
import { Button, Input } from 'antd';
import styles from './Auth.module.css';

export function PasswordField({
  name,
  label,
  placeholder,
  autoComplete = 'current-password',
}: {
  name: string;
  label: string;
  placeholder: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.field}>
      <label htmlFor={name}>
        {label} <span>*</span>
      </label>
      <div className={styles.password}>
        <Input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
        />
        <Button
          htmlType="button"
          aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M2.5 12C4 7.5 7.5 5 12 5s8 2.5 9.5 7C20 16.5 16.5 19 12 19S4 16.5 2.5 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m3 3 18 18" />}
          </svg>
        </Button>
      </div>
    </div>
  );
}
