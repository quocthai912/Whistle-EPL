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

export class TerminateRegistrationDto extends RevisionDto {
  @IsUUID('4')
  versionId!: string;

  @IsOptional()
  @IsIn(['IMMEDIATE', 'SCHEDULED'])
  effectiveMode?: 'IMMEDIATE' | 'SCHEDULED';

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsISO8601({ strict: true })
  effectiveAt?: string | null;

  @IsString()
  reason!: string;
}

export class TransferRegistrationDto extends RevisionDto {
  @IsUUID('4')
  oldVersionId!: string;

  @IsOptional()
  @IsIn(['IMMEDIATE', 'SCHEDULED'])
  effectiveMode?: 'IMMEDIATE' | 'SCHEDULED';

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsISO8601({ strict: true })
  effectiveAt?: string | null;

  @IsString()
  reason!: string;

  // Option 1: bind to an existing RECEIVED destination registration version (supports D053 receipt exceptions)
  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  destinationCaseId?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  destinationVersionId?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  destinationExpectedRevision?: string | null;

  // Option 2: inline destination registration creation inside an open D053 PLAYER_CHANGE intake window
  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  destinationSeasonId?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  destinationClubId?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsInt()
  @Min(1)
  @Max(99)
  shirtNumber?: number | null;

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
}

export class ChangeRegistrationPlanDto extends RevisionDto {
  @IsUUID('4')
  versionId!: string;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  transferOperationId?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsISO8601({ strict: true })
  playingStart?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsISO8601({ strict: true })
  playingEnd?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsInt()
  @Min(1)
  @Max(99)
  shirtNumber?: number | null;

  @IsString()
  reason!: string;
}

export class CancelRegistrationPlanDto extends RevisionDto {
  @IsUUID('4')
  versionId!: string;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  transferOperationId?: string | null;

  @IsString()
  reason!: string;
}
