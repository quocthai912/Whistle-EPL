import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  MethodNotAllowedException,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { uuid } from '../identity-access/accounts.dto';
import { CreateSeasonDto, UpdateSeasonDto } from './seasons.dto';
import { SeasonsService } from './seasons.service';

@Controller('api/v1/seasons')
export class SeasonsController {
  constructor(@Inject(SeasonsService) private readonly seasons: SeasonsService) {}

  @Get()
  list(@Req() request: Request, @Query() query: Record<string, unknown>) {
    if (request.method !== 'GET') throw new MethodNotAllowedException();
    return this.seasons.list(request, query);
  }

  @Post()
  @HttpCode(201)
  create(@Req() request: Request, @Body() input: CreateSeasonDto) {
    return this.seasons.create(request, input);
  }

  @Get(':seasonId')
  detail(@Req() request: Request, @Param('seasonId') seasonId: string) {
    if (request.method !== 'GET') throw new MethodNotAllowedException();
    return this.seasons.detail(request, uuid(seasonId));
  }

  @Patch(':seasonId')
  @HttpCode(200)
  update(
    @Req() request: Request,
    @Param('seasonId') seasonId: string,
    @Body() input: UpdateSeasonDto,
  ) {
    return this.seasons.update(request, uuid(seasonId), input);
  }

  @Get(':seasonId/history')
  history(
    @Req() request: Request,
    @Param('seasonId') seasonId: string,
    @Query() query: Record<string, unknown>,
  ) {
    if (request.method !== 'GET') throw new MethodNotAllowedException();
    return this.seasons.history(request, uuid(seasonId), query);
  }
}
