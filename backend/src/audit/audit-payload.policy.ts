import type { Prisma } from '../generated/prisma/client';

const accountFields = ['personnelCode', 'fullName', 'username', 'state', 'mustChangePassword'];
// Each action owns its projection. No credential/token/hash or unrestricted snapshot field.
const existingPolicies = {
  ADMIN_BOOTSTRAPPED: [...accountFields, 'roleCode'],
  ADMIN_RECOVERED: ['state', 'mustChangePassword', 'sessionsInvalidated', 'reset', 'unlock'],
  ACCOUNT_CREATED: accountFields,
  ACCOUNT_UPDATED: ['fullName'],
  ACCOUNT_LOCKED: ['state', 'sessionsInvalidated'],
  ACCOUNT_UNLOCKED: ['state'],
  PASSWORD_RESET: ['mustChangePassword', 'sessionsInvalidated'],
  PASSWORD_CHANGED: ['mustChangePassword', 'sessionsInvalidated'],
  LOGIN_SUCCEEDED: [],
  LOGOUT_SUCCEEDED: [],
  SESSIONS_INVALIDATED: ['sessionsInvalidated', 'cause'],
  SYSTEM_ROLE_GRANTED: ['assignmentId', 'roleCode', 'granted'],
  SYSTEM_ROLE_REVOKED: ['assignmentId', 'roleCode', 'granted'],
  SEASON_ROLE_GRANTED: ['assignmentId', 'roleCode', 'seasonId', 'granted'],
  SEASON_ROLE_REVOKED: ['assignmentId', 'roleCode', 'seasonId', 'granted'],
  SHARED_GRANT_GRANTED: ['grantId', 'masterKind', 'granted'],
  SHARED_GRANT_ENDED: ['grantId', 'masterKind', 'granted'],
  CREATE_SEASON_GRANTED: ['grantId', 'granted'],
  CREATE_SEASON_REVOKED: ['grantId', 'granted'],
  DELEGATION_DRAFTED: [
    'state',
    'reason',
    'versionId',
    'versionNumber',
    'recipientId',
    'actionCode',
    'startMode',
    'startsAt',
    'endsAt',
  ],
  DELEGATION_EDITED: [
    'state',
    'reason',
    'versionId',
    'versionNumber',
    'recipientId',
    'actionCode',
    'startMode',
    'startsAt',
    'endsAt',
  ],
  DELEGATION_SUBMITTED: ['versionId', 'versionNumber', 'state'],
  DELEGATION_RETURNED: ['versionId', 'state'],
  DELEGATION_REJECTED: ['versionId', 'state'],
  DELEGATION_CANCELLED: ['versionId', 'state'],
  DELEGATION_GRANTED: [
    'grantId',
    'versionId',
    'recipientId',
    'actionCode',
    'startsAt',
    'endsAt',
    'state',
  ],
  DELEGATION_REVOKED: ['grantId', 'state', 'sessionsInvalidated', 'effectiveAt'],
  DELEGATION_TERMINATED: ['grantId', 'state', 'sessionsInvalidated', 'effectiveAt'],
  DELEGATION_STARTED: ['grantId', 'state', 'sessionsInvalidated', 'effectiveAt'],
  DELEGATION_EXPIRED: ['grantId', 'state', 'sessionsInvalidated', 'effectiveAt'],
} as const;
const businessPolicies = {
  SEASON_CREATED: ['code', 'name', 'competitionName', 'startDate', 'endDate'],
  SEASON_UPDATED: ['name', 'competitionName', 'startDate', 'endDate'],
  REGULATION_DRAFT_CREATED: ['versionId', 'versionNumber', 'state', 'revision'],
  REGULATION_DRAFT_UPDATED: ['versionId', 'versionNumber', 'state', 'revision'],
  REGULATION_SUBMITTED: [
    'versionId',
    'versionNumber',
    'state',
    'revision',
    'submittedAt',
    'effectiveMode',
    'proposedEffectiveAt',
  ],
  REGULATION_WITHDRAWN: [
    'versionId',
    'versionNumber',
    'state',
    'revision',
    'submittedAt',
    'decidedAt',
    'decidedBy',
    'decisionReason',
  ],
  REGULATION_RETURNED: [
    'versionId',
    'versionNumber',
    'state',
    'revision',
    'submittedAt',
    'decidedAt',
    'decidedBy',
    'decisionReason',
  ],
  REGULATION_REJECTED: [
    'versionId',
    'versionNumber',
    'state',
    'revision',
    'submittedAt',
    'decidedAt',
    'decidedBy',
    'decisionReason',
  ],
  REGULATION_APPROVED: [
    'versionId',
    'versionNumber',
    'state',
    'effectiveMode',
    'effectiveAt',
    'proposedEffectiveAt',
  ],
  REGULATION_ACTIVATED: ['versionId', 'state', 'activeFrom', 'processedAt'],
  REGULATION_ACTIVATION_BLOCKED: ['versionId', 'state', 'proposedEffectiveAt', 'blockedAt'],
  REGULATION_CHANGE_SUBMITTED: ['requestId', 'versionId', 'versionNumber', 'state'],
  REGULATION_CHANGE_WITHDRAWN: ['requestId', 'versionId', 'versionNumber', 'state'],
  REGULATION_CHANGE_RETURNED: ['requestId', 'versionId', 'versionNumber', 'state'],
  REGULATION_CHANGE_REJECTED: ['requestId', 'versionId', 'versionNumber', 'state'],
  REGULATION_CHANGE_APPROVED: [
    'requestId',
    'versionId',
    'versionNumber',
    'state',
    'action',
    'waitingVersionId',
    'replacementVersionId',
    'approvedAt',
  ],
  SEASON_LIFECYCLE_DRAFT_CREATED: ['requestId', 'versionId', 'versionNumber', 'action', 'state'],
  SEASON_LIFECYCLE_DRAFT_UPDATED: ['requestId', 'versionId', 'versionNumber', 'action', 'state'],
  SEASON_LIFECYCLE_SUBMITTED: [
    'requestId',
    'versionId',
    'versionNumber',
    'action',
    'state',
    'summaryVersionId',
  ],
  SEASON_LIFECYCLE_WITHDRAWN: ['requestId', 'versionId', 'versionNumber', 'action', 'state'],
  SEASON_LIFECYCLE_RETURNED: ['requestId', 'versionId', 'versionNumber', 'action', 'state'],
  SEASON_LIFECYCLE_REJECTED: ['requestId', 'versionId', 'versionNumber', 'action', 'state'],
  SEASON_LIFECYCLE_APPROVED: [
    'requestId',
    'versionId',
    'versionNumber',
    'state',
    'action',
    'summaryVersionId',
    'approvedAt',
  ],
  CLUB_CREATED: ['code', 'name', 'abbreviation'],
  CLUB_UPDATED: ['name', 'abbreviation'],
  CLUB_CORRECTED: ['name', 'abbreviation', 'correctionBasis', 'duplicateReviewReason'],
  CLUB_DISCONTINUED: ['discontinuedAt', 'effectiveAt'],
  CLUB_RESUMED: ['discontinuedAt', 'effectiveAt'],
  STADIUM_CREATED: ['code', 'name', 'location'],
  STADIUM_UPDATED: ['name', 'location'],
  STADIUM_CORRECTED: ['name', 'location', 'correctionBasis', 'duplicateReviewReason'],
  STADIUM_DISCONTINUED: ['discontinuedAt', 'effectiveAt'],
  STADIUM_RESUMED: ['discontinuedAt', 'effectiveAt'],
  MEDIA_ASSET_STORED: [
    'assetId',
    'ownerKind',
    'ownerId',
    'mimeType',
    'byteSize',
    'width',
    'height',
  ],
  MEDIA_ASSET_ATTACHED: ['assetId', 'currentAssetId', 'ownerKind', 'ownerId'],
  MEDIA_ASSET_REPLACED: ['assetId', 'previousAssetId', 'currentAssetId', 'ownerKind', 'ownerId'],
  MEDIA_ASSET_DETACHED: ['assetId', 'currentAssetId', 'ownerKind', 'ownerId'],
  MEDIA_ASSET_CLEANED: ['assetId', 'contentDeletedAt'],
  PLAYER_CREATED: ['code', 'fullName', 'birthDate', 'nationalityCode', 'positionCode'],
  PLAYER_UPDATED: ['fullName', 'birthDate', 'nationalityCode', 'positionCode'],
  PLAYER_CORRECTED: [
    'fullName',
    'birthDate',
    'nationalityCode',
    'positionCode',
    'correctionBasis',
    'duplicateReviewReason',
  ],
  CLUB_APPLICATION_DRAFT_CREATED: ['caseId', 'clubId', 'versionId', 'versionNumber', 'state'],
  CLUB_APPLICATION_DRAFT_UPDATED: ['caseId', 'versionId', 'versionNumber', 'state', 'revision'],
  CLUB_APPLICATION_RECEIVED: [
    'caseId',
    'versionId',
    'versionNumber',
    'state',
    'receivedAt',
    'receiptTimingStatus',
    'receiptRegulationVersionId',
  ],
  CLUB_APPLICATION_SUBMITTED: ['caseId', 'versionId', 'versionNumber', 'state', 'submittedAt'],
  CLUB_APPLICATION_RETURNED: ['caseId', 'versionId', 'versionNumber', 'state', 'decidedAt'],
  CLUB_APPLICATION_WITHDRAWN: ['caseId', 'versionId', 'versionNumber', 'state', 'decidedAt'],
  CLUB_APPLICATION_CANCELLED: ['caseId', 'versionId', 'versionNumber', 'state', 'decidedAt'],
  CLUB_APPLICATION_REJECTED: ['caseId', 'versionId', 'versionNumber', 'state', 'decidedAt'],
  CLUB_APPLICATION_APPROVED: [
    'caseId',
    'versionId',
    'versionNumber',
    'state',
    'approvedAt',
    'approvalRegulationVersionId',
    'receiptExceptionVersionId',
  ],
  CLUB_APPLICATION_CORRECTION_DRAFT_CREATED: [
    'caseId',
    'versionId',
    'versionNumber',
    'baseAcceptedVersionId',
    'state',
  ],
  CLUB_APPLICATION_CORRECTION_DRAFT_UPDATED: [
    'caseId',
    'versionId',
    'versionNumber',
    'baseAcceptedVersionId',
    'state',
    'revision',
  ],
  CLUB_APPLICATION_CORRECTION_SUBMITTED: [
    'caseId',
    'versionId',
    'versionNumber',
    'baseAcceptedVersionId',
    'state',
    'submittedAt',
  ],
  CLUB_APPLICATION_CORRECTION_RETURNED: [
    'caseId',
    'versionId',
    'versionNumber',
    'baseAcceptedVersionId',
    'state',
    'decidedAt',
  ],
  CLUB_APPLICATION_CORRECTION_WITHDRAWN: [
    'caseId',
    'versionId',
    'versionNumber',
    'baseAcceptedVersionId',
    'state',
    'decidedAt',
  ],
  CLUB_APPLICATION_CORRECTION_CANCELLED: [
    'caseId',
    'versionId',
    'versionNumber',
    'baseAcceptedVersionId',
    'state',
    'decidedAt',
  ],
  CLUB_APPLICATION_CORRECTION_REJECTED: [
    'caseId',
    'versionId',
    'versionNumber',
    'baseAcceptedVersionId',
    'state',
    'decidedAt',
  ],
  CLUB_APPLICATION_CORRECTION_APPROVED: [
    'caseId',
    'versionId',
    'versionNumber',
    'baseAcceptedVersionId',
    'state',
    'approvedAt',
    'approvalRegulationVersionId',
    'changedFields',
    'correctionEvidence',
    'affectedReferenceCount',
    'venueReviewRequired',
    'coachName',
    'homeStadiumId',
    'representativeName',
    'representativePhone',
    'contactAddress',
    'notes',
  ],
  RECEIPT_EXCEPTION_DRAFT_CREATED: [
    'caseId',
    'versionId',
    'versionNumber',
    'state',
    'targetKind',
    'targetVersionId',
  ],
  RECEIPT_EXCEPTION_SUBMITTED: ['caseId', 'versionId', 'versionNumber', 'state', 'targetVersionId'],
  RECEIPT_EXCEPTION_RETURNED: ['caseId', 'versionId', 'versionNumber', 'state', 'targetVersionId'],
  RECEIPT_EXCEPTION_WITHDRAWN: ['caseId', 'versionId', 'versionNumber', 'state', 'targetVersionId'],
  RECEIPT_EXCEPTION_REJECTED: ['caseId', 'versionId', 'versionNumber', 'state', 'targetVersionId'],
  RECEIPT_EXCEPTION_APPROVED: [
    'caseId',
    'versionId',
    'versionNumber',
    'state',
    'targetVersionId',
    'approvedAt',
  ],
  PLAYER_REGISTRATION_DRAFT_CREATED: [
    'caseId',
    'clubId',
    'playerId',
    'versionId',
    'versionNumber',
    'state',
  ],
  PLAYER_REGISTRATION_DRAFT_UPDATED: ['caseId', 'versionId', 'versionNumber', 'state', 'revision'],
  PLAYER_REGISTRATION_RECEIVED: [
    'caseId',
    'versionId',
    'versionNumber',
    'state',
    'receivedAt',
    'receiptTimingStatus',
    'receiptRegulationVersionId',
  ],
  PLAYER_REGISTRATION_RETURNED: ['caseId', 'versionId', 'versionNumber', 'state', 'decidedAt'],
  PLAYER_REGISTRATION_CANCELLED: ['caseId', 'versionId', 'versionNumber', 'state', 'decidedAt'],
  PLAYER_REGISTRATION_CONFIRMED: [
    'caseId',
    'clubId',
    'playerId',
    'versionId',
    'versionNumber',
    'state',
    'decidedAt',
    'decisionRegulationVersionId',
    'receiptRegulationVersionId',
    'receiptExceptionVersionId',
    'shirtNumber',
    'playingStart',
    'playingEnd',
    'u21Finding',
    'homegrownFinding',
    'nonHomegrownOptIn',
  ],
} as const;
const policies = { ...existingPolicies, ...businessPolicies } as const;
export type AuditAction = keyof typeof policies;

