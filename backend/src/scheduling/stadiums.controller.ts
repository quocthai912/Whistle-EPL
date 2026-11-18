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
import { MasterAvailabilityDto, MasterAvailabilityService } from '../platform/master-availability';
import { MasterCorrectionImpactService } from '../platform/master-correction-impact';
import { CreateStadiumDto, UpdateStadiumDto } from './stadiums.dto';
import { StadiumsService, requireStadiumWrite } from './stadiums.service';

@Controller('api/v1/stadiums')
export class StadiumsController {
  constructor(
    @Inject(StadiumsService) private readonly stadiums: StadiumsService,
    @Inject(MasterAvailabilityService) private readonly availability: MasterAvailabilityService,
    @Inject(MasterCorrectionImpactService) private readonly impacts: MasterCorrectionImpactService,
  ) {}

  @Get()
  list(@Req() request: Request, @Query() query: Record<string, unknown>) {
    return this.stadiums.list(request, query);
  }

  @Get(':stadiumId')
  detail(@Req() request: Request, @Param('stadiumId') id: string) {
    return this.stadiums.detail(request, uuid(id));
  }

  @Get(':stadiumId/history')
  history(
    @Req() request: Request,
    @Param('stadiumId') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.stadiums.history(request, uuid(id), query);
  }

  @Get(':stadiumId/correction-impact')
  impact(
    @Req() request: Request,
    @Param('stadiumId') id: string,
    @Query('seasonId') seasonId: string,
  ) {
    return this.impacts.list(request, 'stadium', uuid(id), uuid(seasonId), requireStadiumWrite);
  }

  @Post()
  create(@Req() request: Request, @Body() input: CreateStadiumDto) {
    return this.stadiums.create(request, input);
  }

  @Patch(':stadiumId')
  update(@Req() request: Request, @Param('stadiumId') id: string, @Body() input: UpdateStadiumDto) {
    return this.stadiums.update(request, uuid(id), input);
  }

  @Post(':stadiumId/discontinue')
  @HttpCode(200)
  discontinue(
    @Req() request: Request,
    @Param('stadiumId') id: string,
    @Body() input: MasterAvailabilityDto,
  ) {
    return this.availability.record(
      request,
      'stadium',
      uuid(id),
      'discontinue',
      input,
      requireStadiumWrite,
    );
  }

  @Post(':stadiumId/resume')
  @HttpCode(200)
  resume(
    @Req() request: Request,
    @Param('stadiumId') id: string,
    @Body() input: MasterAvailabilityDto,
  ) {
    return this.availability.record(
      request,
      'stadium',
      uuid(id),
      'resume',
      input,
      requireStadiumWrite,
    );
  }
}
