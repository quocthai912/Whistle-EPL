import { assertIsolatedTarget } from '../fixtures/isolated-target.guard';
import { createPhase1Fixtures, resetPhase1Fixtures } from '../fixtures/phase-1-fixtures';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('isolated fixture target interface', () => {
  it('refuses operational URLs, production mode, ambiguous configuration and remote hosts', () => {
    const safe = 'postgresql://fixture:fixture@127.0.0.1:55437/whistle_test_foundation';
    expect(assertIsolatedTarget(safe, { nodeEnv: 'test' })).toBe(safe);
    for (const [url, options] of [
      [safe, { nodeEnv: 'production' }],
      ['postgresql://fixture:fixture@db.example.com/whistle_test_foundation', { nodeEnv: 'test' }],
      ['postgresql://fixture:fixture@127.0.0.1/whistle', { nodeEnv: 'test' }],
      [
        safe,
        { nodeEnv: 'test', operationalUrl: safe.replace('fixture:fixture', 'operator:different') },
      ],
      [safe + '?host=production', { nodeEnv: 'test' }],
    ] as const)
      expect(() => assertIsolatedTarget(url, options)).toThrow('isolated');
  });
  it('creates synthetic identities with two real-FK Seasons and resets only an acknowledged disposable target', async () => {
    const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const name = `whistle_test_fixture_${randomUUID().replaceAll('-', '')}`;
    const url = new URL(process.env.TEST_DATABASE_URL!);
    url.pathname = `/${name}`;
    await admin.query(`CREATE DATABASE "${name}"`);
    const target = new Pool({ connectionString: url.toString() });
    try {
      for (const directory of readdirSync(resolve('prisma/migrations'))
        .filter((n) => /^\d/.test(n))
        .sort()) {
        await target.query(
          readFileSync(resolve('prisma/migrations', directory, 'migration.sql'), 'utf8'),
        );
      }
      const fixture = await createPhase1Fixtures(url.toString());
      expect(fixture.accounts).toHaveLength(5);
      expect(fixture.seasons).toHaveLength(2);
      expect(new Set(fixture.seasons.map((s) => s.id)).size).toBe(2);
      expect(JSON.stringify(fixture)).not.toMatch(/password|argon2|credential/i);
      const roles = await target.query(
        'SELECT count(*)::int AS count FROM season_role_assignment r JOIN account a ON a.id=r.account_id JOIN season s ON s.id=r.season_id',
      );
      expect(roles.rows[0].count).toBe(3);
      await expect(resetPhase1Fixtures(url.toString(), '')).rejects.toThrow('acknowledgement');
      expect((await target.query('SELECT count(*)::int AS count FROM account')).rows[0].count).toBe(
        5,
      );
      await resetPhase1Fixtures(url.toString(), 'RESET_ISOLATED_TEST_DATABASE');
      expect((await target.query('SELECT count(*)::int AS count FROM account')).rows[0].count).toBe(
        0,
      );
      expect((await target.query('SELECT count(*)::int AS count FROM season')).rows[0].count).toBe(
        0,
      );
      expect(
        (await target.query('SELECT count(*)::int AS count FROM system_guard')).rows[0].count,
      ).toBe(3);
    } finally {
      await target.end();
      await admin.query(`DROP DATABASE "${name}"`);
      await admin.end();
    }
  });
});
