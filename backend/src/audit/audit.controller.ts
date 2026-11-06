import { Controller, Get, Inject, MethodNotAllowedException, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuditQueryService } from './audit-query.service';

@Controller('api/v1/audit-logs')
export class AuditController {
  constructor(@Inject(AuditQueryService) private readonly audit: AuditQueryService) {}

  @Get()
  list(@Req() request: Request, @Query() query: Record<string, unknown>) {
    // Express dispatches HEAD to GET handlers unless it has a dedicated route.
    if (request.method !== 'GET') throw new MethodNotAllowedException();
    return this.audit.list(request, query);
  }
}
