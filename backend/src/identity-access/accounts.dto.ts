import { IsIn, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { ApplicationError } from '../platform/application-error';
import { normalizeMultilineText } from '../platform/business-text';

export const systemRole = 'SYSTEM_ADMINISTRATOR';
export const seasonalRoles = [
  'SEASON_MANAGER',
  'REGISTRATION_OFFICER',
  'SCHEDULING_OFFICER',
  'RESULTS_OFFICER',
] as const;
export const permissionKinds = [
  'CLUB_MASTER',
  'STADIUM_MASTER',
  'PLAYER_MASTER',
  'CREATE_SEASON',
] as const;
export type PermissionKind = (typeof permissionKinds)[number];

export const invalid = (message = 'Vui lòng kiểm tra dữ liệu đã nhập.') =>
  new ApplicationError(400, 'VALIDATION_FAILED', message);
export const denied = () =>
  new ApplicationError(403, 'ACCESS_DENIED', 'Bạn không có quyền thực hiện thao tác này.');
export const missing = () => new ApplicationError(404, 'NOT_FOUND', 'Không tìm thấy dữ liệu.');
export const conflict = (
  code = 'STATE_CONFLICT',
  message = 'Dữ liệu đã thay đổi. Vui lòng tải lại.',
) => new ApplicationError(409, code, message);

export class RevisionDto {
  @IsString()
  @Matches(/^[1-9][0-9]{0,18}$/)
  expectedRevision!: string;
}
export class CreateAccountDto {
  @IsString() personnelCode!: string;
  @IsString() fullName!: string;
  @IsString() @MaxLength(50) username!: string;
  @IsString() @MaxLength(128) temporaryPassword!: string;
}
export class EditAccountDto extends RevisionDto {
  @IsString() fullName!: string;
}
export class ResetAccountDto extends RevisionDto {
  @IsString() @MaxLength(128) temporaryPassword!: string;
}
export class SystemRoleDto extends RevisionDto {
  @IsIn([systemRole]) roleCode!: typeof systemRole;
}
export class SeasonRoleDto extends RevisionDto {
  @IsUUID('4') seasonId!: string;
  @IsIn(seasonalRoles) roleCode!: (typeof seasonalRoles)[number];
}
export class PermissionDto extends RevisionDto {
  @IsIn(permissionKinds) kind!: PermissionKind;
}

export function uuid(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
    throw invalid();
  return value.toLowerCase();
}
export function businessText(input: string, field: 'name' | 'reason', required = true): string {
  const value =
    field === 'name'
      ? input.normalize('NFC').trim().replace(/\s+/gu, ' ')
      : normalizeMultilineText(input);
  const max = field === 'name' ? 200 : 2000;
  if (
    (required && !value) ||
    [...value].length > max ||
    value.includes('\0') ||
    Buffer.from(value).toString() !== value
  )
    throw invalid();
  return value;
}
export function assertRevision(current: bigint, expected: string): void {
  if (current.toString() !== expected) throw conflict('REVISION_CONFLICT');
}
export function listQuery(
  query: Record<string, unknown>,
  filters: readonly string[],
  sorts: readonly string[],
) {
  if (
    Object.keys(query).some((key) => !['page', 'pageSize', 'sort', ...filters].includes(key)) ||
    Object.values(query).some((value) => typeof value !== 'string')
  )
    throw invalid();
  const values = query as Record<string, string | undefined>;
  const integer = (value: string, max: number) => {
    if (!/^[1-9][0-9]*$/.test(value) || Number(value) > max) throw invalid();
    return Number(value);
  };
  const page = integer(values.page ?? '1', 20_000_000);
  const pageSize = integer(values.pageSize ?? '20', 100);
  const sort = values.sort ?? sorts[0];
  if (!sorts.includes(sort)) throw invalid();
  return { values, page, pageSize, sort, skip: (page - 1) * pageSize, take: pageSize };
}
