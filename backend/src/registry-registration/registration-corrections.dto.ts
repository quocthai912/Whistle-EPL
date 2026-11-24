import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { RevisionDto } from '../identity-access/accounts.dto';
import { AffectedReferenceItemDto } from './club-application-corrections.dto';

export const CORRECTION_DISPOSITIONS = [
  'RETAIN_VALID',
  'END_EFFECTIVITY',
  'RECORD_ERRONEOUS',
] as const;

export type RegistrationCorrectionDisposition = (typeof CORRECTION_DISPOSITIONS)[number];

export class ProposeRegistrationCorrectionDto {
  @IsUUID('4')
  targetVersionId!: string;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsInt()
  @Min(1)
  @Max(99)
  shirtNumber?: number | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsISO8601({ strict: true })
  playingStart?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsISO8601({ strict: true })
  playingEnd?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsBoolean()
  nonHomegrownOptIn?: boolean;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsIn(['SEASONS', 'MONTHS'])
  evidenceBranch?: 'SEASONS' | 'MONTHS' | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsInt()
  @Min(0)
  @Max(1000)
  qualifyingValue?: number | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  evidenceSummary?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  evidenceReference?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsBoolean()
  affiliatedAssociationBasis?: boolean | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  verifiedRegulationVersionId?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsIn(CORRECTION_DISPOSITIONS)
  disposition?: RegistrationCorrectionDisposition;

  @IsString()
  reason!: string;

  @IsString()
  basis!: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => AffectedReferenceItemDto)
  affectedReferences?: AffectedReferenceItemDto[];
}

export class UpdateRegistrationCorrectionDraftDto extends RevisionDto {
  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsInt()
  @Min(1)
  @Max(99)
  shirtNumber?: number | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsISO8601({ strict: true })
  playingStart?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsISO8601({ strict: true })
  playingEnd?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsBoolean()
  nonHomegrownOptIn?: boolean;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsIn(['SEASONS', 'MONTHS'])
  evidenceBranch?: 'SEASONS' | 'MONTHS' | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsInt()
  @Min(0)
  @Max(1000)
  qualifyingValue?: number | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  evidenceSummary?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  evidenceReference?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsBoolean()
  affiliatedAssociationBasis?: boolean | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  verifiedRegulationVersionId?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsIn(CORRECTION_DISPOSITIONS)
  disposition?: RegistrationCorrectionDisposition;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  basis?: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => AffectedReferenceItemDto)
  affectedReferences?: AffectedReferenceItemDto[];
}

export class RegistrationCorrectionActionDto extends RevisionDto {
  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  targetVersionId?: string | null;

  @IsOptional()
  @IsIn(CORRECTION_DISPOSITIONS)
  disposition?: RegistrationCorrectionDisposition;

  @IsOptional()
  @IsString()
  reason?: string;
}
