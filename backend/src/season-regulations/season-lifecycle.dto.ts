import { IsIn, IsString, IsUUID, Matches } from 'class-validator';
import { RevisionDto } from '../identity-access/accounts.dto';

export class PrepareSeasonLifecycleDto {
  @IsIn(['CLOSE', 'REOPEN'])
  action!: 'CLOSE' | 'REOPEN';

  @IsString()
  reason!: string;
}

export class EditSeasonLifecycleDto extends PrepareSeasonLifecycleDto {
  @IsString()
  @Matches(/^[1-9][0-9]{0,18}$/)
  expectedRevision!: string;
}

export class TransitionSeasonLifecycleDto extends RevisionDto {
  @IsUUID('4')
  submittedVersionId!: string;

  @IsString()
  reason!: string;
}
