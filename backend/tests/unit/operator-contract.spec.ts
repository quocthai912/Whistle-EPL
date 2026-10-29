import {
  normalizeIdentity,
  recoveryInput,
  operatorIdentity,
} from '../../src/cli/operator-contract';
import { PassThrough } from 'node:stream';
import { readSecret } from '../../src/cli/secure-prompt';
import { commandArguments, operatorErrorKind } from '../../src/cli/operator-runtime';
import { ApplicationError } from '../../src/platform/application-error';

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
  it('uses kernel OS identity and rejects environment-only root attribution', () => {
    expect(
      operatorIdentity({
        uid: 1001,
        username: 'maintainer',
      }),
    ).toBe('uid:1001:maintainer');
    expect(operatorIdentity({ uid: 0, username: 'root', loginUid: '1001' })).toBe(
      'loginuid:1001 via uid:0:root',
    );
    expect(() =>
      operatorIdentity(
        Object.assign({ uid: 0, username: 'root' }, { sudoUid: '1001', sudoUser: 'forged' }),
      ),
    ).toThrow();
    expect(() => operatorIdentity({ uid: 0, username: 'root', loginUid: '4294967295' })).toThrow();
    expect(() => operatorIdentity({ uid: 0, username: 'root' })).toThrow();
  });
  it('accepts dash-prefixed operands while rejecting an actual option in place of its operand', () => {
    const argv = process.argv;
    try {
      process.argv = ['node', 'operator', '--full-name', '--Nguyễn', '--username', '--login'];
      expect(commandArguments(['--full-name', '--username'])).toEqual({
        '--full-name': '--Nguyễn',
        '--username': '--login',
      });
      process.argv = ['node', 'operator', '--full-name', '--username'];
      expect(() => commandArguments(['--full-name', '--username'])).toThrow();
      process.argv = ['node', 'operator', '--full-name'];
      expect(() => commandArguments(['--full-name'])).toThrow();
    } finally {
      process.argv = argv;
    }
  });
  it('classifies failures without returning caller-controlled names, messages or codes', () => {
    expect(operatorErrorKind(new ApplicationError(503, 'MAINTENANCE', 'synthetic secret'))).toBe(
      'APPLICATION_ERROR',
    );
    expect(operatorErrorKind(new TypeError('synthetic secret'))).toBe('TYPE_ERROR');
    expect(
      operatorErrorKind(
        Object.assign(new Error('synthetic secret'), {
          name: 'synthetic secret',
          code: 'synthetic secret',
        }),
      ),
    ).toBe('OPERATOR_ERROR');
    expect(operatorErrorKind({ name: 'synthetic secret' })).toBe('UNKNOWN_ERROR');
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
