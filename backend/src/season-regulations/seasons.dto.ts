import { IsDefined, IsString, ValidateIf } from 'class-validator';
import { RevisionDto } from '../identity-access/accounts.dto';

/** User-controlled fields for creating the otherwise empty Season shell. */
export class CreateSeasonDto {
  @IsDefined()
  @IsString()
  code!: string;

  @IsDefined()
  @IsString()
  name!: string;

  @IsDefined()
  @IsString()
  competitionName!: string;

  @IsDefined()
  @IsString()
  startDate!: string;

  @IsDefined()
  @IsString()
  endDate!: string;
}

/** Only the manager-editable season metadata is accepted; ID, code, and state are immutable here. */
export class UpdateSeasonDto extends RevisionDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  name?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  competitionName?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  startDate?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  endDate?: string;
}