export const businessHistoryKinds = [
  'Season',
  'RegulationVersion',
  'RegulationChangeRequest',
  'SeasonLifecycleRequest',
  'Club',
  'Stadium',
  'MediaAsset',
  'Player',
  'ClubApplication',
  'ReceiptExceptionCase',
  'PlayerRegistration',
] as const;
export type BusinessHistoryKind = (typeof businessHistoryKinds)[number];

const objectKindByAction: Partial<Record<AuditAction, BusinessHistoryKind>> = {
  SEASON_CREATED: 'Season',
  SEASON_UPDATED: 'Season',
  REGULATION_DRAFT_CREATED: 'RegulationVersion',
  REGULATION_DRAFT_UPDATED: 'RegulationVersion',
  REGULATION_SUBMITTED: 'RegulationVersion',
  REGULATION_WITHDRAWN: 'RegulationVersion',
  REGULATION_RETURNED: 'RegulationVersion',
  REGULATION_REJECTED: 'RegulationVersion',
  REGULATION_APPROVED: 'RegulationVersion',
  REGULATION_ACTIVATED: 'RegulationVersion',
  REGULATION_ACTIVATION_BLOCKED: 'RegulationVersion',
  REGULATION_CHANGE_SUBMITTED: 'RegulationChangeRequest',
  REGULATION_CHANGE_WITHDRAWN: 'RegulationChangeRequest',
  REGULATION_CHANGE_RETURNED: 'RegulationChangeRequest',
  REGULATION_CHANGE_REJECTED: 'RegulationChangeRequest',
  REGULATION_CHANGE_APPROVED: 'RegulationChangeRequest',
  SEASON_LIFECYCLE_DRAFT_CREATED: 'SeasonLifecycleRequest',
  SEASON_LIFECYCLE_DRAFT_UPDATED: 'SeasonLifecycleRequest',
  SEASON_LIFECYCLE_SUBMITTED: 'SeasonLifecycleRequest',
  SEASON_LIFECYCLE_WITHDRAWN: 'SeasonLifecycleRequest',
  SEASON_LIFECYCLE_RETURNED: 'SeasonLifecycleRequest',
  SEASON_LIFECYCLE_REJECTED: 'SeasonLifecycleRequest',
  SEASON_LIFECYCLE_APPROVED: 'SeasonLifecycleRequest',
  CLUB_CREATED: 'Club',
  CLUB_UPDATED: 'Club',
  CLUB_CORRECTED: 'Club',
  CLUB_DISCONTINUED: 'Club',
  CLUB_RESUMED: 'Club',
  STADIUM_CREATED: 'Stadium',
  STADIUM_UPDATED: 'Stadium',
  STADIUM_CORRECTED: 'Stadium',
  STADIUM_DISCONTINUED: 'Stadium',
  STADIUM_RESUMED: 'Stadium',
  MEDIA_ASSET_STORED: 'MediaAsset',
  MEDIA_ASSET_ATTACHED: 'MediaAsset',
  MEDIA_ASSET_REPLACED: 'MediaAsset',
  MEDIA_ASSET_DETACHED: 'MediaAsset',
  MEDIA_ASSET_CLEANED: 'MediaAsset',
  PLAYER_CREATED: 'Player',
  PLAYER_UPDATED: 'Player',
  PLAYER_CORRECTED: 'Player',
  CLUB_APPLICATION_DRAFT_CREATED: 'ClubApplication',
  CLUB_APPLICATION_DRAFT_UPDATED: 'ClubApplication',
  CLUB_APPLICATION_RECEIVED: 'ClubApplication',
  CLUB_APPLICATION_SUBMITTED: 'ClubApplication',
  CLUB_APPLICATION_RETURNED: 'ClubApplication',
  CLUB_APPLICATION_WITHDRAWN: 'ClubApplication',
  CLUB_APPLICATION_CANCELLED: 'ClubApplication',
  CLUB_APPLICATION_REJECTED: 'ClubApplication',
  CLUB_APPLICATION_APPROVED: 'ClubApplication',
  CLUB_APPLICATION_CORRECTION_DRAFT_CREATED: 'ClubApplication',
  CLUB_APPLICATION_CORRECTION_DRAFT_UPDATED: 'ClubApplication',
  CLUB_APPLICATION_CORRECTION_SUBMITTED: 'ClubApplication',
  CLUB_APPLICATION_CORRECTION_RETURNED: 'ClubApplication',
  CLUB_APPLICATION_CORRECTION_WITHDRAWN: 'ClubApplication',
  CLUB_APPLICATION_CORRECTION_CANCELLED: 'ClubApplication',
  CLUB_APPLICATION_CORRECTION_REJECTED: 'ClubApplication',
  CLUB_APPLICATION_CORRECTION_APPROVED: 'ClubApplication',
  RECEIPT_EXCEPTION_DRAFT_CREATED: 'ReceiptExceptionCase',
  RECEIPT_EXCEPTION_SUBMITTED: 'ReceiptExceptionCase',
  RECEIPT_EXCEPTION_RETURNED: 'ReceiptExceptionCase',
  RECEIPT_EXCEPTION_WITHDRAWN: 'ReceiptExceptionCase',
  RECEIPT_EXCEPTION_REJECTED: 'ReceiptExceptionCase',
  RECEIPT_EXCEPTION_APPROVED: 'ReceiptExceptionCase',
  PLAYER_REGISTRATION_DRAFT_CREATED: 'PlayerRegistration',
  PLAYER_REGISTRATION_DRAFT_UPDATED: 'PlayerRegistration',
  PLAYER_REGISTRATION_RECEIVED: 'PlayerRegistration',
  PLAYER_REGISTRATION_RETURNED: 'PlayerRegistration',
  PLAYER_REGISTRATION_CANCELLED: 'PlayerRegistration',
  PLAYER_REGISTRATION_CONFIRMED: 'PlayerRegistration',
};

