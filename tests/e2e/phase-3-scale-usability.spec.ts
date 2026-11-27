import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { SecurityPrimitivesService } from '../../backend/src/identity-access/security-primitives.service';
import { LocalMediaStore, mediaChecksum } from '../../backend/src/media/local-media.store';
import { normalizePlayerPortrait } from '../../backend/src/media/media-validation';
import { DatabaseService } from '../../backend/src/platform/database.service';
import { assertIsolatedTarget } from '../../backend/tests/fixtures/isolated-target.guard';
import { login } from './login';

const SCALE_SEASON_CODE = 'EPL-TEST-2026';
const SCALE_SEASON_NAME = 'Mùa giải kiểm thử quy mô PHASE 3 2026';
const TOTAL_CLUBS = 20;
const PLAYERS_PER_CLUB = 30;
const HOMEGROWN_PER_CLUB = 8;
const NON_HOMEGROWN_PER_CLUB = 17;
const POSITIONS = ['GK', 'LB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'LM', 'RW', 'RM', 'ST', 'CF'];

const portraitFixtureA = {
  name: 'portrait-scale-a.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAwAAAAKCAIAAAAPTiitAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFUlEQVQYlWMI1dlGEDGMKmKgWhAAADOpkckQKh4EAAAAAElFTkSuQmCC',
    'base64',
  ),
};

const portraitFixtureB = {
  name: 'portrait-scale-b.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAHUlEQVQ4jWNQ6o77TwlmGDXg/2gYxI2GQfewCAMAXR0KH17PzCYAAAAASUVORK5CYII=',
    'base64',
  ),
};

type PersonaCredential = {
  id: string;
  username: string;
  password: string;
  label: string;
  roles: string;
};

type ScaleSeedContext = {
  seasonId: string;
  club01Id: string;
  personas: PersonaCredential[];
};

type UiTimingRecord = {
  browser: string;
  browserVersion: string;
  viewport: string;
  screen: string;
  operation: string;
  elapsedMs: number;
};

type Td01TrialRecord = {
  browser: string;
  browserVersion: string;
  persona: string;
  roles: string;
  taskId: string;
  taskLabel: string;
  navigationActions: number;
  elapsedMs: number;
  within30s: boolean;
  within3Actions: boolean;
  passed: boolean;
};

const SCALE_PASSWORD = 'Synthetic scale browser 🦉 P3 only';

