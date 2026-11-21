import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { invalid, RevisionDto, uuid } from '../identity-access/accounts.dto';
import { PLAYER_PORTRAIT_MAX_BYTES } from '../media/media-validation';
import { PlayerPortraitsService } from './player-portraits.service';
import { RemovePlayerPortraitDto } from './players.dto';

@Controller('api/v1/players')
export class PlayerPortraitsController {
  constructor(@Inject(PlayerPortraitsService) private readonly portraits: PlayerPortraitsService) {}

  @Post(':playerId/portrait')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: PLAYER_PORTRAIT_MAX_BYTES,
        files: 1,
        fields: 1,
        fieldSize: 64,
        parts: 2,
      },
    }),
  )
  uploadPortrait(
    @Req() request: Request,
    @Param('playerId') playerId: string,
    @Body() input: RevisionDto,
    @UploadedFile() file: { buffer: Buffer } | undefined,
  ) {
    if (!file?.buffer) throw invalid('Hãy chọn tệp ảnh chân dung.');
    return this.portraits.upload(request, uuid(playerId), input.expectedRevision, file.buffer);
  }

  @Post(':playerId/portrait/remove')
  @HttpCode(200)
  removePortrait(
    @Req() request: Request,
    @Param('playerId') playerId: string,
    @Body() input: RemovePlayerPortraitDto,
  ) {
    return this.portraits.remove(
      request,
      uuid(playerId),
      input.expectedRevision,
      input.mediaAssetId,
    );
  }
}
