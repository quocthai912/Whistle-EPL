import { IsIn, IsString, IsUUID, Matches, ValidateIf } from 'class-validator';
import { businessText, invalid, RevisionDto, uuid } from './accounts.dto';
import { delegationRoles, type DelegationAction } from './authority.policy';

export const proposalStates = ['DRAFT', 'PENDING', 'RETURNED', 'REJECTED', 'CANCELLED', 'GRANTED'];
export const grantStates = ['SCHEDULED', 'ACTIVE', 'EXPIRED', 'REVOKED', 'TERMINATED'];

export class DelegationContentDto {
  @IsUUID('4') recipientId!: string;
  @IsIn(Object.keys(delegationRoles)) actionCode!: DelegationAction;
  @IsIn(['IMMEDIATE', 'SCHEDULED']) startMode!: 'IMMEDIATE' | 'SCHEDULED';
  @ValidateIf((_: unknown, value: unknown) => value !== undefined) @IsString() startsAt?: string;
  @ValidateIf((_: unknown, value: unknown) => value !== undefined) @IsString() endsAt?: string;
  @ValidateIf((_: unknown, value: unknown) => value !== undefined) @IsString() reason?: string;
}
export class CreateDelegationDto extends DelegationContentDto {
  @IsUUID('4') seasonId!: string;
}
export class EditDelegationDto extends DelegationContentDto implements RevisionDto {
  @IsString() @Matches(/^[1-9][0-9]{0,18}$/) expectedRevision!: string;
}
export class VersionDto extends RevisionDto {
  @IsUUID('4') versionId!: string;
}
export class RevocationDto extends RevisionDto {
  @IsString() reason!: string;
}
export class DecisionDto extends VersionDto {
  @IsString() reason!: string;
}

/** Parses a UTC instant and rejects values that JavaScript would silently normalize to another date. */
function instant(value?: string) {
  if (value === undefined) return null;
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value)) throw invalid();
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 19) !== value.slice(0, 19))
    throw invalid();
  return date;
}
/** Converts allowlisted draft fields to stored values and keeps the immediate start server-owned. */
export function delegationContent(input: DelegationContentDto) {
  if (input.startMode === 'IMMEDIATE' && input.startsAt !== undefined) throw invalid();
  return {
    recipientId: uuid(input.recipientId),
    actionCode: input.actionCode,
    startMode: input.startMode,
    startsAt: instant(input.startsAt),
    endsAt: instant(input.endsAt),
    reason: input.reason === undefined ? null : businessText(input.reason, 'reason', false),
  };
}
