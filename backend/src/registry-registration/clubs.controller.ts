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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { invalid, RevisionDto, uuid } from '../identity-access/accounts.dto';
import { MediaService } from '../media/media.service';
import { CLUB_LOGO_MAX_BYTES } from '../media/media-validation';
import { MasterAvailabilityDto, MasterAvailabilityService } from '../platform/master-availability';
import { MasterCorrectionImpactService } from '../platform/master-correction-impact';
import { CreateClubDto, RemoveClubLogoDto, UpdateClubDto } from './clubs.dto';
import { ClubsService, requireClubWrite } from './clubs.service';

@Controller('api/v1/clubs')
export class ClubsController {
  constructor(
    @Inject(ClubsService) private readonly clubs: ClubsService,
    @Inject(MediaService) private readonly media: MediaService,
    @Inject(MasterAvailabilityService) private readonly availability: MasterAvailabilityService,
    @Inject(MasterCorrectionImpactService) private readonly impacts: MasterCorrectionImpactService,
  ) {}

  @Get()
  list(@Req() request: Request, @Query() query: Record<string, unknown>) {
    return this.clubs.list(request, query);
  }

  @Get(':clubId')
  detail(@Req() request: Request, @Param('clubId') clubId: string) {
    return this.clubs.detail(request, uuid(clubId));
  }

  @Get(':clubId/history')
  history(
    @Req() request: Request,
    @Param('clubId') clubId: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.clubs.history(request, uuid(clubId), query);
  }

  @Get(':clubId/correction-impact')
  impact(
    @Req() request: Request,
    @Param('clubId') id: string,
    @Query('seasonId') seasonId: string,
  ) {
    return this.impacts.list(request, 'club', uuid(id), uuid(seasonId), requireClubWrite);
  }

  @Post()
  create(@Req() request: Request, @Body() input: CreateClubDto) {
    return this.clubs.create(request, input);
  }

  @Patch(':clubId')
  update(@Req() request: Request, @Param('clubId') clubId: string, @Body() input: UpdateClubDto) {
    return this.clubs.update(request, uuid(clubId), input);
  }

  @Post(':clubId/logo')
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: CLUB_LOGO_MAX_BYTES + 1, files: 1, fields: 1, fieldSize: 64, parts: 2 },
    }),
  )
  uploadLogo(
    @Req() request: Request,
    @Param('clubId') clubId: string,
    @Body() input: RevisionDto,
    @UploadedFile() file: { buffer: Buffer } | undefined,
  ) {
    if (!file?.buffer) throw invalid('Hãy chọn tệp ảnh logo.');
    return this.media.upload(request, uuid(clubId), input.expectedRevision, file.buffer);
  }

  @Post(':clubId/logo/remove')
  @HttpCode(200)
  removeLogo(
    @Req() request: Request,
    @Param('clubId') clubId: string,
    @Body() input: RemoveClubLogoDto,
  ) {
    return this.media.remove(request, uuid(clubId), input.expectedRevision, input.mediaAssetId);
  }

  @Post(':clubId/discontinue')
  @HttpCode(200)
  discontinue(
    @Req() request: Request,
    @Param('clubId') id: string,
    @Body() input: MasterAvailabilityDto,
  ) {
    return this.availability.record(
      request,
      'club',
      uuid(id),
      'discontinue',
      input,
      requireClubWrite,
    );
  }

  @Post(':clubId/resume')
  @HttpCode(200)
  resume(
    @Req() request: Request,
    @Param('clubId') id: string,
    @Body() input: MasterAvailabilityDto,
  ) {
    return this.availability.record(request, 'club', uuid(id), 'resume', input, requireClubWrite);
  }
}
