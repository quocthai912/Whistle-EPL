import { IsBoolean, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { RevisionDto } from '../identity-access/accounts.dto';

export class ProposeReceiptExceptionDto {
  @IsIn(['CLUB_APPLICATION', 'PLAYER_REGISTRATION'])
  targetKind!: 'CLUB_APPLICATION' | 'PLAYER_REGISTRATION';

  @IsUUID('4')
  targetVersionId!: string;

  @IsString()
  reason!: string;

  @IsString()
  basis!: string;

  @IsOptional()
  @IsBoolean()
  submitImmediately?: boolean;
}

export class ReceiptExceptionActionDto extends RevisionDto {
  @IsUUID('4')
  versionId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
