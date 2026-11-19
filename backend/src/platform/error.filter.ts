import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { ApplicationError, type ApplicationErrorDetail } from './application-error';
import { MasterNameConflict } from './application-error';
import { clearAuthCookie, SESSION_COOKIE } from '../identity-access/csrf.service';

const safeFieldPath = /^[A-Za-z][A-Za-z0-9_.-]*(?:\[\d+\][A-Za-z0-9_.-]*)*$/;
const safeFieldCode = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const safeMessageCharacters = /^[\p{L}\p{M}\p{N} .,;:!?()%-]+$/u;
const vietnameseDiacritics = /[\u00C0-\u024F\u1E00-\u1EFF]/u;

function isSafeLocalizedMessage(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 240 &&
    safeMessageCharacters.test(value) &&
    vietnameseDiacritics.test(value)
  );
}

function safeFieldDetails(value: unknown): ApplicationErrorDetail[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const details: ApplicationErrorDetail[] = [];
  for (const item of value.slice(0, 64)) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.field !== 'string' ||
      item.field.length > 80 ||
      !safeFieldPath.test(item.field) ||
      typeof item.code !== 'string' ||
      !safeFieldCode.test(item.code)
    )
      continue;
    const hasMessage = item.message !== undefined;
    if (hasMessage && !isSafeLocalizedMessage(item.message)) continue;
    details.push({
      field: item.field,
      code: item.code,
      ...(hasMessage ? { message: item.message } : {}),
    });
  }
  return details.length ? details : undefined;
}

const failures: Record<number, { code: string; message: string }> = {
  400: { code: 'INVALID_INPUT', message: 'Dữ liệu không hợp lệ.' },
  401: { code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập lại.' },
  403: { code: 'ACCESS_DENIED', message: 'Bạn không có quyền thực hiện thao tác này.' },
  404: { code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu.' },
  405: { code: 'INVALID_INPUT', message: 'Thao tác không được hỗ trợ.' },
  409: { code: 'STATE_CONFLICT', message: 'Dữ liệu đã thay đổi. Vui lòng tải lại.' },
  413: { code: 'VALIDATION_FAILED', message: 'Tệp tải lên vượt quá kích thước cho phép.' },
  429: { code: 'LOGIN_THROTTLED', message: 'Vui lòng thử lại sau.' },
  503: { code: 'TEMPORARILY_UNAVAILABLE', message: 'Hệ thống tạm thời không khả dụng.' },
};

@Catch()
export class SafeErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(SafeErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = response.locals.requestId ?? randomUUID();
    if (!(exception instanceof ApplicationError) && !(exception instanceof HttpException)) {
      // Exception messages, stacks and request content may contain credentials.
      this.logger.error({ event: 'UNEXPECTED_EXCEPTION', requestId });
    }
    const status =
      exception instanceof ApplicationError
        ? exception.status
        : exception instanceof HttpException
          ? exception.getStatus()
          : 500;
    const details =
      exception instanceof ApplicationError ? safeFieldDetails(exception.details) : undefined;
    const safe =
      exception instanceof ApplicationError
        ? {
            code: exception.code,
            message: exception.message,
            ...(details ? { details } : {}),
            ...(exception instanceof MasterNameConflict
              ? { candidates: exception.candidates }
              : {}),
          }
        : (failures[status] ?? {
            code: 'INTERNAL_ERROR',
            message: 'Có lỗi hệ thống. Vui lòng thử lại sau.',
          });
    response.setHeader('Cache-Control', 'no-store');
    if (
      status === 401 &&
      ['AUTH_REQUIRED', 'SESSION_EXPIRED', 'PERMISSION_CHANGED'].includes(safe.code)
    )
      clearAuthCookie(response, SESSION_COOKIE);
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.status(status).json({ error: safe, requestId });
  }
}