const requiredAfterFields: Partial<Record<AuditAction, readonly string[]>> = {
  SEASON_CREATED: ['code', 'name', 'competitionName', 'startDate', 'endDate'],
  SEASON_UPDATED: [],
  REGULATION_DRAFT_CREATED: ['versionId', 'versionNumber', 'state', 'revision'],
  REGULATION_DRAFT_UPDATED: ['versionId', 'versionNumber', 'state', 'revision'],
  REGULATION_SUBMITTED: [
    'versionId',
    'versionNumber',
    'state',
    'revision',
    'submittedAt',
    'effectiveMode',
    'proposedEffectiveAt',
  ],
  REGULATION_WITHDRAWN: [
    'versionId',
    'versionNumber',
    'state',
    'revision',
    'submittedAt',
    'decidedAt',
    'decidedBy',
    'decisionReason',
  ],
  REGULATION_RETURNED: [
    'versionId',
    'versionNumber',
    'state',
    'revision',
    'submittedAt',
    'decidedAt',
    'decidedBy',
    'decisionReason',
  ],
  REGULATION_REJECTED: [
    'versionId',
    'versionNumber',
    'state',
    'revision',
    'submittedAt',
    'decidedAt',
    'decidedBy',
    'decisionReason',
  ],
  REGULATION_APPROVED: ['versionId', 'versionNumber', 'effectiveMode', 'effectiveAt'],
  REGULATION_ACTIVATED: ['versionId', 'activeFrom', 'processedAt'],
  REGULATION_ACTIVATION_BLOCKED: ['versionId', 'proposedEffectiveAt', 'blockedAt'],
  REGULATION_CHANGE_SUBMITTED: ['requestId', 'versionId', 'versionNumber', 'state'],
  REGULATION_CHANGE_WITHDRAWN: ['requestId', 'versionId', 'versionNumber', 'state'],
  REGULATION_CHANGE_RETURNED: ['requestId', 'versionId', 'versionNumber', 'state'],
  REGULATION_CHANGE_REJECTED: ['requestId', 'versionId', 'versionNumber', 'state'],
  REGULATION_CHANGE_APPROVED: [
    'requestId',
    'versionId',
    'versionNumber',
    'action',
    'waitingVersionId',
    'approvedAt',
  ],
  SEASON_LIFECYCLE_APPROVED: ['requestId', 'versionId', 'versionNumber', 'action', 'approvedAt'],
  CLUB_CREATED: ['code', 'name', 'abbreviation'],
  CLUB_CORRECTED: ['correctionBasis'],
  STADIUM_CREATED: ['code', 'name'],
  STADIUM_CORRECTED: ['correctionBasis'],
  CLUB_DISCONTINUED: ['discontinuedAt', 'effectiveAt'],
  CLUB_RESUMED: ['discontinuedAt', 'effectiveAt'],
  STADIUM_DISCONTINUED: ['discontinuedAt', 'effectiveAt'],
  STADIUM_RESUMED: ['discontinuedAt', 'effectiveAt'],
  MEDIA_ASSET_STORED: [
    'assetId',
    'ownerKind',
    'ownerId',
    'mimeType',
    'byteSize',
    'width',
    'height',
  ],
  MEDIA_ASSET_ATTACHED: ['assetId', 'currentAssetId', 'ownerKind', 'ownerId'],
  MEDIA_ASSET_REPLACED: ['assetId', 'previousAssetId', 'currentAssetId', 'ownerKind', 'ownerId'],
  MEDIA_ASSET_DETACHED: ['assetId', 'currentAssetId', 'ownerKind', 'ownerId'],
  MEDIA_ASSET_CLEANED: ['assetId', 'contentDeletedAt'],
  PLAYER_CREATED: ['code', 'fullName', 'birthDate', 'nationalityCode', 'positionCode'],
  PLAYER_CORRECTED: ['correctionBasis'],
  CLUB_APPLICATION_DRAFT_CREATED: ['caseId', 'clubId', 'versionId', 'versionNumber', 'state'],
  CLUB_APPLICATION_RECEIVED: [
    'caseId',
    'versionId',
    'versionNumber',
    'state',
    'receivedAt',
    'receiptTimingStatus',
    'receiptRegulationVersionId',
  ],
  CLUB_APPLICATION_APPROVED: [
    'caseId',
    'versionId',
    'versionNumber',
    'state',
    'approvedAt',
    'approvalRegulationVersionId',
  ],
  CLUB_APPLICATION_CORRECTION_DRAFT_CREATED: [
    'caseId',
    'versionId',
    'versionNumber',
    'baseAcceptedVersionId',
    'state',
  ],
  CLUB_APPLICATION_CORRECTION_APPROVED: [
    'caseId',
    'versionId',
    'versionNumber',
    'baseAcceptedVersionId',
    'state',
    'approvedAt',
    'approvalRegulationVersionId',
    'changedFields',
  ],
  RECEIPT_EXCEPTION_APPROVED: [
    'caseId',
    'versionId',
    'versionNumber',
    'state',
    'targetVersionId',
    'approvedAt',
  ],
  PLAYER_REGISTRATION_DRAFT_CREATED: [
    'caseId',
    'clubId',
    'playerId',
    'versionId',
    'versionNumber',
    'state',
  ],
  PLAYER_REGISTRATION_RECEIVED: [
    'caseId',
    'versionId',
    'versionNumber',
    'state',
    'receivedAt',
    'receiptTimingStatus',
    'receiptRegulationVersionId',
  ],
  PLAYER_REGISTRATION_CONFIRMED: [
    'caseId',
    'clubId',
    'playerId',
    'versionId',
    'versionNumber',
    'state',
    'decidedAt',
    'decisionRegulationVersionId',
    'receiptRegulationVersionId',
    'shirtNumber',
    'playingStart',
  ],
};

