import { randomUUID } from 'node:crypto';
import { copyFile, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { MediaCleanupService } from '../../src/media/media-cleanup.service';
import { OrphanInventoryService } from '../../src/media/orphan-inventory.service';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import { phase3Workflows } from '../fixtures/phase-3-workflows';
import {
  assertIsolatedMediaRoot,
  createAuthorizedTestImage,
  setupPhase3HttpFixture,
} from './phase-3-fixtures';

describe('PHASE 3 T025 — portrait cleanup and recovery', () => {
  const fixture = setupPhase3HttpFixture();
  const workflows = phase3Workflows(fixture);
  function cleanup() {
    return new MediaCleanupService(
      fixture.database,
      fixture.storage,
      new OrphanInventoryService(join(fixture.mediaRoot, '.orphan-observations.json')),
      fixture.app.get(AuditWriterService),
    );
  }

  it('keeps current bytes, requires retained backup protection and observes the full 24-hour unreferenced grace', async () => {
    const player = await workflows.player('CLEAN');
    const auth = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    const first = await workflows.portrait(auth, player.id, player.revision);
    expect(first.status).toBe(200);
    const firstId = first.body.data.mediaAssetId as string;
    const asset = await fixture.database.client.mediaAsset.findUniqueOrThrow({
      where: { id: firstId },
    });
    expect((await workflows.portrait(auth, player.id, first.body.data.revision)).status).toBe(200);
    const protectedCopies = new Map([[asset.objectKey, asset.checksum]]);
    fixture.clock.set(new Date('2026-08-11T09:59:59.999Z'));
    expect(await cleanup().execute(protectedCopies)).toBe(0);
    await expect(
      fixture.storage.read(asset.objectKey, asset.byteSize, asset.checksum),
    ).resolves.toBeInstanceOf(Buffer);
    fixture.clock.set(new Date('2026-08-11T10:00:00.000Z'));
    expect(await cleanup().execute(new Map())).toBe(0);
    await expect(
      fixture.storage.read(asset.objectKey, asset.byteSize, asset.checksum),
    ).resolves.toBeInstanceOf(Buffer);
    expect(await cleanup().execute(protectedCopies)).toBe(0);
    await expect(
      fixture.storage.read(asset.objectKey, asset.byteSize, asset.checksum),
    ).rejects.toThrow();
    const refreshedAuth = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    const detail = await fixture
      .apiRequest(refreshedAuth, 'get', `/players/${player.id}`)
      .expect(200);
    const current = await fixture.database.client.mediaAsset.findUniqueOrThrow({
      where: { id: detail.body.data.portrait.id },
    });
    await expect(
      fixture.storage.read(current.objectKey, current.byteSize, current.checksum),
    ).resolves.toBeInstanceOf(Buffer);
  });

  it('starts rollback orphan grace at first inventory observation and protects retained bytes', async () => {
    const key = `${randomUUID()}.webp`;
    const bytes = await createAuthorizedTestImage('webp');
    await writeFile(join(fixture.mediaRoot, key), bytes);
    const job = cleanup();
    fixture.clock.set(new Date('2026-08-12T10:00:00.000Z'));
    expect(await job.execute(new Map())).toBe(0);
    fixture.clock.set(new Date('2026-08-13T09:59:59.999Z'));
    expect(await job.execute(new Map())).toBe(0);
    expect(await readFile(join(fixture.mediaRoot, key))).toEqual(bytes);
    fixture.clock.set(new Date('2026-08-13T10:00:00.000Z'));
    expect(await job.execute(new Map([[key, 'retained-copy']]))).toBe(0);
    expect(await readFile(join(fixture.mediaRoot, key))).toEqual(bytes);
    // Removing protection begins a fresh observation period instead of backdating it.
    expect(await job.execute(new Map())).toBe(0);
    fixture.clock.set(new Date('2026-08-14T10:00:00.000Z'));
    expect(await job.execute(new Map())).toBe(0);
    await expect(readFile(join(fixture.mediaRoot, key))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('recovers an interrupted cleanup staging file and safely retries a corrupt-byte failure', async () => {
    const player = await workflows.player('RETRY');
    const auth = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    const portrait = await workflows.portrait(auth, player.id, player.revision);
    const asset = await fixture.database.client.mediaAsset.findUniqueOrThrow({
      where: { id: portrait.body.data.mediaAssetId },
    });
    await fixture
      .apiRequest(auth, 'post', `/players/${player.id}/portrait/remove`, {
        expectedRevision: portrait.body.data.revision,
        mediaAssetId: asset.id,
      })
      .expect(200);
    const original = await readFile(join(fixture.mediaRoot, asset.objectKey));
    fixture.clock.set(new Date('2026-08-11T10:00:00.000Z'));
    await writeFile(join(fixture.mediaRoot, asset.objectKey), Buffer.from('corrupt bytes'));
    expect(await cleanup().execute(new Map([[asset.objectKey, asset.checksum]]))).toBe(1);
    expect(
      (await fixture.database.client.mediaAsset.findUniqueOrThrow({ where: { id: asset.id } }))
        .contentDeletedAt,
    ).toBeNull();
    await writeFile(join(fixture.mediaRoot, '.cleanup-' + asset.objectKey), original);
    await unlink(join(fixture.mediaRoot, asset.objectKey));
    await cleanup().recoverInterrupted();
    expect(await readFile(join(fixture.mediaRoot, asset.objectKey))).toEqual(original);
    expect(await cleanup().execute(new Map([[asset.objectKey, asset.checksum]]))).toBe(0);
    await expect(readFile(join(fixture.mediaRoot, asset.objectKey))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  if (process.env.PHASE3_RECOVERY_ROOT) {
    it('exports an isolated real HTTP portrait and login basis for the operator restore drill', async () => {
      const root = assertIsolatedMediaRoot(process.env.PHASE3_RECOVERY_ROOT!);
      await mkdir(join(root, 'media'), { recursive: true, mode: 0o700 });
      const player = await workflows.player('RESTORE');
      const auth = await fixture.authenticate(fixture.staff.playerMasterGrantee);
      const portrait = await workflows.portrait(auth, player.id, player.revision);
      expect(portrait.status).toBe(200);
      const asset = await fixture.database.client.mediaAsset.findUniqueOrThrow({
        where: { id: portrait.body.data.mediaAssetId },
      });
      await copyFile(
        join(fixture.mediaRoot, asset.objectKey),
        join(root, 'media', asset.objectKey),
      );
      await writeFile(
        join(root, 'fixture.json'),
        JSON.stringify({
          playerId: player.id,
          assetId: asset.id,
          objectKey: asset.objectKey,
          checksum: asset.checksum,
          oldCookie: `${SESSION_COOKIE}=${auth.token}`,
          login: {
            username: 'p3.player.master',
            password: 'Synthetic phase3 credential 🦉 only',
            accountId: auth.accountId,
          },
        }),
        { mode: 0o600 },
      );
    });
  }
});
