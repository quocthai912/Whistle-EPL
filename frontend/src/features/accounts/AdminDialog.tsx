import { Modal } from 'antd';
import { useState, type FormEvent } from 'react';
import { HttpFailure } from '../../shared/http/client';
import { useSession } from '../../shared/http/use-session';
import css from './Administration.module.css';

type Values = Record<string, string>;
type Basis = { revision: string; versionId?: string; description: string };
export type Field = {
  name: string;
  label: string;
  type?: 'password' | 'datetime-local' | 'textarea';
  required?: boolean;
  options?: { value: string; label: string }[];
};
export type AdminCommand = {
  title: string;
  description?: string;
  path: string;
  method?: 'POST' | 'PATCH';
  critical?: boolean;
  fields?: Field[] | ((values: Values) => Field[]);
  initial?: Values;
  basis?: Basis;
  readBasis?: () => Promise<Basis>;
  body?: (values: Values) => Record<string, string | undefined>;
  preview?: (values: Values) => string | undefined;
};

/** Confirms an administration command and presents conflict or uncertain-outcome recovery. */
export function AdminDialog({
  command,
  onClose,
  onSuccess,
}: {
  command: AdminCommand;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { client } = useSession();
  const [values, setValues] = useState(command.initial ?? {});
  const [basis, setBasis] = useState(command.basis);
  const [current, setCurrent] = useState<Basis>();
  const [failure, setFailure] = useState<HttpFailure | Error>();
  const [busy, setBusy] = useState(false);
  const [unknown, setUnknown] = useState<{ body: object; key: string } | null>(null);
  const fields =
    typeof command.fields === 'function' ? command.fields(values) : (command.fields ?? []);
  const conflict = failure instanceof HttpFailure && failure.status === 409;
  const uncertain = failure instanceof HttpFailure && failure.unknownOutcome;

  /** Sends the confirmed intent, retaining the original key only when a critical command needs outcome recovery. */
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || conflict || (uncertain && !unknown)) return;
    setBusy(true);
    setFailure(undefined);
    const intent = unknown ?? {
      key: command.critical ? crypto.randomUUID() : '',
      body: {
        ...(command.body?.(values) ?? values),
        ...(basis && { expectedRevision: basis.revision }),
        ...(basis?.versionId && { versionId: basis.versionId }),
      },
    };
    try {
      await client.request(command.path, {
        method: command.method ?? 'POST',
        body: intent.body,
        requestKey: intent.key || undefined,
      });
      onSuccess();
    } catch (error) {
      setValues((previous) =>
        Object.fromEntries(
          Object.entries(previous).filter(
            ([name]) => !fields.some((field) => field.name === name && field.type === 'password'),
          ),
        ),
      );
      const problem = error instanceof Error ? error : new Error('Không thể hoàn tất thao tác.');
      setFailure(problem);
      setUnknown(
        problem instanceof HttpFailure && problem.unknownOutcome && command.critical
          ? intent
          : null,
      );
    } finally {
      setBusy(false);
    }
  }

  /** Fetches the current revision for explicit review without submitting the command again. */
  async function review() {
    if (!command.readBasis) return;
    setBusy(true);
    try {
      setCurrent(await command.readBasis());
    } catch {
      setCurrent(undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      title={command.title}
      onCancel={onClose}
      footer={null}
      closable={!busy && !unknown}
      mask={{ closable: false }}
      keyboard={!busy && !unknown}
    >
      <form className={css.form} onSubmit={(event) => void submit(event)}>
        {command.description && <p>{command.description}</p>}
        {basis && <p className={css.basis}>{basis.description}</p>}
        {fields.map((field) => {
          const shared = {
            name: field.name,
            value: values[field.name] ?? '',
            required: field.required ?? true,
            disabled: busy || !!unknown,
            onChange: (
              event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
            ) => setValues({ ...values, [field.name]: event.target.value }),
          };
          return (
            <label key={field.name}>
              {field.label}
              {field.required !== false && ' *'}
              {field.options ? (
                <select {...shared}>
                  <option value="">Chọn…</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea {...shared} rows={3} maxLength={2000} />
              ) : (
                <input
                  {...shared}
                  type={field.type ?? 'text'}
                  autoComplete={field.type === 'password' ? 'new-password' : undefined}
                />
              )}
            </label>
          );
        })}
        {failure && (
          <p className={css.error} role="alert">
            {failure.message}
          </p>
        )}
        {command.preview?.(values) && <p className={css.basis}>{command.preview(values)}</p>}
        {uncertain && (
          <p role="status">
            {unknown
              ? 'Chưa xác định kết quả. Kiểm tra lại bằng đúng định danh lệnh đã gửi.'
              : 'Chưa xác định kết quả. Đóng hộp thoại và kiểm tra dữ liệu đã lưu trước khi gửi lại.'}
          </p>
        )}
        {conflict && command.readBasis && (
          <div className={css.review}>
            {!current ? (
              <button type="button" disabled={busy} onClick={() => void review()}>
                Tải dữ liệu mới để xem lại
              </button>
            ) : (
              <>
                <p>{current.description}</p>
                <button
                  type="button"
                  onClick={() => {
                    setBasis(current);
                    setCurrent(undefined);
                    setFailure(undefined);
                  }}
                >
                  Dùng phiên bản đã xem
                </button>
              </>
            )}
          </div>
        )}
        <div className={css.actions}>
          <button type="button" onClick={onClose} disabled={busy || !!unknown}>
            Hủy
          </button>
          <button
            className={css.primary}
            disabled={busy || conflict || (uncertain && !unknown)}
            type="submit"
          >
            {busy ? 'Đang xử lý…' : unknown ? 'Kiểm tra kết quả' : 'Xác nhận'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
