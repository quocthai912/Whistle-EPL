import { createPhase1Fixtures, resetPhase1Fixtures } from '../fixtures/phase-1-fixtures';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppModule } from '../../src/app.module';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { AuthService } from '../../src/identity-access/auth.service';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import { SecurityPrimitivesService } from '../../src/identity-access/security-primitives.service';
import { ApplicationError } from '../../src/platform/application-error';
import { DatabaseService } from '../../src/platform/database.service';
import { SafeErrorFilter } from '../../src/platform/error.filter';
import { ResponseEnvelopeInterceptor } from '../../src/platform/response-envelope.interceptor';
import { SafeValidationPipe } from '../../src/platform/validation.pipe';
import { SeasonDependenciesService } from '../../src/season-regulations/season-dependencies.service';
import type { DependencyResult } from '../../src/season-regulations/season-dependencies.port';

async function nextRegulationVersionNumber(pool: Pool, caseId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COALESCE(MAX(version_number), 0)::int + 1 AS next
     FROM regulation_version WHERE case_id = $1`,
    [caseId],
  );
  return result.rows[0].next;
}

async function insertDraftRegulationVersion(
  pool: Pool,
  options: {
    seasonId: string;
    caseId: string;
    preparedBy: string;
    versionNumber: number;
    predecessorVersionId?: string | null;
  },
): Promise<string> {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO regulation_version(id, season_id, case_id, version_number, prepared_by, predecessor_version_id)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      id,
      options.seasonId,
      options.caseId,
      options.versionNumber,
      options.preparedBy,
      options.predecessorVersionId ?? null,
    ],
  );
  return id;
}

async function insertCompleteRanking(pool: Pool, versionId: string): Promise<void> {
  await pool.query(
    `INSERT INTO ranking_priority(regulation_version_id, position, criterion_code)
     VALUES ($1,1,'POINTS'),($1,2,'GOAL_DIFFERENCE'),($1,3,'GOALS_FOR')`,
    [versionId],
  );
}

describe('PHASE 2 relational schema', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL!;
  const pool = new Pool({ connectionString: databaseUrl });
  let fixtures: Awaited<ReturnType<typeof createPhase1Fixtures>>;
  let primaryRegulationCaseId: string;
  let secondaryRegulationVersionId: string;
  let waitingRegulationVersionId: string;

  beforeEach(async () => {
    await resetPhase1Fixtures(databaseUrl, 'RESET_ISOLATED_TEST_DATABASE');
    fixtures = await createPhase1Fixtures(databaseUrl);
    const [firstSeason, secondSeason] = fixtures.seasons;
    const [preparer] = fixtures.accounts;
    primaryRegulationCaseId = randomUUID();
    const secondaryRegulationCaseId = randomUUID();
    await pool.query(`INSERT INTO regulation_case(id, season_id) VALUES ($1, $2), ($3, $4)`, [
      primaryRegulationCaseId,
      firstSeason.id,
      secondaryRegulationCaseId,
      secondSeason.id,
    ]);
    secondaryRegulationVersionId = await insertDraftRegulationVersion(pool, {
      seasonId: secondSeason.id,
      caseId: secondaryRegulationCaseId,
      preparedBy: preparer.id,
      versionNumber: 1,
    });
    waitingRegulationVersionId = await insertDraftRegulationVersion(pool, {
      seasonId: firstSeason.id,
      caseId: primaryRegulationCaseId,
      preparedBy: preparer.id,
      versionNumber: 1,
    });
    await insertCompleteRanking(pool, waitingRegulationVersionId);
    await pool.query(
      `UPDATE regulation_version
       SET state = 'APPROVED_WAITING', submitted_at = now(), effective_mode = 'SCHEDULED',
           proposed_effective_at = now() + interval '1 day', approved_at = now()
       WHERE id = $1`,
      [waitingRegulationVersionId],
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it('preserves Season identities while adding a required competition name and zero statistics revision', async () => {
    const result = await pool.query(
      `SELECT id, competition_name, statistics_revision
       FROM season WHERE id = ANY($1::uuid[]) ORDER BY id`,
      [fixtures.seasons.map((season) => season.id)],
    );

    expect(result.rows).toHaveLength(2);
    expect(new Set(result.rows.map((row) => row.id))).toEqual(
      new Set(fixtures.seasons.map((season) => season.id)),
    );
    expect(result.rows.map((row) => row.competition_name)).toEqual([
      'Premier League Test Fixture',
      'Premier League Test Fixture',
    ]);
    expect(result.rows.map((row) => row.statistics_revision)).toEqual(['0', '0']);
  });

  it('keeps Season date and state constraints in PostgreSQL', async () => {
    const seasonId = fixtures.seasons[0].id;

    await expect(
      pool.query(`UPDATE season SET end_date = start_date - 1 WHERE id = $1`, [seasonId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      pool.query(`UPDATE season SET state = 'ARCHIVED' WHERE id = $1`, [seasonId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      pool.query(`UPDATE season SET statistics_revision = -1 WHERE id = $1`, [seasonId]),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('replays the additive migration over populated foundation rows and compares them independently', async () => {
    const isolatedPool = new Pool({ connectionString: databaseUrl });
    const schema = `phase2_populated_${randomUUID().replaceAll('-', '')}`;
    let migrationClient: PoolClient | undefined;
    let observerClient: PoolClient | undefined;
    let schemaCreated = false;
    try {
      await isolatedPool.query(`CREATE SCHEMA "${schema}"`);
      schemaCreated = true;
      migrationClient = await isolatedPool.connect();
      observerClient = await isolatedPool.connect();
      for (const client of [migrationClient, observerClient])
        await client.query(`SET search_path TO "${schema}", public`);

      const directories = readdirSync(resolve('prisma/migrations'))
        .filter((name) => /^\d/.test(name))
        .sort();
      const phaseOneMigrations = directories.filter(
        (name) => name < '202611150001_season_foundation_expansion',
      );
      expect(phaseOneMigrations).toHaveLength(7);
      for (const directory of phaseOneMigrations)
        await migrationClient.query(
          readFileSync(resolve('prisma/migrations', directory, 'migration.sql'), 'utf8'),
        );

      const accountIds = Array.from({ length: 4 }, () => randomUUID());
      const seasonIds = [randomUUID(), randomUUID()];
      const now = new Date();
      for (const [index, id] of accountIds.entries())
        await migrationClient.query(
          `INSERT INTO account(id,personnel_code,full_name,username,password_hash,must_change_password)
           VALUES($1,$2,$3,$4,'$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture',true)`,
          [
            id,
            `REPLAY_${index}_${id.replaceAll('-', '').slice(0, 8).toUpperCase()}`,
            `Synthetic migration replay account ${index + 1}`,
            `replay.${index}.${id.replaceAll('-', '').slice(0, 8)}`,
          ],
        );
      for (const [index, id] of seasonIds.entries())
        await migrationClient.query(
          `INSERT INTO season(id,code,name,start_date,end_date)
           VALUES($1,$2,$3,$4,$5)`,
          [
            id,
            `REPLAY_${index}_${id.replaceAll('-', '').slice(0, 8).toUpperCase()}`,
            `Synthetic migration replay season ${index + 1}`,
            `${2026 + index}-08-01`,
            `${2027 + index}-05-31`,
          ],
        );
      await migrationClient.query(
        `INSERT INTO system_role_assignment(id,account_id,role_code,granted_by,granted_at)
         VALUES($1,$2,'SYSTEM_ADMINISTRATOR',$2,$3)`,
        [randomUUID(), accountIds[0], now],
      );
      await migrationClient.query(
        `INSERT INTO season_role_assignment(id,account_id,season_id,role_code,granted_by,granted_at)
         VALUES($1,$2,$3,'SEASON_MANAGER',$4,$5),($6,$7,$8,'REGISTRATION_OFFICER',$4,$5)`,
        [
          randomUUID(),
          accountIds[2],
          seasonIds[0],
          accountIds[0],
          now,
          randomUUID(),
          accountIds[3],
          seasonIds[0],
        ],
      );

      const delegationCaseId = randomUUID();
      const delegationVersionId = randomUUID();
      await migrationClient.query(
        `INSERT INTO delegation_case(id,season_id,proposer_id,recipient_id)
         VALUES($1,$2,$3,$4)`,
        [delegationCaseId, seasonIds[0], accountIds[2], accountIds[3]],
      );
      await migrationClient.query(
        `INSERT INTO delegation_version(id,case_id,version_number,prepared_by,action_code,start_mode)
         VALUES($1,$2,1,$3,'PREPARE_REGULATION_CHANGE','IMMEDIATE')`,
        [delegationVersionId, delegationCaseId, accountIds[2]],
      );
      await migrationClient.query(
        `UPDATE delegation_case SET current_version_id = $1 WHERE id = $2`,
        [delegationVersionId, delegationCaseId],
      );
      await migrationClient.query(
        `INSERT INTO audit_record(id,actor_id,actor_kind,occurred_at,action_code,object_kind,object_id,season_id,outcome)
         VALUES($1,$2,'ACCOUNT',$3,'MIGRATION_REPLAY_FIXTURE','SEASON',$4,$5,'SUCCEEDED')`,
        [randomUUID(), accountIds[0], now, seasonIds[0], seasonIds[0]],
      );

      await migrationClient.query(`
        CREATE TABLE phase2_season_competition_name_backfill (
          season_id uuid PRIMARY KEY REFERENCES season(id) ON DELETE RESTRICT,
          competition_name text NOT NULL
            CHECK (char_length(btrim(competition_name)) BETWEEN 1 AND 200)
        )`);
      for (const id of seasonIds)
        await migrationClient.query(
          `INSERT INTO phase2_season_competition_name_backfill(season_id,competition_name)
           VALUES($1,'Premier League Synthetic Replay Fixture')`,
          [id],
        );

      const identitySnapshot = async (client: PoolClient) => {
        const snapshot: Record<string, string[]> = {};
        for (const table of [
          'account',
          'season',
          'system_role_assignment',
          'season_role_assignment',
          'delegation_case',
          'delegation_version',
          'delegation_version_editor',
          'audit_record',
        ]) {
          const identity =
            table === 'delegation_version_editor'
              ? "version_id::text || ':' || account_id::text"
              : 'id::text';
          const rows = await client.query(
            `SELECT ${identity} AS identity FROM ${table} ORDER BY identity`,
          );
          snapshot[table] = rows.rows.map((row: { identity: string }) => row.identity);
        }
        return snapshot;
      };
      const before = await identitySnapshot(observerClient);

      for (const directory of directories.filter(
        (name) => name >= '202611150001_season_foundation_expansion',
      ))
        await migrationClient.query(
          readFileSync(resolve('prisma/migrations', directory, 'migration.sql'), 'utf8'),
        );

      const after = await identitySnapshot(observerClient);
      expect(after).toEqual(before);
      const mapped = await observerClient.query(
        `SELECT count(*)::int AS total,
                count(*) FILTER (WHERE competition_name = 'Premier League Synthetic Replay Fixture')::int AS mapped,
                count(*) FILTER (WHERE statistics_revision = 0)::int AS zero_revision
         FROM season`,
      );
      expect(mapped.rows[0]).toEqual({ total: 2, mapped: 2, zero_revision: 2 });
      const noRuleSeed = await observerClient.query(
        `SELECT count(*)::int AS count FROM regulation_version`,
      );
      expect(noRuleSeed.rows[0].count).toBe(0);
      const consumedStage = await observerClient.query(
        `SELECT to_regclass('phase2_season_competition_name_backfill') AS relation`,
      );
      expect(consumedStage.rows[0].relation).toBeNull();
    } catch (error) {
      await migrationClient?.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      migrationClient?.release();
      observerClient?.release();
      if (schemaCreated) await isolatedPool.query(`DROP SCHEMA "${schema}" CASCADE`);
      await isolatedPool.end();
    }
  });

  it('keeps exact regulation versions in one season and enforces immutable, single-current states', async () => {
    const [firstSeason] = fixtures.seasons;
    const [preparer] = fixtures.accounts;
    const firstCaseId = primaryRegulationCaseId;

    await expect(
      pool.query(`INSERT INTO regulation_case(id, season_id) VALUES ($1, $2)`, [
        randomUUID(),
        firstSeason.id,
      ]),
    ).rejects.toMatchObject({ code: '23505' });

    const insertVersion = async (options: {
      caseId: string;
      seasonId: string;
      versionNumber: number;
      state?: string;
      effectiveMode?: string | null;
      proposedEffectiveAt?: Date | null;
      submittedAt?: Date | null;
      approvedAt?: Date | null;
      activeFrom?: Date | null;
      predecessorVersionId?: string | null;
      squadLimit?: number | null;
      includeRanking?: boolean;
    }) => {
      const id = randomUUID();
      await pool.query(
        `INSERT INTO regulation_version(
           id, season_id, case_id, version_number, prepared_by, predecessor_version_id,
           state, effective_mode, proposed_effective_at, squad_limit
         ) VALUES ($1,$2,$3,$4,$5,$6,'DRAFT',$7,$8,$9)`,
        [
          id,
          options.seasonId,
          options.caseId,
          options.versionNumber,
          preparer.id,
          options.predecessorVersionId ?? null,
          options.effectiveMode ?? null,
          options.proposedEffectiveAt ?? null,
          options.squadLimit ?? null,
        ],
      );
      if (options.includeRanking !== false)
        await pool.query(
          `INSERT INTO ranking_priority(regulation_version_id, position, criterion_code)
           VALUES ($1,1,'POINTS'),($1,2,'GOAL_DIFFERENCE'),($1,3,'GOALS_FOR')`,
          [id],
        );
      if (options.state && options.state !== 'DRAFT')
        await pool.query(
          `UPDATE regulation_version
           SET state = $1, submitted_at = $2, approved_at = $3, active_from = $4
           WHERE id = $5`,
          [
            options.state,
            options.submittedAt ?? new Date(),
            options.approvedAt ?? null,
            options.activeFrom ?? null,
            id,
          ],
        );
      return id;
    };

    const draftId = await insertVersion({
      caseId: firstCaseId,
      seasonId: firstSeason.id,
      versionNumber: await nextRegulationVersionNumber(pool, firstCaseId),
    });
    const seededEditors = await pool.query(
      `SELECT account_id FROM regulation_version_editor WHERE version_id = $1`,
      [draftId],
    );
    expect(seededEditors.rows).toEqual([{ account_id: preparer.id }]);

    await expect(
      insertVersion({
        caseId: firstCaseId,
        seasonId: firstSeason.id,
        versionNumber: await nextRegulationVersionNumber(pool, firstCaseId),
        predecessorVersionId: secondaryRegulationVersionId,
      }),
    ).rejects.toMatchObject({ code: '23503' });
    await expect(
      insertVersion({ caseId: firstCaseId, seasonId: firstSeason.id, versionNumber: 0 }),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      insertVersion({
        caseId: firstCaseId,
        seasonId: firstSeason.id,
        versionNumber: await nextRegulationVersionNumber(pool, firstCaseId),
        state: 'APPROVED',
      }),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      insertVersion({
        caseId: firstCaseId,
        seasonId: firstSeason.id,
        versionNumber: await nextRegulationVersionNumber(pool, firstCaseId),
        state: 'SUBMITTED',
        effectiveMode: 'SCHEDULED',
        submittedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      insertVersion({
        caseId: firstCaseId,
        seasonId: firstSeason.id,
        versionNumber: await nextRegulationVersionNumber(pool, firstCaseId),
        effectiveMode: 'IMMEDIATE',
        proposedEffectiveAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: '23514' });

    const submittedId = await insertVersion({
      caseId: firstCaseId,
      seasonId: firstSeason.id,
      versionNumber: await nextRegulationVersionNumber(pool, firstCaseId),
      state: 'SUBMITTED',
      effectiveMode: 'SCHEDULED',
      proposedEffectiveAt: new Date(Date.now() + 86_400_000),
      submittedAt: new Date(),
      squadLimit: 25,
    });
    await expect(
      pool.query(`UPDATE regulation_version SET squad_limit = 26 WHERE id = $1`, [submittedId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      pool.query(`INSERT INTO regulation_version_editor(version_id, account_id) VALUES ($1,$2)`, [
        submittedId,
        fixtures.accounts[1].id,
      ]),
    ).rejects.toMatchObject({ code: '23514' });
    await pool.query(
      `UPDATE regulation_version SET state = 'RETURNED', decided_at = now(), decision_reason = 'fixture return'
       WHERE id = $1`,
      [submittedId],
    );

    const waitingAt = new Date(Date.now() + 86_400_000);
    await expect(
      insertVersion({
        caseId: firstCaseId,
        seasonId: firstSeason.id,
        versionNumber: await nextRegulationVersionNumber(pool, firstCaseId),
        state: 'APPROVED_WAITING',
        effectiveMode: 'SCHEDULED',
        proposedEffectiveAt: waitingAt,
        submittedAt: new Date(),
        approvedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: '23505' });

    const effectiveId = await insertVersion({
      caseId: firstCaseId,
      seasonId: firstSeason.id,
      versionNumber: await nextRegulationVersionNumber(pool, firstCaseId),
      state: 'EFFECTIVE',
      effectiveMode: 'IMMEDIATE',
      submittedAt: new Date(),
      approvedAt: new Date(),
      activeFrom: new Date(),
    });
    await expect(
      insertVersion({
        caseId: firstCaseId,
        seasonId: firstSeason.id,
        versionNumber: await nextRegulationVersionNumber(pool, firstCaseId),
        state: 'EFFECTIVE',
        effectiveMode: 'IMMEDIATE',
        submittedAt: new Date(),
        approvedAt: new Date(),
        activeFrom: new Date(),
      }),
    ).rejects.toMatchObject({ code: '23505' });

    await pool.query(`UPDATE regulation_case SET current_draft_version_id = $1 WHERE id = $2`, [
      draftId,
      firstCaseId,
    ]);
    await expect(
      pool.query(`UPDATE regulation_case SET current_draft_version_id = $1 WHERE id = $2`, [
        secondaryRegulationVersionId,
        firstCaseId,
      ]),
    ).rejects.toMatchObject({ code: '23503' });

    await pool.query(`UPDATE season SET current_regulation_version_id = $1 WHERE id = $2`, [
      effectiveId,
      firstSeason.id,
    ]);
    await expect(
      pool.query(`UPDATE season SET current_regulation_version_id = $1 WHERE id = $2`, [
        secondaryRegulationVersionId,
        firstSeason.id,
      ]),
    ).rejects.toMatchObject({ code: '23503' });

    const singleStates = await pool.query(
      `SELECT count(*) FILTER (WHERE state = 'APPROVED_WAITING')::int AS waiting,
              count(*) FILTER (WHERE state = 'EFFECTIVE')::int AS effective
       FROM regulation_version WHERE season_id = $1`,
      [firstSeason.id],
    );
    expect(singleStates.rows[0]).toEqual({ waiting: 1, effective: 1 });
  });

  it('enforces complete ranking order, window intervals, catalog bounds and submitted child immutability', async () => {
    const [season] = fixtures.seasons;
    const [preparer] = fixtures.accounts;
    const versionNumber = await nextRegulationVersionNumber(pool, primaryRegulationCaseId);
    const versionId = await insertDraftRegulationVersion(pool, {
      seasonId: season.id,
      caseId: primaryRegulationCaseId,
      preparedBy: preparer.id,
      versionNumber,
    });
    await insertCompleteRanking(pool, versionId);

    const clubWindowId = randomUUID();
    const adjacentWindowId = randomUUID();
    const playerWindowId = randomUUID();
    await pool.query(
      `INSERT INTO registration_window(id, regulation_version_id, intake_kind, opens_at, closes_at)
       VALUES
         ($1,$4,'CLUB_APPLICATION','2030-01-01T00:00:00Z','2030-02-01T00:00:00Z'),
         ($2,$4,'CLUB_APPLICATION','2030-02-01T00:00:00Z','2030-03-01T00:00:00Z'),
         ($3,$4,'PLAYER_CHANGE','2030-01-15T00:00:00Z','2030-02-15T00:00:00Z')`,
      [clubWindowId, adjacentWindowId, playerWindowId, versionId],
    );
    await expect(
      pool.query(
        `INSERT INTO registration_window(id, regulation_version_id, intake_kind, opens_at, closes_at)
         VALUES ($1,$2,'CLUB_APPLICATION','2030-01-20T00:00:00Z','2030-02-05T00:00:00Z')`,
        [randomUUID(), versionId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      pool.query(
        `INSERT INTO registration_window(id, regulation_version_id, intake_kind, opens_at, closes_at)
         VALUES ($1,$2,'CLUB_APPLICATION','2030-03-01T00:00:00Z','2030-03-01T00:00:00Z')`,
        [randomUUID(), versionId],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    const goalTypeId = randomUUID();
    await pool.query(
      `INSERT INTO goal_type(id, regulation_version_id, code, name, is_own_goal, enabled)
       VALUES ($1,$2,'OPEN_PLAY','Open play',false,true)`,
      [goalTypeId, versionId],
    );
    await expect(
      pool.query(
        `INSERT INTO goal_type(id, regulation_version_id, code, name, is_own_goal, enabled)
         VALUES ($1,$2,'OPEN_PLAY','Duplicate code',false,true)`,
        [randomUUID(), versionId],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    await expect(
      pool.query(
        `INSERT INTO goal_type(id, regulation_version_id, code, name, is_own_goal, enabled)
         VALUES ($1,$2,'','Invalid code',false,true)`,
        [randomUUID(), versionId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      pool.query(
        `INSERT INTO goal_type(id, regulation_version_id, code, name, is_own_goal, enabled)
         VALUES ($1,$2,'NO_NAME','   ',false,true)`,
        [randomUUID(), versionId],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    const cardTypeId = randomUUID();
    await pool.query(
      `INSERT INTO card_type(id, regulation_version_id, code, name, meaning, enabled)
       VALUES ($1,$2,'YELLOW','Yellow card','YELLOW',true)`,
      [cardTypeId, versionId],
    );
    await expect(
      pool.query(
        `INSERT INTO card_type(id, regulation_version_id, code, name, meaning, enabled)
         VALUES ($1,$2,'BLUE','Blue card','BLUE',true)`,
        [randomUUID(), versionId],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    await pool.query(
      `UPDATE regulation_version
       SET state = 'SUBMITTED', submitted_at = now(), effective_mode = 'IMMEDIATE'
       WHERE id = $1`,
      [versionId],
    );
    await expect(
      pool.query(
        `INSERT INTO registration_window(id, regulation_version_id, intake_kind, opens_at, closes_at)
         VALUES ($1,$2,'PLAYER_CHANGE','2031-01-01T00:00:00Z','2031-02-01T00:00:00Z')`,
        [randomUUID(), versionId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      pool.query(`UPDATE goal_type SET name = 'Changed' WHERE id = $1`, [goalTypeId]),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      pool.query(`DELETE FROM ranking_priority WHERE regulation_version_id = $1 AND position = 1`, [
        versionId,
      ]),
    ).rejects.toMatchObject({ code: '23514' });

    const noncontiguousId = await insertDraftRegulationVersion(pool, {
      seasonId: season.id,
      caseId: primaryRegulationCaseId,
      preparedBy: preparer.id,
      versionNumber: await nextRegulationVersionNumber(pool, primaryRegulationCaseId),
    });
    await pool.query(
      `INSERT INTO ranking_priority(regulation_version_id, position, criterion_code)
       VALUES ($1,1,'POINTS'),($1,3,'GOAL_DIFFERENCE'),($1,4,'GOALS_FOR')`,
      [noncontiguousId],
    );
    await expect(
      pool.query(
        `UPDATE regulation_version
         SET state = 'SUBMITTED', submitted_at = now(), effective_mode = 'IMMEDIATE'
         WHERE id = $1`,
        [noncontiguousId],
      ),
    ).rejects.toMatchObject({ code: '23514' });

    const incompleteId = await insertDraftRegulationVersion(pool, {
      seasonId: season.id,
      caseId: primaryRegulationCaseId,
      preparedBy: preparer.id,
      versionNumber: await nextRegulationVersionNumber(pool, primaryRegulationCaseId),
    });
    await pool.query(
      `INSERT INTO ranking_priority(regulation_version_id, position, criterion_code)
       VALUES ($1,1,'POINTS'),($1,2,'GOAL_DIFFERENCE')`,
      [incompleteId],
    );
    await expect(
      pool.query(
        `UPDATE regulation_version
         SET state = 'SUBMITTED', submitted_at = now(), effective_mode = 'IMMEDIATE'
         WHERE id = $1`,
        [incompleteId],
      ),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('keeps change, lifecycle and schema-only summary targets scoped to exact cases and seasons', async () => {
    const [firstSeason, secondSeason] = fixtures.seasons;
    const [preparer] = fixtures.accounts;
    const firstChangeId = randomUUID();
    const secondChangeId = randomUUID();
    await pool.query(
      `INSERT INTO regulation_change_request(id, season_id) VALUES ($1,$2),($3,$4)`,
      [firstChangeId, firstSeason.id, secondChangeId, secondSeason.id],
    );

    const sameSeasonReplacementId = await insertDraftRegulationVersion(pool, {
      seasonId: firstSeason.id,
      caseId: primaryRegulationCaseId,
      preparedBy: preparer.id,
      versionNumber: await nextRegulationVersionNumber(pool, primaryRegulationCaseId),
    });
    const insertChangeVersion = (options: {
      id: string;
      seasonId: string;
      caseId: string;
      versionNumber: number;
      action: string;
      waitingId: string;
      replacementId?: string | null;
      reason?: string | null;
      state?: string;
      submittedAt?: Date | null;
    }) =>
      pool.query(
        `INSERT INTO regulation_change_version(
           id, season_id, case_id, version_number, prepared_by, action,
           waiting_version_id, replacement_version_id, reason, state, submitted_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          options.id,
          options.seasonId,
          options.caseId,
          options.versionNumber,
          preparer.id,
          options.action,
          options.waitingId,
          options.replacementId ?? null,
          options.reason ?? null,
          options.state ?? 'DRAFT',
          options.submittedAt ?? null,
        ],
      );

    await expect(
      insertChangeVersion({
        id: randomUUID(),
        seasonId: firstSeason.id,
        caseId: firstChangeId,
        versionNumber: 1,
        action: 'CANCEL',
        waitingId: waitingRegulationVersionId,
        replacementId: sameSeasonReplacementId,
      }),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      insertChangeVersion({
        id: randomUUID(),
        seasonId: firstSeason.id,
        caseId: firstChangeId,
        versionNumber: 1,
        action: 'REPLACE',
        waitingId: waitingRegulationVersionId,
      }),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      insertChangeVersion({
        id: randomUUID(),
        seasonId: firstSeason.id,
        caseId: firstChangeId,
        versionNumber: 1,
        action: 'CANCEL',
        waitingId: secondaryRegulationVersionId,
      }),
    ).rejects.toMatchObject({ code: '23503' });

    const validReplacement = randomUUID();
    await insertChangeVersion({
      id: validReplacement,
      seasonId: firstSeason.id,
      caseId: firstChangeId,
      versionNumber: 1,
      action: 'REPLACE',
      waitingId: waitingRegulationVersionId,
      replacementId: sameSeasonReplacementId,
    });
    await pool.query(`UPDATE regulation_change_request SET current_version_id = $1 WHERE id = $2`, [
      validReplacement,
      firstChangeId,
    ]);
    const secondChangeVersion = randomUUID();
    await insertChangeVersion({
      id: secondChangeVersion,
      seasonId: secondSeason.id,
      caseId: secondChangeId,
      versionNumber: 1,
      action: 'CANCEL',
      waitingId: secondaryRegulationVersionId,
    });
    await expect(
      pool.query(`UPDATE regulation_change_request SET current_version_id = $1 WHERE id = $2`, [
        secondChangeVersion,
        firstChangeId,
      ]),
    ).rejects.toMatchObject({ code: '23503' });
    await expect(
      insertChangeVersion({
        id: randomUUID(),
        seasonId: firstSeason.id,
        caseId: firstChangeId,
        versionNumber: 2,
        action: 'CANCEL',
        waitingId: waitingRegulationVersionId,
        state: 'SUBMITTED',
        submittedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: '23514' });
    const submittedCancel = randomUUID();
    await insertChangeVersion({
      id: submittedCancel,
      seasonId: firstSeason.id,
      caseId: firstChangeId,
      versionNumber: 2,
      action: 'CANCEL',
      waitingId: waitingRegulationVersionId,
      reason: 'Fixture cancellation basis',
    });
    await pool.query(
      `UPDATE regulation_change_version SET state = 'SUBMITTED', submitted_at = now() WHERE id = $1`,
      [submittedCancel],
    );

    const firstSummaryCaseId = randomUUID();
    const secondSummaryCaseId = randomUUID();
    await pool.query(`INSERT INTO season_summary_case(id, season_id) VALUES ($1,$2),($3,$4)`, [
      firstSummaryCaseId,
      firstSeason.id,
      secondSummaryCaseId,
      secondSeason.id,
    ]);
    const firstSummaryVersionId = randomUUID();
    const secondSummaryVersionId = randomUUID();
    await pool.query(
      `INSERT INTO season_summary_version(
         id, season_id, case_id, version_number, prepared_by,
         basis_statistics_revision, source_snapshot, report_date
       ) VALUES ($1,$2,$3,1,$4,0,'{"fixture":"typed evidence"}'::jsonb,'2027-05-31'),
                ($5,$6,$7,1,$4,0,'{"fixture":"typed evidence"}'::jsonb,'2028-05-31')`,
      [
        firstSummaryVersionId,
        firstSeason.id,
        firstSummaryCaseId,
        preparer.id,
        secondSummaryVersionId,
        secondSeason.id,
        secondSummaryCaseId,
      ],
    );
    await expect(
      pool.query(
        `INSERT INTO season_summary_version(
           id, season_id, case_id, version_number, prepared_by, basis_statistics_revision
         ) VALUES ($1,$2,$3,2,$4,-1)`,
        [randomUUID(), firstSeason.id, firstSummaryCaseId, preparer.id],
      ),
    ).rejects.toMatchObject({ code: '23514' });
    await pool.query(
      `UPDATE season_summary_version
       SET state = 'CONFIRMED', submitted_at = now(), decided_at = now(), decided_by = $1
       WHERE id = $2`,
      [fixtures.accounts[1].id, firstSummaryVersionId],
    );
    await pool.query(
      `UPDATE season_summary_case SET current_confirmed_version_id = $1 WHERE id = $2`,
      [firstSummaryVersionId, firstSummaryCaseId],
    );
    await expect(
      pool.query(`UPDATE season_summary_case SET current_confirmed_version_id = $1 WHERE id = $2`, [
        secondSummaryVersionId,
        firstSummaryCaseId,
      ]),
    ).rejects.toMatchObject({ code: '23503' });

    const firstLifecycleId = randomUUID();
    const secondLifecycleId = randomUUID();
    await pool.query(`INSERT INTO season_lifecycle_request(id, season_id) VALUES ($1,$2),($3,$4)`, [
      firstLifecycleId,
      firstSeason.id,
      secondLifecycleId,
      secondSeason.id,
    ]);
    const insertLifecycleVersion = (options: {
      id: string;
      seasonId: string;
      caseId: string;
      versionNumber: number;
      action: string;
      reason?: string | null;
      summaryVersionId?: string | null;
      predecessorVersionId?: string | null;
      state?: string;
      submittedAt?: Date | null;
    }) =>
      pool.query(
        `INSERT INTO season_lifecycle_version(
           id, season_id, case_id, version_number, prepared_by, predecessor_version_id,
           action, reason, summary_version_id, state, submitted_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          options.id,
          options.seasonId,
          options.caseId,
          options.versionNumber,
          preparer.id,
          options.predecessorVersionId ?? null,
          options.action,
          options.reason ?? null,
          options.summaryVersionId ?? null,
          options.state ?? 'DRAFT',
          options.submittedAt ?? null,
        ],
      );

    await expect(
      insertLifecycleVersion({
        id: randomUUID(),
        seasonId: firstSeason.id,
        caseId: firstLifecycleId,
        versionNumber: 1,
        action: 'CLOSE',
        summaryVersionId: secondSummaryVersionId,
      }),
    ).rejects.toMatchObject({ code: '23503' });
    await expect(
      insertLifecycleVersion({
        id: randomUUID(),
        seasonId: firstSeason.id,
        caseId: firstLifecycleId,
        versionNumber: 1,
        action: 'REOPEN',
        summaryVersionId: firstSummaryVersionId,
      }),
    ).rejects.toMatchObject({ code: '23514' });
    await expect(
      insertLifecycleVersion({
        id: randomUUID(),
        seasonId: firstSeason.id,
        caseId: firstLifecycleId,
        versionNumber: 1,
        action: 'CLOSE',
        state: 'SUBMITTED',
        submittedAt: new Date(),
      }),
    ).rejects.toMatchObject({ code: '23514' });
    const submittedCloseId = randomUUID();
    await insertLifecycleVersion({
      id: submittedCloseId,
      seasonId: firstSeason.id,
      caseId: firstLifecycleId,
      versionNumber: 1,
      action: 'CLOSE',
      reason: 'Fixture close basis',
      summaryVersionId: firstSummaryVersionId,
    });
    await pool.query(
      `UPDATE season_lifecycle_version SET state = 'SUBMITTED', submitted_at = now() WHERE id = $1`,
      [submittedCloseId],
    );
    await pool.query(`UPDATE season_lifecycle_request SET current_version_id = $1 WHERE id = $2`, [
      submittedCloseId,
      firstLifecycleId,
    ]);
    const otherLifecycleVersionId = randomUUID();
    await insertLifecycleVersion({
      id: otherLifecycleVersionId,
      seasonId: secondSeason.id,
      caseId: secondLifecycleId,
      versionNumber: 1,
      action: 'REOPEN',
    });
    await expect(
      pool.query(`UPDATE season_lifecycle_request SET current_version_id = $1 WHERE id = $2`, [
        otherLifecycleVersionId,
        firstLifecycleId,
      ]),
    ).rejects.toMatchObject({ code: '23503' });
    await expect(
      insertLifecycleVersion({
        id: randomUUID(),
        seasonId: firstSeason.id,
        caseId: firstLifecycleId,
        versionNumber: 2,
        action: 'REOPEN',
        predecessorVersionId: otherLifecycleVersionId,
      }),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it.each(['editor insertion', 'child insertion'])(
    'serializes concurrent %s with submission',
    async (mutation) => {
      const [season] = fixtures.seasons;
      const [preparer, editor] = fixtures.accounts;
      const versionId = await insertDraftRegulationVersion(pool, {
        seasonId: season.id,
        caseId: primaryRegulationCaseId,
        preparedBy: preparer.id,
        versionNumber: await nextRegulationVersionNumber(pool, primaryRegulationCaseId),
      });
      await insertCompleteRanking(pool, versionId);

      const submitter = await pool.connect();
      const writer = await pool.connect();
      let submitterInTransaction = false;
      let writerInTransaction = false;
      let pendingMutation: Promise<{ error?: { code?: string }; ok?: boolean }> | undefined;
      try {
        await submitter.query('BEGIN');
        submitterInTransaction = true;
        await submitter.query(`SELECT id FROM regulation_version WHERE id = $1 FOR NO KEY UPDATE`, [
          versionId,
        ]);

        await writer.query('BEGIN');
        writerInTransaction = true;
        const writerPid = (await writer.query('SELECT pg_backend_pid() AS pid')).rows[0]
          .pid as number;
        pendingMutation = (async () => {
          try {
            if (mutation === 'editor insertion')
              await writer.query(
                `INSERT INTO regulation_version_editor(version_id, account_id) VALUES ($1,$2)`,
                [versionId, editor.id],
              );
            else
              await writer.query(
                `INSERT INTO registration_window(id, regulation_version_id, intake_kind, opens_at, closes_at)
               VALUES ($1,$2,'PLAYER_CHANGE','2032-01-01T00:00:00Z','2032-02-01T00:00:00Z')`,
                [randomUUID(), versionId],
              );
            return { ok: true };
          } catch (error) {
            return { error: error as { code?: string } };
          }
        })();

        let lockObserved = false;
        for (let attempt = 0; attempt < 80; attempt++) {
          const activity = await pool.query(
            `SELECT wait_event_type FROM pg_stat_activity WHERE pid = $1`,
            [writerPid],
          );
          if (activity.rows[0]?.wait_event_type === 'Lock') {
            lockObserved = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 25));
        }
        expect(lockObserved).toBe(true);

        await submitter.query(
          `UPDATE regulation_version
         SET state = 'SUBMITTED', submitted_at = now(), effective_mode = 'IMMEDIATE'
         WHERE id = $1`,
          [versionId],
        );
        await submitter.query('COMMIT');
        submitterInTransaction = false;

        const result = await pendingMutation;
        expect(result?.error).toMatchObject({ code: '23514' });
      } finally {
        if (submitterInTransaction) await submitter.query('ROLLBACK');
        if (writerInTransaction) await writer.query('ROLLBACK');
        submitter.release();
        writer.release();
      }
    },
  );
});

const phase2PasswordHash = '$argon2id$v=19$m=19456,t=2,p=1$fixture$fixture';
const uuid4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('PHASE 2 season creation HTTP contract', () => {
  const databaseUrl = process.env.TEST_DATABASE_URL!;
  const database = new DatabaseService(databaseUrl);
  const observer = new Pool({ connectionString: databaseUrl });
  const security = new SecurityPrimitivesService();
  let app: INestApplication;
  let fixtures: Awaited<ReturnType<typeof createPhase1Fixtures>>;
  let previousOrigin: string | undefined;

  async function startApplication(db: DatabaseService) {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue(db)
      .compile();
    const application = module.createNestApplication();
    application.useGlobalPipes(new SafeValidationPipe());
    application.useGlobalFilters(new SafeErrorFilter());
    application.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await application.init();
    return application;
  }

  async function createLiveAccount(prefix: string) {
    const id = randomUUID();
    const account = await database.client.account.create({
      data: {
        id,
        personnelCode: `${prefix}_${id.replaceAll('-', '').slice(0, 20).toUpperCase()}`,
        fullName: 'Tài khoản kiểm thử tạo mùa giải',
        username: `${prefix.toLowerCase()}.${id}`,
        passwordHash: phase2PasswordHash,
        mustChangePassword: false,
      },
    });
    const tokens = security.createSessionTokens();
    const createdAt = await database.now();
    await database.client.session.create({
      data: {
        accountId: account.id,
        tokenHash: tokens.tokenHash,
        csrfToken: tokens.csrfToken,
        accountAuthRevision: account.authRevision,
        createdAt,
        lastActivityAt: createdAt,
        absoluteExpiresAt: security.sessionExpiry(createdAt),
      },
    });
    return { account, tokens };
  }

  async function grantSeasonCreation(accountId: string) {
    return database.client.createSeasonGrant.create({
      data: { accountId, grantedBy: fixtures.accounts[0].id, grantedAt: await database.now() },
    });
  }

  async function grantSeasonRole(
    accountId: string,
    seasonId: string,
    roleCode: 'SEASON_MANAGER' | 'REGISTRATION_OFFICER' | 'SCHEDULING_OFFICER' | 'RESULTS_OFFICER',
  ) {
    return database.client.seasonRoleAssignment.create({
      data: {
        accountId,
        seasonId,
        roleCode,
        grantedBy: fixtures.accounts[0].id,
        grantedAt: await database.now(),
      },
    });
  }

  function seasonInput(
    overrides: Partial<
      Record<'code' | 'name' | 'competitionName' | 'startDate' | 'endDate', string>
    > = {},
  ) {
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase();
    return {
      code: `NEW_${suffix}`,
      name: 'New competition season',
      competitionName: 'Premier League Test',
      startDate: '2027-08-01',
      endDate: '2028-05-31',
      ...overrides,
    };
  }

  function createRequest(
    tokens: { token: string; csrfToken: string },
    payload: Record<string, unknown>,
    key = randomUUID(),
  ) {
    return request(app.getHttpServer())
      .post('/api/v1/seasons')
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', 'https://whistle.test')
      .set('X-CSRF-Token', tokens.csrfToken)
      .set('Idempotency-Key', key)
      .send(payload);
  }

  function readRequest(tokens: { token: string; csrfToken: string }, path: string) {
    return request(app.getHttpServer())
      .get(path)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`);
  }

  function updateRequest(
    tokens: { token: string; csrfToken: string },
    seasonId: string,
    payload: Record<string, unknown>,
  ) {
    return request(app.getHttpServer())
      .patch(`/api/v1/seasons/${seasonId}`)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', 'https://whistle.test')
      .set('X-CSRF-Token', tokens.csrfToken)
      .send(payload);
  }

  function prepareLifecycle(
    tokens: { token: string; csrfToken: string },
    id: string,
    action: 'CLOSE' | 'REOPEN',
  ) {
    return request(app.getHttpServer())
      .post(`/api/v1/seasons/${id}/lifecycle-requests`)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', 'https://whistle.test')
      .set('X-CSRF-Token', tokens.csrfToken)
      .send({ action, reason: 'Xác nhận xử lý vòng đời mùa giải.' });
  }

  function lifecycleAction(
    tokens: { token: string; csrfToken: string },
    draft: {
      id: string;
      revision: string;
      relatedId: string;
    },
    action: string,
    key = randomUUID(),
  ) {
    return request(app.getHttpServer())
      .post(`/api/v1/season-lifecycle-requests/${draft.id}/${action}`)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', 'https://whistle.test')
      .set('X-CSRF-Token', tokens.csrfToken)
      .set('Idempotency-Key', key)
      .send({
        expectedRevision: draft.revision,
        submittedVersionId: draft.relatedId,
        reason: 'Đã rà soát đề xuất.',
      });
  }

  beforeAll(async () => {
    previousOrigin = process.env.AUTH_ORIGIN;
    process.env.AUTH_ORIGIN = 'https://whistle.test';
    app = await startApplication(database);
  });

  beforeEach(async () => {
    await resetPhase1Fixtures(databaseUrl, 'RESET_ISOLATED_TEST_DATABASE');
    fixtures = await createPhase1Fixtures(databaseUrl);
  });

  afterAll(async () => {
    await app?.close();
    await database.close();
    await observer.end();
    if (previousOrigin === undefined) delete process.env.AUTH_ORIGIN;
    else process.env.AUTH_ORIGIN = previousOrigin;
  });

  it('creates an OPEN season with only the live CreateSeasonGrant and replays its normalized acknowledgement', async () => {
    const { account, tokens } = await createLiveAccount('T008C');
    await grantSeasonCreation(account.id);
    const code = `new_${randomUUID().replaceAll('-', '').slice(0, 10)}`;
    const key = randomUUID();
    const first = await createRequest(
      tokens,
      seasonInput({
        code: `  ${code}  `,
        name: '  Mùa   giải e\u0301  ',
        competitionName: '  Premier   League Test  ',
      }),
      key,
    ).expect(201);

    expect(first.body).toMatchObject({
      data: { id: expect.stringMatching(uuid4Pattern), revision: '1' },
      requestId: expect.any(String),
    });
    expect(Object.keys(first.body)).toEqual(['data', 'requestId']);
    expect(Object.keys(first.body.data)).toEqual(['id', 'revision']);

    const replay = await createRequest(
      tokens,
      seasonInput({
        code: code.toUpperCase(),
        name: 'Mùa giải é',
        competitionName: 'Premier League Test',
      }),
      key,
    ).expect(201);
    expect(replay.body.data).toEqual(first.body.data);

    const season = await database.client.season.findUniqueOrThrow({
      where: { id: first.body.data.id },
    });
    expect(season).toMatchObject({
      code: code.toUpperCase(),
      name: 'Mùa giải é',
      competitionName: 'Premier League Test',
      state: 'OPEN',
      currentRegulationVersionId: null,
      statisticsRevision: 0n,
    });
    expect(season.startDate.toISOString().slice(0, 10)).toBe('2027-08-01');
    expect(season.endDate.toISOString().slice(0, 10)).toBe('2028-05-31');
    expect(
      await database.client.seasonRoleAssignment.count({ where: { seasonId: season.id } }),
    ).toBe(0);
    expect(await database.client.regulationCase.count({ where: { seasonId: season.id } })).toBe(0);
    expect(
      await database.client.commandReceipt.count({
        where: { accountId: account.id, actionCode: 'SEASON_CREATED', requestKey: key },
      }),
    ).toBe(1);
    const audit = await database.client.auditRecord.findFirstOrThrow({
      where: { actionCode: 'SEASON_CREATED', objectId: season.id },
    });
    expect(audit).toMatchObject({
      actorKind: 'ACCOUNT',
      actorId: account.id,
      objectKind: 'Season',
      seasonId: season.id,
      afterData: {
        code: code.toUpperCase(),
        name: 'Mùa giải é',
        competitionName: 'Premier League Test',
        startDate: '2027-08-01',
        endDate: '2028-05-31',
      },
    });
  });

  it('rejects normalized duplicate codes and serializes simultaneous create requests', async () => {
    const { account, tokens } = await createLiveAccount('T008D');
    await grantSeasonCreation(account.id);
    const code = `RACE_${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
    const firstKey = randomUUID();
    const duplicateKey = randomUUID();
    await createRequest(tokens, seasonInput({ code }), firstKey).expect(201);
    const duplicate = await createRequest(
      tokens,
      seasonInput({ code: code.toLowerCase() }),
      duplicateKey,
    ).expect(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_CODE');
    expect(await database.client.season.count({ where: { code } })).toBe(1);
    expect(
      await database.client.commandReceipt.count({
        where: { accountId: account.id, actionCode: 'SEASON_CREATED', requestKey: duplicateKey },
      }),
    ).toBe(0);

    const persistedCode = fixtures.seasons[0].code;
    const persistedDuplicate = await createRequest(
      tokens,
      seasonInput({ code: persistedCode.toLowerCase() }),
      randomUUID(),
    ).expect(409);
    expect(persistedDuplicate.body.error.code).toBe('DUPLICATE_CODE');

    const concurrentCode = `RACE_${randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`;
    const concurrentKeys = [randomUUID(), randomUUID()];
    const secondActor = await createLiveAccount('T008E');
    await grantSeasonCreation(secondActor.account.id);
    const blocker = await observer.connect();
    let inTransaction = false;
    try {
      await blocker.query('BEGIN');
      inTransaction = true;
      await blocker.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
        'season-collection:SeasonCollection',
      ]);
      const pending = [
        createRequest(tokens, seasonInput({ code: concurrentCode }), concurrentKeys[0]),
        createRequest(
          secondActor.tokens,
          seasonInput({ code: concurrentCode.toLowerCase() }),
          concurrentKeys[1],
        ),
      ];
      const concurrentRequests = Promise.all(pending);
      let waiting = 0;
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        const result = await observer.query(
          `SELECT pid FROM pg_stat_activity
           WHERE datname = current_database() AND pid <> pg_backend_pid()
             AND wait_event_type = 'Lock' AND query ILIKE '%pg_advisory_xact_lock%'`,
        );
        waiting = result.rowCount ?? 0;
        if (waiting >= 2) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(waiting).toBeGreaterThanOrEqual(2);
      await blocker.query('COMMIT');
      inTransaction = false;

      const results = await concurrentRequests;
      expect(results.map(({ status }) => status).sort()).toEqual([201, 409]);
      expect(await database.client.season.count({ where: { code: concurrentCode } })).toBe(1);
      const createdId = results.find(({ status }) => status === 201)!.body.data.id as string;
      expect(
        await database.client.auditRecord.count({
          where: { actionCode: 'SEASON_CREATED', objectId: createdId },
        }),
      ).toBe(1);
      expect(
        await database.client.commandReceipt.count({
          where: {
            accountId: { in: [account.id, secondActor.account.id] },
            actionCode: 'SEASON_CREATED',
          },
        }),
      ).toBe(2);
    } finally {
      if (inTransaction) await blocker.query('ROLLBACK');
      blocker.release();
    }
  });

  it('requires only the live CreateSeasonGrant and rejects administrator, season-role, and revoked-grant substitutes', async () => {
    const admin = await createLiveAccount('T008A');
    await database.client.systemRoleAssignment.create({
      data: {
        accountId: admin.account.id,
        roleCode: 'SYSTEM_ADMINISTRATOR',
        grantedBy: fixtures.accounts[0].id,
        grantedAt: await database.now(),
      },
    });
    const manager = await createLiveAccount('T008M');
    await database.client.seasonRoleAssignment.create({
      data: {
        accountId: manager.account.id,
        seasonId: fixtures.seasons[0].id,
        roleCode: 'SEASON_MANAGER',
        grantedBy: fixtures.accounts[0].id,
        grantedAt: await database.now(),
      },
    });
    const revoked = await createLiveAccount('T008R');
    const grant = await grantSeasonCreation(revoked.account.id);
    await database.client.createSeasonGrant.update({
      where: { id: grant.id },
      data: { revokedAt: await database.now() },
    });

    for (const [session, code] of [
      [admin, `ADMIN_${randomUUID().slice(0, 8)}`],
      [manager, `ROLE_${randomUUID().slice(0, 8)}`],
      [revoked, `REVOKED_${randomUUID().slice(0, 8)}`],
    ] as const) {
      const response = await createRequest(session.tokens, seasonInput({ code }));
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    }
    expect(await database.client.season.count({ where: { code: { startsWith: 'ADMIN_' } } })).toBe(
      0,
    );
    expect(await database.client.season.count({ where: { code: { startsWith: 'ROLE_' } } })).toBe(
      0,
    );
    expect(
      await database.client.season.count({ where: { code: { startsWith: 'REVOKED_' } } }),
    ).toBe(0);
    expect(
      await database.client.auditRecord.count({ where: { actionCode: 'SEASON_CREATED' } }),
    ).toBe(0);
    expect(
      await database.client.commandReceipt.count({ where: { actionCode: 'SEASON_CREATED' } }),
    ).toBe(0);
  });

  it('rejects malformed, oversized, reversed-date, and unknown fields before creating a season', async () => {
    const { account, tokens } = await createLiveAccount('T008V');
    await grantSeasonCreation(account.id);
    const cases = [
      { ...seasonInput(), code: 'bad/code' },
      { ...seasonInput(), name: 'x'.repeat(201) },
      { ...seasonInput(), competitionName: 'x'.repeat(201) },
      { ...seasonInput(), startDate: '2027-02-30' },
      { ...seasonInput(), startDate: '2028-05-31', endDate: '2027-08-01' },
      { ...seasonInput(), unexpected: 'not allowed' },
    ];
    for (const input of cases) {
      const response = await createRequest(tokens, input);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toMatch(/VALIDATION_FAILED|INVALID_INPUT/);
    }
    expect(await database.client.season.count()).toBe(fixtures.seasons.length);
    expect(
      await database.client.auditRecord.count({ where: { actionCode: 'SEASON_CREATED' } }),
    ).toBe(0);
    expect(
      await database.client.commandReceipt.count({ where: { actionCode: 'SEASON_CREATED' } }),
    ).toBe(0);
  });

  it('rolls back the season and receipt when the required audit append fails', async () => {
    const { account, tokens } = await createLiveAccount('T008F');
    await grantSeasonCreation(account.id);
    const body = seasonInput();
    const key = randomUUID();
    const writer = app.get(AuditWriterService);
    const append = jest
      .spyOn(writer, 'append')
      .mockRejectedValueOnce(new Error('injected audit failure'));
    try {
      const response = await createRequest(tokens, body, key);
      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    } finally {
      append.mockRestore();
    }
    expect(await database.client.season.count({ where: { code: body.code } })).toBe(0);
    expect(
      await database.client.commandReceipt.count({
        where: { accountId: account.id, actionCode: 'SEASON_CREATED', requestKey: key },
      }),
    ).toBe(0);
    expect(
      await database.client.auditRecord.count({ where: { actionCode: 'SEASON_CREATED' } }),
    ).toBe(0);
  });

  it('lists only assigned seasons and requires target-season read authority for detail', async () => {
    const manager = await createLiveAccount('T009M');
    await grantSeasonRole(manager.account.id, fixtures.seasons[0].id, 'SEASON_MANAGER');
    await grantSeasonRole(manager.account.id, fixtures.seasons[1].id, 'SEASON_MANAGER');
    const officer = await createLiveAccount('T009O');
    await grantSeasonRole(officer.account.id, fixtures.seasons[1].id, 'RESULTS_OFFICER');
    const limited = await createLiveAccount('T009L');
    await grantSeasonRole(limited.account.id, fixtures.seasons[0].id, 'SEASON_MANAGER');
    const creator = await createLiveAccount('T009C');
    await grantSeasonCreation(creator.account.id);
    const administrator = await createLiveAccount('T009A');
    await database.client.systemRoleAssignment.create({
      data: {
        accountId: administrator.account.id,
        roleCode: 'SYSTEM_ADMINISTRATOR',
        grantedBy: fixtures.accounts[0].id,
        grantedAt: await database.now(),
      },
    });

    await request(app.getHttpServer()).get('/api/v1/seasons').expect(401);

    const orderedIds = [...fixtures.seasons].sort((left, right) =>
      left.code.localeCompare(right.code),
    );
    const firstPage = await readRequest(manager.tokens, '/api/v1/seasons')
      .query({ page: '1', pageSize: '1', sort: 'code:asc' })
      .expect(200);
    const secondPage = await readRequest(manager.tokens, '/api/v1/seasons')
      .query({ page: '2', pageSize: '1', sort: 'code:asc' })
      .expect(200);
    expect(Object.keys(firstPage.body)).toEqual(['data', 'meta', 'requestId']);
    expect(firstPage.body.data).toMatchObject({ items: [{ id: orderedIds[0].id }] });
    expect(firstPage.body.meta).toEqual({
      page: 1,
      pageSize: 1,
      total: 2,
    });
    expect(secondPage.body.data).toMatchObject({ items: [{ id: orderedIds[1].id }] });
    expect(secondPage.body.meta).toEqual({
      page: 2,
      pageSize: 1,
      total: 2,
    });

    const list = await readRequest(manager.tokens, '/api/v1/seasons')
      .query({
        search: fixtures.seasons[0].code,
        state: 'OPEN',
        page: '1',
        pageSize: '20',
        sort: 'code:asc',
      })
      .expect(200);
    expect(list.body.data.items).toMatchObject([
      {
        id: fixtures.seasons[0].id,
        code: fixtures.seasons[0].code,
        state: 'OPEN',
        revision: '1',
        effectiveRegulation: null,
        capabilities: { canEditMetadata: true },
      },
    ]);
    expect(list.body.meta).toEqual({
      page: 1,
      pageSize: 20,
      total: 1,
    });
    expect(list.body.data.items[0].startDate).toBe('2026-08-01');
    expect(list.body.data.items[0].endDate).toBe('2027-05-31');

    for (const session of [creator, administrator]) {
      const hidden = await readRequest(session.tokens, '/api/v1/seasons').expect(200);
      expect(hidden.body.data.items).toEqual([]);
      expect(hidden.body.meta.total).toBe(0);
    }
    await readRequest(creator.tokens, `/api/v1/seasons/${fixtures.seasons[0].id}`).expect(404);
    await readRequest(limited.tokens, `/api/v1/seasons/${fixtures.seasons[1].id}`).expect(404);
    await readRequest(creator.tokens, `/api/v1/seasons/${fixtures.seasons[0].id}/history`).expect(
      404,
    );
    await readRequest(limited.tokens, `/api/v1/seasons/${fixtures.seasons[1].id}/history`).expect(
      404,
    );
    const absentSeasonId = randomUUID();
    await readRequest(manager.tokens, `/api/v1/seasons/${absentSeasonId}`).expect(404);
    await readRequest(manager.tokens, `/api/v1/seasons/${absentSeasonId}/history`).expect(404);
    await updateRequest(manager.tokens, absentSeasonId, {
      expectedRevision: '1',
      name: 'Absent target',
    }).expect(404);
    await readRequest(manager.tokens, '/api/v1/seasons?state=ARCHIVED').expect(400);
    await readRequest(manager.tokens, '/api/v1/seasons?unsupported=anything').expect(400);
    const literalWildcard = await readRequest(manager.tokens, '/api/v1/seasons')
      .query({ search: '%' })
      .expect(200);
    expect(literalWildcard.body.data.items).toEqual([]);
    expect(literalWildcard.body.meta.total).toBe(0);

    const detail = await readRequest(
      manager.tokens,
      `/api/v1/seasons/${fixtures.seasons[0].id}`,
    ).expect(200);
    expect(detail.body.data).toMatchObject({
      ...list.body.data.items[0],
      effectiveRegulation: null,
      waitingRegulation: null,
    });
    const officerDetail = await readRequest(
      officer.tokens,
      `/api/v1/seasons/${fixtures.seasons[1].id}`,
    ).expect(200);
    expect(officerDetail.body.data.capabilities.canEditMetadata).toBe(false);
  });

  it('updates OPEN metadata with a manager revision, exact history, and no stale or closed overwrite', async () => {
    const manager = await createLiveAccount('T009U');
    await grantSeasonRole(manager.account.id, fixtures.seasons[0].id, 'SEASON_MANAGER');
    const officer = await createLiveAccount('T009P');
    await grantSeasonRole(officer.account.id, fixtures.seasons[0].id, 'SCHEDULING_OFFICER');
    const seasonId = fixtures.seasons[0].id;

    await request(app.getHttpServer())
      .patch(`/api/v1/seasons/${seasonId}`)
      .set('Cookie', `${SESSION_COOKIE}=${manager.tokens.token}`)
      .set('X-CSRF-Token', manager.tokens.csrfToken)
      .send({ expectedRevision: '1', name: 'Missing origin' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/api/v1/seasons/${seasonId}`)
      .set('Cookie', `${SESSION_COOKIE}=${manager.tokens.token}`)
      .set('Origin', 'https://whistle.test')
      .send({ expectedRevision: '1', name: 'Missing CSRF' })
      .expect(403);

    const updated = await updateRequest(manager.tokens, seasonId, {
      expectedRevision: '1',
      name: '  Updated   season name  ',
      endDate: '2027-06-30',
    }).expect(200);
    expect(updated.body.data).toEqual({ id: seasonId, revision: '2' });
    const saved = await database.client.season.findUniqueOrThrow({ where: { id: seasonId } });
    expect(saved.name).toBe('Updated season name');
    expect(saved.endDate.toISOString().slice(0, 10)).toBe('2027-06-30');
    expect(saved.code).toBe(fixtures.seasons[0].code);

    const history = await readRequest(manager.tokens, `/api/v1/seasons/${seasonId}/history`)
      .query({ page: '1', pageSize: '20' })
      .expect(200);
    expect(history.body.data.items).toMatchObject([
      {
        actionCode: 'SEASON_UPDATED',
        objectKind: 'Season',
        objectId: seasonId,
        seasonId,
        before: { name: 'Mùa giải kiểm thử 1', endDate: '2027-05-31' },
        after: { name: 'Updated season name', endDate: '2027-06-30' },
      },
    ]);
    expect(history.body.meta).toEqual({
      page: 1,
      pageSize: 20,
      total: 1,
    });
    const occurredAt = history.body.data.items[0].occurredAt as string;
    const exactAction = await readRequest(manager.tokens, `/api/v1/seasons/${seasonId}/history`)
      .query({ actionCode: 'SEASON_UPDATED', occurredFrom: occurredAt })
      .expect(200);
    expect(exactAction.body.meta.total).toBe(1);
    const exclusiveUpperBound = await readRequest(
      manager.tokens,
      `/api/v1/seasons/${seasonId}/history`,
    )
      .query({ occurredBefore: occurredAt })
      .expect(200);
    expect(exclusiveUpperBound.body.meta.total).toBe(0);
    await readRequest(manager.tokens, `/api/v1/seasons/${seasonId}/history`)
      .query({ actionCode: 'SYSTEM_ROLE_GRANTED' })
      .expect(400);
    await readRequest(manager.tokens, `/api/v1/seasons/${seasonId}/history`)
      .query({ occurredFrom: '2026-01-01' })
      .expect(400);

    const stale = await updateRequest(manager.tokens, seasonId, {
      expectedRevision: '1',
      name: 'Stale overwrite',
    }).expect(409);
    expect(stale.body.error.code).toBe('REVISION_CONFLICT');
    await updateRequest(manager.tokens, seasonId, { expectedRevision: '2' }).expect(400);
    await updateRequest(manager.tokens, seasonId, {
      expectedRevision: '2',
      name: 'Updated season name',
    }).expect(400);
    expect(
      (await database.client.season.findUniqueOrThrow({ where: { id: seasonId } })).revision,
    ).toBe(2n);
    const immutableCode = await updateRequest(manager.tokens, seasonId, {
      expectedRevision: '2',
      code: 'CHANGED_CODE',
    }).expect(400);
    expect(immutableCode.body.error.code).toBe('VALIDATION_FAILED');
    const nonManager = await updateRequest(officer.tokens, seasonId, {
      expectedRevision: '2',
      name: 'Officer overwrite',
    }).expect(403);
    expect(nonManager.body.error.code).toBe('ACCESS_DENIED');

    await database.client.season.update({ where: { id: seasonId }, data: { state: 'CLOSED' } });
    const closed = await updateRequest(manager.tokens, seasonId, {
      expectedRevision: '2',
      name: 'Closed overwrite',
    }).expect(409);
    expect(closed.body.error.code).toBe('STATE_CONFLICT');
    expect((await database.client.season.findUniqueOrThrow({ where: { id: seasonId } })).name).toBe(
      'Updated season name',
    );
    expect(
      await database.client.auditRecord.count({
        where: { actionCode: 'SEASON_UPDATED', objectId: seasonId },
      }),
    ).toBe(1);
  });

  it('rechecks OPEN state after waiting for the season lock', async () => {
    const manager = await createLiveAccount('T009R');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    const blocker = await observer.connect();
    let inTransaction = false;
    try {
      await blocker.query('BEGIN');
      inTransaction = true;
      await blocker.query('SELECT id FROM season WHERE id = $1 FOR UPDATE', [seasonId]);
      const pending = updateRequest(manager.tokens, seasonId, {
        expectedRevision: '1',
        name: 'Must not overwrite closure',
      }).then((response) => response);
      let waiting = false;
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        const result = await observer.query(
          `SELECT pid FROM pg_stat_activity
           WHERE datname = current_database() AND pid <> pg_backend_pid()
             AND wait_event_type = 'Lock' AND query ILIKE '%FOR UPDATE%'`,
        );
        waiting = (result.rowCount ?? 0) > 0;
        if (waiting) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(waiting).toBe(true);
      await blocker.query(`UPDATE season SET state = 'CLOSED' WHERE id = $1`, [seasonId]);
      await blocker.query('COMMIT');
      inTransaction = false;

      const response = await pending;
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('STATE_CONFLICT');
      expect(
        await database.client.season.findUniqueOrThrow({ where: { id: seasonId } }),
      ).toMatchObject({ name: fixtures.seasons[0].name, state: 'CLOSED', revision: 1n });
      expect(
        await database.client.auditRecord.count({
          where: { actionCode: 'SEASON_UPDATED', objectId: seasonId },
        }),
      ).toBe(0);
    } finally {
      if (inTransaction) await blocker.query('ROLLBACK');
      blocker.release();
    }
  });

  it('rechecks live session authority immediately before persisting metadata', async () => {
    const manager = await createLiveAccount('T009X');
    const seasonId = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, seasonId, 'SEASON_MANAGER');
    const sessions = app.get(AuthService).sessions;
    const requireSession = sessions.require.bind(sessions);
    let checks = 0;
    const recheck = jest.spyOn(sessions, 'require').mockImplementation((...args) => {
      checks += 1;
      if (checks === 3)
        throw new ApplicationError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã hết hạn.');
      return requireSession(...args);
    });
    try {
      const response = await updateRequest(manager.tokens, seasonId, {
        expectedRevision: '1',
        name: 'Expired before write',
      }).expect(401);
      expect(response.body.error.code).toBe('SESSION_EXPIRED');
    } finally {
      recheck.mockRestore();
    }
    expect(checks).toBe(3);
    expect(
      await database.client.season.findUniqueOrThrow({ where: { id: seasonId } }),
    ).toMatchObject({ name: fixtures.seasons[0].name, revision: 1n });
    expect(
      await database.client.auditRecord.count({
        where: { actionCode: 'SEASON_UPDATED', objectId: seasonId },
      }),
    ).toBe(0);
  });

  it('prepares a CLOSE draft before a confirmed summary exists, but blocks submission', async () => {
    const manager = await createLiveAccount('T023A');
    const id = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, id, 'SEASON_MANAGER');
    const { body } = await prepareLifecycle(manager.tokens, id, 'CLOSE').expect(201);
    await lifecycleAction(manager.tokens, body.data, 'submit').expect(409);
    const rows = await observer.query(
      'SELECT state, summary_version_id FROM season_lifecycle_version WHERE id = $1',
      [body.data.relatedId],
    );
    expect(rows.rows).toEqual([{ state: 'DRAFT', summary_version_id: null }]);
    expect(
      (await observer.query('SELECT state FROM season WHERE id = $1', [id])).rows[0].state,
    ).toBe('OPEN');
  });

  it('binds actual confirmed summary, rechecks simulated later facts and independently closes and reopens', async () => {
    const manager = await createLiveAccount('T024P');
    const approver = await createLiveAccount('T024A');
    const id = fixtures.seasons[0].id;
    await grantSeasonRole(manager.account.id, id, 'SEASON_MANAGER');
    await grantSeasonRole(approver.account.id, id, 'SEASON_MANAGER');
    const caseId = randomUUID();
    const summaryId = randomUUID();
    const regulationCaseId = randomUUID();
    await observer.query('INSERT INTO regulation_case(id,season_id) VALUES ($1,$2)', [
      regulationCaseId,
      id,
    ]);
    const regulationId = await insertDraftRegulationVersion(observer, {
      seasonId: id,
      caseId: regulationCaseId,
      preparedBy: manager.account.id,
      versionNumber: 1,
    });
    const registrationId = randomUUID();
    const sourceSnapshot = {
      basis: {
        regulationVersionId: regulationId,
        officialReportVersionIds: [],
        rankingResolutionVersionIds: [],
      },
      content: { standings: [] },
    };
    await observer.query('INSERT INTO season_summary_case(id,season_id) VALUES ($1,$2)', [
      caseId,
      id,
    ]);
    await observer.query(
      `
      INSERT INTO season_summary_version(id, season_id, case_id, version_number, prepared_by,
        basis_statistics_revision, source_snapshot, report_date)
      VALUES ($1,$2,$3,1,$4,0,$5::jsonb,'2026-11-17')
    `,
      [summaryId, id, caseId, manager.account.id, JSON.stringify(sourceSnapshot)],
    );
    await observer.query(
      `
      UPDATE season_summary_version SET state='CONFIRMED', submitted_at=clock_timestamp(),
        decided_at=clock_timestamp(), decided_by=$2 WHERE id=$1
    `,
      [summaryId, approver.account.id],
    );
    await observer.query(
      'UPDATE season_summary_case SET current_confirmed_version_id=$1 WHERE id=$2',
      [summaryId, caseId],
    );
    const pastEnd = '2000-01-01T00:00:00.000Z';
    let playingEnd: string | null = pastEnd;
    const service = app.get(SeasonDependenciesService);
    const actualRead = service.read.bind(service);
    const read = jest.spyOn(service, 'read').mockImplementation((async (kind, context, input) => {
      if (kind !== 'seasonClosingReadiness') return actualRead(kind, context, input);
      // GUARD_SIMULATION: no later registration or statistics writer is introduced here.
      return {
        status: 'KNOWN',
        facts: {
          summary: {
            caseExists: true,
            caseId,
            currentConfirmedVersionId: summaryId,
            currentVersionState: 'CONFIRMED',
            currentStatisticsRevision: '0',
            basisStatisticsRevision: '0',
            sourceSnapshot,
            needsReconfirmation: false,
          },
          unresolvedRequests: [],
          waitingEffects: [],
          unresolvedFuturePlans: [],
          playingIntervals: [{ registrationId, playingEnd }],
        },
        basis: {
          owner: 'statistics-reporting',
          sourceRevision: '0:fixture',
          references: [caseId, summaryId, regulationId, registrationId],
        },
        locks: [],
      } satisfies DependencyResult<'seasonClosingReadiness'>;
    }) as typeof service.read);
    try {
      const draft = (await prepareLifecycle(manager.tokens, id, 'CLOSE').expect(201)).body.data;
      const pending = (await lifecycleAction(manager.tokens, draft, 'submit').expect(200)).body
        .data;
      expect(
        (
          await observer.query(
            'SELECT summary_version_id FROM season_lifecycle_version WHERE id=$1',
            [draft.relatedId],
          )
        ).rows[0],
      ).toMatchObject({ summary_version_id: summaryId });
      await lifecycleAction(manager.tokens, pending, 'approve').expect(403);
      const holder = await observer.connect();
      let closing: Promise<{ status: number }> | undefined;
      try {
        await holder.query('BEGIN');
        await holder.query('SELECT id FROM season WHERE id = $1 FOR UPDATE', [id]);
        closing = lifecycleAction(approver.tokens, pending, 'approve').then((result) => result);
        let waiting = false;
        const deadline = Date.now() + 10_000;
        while (Date.now() < deadline && !waiting) {
          const result = await observer.query(`
            SELECT pid FROM pg_stat_activity WHERE datname = current_database()
              AND wait_event_type = 'Lock' AND query ILIKE '%FROM "season"%FOR UPDATE%'
          `);
          waiting = !!result.rowCount;
          if (!waiting) await new Promise((resolve) => setTimeout(resolve, 10));
        }
        expect(waiting).toBe(true);
        playingEnd = '2099-01-01T00:00:00.000Z';
      } finally {
        await holder.query('ROLLBACK');
        holder.release();
      }
      expect((await closing!).status).toBe(409);
      playingEnd = null;
      await lifecycleAction(approver.tokens, pending, 'approve').expect(409);
      expect(
        (await observer.query('SELECT state FROM season WHERE id = $1', [id])).rows[0].state,
      ).toBe('OPEN');
      expect(
        (
          await observer.query(
            "SELECT count(*) FROM command_receipt WHERE action_code='SEASON_LIFECYCLE_APPROVED'",
          )
        ).rows[0].count,
      ).toBe('0');
      playingEnd = '1999-01-01T00:00:00.000Z';
      const changedBasis = await lifecycleAction(approver.tokens, pending, 'approve').expect(409);
      expect(changedBasis.body.error.code).toBe('BASIS_CHANGED');
      expect(
        (await observer.query('SELECT state FROM season WHERE id=$1', [id])).rows[0].state,
      ).toBe('OPEN');
      expect(
        (
          await observer.query(
            "SELECT count(*) FROM command_receipt WHERE action_code='SEASON_LIFECYCLE_APPROVED'",
          )
        ).rows[0].count,
      ).toBe('0');
      playingEnd = pastEnd;
      const key = randomUUID();
      const approved = (await lifecycleAction(approver.tokens, pending, 'approve', key).expect(200))
        .body.data;
      expect(
        (await lifecycleAction(approver.tokens, pending, 'approve', key).expect(200)).body.data,
      ).toEqual(approved);
      const reopening = (await prepareLifecycle(manager.tokens, id, 'REOPEN').expect(201)).body
        .data;
      await updateRequest(manager.tokens, id, {
        expectedRevision: '2',
        name: 'Closed write',
      }).expect(409);
      const reopenPending = (await lifecycleAction(manager.tokens, reopening, 'submit').expect(200))
        .body.data;
      await lifecycleAction(approver.tokens, reopenPending, 'approve').expect(200);
      const season = (
        await observer.query(
          'SELECT state, revision, statistics_revision FROM season WHERE id=$1',
          [id],
        )
      ).rows[0];
      expect(season).toMatchObject({ state: 'OPEN', revision: '3', statistics_revision: '0' });
      expect(
        (
          await observer.query(
            'SELECT current_confirmed_version_id, needs_reconfirmation FROM season_summary_case WHERE id=$1',
            [caseId],
          )
        ).rows[0],
      ).toMatchObject({ current_confirmed_version_id: summaryId, needs_reconfirmation: false });
    } finally {
      read.mockRestore();
    }
  });
});
