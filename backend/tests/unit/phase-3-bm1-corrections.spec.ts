import { randomUUID } from 'node:crypto';
import { auditPayload, validateAuditEvent } from '../../src/audit/audit-payload.policy';
import {
  assertD100CorrectionScope,
  computeDescriptiveDiff,
  normalizeDeclaredReferences,
  normalizeDescriptiveCorrectionInput,
  type DescriptiveFields,
} from '../../src/registry-registration/club-application-corrections.service';

describe('PHASE 3 US5 — D100 BM1 correction domain rules (unit)', () => {
  const baseline: DescriptiveFields = {
    coachName: 'HLV Ban Đầu',
    homeStadiumId: '11111111-1111-4111-8111-111111111111',
    representativeName: 'Trần Đại Diện',
    representativePhone: '0901234567',
    contactAddress: '10 Đường Cũ',
    notes: 'Ghi chú cũ',
  };

  it('permits ORIGINAL_RECORDING_ERROR and rejects later-change, roster-change and club-replacement scopes', () => {
    expect(() => assertD100CorrectionScope(undefined)).not.toThrow();
    expect(() => assertD100CorrectionScope('ORIGINAL_RECORDING_ERROR')).not.toThrow();
    expect(() => assertD100CorrectionScope('original_recording_error')).not.toThrow();

    expect(() => assertD100CorrectionScope('LATER_CIRCUMSTANCE_CHANGE')).toThrow();
    expect(() => assertD100CorrectionScope('PROPOSED_PLAYER_LIST_CHANGE')).toThrow();
    expect(() => assertD100CorrectionScope('CLUB_WITHDRAWAL_OR_REPLACEMENT')).toThrow();
  });

  it('computes descriptive diff, flags UC14 venue review when homeStadiumId changes, and rejects no-op or missing required fields', () => {
    const venueDiff = computeDescriptiveDiff(baseline, {
      ...baseline,
      coachName: 'HLV Đính Chính',
      homeStadiumId: '22222222-2222-4222-8222-222222222222',
    });
    expect(venueDiff).toEqual({
      changedFields: ['coachName', 'homeStadiumId'],
      before: {
        coachName: 'HLV Ban Đầu',
        homeStadiumId: '11111111-1111-4111-8111-111111111111',
      },
      after: {
        coachName: 'HLV Đính Chính',
        homeStadiumId: '22222222-2222-4222-8222-222222222222',
      },
      venueReviewRequired: true,
    });

    const nonVenueDiff = computeDescriptiveDiff(baseline, {
      ...baseline,
      representativePhone: '+84 90 999 8888',
    });
    expect(nonVenueDiff.changedFields).toEqual(['representativePhone']);
    expect(nonVenueDiff.venueReviewRequired).toBe(false);

    // No-op rejected
    expect(() => computeDescriptiveDiff(baseline, { ...baseline })).toThrow();

    // Missing required D059 field rejected
    expect(() => computeDescriptiveDiff(baseline, { ...baseline, coachName: null })).toThrow();
  });

  it('normalizes descriptive inputs and declared affected references', () => {
    const normalized = normalizeDescriptiveCorrectionInput({
      coachName: '  HLV   Mới  ',
      homeStadiumId: 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA',
      representativePhone: '+84 (90) 123-4567',
      notes: '  Ghi chú đính chính  ',
    });
    expect(normalized).toEqual({
      coachName: 'HLV Mới',
      homeStadiumId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      representativePhone: '+84 (90) 123-4567',
      notes: 'Ghi chú đính chính',
    });

    const refs = normalizeDeclaredReferences([
      {
        kind: 'SCHEDULED_MATCH',
        referenceId: 'BBBBBBBB-BBBB-4BBB-8BBB-BBBBBBBBBBBB',
        note: '  Rà soát sân nhà theo UC14  ',
      },
    ]);
    expect(refs).toEqual([
      {
        kind: 'SCHEDULED_MATCH',
        referenceId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        note: 'Rà soát sân nhà theo UC14',
      },
    ]);
  });

  it('validates CLUB_APPLICATION_CORRECTION_APPROVED audit policy strictly', () => {
    const caseId = randomUUID();
    const versionId = randomUUID();
    const baseAcceptedVersionId = randomUUID();
    const approvalRegulationVersionId = randomUUID();
    const seasonId = randomUUID();

    const before = auditPayload('CLUB_APPLICATION_CORRECTION_APPROVED', {
      caseId,
      versionId,
      versionNumber: 2,
      baseAcceptedVersionId,
      state: 'PENDING_APPROVAL',
      coachName: 'HLV Ban Đầu',
    });
    const after = auditPayload('CLUB_APPLICATION_CORRECTION_APPROVED', {
      caseId,
      versionId,
      versionNumber: 2,
      baseAcceptedVersionId,
      state: 'APPROVED',
      approvedAt: '2026-09-15T10:00:00.000Z',
      approvalRegulationVersionId,
      changedFields: 'coachName',
      correctionEvidence: 'Bản gốc BM1',
      affectedReferenceCount: 1,
      venueReviewRequired: false,
      coachName: 'HLV Đính Chính',
    });

    expect(() =>
      validateAuditEvent({
        action: 'CLUB_APPLICATION_CORRECTION_APPROVED',
        objectKind: 'ClubApplication',
        objectId: caseId,
        seasonId,
        outcome: 'SUCCESS',
        reason: 'Chấp thuận đính chính D100.',
        before,
        after,
      }),
    ).not.toThrow();

    // Missing baseAcceptedVersionId fails validation
    expect(() =>
      validateAuditEvent({
        action: 'CLUB_APPLICATION_CORRECTION_APPROVED',
        objectKind: 'ClubApplication',
        objectId: caseId,
        seasonId,
        outcome: 'SUCCESS',
        reason: 'Chấp thuận đính chính D100.',
        before,
        after: { ...after, baseAcceptedVersionId: 'not-a-uuid' },
      }),
    ).toThrow();
  });
});
