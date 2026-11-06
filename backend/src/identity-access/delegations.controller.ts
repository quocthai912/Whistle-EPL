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
import { uuid } from './accounts.dto';
import {
  CreateDelegationDto,
  DecisionDto,
  EditDelegationDto,
  RevocationDto,
  VersionDto,
} from './delegation.dto';
import { DelegationProposalService } from './delegation-proposal.service';

@Controller('api/v1')
export class DelegationsController {
  constructor(
    @Inject(DelegationProposalService) private readonly delegation: DelegationProposalService,
  ) {}
  @Get('delegation-proposals')
  proposals(@Req() request: Request, @Query() query: Record<string, unknown>) {
    return this.delegation.proposals(request, query);
  }
  @Get('delegation-grants')
  grants(@Req() request: Request, @Query() query: Record<string, unknown>) {
    return this.delegation.grants(request, query);
  }
  @Post('delegation-proposals')
  create(@Req() request: Request, @Body() input: CreateDelegationDto) {
    return this.delegation.create(request, input);
  }
  @Patch('delegation-proposals/:id')
  edit(@Req() request: Request, @Param('id') id: string, @Body() input: EditDelegationDto) {
    return this.delegation.edit(request, uuid(id), input);
  }
  @Post('delegation-proposals/:id/submit')
  @HttpCode(200)
  submit(@Req() request: Request, @Param('id') id: string, @Body() input: VersionDto) {
    return this.delegation.transition(request, uuid(id), 'submit', input);
  }
  @Post('delegation-proposals/:id/cancel')
  @HttpCode(200)
  cancel(@Req() request: Request, @Param('id') id: string, @Body() input: VersionDto) {
    return this.delegation.transition(request, uuid(id), 'cancel', input);
  }
  @Post('delegation-proposals/:id/return')
  @HttpCode(200)
  returnProposal(@Req() request: Request, @Param('id') id: string, @Body() input: DecisionDto) {
    return this.delegation.transition(request, uuid(id), 'return', input);
  }
  @Post('delegation-proposals/:id/reject')
  @HttpCode(200)
  reject(@Req() request: Request, @Param('id') id: string, @Body() input: DecisionDto) {
    return this.delegation.transition(request, uuid(id), 'reject', input);
  }
  @Post('delegation-proposals/:id/grant')
  grant(@Req() request: Request, @Param('id') id: string, @Body() input: VersionDto) {
    return this.delegation.grant(request, uuid(id), input);
  }
  @Post('delegation-grants/:id/revoke')
  @HttpCode(200)
  revoke(@Req() request: Request, @Param('id') id: string, @Body() input: RevocationDto) {
    return this.delegation.revoke(request, uuid(id), input);
  }
}
