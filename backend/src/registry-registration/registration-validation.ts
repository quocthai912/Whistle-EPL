import { invalid } from '../identity-access/accounts.dto';
import { normalizeMultilineText } from '../platform/business-text';
import { boundedMasterText, masterName } from '../platform/master-profile';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PHONE_ALLOWED_PATTERN = /^[0-9+\-().\s]+$/;

/** Returns the current YYYY-MM-DD calendar date in Asia/Ho_Chi_Minh (UTC+7, fixed offset). */
export function currentVietnamDateIso(nowUtc: Date): string {
  const vnMillis = nowUtc.getTime() + 7 * 60 * 60 * 1000;
  return new Date(vnMillis).toISOString().slice(0, 10);
}

export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Validates a YYYY-MM-DD calendar birth date not later than the current Vietnam date (D024/D092). */
export function parseBirthDate(raw: string, nowUtc: Date): { iso: string; date: Date } {
  if (typeof raw !== 'string') throw invalid('Ngày sinh không hợp lệ.');
  const trimmed = raw.trim();
  const match = DATE_ONLY_PATTERN.exec(trimmed);
  if (!match) throw invalid('Ngày sinh phải có định dạng YYYY-MM-DD.');
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed) {
    throw invalid('Ngày sinh không phải là ngày hợp lệ trên lịch.');
  }
  const todayVn = currentVietnamDateIso(nowUtc);
  if (trimmed > todayVn) {
    throw invalid('Ngày sinh không được lớn hơn ngày hiện tại theo múi giờ Việt Nam.');
  }
  return { iso: trimmed, date };
}

/** Validates D092 representative phone: max 32 chars, 7-15 digits, approved punctuation only. */
export function normalizeRepresentativePhone(raw: string): string {
  if (typeof raw !== 'string') throw invalid('Số điện thoại đại diện không hợp lệ.');
  const normalized = raw.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!normalized || [...normalized].length > 32 || !PHONE_ALLOWED_PATTERN.test(normalized)) {
    throw invalid(
      'Số điện thoại đại diện tối đa 32 ký tự và chỉ gồm chữ số, khoảng trắng, +, -, (, ), .',
    );
  }
  const digitCount = (normalized.match(/[0-9]/g) ?? []).length;
  if (digitCount < 7 || digitCount > 15) {
    throw invalid('Số điện thoại đại diện phải chứa từ 7 đến 15 chữ số.');
  }
  return normalized;
}

export function optionalSingleLineText(
  raw: string | null | undefined,
  max: number,
): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (!raw.trim()) return null;
  return masterName(raw, max);
}

export function optionalBoundedText(
  raw: string | null | undefined,
  max: number,
): string | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  const normalized = normalizeMultilineText(raw);
  if (!normalized) return null;
  return boundedMasterText(normalized, max);
}

export function requiredBoundedText(raw: string, max: number, message?: string): string {
  if (typeof raw !== 'string') throw invalid(message);
  const normalized = normalizeMultilineText(raw);
  if (!normalized || [...normalized].length > max) throw invalid(message);
  return normalized;
}
