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

  const compareIntendedSchema = () => {
    const databaseUrl = new URL(process.env.TEST_DATABASE_URL!);
    databaseUrl.searchParams.set('schema', schema);
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
        env: { ...process.env, DATABASE_URL: databaseUrl.toString() },
        encoding: 'utf8',
        timeout: 15000,
      },
    );
    return result;
  };

  it('matches the intended Prisma schema after committed deployment', () => {
    expect(compareIntendedSchema()).toContain('This is an empty migration');
  });

  it('detects drift in the temporary schema where migrations were replayed', async () => {
    await db.query('ALTER TABLE account ADD COLUMN replay_schema_probe TEXT');
    try {
      let exitStatus: number | undefined;
      try {
        compareIntendedSchema();
      } catch (error) {
        exitStatus = (error as { status?: number }).status;
      }
      expect(exitStatus).toBe(2);
    } finally {
      await db.query('ALTER TABLE account DROP COLUMN replay_schema_probe');
    }
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
      `INSERT INTO season(id,code,name,competition_name,start_date,end_date)
       VALUES($1,'TEST_SEASON','Mùa giải kiểm thử','Premier League Schema Fixture','2027-01-01','2027-12-31')`,
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
    const grantId = (
      await db.query('SELECT id FROM delegation_grant WHERE approved_version_id=$1', [first])
    ).rows[0].id;
    // An unreferenced grant must retain history just like one with processed boundaries.
    await expect(
      db.query('DELETE FROM delegation_grant WHERE id=$1', [grantId]),
    ).rejects.toMatchObject({ code: '23514' });
    await db.query(
      "UPDATE delegation_grant SET revoked_at='2027-01-01T12:00:00Z',revoked_by=$2 WHERE id=$1",
      [grantId, recorder],
    );
    await db.query(
      "UPDATE delegation_grant SET revoked_at='2027-01-01T12:00:00Z',revoked_by=$2 WHERE id=$1",
      [grantId, recorder],
    );
    for (const assignment of [
      'revoked_at=NULL',
      "revoked_at='2027-01-01T13:00:00Z'",
      'revoked_by=NULL',
    ])
      await expect(
        db.query(`UPDATE delegation_grant SET ${assignment} WHERE id=$1`, [grantId]),
      ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query('UPDATE delegation_grant SET revoked_by=$2 WHERE id=$1', [grantId, recipient]),
    ).rejects.toMatchObject({ code: '23514' });
    await db.query("UPDATE delegation_grant SET terminated_at='2027-01-01T14:00:00Z' WHERE id=$1", [
      grantId,
    ]);
    for (const assignment of [
      'terminated_at=NULL',
      "terminated_at='2027-01-01T15:00:00Z'",
      "ends_at='2027-01-04'",
    ])
      await expect(
        db.query(`UPDATE delegation_grant SET ${assignment} WHERE id=$1`, [grantId]),
      ).rejects.toMatchObject({ code: '23514' });
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

  it('keeps shared Club and Stadium identities stable and constrains Club-owned media metadata', async () => {
    const accountId = randomUUID();
    await db.query(
      `INSERT INTO account(id,personnel_code,full_name,username,password_hash,must_change_password)
       VALUES($1,'MEDIA_SCHEMA_01','Nhân viên kiểm thử','media.schema.user',
       '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',true)`,
      [accountId],
    );

    const clubId = randomUUID();
    const otherClubId = randomUUID();
    const stadiumId = randomUUID();
    const assetId = randomUUID();
    await db.query(
      `INSERT INTO club(id,code,name,abbreviation) VALUES
       ($1,'MEDIA_CLUB_1','Shared Club','SC'),($2,'MEDIA_CLUB_2','Shared Club','SC2')`,
      [clubId, otherClubId],
    );
    await db.query(
      `INSERT INTO stadium(id,code,name,location) VALUES($1,'MEDIA_STADIUM_1','Shared Stadium',NULL)`,
      [stadiumId],
    );
    await expect(
      db.query("UPDATE club SET code='CHANGED_CLUB' WHERE id=$1", [clubId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query('UPDATE club SET id=$1 WHERE id=$2', [randomUUID(), clubId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(db.query('DELETE FROM club WHERE id=$1', [clubId])).rejects.toMatchObject({
      code: '23514',
    });
    await expect(
      db.query("UPDATE stadium SET code='CHANGED_STADIUM' WHERE id=$1", [stadiumId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query('UPDATE stadium SET id=$1 WHERE id=$2', [randomUUID(), stadiumId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(db.query('DELETE FROM stadium WHERE id=$1', [stadiumId])).rejects.toMatchObject({
      code: '23514',
    });
    await expect(
      db.query(
        `INSERT INTO club(id,code,name,abbreviation) VALUES($1,'INVALID CLUB','Name','IC')`,
        [randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query(
        `INSERT INTO club(id,code,name,abbreviation) VALUES($1,'MEDIA_CLUB_3','   ','SC3')`,
        [randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query(
        `INSERT INTO club(id,code,name,abbreviation) VALUES($1,'MEDIA_CLUB_4','Valid Name','   ')`,
        [randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query(
        `INSERT INTO stadium(id,code,name,location) VALUES($1,'MEDIA_STADIUM_2','Name','   ')`,
        [randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    await db.query(
      `INSERT INTO media_asset(id,club_id,object_key,mime_type,byte_size,width,height,checksum,stored_by)
       VALUES($1,$2,'clubs/opaque-fixture.webp','image/webp',32,1,1,'fixture-checksum',$3)`,
      [assetId, clubId, accountId],
    );
    await db.query('UPDATE club SET current_logo_id=$1 WHERE id=$2', [assetId, clubId]);
    await expect(
      db.query('UPDATE media_asset SET unreferenced_at=now() WHERE id=$1', [assetId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query('UPDATE club SET current_logo_id=$1 WHERE id=$2', [assetId, otherClubId]),
    ).rejects.toMatchObject({ code: '23503' });
    await expect(
      db.query(
        `INSERT INTO media_asset(id,club_id,object_key,mime_type,byte_size,width,height,checksum,stored_by)
         VALUES($1,$2,'clubs/opaque-fixture.webp','image/webp',32,1,1,'fixture-checksum',$3)`,
        [randomUUID(), clubId, accountId],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      db.query(
        `INSERT INTO media_asset(id,club_id,object_key,mime_type,byte_size,width,height,checksum,stored_by)
         VALUES($1,$2,'clubs/unsupported','image/png',32,1,1,'fixture-checksum',$3)`,
        [randomUUID(), clubId, accountId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query(
        `INSERT INTO media_asset(id,club_id,object_key,mime_type,byte_size,width,height,checksum,stored_by)
         VALUES($1,$2,'clubs/missing-owner.webp','image/webp',32,1,1,'fixture-checksum',$3)`,
        [randomUUID(), randomUUID(), accountId],
      ),
    ).rejects.toMatchObject({ code: '23503' });
    await expect(
      db.query(
        `INSERT INTO media_asset(id,club_id,object_key,mime_type,byte_size,width,height,checksum,stored_by)
         VALUES($1,$2,'clubs/missing-actor.webp','image/webp',32,1,1,'fixture-checksum',$3)`,
        [randomUUID(), clubId, randomUUID()],
      ),
    ).rejects.toMatchObject({ code: '23503' });
    await expect(
      db.query(
        `INSERT INTO media_asset(id,club_id,object_key,mime_type,byte_size,width,height,checksum,stored_by)
         VALUES($1,$2,'clubs/oversized.webp','image/webp',2097153,1,1,'fixture-checksum',$3)`,
        [randomUUID(), clubId, accountId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query('UPDATE media_asset SET content_deleted_at=now() WHERE id=$1', [assetId]),
    ).rejects.toMatchObject({ code: '23514' });

    await db.query('UPDATE club SET current_logo_id=NULL WHERE id=$1', [clubId]);
    await db.query('UPDATE media_asset SET unreferenced_at=now() WHERE id=$1', [assetId]);
    await expect(
      db.query('UPDATE club SET current_logo_id=$1 WHERE id=$2', [assetId, clubId]),
    ).rejects.toMatchObject({ code: '23514' });
    await db.query('UPDATE media_asset SET content_deleted_at=now() WHERE id=$1', [assetId]);
    await expect(
      db.query("UPDATE media_asset SET checksum='rewritten' WHERE id=$1", [assetId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      db.query('UPDATE media_asset SET unreferenced_at=NULL WHERE id=$1', [assetId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(db.query('DELETE FROM media_asset WHERE id=$1', [assetId])).rejects.toMatchObject({
      code: '23514',
    });

    const playerTable = await db.query("SELECT to_regclass('player') IS NOT NULL AS present");
    expect(playerTable.rows[0].present).toBe(true);
  });

  it('enforces PHASE 3 catalogs, stable Player codes, Club/Player media XOR, BM1/D100 lineage, multi-interval registrations, received exceptions and D057 segments', async () => {
    const posCount = await db.query('SELECT count(*)::int AS count FROM position');
    const natCount = await db.query('SELECT count(*)::int AS count FROM nationality');
    expect(posCount.rows[0].count).toBe(13);
    expect(natCount.rows[0].count).toBe(253);

    const accountId = randomUUID();
    await db.query(
      `INSERT INTO account(id,personnel_code,full_name,username,password_hash,must_change_password)
       VALUES($1,'P3_SCHEMA_01','Nhân viên P3','p3.schema.user',
       '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',true)`,
      [accountId],
    );

    const seasonA = randomUUID();
    const seasonB = randomUUID();
    await db.query(
      `INSERT INTO season(id,code,name,competition_name,start_date,end_date) VALUES
       ($1,'P3_S1','Mùa giải P3-1','Premier League Fixture','2026-08-01','2027-05-31'),
       ($2,'P3_S2','Mùa giải P3-2','Premier League Fixture','2027-08-01','2028-05-31')`,
      [seasonA, seasonB],
    );
    const clubId = randomUUID();
    const stadiumId = randomUUID();
    await db.query(
      `INSERT INTO club(id,code,name,abbreviation) VALUES ($1,'P3_CLB','CLB P3','P3C')`,
      [clubId],
    );
    await db.query(`INSERT INTO stadium(id,code,name) VALUES ($1,'P3_STD','Sân P3')`, [stadiumId]);

    // Reject unapproved nationality/position keys
    const playerId = randomUUID();
    await expect(
      db.query(
        `INSERT INTO player(id,code,full_name,birth_date,nationality_code,position_code)
         VALUES($1,'P3_PL_BAD','Cầu thủ lỗi','2002-01-01','INVALID_NAT','ST')`,
        [playerId],
      ),
    ).rejects.toMatchObject({ code: '23503' });
    await expect(
      db.query(
        `INSERT INTO player(id,code,full_name,birth_date,nationality_code,position_code)
         VALUES($1,'P3_PL_BAD2','Cầu thủ lỗi','2002-01-01','ENG','FW')`,
        [playerId],
      ),
    ).rejects.toMatchObject({ code: '23503' });

    await db.query(
      `INSERT INTO player(id,code,full_name,birth_date,nationality_code,position_code)
       VALUES($1,'P3_PL_01','Nguyễn Văn A','2004-05-12','ENG','ST')`,
      [playerId],
    );
    // Stable non-reusable Player code
    await expect(
      db.query(`UPDATE player SET code='P3_PL_NEW' WHERE id=$1`, [playerId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(db.query(`DELETE FROM player WHERE id=$1`, [playerId])).rejects.toMatchObject({
      code: '23514',
    });

    // MediaAsset Club XOR Player check & Player portrait lifecycle
    const portraitId = randomUUID();
    await expect(
      db.query(
        `INSERT INTO media_asset(id,club_id,player_id,object_key,mime_type,byte_size,width,height,checksum,stored_by)
         VALUES($1,$2,$3,'both-owners.webp','image/webp',32,1,1,'chk',$4)`,
        [randomUUID(), clubId, playerId, accountId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await db.query(
      `INSERT INTO media_asset(id,player_id,object_key,mime_type,byte_size,width,height,checksum,stored_by)
       VALUES($1,$2,'player-portrait.webp','image/webp',32,1,1,'chk-p',$3)`,
      [portraitId, playerId, accountId],
    );
    await db.query(`UPDATE player SET current_portrait_id=$1 WHERE id=$2`, [portraitId, playerId]);
    await expect(
      db.query(`UPDATE media_asset SET unreferenced_at=now() WHERE id=$1`, [portraitId]),
    ).rejects.toMatchObject({ code: '23514' });

    // Unique season/club application case + same-case D100 baseline + immutable submitted content
    const appCaseId = randomUUID();
    await db.query(`INSERT INTO club_application(id,season_id,club_id) VALUES($1,$2,$3)`, [
      appCaseId,
      seasonA,
      clubId,
    ]);
    await expect(
      db.query(`INSERT INTO club_application(id,season_id,club_id) VALUES($1,$2,$3)`, [
        randomUUID(),
        seasonA,
        clubId,
      ]),
    ).rejects.toMatchObject({ code: '23505' });

    const appV1 = randomUUID();
    await db.query(
      `INSERT INTO club_application_version(id,season_id,case_id,version_number,prepared_by,state,received_at,coach_name,home_stadium_id)
       VALUES($1,$2,$3,1,$4,'APPROVED',now(),'HLV A',$5)`,
      [appV1, seasonA, appCaseId, accountId, stadiumId],
    );
    // Auto-seeded editor membership
    expect(
      (
        await db.query(
          `SELECT account_id FROM club_application_version_editor WHERE version_id=$1`,
          [appV1],
        )
      ).rows,
    ).toEqual([{ account_id: accountId }]);
    await db.query(`UPDATE club_application SET current_accepted_version_id=$1 WHERE id=$2`, [
      appV1,
      appCaseId,
    ]);
    // D100 correction requires explicit base_accepted_version_id in same case referencing an APPROVED version
    await expect(
      db.query(
        `INSERT INTO club_application_version(id,season_id,case_id,version_number,version_kind,prepared_by,state)
         VALUES($1,$2,$3,2,'CORRECTION',$4,'DRAFT')`,
        [randomUUID(), seasonA, appCaseId, accountId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    const appV2 = randomUUID();
    await db.query(
      `INSERT INTO club_application_version(id,season_id,case_id,version_number,version_kind,prepared_by,predecessor_version_id,base_accepted_version_id,state)
       VALUES($1,$2,$3,2,'CORRECTION',$4,$5,$5,'DRAFT')`,
      [appV2, seasonA, appCaseId, accountId, appV1],
    );
    // Reject D100 correction pointing to a non-APPROVED baseline (appV2 is DRAFT)
    await expect(
      db.query(
        `INSERT INTO club_application_version(id,season_id,case_id,version_number,version_kind,prepared_by,predecessor_version_id,base_accepted_version_id,state)
         VALUES($1,$2,$3,3,'CORRECTION',$4,$5,$5,'DRAFT')`,
        [randomUUID(), seasonA, appCaseId, accountId, appV2],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    // Freeze APPROVED official_snapshot and decision metadata
    await expect(
      db.query(
        `UPDATE club_application_version SET official_snapshot='{"tampered":true}'::jsonb WHERE id=$1`,
        [appV1],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    // ReceiptException requires already received same-season single target
    const exCaseId = randomUUID();
    await db.query(`INSERT INTO receipt_exception_case(id,season_id) VALUES($1,$2)`, [
      exCaseId,
      seasonA,
    ]);
    // Reject unreceived target (appV2 is DRAFT with received_at=NULL)
    await expect(
      db.query(
        `INSERT INTO receipt_exception_version(id,season_id,case_id,version_number,prepared_by,club_application_version_id)
         VALUES($1,$2,$3,1,$4,$5)`,
        [randomUUID(), seasonA, exCaseId, accountId, appV2],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    // Reject wrong-season target
    const exCaseB = randomUUID();
    await db.query(`INSERT INTO receipt_exception_case(id,season_id) VALUES($1,$2)`, [
      exCaseB,
      seasonB,
    ]);
    await expect(
      db.query(
        `INSERT INTO receipt_exception_version(id,season_id,case_id,version_number,prepared_by,club_application_version_id)
         VALUES($1,$2,$3,1,$4,$5)`,
        [randomUUID(), seasonB, exCaseB, accountId, appV1],
      ),
    ).rejects.toMatchObject({ code: '23503' });
    // Valid same-season received target
    await db.query(
      `INSERT INTO receipt_exception_version(id,season_id,case_id,version_number,prepared_by,club_application_version_id)
       VALUES($1,$2,$3,1,$4,$5)`,
      [randomUUID(), seasonA, exCaseId, accountId, appV1],
    );

    // Multiple player_registration cases for same (season, club, player) & D057 segment evidence
    const regCase1 = randomUUID();
    const regCase2 = randomUUID();
    await db.query(
      `INSERT INTO player_registration(id,season_id,club_id,player_id) VALUES ($1,$3,$4,$5),($2,$3,$4,$5)`,
      [regCase1, regCase2, seasonA, clubId, playerId],
    );
    const regCaseRegCase = randomUUID();
    const regRuleV1 = randomUUID();
    await db.query(`INSERT INTO regulation_case(id,season_id) VALUES($1,$2)`, [
      regCaseRegCase,
      seasonA,
    ]);
    await db.query(
      `INSERT INTO regulation_version(id,season_id,case_id,version_number,prepared_by) VALUES($1,$2,$3,1,$4)`,
      [regRuleV1, seasonA, regCaseRegCase, accountId],
    );
    const regV1 = randomUUID();
    const regV2 = randomUUID();
    // VALID registration version requires non-null playing_start
    await expect(
      db.query(
        `INSERT INTO registration_version(id,season_id,case_id,version_number,prepared_by,state,shirt_number)
         VALUES ($1,$2,$3,1,$4,'VALID',9)`,
        [randomUUID(), seasonA, regCase1, accountId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await db.query(
      `INSERT INTO registration_version(id,season_id,case_id,version_number,prepared_by,state,shirt_number,playing_start,playing_end)
       VALUES ($1,$2,$3,1,$4,'VALID',9,'2026-08-01T00:00:00Z','2026-12-01T00:00:00Z'),
              ($5,$2,$3,2,$4,'DRAFT',9,'2026-08-01T00:00:00Z','2026-12-01T00:00:00Z')`,
      [regV1, seasonA, regCase1, accountId, regV2],
    );
    const corrCaseId = randomUUID();
    const corrV1 = randomUUID();
    await db.query(
      `INSERT INTO registration_correction_case(id,season_id,registration_id) VALUES($1,$2,$3)`,
      [corrCaseId, seasonA, regCase1],
    );
    await db.query(
      `INSERT INTO registration_correction_version(id,season_id,registration_id,case_id,version_number,prepared_by,target_version_id,proposed_version_id)
       VALUES($1,$2,$3,$4,1,$5,$6,$7)`,
      [corrV1, seasonA, regCase1, corrCaseId, accountId, regV1, regV2],
    );
    await db.query(
      `INSERT INTO registration_correction_segment(id,season_id,correction_version_id,segment_order,segment_start,segment_end,regulation_version_id,outcome,findings)
       VALUES($1,$2,$3,1,'2026-08-01T00:00:00Z','2026-12-01T00:00:00Z',$4,'MET','[]'::jsonb)`,
      [randomUUID(), seasonA, corrV1, regRuleV1],
    );
  });

  it('migrates a populated PHASE 2 database forward while preserving existing accounts, seasons, clubs and logos', async () => {
    const popSchema = `pop_test_${randomUUID().replaceAll('-', '')}`;
    await db.query(`CREATE SCHEMA "${popSchema}"`);
    try {
      await db.query(`SET search_path TO "${popSchema}", public`);
      const dirs = readdirSync(resolve('prisma/migrations'))
        .filter((n) => /^\d/.test(n))
        .sort();
      const phase2Dirs = dirs.filter((d) => d < '20261120');
      const phase3Dirs = dirs.filter((d) => d >= '20261120');
      for (const dir of phase2Dirs) {
        await db.query(readFileSync(resolve('prisma/migrations', dir, 'migration.sql'), 'utf8'));
      }
      const accId = randomUUID();
      const clubId = randomUUID();
      const logoId = randomUUID();
      await db.query(
        `INSERT INTO account(id,personnel_code,full_name,username,password_hash,must_change_password)
         VALUES($1,'POP_01','Nhân viên cũ','pop.user','$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',false)`,
        [accId],
      );
      await db.query(
        `INSERT INTO club(id,code,name,abbreviation) VALUES($1,'POP_CLB','Populated Club','PC')`,
        [clubId],
      );
      await db.query(
        `INSERT INTO media_asset(id,club_id,object_key,mime_type,byte_size,width,height,checksum,stored_by)
         VALUES($1,$2,'pop-logo.webp','image/webp',32,1,1,'pop-chk',$3)`,
        [logoId, clubId, accId],
      );
      await db.query(`UPDATE club SET current_logo_id=$1 WHERE id=$2`, [logoId, clubId]);
      for (const dir of phase3Dirs) {
        await db.query(readFileSync(resolve('prisma/migrations', dir, 'migration.sql'), 'utf8'));
      }
      const clubAfter = await db.query(`SELECT code, current_logo_id FROM club WHERE id=$1`, [
        clubId,
      ]);
      expect(clubAfter.rows[0]).toEqual({ code: 'POP_CLB', current_logo_id: logoId });
      const assetAfter = await db.query(`SELECT club_id, player_id FROM media_asset WHERE id=$1`, [
        logoId,
      ]);
      expect(assetAfter.rows[0]).toEqual({ club_id: clubId, player_id: null });
    } catch (error) {
      await db.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      await db.query(`SET search_path TO "${schema}", public`);
      await db.query(`DROP SCHEMA "${popSchema}" CASCADE`);
    }
  });
});