const reasonRequired = new Set<AuditAction>([
  'REGULATION_SUBMITTED',
  'REGULATION_WITHDRAWN',
  'REGULATION_RETURNED',
  'REGULATION_REJECTED',
  'REGULATION_ACTIVATION_BLOCKED',
  'REGULATION_APPROVED',
  'REGULATION_CHANGE_SUBMITTED',
  'REGULATION_CHANGE_WITHDRAWN',
  'REGULATION_CHANGE_RETURNED',
  'REGULATION_CHANGE_REJECTED',
  'REGULATION_CHANGE_APPROVED',
  'SEASON_LIFECYCLE_APPROVED',
  'CLUB_DISCONTINUED',
  'CLUB_RESUMED',
  'STADIUM_DISCONTINUED',
  'STADIUM_RESUMED',
  'CLUB_CORRECTED',
  'STADIUM_CORRECTED',
  'PLAYER_CORRECTED',
  'CLUB_APPLICATION_RETURNED',
  'CLUB_APPLICATION_CANCELLED',
  'CLUB_APPLICATION_REJECTED',
  'CLUB_APPLICATION_APPROVED',
  'CLUB_APPLICATION_CORRECTION_DRAFT_CREATED',
  'CLUB_APPLICATION_CORRECTION_RETURNED',
  'CLUB_APPLICATION_CORRECTION_CANCELLED',
  'CLUB_APPLICATION_CORRECTION_REJECTED',
  'CLUB_APPLICATION_CORRECTION_APPROVED',
  'RECEIPT_EXCEPTION_SUBMITTED',
  'RECEIPT_EXCEPTION_RETURNED',
  'RECEIPT_EXCEPTION_REJECTED',
  'RECEIPT_EXCEPTION_APPROVED',
  'PLAYER_REGISTRATION_RETURNED',
  'PLAYER_REGISTRATION_CANCELLED',
]);
const beforeRequired = new Set<AuditAction>([
  'SEASON_UPDATED',
  'REGULATION_DRAFT_UPDATED',
  'REGULATION_SUBMITTED',
  'REGULATION_WITHDRAWN',
  'REGULATION_RETURNED',
  'REGULATION_REJECTED',
  'REGULATION_APPROVED',
  'REGULATION_ACTIVATED',
  'REGULATION_ACTIVATION_BLOCKED',
  'REGULATION_CHANGE_SUBMITTED',
  'REGULATION_CHANGE_WITHDRAWN',
  'REGULATION_CHANGE_RETURNED',
  'REGULATION_CHANGE_REJECTED',
  'REGULATION_CHANGE_APPROVED',
  'SEASON_LIFECYCLE_APPROVED',
  'CLUB_UPDATED',
  'CLUB_CORRECTED',
  'CLUB_DISCONTINUED',
  'CLUB_RESUMED',
  'STADIUM_UPDATED',
  'STADIUM_CORRECTED',
  'STADIUM_DISCONTINUED',
  'STADIUM_RESUMED',
  'MEDIA_ASSET_ATTACHED',
  'MEDIA_ASSET_REPLACED',
  'MEDIA_ASSET_DETACHED',
  'MEDIA_ASSET_CLEANED',
  'PLAYER_UPDATED',
  'PLAYER_CORRECTED',
  'CLUB_APPLICATION_APPROVED',
  'CLUB_APPLICATION_CORRECTION_APPROVED',
  'RECEIPT_EXCEPTION_APPROVED',
  'PLAYER_REGISTRATION_CONFIRMED',
]);

