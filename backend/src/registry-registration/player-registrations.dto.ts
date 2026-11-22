import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { RevisionDto } from '../identity-access/accounts.dto';

export class CreatePlayerRegistrationDto {
  @IsUUID('4')
  clubId!: string;

  @IsUUID('4')
  playerId!: string;

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

  @IsOptional()
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
}

export class UpdatePlayerRegistrationDraftDto extends RevisionDto {
  @IsUUID('4')
  versionId!: string;

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

  @IsOptional()
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
}

export class PlayerRegistrationActionDto {
  @IsUUID('4')
  versionId!: string;

  @IsOptional()
  @IsString()
  expectedRevision?: string;

  @IsOptional()
  @IsString()
  reason?: string;

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

  @IsOptional()
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
}
