import { Body, Controller, Get, HttpCode, Inject, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { uuid } from '../identity-access/accounts.dto';
import {
  CancelRegistrationPlanDto,
  ChangeRegistrationPlanDto,
  TerminateRegistrationDto,
  TransferRegistrationDto,
} from './registration-plans.dto';
import { RegistrationPlansService } from './registration-plans.service';

@Controller('api/v1')
export class RegistrationPlansController {
  constructor(
    @Inject(RegistrationPlansService)
    private readonly plansService: RegistrationPlansService,
  ) {}

  @Get('player-registrations/:caseId/plans')
  plans(@Req() request: Request, @Param('caseId') caseId: string) {
    return this.plansService.plans(request, uuid(caseId));
  }

  @Post('player-registrations/:caseId/terminate')
  @HttpCode(200)
  terminate(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Body() input: TerminateRegistrationDto,
  ) {
    return this.plansService.terminate(request, uuid(caseId), input);
  }

  @Post('player-registrations/:caseId/transfer')
  @HttpCode(200)
  transfer(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Body() input: TransferRegistrationDto,
  ) {
    return this.plansService.transfer(request, uuid(caseId), input);
  }

  @Post('player-registrations/:caseId/plan-change')
  @HttpCode(200)
  planChange(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Body() input: ChangeRegistrationPlanDto,
  ) {
    return this.plansService.planChange(request, uuid(caseId), input);
  }

  @Post('player-registrations/:caseId/plan-cancel')
  @HttpCode(200)
  planCancel(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Body() input: CancelRegistrationPlanDto,
  ) {
    return this.plansService.planCancel(request, uuid(caseId), input);
  }
}
