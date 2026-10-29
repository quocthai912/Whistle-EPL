import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { map, type Observable } from 'rxjs';

export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    response.locals.requestId = randomUUID();
    if (!request.path.startsWith('/api/v1/')) return next.handle();
    response.setHeader('Cache-Control', 'no-store');
    return next
      .handle()
      .pipe(map((data: unknown) => ({ data, requestId: response.locals.requestId as string })));
  }
}
