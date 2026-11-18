import { Type } from 'class-transformer';
import { RevisionDto } from '../identity-access/accounts.dto';
import {
  Equals,
  IsArray,
  IsObject,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class DuplicateReviewDto {
  @Equals(true)
  acknowledged!: true;

  @IsArray()
  @IsUUID('4', { each: true })
  candidateIds!: string[];

  @IsString()
  reason!: string;
}

export class UpdateClubDto extends RevisionDto {
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  name?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  abbreviation?: string;

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

export class RemoveClubLogoDto extends RevisionDto {
  @IsUUID('4')
  mediaAssetId!: string;
}

export class CreateClubDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  abbreviation!: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => DuplicateReviewDto)
  duplicateReview?: DuplicateReviewDto;
}
