const { randomUUID } = require('node:crypto');
const { writeFileSync } = require('node:fs');
const { isAbsolute } = require('node:path');
const { URL } = require('node:url');
const { DatabaseService } = require('../dist/platform/database.service');
const {
  SecurityPrimitivesService,
} = require('../dist/identity-access/security-primitives.service');
const { AuditWriterService } = require('../dist/audit/audit-writer.service');
const { BusinessExecutionService } = require('../dist/platform/business-execution');
const { mediaChecksum, LocalMediaStore } = require('../dist/media/local-media.store');
const sharp = require('sharp');

async function prepare() {
  const url = new URL(process.env.DATABASE_URL || '');
  const destination = process.env.PHASE2_RECOVERY_FIXTURE;
  if (
    process.env.NODE_ENV !== 'test' ||
    !['127.0.0.1', 'localhost'].includes(url.hostname) ||
    !/^\/whistle_test_phase2_recovery_[a-z0-9]+$/.test(url.pathname) ||
    url.search ||
    url.hash ||
    !destination ||
    !isAbsolute(destination)
  )
    throw new Error('Explicit isolated recovery target and protected fixture path required.');
  const db = new DatabaseService(url.href);
  try {
    if (
      (await db.client.account.count()) ||
      (await db.client.club.count()) ||
      (await db.client.season.count())
    )
      throw new Error('Recovery preparation requires an empty isolated target.');
    const accountId = randomUUID();
    const security = new SecurityPrimitivesService();
    const password = 'Synthetic recovery ' + randomUUID();
    const account = await db.client.account.create({
      data: {
        id: accountId,
        username: 'recovery.fixture',
        personnelCode: 'RECOVERY_FIXTURE',
        fullName: 'Nhân viên khôi phục kiểm thử',
        mustChangePassword: false,
        passwordHash: await security.hashPassword(password),
      },
    });
    const now = await db.now();
    const tokens = security.createSessionTokens();
    await db.client.session.create({
      data: {
        accountId,
        accountAuthRevision: account.authRevision,
        tokenHash: tokens.tokenHash,
        csrfToken: tokens.csrfToken,
        createdAt: now,
        lastActivityAt: now,
        absoluteExpiresAt: security.sessionExpiry(now),
      },
    });
    const seasons = [];
    for (let index = 0; index < 2; index++) {
      seasons.push(
        await db.client.season.create({
          data: {
            id: randomUUID(),
            code: 'RECOVERY_' + (2026 + index),
            name: 'Mùa giải phục hồi ' + (2026 + index),
            competitionName: 'Premier League Test Fixture',
            startDate: new Date(`${2026 + index}-08-01`),
            endDate: new Date(`${2027 + index}-05-31`),
          },
        }),
      );
    }
    const store = new LocalMediaStore(process.env.OPS_MEDIA_ROOT, 'local');
    const audit = new AuditWriterService();
    const execution = new BusinessExecutionService(db);
    const assets = [];
    for (let index = 0; index < 20; index++) {
      const id = randomUUID();
      const clubId = randomUUID();
      const key = id + '.webp';
      // Authored synthetic pixels, expressly authorized by the user for this isolated drill.
      const bytes = await sharp({
        create: {
          width: 64,
          height: 64,
          channels: 3,
          background: { r: 25 + index * 10, g: 50 + index * 5, b: 180 - index * 4 },
        },
      })
        .webp()
        .toBuffer();
      await execution.execute(
        {
          principal: { kind: 'session', accountId },
          locks: [],
          authority: async () => {},
        },
        async (context) => {
          await store.put(key, bytes);
          const club = {
            code: 'RECOVERY_' + String(index + 1).padStart(2, '0'),
            name: 'CLB phục hồi ' + (index + 1),
            abbreviation: 'R' + (index + 1),
          };
          await context.db.club.create({ data: { id: clubId, ...club } });
          await context.db.mediaAsset.create({
            data: {
              id,
              clubId,
              objectKey: key,
              checksum: mediaChecksum(bytes),
              mimeType: 'image/webp',
              width: 64,
              height: 64,
              byteSize: bytes.length,
              storedBy: accountId,
            },
          });
          await context.db.club.update({ where: { id: clubId }, data: { currentLogoId: id } });
          await audit.append(context, {
            actor: { kind: 'ACCOUNT', accountId },
            action: 'CLUB_CREATED',
            objectKind: 'Club',
            objectId: clubId,
            outcome: 'SUCCESS',
            after: club,
          });
          let priorDiscontinuedAt = null;
          for (const discontinued of [true, false]) {
            const recordedAt = await context.now();
            const discontinuedAt = discontinued ? recordedAt : null;
            await context.db.club.update({
              where: { id: clubId },
              data: {
                discontinuedAt,
                revision: { increment: 1 },
              },
            });
            await audit.append(context, {
              actor: { kind: 'ACCOUNT', accountId },
              action: discontinued ? 'CLUB_DISCONTINUED' : 'CLUB_RESUMED',
              objectKind: 'Club',
              objectId: clubId,
              outcome: 'SUCCESS',
              reason: 'Chu kỳ kiểm thử phục hồi.',
              before: { discontinuedAt: priorDiscontinuedAt },
              after: {
                discontinuedAt: discontinuedAt?.toISOString() ?? null,
                effectiveAt: recordedAt.toISOString(),
              },
            });
            priorDiscontinuedAt = discontinuedAt?.toISOString() ?? null;
          }
        },
      );
      assets.push({ id, clubId, objectKey: key, checksum: mediaChecksum(bytes) });
    }
    const lifecycles = [];
    for (const season of seasons) {
      const id = randomUUID();
      await db.client.seasonLifecycleRequest.create({ data: { id, seasonId: season.id } });
      const version = await db.client.seasonLifecycleVersion.create({
        data: {
          id: randomUUID(),
          seasonId: season.id,
          caseId: id,
          preparedBy: accountId,
          versionNumber: 1,
          action: 'CLOSE',
          reason: 'Bản nháp bảo toàn khi khôi phục.',
        },
      });
      await db.client.seasonLifecycleRequest.update({
        where: { id },
        data: { currentVersionId: version.id },
      });
      lifecycles.push({ seasonId: season.id, requestId: id, versionId: version.id });
    }
    writeFileSync(
      destination,
      JSON.stringify({
        provenance: '20 synthetic WebP images authored in this authorized verification session',
        assets,
        seasons: seasons.map(({ id }) => id),
        lifecycles,
        login: { accountId, username: account.username, password },
      }),
      { flag: 'wx', mode: 0o600 },
    );
    process.stdout.write(assets[0].objectKey + '\n');
  } finally {
    await db.close();
  }
}
prepare().catch((error) => {
  process.stderr.write(
    'Recovery fixture preparation failed (' +
      error.constructor.name +
      '). ' +
      'After a partial run, replace the disposable database and dedicated media/state/backup roots before retrying. ' +
      'Choose a new protected PHASE2_RECOVERY_FIXTURE output path; the shell drill already allocates a fresh one. ' +
      'Preserve diagnostic evidence; do not reuse partial fixtures. No configured target is reset or deleted automatically.\n',
  );
  process.exitCode = 1;
});
