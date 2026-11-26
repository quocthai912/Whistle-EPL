import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { uuid } from '../identity-access/accounts.dto';
import {
  ProposeRegistrationCorrectionDto,
  RegistrationCorrectionActionDto,
  UpdateRegistrationCorrectionDraftDto,
} from './registration-corrections.dto';
import { RegistrationCorrectionsService } from './registration-corrections.service';

@Controller('api/v1')
export class RegistrationCorrectionsController {
  constructor(
    @Inject(RegistrationCorrectionsService)
    private readonly corrections: RegistrationCorrectionsService,
  ) {}

  @Get('player-registrations/:caseId/corrections')
  list(@Req() request: Request, @Param('caseId') caseId: string) {
    return this.corrections.list(request, uuid(caseId));
  }

  @Post('player-registrations/:caseId/corrections')
  propose(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Body() input: ProposeRegistrationCorrectionDto,
  ) {
    return this.corrections.propose(request, uuid(caseId), input);
  }

  @Patch('player-registrations/:caseId/corrections/:versionId')
  updateDraft(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Param('versionId') versionId: string,
    @Body() input: UpdateRegistrationCorrectionDraftDto,
  ) {
    return this.corrections.updateDraft(request, uuid(caseId), uuid(versionId), input);
  }

  @Post('player-registrations/:caseId/corrections/:versionId/:action')
  @HttpCode(200)
  act(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Param('versionId') versionId: string,
    @Param('action') action: string,
    @Body() input: RegistrationCorrectionActionDto,
  ) {
    return this.corrections.act(request, uuid(caseId), uuid(versionId), action, input);
  }
}
