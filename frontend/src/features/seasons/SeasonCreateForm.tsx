import { Modal } from 'antd';
import { useRef, useState, type FormEvent } from 'react';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import { AdminIcon } from '../accounts/AdminIcon';
import { parseDisplayDate, dateFormat } from '../../shared/date-format';
import { DateOnlyPicker } from '../../shared/DatePickers';
import css from './SeasonCreateForm.module.css';

type SeasonFields = {
  code: string;
  name: string;
  competitionName: string;
  startDate: string;
  endDate: string;
};
type SeasonCreateCommand = SeasonFields;
type SeasonAcknowledgement = { id: string; revision: string };
type FieldName = keyof SeasonFields;
type FieldErrors = Partial<Record<FieldName, string>>;
type CreateIntent = { body: SeasonCreateCommand; key: string };

const fieldNames: readonly FieldName[] = [
  'code',
  'name',
  'competitionName',
  'startDate',
  'endDate',
];
const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CODE = /^[A-Z0-9][A-Z0-9_-]{0,31}$/;
const dateFields = [
  { field: 'startDate', id: 'season-create-start', label: 'Ngày bắt đầu' },
  { field: 'endDate', id: 'season-create-end', label: 'Ngày kết thúc' },
] as const;
type TextField = Exclude<FieldName, (typeof dateFields)[number]['field']>;
const emptyFields: Record<TextField, string> = {
  code: '',
  name: '',
  competitionName: '',
};

function normalizedName(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ');
}

function isAscii(value: string): boolean {
  return [...value].every((character) => character.charCodeAt(0) <= 0x7f);
}

function normalizedCode(value: string): string {
  const trimmed = value.trim();
  return isAscii(trimmed) ? trimmed.toUpperCase() : trimmed;
}

function codePointLength(value: string): number {
  return [...value].length;
}

function normalizeCommand(values: SeasonFields): SeasonCreateCommand {
  return {
    code: normalizedCode(values.code),
    name: normalizedName(values.name),
    competitionName: normalizedName(values.competitionName),
    startDate: parseDisplayDate(values.startDate),
    endDate: parseDisplayDate(values.endDate),
  };
}

function validate(values: SeasonFields): FieldErrors {
  const normalized = normalizeCommand(values);
  const rawCode = values.code.trim();
  const asciiCode = isAscii(rawCode);
  const errors: FieldErrors = {};
  if (!asciiCode || !CODE.test(asciiCode ? rawCode.toUpperCase() : ''))
    errors.code = 'Mã phải có 1–32 ký tự ASCII, bắt đầu bằng chữ hoặc số.';
  for (const field of ['name', 'competitionName'] as const) {
    const label = field === 'name' ? 'Tên mùa giải' : 'Tên giải đấu';
    const length = codePointLength(normalized[field]);
    if (length < 1) errors[field] = `${label} là thông tin bắt buộc.`;
    else if (length > 200) errors[field] = `${label} không được vượt quá 200 ký tự.`;
  }
  for (const { field, label } of dateFields) {
    if (!values[field].trim()) errors[field] = `${label} là thông tin bắt buộc.`;
    else if (!normalized[field])
      errors[field] = `${label} phải là ngày hợp lệ theo dạng ${dateFormat}.`;
  }
  if (!errors.startDate && !errors.endDate && normalized.startDate > normalized.endDate)
    errors.endDate = 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.';
  return errors;
}

function isFieldName(value: string): value is FieldName {
  return fieldNames.includes(value as FieldName);
}

function acknowledgement(value: unknown): SeasonAcknowledgement | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const data = value as Record<string, unknown>;
  if (
    typeof data.id !== 'string' ||
    !UUID4.test(data.id) ||
    typeof data.revision !== 'string' ||
    !/^[1-9]\d*$/.test(data.revision)
  )
    return undefined;
  return { id: data.id, revision: data.revision };
}

