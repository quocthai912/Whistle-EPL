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
  CreateRegulationDraftDto,
  RegulationVersionActionDto,
  UpdateRegulationDraftDto,
} from './regulation.dto';
import { RegulationsService } from './regulations.service';

const versionActionRoutes = ['submit', 'withdraw', 'return', 'reject', 'approve'].map(
  (action) => `regulation-versions/:versionId/${action}`,
);

@Controller('api/v1')
export class RegulationsController {
  constructor(@Inject(RegulationsService) private readonly regulations: RegulationsService) {}

  @Get('regulation-seasons')
  seasons(@Req() request: Request) {
    return this.regulations.seasons(request);
  }

  @Get('seasons/:seasonId/regulation-versions')
  list(
    @Req() request: Request,
    @Param('seasonId') seasonId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.regulations.list(request, uuid(seasonId), query);
  }

  @Post('seasons/:seasonId/regulation-versions')
  @HttpCode(201)
  createDraft(
    @Req() request: Request,
    @Param('seasonId') seasonId: string,
    @Body() input: CreateRegulationDraftDto,
  ) {
    return this.regulations.createDraft(request, uuid(seasonId), input);
  }

  @Get('regulation-versions/:versionId')
  detail(@Req() request: Request, @Param('versionId') versionId: string) {
    return this.regulations.detail(request, uuid(versionId));
  }

  @Get('regulation-versions/:versionId/history')
  history(
    @Req() request: Request,
    @Param('versionId') versionId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.regulations.history(request, uuid(versionId), query);
  }

  @Patch('regulation-versions/:versionId')
  @HttpCode(200)
  updateDraft(
    @Req() request: Request,
    @Param('versionId') versionId: string,
    @Body() input: UpdateRegulationDraftDto,
  ) {
    return this.regulations.updateDraft(request, uuid(versionId), input);
  }

  @Post(versionActionRoutes)
  @HttpCode(200)
  transition(
    @Req() request: Request,
    @Param('versionId') versionId: string,
    @Body() input: RegulationVersionActionDto,
  ) {
    return this.regulations.transition(
      request,
      uuid(versionId),
      request.path.split('/').filter(Boolean).at(-1)!,
      input,
    );
  }
}
