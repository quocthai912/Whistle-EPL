import { Type } from 'class-transformer';
import { IsObject, IsString, IsUUID, ValidateIf, ValidateNested } from 'class-validator';
import { RevisionDto } from '../identity-access/accounts.dto';
import { DuplicateReviewDto } from './clubs.dto';

export class CreatePlayerDto {
  @IsString()
  code!: string;

  @IsString()
  fullName!: string;

  @IsString()
  birthDate!: string;

  @IsString()
  nationalityCode!: string;

  @IsString()
  positionCode!: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => DuplicateReviewDto)
  duplicateReview?: DuplicateReviewDto;
}

export class UpdatePlayerDto extends RevisionDto {
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  fullName?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  birthDate?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  nationalityCode?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  positionCode?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  correctionReason?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  correctionBasis?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => DuplicateReviewDto)
  duplicateReview?: DuplicateReviewDto;
}

export class RemovePlayerPortraitDto extends RevisionDto {
  @IsUUID('4')
  mediaAssetId!: string;
}