/** Create-only workspace entry; it never loads a season list or follows creation with a GET. */
export function SeasonCreateForm({
  compact = false,
  onCreated,
}: {
  compact?: boolean;
  onCreated?: (season: SeasonAcknowledgement) => void;
}) {
  const { client } = useSession();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(emptyFields);
  const [errors, setErrors] = useState<FieldErrors>({});
  const dateTexts = useRef<Record<string, string>>({});
  const [failure, setFailure] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [unknownIntent, setUnknownIntent] = useState<CreateIntent | null>(null);
  const [created, setCreated] = useState<SeasonAcknowledgement & { code: string }>();

  function close() {
    if (busy || unknownIntent) return;
    setOpen(false);
    setValues(emptyFields);
    setErrors({});
    setFailure(undefined);
  }

  function change(field: TextField, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    clearFeedback(field);
  }

  function clearFeedback(field: FieldName) {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFailure(undefined);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    // Read the displayed text as the picker can retain an invalid manual edit after a valid selection.
    const readDate = (id: string) => {
      const input = form.elements.namedItem(id);
      return input instanceof HTMLInputElement ? input.value : '';
    };
    const fields = {
      ...values,
      startDate: readDate(dateFields[0].id),
      endDate: readDate(dateFields[1].id),
    };
    if (!unknownIntent) {
      const nextErrors = validate(fields);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
    }

    const intent = unknownIntent ?? { body: normalizeCommand(fields), key: crypto.randomUUID() };
    const unresolvedIntent = unknownIntent;
    setBusy(true);
    setFailure(undefined);
    try {
      const response = await client.request<unknown>('/seasons', {
        method: 'POST',
        body: intent.body,
        requestKey: intent.key,
      });
      const result = acknowledgement(response.data);
      if (!result) throw new HttpFailure(200, 'INVALID_RESPONSE', response.requestId, true);
      setCreated({ ...result, code: intent.body.code });
      onCreated?.(result);
      setOpen(false);
      setValues(emptyFields);
      setErrors({});
      setUnknownIntent(null);
    } catch (error) {
      const problem = error instanceof Error ? error : new Error('Không thể hoàn tất yêu cầu.');
      const details = error instanceof HttpFailure ? error.details : undefined;
      const nextErrors: FieldErrors = {};
      for (const detail of details ?? []) {
        if (isFieldName(detail.field) && detail.message) nextErrors[detail.field] = detail.message;
      }
      // A retry blocked before receipt lookup cannot resolve the earlier write.
      if (
        unresolvedIntent &&
        error instanceof HttpFailure &&
        [401, 403, 429].includes(error.status)
      ) {
        setErrors({});
        setFailure(problem.message);
        setUnknownIntent(unresolvedIntent);
      } else {
        setErrors(nextErrors);
        setFailure(Object.keys(nextErrors).length ? undefined : problem.message);
        setUnknownIntent(error instanceof HttpFailure && error.unknownOutcome ? intent : null);
      }
    } finally {
      setBusy(false);
    }
  }

  const trigger = (
    <button
      className={compact ? css.compactTrigger : css.primary}
      type="button"
      onClick={() => {
        setCreated(undefined);
        setOpen(true);
      }}
    >
      <AdminIcon name="plus" />
      Tạo mùa giải
    </button>
  );
  const announcement = created && (
    <p className={css.success} role="status">
      Đã tạo mùa giải {created.code}.
    </p>
  );
  const dialog = open && (
    <Modal
      open
      centered
      width={520}
      className={css.dialog}
      styles={{ mask: { backdropFilter: 'blur(3px)' } }}
      title={
        <span className={css.dialogTitle}>
          <span className={css.dialogIcon} aria-hidden="true">
            <AdminIcon name="plus" />
          </span>
          <span>Tạo mùa giải mới</span>
        </span>
      }
      onCancel={close}
      destroyOnHidden
      footer={null}
      closable={!busy && !unknownIntent}
      mask={{ closable: false }}
      keyboard={!busy && !unknownIntent}
    >
      <form className={css.form} noValidate onSubmit={(event) => void submit(event)}>
        <p className={css.description}>
          Nhập đầy đủ thông tin. Mã được chuẩn hóa trước khi lưu và không thể thay đổi sau khi tạo.
        </p>
        <label className={css.field} htmlFor="season-create-code">
          <span>Mã mùa giải *</span>
          <input
            id="season-create-code"
            value={values.code}
            autoComplete="off"
            required
            disabled={busy || !!unknownIntent}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? 'season-create-code-error' : undefined}
            onChange={(event) => change('code', event.target.value)}
          />
          {errors.code && (
            <span className={css.fieldError} id="season-create-code-error" role="alert">
              {errors.code}
            </span>
          )}
          {normalizedCode(values.code) && (
            <span className={css.preview}>Mã sẽ lưu: {normalizedCode(values.code)}</span>
          )}
        </label>
        <label className={css.field} htmlFor="season-create-name">
          <span>Tên mùa giải *</span>
          <input
            id="season-create-name"
            value={values.name}
            required
            disabled={busy || !!unknownIntent}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'season-create-name-error' : undefined}
            onChange={(event) => change('name', event.target.value)}
          />
          {errors.name && (
            <span className={css.fieldError} id="season-create-name-error" role="alert">
              {errors.name}
            </span>
          )}
          {normalizedName(values.name) && (
            <span className={css.preview}>Tên mùa giải sẽ lưu: {normalizedName(values.name)}</span>
          )}
        </label>
        <label className={css.field} htmlFor="season-create-competition">
          <span>Tên giải đấu *</span>
          <input
            id="season-create-competition"
            value={values.competitionName}
            required
            disabled={busy || !!unknownIntent}
            aria-invalid={!!errors.competitionName}
            aria-describedby={
              errors.competitionName ? 'season-create-competition-error' : undefined
            }
            onChange={(event) => change('competitionName', event.target.value)}
          />
          {errors.competitionName && (
            <span className={css.fieldError} id="season-create-competition-error" role="alert">
              {errors.competitionName}
            </span>
          )}
          {normalizedName(values.competitionName) && (
            <span className={css.preview}>
              Tên giải đấu sẽ lưu: {normalizedName(values.competitionName)}
            </span>
          )}
        </label>
        <p className={css.dateHint} id="season-create-date-format">
          Nhập hoặc chọn ngày theo định dạng DD/MM/YYYY.
        </p>
        <div className={css.dates}>
          {dateFields.map(({ field, id, label }) => (
            <div className={css.field} key={field}>
              <label htmlFor={id}>{label} *</label>
              <DateOnlyPicker
                id={id}
                className={css.datePicker}
                disabled={busy || !!unknownIntent}
                required
                invalid={!!errors[field]}
                describedBy={
                  errors[field]
                    ? `${id}-error season-create-date-format`
                    : 'season-create-date-format'
                }
                onDateTextChange={(text) => {
                  if (dateTexts.current[field] !== text) {
                    dateTexts.current[field] = text;
                    clearFeedback(field);
                  }
                }}
              />
              {errors[field] && (
                <span className={css.fieldError} id={`${id}-error`} role="alert">
                  {errors[field]}
                </span>
              )}
            </div>
          ))}
        </div>
        {failure && (
          <p className={css.error} role="alert">
            {failure}
          </p>
        )}
        {unknownIntent && (
          <p className={css.uncertain} role="status">
            Chưa xác định kết quả. Kiểm tra lại bằng đúng yêu cầu đã gửi.
          </p>
        )}
        <div className={css.actions}>
          <button type="button" disabled={busy || !!unknownIntent} onClick={close}>
            Hủy
          </button>
          <button className={css.primary} type="submit" disabled={busy}>
            {busy ? 'Đang xử lý…' : unknownIntent ? 'Kiểm tra kết quả' : 'Xác nhận tạo mùa giải'}
          </button>
        </div>
      </form>
    </Modal>
  );

  if (compact)
    return (
      <div className={css.compact}>
        {trigger}
        {announcement}
        {dialog}
      </div>
    );

  return (
    <section className={css.panel} aria-label="Tạo mùa giải">
      <div className={css.header}>
        <div>
          <h1>Quản lý mùa giải</h1>
          <p>Tạo mùa giải mới theo thẩm quyền được cấp.</p>
        </div>
        {trigger}
      </div>
      {announcement}
      <p className={css.note}>
        Việc tạo mùa giải không tự cấp quyền xem hoặc quản lý mùa giải; các quyền này được phân công
        riêng.
      </p>
      <p className={css.openStateNote}>
        Mùa giải mới sẽ ở trạng thái Mở, chưa có quy định nào có hiệu lực.
      </p>
      {dialog}
    </section>
  );
}
