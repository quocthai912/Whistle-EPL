import { DatePicker } from 'antd';
import vietnameseCalendar from 'antd/es/date-picker/locale/vi_VN';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { parseSeasonDate, seasonDateFormat } from './season-model';

dayjs.extend(utc);

const minuteFormat = `${seasonDateFormat} HH:mm`;
const secondFormat = `${minuteFormat}:ss`;
const millisecondFormat = `${secondFormat}.SSS`;

export function SeasonDateTimePicker({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const isIsoLocal = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value);
  const dateTime = isIsoLocal ? dayjs.utc(value) : null;
  const displayFormat = dateTime?.millisecond()
    ? millisecondFormat
    : dateTime?.second()
      ? secondFormat
      : minuteFormat;

  return (
    <span
      onChangeCapture={(event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        const text = event.target.value;
        const match = /^(\d{2}\/\d{2}\/\d{4}) (\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)$/.exec(
          text.trim(),
        );
        const date = match ? parseSeasonDate(match[1]) : '';
        if (!date || !match) {
          onChange(text);
          return;
        }
        const [clock, fraction = ''] = match[2].split('.');
        onChange(
          `${date}T${clock.length === 5 ? clock + ':00' : clock}.${fraction.padEnd(3, '0')}`,
        );
      }}
    >
      <DatePicker
        aria-label={label}
        locale={vietnameseCalendar}
        value={dateTime?.isValid() ? dateTime : null}
        placeholder={minuteFormat}
        disabled={disabled}
        style={{ width: '100%' }}
        showTime={{ format: 'HH:mm:ss' }}
        format={[displayFormat, minuteFormat, secondFormat, millisecondFormat]}
        preserveInvalidOnBlur
        onChange={(selected) => {
          const next = selected?.format('YYYY-MM-DDTHH:mm:ss.SSS') ?? '';
          if (next !== value) onChange(next);
        }}
      />
    </span>
  );
}

export function SeasonDatePicker({
  id,
  label,
  initialDate,
  disabled,
  invalid,
  required,
  describedBy,
  className,
  onDateTextChange,
}: {
  id?: string;
  label?: string;
  initialDate?: string | null;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  describedBy?: string;
  className?: string;
  onDateTextChange: (text: string) => void;
}) {
  return (
    <span
      onChangeCapture={(event) => {
        if (event.target instanceof HTMLInputElement) onDateTextChange(event.target.value);
      }}
    >
      <DatePicker
        id={id}
        className={className}
        style={{ width: '100%' }}
        defaultValue={
          initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? dayjs(initialDate) : null
        }
        locale={vietnameseCalendar}
        format={seasonDateFormat}
        placeholder={seasonDateFormat}
        preserveInvalidOnBlur
        disabled={disabled}
        status={invalid ? 'error' : undefined}
        aria-invalid={invalid}
        aria-label={label}
        aria-required={required}
        aria-describedby={describedBy}
        onChange={(_date, text) => onDateTextChange(typeof text === 'string' ? text : '')}
      />
    </span>
  );
}
