import sharp from 'sharp';
import request from 'supertest';
import { AuditWriterService } from '../../src/audit/audit-writer.service';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import {
  createAnimatedWebpFixture,
  createAuthorizedTestImage,
  createOversizedDimensionImage,
  setupPhase3HttpFixture,
  type Phase3AuthTokens,
} from './phase-3-fixtures';

describe('PHASE 3 US2 — Protected Player portraits and current delivery (T010)', () => {
  const fixture = setupPhase3HttpFixture('2026-08-10T10:00:00.000Z');

  function uploadPortrait(
    tokens: Phase3AuthTokens,
    playerId: string,
    expectedRevision: string,
    bytes: Buffer,
    filename = 'portrait.png',
    contentType = 'image/png',
  ) {
    return request(fixture.app.getHttpServer())
      .post(`/api/v1/players/${playerId}/portrait`)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`)
      .set('Origin', fixture.origin)
      .set('X-CSRF-Token', tokens.csrfToken)
      .field('expectedRevision', expectedRevision)
      .attach('file', bytes, { filename, contentType });
  }

  function fetchMedia(tokens: Phase3AuthTokens, assetId: string) {
    return request(fixture.app.getHttpServer())
      .get(`/api/v1/media/${assetId}`)
      .set('Cookie', `${SESSION_COOKIE}=${tokens.token}`);
  }

  it('validates static PNG/JPEG/WebP bounds, enforces PLAYER_MASTER write scope, normalizes and delivers no-store current portraits', async () => {
    const playerGrantee = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    const clubGrantee = await fixture.authenticate(fixture.staff.clubMasterGrantee);
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const unprivileged = await fixture.authenticate(fixture.staff.unprivilegedUser);

    const player = await fixture.seedPlayer('PRT_01', 'Vũ Văn Ảnh', '2000-03-04');
    const png = await createAuthorizedTestImage('png', 120, 150);
    const jpeg = await createAuthorizedTestImage('jpeg', 100, 100);
    const webp = await createAuthorizedTestImage('webp', 80, 90);

    // Club master grantee & Registration Officer without PLAYER_MASTER cannot upload portrait
    await uploadPortrait(clubGrantee, player.id, '1', png).expect(403);
    await uploadPortrait(officer, player.id, '1', png).expect(403);

    // Reject animated WebP, oversized dimensions (> 2048px), SVG, and corrupt bytes
    await uploadPortrait(
      playerGrantee,
      player.id,
      '1',
      createAnimatedWebpFixture(),
      'anim.webp',
      'image/webp',
    ).expect(400);
    await uploadPortrait(
      playerGrantee,
      player.id,
      '1',
      await createOversizedDimensionImage(),
      'huge.png',
      'image/png',
    ).expect(400);
    await uploadPortrait(
      playerGrantee,
      player.id,
      '1',
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
      'xss.svg',
      'image/svg+xml',
    ).expect(400);
    await uploadPortrait(playerGrantee, player.id, '1', Buffer.from('not-an-image')).expect(400);

    // Upload valid PNG -> normalized WebP served with Cache-Control: no-store
    const up1 = await uploadPortrait(playerGrantee, player.id, '1', png).expect(200);
    const asset1 = up1.body.data.mediaAssetId as string;
    expect(up1.body.data.revision).toBe('2');

    const res1 = await fetchMedia(officer, asset1)
      .expect('Cache-Control', 'no-store')
      .expect('Content-Type', 'image/webp')
      .expect(200);
    await expect(sharp(res1.body as Buffer).metadata()).resolves.toMatchObject({
      format: 'webp',
      width: 120,
      height: 150,
    });

    // Unprivileged user denied (404 to prevent probing)
    await fetchMedia(unprivileged, asset1).expect(404);

    // Replace with valid JPEG -> asset1 becomes obsolete (404), asset2 becomes current (200)
    const up2 = await uploadPortrait(
      playerGrantee,
      player.id,
      '2',
      jpeg,
      'p.jpg',
      'image/jpeg',
    ).expect(200);
    const asset2 = up2.body.data.mediaAssetId as string;
    expect(up2.body.data.revision).toBe('3');
    await fetchMedia(playerGrantee, asset1).expect(404);
    const res2 = await fetchMedia(playerGrantee, asset2).expect(200);
    await expect(sharp(res2.body as Buffer).metadata()).resolves.toMatchObject({
      format: 'webp',
      width: 100,
      height: 100,
    });

    // Replace with valid static WebP -> works cleanly
    const up3 = await uploadPortrait(
      playerGrantee,
      player.id,
      '3',
      webp,
      'p.webp',
      'image/webp',
    ).expect(200);
    const asset3 = up3.body.data.mediaAssetId as string;
    await fetchMedia(playerGrantee, asset2).expect(404);
    await fetchMedia(playerGrantee, asset3).expect(200);

    // Revoking officer's season role immediately denies subsequent portrait reads
    await fixture.database.client.seasonRoleAssignment.updateMany({
      where: { accountId: fixture.staff.registrationOfficerA },
      data: { revokedAt: await fixture.database.now() },
    });
    await fetchMedia(officer, asset3).expect(404);
  });

  it('preserves previous portrait on rollback, handles concurrent read vs replace/remove, and works when season is Closed (D074)', async () => {
    const grantee = await fixture.authenticate(fixture.staff.playerMasterGrantee);
    const officer = await fixture.authenticate(fixture.staff.registrationOfficerA);
    const player = await fixture.seedPlayer('PRT_02', 'Lê Minh Khôi', '2001-08-09');

    const img1 = await createAuthorizedTestImage('png', 64, 64, { r: 20, g: 80, b: 160, alpha: 1 });
    const img2 = await createAuthorizedTestImage('png', 96, 96, { r: 160, g: 40, b: 80, alpha: 1 });

    // Close ALL seasons to verify D074 availability
    await fixture.database.client.season.updateMany({ data: { state: 'CLOSED' } });

    const up1 = await uploadPortrait(grantee, player.id, '1', img1).expect(200);
    const asset1 = up1.body.data.mediaAssetId as string;

    // Storage failure rollback preserves asset1
    const putSpy = jest.spyOn(fixture.storage, 'put').mockRejectedValueOnce(new Error('Disk full'));
    try {
      await uploadPortrait(grantee, player.id, '2', img2).expect(500);
    } finally {
      putSpy.mockRestore();
    }
    await fetchMedia(grantee, asset1).expect(200);

    // Audit failure rollback preserves asset1
    const auditSpy = jest
      .spyOn(fixture.app.get(AuditWriterService), 'append')
      .mockRejectedValueOnce(new Error('Audit write failed'));
    try {
      await uploadPortrait(grantee, player.id, '2', img2).expect(500);
    } finally {
      auditSpy.mockRestore();
    }
    await fetchMedia(grantee, asset1).expect(200);
    expect(await fixture.database.client.mediaAsset.count({ where: { playerId: player.id } })).toBe(
      1,
    );

    // Concurrent read vs replacement under shared Player synchronization boundary:
    // read either sees complete valid asset1 (200) before replace OR 404 after replace — never 500 or partial bytes!
    const [concurrentRead, replaced] = await Promise.all([
      fetchMedia(officer, asset1),
      uploadPortrait(grantee, player.id, '2', img2),
    ]);
    expect(replaced.status).toBe(200);
    expect([200, 404]).toContain(concurrentRead.status);
    if (concurrentRead.status === 200) {
      await expect(sharp(concurrentRead.body as Buffer).metadata()).resolves.toMatchObject({
        format: 'webp',
        width: 64,
        height: 64,
      });
    }
    const asset2 = replaced.body.data.mediaAssetId as string;
    await fetchMedia(officer, asset1).expect(404);
    await fetchMedia(officer, asset2).expect(200);

    // Concurrent read vs removal under shared Player synchronization boundary
    const [readDuringRemove, removed] = await Promise.all([
      fetchMedia(officer, asset2),
      fixture.apiRequest(grantee, 'post', `/players/${player.id}/portrait/remove`, {
        expectedRevision: '3',
        mediaAssetId: asset2,
      }),
    ]);
    expect(removed.status).toBe(200);
    expect(removed.body.data).toMatchObject({ id: player.id, revision: '4', mediaAssetId: null });
    expect([200, 404]).toContain(readDuringRemove.status);
    await fetchMedia(officer, asset2).expect(404);

    // Verify player detail now shows portrait: null and unreferencedAt was set on asset2
    const detail = await fixture.apiRequest(grantee, 'get', `/players/${player.id}`).expect(200);
    expect(detail.body.data.portrait).toBeNull();
    const removedAsset = await fixture.database.client.mediaAsset.findUniqueOrThrow({
      where: { id: asset2 },
      select: { unreferencedAt: true },
    });
    expect(removedAsset.unreferencedAt).not.toBeNull();
  });
});
