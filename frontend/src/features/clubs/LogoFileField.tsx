import css from './ClubsPage.module.css';

export function LogoFileField({
  label,
  file,
  disabled,
  onChange,
}: {
  label: string;
  file?: File;
  disabled?: boolean;
  onChange: (file: File | undefined) => void;
}) {
  return (
    <label className={css.fileField}>
      <span>{label}</span>
      <span className={css.fileControl}>
        {file?.name ?? 'Chọn tệp ảnh'}
        <input
          aria-label={label}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </span>
      <small>PNG, JPEG hoặc WebP · Tối đa 2 MiB</small>
    </label>
  );
}
