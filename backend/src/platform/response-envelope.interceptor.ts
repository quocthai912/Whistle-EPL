import {
  StreamableFile,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { map, type Observable } from 'rxjs';

export type ValidatedFileMimeType = 'image/jpeg' | 'image/png' | 'image/webp';
export type PaginationMeta = { page: number; pageSize: number; total: number };
const validatedFileMimeTypes = new Set<ValidatedFileMimeType>([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const validatedFileResponse = Symbol('validated-file-response');
const paginatedResponse = Symbol('paginated-response');
const validatedFileMimeTypesByStream = new WeakMap<StreamableFile, ValidatedFileMimeType>();
const maxValidatedFileBytes = 2_097_152;

type MarkedPaginatedResponse = {
  readonly [paginatedResponse]: true;
  readonly data: unknown;
  readonly meta: PaginationMeta;
};

/** Marks a bounded success payload so pagination metadata stays at the shared envelope level. */
export function withPaginationMeta<T>(data: T, meta: PaginationMeta): MarkedPaginatedResponse {
  if (
    !meta ||
    !Number.isSafeInteger(meta.page) ||
    meta.page < 1 ||
    !Number.isSafeInteger(meta.pageSize) ||
    meta.pageSize < 1 ||
    meta.pageSize > 100 ||
    !Number.isSafeInteger(meta.total) ||
    meta.total < 0
  )
    throw new Error('Pagination metadata must contain bounded page, pageSize, and total values.');
  return Object.freeze({ data, meta, [paginatedResponse]: true as const });
}

function pageMetadata(value: unknown, response: Response): MarkedPaginatedResponse | undefined {
  if (
    response.statusCode >= 200 &&
    response.statusCode < 300 &&
    !!value &&
    typeof value === 'object' &&
    (value as MarkedPaginatedResponse)[paginatedResponse] === true
  )
    return value as MarkedPaginatedResponse;
  return undefined;
}

/** Wraps already-authorized, validated, bounded image bytes in a response the adapter can safely stream. */
export function markValidatedFileResponse(
  response: Response,
  bytes: Buffer,
  mimeType: ValidatedFileMimeType,
): StreamableFile {
  if (
    !validatedFileMimeTypes.has(mimeType) ||
    !Buffer.isBuffer(bytes) ||
    bytes.length === 0 ||
    bytes.length > maxValidatedFileBytes
  )
    throw new Error('Validated file responses require bounded normalized image bytes.');
  const stream = new StreamableFile(Buffer.from(bytes));
  validatedFileMimeTypesByStream.set(stream, mimeType);
  Object.defineProperty(response.locals, validatedFileResponse, {
    configurable: true,
    enumerable: false,
    value: stream,
  });
  return stream;
}

function validatedFileMimeType(
  response: Response,
  data: unknown,
): ValidatedFileMimeType | undefined {
  const registeredStream = (response.locals as Record<PropertyKey, unknown>)[validatedFileResponse];
  const mimeType =
    data instanceof StreamableFile ? validatedFileMimeTypesByStream.get(data) : undefined;
  if (
    response.statusCode >= 200 &&
    response.statusCode < 300 &&
    registeredStream === data &&
    mimeType &&
    validatedFileMimeTypes.has(mimeType)
  )
    return mimeType;
  return undefined;
}

export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    response.locals.requestId = randomUUID();
    if (!request.path.startsWith('/api/v1/')) return next.handle();
    response.setHeader('Cache-Control', 'no-store');
    return next.handle().pipe(
      map((data: unknown) => {
        const mimeType = validatedFileMimeType(response, data);
        if (mimeType) {
          response.setHeader('Content-Type', mimeType);
          return data;
        }
        const pagination = pageMetadata(data, response);
        if (pagination)
          return {
            data: pagination.data,
            meta: pagination.meta,
            requestId: response.locals.requestId as string,
          };
        return { data, requestId: response.locals.requestId as string };
      }),
    );
  }
}
