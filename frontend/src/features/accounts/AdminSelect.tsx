import { Select } from 'antd';
import { useId } from 'react';
import css from './Administration.module.css';

/** Shares accessible dropdown interaction and styling across filters and administration forms. */
export function AdminSelect({
  label,
  value,
  options,
  onChange,
  disabled,
  required,
  hideLabel = true,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  hideLabel?: boolean;
}) {
  const id = useId();
  return (
    <div className={css.selectField}>
      <label htmlFor={id} className={hideLabel ? css.srOnly : undefined}>
        {label}
      </label>
      <Select<string>
        id={id}
        aria-label={label}
        aria-required={required}
        value={value}
        options={options}
        disabled={disabled}
        onChange={onChange}
        virtual={false}
        className={css.select}
        classNames={{ popup: { root: css.selectPopup } }}
        styles={{ popup: { root: { minWidth: 220, maxWidth: 'calc(100vw - 24px)' } } }}
        showSearch={false}
        notFoundContent="Không có lựa chọn phù hợp"
      />
    </div>
  );
}
