import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import type { PipeTransform } from '@nestjs/common';
import { ApplicationError } from '../platform/application-error';
export class LoginDto {
  @IsString() @Matches(/^[a-z0-9][a-z0-9._-]{2,49}$/i) username!: string;
  @IsString() @MinLength(1) @MaxLength(256) password!: string;
}
export class ChangePasswordDto {
  @IsString() @MinLength(1) @MaxLength(256) currentPassword!: string;
  @IsString() @MinLength(1) @MaxLength(256) newPassword!: string;
}
export class EmptyBodyPipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (
      value !== undefined &&
      (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length)
    )
      throw new ApplicationError(400, 'VALIDATION_FAILED', 'Thao tác không nhận dữ liệu.');
    return value;
  }
}
