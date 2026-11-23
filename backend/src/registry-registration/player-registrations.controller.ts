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
  CreatePlayerRegistrationDto,
  PlayerRegistrationActionDto,
  UpdatePlayerRegistrationDraftDto,
} from './player-registrations.dto';
import { PlayerRegistrationsService } from './player-registrations.service';

@Controller('api/v1')
export class PlayerRegistrationsController {
  constructor(
    @Inject(PlayerRegistrationsService)
    private readonly registrations: PlayerRegistrationsService,
  ) {}

  @Get('seasons/:seasonId/player-registrations/references')
  references(@Req() request: Request, @Param('seasonId') seasonId: string) {
    return this.registrations.references(request, uuid(seasonId));
  }

  @Get('seasons/:seasonId/player-registrations')
  list(
    @Req() request: Request,
    @Param('seasonId') seasonId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.registrations.list(request, uuid(seasonId), query);
  }

  @Post('seasons/:seasonId/player-registrations')
  createDraft(
    @Req() request: Request,
    @Param('seasonId') seasonId: string,
    @Body() input: CreatePlayerRegistrationDto,
  ) {
    return this.registrations.createDraft(request, uuid(seasonId), input);
  }

  @Get('player-registrations/:caseId')
  detail(@Req() request: Request, @Param('caseId') caseId: string) {
    return this.registrations.detail(request, uuid(caseId));
  }

  @Get('player-registrations/:caseId/history')
  history(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.registrations.history(request, uuid(caseId), query);
  }

  @Patch('player-registrations/:caseId/draft')
  updateDraft(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Body() input: UpdatePlayerRegistrationDraftDto,
  ) {
    return this.registrations.updateDraft(request, uuid(caseId), input);
  }

  @Post('player-registrations/:caseId/:action')
  @HttpCode(200)
  act(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Param('action') action: string,
    @Body() input: PlayerRegistrationActionDto,
  ) {
    return this.registrations.act(request, uuid(caseId), action, input);
  }
}
