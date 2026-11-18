import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import request from 'supertest';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import { mediaChecksum } from '../../src/media/local-media.store';
import { MediaCleanupService } from '../../src/media/media-cleanup.service';
import { OrphanInventoryService } from '../../src/media/orphan-inventory.service';
import { setupMasterHttpFixture } from '../fixtures/phase-2-master-http';

describe('PHASE 2 Club logo and cleanup HTTP contracts', () => {
  const http = setupMasterHttpFixture();
  const { database, origin, authenticate, createClub, readClub, clubManager, club } = http;

  it('serves only the current normalized logo and preserves content on rejected mutations', async () => {
    const tokens = await clubManager();
    const created = await createClub(tokens, club).expect(201);
    const id = created.body.data.id as string;
    const image = await sharp({
      create: { width: 4, height: 5, channels: 3, background: 'purple' },
    })
      .png()
      .toBuffer();
    const upload = (revision: string, bytes = image) =>
      request(http.app.getHttpServer())
        .post(`/api/v1/clubs/${id}/logo`)
        .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
        .set('Origin', origin)
        .set('X-CSRF-Token', tokens.csrfToken)
        .field('expectedRevision', revision)
        .attach('file', bytes, { filename: 'logo.png', contentType: 'image/png' });
    const fetchLogo = (assetId: string, credentials = tokens) =>
      request(http.app.getHttpServer())
        .get(`/api/v1/media/${assetId}`)
        .set('Cookie', `${SESSION_COOKIE}=${credentials.token}`);

    const first = await upload('1').expect(200);
    const firstAsset = first.body.data.mediaAssetId as string;
    const current = await fetchLogo(firstAsset)
      .expect('Cache-Control', 'no-store')
      .expect('Content-Type', 'image/webp')
      .expect(200);
    await expect(sharp(current.body as Buffer).metadata()).resolves.toMatchObject({
      format: 'webp',
      width: 4,
      height: 5,
    });
    await fetchLogo(firstAsset, await authenticate(http.fixtures.accounts[4].id)).expect(404);
    await upload('1').expect(409);
    await upload('2', Buffer.from('not an image')).expect(400);
    await fetchLogo(firstAsset).expect(200);

    const put = jest.spyOn(http.storage, 'put').mockRejectedValueOnce(new Error('Storage failed'));
    try {
      await upload('2').expect(500);
    } finally {
      put.mockRestore();
    }
    const audit = jest
      .spyOn(http.app.get(AuditWriterService), 'append')
      .mockRejectedValueOnce(new Error('Audit failed'));
    try {
      await upload('2').expect(500);
    } finally {
      audit.mockRestore();
    }
    await fetchLogo(firstAsset).expect(200);
    expect(await database.client.mediaAsset.count()).toBe(1);

    const second = await upload('2').expect(200);
    const secondAsset = second.body.data.mediaAssetId as string;
    await fetchLogo(firstAsset).expect(404);
    await fetchLogo(secondAsset).expect(200);
    expect(
      (await database.client.mediaAsset.findUniqueOrThrow({ where: { id: firstAsset } }))
        .unreferencedAt,
    ).toBeInstanceOf(Date);
    const detail = await readClub(tokens, `/${id}`).expect(200);
    expect(detail.body.data.logo).toEqual({
      id: secondAsset,
      url: `/api/v1/media/${secondAsset}`,
      width: 4,
      height: 5,
    });
    await request(http.app.getHttpServer())
      .post(`/api/v1/clubs/${id}/logo/remove`)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', origin)
      .set('X-CSRF-Token', tokens.csrfToken)
      .send({ expectedRevision: '3', mediaAssetId: secondAsset })
      .expect(200);
    await fetchLogo(secondAsset).expect(404);
    expect(await database.client.mediaAsset.count()).toBe(2);
    expect(await readdir(http.mediaRoot)).toHaveLength(3);
  });

  it('cleans detached content with a retained copy and waits for the first orphan observation', async () => {
    const tokens = await clubManager();
    const clubId = (await createClub(tokens, club).expect(201)).body.data.id as string;
    const bytes = await sharp({
      create: { width: 4, height: 5, channels: 3, background: 'purple' },
    })
      .webp()
      .toBuffer();
    const id = crypto.randomUUID();
    const objectKey = id + '.webp';
    const orphanKey = crypto.randomUUID() + '.webp';
    const checksum = mediaChecksum(bytes);
    await http.storage.put(objectKey, bytes);
    await http.storage.put(orphanKey, bytes);
    const old = new Date((await database.now()).getTime() - 25 * 60 * 60 * 1000);
    await database.client.mediaAsset.create({
      data: {
        id,
        clubId,
        objectKey,
        checksum,
        byteSize: bytes.length,
        mimeType: 'image/webp',
        width: 4,
        height: 5,
        storedBy: http.fixtures.accounts[2].id,
        createdAt: old,
        unreferencedAt: old,
      },
    });
    const inventory = new OrphanInventoryService(
      join(http.mediaRoot, 'test-orphan-inventory.json'),
    );
    const cleanup = new MediaCleanupService(
      database,
      http.storage,
      inventory,
      http.app.get(AuditWriterService),
    );
    expect(await cleanup.execute(new Map())).toBe(0);
    expect(await http.storage.identity(objectKey)).not.toBeNull();
    const observations = await inventory.read();
    const first = observations.get(orphanKey);
    expect(first).toBeDefined();
    expect(await http.storage.identity(orphanKey)).not.toBeNull();
    await inventory.save(
      new Map([[orphanKey, { identity: first!.identity, observedAt: old.getTime() }]]),
    );
    const failAudit = jest
      .spyOn(http.app.get(AuditWriterService), 'appendSystemTechnical')
      .mockRejectedValueOnce(new Error('Cleanup audit rollback fixture'));
    try {
      expect(await cleanup.execute(new Map([[objectKey, checksum]]))).toBe(1);
    } finally {
      failAudit.mockRestore();
    }
    expect(await http.storage.read(objectKey, bytes.length, checksum)).toEqual(bytes);
    expect(
      (await database.client.mediaAsset.findUniqueOrThrow({ where: { id } })).contentDeletedAt,
    ).toBeNull();
    await http.storage.deleteKnown(objectKey, bytes.length, checksum);
    await cleanup.recoverInterrupted();
    expect(await http.storage.read(objectKey, bytes.length, checksum)).toEqual(bytes);
    await http.storage.deleteKnown(objectKey, bytes.length, checksum);
    await database.client.mediaAsset.update({
      where: { id },
      data: { contentDeletedAt: await database.now() },
    });
    await cleanup.recoverInterrupted();
    expect((await http.storage.inventory()).staged).not.toContain(objectKey);
    expect(await cleanup.execute(new Map([[objectKey, checksum]]))).toBe(0);
    expect(await http.storage.identity(objectKey)).toBeNull();
    expect(await http.storage.identity(orphanKey)).toBeNull();
    expect(await database.client.mediaAsset.findUnique({ where: { id } })).toMatchObject({
      contentDeletedAt: expect.any(Date),
    });
    expect(
      await database.client.auditRecord.count({
        where: { actionCode: 'MEDIA_ASSET_CLEANED', objectId: id },
      }),
    ).toBe(0);
  });
});
