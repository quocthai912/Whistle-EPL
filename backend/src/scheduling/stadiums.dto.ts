import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { MasterDuplicateReviewDto } from '../platform/master-profile.dto';

export class CreateStadiumDto extends MasterDuplicateReviewDto {
  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  location?: string | null;
}

export class UpdateStadiumDto extends MasterDuplicateReviewDto {
  @IsString()
  @Matches(/^[1-9][0-9]{0,18}$/)
  expectedRevision!: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  location?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  correctionReason?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  correctionBasis?: string;
}
