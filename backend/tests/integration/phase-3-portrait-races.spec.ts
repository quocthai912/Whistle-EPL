import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { MediaCleanupService } from '../../src/media/media-cleanup.service';
import { OrphanInventoryService } from '../../src/media/orphan-inventory.service';
import { DatabaseService } from '../../src/platform/database.service';
import { waitForLockWaiters } from '../fixtures/committed-race';
import { phase3Workflows } from '../fixtures/phase-3-workflows';
import { setupPhase3HttpFixture } from './phase-3-fixtures';

describe('PHASE 3 T025 — real in-flight portrait versus cleanup', () => {
  const fixture = setupPhase3HttpFixture();
  const workflows = phase3Workflows(fixture);
  let reader: DatabaseService;
  beforeAll(() => {
    reader = new DatabaseService(process.env.TEST_DATABASE_URL!);
  });
  afterAll(async () => {
    await reader?.close();
  });

  it('waits for a staged HTTP portrait write before deciding whether its bytes are orphaned', async () => {
    const player = await workflows.player('INFLIGHT');
    const auth = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    // Test-only PostgreSQL barrier pauses the real writer after durable staging, before metadata INSERT.
    // No application collaborator is mocked or replaced.
    await fixture.database.client.$executeRawUnsafe(
      `CREATE FUNCTION t025_pause_media() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_advisory_xact_lock(250025); RETURN NEW; END $$`,
    );
    await fixture.database.client.$executeRawUnsafe(
      `CREATE TRIGGER t025_pause_media BEFORE INSERT ON media_asset FOR EACH ROW EXECUTE FUNCTION t025_pause_media()`,
    );
    let acquired!: () => void;
    let release!: () => void;
    const ready = new Promise<void>((resolve) => {
      acquired = resolve;
    });
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const barrier = reader.client.$transaction(
      async (db) => {
        await db.$queryRaw`SELECT pg_advisory_xact_lock(250025)::text`;
        acquired();
        await released;
      },
      { timeout: 15000 },
    );
    let upload: Promise<request.Response> | undefined;
    let cleanup: Promise<number> | undefined;
    try {
      await Promise.race([ready, barrier]);
      upload = workflows.portrait(auth, player.id, '1');
      await waitForLockWaiters(reader, 'media_asset');
      const { keys } = await fixture.storage.inventory();
      expect(keys).toHaveLength(1);
      const stagedBytes = await readFile(join(fixture.mediaRoot, keys[0]));
      const job = new MediaCleanupService(
        fixture.database,
        fixture.storage,
        new OrphanInventoryService(join(fixture.mediaRoot, '.inflight-orphans.json')),
        fixture.app.get(AuditWriterService),
      );
      cleanup = job.execute(new Map());
      await waitForLockWaiters(reader, 'pg_advisory_xact_lock');
      expect(await readFile(join(fixture.mediaRoot, keys[0]))).toEqual(stagedBytes);
      release();
      await barrier;
      const committed = await upload;
      expect(committed.status).toBe(200);
      expect(await cleanup).toBe(0);
      expect(
        await reader.client.player.findUniqueOrThrow({ where: { id: player.id } }),
      ).toMatchObject({ currentPortraitId: committed.body.data.mediaAssetId });
      const delivered = await fixture
        .apiRequest(auth, 'get', `/media/${committed.body.data.mediaAssetId}`)
        .expect(200);
      expect(delivered.body).toEqual(stagedBytes);
    } finally {
      release();
      await Promise.allSettled([
        barrier,
        ...(upload ? [upload] : []),
        ...(cleanup ? [cleanup] : []),
      ]);
      await fixture.database.client.$executeRawUnsafe(
        'DROP TRIGGER t025_pause_media ON media_asset',
      );
      await fixture.database.client.$executeRawUnsafe('DROP FUNCTION t025_pause_media()');
    }
  });
});
