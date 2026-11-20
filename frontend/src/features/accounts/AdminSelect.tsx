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
  searchable = false,
  className,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; disabled?: boolean }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  hideLabel?: boolean;
  searchable?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className ? `${css.selectField} ${className}` : css.selectField}>
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
        styles={{
          popup: {
            root: { minWidth: 'min(220px, calc(100vw - 24px))', maxWidth: 'calc(100vw - 24px)' },
          },
        }}
        showSearch={
          searchable
            ? {
                optionFilterProp: 'label',
                filterOption: (input, option) =>
                  String(option?.label ?? '')
                    .toLowerCase()
                    .includes(input.trim().toLowerCase()),
              }
            : false
        }
        notFoundContent="Không có lựa chọn phù hợp"
      />
    </div>
  );
}
