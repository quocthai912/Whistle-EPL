import { Body, Controller, Get, HttpCode, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { uuid } from '../identity-access/accounts.dto';
import { ProposeReceiptExceptionDto, ReceiptExceptionActionDto } from './receipt-exceptions.dto';
import { RegistrationIntakeService } from './registration-intake.service';

@Controller('api/v1')
export class ReceiptExceptionsController {
  constructor(
    @Inject(RegistrationIntakeService) private readonly intake: RegistrationIntakeService,
  ) {}

  @Get('seasons/:seasonId/receipt-exceptions')
  list(
    @Req() request: Request,
    @Param('seasonId') seasonId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.intake.list(request, uuid(seasonId), query);
  }

  @Post('seasons/:seasonId/receipt-exceptions')
  propose(
    @Req() request: Request,
    @Param('seasonId') seasonId: string,
    @Body() input: ProposeReceiptExceptionDto,
  ) {
    return this.intake.propose(request, uuid(seasonId), input);
  }

  @Post('receipt-exceptions/:caseId/:action')
  @HttpCode(200)
  act(
    @Req() request: Request,
    @Param('caseId') caseId: string,
    @Param('action') action: string,
    @Body() input: ReceiptExceptionActionDto,
  ) {
    return this.intake.act(request, uuid(caseId), action, input);
  }
}
