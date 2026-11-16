import { auditPayload, validateAuditEvent } from '../../src/audit/audit-payload.policy';

describe('action-specific audit payload interface', () => {
  it('accepts safe account summaries and rejects secrets, arbitrary actions and whole bodies', () => {
    expect(
      auditPayload('ACCOUNT_CREATED', {
        personnelCode: 'TEST_01',
        username: 'fixture.user',
        fullName: 'Nhân viên kiểm thử',
        state: 'ACTIVE',
      }),
    ).toEqual({
      personnelCode: 'TEST_01',
      username: 'fixture.user',
      fullName: 'Nhân viên kiểm thử',
      state: 'ACTIVE',
    });
    for (const payload of [
      { password: 'do-not-record' },
      { passwordHash: 'encoded' },
      { csrfToken: 'token' },
      { sessionToken: 'token' },
      { storageCredential: 'secret' },
      { request: { password: 'secret' } },
      { fullName: { password: 'nested' } },
    ])
      expect(() => auditPayload('ACCOUNT_CREATED', payload)).toThrow();
    expect(() => auditPayload('UNKNOWN_ACTION' as never, {})).toThrow();
    expect(() =>
      auditPayload('LOGIN_SUCCEEDED', { fullName: 'unrequested account snapshot' }),
    ).toThrow();
  });

  it('bounds PHASE 2 scalar payloads and excludes media paths and request snapshots', () => {
    const seasonId = '4b06e6c8-c1bf-4b0f-90f9-e5713fac0fce';
    expect(
      auditPayload('SEASON_CREATED', {
        code: '2027_TEST',
        name: 'Test season',
        competitionName: 'Premier League Test',
        startDate: '2027-08-01',
        endDate: '2028-05-31',
      }),
    ).toEqual({
      code: '2027_TEST',
      name: 'Test season',
      competitionName: 'Premier League Test',
      startDate: '2027-08-01',
      endDate: '2028-05-31',
    });
    expect(() =>
      auditPayload('MEDIA_ASSET_STORED', {
        ownerKind: 'Club',
        ownerId: seasonId,
        mimeType: 'image/webp',
        byteSize: 100,
        width: 10,
        height: 10,
        storagePath: 'private/secret.webp',
      }),
    ).toThrow();
  });

  it('requires exact version references, effectivity and reasons on successful decisions', () => {
    const versionId = '4b06e6c8-c1bf-4b0f-90f9-e5713fac0fce';
    const seasonId = '964e0e54-b376-4bb2-a678-7d1ca83e2a36';
    expect(() =>
      validateAuditEvent({
        action: 'REGULATION_APPROVED',
        objectKind: 'RegulationVersion',
        objectId: versionId,
        seasonId,
        outcome: 'SUCCESS',
        reason: 'Independent manager approval.',
        before: { state: 'SUBMITTED' },
        after: {
          versionId,
          versionNumber: 1,
          effectiveMode: 'SCHEDULED',
        },
      }),
    ).toThrow('required fields');
    expect(() =>
      validateAuditEvent({
        action: 'REGULATION_APPROVED',
        objectKind: 'RegulationVersion',
        objectId: seasonId,
        seasonId,
        outcome: 'SUCCESS',
        reason: 'Independent manager approval.',
        before: { state: 'SUBMITTED' },
        after: {
          versionId,
          versionNumber: 1,
          effectiveMode: 'SCHEDULED',
          effectiveAt: '2027-08-01T00:00:00.000Z',
        },
      }),
    ).toThrow('exact version');
    expect(() =>
      validateAuditEvent({
        action: 'REGULATION_CHANGE_APPROVED',
        objectKind: 'RegulationChangeRequest',
        objectId: seasonId,
        seasonId,
        outcome: 'SUCCESS',
        before: { state: 'SUBMITTED' },
        after: {
          requestId: seasonId,
          versionId,
          versionNumber: 1,
          action: 'CANCEL',
          waitingVersionId: versionId,
          approvedAt: '2027-08-01T00:00:00.000Z',
        },
      }),
    ).toThrow('reason');

    expect(() =>
      validateAuditEvent({
        action: 'REGULATION_APPROVED',
        objectKind: 'RegulationVersion',
        objectId: versionId,
        seasonId,
        outcome: 'SUCCESS',
        before: { state: 'SUBMITTED' },
        after: {
          versionId,
          versionNumber: 1,
          effectiveMode: 'SCHEDULED',
          effectiveAt: '2027-08-01T00:00:00.000Z',
        },
      }),
    ).toThrow('reason');
  });

  it('requires Club and Stadium corrections to carry a reason, bounded basis and matching field summaries', () => {
    const clubId = '4b06e6c8-c1bf-4b0f-90f9-e5713fac0fce';
    const correction = {
      action: 'CLUB_CORRECTED' as const,
      objectKind: 'Club',
      objectId: clubId,
      outcome: 'SUCCESS' as const,
      before: { name: 'Club Before' },
      after: { name: 'Club After', correctionBasis: 'Verified official source record' },
    };
    expect(() => validateAuditEvent(correction)).toThrow('reason');
    expect(() =>
      validateAuditEvent({ ...correction, reason: 'Correct a source error.' }),
    ).not.toThrow();
    expect(() =>
      validateAuditEvent({
        ...correction,
        reason: 'Correct a source error.',
        after: { name: 'Club After' },
      }),
    ).toThrow('required fields');
    expect(() =>
      validateAuditEvent({
        ...correction,
        reason: 'Correct a source error.',
        after: { abbreviation: 'NFC', correctionBasis: 'Official club confirmation' },
      }),
    ).toThrow('matching changed fields');
    expect(() =>
      validateAuditEvent({
        ...correction,
        reason: 'Correct a source error.',
        after: { name: 'Club After', correctionBasis: '  ' },
      }),
    ).toThrow('bounded typed fields');
    expect(() =>
      validateAuditEvent({
        ...correction,
        reason: 'Correct a source error.',
        before: { name: 'Club Before', correctionBasis: 'Old source' },
      }),
    ).toThrow('bounded basis');

    const stadiumId = '964e0e54-b376-4bb2-a678-7d1ca83e2a36';
    expect(() =>
      validateAuditEvent({
        action: 'STADIUM_CORRECTED',
        objectKind: 'Stadium',
        objectId: stadiumId,
        outcome: 'SUCCESS',
        reason: 'Correct a source error.',
        before: { location: 'Old location' },
        after: { location: 'New location', correctionBasis: 'Approved venue record' },
      }),
    ).not.toThrow();
  });

  it('requires update summaries to pair matching changed keys and valid typed values', () => {
    const seasonId = '4b06e6c8-c1bf-4b0f-90f9-e5713fac0fce';
    expect(() =>
      validateAuditEvent({
        action: 'SEASON_UPDATED',
        objectKind: 'Season',
        objectId: seasonId,
        seasonId,
        outcome: 'SUCCESS',
        before: { startDate: '2027-08-01' },
        after: { endDate: '2028-05-31' },
      }),
    ).toThrow('matching changed fields');
    expect(() =>
      validateAuditEvent({
        action: 'SEASON_UPDATED',
        objectKind: 'Season',
        objectId: seasonId,
        seasonId,
        outcome: 'SUCCESS',
        before: { startDate: '2027-08-01' },
        after: { startDate: '2027-02-30' },
      }),
    ).toThrow('bounded typed fields');
    expect(() =>
      validateAuditEvent({
        action: 'STADIUM_UPDATED',
        objectKind: 'Stadium',
        objectId: seasonId,
        outcome: 'SUCCESS',
        before: { location: 'Old venue' },
        after: { location: 'x'.repeat(501) },
      }),
    ).toThrow('bounded typed fields');
    expect(() =>
      validateAuditEvent({
        action: 'SEASON_UPDATED',
        objectKind: 'Season',
        objectId: seasonId,
        seasonId,
        outcome: 'SUCCESS',
        before: { name: 'Same name' },
        after: { name: 'Same name' },
      }),
    ).toThrow('matching changed fields');
  });
});
