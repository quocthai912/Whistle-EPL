import { Type } from 'class-transformer';
import {
  Equals,
  IsArray,
  IsObject,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

class DuplicateReviewDto {
  @Equals(true)
  acknowledged!: true;

  @IsArray()
  @IsUUID('4', { each: true })
  candidateIds!: string[];

  @IsString()
  reason!: string;
}

export class MasterDuplicateReviewDto {
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => DuplicateReviewDto)
  duplicateReview?: DuplicateReviewDto;
}
