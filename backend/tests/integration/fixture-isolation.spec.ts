import { assertIsolatedTarget } from '../fixtures/isolated-target.guard';
import { createPhase2Fixtures, resetPhase2Fixtures } from '../fixtures/phase-2-fixtures';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { ClockService } from '../../src/platform/clock.service';
import { DatabaseService } from '../../src/platform/database.service';
import {
  SeasonDependenciesService,
  hasUsableSummaryBasisForClosure,
} from '../../src/season-regulations/season-dependencies.service';
import { TransactionContext } from '../../src/platform/transaction-context';
import { composePhase2Evidence, simulateLaterFact } from '../fixtures/phase-2-evidence';
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
      const fixture = await createPhase2Fixtures(url.toString());
      expect(fixture.accounts).toHaveLength(5);
      expect(fixture.seasons).toHaveLength(2);
      expect(new Set(fixture.seasons.map((s) => s.id)).size).toBe(2);
      expect(fixture.regulationVersions).toHaveLength(2);
      expect(fixture.summaryVersions).toHaveLength(2);
      expect(JSON.stringify(fixture)).not.toMatch(/password|argon2|credential/i);
      const roles = await target.query(
        'SELECT count(*)::int AS count FROM season_role_assignment r JOIN account a ON a.id=r.account_id JOIN season s ON s.id=r.season_id',
      );
      expect(roles.rows[0].count).toBe(3);
      const regulationReferences = await target.query(
        `SELECT v.id,v.season_id,v.case_id,c.season_id AS case_season_id,v.prepared_by
         FROM regulation_version v JOIN regulation_case c ON c.id=v.case_id
         WHERE v.id=ANY($1::uuid[]) ORDER BY v.id`,
        [fixture.regulationVersions.map((version) => version.id)],
      );
      expect(regulationReferences.rowCount).toBe(2);
      expect(regulationReferences.rows.every((row) => row.season_id === row.case_season_id)).toBe(
        true,
      );
      const summaryReferences = await target.query(
        `SELECT v.id,v.season_id,v.case_id,c.season_id AS case_season_id,v.state,c.current_confirmed_version_id
         FROM season_summary_version v JOIN season_summary_case c ON c.id=v.case_id
         WHERE v.id=ANY($1::uuid[]) ORDER BY v.id`,
        [fixture.summaryVersions.map((version) => version.id)],
      );
      expect(summaryReferences.rowCount).toBe(2);
      expect(summaryReferences.rows.every((row) => row.season_id === row.case_season_id)).toBe(
        true,
      );
      expect(summaryReferences.rows.every((row) => row.state === 'DRAFT')).toBe(true);
      expect(summaryReferences.rows.every((row) => row.current_confirmed_version_id === null)).toBe(
        true,
      );
      const evidenceSeason = fixture.seasons[0];
      const evidenceRegulationVersion = fixture.regulationVersions.find(
        (version) => version.seasonId === evidenceSeason.id,
      );
      const evidenceSummaryVersion = fixture.summaryVersions.find(
        (version) => version.seasonId === evidenceSeason.id,
      );
      if (!evidenceRegulationVersion || !evidenceSummaryVersion)
        throw new Error('The fixture set is missing same-season persisted versions.');
      const composedEvidence = composePhase2Evidence({
        references: {
          season: evidenceSeason,
          regulationVersion: evidenceRegulationVersion,
          summaryVersion: evidenceSummaryVersion,
        },
        simulatedLaterFacts: [
          simulateLaterFact({
            kind: 'registrationCompatibility',
            season: evidenceSeason,
            regulationVersion: evidenceRegulationVersion,
            facts: { intervalCompositions: [] },
            note: 'Guard simulation only; no registration workflow is installed.',
          }),
        ],
      });
      expect(composedEvidence).toMatchObject({
        scope: 'PHASE2_GUARD_SIMULATION',
        persisted: {
          seasonId: evidenceSeason.id,
          regulationVersionId: evidenceRegulationVersion.id,
          summaryVersionId: evidenceSummaryVersion.id,
        },
      });
      expect(regulationReferences.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: composedEvidence.persisted.regulationVersionId,
            season_id: composedEvidence.persisted.seasonId,
            case_season_id: composedEvidence.persisted.seasonId,
          }),
        ]),
      );
      expect(summaryReferences.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: composedEvidence.persisted.summaryVersionId,
            season_id: composedEvidence.persisted.seasonId,
            case_season_id: composedEvidence.persisted.seasonId,
          }),
        ]),
      );
      const summaryDatabase = new DatabaseService(url.toString());
      try {
        const dependencyService = new SeasonDependenciesService({ registeredWriters: [] });
        const summaryObservation = await summaryDatabase.client.$transaction(async (tx) => {
          await dependencyService.assertStartupCatalog(tx);
          const context = new TransactionContext(tx, new ClockService(), async () => {});
          const request = { seasonId: fixture.seasons[0].id };
          const discovered = await dependencyService.discover('seasonSummary', tx, request);
          expect(discovered.status).toBe('KNOWN');
          await context.acquire(discovered.locks);
          return dependencyService.read('seasonSummary', context, request);
        });
        expect(summaryObservation).toMatchObject({
          status: 'KNOWN',
          facts: {
            currentConfirmedVersionId: null,
            currentVersionState: null,
            needsReconfirmation: false,
          },
        });
        expect(hasUsableSummaryBasisForClosure(summaryObservation)).toBe(false);
      } finally {
        await summaryDatabase.close();
      }
      const clubId = randomUUID();
      const assetId = randomUUID();
      await target.query(
        `INSERT INTO club(id,code,name,abbreviation) VALUES($1,'FIXTURE_CLUB','Fixture Club','FC')`,
        [clubId],
      );
      await target.query(
        `INSERT INTO stadium(id,code,name) VALUES($1,'FIXTURE_STADIUM','Fixture Stadium')`,
        [randomUUID()],
      );
      await target.query(
        `INSERT INTO media_asset(id,club_id,object_key,mime_type,byte_size,width,height,checksum,stored_by)
         VALUES($1,$2,'fixture/club.webp','image/webp',32,1,1,'fixture-checksum',$3)`,
        [assetId, clubId, fixture.accounts[0].id],
      );
      await target.query('UPDATE club SET current_logo_id=$1 WHERE id=$2', [assetId, clubId]);
      await expect(resetPhase2Fixtures(url.toString(), '')).rejects.toThrow('acknowledgement');
      expect((await target.query('SELECT count(*)::int AS count FROM account')).rows[0].count).toBe(
        5,
      );
      await resetPhase2Fixtures(url.toString(), 'RESET_ISOLATED_TEST_DATABASE');
      expect((await target.query('SELECT count(*)::int AS count FROM account')).rows[0].count).toBe(
        0,
      );
      expect((await target.query('SELECT count(*)::int AS count FROM season')).rows[0].count).toBe(
        0,
      );
      for (const table of [
        'club',
        'stadium',
        'media_asset',
        'regulation_case',
        'regulation_version',
        'regulation_version_editor',
        'registration_window',
        'ranking_priority',
        'goal_type',
        'card_type',
        'regulation_change_request',
        'regulation_change_version',
        'regulation_change_version_editor',
        'season_lifecycle_request',
        'season_lifecycle_version',
        'season_lifecycle_version_editor',
        'season_summary_case',
        'season_summary_version',
        'season_summary_version_editor',
      ])
        expect(
          (await target.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count,
        ).toBe(0);
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
