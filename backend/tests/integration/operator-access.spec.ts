import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { DatabaseService } from '../../src/platform/database.service';
import { BootstrapAdminService } from '../../src/cli/bootstrap-admin.service';
import { RecoverAdminService } from '../../src/cli/recover-admin.service';
import { resetPhase1Fixtures } from '../fixtures/phase-1-fixtures';

describe('protected operator administrator initialization', () => {
  const database = new DatabaseService(process.env.TEST_DATABASE_URL!);
  const observer = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  beforeAll(async () => {
    await resetPhase1Fixtures(process.env.TEST_DATABASE_URL!, 'RESET_ISOLATED_TEST_DATABASE');
  });
  afterAll(async () => {
    await database.close();
    await observer.end();
  });
  it('serializes concurrent bootstrap and refuses a locked existing administrator', async () => {
    // This suite uses a dedicated fresh DB; no public workflow or operational seed.
    const service = new BootstrapAdminService(database);
    const input = {
      personnelCode: `OP_${randomUUID().slice(0, 8)}`,
      fullName: 'Nhân viên kiểm thử',
      username: `op.${randomUUID()}`,
      password: 'Synthetic operator credential 🦉 only',
    };
    await expect(service.execute(input, '')).rejects.toThrow();
    expect((await observer.query('SELECT count(*)::int n FROM account')).rows[0].n).toBe(0);
    expect(
      (await observer.query('SELECT count(*)::int n FROM system_role_assignment')).rows[0].n,
    ).toBe(0);
    const results = await Promise.allSettled([
      service.execute(input, 'uid:1001:test-operator'),
      service.execute(
        { ...input, personnelCode: 'OP_OTHER', username: 'operator.other' },
        'uid:1001:test-operator',
      ),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rows = await observer.query(
      'SELECT a.* FROM account a JOIN system_role_assignment r ON r.account_id=a.id WHERE r.revoked_at IS NULL',
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0].must_change_password).toBe(true);
    expect(
      rows.rows[0].temporary_password_expires_at.getTime() - rows.rows[0].created_at.getTime(),
    ).toBe(86400000);
    await observer.query("UPDATE account SET state='LOCKED' WHERE id=$1", [rows.rows[0].id]);
    await expect(service.execute(input, 'uid:1001:test-operator')).rejects.toThrow();
    expect(
      (await observer.query('SELECT count(*)::int AS n FROM season_role_assignment')).rows[0].n,
    ).toBe(0);
    expect(
      (
        await observer.query(
          "SELECT count(*)::int AS n FROM audit_record WHERE action_code='ADMIN_BOOTSTRAPPED'",
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it('recovers only existing administrators, requires reason and preserves unlock/reset distinction', async () => {
    const row = (
      await observer.query(
        'SELECT a.* FROM account a JOIN system_role_assignment r ON r.account_id=a.id WHERE r.revoked_at IS NULL LIMIT 1',
      )
    ).rows[0];
    const service = new RecoverAdminService(database);
    const ordinary = await database.client.account.create({
      data: {
        personnelCode: 'OP_ORDINARY',
        fullName: 'Nhân viên thường',
        username: 'ordinary.operator.fixture',
        passwordHash: row.password_hash,
        mustChangePassword: true,
      },
    });
    await expect(
      service.execute(
        { target: ordinary.username, reason: 'must not promote', reset: false, unlock: true },
        'uid:1001:test-operator',
      ),
    ).rejects.toThrow();
    await expect(
      service.execute(
        { target: row.username, reason: ' ', reset: false, unlock: true },
        'uid:1001:test-operator',
      ),
    ).rejects.toThrow();
    await expect(
      service.execute(
        { target: 'missing.admin', reason: 'repair', reset: false, unlock: true },
        'uid:1001:test-operator',
      ),
    ).rejects.toThrow();
    const at = new Date();
    await database.client.session.create({
      data: {
        accountId: row.id,
        tokenHash: 'a'.repeat(64),
        csrfToken: 'x'.repeat(43),
        accountAuthRevision: row.auth_revision,
        createdAt: at,
        lastActivityAt: at,
        absoluteExpiresAt: new Date(at.getTime() + 28800000),
      },
    });
    await service.execute(
      { target: row.username, reason: 'authorized unlock', reset: false, unlock: true },
      'uid:1001:test-operator',
    );
    let recovered = (await observer.query('SELECT * FROM account WHERE id=$1', [row.id])).rows[0];
    expect(recovered.state).toBe('ACTIVE');
    expect(recovered.password_hash).toBe(row.password_hash);
    expect(
      (
        await observer.query(
          'SELECT count(*)::int n FROM session WHERE account_id=$1 AND revoked_at IS NULL',
          [row.id],
        )
      ).rows[0].n,
    ).toBe(0);
    await observer.query("UPDATE account SET state='LOCKED' WHERE id=$1", [row.id]);
    await service.execute(
      {
        target: row.username,
        reason: 'authorized reset',
        reset: true,
        unlock: false,
        password: 'Replacement synthetic credential 🦉 only',
      },
      'uid:1001:test-operator',
    );
    recovered = (await observer.query('SELECT * FROM account WHERE id=$1', [row.id])).rows[0];
    expect(recovered.password_hash).not.toBe(row.password_hash);
    expect(recovered.state).toBe('LOCKED');
    expect(recovered.must_change_password).toBe(true);
    expect(
      (
        await observer.query(
          "SELECT count(*)::int n FROM audit_record WHERE action_code='ADMIN_RECOVERED'",
        )
      ).rows[0].n,
    ).toBe(2);
    expect(
      (
        await observer.query(
          "SELECT after_data->>'reset' AS reset, after_data->>'unlock' AS unlock FROM audit_record WHERE action_code='ADMIN_RECOVERED' ORDER BY occurred_at",
        )
      ).rows,
    ).toEqual([
      { reset: 'false', unlock: 'true' },
      { reset: 'true', unlock: 'false' },
    ]);
    // Audit input rejection must abort both reset and session/account effects.
    await expect(
      service.execute({ target: row.username, reason: 'repair', reset: false, unlock: true }, ''),
    ).rejects.toThrow();
    expect(
      (await observer.query('SELECT auth_revision FROM account WHERE id=$1', [row.id])).rows[0]
        .auth_revision,
    ).toBe(recovered.auth_revision);
  });
});
