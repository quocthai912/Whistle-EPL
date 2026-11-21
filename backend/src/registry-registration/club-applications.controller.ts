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
import { uuid } from '../identity-access/accounts.dto';
import {
  ClubApplicationActionDto,
  CreateClubApplicationDto,
  UpdateClubApplicationDraftDto,
} from './club-applications.dto';
import { ClubApplicationsService } from './club-applications.service';

@Controller('api/v1')
export class ClubApplicationsController {
  constructor(
    @Inject(ClubApplicationsService) private readonly applications: ClubApplicationsService,
  ) {}

  @Get('seasons/:seasonId/club-applications/references')
  references(@Req() request: Request, @Param('seasonId') seasonId: string) {
    return this.applications.references(request, uuid(seasonId));
  }

  @Get('seasons/:seasonId/club-applications')
  list(
    @Req() request: Request,
    @Param('seasonId') seasonId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.applications.list(request, uuid(seasonId), query);
  }

  @Post('seasons/:seasonId/club-applications')
  createDraft(
    @Req() request: Request,
    @Param('seasonId') seasonId: string,
    @Body() input: CreateClubApplicationDto,
  ) {
    return this.applications.createDraft(request, uuid(seasonId), input);
  }

  @Get('club-applications/:caseId')
  detail(@Req() request: Request, @Param('caseId') caseId: string) {
    return this.applications.detail(request, uuid(caseId));
  }

  @Get('club-applications/:caseId/history')
  history(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.applications.history(request, uuid(caseId), query);
  }

  @Patch('club-applications/:caseId/draft')
  updateDraft(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Body() input: UpdateClubApplicationDraftDto,
  ) {
    return this.applications.updateDraft(request, uuid(caseId), input);
  }

  @Post('club-applications/:caseId/:action')
  @HttpCode(200)
  act(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Param('action') action: string,
    @Body() input: ClubApplicationActionDto,
  ) {
    return this.applications.act(request, uuid(caseId), action, input);
  }
}