async function ensureScaleDataset(): Promise<ScaleSeedContext> {
  const dbUrl = assertIsolatedTarget(process.env.E2E_TEST_DATABASE_URL ?? '');
  const mediaRoot = process.env.E2E_MEDIA_ROOT;
  if (!mediaRoot) {
    throw new Error('E2E_MEDIA_ROOT is required for hundreds-of-profiles portrait verification.');
  }
  const db = new DatabaseService(dbUrl);
  const storage = new LocalMediaStore(mediaRoot, 'local');
  try {
    const existingSeason = await db.client.season.findUnique({
      where: { code: SCALE_SEASON_CODE },
      select: { id: true },
    });
    if (existingSeason) {
      const club01 = await db.client.club.findUniqueOrThrow({
        where: { code: 'SC3_CLB_01' },
        select: { id: true },
      });
      const accounts = await db.client.account.findMany({
        where: { username: { startsWith: 'sc3.td01.' } },
        orderBy: { username: 'asc' },
        select: { id: true, username: true, fullName: true },
      });
      const roleSummaries = [
        'REGISTRATION_OFFICER + PLAYER_MASTER',
        'SEASON_MANAGER + PLAYER_MASTER',
        'REGISTRATION_OFFICER + SEASON_MANAGER + PLAYER_MASTER',
        'REGISTRATION_OFFICER + PLAYER_MASTER',
        'SEASON_MANAGER + PLAYER_MASTER',
      ];
      return {
        seasonId: existingSeason.id,
        club01Id: club01.id,
        personas: accounts.map((acc, index) => ({
          id: acc.id,
          username: acc.username,
          password: SCALE_PASSWORD,
          label: acc.fullName,
          roles: roleSummaries[index] ?? 'REGISTRATION_OFFICER + PLAYER_MASTER',
        })),
      };
    }

    const now = await db.now();
    const passwordHash = await new SecurityPrimitivesService().hashPassword(SCALE_PASSWORD);
    const seasonId = randomUUID();
    const regCaseId = randomUUID();
    const regVersionId = randomUUID();
    const clubWindowId = randomUUID();
    const playerWindow1Id = randomUUID();
    const playerWindow2Id = randomUUID();

    const personaSpecs = [
      {
        username: 'sc3.td01.01',
        code: 'SC3_U01',
        fullName: 'Cán bộ đăng ký 01',
        roles: ['REGISTRATION_OFFICER'],
        roleSummary: 'REGISTRATION_OFFICER + PLAYER_MASTER',
      },
      {
        username: 'sc3.td01.02',
        code: 'SC3_U02',
        fullName: 'Quản lý mùa giải 02',
        roles: ['SEASON_MANAGER'],
        roleSummary: 'SEASON_MANAGER + PLAYER_MASTER',
      },
      {
        username: 'sc3.td01.03',
        code: 'SC3_U03',
        fullName: 'Cán bộ tổng hợp 03',
        roles: ['REGISTRATION_OFFICER', 'SEASON_MANAGER'],
        roleSummary: 'REGISTRATION_OFFICER + SEASON_MANAGER + PLAYER_MASTER',
      },
      {
        username: 'sc3.td01.04',
        code: 'SC3_U04',
        fullName: 'Cán bộ kiểm duyệt 04',
        roles: ['REGISTRATION_OFFICER'],
        roleSummary: 'REGISTRATION_OFFICER + PLAYER_MASTER',
      },
      {
        username: 'sc3.td01.05',
        code: 'SC3_U05',
        fullName: 'Quản lý điều hành 05',
        roles: ['SEASON_MANAGER'],
        roleSummary: 'SEASON_MANAGER + PLAYER_MASTER',
      },
    ] as const;

    const accounts = personaSpecs.map((spec) => ({
      id: randomUUID(),
      username: spec.username,
      personnelCode: spec.code,
      fullName: spec.fullName,
      passwordHash,
      mustChangePassword: false,
    }));

    const preparerId = accounts[0].id;
    const approverId = accounts[1].id;

    const clubs = Array.from({ length: TOTAL_CLUBS }, (_, index) => {
      const num = String(index + 1).padStart(2, '0');
      return {
        id: randomUUID(),
        code: `SC3_CLB_${num}`,
        name: index === 0 ? 'Câu lạc bộ Đà Nẵng Scale' : `Câu lạc bộ Ngoại hạng Thử nghiệm ${num}`,
        abbreviation: index === 0 ? 'DN01' : `S${num}`,
      };
    });

    const stadiums = Array.from({ length: TOTAL_CLUBS }, (_, index) => {
      const num = String(index + 1).padStart(2, '0');
      return {
        id: randomUUID(),
        code: `SC3_STD_${num}`,
        name: index === 0 ? 'Sân vận động Hòa Xuân 01' : `Sân vận động Thử nghiệm ${num}`,
        location: index === 0 ? 'Đà Nẵng' : `Thành phố ${num}`,
      };
    });

    const players: {
      id: string;
      code: string;
      fullName: string;
      birthDate: Date;
      nationalityCode: string;
      positionCode: string;
      clubIdx: number;
      slot: number;
      isHomegrown: boolean;
      isU21: boolean;
    }[] = [];
    const portraitSpecs: { idx: number; playerId: string; assetId: string }[] = [];

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
          code: `SC3_PLR_${num}`,
          fullName,
          birthDate,
          nationalityCode,
          positionCode,
          clubIdx,
          slot,
          isHomegrown,
          isU21,
        });
        if (idx % 2 === 0) {
          portraitSpecs.push({ idx, playerId, assetId: randomUUID() });
        }
      }
    }

    // Generate and store 300 real normalized static WebP portraits via LocalMediaStore
    const [normalizedA, normalizedB] = await Promise.all([
      normalizePlayerPortrait(portraitFixtureA.buffer),
      normalizePlayerPortrait(portraitFixtureB.buffer),
    ]);
    const mediaAssets: {
      id: string;
      playerId: string;
      clubId: null;
      provider: string;
      objectKey: string;
      mimeType: string;
      byteSize: number;
      width: number;
      height: number;
      checksum: string;
      storedBy: string;
      createdAt: Date;
    }[] = [];

    for (let offset = 0; offset < portraitSpecs.length; offset += 25) {
      const batch = portraitSpecs.slice(offset, offset + 25);
      const rendered = await Promise.all(
        batch.map(async (spec) => {
          const chosen = (spec.idx / 2) % 2 === 0 ? normalizedA : normalizedB;
          const objectKey = `${spec.assetId}.webp`;
          await storage.put(objectKey, chosen.bytes);
          return {
            id: spec.assetId,
            playerId: spec.playerId,
            clubId: null,
            provider: 'LOCAL',
            objectKey,
            mimeType: 'image/webp',
            byteSize: chosen.bytes.length,
            width: chosen.width,
            height: chosen.height,
            checksum: mediaChecksum(chosen.bytes),
            storedBy: preparerId,
            createdAt: now,
          };
        }),
      );
      mediaAssets.push(...rendered);
    }

    const clubApps = clubs.map((club, clubIdx) => ({
      caseId: randomUUID(),
      versionId: randomUUID(),
      club,
      stadium: stadiums[clubIdx],
      clubPlayers: players.slice(clubIdx * PLAYERS_PER_CLUB, (clubIdx + 1) * PLAYERS_PER_CLUB),
    }));

    const regs = players.map((player) => ({
      caseId: randomUUID(),
      versionId: randomUUID(),
      club: clubs[player.clubIdx],
      player,
      shirtNumber: player.slot + 1,
    }));

    const regActiveFrom = new Date('2026-05-31T17:00:00.000Z');
    const bm1ReceivedAt = new Date('2026-06-15T08:00:00.000Z');
    const bm1DecidedAt = new Date('2026-06-16T08:00:00.000Z');
    const regReceivedAt = new Date('2026-07-01T08:00:00.000Z');
    const regDecidedAt = new Date('2026-07-02T08:00:00.000Z');
    const playingStart = new Date('2026-08-01T00:00:00.000Z');

    await db.client.$transaction(
      async (tx) => {
        await tx.account.createMany({ data: accounts });
        await tx.season.create({
          data: {
            id: seasonId,
            code: SCALE_SEASON_CODE,
            name: SCALE_SEASON_NAME,
            competitionName: 'Premier League Test Fixture',
            startDate: new Date('2026-08-01T00:00:00.000Z'),
            endDate: new Date('2027-05-31T00:00:00.000Z'),
          },
        });
        await tx.seasonRoleAssignment.createMany({
          data: accounts.flatMap((account, idx) =>
            personaSpecs[idx].roles.map((roleCode) => ({
              accountId: account.id,
              seasonId,
              roleCode,
              grantedBy: preparerId,
              grantedAt: now,
            })),
          ),
        });
        await tx.sharedMasterGrant.createMany({
          data: accounts.map((account) => ({
            accountId: account.id,
            masterKind: 'PLAYER_MASTER',
            grantedBy: preparerId,
            grantedAt: now,
          })),
        });

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
            decisionReason: 'Quy định kiểm thử quy mô PHASE 3.',
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
        await tx.$executeRaw`
          UPDATE player p
          SET current_portrait_id = m.id
          FROM media_asset m
          WHERE m.player_id = p.id
            AND p.code LIKE 'SC3_PLR_%'
        `;

        await tx.clubApplication.createMany({
          data: clubApps.map((app) => ({ id: app.caseId, seasonId, clubId: app.club.id })),
        });
        await tx.clubApplicationVersion.createMany({
          data: clubApps.map((app, index) => ({
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
          data: clubApps.flatMap((app) =>
            app.clubPlayers.map((player, orderIndex) => ({
              id: randomUUID(),
              applicationVersionId: app.versionId,
              playerId: player.id,
              positionOrder: orderIndex + 1,
              shirtNumber: player.slot + 1,
            })),
          ),
        });
        for (const [appIdx, app] of clubApps.entries()) {
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
              decisionReason: 'Phê duyệt hồ sơ tham dự tập quy mô D090.',
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

        await tx.playerRegistration.createMany({
          data: regs.map((reg) => ({
            id: reg.caseId,
            seasonId,
            clubId: reg.club.id,
            playerId: reg.player.id,
          })),
        });
        await tx.registrationVersion.createMany({
          data: regs.map((reg) => ({
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
            decisionReason: 'Xác nhận đăng ký hợp lệ tập quy mô D090.',
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
            evidenceReference: reg.player.isHomegrown ? `HG-SC3-${reg.player.code}` : null,
            affiliatedAssociationBasis: reg.player.isHomegrown ? true : null,
            verifiedBy: reg.player.isHomegrown ? preparerId : null,
            verifiedAt: reg.player.isHomegrown ? regReceivedAt : null,
            receiptRegulationVersionId: regVersionId,
            receiptTimingStatus: 'ON_TIME',
            receiptWindowId: playerWindow1Id,
            decisionRegulationVersionId: regVersionId,
            playingDisposition: 'ACTIVE',
            officialSnapshot: {
              club: { code: reg.club.code, name: reg.club.name },
              player: { code: reg.player.code, fullName: reg.player.fullName },
              registration: {
                shirtNumber: reg.shirtNumber,
                playingStart: playingStart.toISOString(),
                playingEnd: null,
                u21Finding: reg.player.isU21,
                homegrownFinding: reg.player.isHomegrown,
                nonHomegrownOptIn: !reg.player.isU21 && !reg.player.isHomegrown,
              },
            },
            createdAt: regReceivedAt,
          })),
        });
        await tx.$executeRaw`
          UPDATE player_registration pr
          SET current_validated_version_id = rv.id, updated_at = ${regDecidedAt}
          FROM registration_version rv
          WHERE rv.case_id = pr.id
            AND rv.state = 'VALID'
            AND pr.season_id = ${seasonId}::uuid
        `;
      },
      { timeout: 120000 },
    );

    return {
      seasonId,
      club01Id: clubs[0].id,
      personas: accounts.map((acc, index) => ({
        id: acc.id,
        username: acc.username,
        password: SCALE_PASSWORD,
        label: acc.fullName,
        roles: personaSpecs[index].roleSummary,
      })),
    };
  } finally {
    await db.close();
  }
}

async function assertTableActionFits(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const scroll = page.getByRole('table').locator('..');
  await scroll.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  const container = await scroll.boundingBox();
  const action = await page.getByRole('table').getByRole('button').last().boundingBox();
  expect(container).not.toBeNull();
  expect(action).not.toBeNull();
  expect(action!.x).toBeGreaterThanOrEqual(container!.x - 1);
  expect(action!.x + action!.width).toBeLessThanOrEqual(container!.x + container!.width + 1);
}

async function assertWithinViewport(locator: Locator, viewport: { width: number; height: number }) {
  await locator.scrollIntoViewIfNeeded();
  const bounds = await locator.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function selectFilterOption(page: Page, label: string, optionText: string) {
  const control = page.getByRole('combobox', { name: label, exact: true });
  await control.locator('..').click();
  await expect(control).toHaveAttribute('aria-expanded', 'true');
  const popup = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
  const option = popup.locator('.ant-select-item-option', { hasText: optionText }).first();
  await expect(option).toBeVisible();
  await option.hover();
  await control.press('Enter');
  await expect(control).toHaveAttribute('aria-expanded', 'false');
}

const uiTimings: UiTimingRecord[] = [];
let seed!: ScaleSeedContext;

test.describe.serial('T027: Scale lookups, TT-02 viewports, portraits and TD-01 usability', () => {
  test.beforeAll(async () => {
    test.setTimeout(120000);
    seed = await ensureScaleDataset();
  });

  test.afterAll(async ({ browser }, testInfo) => {
    const dir = join(process.cwd(), '.verification', 't027-browser');
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, `ui-timings-${testInfo.project.name}.json`),
      JSON.stringify(
        {
          browser: testInfo.project.name,
          browserVersion: browser.version(),
          records: uiTimings,
        },
        null,
        2,
      ),
    );
  });

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1366, height: 768 },
  ]) {
    test(`T027 TT-02 viewport ${viewport.width}x${viewport.height}: 600-player pagination, Vietnamese search, 300-portrait rendering/management and 30/club registrations`, async ({
      page,
      browser,
    }, testInfo) => {
      test.setTimeout(90000);
      await page.setViewportSize(viewport);
      const vpLabel = `${viewport.width}x${viewport.height}`;
      const browserVersion = browser.version();
      const recordTiming = (screen: string, operation: string, startMs: number) => {
        uiTimings.push({
          browser: testInfo.project.name,
          browserVersion,
          viewport: vpLabel,
          screen,
          operation,
          elapsedMs: Date.now() - startMs,
        });
      };

      await login(page, seed.personas[0]);

      // 1. Players lookup at 600-profile / 300-portrait scale
      let start = Date.now();
      await page.goto('/workspace/players');
      await expect(page.getByRole('heading', { name: 'Quản lý hồ sơ cầu thủ' })).toBeVisible();
      await expect(page.getByText(/^Trang 1 \/ 3\d+$/)).toBeVisible();
      recordTiming('players', 'initial-load-600-page1', start);

      // Filter by scale prefix so pagination is deterministic even inside full E2E runs
      await page.getByLabel('Tìm cầu thủ').fill('SC3_PLR_');
      await expect(page.getByText('Trang 1 / 30', { exact: true })).toBeVisible();
      await assertTableActionFits(page);
      const playerCodesP1 = await page
        .getByRole('table')
        .locator('tbody tr td:nth-child(3)')
        .allTextContents();
      expect(playerCodesP1).toHaveLength(20);

      // Verify real managed WebP portraits decoded alongside accessible fallbacks on page 1
      await expect
        .poll(async () =>
          page.getByRole('table').evaluate((table) => {
            const imgs = Array.from(table.querySelectorAll('tbody img')) as HTMLImageElement[];
            return imgs.filter((img) => img.naturalWidth > 0).length;
          }),
        )
        .toBeGreaterThanOrEqual(8);
      await expect(
        page
          .getByRole('table')
          .getByRole('img', { name: /chưa có ảnh khả dụng/ })
          .first(),
      ).toBeVisible();

      start = Date.now();
      await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
      await expect(page.getByText('Trang 2 / 30', { exact: true })).toBeVisible();
      recordTiming('players', 'paginate-page2', start);

      const playerCodesP2 = await page
        .getByRole('table')
        .locator('tbody tr td:nth-child(3)')
        .allTextContents();
      expect(playerCodesP2).toHaveLength(20);
      expect(new Set([...playerCodesP1, ...playerCodesP2]).size).toBe(40);

      // Vietnamese diacritic search
      start = Date.now();
      await page.getByLabel('Tìm cầu thủ').fill('Đà Nẵng 001');
      await expect(
        page.getByRole('cell', { name: 'Nguyễn Hoàng Đà Nẵng 001', exact: true }),
      ).toBeVisible();
      recordTiming('players', 'vietnamese-search', start);
      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
      await expect
        .poll(async () =>
          page
            .getByRole('table')
            .locator('tbody img')
            .first()
            .evaluate((img) => (img as HTMLImageElement).naturalWidth > 0),
        )
        .toBe(true);

      // Live portrait upload, replace, remove & fallback at this viewport (distinct player per browser)
      const mutablePlayerCode = testInfo.project.name === 'chrome' ? 'SC3_PLR_002' : 'SC3_PLR_004';
      await page.getByLabel('Tìm cầu thủ').fill(mutablePlayerCode);
      await expect(page.getByRole('cell', { name: mutablePlayerCode, exact: true })).toBeVisible();
      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
      await page.getByRole('table').getByRole('button').first().click();
      const drawer = page.getByRole('dialog').filter({ hasText: 'Hồ sơ cầu thủ' });
      const fallback = drawer.getByRole('img', { name: /chưa có ảnh khả dụng/ });
      await expect(fallback).toBeVisible();

      start = Date.now();
      await drawer.getByLabel('Chọn ảnh chân dung').setInputFiles(portraitFixtureA);
      await drawer.getByRole('button', { name: 'Tải ảnh lên' }).click();
      const drawerImg = drawer.locator('img');
      await expect(drawerImg).toBeVisible();
      await expect
        .poll(() => drawerImg.evaluate((img) => (img as HTMLImageElement).naturalWidth))
        .toBe(12);
      const uploadedSrc = await drawerImg.getAttribute('src');
      recordTiming('players', 'portrait-upload-render', start);

      for (const control of [
        drawerImg,
        drawer.getByLabel('Chọn ảnh thay thế'),
        drawer.getByRole('button', { name: 'Gỡ ảnh chân dung', exact: true }),
      ]) {
        await assertWithinViewport(control, viewport);
      }

      // Replace portrait with second valid 16x16 image and verify src + dimensions actually switch
      await drawer.getByLabel('Chọn ảnh thay thế').setInputFiles(portraitFixtureB);
      await drawer.getByRole('button', { name: 'Thay ảnh chân dung' }).click();
      await expect
        .poll(() =>
          drawerImg.evaluate(
            (img, prev) => ({
              width: (img as HTMLImageElement).naturalWidth,
              changed: img.getAttribute('src') !== prev,
            }),
            uploadedSrc,
          ),
        )
        .toEqual({ width: 16, changed: true });

      // Remove back to accessible fallback
      await drawer.getByRole('button', { name: 'Gỡ ảnh chân dung', exact: true }).click();
      await drawer.getByRole('button', { name: 'Xác nhận gỡ ảnh' }).click();
      await expect(fallback).toBeVisible();
      await drawer.getByRole('button', { name: 'Đóng', exact: true }).last().click();
      await expect(drawer).not.toBeVisible();

      // 2. Club Participation Applications (20 approved BM1 applications)
      start = Date.now();
      await page.goto(`/workspace/seasons/${seed.seasonId}/club-applications`);
      await expect(
        page.getByRole('heading', { name: 'Hồ sơ đăng ký tham dự câu lạc bộ' }),
      ).toBeVisible();
      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(20);
      recordTiming('club-applications', 'initial-load-20-clubs', start);
      await assertTableActionFits(page);

      start = Date.now();
      await page.getByLabel('Tìm hồ sơ tham dự').fill('Đà Nẵng Scale');
      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
      await expect(page.getByText('Câu lạc bộ Đà Nẵng Scale')).toBeVisible();
      recordTiming('club-applications', 'vietnamese-search', start);

      // 3. Seasonal Player Registrations (600 total + 30/club pagination)
      start = Date.now();
      await page.goto(`/workspace/seasons/${seed.seasonId}/player-registrations`);
      await expect(page.getByRole('heading', { name: 'Đăng ký cầu thủ theo mùa' })).toBeVisible();
      await expect(page.getByText('Trang 1 / 30', { exact: true })).toBeVisible();
      recordTiming('player-registrations', 'initial-load-600-page1', start);
      await assertTableActionFits(page);

      const regRowsP1 = await page
        .getByRole('table')
        .locator('tbody tr td:nth-child(1)')
        .allTextContents();
      expect(regRowsP1).toHaveLength(20);

      start = Date.now();
      await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
      await expect(page.getByText('Trang 2 / 30', { exact: true })).toBeVisible();
      recordTiming('player-registrations', 'paginate-page2', start);

      const regRowsP2 = await page
        .getByRole('table')
        .locator('tbody tr td:nth-child(1)')
        .allTextContents();
      expect(regRowsP2).toHaveLength(20);
      expect(new Set([...regRowsP1, ...regRowsP2]).size).toBe(40);

      // Filter by Club 01 -> 30 players/club -> Trang 1 / 2 (20) + Trang 2 / 2 (10) = 30 distinct
      start = Date.now();
      await selectFilterOption(page, 'Câu lạc bộ', 'Câu lạc bộ Đà Nẵng Scale');
      await expect(page.getByText('Trang 1 / 2', { exact: true })).toBeVisible();
      const club30P1 = await page
        .getByRole('table')
        .locator('tbody tr td:nth-child(1)')
        .allTextContents();
      expect(club30P1).toHaveLength(20);
      await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
      await expect(page.getByText('Trang 2 / 2', { exact: true })).toBeVisible();
      const club30P2 = await page
        .getByRole('table')
        .locator('tbody tr td:nth-child(1)')
        .allTextContents();
      expect(club30P2).toHaveLength(10);
      expect(new Set([...club30P1, ...club30P2]).size).toBe(30);
      recordTiming('player-registrations', 'filter-club-30-pagination', start);

      start = Date.now();
      await page.getByLabel('Tìm hồ sơ đăng ký cầu thủ').fill('Đà Nẵng 001');
      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1);
      await expect(page.getByText('Nguyễn Hoàng Đà Nẵng 001')).toBeVisible();
      recordTiming('player-registrations', 'vietnamese-search', start);
    });
  }

  test('T027 TD-01 automated persona navigation trials (5 representative accounts x 4 authorized tasks = 20 trials)', async ({
    page,
    browser,
  }, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1366, height: 768 });
    const browserVersion = browser.version();
    const trials: Td01TrialRecord[] = [];

    const recordTrial = (
      persona: PersonaCredential,
      taskId: string,
      taskLabel: string,
      navigationActions: number,
      startMs: number,
    ) => {
      const elapsedMs = Date.now() - startMs;
      trials.push({
        browser: testInfo.project.name,
        browserVersion,
        persona: persona.username,
        roles: persona.roles,
        taskId,
        taskLabel,
        navigationActions,
        elapsedMs,
        within30s: elapsedMs <= 30000,
        within3Actions: navigationActions <= 3,
        passed: elapsedMs <= 30000 && navigationActions <= 3,
      });
    };

    for (const persona of seed.personas) {
      await login(page, persona);

      // Task 1: Navigate from /internal to Player Profiles lookup (1 action)
      await page.goto('/internal');
      let start = Date.now();
      await page.getByRole('link', { name: 'Quản lý hồ sơ cầu thủ' }).click();
      await expect(page.getByRole('heading', { name: 'Quản lý hồ sơ cầu thủ' })).toBeVisible();
      await expect(page.getByText(/^Trang 1 \/ 3\d+$/)).toBeVisible();
      recordTrial(persona, 'T1', 'Tra cứu danh sách hồ sơ cầu thủ (600 cầu thủ)', 1, start);

      // Task 2: Navigate from /internal to Club Participation Applications for season (2 actions)
      await page.goto('/internal');
      start = Date.now();
      await page.getByRole('link', { name: 'Hồ sơ tham dự câu lạc bộ' }).click();
      await page.getByRole('link', { name: new RegExp(SCALE_SEASON_NAME) }).click();
      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(20);
      recordTrial(persona, 'T2', 'Tra cứu hồ sơ tham dự câu lạc bộ theo mùa giải', 2, start);

      // Task 3: Navigate from /internal to Seasonal Player Registrations (1 action via single-season auto-select)
      await page.goto('/internal');
      start = Date.now();
      await page.getByRole('link', { name: 'Đăng ký cầu thủ theo mùa' }).click();
      await expect(page.getByText('Trang 1 / 30', { exact: true })).toBeVisible();
      recordTrial(
        persona,
        'T3',
        'Tra cứu danh sách đăng ký cầu thủ theo mùa (600 hồ sơ)',
        1,
        start,
      );

      // Task 4: Navigate from /internal to a validated registration detail & playing effectivity (2 actions)
      await page.goto('/internal');
      start = Date.now();
      await page.getByRole('link', { name: 'Đăng ký cầu thủ theo mùa' }).click();
      await expect(page.getByText('Trang 1 / 30', { exact: true })).toBeVisible();
      await page
        .getByRole('table')
        .getByRole('button', { name: /Chi tiết/ })
        .first()
        .click();
      const regDrawer = page.getByRole('dialog');
      await expect(regDrawer).toBeVisible();
      await expect(regDrawer.getByText('Đang hiệu lực').first()).toBeVisible();
      recordTrial(
        persona,
        'T4',
        'Mở chi tiết đăng ký cầu thủ và kiểm tra hiệu lực thi đấu',
        2,
        start,
      );
      await regDrawer.getByRole('button', { name: 'Đóng', exact: true }).last().click();

      // Log out cleanly before next representative persona
      await page.getByRole('button', { name: 'Đăng xuất' }).click();
      await expect(page).toHaveURL(/\/login$/);
    }

    const dir = join(process.cwd(), '.verification', 't027-browser');
    await mkdir(dir, { recursive: true });
    await writeFile(
      join(dir, `td01-${testInfo.project.name}.json`),
      JSON.stringify(
        {
          browser: testInfo.project.name,
          browserVersion,
          trialCount: trials.length,
          passedCount: trials.filter((t) => t.passed).length,
          passRate: trials.filter((t) => t.passed).length / trials.length,
          trials,
        },
        null,
        2,
      ),
    );

    expect(trials).toHaveLength(20);
    const passCount = trials.filter((t) => t.passed).length;
    expect(passCount / trials.length).toBeGreaterThanOrEqual(0.8);
  });
});
