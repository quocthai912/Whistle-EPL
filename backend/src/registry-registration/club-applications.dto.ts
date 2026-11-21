import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
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

export class ProposedPlayerItemDto {
  @IsUUID('4')
  playerId!: string;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsInt()
  @Min(1)
  @Max(99)
  shirtNumber?: number | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  notes?: string | null;
}

export class CreateClubApplicationDto {
  @IsUUID('4')
  clubId!: string;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  coachName?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  homeStadiumId?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  representativeName?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  representativePhone?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  contactAddress?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  notes?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => ProposedPlayerItemDto)
  proposedPlayers?: ProposedPlayerItemDto[];
}

export class UpdateClubApplicationDraftDto extends RevisionDto {
  @IsUUID('4')
  versionId!: string;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  coachName?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsUUID('4')
  homeStadiumId?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  representativeName?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  representativePhone?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  contactAddress?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined && value !== null)
  @IsString()
  notes?: string | null;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => ProposedPlayerItemDto)
  proposedPlayers?: ProposedPlayerItemDto[];
}

export class ClubApplicationActionDto extends RevisionDto {
  @IsUUID('4')
  versionId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
