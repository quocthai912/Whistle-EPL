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
  EditSeasonLifecycleDto,
  PrepareSeasonLifecycleDto,
  TransitionSeasonLifecycleDto,
} from './season-lifecycle.dto';
import { SeasonLifecycleService } from './season-lifecycle.service';

@Controller('api/v1')
export class SeasonLifecycleController {
  constructor(@Inject(SeasonLifecycleService) private readonly lifecycle: SeasonLifecycleService) {}

  @Get('seasons/:seasonId/lifecycle-requests')
  list(
    @Req() request: Request,
    @Param('seasonId') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.lifecycle.list(request, uuid(id), query);
  }

  @Post('seasons/:seasonId/lifecycle-requests')
  create(
    @Req() request: Request,
    @Param('seasonId') id: string,
    @Body() input: PrepareSeasonLifecycleDto,
  ) {
    return this.lifecycle.create(request, uuid(id), input);
  }

  @Patch('season-lifecycle-requests/:requestId/draft')
  edit(
    @Req() request: Request,
    @Param('requestId') id: string,
    @Body() input: EditSeasonLifecycleDto,
  ) {
    return this.lifecycle.edit(request, uuid(id), input);
  }

  @Get('season-lifecycle-requests/:requestId')
  detail(
    @Req() request: Request,
    @Param('requestId') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.lifecycle.detail(request, uuid(id), query);
  }

  @Post('season-lifecycle-requests/:requestId/:action')
  @HttpCode(200)
  transition(
    @Req() request: Request,
    @Param('requestId') id: string,
    @Param('action') action: string,
    @Body() input: TransitionSeasonLifecycleDto,
  ) {
    return this.lifecycle.transition(request, uuid(id), action, input);
  }
}
