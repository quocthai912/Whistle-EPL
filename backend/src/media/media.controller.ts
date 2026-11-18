import { Controller, Get, Inject, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { uuid } from '../identity-access/accounts.dto';
import { markValidatedFileResponse } from '../platform/response-envelope.interceptor';
import { MediaService } from './media.service';

@Controller('api/v1/media')
export class MediaController {
  constructor(@Inject(MediaService) private readonly media: MediaService) {}

  @Get(':assetId')
  async logo(
    @Req() request: Request,
    @Param('assetId') assetId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const bytes = await this.media.readCurrent(request, uuid(assetId));
    return markValidatedFileResponse(response, bytes, 'image/webp');
  }
}
