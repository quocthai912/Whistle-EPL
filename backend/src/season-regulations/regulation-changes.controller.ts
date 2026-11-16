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
import { IsIn, IsString, IsUUID, Matches, ValidateIf } from 'class-validator';
import type { Request } from 'express';
import { uuid } from '../identity-access/accounts.dto';
import { RegulationVersionActionDto } from './regulation.dto';
import { RegulationChangeService } from './regulation-change.service';

const changeActionRoutes = ['submit', 'withdraw', 'return', 'reject', 'approve'].map(
  (action) => `regulation-change-requests/:requestId/${action}`,
);

export class CreateRegulationChangeDto {
  @IsIn(['CANCEL', 'REPLACE'])
  action!: 'CANCEL' | 'REPLACE';

  @IsUUID('4')
  waitingVersionId!: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4')
  replacementVersionId?: string;

  @IsString()
  reason!: string;
}

export class EditRegulationChangeDto {
  @IsString()
  @Matches(/^[1-9][0-9]{0,18}$/)
  expectedRevision!: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4')
  waitingVersionId?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4')
  replacementVersionId?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  reason?: string;
}

@Controller('api/v1')
export class RegulationChangesController {
  constructor(@Inject(RegulationChangeService) private readonly changes: RegulationChangeService) {}

  @Get('seasons/:seasonId/regulation-change-requests')
  list(
    @Req() request: Request,
    @Param('seasonId') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.changes.list(request, uuid(id), query);
  }

  @Post('seasons/:seasonId/regulation-change-requests')
  create(
    @Req() request: Request,
    @Param('seasonId') id: string,
    @Body() input: CreateRegulationChangeDto,
  ) {
    return this.changes.create(request, uuid(id), input);
  }

  @Patch('regulation-change-requests/:requestId/draft')
  edit(
    @Req() request: Request,
    @Param('requestId') id: string,
    @Body() input: EditRegulationChangeDto,
  ) {
    return this.changes.edit(request, uuid(id), input);
  }

  @Post(changeActionRoutes)
  @HttpCode(200)
  transition(
    @Req() request: Request,
    @Param('requestId') id: string,
    @Body() input: RegulationVersionActionDto,
  ) {
    return this.changes.transition(
      request,
      uuid(id),
      request.path.split('/').filter(Boolean).at(-1)!,
      input,
    );
  }
}
