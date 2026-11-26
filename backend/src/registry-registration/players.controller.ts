import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { uuid } from '../identity-access/accounts.dto';
import { CreatePlayerDto, UpdatePlayerDto } from './players.dto';
import { PlayersService } from './players.service';

@Controller('api/v1/players')
export class PlayersController {
  constructor(@Inject(PlayersService) private readonly players: PlayersService) {}

  @Get('catalogs')
  catalogs(@Req() request: Request) {
    return this.players.catalogs(request);
  }

  @Get()
  list(@Req() request: Request, @Query() query: Record<string, unknown>) {
    return this.players.list(request, query);
  }

  @Get(':playerId')
  detail(@Req() request: Request, @Param('playerId') playerId: string) {
    return this.players.detail(request, uuid(playerId));
  }

  @Get(':playerId/history')
  history(
    @Req() request: Request,
    @Param('playerId') playerId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.players.history(request, uuid(playerId), query);
  }

  @Get(':playerId/correction-impact')
  impact(
    @Req() request: Request,
    @Param('playerId') playerId: string,
    @Query('seasonId') seasonId: string,
  ) {
    return this.players.correctionImpact(request, uuid(playerId), uuid(seasonId));
  }

  @Post()
  create(@Req() request: Request, @Body() input: CreatePlayerDto) {
    return this.players.create(request, input);
  }

  @Patch(':playerId')
  update(
    @Req() request: Request,
    @Param('playerId') playerId: string,
    @Body() input: UpdatePlayerDto,
  ) {
    return this.players.update(request, uuid(playerId), input);
  }
}
