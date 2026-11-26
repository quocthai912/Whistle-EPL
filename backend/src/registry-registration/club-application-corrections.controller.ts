import { Body, Controller, Get, HttpCode, Inject, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { uuid } from '../identity-access/accounts.dto';
import {
  ClubApplicationCorrectionActionDto,
  ProposeClubApplicationCorrectionDto,
  UpdateClubApplicationCorrectionDraftDto,
} from './club-application-corrections.dto';
import { ClubApplicationCorrectionsService } from './club-application-corrections.service';

@Controller('api/v1')
export class ClubApplicationCorrectionsController {
  constructor(
    @Inject(ClubApplicationCorrectionsService)
    private readonly corrections: ClubApplicationCorrectionsService,
  ) {}

  @Get('club-applications/:caseId/corrections')
  list(@Req() request: Request, @Param('caseId') caseId: string) {
    return this.corrections.list(request, uuid(caseId));
  }

  @Post('club-applications/:caseId/corrections')
  propose(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Body() input: ProposeClubApplicationCorrectionDto,
  ) {
    return this.corrections.propose(request, uuid(caseId), input);
  }

  @Patch('club-applications/:caseId/corrections/:versionId')
  updateDraft(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Param('versionId') versionId: string,
    @Body() input: UpdateClubApplicationCorrectionDraftDto,
  ) {
    return this.corrections.updateDraft(request, uuid(caseId), uuid(versionId), input);
  }

  @Post('club-applications/:caseId/corrections/:versionId/:action')
  @HttpCode(200)
  act(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Param('versionId') versionId: string,
    @Param('action') action: string,
    @Body() input: ClubApplicationCorrectionActionDto,
  ) {
    return this.corrections.act(request, uuid(caseId), uuid(versionId), action, input);
  }
}
