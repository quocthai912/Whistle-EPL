import { auditPayload } from '../../src/audit/audit-payload.policy';

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
});
