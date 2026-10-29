import { Pool } from 'pg';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import type { PoolClient } from 'pg';

describe('deployed PostgreSQL foundation schema', () => {
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const schema = `schema_test_${randomUUID().replaceAll('-', '')}`;
  let db: PoolClient;
  beforeAll(async () => {
    if (
      !process.env.TEST_DATABASE_URL ||
      !new URL(process.env.TEST_DATABASE_URL).pathname.startsWith('/whistle_test_')
    ) {
      throw new Error('An explicit isolated TEST_DATABASE_URL is required');
    }
    db = await pool.connect();
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.query(`SET search_path TO "${schema}", public`);
    for (const directory of readdirSync(resolve('prisma/migrations'))
      .filter((n) => /^\d/.test(n))
      .sort()) {
      await db.query(
        readFileSync(resolve('prisma/migrations', directory, 'migration.sql'), 'utf8'),
      );
    }
  });
  afterAll(async () => {
    if (db) {
      await db.query(`DROP SCHEMA "${schema}" CASCADE`);
      db.release();
    }
  });
  afterAll(() => pool.end());

  it('replays committed migrations on PostgreSQL 17 without operational seeds', async () => {
    expect(
      readFileSync(
        resolve('prisma/migrations/202610280001_identity_security/migration.sql'),
        'utf8',
      ),
    ).toContain('CREATE TABLE');
    expect(process.env.TEST_DATABASE_URL).toBeTruthy();
    const version = await pool.query('SHOW server_version_num');
    expect(Number(version.rows[0].server_version_num)).toBeGreaterThanOrEqual(170000);
    expect(Number(version.rows[0].server_version_num)).toBeLessThan(180000);
    const accounts = await db.query('SELECT count(*)::int AS count FROM account');
    const seasons = await db.query('SELECT count(*)::int AS count FROM season');
    expect(accounts.rows[0].count).toBe(0);
    expect(seasons.rows[0].count).toBe(0);
    const guards = await db.query('SELECT key FROM system_guard ORDER BY key');
    expect(guards.rows.map((r: { key: string }) => r.key)).toEqual([
      'bootstrap',
      'last-active-admin',
      'maintenance-admission',
    ]);
  });

  it('matches the intended Prisma schema after committed deployment', () => {
    const result = execFileSync(
      process.execPath,
      [
        resolve('node_modules/prisma/build/index.js'),
        'migrate',
        'diff',
        '--from-config-datasource',
        '--to-schema',
        'prisma/schema.prisma',
        '--script',
        '--exit-code',
      ],
      {
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
        encoding: 'utf8',
        timeout: 15000,
      },
    );
    expect(result).toContain('This is an empty migration');
  });

  it('enforces identity, digest/CSRF shapes, exact expiry and historical references', async () => {
    const id = randomUUID();
    const hash = '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture';
    await db.query(
      `INSERT INTO account(id,personnel_code,full_name,username,password_hash,must_change_password)
      VALUES ($1,'SCHEMA_01','Nhân viên kiểm thử','schema.user',$2,true)`,
      [id, hash],
    );
    await expect(
      db.query(`UPDATE account SET personnel_code='NEW_CODE' WHERE id=$1`, [id]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query(`UPDATE account SET username='UPPERCASE' WHERE id=$1`, [id]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query(`UPDATE account SET full_name='  Invalid  ' WHERE id=$1`, [id]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query(
        `INSERT INTO session(id,account_id,token_hash,csrf_token,account_auth_revision,created_at,last_activity_at,absolute_expires_at)
      VALUES($1,$2,$3,$4,1,now(),now(),now()+interval '8 hours')`,
        [randomUUID(), id, 'raw-token', 'a'.repeat(43)],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query(
        `INSERT INTO prelogin_csrf_context(id,csrf_token,created_at,expires_at) VALUES($1,$2,now(),now()+interval '16 minutes')`,
        [randomUUID(), 'a'.repeat(43)],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query(
        `INSERT INTO season_role_assignment(id,account_id,season_id,role_code,granted_by,granted_at)
      VALUES($1,$2,$3,'RESULTS_OFFICER',$2,now())`,
        [randomUUID(), id, randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23503' });
    await db.query(
      `INSERT INTO system_role_assignment(id,account_id,role_code,granted_by,granted_at) VALUES($1,$2,'SYSTEM_ADMINISTRATOR',$2,now())`,
      [randomUUID(), id],
    );
    await expect(
      db.query(
        `INSERT INTO system_role_assignment(id,account_id,role_code,granted_at) VALUES($1,$2,'SYSTEM_ADMINISTRATOR',now())`,
        [randomUUID(), id],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(db.query(`DELETE FROM account WHERE id=$1`, [id])).rejects.toMatchObject({
      code: '23514',
    });
  });

  it('preserves exact delegation versions, three-person separation and half-open non-overlapping intervals', async () => {
    const people = [randomUUID(), randomUUID(), randomUUID()];
    for (const [index, id] of people.entries())
      await db.query(
        `INSERT INTO account(id,personnel_code,full_name,username,password_hash,must_change_password)
      VALUES($1,$2,'Nhân viên kiểm thử',$3,'$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',true)`,
        [id, `DELEGATION_${index}`, `delegation.${index}`],
      );
    const [proposer, recipient, recorder] = people;
    const season = randomUUID();
    const caseId = randomUUID();
    await db.query(
      `INSERT INTO season(id,code,name,start_date,end_date) VALUES($1,'TEST_SEASON','Mùa giải kiểm thử','2027-01-01','2027-12-31')`,
      [season],
    );
    await db.query(
      `INSERT INTO season_role_assignment(id,account_id,season_id,role_code,granted_by,granted_at) VALUES($1,$2,$3,'SCHEDULING_OFFICER',$4,now())`,
      [randomUUID(), recipient, season, recorder],
    );
    await db.query(
      `INSERT INTO delegation_case(id,season_id,proposer_id,recipient_id) VALUES($1,$2,$3,$4)`,
      [caseId, season, proposer, recipient],
    );
    const version = async (number: number, start: string, end: string) => {
      const id = randomUUID();
      await db.query(
        `INSERT INTO delegation_version(id,case_id,version_number,prepared_by,state,submitted_at,action_code,start_mode,starts_at,ends_at,reason)
        VALUES($1,$2,$3,$4,'PENDING',now(),'APPROVE_SCHEDULE_ADJUSTMENT','SCHEDULED',$5,$6,'Cơ sở kiểm thử')`,
        [id, caseId, number, proposer, start, end],
      );
      return id;
    };
    const grant = async (versionId: string, start: string, end: string, by = recorder) =>
      db.query(
        `INSERT INTO delegation_grant(id,approved_version_id,recipient_id,season_id,action_code,starts_at,ends_at,granted_by,granted_at)
      VALUES($1,$2,$3,$4,'APPROVE_SCHEDULE_ADJUSTMENT',$5,$6,$7,now())`,
        [randomUUID(), versionId, recipient, season, start, end, by],
      );
    const first = await version(1, '2027-01-01', '2027-01-02');
    expect(
      (
        await db.query('SELECT account_id FROM delegation_version_editor WHERE version_id=$1', [
          first,
        ])
      ).rows,
    ).toEqual([{ account_id: proposer }]);
    await expect(
      db.query('UPDATE delegation_version SET reason=$1 WHERE id=$2', ['changed', first]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(grant(first, '2027-01-01', '2027-01-02', proposer)).rejects.toMatchObject({
      code: '23514',
    });
    await grant(first, '2027-01-01', '2027-01-02');
    await db.query("UPDATE delegation_version SET state='GRANTED' WHERE id=$1", [first]);
    const overlapping = await version(2, '2027-01-01T12:00:00Z', '2027-01-03');
    await expect(grant(overlapping, '2027-01-01T12:00:00Z', '2027-01-03')).rejects.toMatchObject({
      code: '23P01',
    });
    await db.query(
      "UPDATE delegation_version SET state='REJECTED',decision_reason='Trùng khoảng hiệu lực' WHERE id=$1",
      [overlapping],
    );
    const adjacent = await version(3, '2027-01-02', '2027-01-03');
    await grant(adjacent, '2027-01-02', '2027-01-03');
    await expect(
      db.query('UPDATE delegation_case SET current_version_id=$1 WHERE id=$2', [
        randomUUID(),
        caseId,
      ]),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('rejects incomplete receipt outcomes and preserves append-only audit records', async () => {
    const account = (await db.query("SELECT id FROM account WHERE username='schema.user'")).rows[0]
      .id;
    await expect(
      db.query(
        `INSERT INTO command_receipt(id,account_id,action_code,request_key,content_digest,outcome_state,completed_at,response_data)
      VALUES($1,$2,'ACCOUNT_LOCKED',$3,$4,'COMPLETED',now(),'{}')`,
        [randomUUID(), account, randomUUID(), 'a'.repeat(64)],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    const audit = randomUUID();
    await db.query(
      `INSERT INTO audit_record(id,actor_kind,occurred_at,action_code,object_kind,outcome) VALUES($1,'SYSTEM',clock_timestamp(),'SESSIONS_INVALIDATED','ACCOUNT','SUCCESS')`,
      [audit],
    );
    await expect(db.query('DELETE FROM audit_record WHERE id=$1', [audit])).rejects.toMatchObject({
      code: '23514',
    });
  });
});
