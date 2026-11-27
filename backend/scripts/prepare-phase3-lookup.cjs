const { randomUUID } = require('node:crypto');
const {
  closeSync,
  fsyncSync,
  lstatSync,
  openSync,
  readdirSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const { isAbsolute, join, relative, resolve } = require('node:path');
const { URL } = require('node:url');
const sharp = require('sharp');
const { DatabaseService } = require('../dist/platform/database.service');
const {
  SecurityPrimitivesService,
} = require('../dist/identity-access/security-primitives.service');
const { LocalMediaStore, mediaChecksum } = require('../dist/media/local-media.store');

const POSITIONS = ['GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'LM', 'RW', 'RM', 'ST', 'CF'];
const TOTAL_CLUBS = 20;
const PLAYERS_PER_CLUB = 30;
const HOMEGROWN_PER_CLUB = 8;
const NON_HOMEGROWN_PER_CLUB = 17;
const TOTAL_PLAYERS = TOTAL_CLUBS * PLAYERS_PER_CLUB;

function isPathWithin(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function normalizedDbIdentity(target) {
  return {
    host: ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname.toLowerCase())
      ? 'loopback'
      : target.hostname.toLowerCase(),
    port: Number(target.port || '5432'),
    database: decodeURIComponent(target.pathname.slice(1)),
  };
}

function validateTargets() {
  const url = new URL(process.env.TEST_DATABASE_URL || '');
  const operational = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  const sameTarget =
    operational &&
    JSON.stringify(normalizedDbIdentity(operational)) === JSON.stringify(normalizedDbIdentity(url));
  const destination = process.env.PHASE3_LOOKUP_FIXTURE;
  const mediaRoot = process.env.MEDIA_ROOT;
  const mediaProfile = process.env.MEDIA_STORAGE_PROFILE;

  if (
    process.env.NODE_ENV !== 'test' ||
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.port ||
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.pathname !== '/whistle_test_phase3_lookup' ||
    url.search ||
    url.hash ||
    !destination ||
    !isAbsolute(destination) ||
    mediaProfile !== 'local' ||
    !mediaRoot ||
    !isAbsolute(mediaRoot) ||
    (operational &&
      (!['postgres:', 'postgresql:'].includes(operational.protocol) ||
        !operational.hostname ||
        !operational.port ||
        !operational.pathname.slice(1) ||
        operational.search ||
        operational.hash)) ||
    sameTarget
  ) {
    throw new Error(
      'Dedicated whistle_test_phase3_lookup database, isolated local MEDIA_ROOT and protected output path are required.',
    );
  }

  const resolvedMedia = resolve(mediaRoot);
  const canonicalMedia = realpathSync(resolvedMedia);
  const mediaStat = lstatSync(resolvedMedia);
  const sameMedia =
    process.platform === 'win32'
      ? canonicalMedia.toLowerCase() === resolvedMedia.toLowerCase()
      : canonicalMedia === resolvedMedia;
  const repoVerification = resolve(
    require.resolve('../package.json'),
    '../..',
    '.verification',
  ).toLowerCase();
  const allowedTmp = resolve(tmpdir()).toLowerCase();
  const lowerMedia = resolvedMedia.toLowerCase();
  if (
    !sameMedia ||
    !mediaStat.isDirectory() ||
    mediaStat.isSymbolicLink() ||
    lowerMedia.includes('/var/lib/whistle') ||
    lowerMedia.includes('var\\lib\\whistle') ||
    (!isPathWithin(allowedTmp, lowerMedia) && !isPathWithin(repoVerification, lowerMedia))
  ) {
    throw new Error('MEDIA_ROOT must be a real isolated directory under temp or .verification.');
  }

  const existingMedia = readdirSync(resolvedMedia).filter(
    (name) => name.endsWith('.webp') || name.startsWith('.cleanup-'),
  );
  if (existingMedia.length > 0) {
    throw new Error('Prepare only an empty isolated MEDIA_ROOT.');
  }

  return { url, destination, mediaRoot: resolvedMedia };
}

async function generateSyntheticPortraitWebp(index) {
  const r = 40 + ((index * 37) % 180);
  const g = 50 + ((index * 53) % 170);
  const b = 70 + ((index * 71) % 160);
  const bytes = await sharp({
    create: { width: 160, height: 160, channels: 4, background: { r, g, b, alpha: 1 } },
  })
    .webp({ quality: 82 })
    .toBuffer();
  return { bytes, width: 160, height: 160, checksum: mediaChecksum(bytes) };
}

async function prepare() {
  const { url, destination, mediaRoot } = validateTargets();
  const db = new DatabaseService(url.href);
  const storage = new LocalMediaStore(mediaRoot, 'local');
  const createdFiles = [];
  let reservation;
  let owned = false;
  let databaseCloseAttempted = false;
  let complete = false;

  try {
    reservation = openSync(destination, 'wx', 0o600);
    owned = true;

    const [
      accountCount,
      seasonCount,
      clubCount,
      stadiumCount,
      playerCount,
      mediaCount,
      positionCount,
      nationalityCount,
    ] = await Promise.all([
      db.client.account.count(),
      db.client.season.count(),
      db.client.club.count(),
      db.client.stadium.count(),
      db.client.player.count(),
      db.client.mediaAsset.count(),
      db.client.position.count(),
      db.client.nationality.count(),
    ]);
    if (accountCount || seasonCount || clubCount || stadiumCount || playerCount || mediaCount) {
      throw new Error('Prepare only an empty dedicated Phase 3 lookup database.');
    }
    if (positionCount < 13 || nationalityCount < 253) {
      throw new Error('Approved reference catalogs must be migrated before seeding.');
    }

    const password = 'Synthetic phase3 lookup ' + randomUUID();
    const passwordHash = await new SecurityPrimitivesService().hashPassword(password);
    const now = new Date('2026-08-10T10:00:00.000Z');
    const seasonId = randomUUID();
    const regCaseId = randomUUID();
    const regVersionId = randomUUID();
    const clubWindowId = randomUUID();
    const playerWindow1Id = randomUUID();
    const playerWindow2Id = randomUUID();

    const accounts = Array.from({ length: 20 }, (_, index) => ({
      id: randomUUID(),
      username: 'p3.lookup.' + String(index + 1).padStart(2, '0'),
      personnelCode: 'P3_LKP_' + String(index + 1).padStart(2, '0'),
      fullName: 'Nhân viên kiểm thử tải P3 ' + String(index + 1).padStart(2, '0'),
      passwordHash,
      mustChangePassword: false,
    }));

    const preparerId = accounts[0].id;
    const approverId = accounts[1].id;

    const clubs = Array.from({ length: TOTAL_CLUBS }, (_, index) => {
      const num = String(index + 1).padStart(2, '0');
      return {
        id: randomUUID(),
        code: `P3_CLB_${num}`,
        name: index === 0 ? 'Câu lạc bộ Đà Nẵng Scale' : `Câu lạc bộ Ngoại hạng Thử nghiệm ${num}`,
        abbreviation: index === 0 ? 'DN01' : `C${num}`,
      };
    });

    const stadiums = Array.from({ length: TOTAL_CLUBS }, (_, index) => {
      const num = String(index + 1).padStart(2, '0');
      return {
        id: randomUUID(),
        code: `P3_STD_${num}`,
        name: index === 0 ? 'Sân vận động Hòa Xuân 01' : `Sân vận động Thử nghiệm ${num}`,
        location: index === 0 ? 'Đà Nẵng' : `Thành phố ${num}`,
      };
    });

    const players = [];
    const portraitSpecs = [];
    for (let clubIdx = 0; clubIdx < TOTAL_CLUBS; clubIdx += 1) {
      for (let slot = 0; slot < PLAYERS_PER_CLUB; slot += 1) {
        const idx = clubIdx * PLAYERS_PER_CLUB + slot;
        const num = String(idx + 1).padStart(3, '0');
        const isHomegrown = slot < HOMEGROWN_PER_CLUB;
        const isNonHomegrown =
          slot >= HOMEGROWN_PER_CLUB && slot < HOMEGROWN_PER_CLUB + NON_HOMEGROWN_PER_CLUB;
        const isU21 = !isHomegrown && !isNonHomegrown;
        const playerId = randomUUID();
        const fullName =
          idx === 0
            ? 'Nguyễn Hoàng Đà Nẵng 001'
            : idx === 1
              ? 'Trần Minh Quân Huế 002'
              : `Cầu thủ Kiểm thử Quy mô ${num}`;
        const birthDate = isU21
          ? new Date('2006-04-20T00:00:00.000Z')
          : isHomegrown
            ? new Date('1999-05-10T00:00:00.000Z')
            : new Date('1998-03-15T00:00:00.000Z');
        const nationalityCode = isU21
          ? 'VN'
          : isHomegrown
            ? 'ENG'
            : slot === HOMEGROWN_PER_CLUB
              ? 'VN'
              : 'FR';
        const positionCode = POSITIONS[slot % POSITIONS.length];
        players.push({
          id: playerId,
          code: `P3_PLR_${num}`,
          fullName,
          birthDate,
          nationalityCode,
          positionCode,
          clubIdx,
          slot,
          isHomegrown,
          isU21,
          hasPortrait: idx % 2 === 0,
        });
        if (idx % 2 === 0) {
          portraitSpecs.push({ idx, playerId, assetId: randomUUID() });
        }
      }
    }

    // Generate and store 300 real managed WebP portraits in LocalMediaStore in bounded batches
    const mediaAssets = [];
    const batchSize = 20;
    for (let offset = 0; offset < portraitSpecs.length; offset += batchSize) {
      const batch = portraitSpecs.slice(offset, offset + batchSize);
      const rendered = await Promise.all(
        batch.map(async (spec) => {
          const img = await generateSyntheticPortraitWebp(spec.idx);
          const objectKey = `${spec.assetId}.webp`;
          await storage.put(objectKey, img.bytes);
          createdFiles.push(objectKey);
          return {
            id: spec.assetId,
            playerId: spec.playerId,
            clubId: null,
            provider: 'LOCAL',
            objectKey,
            mimeType: 'image/webp',
            byteSize: img.bytes.length,
            width: img.width,
            height: img.height,
            checksum: img.checksum,
            storedBy: preparerId,
            createdAt: now,
          };
        }),
      );
      mediaAssets.push(...rendered);
    }

    const clubApplications = clubs.map((club, clubIdx) => {
      const caseId = randomUUID();
      const versionId = randomUUID();
      return {
        caseId,
        versionId,
        club,
        stadium: stadiums[clubIdx],
        clubPlayers: players.slice(clubIdx * PLAYERS_PER_CLUB, (clubIdx + 1) * PLAYERS_PER_CLUB),
      };
    });

    const registrations = players.map((player) => {
      const caseId = randomUUID();
      const versionId = randomUUID();
      return {
        caseId,
        versionId,
        club: clubs[player.clubIdx],
        player,
        shirtNumber: player.slot + 1,
      };
    });

    await db.client.$transaction(
      async (tx) => {
        await tx.account.createMany({ data: accounts });
        await tx.season.create({
          data: {
            id: seasonId,
            code: 'EPL-TEST-2026',
            name: 'Mùa giải kiểm thử quy mô PHASE 3 2026',
            competitionName: 'Premier League Test Fixture',
            startDate: new Date('2026-08-01T00:00:00.000Z'),
            endDate: new Date('2027-05-31T00:00:00.000Z'),
          },
        });

        await tx.seasonRoleAssignment.createMany({
          data: accounts.flatMap((account) => [
            {
              accountId: account.id,
              seasonId,
              roleCode: 'SEASON_MANAGER',
              grantedBy: preparerId,
              grantedAt: now,
            },
            {
              accountId: account.id,
              seasonId,
              roleCode: 'REGISTRATION_OFFICER',
              grantedBy: preparerId,
              grantedAt: now,
            },
          ]),
        });

        await tx.sharedMasterGrant.createMany({
          data: accounts.map((account) => ({
            accountId: account.id,
            masterKind: 'PLAYER_MASTER',
            grantedBy: preparerId,
            grantedAt: now,
          })),
        });

        // Declared test-only D097 regulation version
        const regActiveFrom = new Date('2026-05-31T17:00:00.000Z');
        await tx.regulationCase.create({ data: { id: regCaseId, seasonId } });
        await tx.regulationVersion.create({
          data: {
            id: regVersionId,
            seasonId,
            caseId: regCaseId,
            versionNumber: 1,
            preparedBy: preparerId,
            state: 'DRAFT',
            effectiveMode: 'IMMEDIATE',
            squadLimit: 25,
            nonHomegrownLimit: 17,
            homegrownSeasons: 3,
            homegrownMonths: 36,
            homegrownAgeStart: 15,
            homegrownAgeEnd: 21,
            u21Cutoff: new Date('2005-01-01T00:00:00.000Z'),
            clubCount: 20,
            formatCode: 'DOUBLE_ROUND_ROBIN',
            legs: 2,
            plannedMinutes: 120,
            preparationMinutes: 30,
            releaseMinutes: 30,
            winPoints: 3,
            drawPoints: 1,
            lossPoints: 0,
            qualificationCount: 4,
            relegationCount: 3,
            createdAt: regActiveFrom,
          },
        });
        await tx.rankingPriority.createMany({
          data: [
            { versionId: regVersionId, position: 1, criterionCode: 'POINTS' },
            { versionId: regVersionId, position: 2, criterionCode: 'GOAL_DIFFERENCE' },
            { versionId: regVersionId, position: 3, criterionCode: 'GOALS_FOR' },
          ],
        });
        await tx.goalType.createMany({
          data: [
            {
              regulationVersionId: regVersionId,
              code: 'A',
              name: 'Bàn thường',
              isOwnGoal: false,
              enabled: true,
            },
            {
              regulationVersionId: regVersionId,
              code: 'B',
              name: 'Phạt đền',
              isOwnGoal: false,
              enabled: true,
            },
            {
              regulationVersionId: regVersionId,
              code: 'C',
              name: 'Phản lưới',
              isOwnGoal: true,
              enabled: true,
            },
            {
              regulationVersionId: regVersionId,
              code: 'D',
              name: 'Đá phạt trực tiếp',
              isOwnGoal: false,
              enabled: true,
            },
          ],
        });
        await tx.cardType.createMany({
          data: [
            {
              regulationVersionId: regVersionId,
              code: 'Y',
              name: 'Thẻ vàng',
              meaning: 'YELLOW',
              enabled: true,
            },
            {
              regulationVersionId: regVersionId,
              code: 'R',
              name: 'Thẻ đỏ',
              meaning: 'RED',
              enabled: true,
            },
          ],
        });
        await tx.registrationWindow.createMany({
          data: [
            {
              id: clubWindowId,
              regulationVersionId: regVersionId,
              intakeKind: 'CLUB_APPLICATION',
              opensAt: new Date('2026-05-31T17:00:00.000Z'),
              closesAt: new Date('2026-07-31T17:00:00.000Z'),
            },
            {
              id: playerWindow1Id,
              regulationVersionId: regVersionId,
              intakeKind: 'PLAYER_CHANGE',
              opensAt: new Date('2026-05-31T17:00:00.000Z'),
              closesAt: new Date('2026-08-31T17:00:00.000Z'),
            },
            {
              id: playerWindow2Id,
              regulationVersionId: regVersionId,
              intakeKind: 'PLAYER_CHANGE',
              opensAt: new Date('2026-12-31T17:00:00.000Z'),
              closesAt: new Date('2027-01-31T17:00:00.000Z'),
            },
          ],
        });
        await tx.regulationVersion.update({
          where: { id: regVersionId },
          data: {
            state: 'EFFECTIVE',
            submittedAt: regActiveFrom,
            approvedAt: regActiveFrom,
            decidedAt: regActiveFrom,
            decidedBy: approverId,
            decisionReason: 'Quy định kiểm thử D097 cô lập PHASE 3.',
            activeFrom: regActiveFrom,
            activationProcessedAt: regActiveFrom,
          },
        });
        await tx.season.update({
          where: { id: seasonId },
          data: { currentRegulationVersionId: regVersionId, updatedAt: now },
        });

        await tx.club.createMany({ data: clubs });
        await tx.stadium.createMany({ data: stadiums });
        await tx.player.createMany({
          data: players.map((p) => ({
            id: p.id,
            code: p.code,
            fullName: p.fullName,
            birthDate: p.birthDate,
            nationalityCode: p.nationalityCode,
            positionCode: p.positionCode,
          })),
        });
        await tx.mediaAsset.createMany({ data: mediaAssets });

        // Link 300 current portraits to their players in one SQL update
        await tx.$executeRaw`
          UPDATE player p
          SET current_portrait_id = m.id
          FROM media_asset m
          WHERE m.player_id = p.id
        `;

        // 20 Club Applications (insert DRAFT -> proposed players -> update APPROVED -> set currentAcceptedVersionId)
        await tx.clubApplication.createMany({
          data: clubApplications.map((app) => ({
            id: app.caseId,
            seasonId,
            clubId: app.club.id,
          })),
        });
        const bm1ReceivedAt = new Date('2026-06-15T08:00:00.000Z');
        const bm1DecidedAt = new Date('2026-06-16T08:00:00.000Z');
        await tx.clubApplicationVersion.createMany({
          data: clubApplications.map((app, index) => ({
            id: app.versionId,
            seasonId,
            caseId: app.caseId,
            versionNumber: 1,
            versionKind: 'INITIAL',
            preparedBy: preparerId,
            state: 'DRAFT',
            coachName:
              index === 0 ? 'Huấn luyện viên Đà Nẵng 01' : `Huấn luyện viên Kiểm thử ${index + 1}`,
            homeStadiumId: app.stadium.id,
            representativeName: `Đại diện CLB ${String(index + 1).padStart(2, '0')}`,
            representativePhone: `0901000${String(index + 1).padStart(3, '0')}`,
            contactAddress: `Số ${index + 1} Đường Sân Vận Động, Thành phố Thử nghiệm`,
            createdAt: bm1ReceivedAt,
          })),
        });
        await tx.proposedPlayerItem.createMany({
          data: clubApplications.flatMap((app) =>
            app.clubPlayers.map((player, orderIndex) => ({
              id: randomUUID(),
              applicationVersionId: app.versionId,
              playerId: player.id,
              positionOrder: orderIndex + 1,
              shirtNumber: player.slot + 1,
            })),
          ),
        });
        for (const [appIdx, app] of clubApplications.entries()) {
          const coachName =
            appIdx === 0 ? 'Huấn luyện viên Đà Nẵng 01' : `Huấn luyện viên Kiểm thử ${appIdx + 1}`;
          await tx.clubApplicationVersion.update({
            where: { id: app.versionId },
            data: {
              state: 'APPROVED',
              receivedAt: bm1ReceivedAt,
              submittedAt: bm1ReceivedAt,
              decidedAt: bm1DecidedAt,
              decidedBy: approverId,
              decisionReason: 'Phê duyệt hồ sơ tham dự cho tập dữ liệu quy mô D090.',
              receiptRegulationVersionId: regVersionId,
              receiptTimingStatus: 'ON_TIME',
              receiptWindowId: clubWindowId,
              approvalRegulationVersionId: regVersionId,
              officialSnapshot: {
                club: { code: app.club.code, name: app.club.name },
                homeStadium: { code: app.stadium.code, name: app.stadium.name },
                coachName,
                proposedPlayerCount: PLAYERS_PER_CLUB,
              },
            },
          });
          await tx.clubApplication.update({
            where: { id: app.caseId },
            data: { currentAcceptedVersionId: app.versionId, updatedAt: bm1DecidedAt },
          });
        }

        // 600 Valid Seasonal Player Registrations (30 per club)
        const regReceivedAt = new Date('2026-07-01T08:00:00.000Z');
        const regDecidedAt = new Date('2026-07-02T08:00:00.000Z');
        const playingStart = new Date('2026-08-01T00:00:00.000Z');
        await tx.playerRegistration.createMany({
          data: registrations.map((reg) => ({
            id: reg.caseId,
            seasonId,
            clubId: reg.club.id,
            playerId: reg.player.id,
          })),
        });
        await tx.registrationVersion.createMany({
          data: registrations.map((reg) => ({
            id: reg.versionId,
            seasonId,
            caseId: reg.caseId,
            versionNumber: 1,
            preparedBy: preparerId,
            state: 'VALID',
            receivedAt: regReceivedAt,
            submittedAt: regReceivedAt,
            decidedAt: regDecidedAt,
            decidedBy: preparerId,
            decisionReason: 'Xác nhận đăng ký hợp lệ cho tập dữ liệu quy mô D090.',
            shirtNumber: reg.shirtNumber,
            playingStart,
            playingEnd: null,
            u21Finding: reg.player.isU21,
            homegrownFinding: reg.player.isHomegrown,
            nonHomegrownOptIn: !reg.player.isU21 && !reg.player.isHomegrown,
            evidenceBranch: reg.player.isHomegrown ? 'SEASONS' : null,
            qualifyingValue: reg.player.isHomegrown ? 4 : null,
            evidenceSummary: reg.player.isHomegrown
              ? 'Xác nhận đào tạo 4 mùa giải tại học viện thuộc liên đoàn.'
              : null,
            evidenceReference: reg.player.isHomegrown ? `HG-D090-${reg.player.code}` : null,
            affiliatedAssociationBasis: reg.player.isHomegrown ? true : null,
            verifiedBy: reg.player.isHomegrown ? preparerId : null,
            verifiedAt: reg.player.isHomegrown ? regReceivedAt : null,
            receiptRegulationVersionId: regVersionId,
            receiptTimingStatus: 'ON_TIME',
            receiptWindowId: playerWindow1Id,
            decisionRegulationVersionId: regVersionId,
            playingDisposition: 'ACTIVE',
            officialSnapshot: {
              playerCode: reg.player.code,
              playerName: reg.player.fullName,
              clubCode: reg.club.code,
              shirtNumber: reg.shirtNumber,
              u21Finding: reg.player.isU21,
              homegrownFinding: reg.player.isHomegrown,
            },
            createdAt: regReceivedAt,
          })),
        });
        await tx.$executeRaw`
          UPDATE player_registration pr
          SET current_validated_version_id = rv.id, updated_at = ${regDecidedAt}
          FROM registration_version rv
          WHERE rv.case_id = pr.id AND rv.state = 'VALID'
        `;
      },
      { timeout: 120000 },
    );

    const sortedPlayersByCode = [...players].sort(
      (a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id),
    );
    const sortedClubAppsById = [...clubApplications].sort((a, b) =>
      a.caseId.localeCompare(b.caseId),
    );
    const sortedRegsById = [...registrations].sort((a, b) => a.caseId.localeCompare(b.caseId));
    const club0RegsById = registrations
      .filter((reg) => reg.club.id === clubs[0].id)
      .sort((a, b) => a.caseId.localeCompare(b.caseId));
    const targetPlayer = players[0];
    const samplePortraits = mediaAssets.map((asset) => ({
      playerId: asset.playerId,
      portraitId: asset.id,
      byteSize: asset.byteSize,
    }));

    writeFileSync(
      reservation,
      JSON.stringify({
        evidenceKind: 'ISOLATED_TEST_FIXTURE',
        seasonId,
        seasonCode: 'EPL-TEST-2026',
        accounts: accounts.map(({ username }) => ({ username, password })),
        totals: {
          clubs: TOTAL_CLUBS,
          players: TOTAL_PLAYERS,
          portraits: mediaAssets.length,
          clubApplications: clubApplications.length,
          registrations: registrations.length,
          perClub: PLAYERS_PER_CLUB,
        },
        playerPage1Ids: sortedPlayersByCode.slice(0, 20).map((p) => p.id),
        playerPage2Ids: sortedPlayersByCode.slice(20, 40).map((p) => p.id),
        playerSearch: 'Đà Nẵng 001',
        targetPlayerId: targetPlayer.id,
        samplePortraits,
        clubAppExpectedIds: sortedClubAppsById.map((app) => app.caseId),
        clubAppSearch: 'Đà Nẵng Scale',
        targetClubAppId: clubApplications[0].caseId,
        targetClubId: clubs[0].id,
        registrationPage1Ids: sortedRegsById.slice(0, 20).map((r) => r.caseId),
        registrationPage2Ids: sortedRegsById.slice(20, 40).map((r) => r.caseId),
        clubRegistrationPage1Ids: club0RegsById.slice(0, 20).map((r) => r.caseId),
        clubRegistrationPage2Ids: club0RegsById.slice(20, 30).map((r) => r.caseId),
        registrationSearch: 'Đà Nẵng 001',
        targetRegistrationId: registrations[0].caseId,
      }),
    );
    fsyncSync(reservation);
    const descriptor = reservation;
    reservation = undefined;
    closeSync(descriptor);
    complete = true;
    databaseCloseAttempted = true;
    try {
      await db.close();
    } catch {
      throw new Error(
        'Database shutdown failed; the complete Phase 3 lookup manifest is retained.',
      );
    }
    process.stdout.write(
      `Prepared 20 synthetic users, 1 season (EPL-TEST-2026), ${TOTAL_CLUBS} clubs, ${clubApplications.length} approved BM1 applications, ${TOTAL_PLAYERS} players (${PLAYERS_PER_CLUB}/club valid registrations) and ${mediaAssets.length} managed WebP portraits.\n`,
    );
  } finally {
    try {
      if (reservation !== undefined) closeSync(reservation);
    } finally {
      try {
        if (owned && !complete) unlinkSync(destination);
        if (!complete) {
          for (const key of createdFiles) {
            try {
              unlinkSync(join(mediaRoot, key));
            } catch {
              // ignore cleanup errors on rollback
            }
          }
        }
      } finally {
        if (!databaseCloseAttempted) await db.close();
      }
    }
  }
}

prepare().catch((error) => {
  const shutdownMessage =
    'Database shutdown failed; the complete Phase 3 lookup manifest is retained.';
  process.stderr.write(
    'Phase 3 lookup fixture preparation failed. ' +
      (error instanceof Error && error.message === shutdownMessage
        ? shutdownMessage + ' '
        : 'Incomplete output and media created by this run are removed; existing output is preserved. ') +
      'Check protected configuration, empty target database and isolated MEDIA_ROOT. ' +
      'After a partial or post-commit failure, replace the disposable lookup database/media root and use a new fixture output before retrying.\n',
  );
  process.exitCode = 1;
});
