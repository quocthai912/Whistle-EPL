import { SecurityPrimitivesService } from '../../src/identity-access/security-primitives.service';

describe('credential and opaque-token interface', () => {
  const security = new SecurityPrimitivesService();
  it('counts Unicode code points and hashes the exact UTF-8 password with independent salts', async () => {
    const password = '  mật khẩu riêng 🦉🦉🦉🦉🦉  ';
    const first = await security.hashPassword(password);
    const second = await security.hashPassword(password);
    expect(first.split('$').slice(1, 3)).toEqual(['argon2id', 'v=19']);
    expect(first.split('$')[3].split(',').sort()).toEqual(['m=19456', 'p=1', 't=2']);
    expect(first).not.toEqual(second);
    expect(await security.verifyPassword(first, password)).toBe(true);
    expect(await security.verifyPassword(first, password.trim())).toBe(false);
    expect(await security.verifyPassword(first, password.normalize('NFD'))).toBe(false);
    expect(await security.hashPassword('🦉'.repeat(15))).toMatch(/^\$argon2id\$/);
    await expect(security.hashPassword('🦉'.repeat(14))).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    await expect(security.hashPassword('x'.repeat(129))).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(await security.verifyPassword('broken-hash', password)).toBe(false);
  });
  it('rejects the approved corpus, keeps tokens independent and expires at exact boundaries', async () => {
    await expect(security.hashPassword('films+pic+galeries')).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    const first = security.createSessionTokens();
    const second = security.createSessionTokens();
    expect(first.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.csrfToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.tokenHash).toBe(security.digest(first.token));
    expect(new Set([first.token, first.csrfToken, second.token, second.csrfToken]).size).toBe(4);
    expect(security.createPreloginId()).toMatch(
      /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/,
    );
    expect(security.equalTokens(first.csrfToken, first.csrfToken)).toBe(true);
    expect(security.equalTokens(first.csrfToken, second.csrfToken)).toBe(false);
    const start = new Date('2026-01-01T00:00:00.000Z');
    expect(security.credentialExpiry(start).toISOString()).toBe('2026-01-02T00:00:00.000Z');
    expect(security.preloginExpiry(start).toISOString()).toBe('2026-01-01T00:15:00.000Z');
    expect(security.isSessionTimeValid(start, start, new Date('2026-01-01T00:29:59.999Z'))).toBe(
      true,
    );
    expect(security.isSessionTimeValid(start, start, new Date('2026-01-01T00:30:00.000Z'))).toBe(
      false,
    );
    expect(
      security.isSessionTimeValid(
        start,
        new Date('2026-01-01T07:59:00.000Z'),
        new Date('2026-01-01T08:00:00.000Z'),
      ),
    ).toBe(false);
  });
});
