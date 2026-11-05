import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AccountsService } from './accounts.service';
import {
  CreateAccountDto,
  EditAccountDto,
  ResetAccountDto,
  RevisionDto,
  SystemRoleDto,
  uuid,
} from './accounts.dto';

@Controller('api/v1/accounts')
export class AccountsController {
  constructor(@Inject(AccountsService) private readonly accounts: AccountsService) {}
  @Get()
  list(@Req() request: Request, @Query() query: Record<string, unknown>) {
    return this.accounts.list(request, query);
  }
  @Post()
  create(@Req() request: Request, @Body() input: CreateAccountDto) {
    return this.accounts.create(request, input);
  }
  @Patch(':id')
  edit(@Req() request: Request, @Param('id') id: string, @Body() input: EditAccountDto) {
    return this.accounts.edit(request, uuid(id), input);
  }
  @Post(':id/reset-password')
  @HttpCode(200)
  reset(@Req() request: Request, @Param('id') id: string, @Body() input: ResetAccountDto) {
    return this.accounts.reset(request, uuid(id), input);
  }
  @Post(':id/lock')
  @HttpCode(200)
  lock(@Req() request: Request, @Param('id') id: string, @Body() input: RevisionDto) {
    return this.accounts.state(request, uuid(id), 'LOCKED', input);
  }
  @Post(':id/unlock')
  @HttpCode(200)
  unlock(@Req() request: Request, @Param('id') id: string, @Body() input: RevisionDto) {
    return this.accounts.state(request, uuid(id), 'ACTIVE', input);
  }
  @Post(':id/system-role-assignments')
  grant(@Req() request: Request, @Param('id') id: string, @Body() input: SystemRoleDto) {
    return this.accounts.systemRole(request, uuid(id), input);
  }
  @Post(':id/system-role-assignments/:assignmentId/revoke')
  @HttpCode(200)
  revoke(
    @Req() request: Request,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
    @Body() input: RevisionDto,
  ) {
    return this.accounts.systemRole(request, uuid(id), input, uuid(assignmentId));
  }
}
