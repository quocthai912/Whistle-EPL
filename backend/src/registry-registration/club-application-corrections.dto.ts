import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { RevisionDto } from '../identity-access/accounts.dto';

export const AFFECTED_REFERENCE_KINDS = [
  'PLAYER_REGISTRATION',
  'SCHEDULED_MATCH',
  'OFFICIAL_RESULT',
  'OTHER',
] as const;

export type AffectedReferenceKind = (typeof AFFECTED_REFERENCE_KINDS)[number];

export class AffectedReferenceItemDto {
  @IsIn(AFFECTED_REFERENCE_KINDS)
  kind!: AffectedReferenceKind;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  referenceId?: string | null;

  @IsString()
  note!: string;
}

export class ProposeClubApplicationCorrectionDto {
  @IsUUID('4')
  baseAcceptedVersionId!: string;

  @IsOptional()
  @IsString()
  correctionKind?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  coachName?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsUUID('4')
  homeStadiumId?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  representativeName?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  representativePhone?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  contactAddress?: string;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  notes?: string | null;

  @IsString()
  correctionReason!: string;

  @IsString()
  correctionEvidence!: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => AffectedReferenceItemDto)
  affectedReferences?: AffectedReferenceItemDto[];
}

export class UpdateClubApplicationCorrectionDraftDto extends RevisionDto {
  @IsOptional()
  @IsString()
  correctionKind?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  coachName?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsUUID('4')
  homeStadiumId?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  representativeName?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  representativePhone?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsString()
  contactAddress?: string;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  correctionReason?: string;

  @IsOptional()
  @IsString()
  correctionEvidence?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => AffectedReferenceItemDto)
  affectedReferences?: AffectedReferenceItemDto[];
}

export class ClubApplicationCorrectionActionDto extends RevisionDto {
  @IsOptional()
  @IsUUID('4')
  baseAcceptedVersionId?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