const allowedActorKinds: Partial<
  Record<AuditAction, readonly ('ACCOUNT' | 'OPERATOR' | 'SYSTEM')[]>
> = {
  REGULATION_ACTIVATED: ['SYSTEM'],
  REGULATION_ACTIVATION_BLOCKED: ['SYSTEM', 'OPERATOR'],
  MEDIA_ASSET_CLEANED: ['SYSTEM'],
};

const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function validInstant(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function validDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function boundedText(value: unknown, max: number, optional = false): value is string | null {
  if (optional && value === null) return true;
  return typeof value === 'string' && value.trim().length > 0 && [...value].length <= max;
}

function sameChangedFieldKeys(before: Record<string, unknown>, after: Record<string, unknown>) {
  const basisFields = new Set(['correctionBasis', 'duplicateReviewReason']);
  const beforeKeys = Object.keys(before)
    .filter((key) => !basisFields.has(key))
    .sort();
  const afterKeys = Object.keys(after)
    .filter((key) => !basisFields.has(key))
    .sort();
  return (
    beforeKeys.length > 0 &&
    beforeKeys.join('\0') === afterKeys.join('\0') &&
    beforeKeys.some((key) => !Object.is(before[key], after[key]))
  );
}

function advancesVersionRevision(before: Record<string, unknown>, after: Record<string, unknown>) {
  return (
    typeof before.revision === 'string' &&
    /^[1-9][0-9]*$/.test(before.revision) &&
    typeof after.revision === 'string' &&
    /^[1-9][0-9]*$/.test(after.revision) &&
    BigInt(after.revision) === BigInt(before.revision) + 1n
  );
}

function validateMasterSummary(
  kind: 'Season' | 'Club' | 'Stadium' | 'Player',
  payload: Record<string, unknown>,
  action: AuditAction,
  after = true,
) {
  if (kind === 'Season') {
    if (
      ('name' in payload && !boundedText(payload.name, 200)) ||
      ('competitionName' in payload && !boundedText(payload.competitionName, 200)) ||
      ('code' in payload && !boundedText(payload.code, 32)) ||
      ('startDate' in payload && !validDateOnly(payload.startDate)) ||
      ('endDate' in payload && !validDateOnly(payload.endDate))
    )
      throw new Error('Season audit summaries require bounded typed fields.');
    return;
  }
  if (kind === 'Club') {
    if (
      ('code' in payload && !boundedText(payload.code, 32)) ||
      ('name' in payload && !boundedText(payload.name, 200)) ||
      ('abbreviation' in payload && !boundedText(payload.abbreviation, 20)) ||
      ('correctionBasis' in payload && !boundedText(payload.correctionBasis, 2000))
    )
      throw new Error('Club audit summaries require bounded typed fields.');
    const hasBasis = Object.hasOwn(payload, 'correctionBasis');
    if (
      (after && action === 'CLUB_CORRECTED' && !hasBasis) ||
      (after && action !== 'CLUB_CORRECTED' && hasBasis) ||
      (!after && hasBasis)
    )
      throw new Error('Club correction summaries require a bounded basis.');
    return;
  }
  if (kind === 'Player') {
    if (
      ('code' in payload && !boundedText(payload.code, 32)) ||
      ('fullName' in payload && !boundedText(payload.fullName, 200)) ||
      ('birthDate' in payload && !validDateOnly(payload.birthDate)) ||
      ('nationalityCode' in payload && !boundedText(payload.nationalityCode, 32)) ||
      ('positionCode' in payload && !boundedText(payload.positionCode, 16)) ||
      ('correctionBasis' in payload && !boundedText(payload.correctionBasis, 2000))
    )
      throw new Error('Player audit summaries require bounded typed fields.');
    const hasBasis = Object.hasOwn(payload, 'correctionBasis');
    if (
      (after && action === 'PLAYER_CORRECTED' && !hasBasis) ||
      (after && action !== 'PLAYER_CORRECTED' && hasBasis) ||
      (!after && hasBasis)
    )
      throw new Error('Player correction summaries require a bounded basis.');
    return;
  }
  if (
    ('code' in payload && !boundedText(payload.code, 32)) ||
    ('name' in payload && !boundedText(payload.name, 200)) ||
    ('location' in payload && !boundedText(payload.location, 500, true)) ||
    ('correctionBasis' in payload && !boundedText(payload.correctionBasis, 2000))
  )
    throw new Error('Stadium audit summaries require bounded typed fields.');
  const hasBasis = Object.hasOwn(payload, 'correctionBasis');
  if (
    (after && action === 'STADIUM_CORRECTED' && !hasBasis) ||
    (after && action !== 'STADIUM_CORRECTED' && hasBasis) ||
    (!after && hasBasis)
  )
    throw new Error('Stadium correction summaries require a bounded basis.');
}

/** Recognizes only actions with an explicitly owned audit payload policy. */
export function isAuditAction(value: string): value is AuditAction {
  return Object.hasOwn(policies, value);
}

export function isBusinessHistoryAction(action: string, objectKind: string): action is AuditAction {
  return isAuditAction(action) && objectKindByAction[action] === objectKind;
}

/** Validates event-level requirements that cannot be checked on a before/after fragment alone. */
export function validateAuditEvent(event: {
  action: AuditAction;
  objectKind: string;
  objectId?: string;
  seasonId?: string;
  outcome: 'SUCCESS' | 'DENIED' | 'FAILURE';
  reason?: string;
  before?: unknown;
  after?: unknown;
}): void {
  const expectedObjectKind = objectKindByAction[event.action];
  if (!expectedObjectKind) return;
  if (event.objectKind !== expectedObjectKind)
    throw new Error('Audit action object kind does not match its policy.');
  if (!event.objectId || !UUID4.test(event.objectId))
    throw new Error('Business audit events require a UUID object reference.');
  if (event.objectKind === 'Season') {
    if (event.seasonId !== event.objectId)
      throw new Error('Season audit events require their exact season reference.');
  } else if (
    [
      'RegulationVersion',
      'RegulationChangeRequest',
      'SeasonLifecycleRequest',
      'ClubApplication',
      'ReceiptExceptionCase',
    ].includes(event.objectKind) &&
    (!event.seasonId || !UUID4.test(event.seasonId))
  ) {
    throw new Error('Season-scoped business audit events require a season reference.');
  } else if (event.seasonId !== undefined && !UUID4.test(event.seasonId)) {
    throw new Error('Business audit season reference is invalid.');
  }

  if (event.outcome !== 'SUCCESS') return;
  if (reasonRequired.has(event.action) && (!event.reason || !event.reason.trim()))
    throw new Error('Successful business audit events require a reason.');
  if (
    beforeRequired.has(event.action) &&
    (!isRecord(event.before) || !Object.keys(event.before).length)
  )
    throw new Error('Successful business audit events require a before summary.');
  if (!isRecord(event.after) || Object.keys(event.after).length === 0)
    throw new Error('Successful business audit events require an after summary.');
  const required = requiredAfterFields[event.action] ?? [];
  if (required.some((field) => !Object.hasOwn(event.after!, field)))
    throw new Error('Successful business audit events are missing required fields.');

  const after = event.after;
  const exactObjectReference = (field: string) =>
    typeof after[field] === 'string' && after[field] === event.objectId;
  const exactUuid = (field: string) =>
    typeof after[field] === 'string' && UUID4.test(after[field] as string);
  const exactInstant = (field: string) => validInstant(after[field]);
  switch (event.action) {
    case 'SEASON_CREATED':
    case 'SEASON_UPDATED':
      validateMasterSummary('Season', after, event.action);
      if (event.action === 'SEASON_UPDATED') {
        if (!isRecord(event.before) || !sameChangedFieldKeys(event.before, after))
          throw new Error('Season update summaries must describe matching changed fields.');
        validateMasterSummary('Season', event.before, event.action);
      }
      break;
    case 'REGULATION_DRAFT_CREATED':
      if (
        !exactObjectReference('versionId') ||
        !Number.isSafeInteger(after.versionNumber) ||
        Number(after.versionNumber) < 1 ||
        after.state !== 'DRAFT' ||
        after.revision !== '1'
      )
        throw new Error('Draft creation audit events require the exact initial version.');
      break;
    case 'REGULATION_DRAFT_UPDATED':
      if (
        !isRecord(event.before) ||
        !sameChangedFieldKeys(event.before, after) ||
        !exactObjectReference('versionId') ||
        !Number.isSafeInteger(after.versionNumber) ||
        Number(after.versionNumber) < 1 ||
        event.before.versionId !== after.versionId ||
        event.before.versionNumber !== after.versionNumber ||
        event.before.state !== 'DRAFT' ||
        after.state !== 'DRAFT' ||
        typeof event.before.revision !== 'string' ||
        !/^[1-9][0-9]*$/.test(event.before.revision) ||
        typeof after.revision !== 'string' ||
        !/^[1-9][0-9]*$/.test(after.revision) ||
        BigInt(after.revision) !== BigInt(event.before.revision) + 1n
      )
        throw new Error(
          'Draft edit audit events require a matching one-revision DRAFT transition.',
        );
      break;
    case 'REGULATION_SUBMITTED':
      if (
        !isRecord(event.before) ||
        !exactObjectReference('versionId') ||
        event.before.versionId !== after.versionId ||
        !Number.isSafeInteger(event.before.versionNumber) ||
        event.before.versionNumber !== after.versionNumber ||
        event.before.state !== 'DRAFT' ||
        after.state !== 'SUBMITTED' ||
        !advancesVersionRevision(event.before, after) ||
        !validInstant(after.submittedAt) ||
        !['IMMEDIATE', 'SCHEDULED'].includes(String(after.effectiveMode)) ||
        (after.effectiveMode === 'IMMEDIATE' && after.proposedEffectiveAt !== null) ||
        (after.effectiveMode === 'SCHEDULED' && !validInstant(after.proposedEffectiveAt))
      )
        throw new Error(
          'Regulation submission audit events require the exact immutable version transition.',
        );
      break;
    case 'REGULATION_WITHDRAWN':
    case 'REGULATION_RETURNED':
    case 'REGULATION_REJECTED': {
      const targetState =
        event.action === 'REGULATION_WITHDRAWN'
          ? 'WITHDRAWN'
          : event.action === 'REGULATION_RETURNED'
            ? 'RETURNED'
            : 'REJECTED';
      if (
        !isRecord(event.before) ||
        !exactObjectReference('versionId') ||
        event.before.versionId !== after.versionId ||
        !Number.isSafeInteger(event.before.versionNumber) ||
        event.before.versionNumber !== after.versionNumber ||
        event.before.state !== 'SUBMITTED' ||
        after.state !== targetState ||
        !advancesVersionRevision(event.before, after) ||
        !validInstant(event.before.submittedAt) ||
        after.submittedAt !== event.before.submittedAt ||
        !validInstant(after.decidedAt) ||
        !exactUuid('decidedBy') ||
        after.decisionReason !== event.reason
      )
        throw new Error(
          'Regulation decision audit events require the exact submitted-version transition.',
        );
      break;
    }
    case 'REGULATION_APPROVED':
      if (
        !exactObjectReference('versionId') ||
        !Number.isSafeInteger(after.versionNumber) ||
        Number(after.versionNumber) < 1 ||
        !['IMMEDIATE', 'SCHEDULED'].includes(String(after.effectiveMode)) ||
        !exactInstant('effectiveAt')
      )
        throw new Error('Regulation audit events require exact version and effectivity.');
      break;
    case 'REGULATION_ACTIVATED':
      if (
        !exactObjectReference('versionId') ||
        !exactInstant('activeFrom') ||
        !exactInstant('processedAt')
      )
        throw new Error('Regulation audit events require exact version and effectivity.');
      break;
    case 'REGULATION_ACTIVATION_BLOCKED':
      if (
        !exactObjectReference('versionId') ||
        !exactInstant('proposedEffectiveAt') ||
        !exactInstant('blockedAt')
      )
        throw new Error('Regulation audit events require exact version and effectivity.');
      break;
    case 'REGULATION_CHANGE_SUBMITTED':
    case 'REGULATION_CHANGE_WITHDRAWN':
    case 'REGULATION_CHANGE_RETURNED':
    case 'REGULATION_CHANGE_REJECTED':
      if (
        !exactObjectReference('requestId') ||
        !exactUuid('versionId') ||
        !Number.isSafeInteger(after.versionNumber) ||
        Number(after.versionNumber) < 1 ||
        after.state !== event.action.slice('REGULATION_CHANGE_'.length)
      )
        throw new Error(
          'Change audit events require exact immutable version references and transition state.',
        );
      break;
    case 'REGULATION_CHANGE_APPROVED':
      if (
        !exactObjectReference('requestId') ||
        !exactUuid('versionId') ||
        !Number.isSafeInteger(after.versionNumber) ||
        Number(after.versionNumber) < 1 ||
        !['CANCEL', 'REPLACE'].includes(String(after.action)) ||
        !exactUuid('waitingVersionId') ||
        !exactInstant('approvedAt') ||
        (after.action === 'REPLACE' && !exactUuid('replacementVersionId')) ||
        (after.action === 'CANCEL' &&
          after.replacementVersionId !== undefined &&
          after.replacementVersionId !== null)
      )
        throw new Error('Change audit events require exact immutable version references.');
      break;
    case 'SEASON_LIFECYCLE_APPROVED':
      if (
        !exactObjectReference('requestId') ||
        !exactUuid('versionId') ||
        !Number.isSafeInteger(after.versionNumber) ||
        Number(after.versionNumber) < 1 ||
        !['CLOSE', 'REOPEN'].includes(String(after.action)) ||
        !exactInstant('approvedAt') ||
        (after.action === 'CLOSE' && !exactUuid('summaryVersionId'))
      )
        throw new Error('Lifecycle audit events require exact immutable version references.');
      break;
    case 'CLUB_DISCONTINUED':
    case 'STADIUM_DISCONTINUED':
      if (!exactInstant('discontinuedAt') || !exactInstant('effectiveAt'))
        throw new Error('Discontinuation audit events require exact effectivity.');
      break;
    case 'CLUB_CREATED':
    case 'CLUB_UPDATED':
    case 'CLUB_CORRECTED':
      validateMasterSummary('Club', after, event.action);
      if (event.action !== 'CLUB_CREATED') {
        if (!isRecord(event.before) || !sameChangedFieldKeys(event.before, after))
          throw new Error('Club update summaries must describe matching changed fields.');
        validateMasterSummary('Club', event.before, event.action, false);
      }
      break;
    case 'STADIUM_CREATED':
    case 'STADIUM_UPDATED':
    case 'STADIUM_CORRECTED':
      validateMasterSummary('Stadium', after, event.action);
      if (event.action !== 'STADIUM_CREATED') {
        if (!isRecord(event.before) || !sameChangedFieldKeys(event.before, after))
          throw new Error('Stadium update summaries must describe matching changed fields.');
        validateMasterSummary('Stadium', event.before, event.action, false);
      }
      break;
    case 'PLAYER_CREATED':
    case 'PLAYER_UPDATED':
    case 'PLAYER_CORRECTED':
      validateMasterSummary('Player', after, event.action);
      if (event.action !== 'PLAYER_CREATED') {
        if (!isRecord(event.before) || !sameChangedFieldKeys(event.before, after))
          throw new Error('Player update summaries must describe matching changed fields.');
        validateMasterSummary('Player', event.before, event.action, false);
      }
      break;
    case 'CLUB_RESUMED':
    case 'STADIUM_RESUMED':
      if (after.discontinuedAt !== null || !exactInstant('effectiveAt'))
        throw new Error('Resumption audit events require exact effectivity.');
      break;
    case 'MEDIA_ASSET_STORED':
    case 'MEDIA_ASSET_ATTACHED':
    case 'MEDIA_ASSET_REPLACED':
    case 'MEDIA_ASSET_DETACHED':
      if (
        !exactObjectReference('assetId') ||
        !['CLUB', 'PLAYER'].includes(String(after.ownerKind)) ||
        !exactUuid('ownerId') ||
        (event.action === 'MEDIA_ASSET_REPLACED' && !exactUuid('previousAssetId')) ||
        (event.action === 'MEDIA_ASSET_ATTACHED' && after.currentAssetId !== after.assetId) ||
        (event.action === 'MEDIA_ASSET_REPLACED' && after.currentAssetId !== after.assetId) ||
        (event.action === 'MEDIA_ASSET_DETACHED' && after.currentAssetId !== null) ||
        (event.action === 'MEDIA_ASSET_REPLACED' &&
          event.before &&
          isRecord(event.before) &&
          event.before.currentAssetId !== after.previousAssetId)
      )
        throw new Error('Media audit events require exact asset and owner references.');
      if (
        event.action === 'MEDIA_ASSET_STORED' &&
        (!Number.isSafeInteger(after.byteSize) ||
          Number(after.byteSize) <= 0 ||
          !Number.isSafeInteger(after.width) ||
          Number(after.width) <= 0 ||
          !Number.isSafeInteger(after.height) ||
          Number(after.height) <= 0 ||
          typeof after.mimeType !== 'string')
      )
        throw new Error('Stored media audit events require bounded media facts.');
      break;
    case 'MEDIA_ASSET_CLEANED':
      if (
        !exactObjectReference('assetId') ||
        !exactInstant('contentDeletedAt') ||
        !isRecord(event.before) ||
        event.before.contentDeletedAt !== null
      )
        throw new Error('Media cleanup audit events require a verified deletion transition.');
      break;
    case 'CLUB_APPLICATION_APPROVED':
      if (
        !exactObjectReference('caseId') ||
        !exactUuid('versionId') ||
        !Number.isSafeInteger(after.versionNumber) ||
        Number(after.versionNumber) < 1 ||
        after.state !== 'APPROVED' ||
        !exactInstant('approvedAt') ||
        !exactUuid('approvalRegulationVersionId') ||
        (after.receiptExceptionVersionId !== undefined &&
          after.receiptExceptionVersionId !== null &&
          !exactUuid('receiptExceptionVersionId')) ||
        !isRecord(event.before) ||
        event.before.caseId !== after.caseId ||
        event.before.versionId !== after.versionId ||
        event.before.versionNumber !== after.versionNumber ||
        event.before.state !== 'PENDING_APPROVAL'
      )
        throw new Error(
          'Club application approval audit events require exact version, approval basis and transition.',
        );
      break;
    case 'CLUB_APPLICATION_CORRECTION_APPROVED':
      if (
        !exactObjectReference('caseId') ||
        !exactUuid('versionId') ||
        !exactUuid('baseAcceptedVersionId') ||
        !Number.isSafeInteger(after.versionNumber) ||
        Number(after.versionNumber) < 1 ||
        after.state !== 'APPROVED' ||
        !exactInstant('approvedAt') ||
        !exactUuid('approvalRegulationVersionId') ||
        !boundedText(after.changedFields, 500) ||
        !isRecord(event.before) ||
        event.before.caseId !== after.caseId ||
        event.before.versionId !== after.versionId ||
        event.before.versionNumber !== after.versionNumber ||
        event.before.baseAcceptedVersionId !== after.baseAcceptedVersionId ||
        event.before.state !== 'PENDING_APPROVAL'
      )
        throw new Error(
          'Club application correction approval audit events require exact version, accepted baseline, approval basis and transition.',
        );
      break;
    case 'PLAYER_REGISTRATION_CONFIRMED':
      if (
        !exactObjectReference('caseId') ||
        !exactUuid('clubId') ||
        !exactUuid('playerId') ||
        !exactUuid('versionId') ||
        !Number.isSafeInteger(after.versionNumber) ||
        Number(after.versionNumber) < 1 ||
        after.state !== 'VALID' ||
        !exactInstant('decidedAt') ||
        !exactUuid('decisionRegulationVersionId') ||
        !exactUuid('receiptRegulationVersionId') ||
        (after.receiptExceptionVersionId !== undefined &&
          after.receiptExceptionVersionId !== null &&
          !exactUuid('receiptExceptionVersionId')) ||
        !Number.isSafeInteger(after.shirtNumber) ||
        Number(after.shirtNumber) < 1 ||
        Number(after.shirtNumber) > 99 ||
        !exactInstant('playingStart') ||
        !isRecord(event.before) ||
        event.before.caseId !== after.caseId ||
        event.before.versionId !== after.versionId ||
        event.before.versionNumber !== after.versionNumber ||
        event.before.state !== 'RECEIVED'
      )
        throw new Error(
          'Player registration confirmation audit events require exact version, decision basis and transition.',
        );
      break;
  }
}

export function allowedAuditActorKinds(action: AuditAction) {
  return allowedActorKinds[action] ?? (['ACCOUNT'] as const);
}

/** Project historical payloads by the same per-action field allowlist used at append time. */
export function auditChangeSummary(action: AuditAction, payload: Prisma.JsonValue) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const fields: readonly string[] = policies[action];
  const summary = Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) =>
        fields.includes(key) &&
        (typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          value === null),
    ),
  );
  return Object.keys(summary).length ? summary : null;
}

/** Validates primitive, bounded values against the action allowlist before audit append. */
export function auditPayload(action: AuditAction, value: unknown): Prisma.InputJsonObject {
  const allowed: readonly string[] = policies[action];
  if (
    !allowed ||
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error('Invalid audit action or payload.');
  }
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      !allowed.includes(key) ||
      !(
        item === null ||
        typeof item === 'boolean' ||
        (typeof item === 'number' && Number.isSafeInteger(item)) ||
        (typeof item === 'string' && [...item].length <= 2000)
      )
    ) {
      throw new Error('Audit payload is outside the action allowlist.');
    }
    result[key] = item as string | number | boolean | null;
  }
  return result;
}
