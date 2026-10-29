import {
  normalizeIdentity,
  recoveryInput,
  operatorIdentity,
} from '../../src/cli/operator-contract';
import { PassThrough } from 'node:stream';
import { readSecret } from '../../src/cli/secure-prompt';

describe('operator command input contract', () => {
  it('normalizes personnel identity and username without touching credentials', () => {
    expect(
      normalizeIdentity({
        personnelCode: ' staff_01 ',
        fullName: '  Nguyễn   Văn An ',
        username: ' Admin.One ',
      }),
    ).toEqual({ personnelCode: 'STAFF_01', fullName: 'Nguyễn Văn An', username: 'admin.one' });
    expect(() =>
      normalizeIdentity({ personnelCode: '../bad', fullName: 'An', username: 'admin' }),
    ).toThrow();
  });
  it('requires an existing-account locator, a reason and separate reset/unlock selection', () => {
    expect(() =>
      recoveryInput({ target: 'admin', reason: ' ', reset: true, unlock: false }),
    ).toThrow();
    expect(() =>
      recoveryInput({ target: 'admin', reason: 'repair', reset: false, unlock: false }),
    ).toThrow();
    expect(
      recoveryInput({ target: 'admin', reason: ' repair ', reset: false, unlock: true }).reason,
    ).toBe('repair');
  });
  it('uses authenticated OS context and refuses root without a sudo origin', () => {
    expect(
      operatorIdentity({
        uid: 1001,
        username: 'maintainer',
        sudoUid: undefined,
        sudoUser: undefined,
      }),
    ).toBe('uid:1001:maintainer');
    expect(
      operatorIdentity({ uid: 0, username: 'root', sudoUid: '1001', sudoUser: 'maintainer' }),
    ).toBe('uid:1001:maintainer via root');
    expect(() => operatorIdentity({ uid: 0, username: 'root' })).toThrow();
  });
  it('never echoes typed secrets and restores terminal mode on completion and cancellation', async () => {
    const input = Object.assign(new PassThrough(), {
      isTTY: true,
      isRaw: false,
      setRawMode(enabled: boolean) {
        this.isRaw = enabled;
        return this;
      },
    });
    const output = new PassThrough();
    let visible = '';
    output.on('data', (chunk) => {
      visible += String(chunk);
    });
    const pending = readSecret(input, output);
    input.write('secret with whitespace 🦉\r');
    expect(await pending).toBe('secret with whitespace 🦉');
    expect(visible).not.toContain('secret with');
    expect(input.isRaw).toBe(false);
    const cancelled = readSecret(input, output);
    input.write('\u0003');
    await expect(cancelled).rejects.toThrow();
    expect(input.isRaw).toBe(false);
    await expect(readSecret(Object.assign(input, { isTTY: false }), output)).rejects.toThrow();
  });
});
