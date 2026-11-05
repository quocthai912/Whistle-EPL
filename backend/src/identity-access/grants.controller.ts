import { Body, Controller, HttpCode, Inject, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { GrantsService } from './grants.service';
import { PermissionDto, RevisionDto, SeasonRoleDto, uuid } from './accounts.dto';

@Controller('api/v1/accounts/:id')
export class GrantsController {
  constructor(@Inject(GrantsService) private readonly grants: GrantsService) {}
  @Post('role-assignments')
  assign(@Req() request: Request, @Param('id') id: string, @Body() input: SeasonRoleDto) {
    return this.grants.seasonRole(request, uuid(id), input);
  }
  @Post('role-assignments/:assignmentId/revoke')
  @HttpCode(200)
  remove(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Body() input: RevisionDto,
  ) {
    return this.grants.seasonRole(request, uuid(id), input, uuid(assignmentId));
  }
  @Post('permission-grants')
  grant(@Req() request: Request, @Param('id') id: string, @Body() input: PermissionDto) {
    return this.grants.permission(request, uuid(id), input);
  }
  @Post('permission-grants/:grantId/revoke')
  @HttpCode(200)
  revoke(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('grantId') grantId: string,
    @Body() input: PermissionDto,
  ) {
    return this.grants.permission(request, uuid(id), input, uuid(grantId));
  }
}
