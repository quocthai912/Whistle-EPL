import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rmdir, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import sharp from 'sharp';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { SESSION_COOKIE } from '../../src/identity-access/csrf.service';
import { SecurityPrimitivesService } from '../../src/identity-access/security-primitives.service';
import { LocalMediaStore } from '../../src/media/local-media.store';
import { DatabaseService } from '../../src/platform/database.service';
import { SafeErrorFilter } from '../../src/platform/error.filter';
import { ResponseEnvelopeInterceptor } from '../../src/platform/response-envelope.interceptor';
import { SafeValidationPipe } from '../../src/platform/validation.pipe';
import { assertIsolatedTarget } from '../fixtures/isolated-target.guard';
import { createPhase1Fixtures, resetPhase1Fixtures } from '../fixtures/phase-1-fixtures';
import { TestClock } from '../fixtures/test-clock';

export type Phase3EvidenceMarker = 'ISOLATED_TEST_FIXTURE';

/** Declared test-only D090/D097 regulation values; never imported by production code. */
export const DECLARED_TEST_ONLY_REGULATION = Object.freeze({
  evidenceKind: 'ISOLATED_TEST_FIXTURE' as Phase3EvidenceMarker,
  testOnly: true as const,
  squadLimit: 25,
  nonHomegrownLimit: 17,
  homegrownSeasons: 3,
  homegrownMonths: 36,
  homegrownAgeStart: 15,
  homegrownAgeEnd: 21,
  u21Cutoff: '2005-01-01',
  clubCount: 20,
  formatCode: 'DOUBLE_ROUND_ROBIN' as const,
  legs: 2,
  plannedMinutes: 90,
  preparationMinutes: 30,
  releaseMinutes: 30,
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  qualificationCount: 4,
  relegationCount: 3,
});

/** Guards isolated media roots so tests never touch operational or repository directories. */
export function assertIsolatedMediaRoot(mediaRoot: string): string {
  if (!mediaRoot || !isAbsolute(mediaRoot))
    throw new Error('An explicit absolute isolated media root is required.');
  const normalized = resolve(mediaRoot).toLowerCase();
  const repoRoot = resolve(__dirname, '../../..').toLowerCase();
  const allowedTmp = resolve(tmpdir()).toLowerCase();
  const allowedVerification = resolve(repoRoot, '.verification').toLowerCase();
  if (
    normalized.includes('var\\lib\\whistle') ||
    normalized.includes('/var/lib/whistle') ||
    (!normalized.startsWith(allowedTmp) && !normalized.startsWith(allowedVerification))
  )
    throw new Error(
      'Isolated test media root must reside under temporary or .verification storage.',
    );
  return resolve(mediaRoot);
}

/** Verifies integration, browser and restore targets remain explicitly distinct isolated DBs. */
export function assertDistinctIsolatedTargets(targets: {
  integration?: string;
  browser?: string;
  restore?: string;
}): void {
  const seen = new Map<string, string>();
  for (const [label, url] of Object.entries(targets)) {
    if (!url) continue;
    assertIsolatedTarget(url);
    const parsed = new URL(url);
    const host = ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname.toLowerCase())
      ? 'loopback'
      : parsed.hostname.toLowerCase();
    const key = `${host}:${parsed.port}:${decodeURIComponent(parsed.pathname)}`;
    const prior = seen.get(key);
    if (prior)
      throw new Error(`Isolated targets ${prior} and ${label} must not share the same database.`);
    seen.set(key, label);
  }
}

/** Generates authorized synthetic static test images without external assets. */
export async function createAuthorizedTestImage(
  format: 'png' | 'jpeg' | 'webp' = 'png',
  width = 160,
  height = 160,
  color = { r: 85, g: 44, b: 182, alpha: 1 },
): Promise<Buffer> {
  const base = sharp({ create: { width, height, channels: 4, background: color } });
  if (format === 'jpeg')
    return base.flatten({ background: '#ffffff' }).jpeg({ quality: 85 }).toBuffer();
  if (format === 'webp') return base.webp({ quality: 85 }).toBuffer();
  return base.png().toBuffer();
}

export async function createOversizedDimensionImage(): Promise<Buffer> {
  return sharp({
    create: { width: 2049, height: 64, channels: 3, background: { r: 40, g: 60, b: 90 } },
  })
    .png()
    .toBuffer();
}

export function createAnimatedWebpFixture(): Buffer {
  // Minimal RIFF/WEBP header with VP8X animation flag bit set so static validator rejects it.
  const payload = Buffer.alloc(30);
  payload.write('RIFF', 0, 'ascii');
  payload.writeUInt32LE(22, 4);
  payload.write('WEBP', 8, 'ascii');
  payload.write('VP8X', 12, 'ascii');
  payload.writeUInt32LE(10, 16);
  payload[20] = 0x02; // animation flag
  return payload;
}

export type Phase3AuthTokens = {
  accountId: string;
  token: string;
  tokenHash: string;
  csrfToken: string;
};

export type Phase3StaffMap = {
  admin: string;
  seasonManagerA: string;
  seasonManagerB: string;
  registrationOfficerA: string;
  registrationOfficerB: string;
  registrationOfficerSeason2: string;
  playerMasterGrantee: string;
  clubMasterGrantee: string;
  stadiumMasterGrantee: string;
  unprivilegedUser: string;
};

export function setupPhase3HttpFixture(initialIsoInstant = '2026-08-10T10:00:00.000Z') {
  const databaseUrl = assertIsolatedTarget(process.env.TEST_DATABASE_URL ?? '');
  assertDistinctIsolatedTargets({
    integration: databaseUrl,
    browser: process.env.E2E_TEST_DATABASE_URL,
    restore: process.env.RESTORE_TEST_DATABASE_URL,
  });
  const clock = new TestClock(new Date(initialIsoInstant));
  const database = new DatabaseService(databaseUrl, clock);
  const security = new SecurityPrimitivesService();
  const origin = 'https://whistle.test';
  let app: INestApplication;
  let previousOrigin: string | undefined;
  let mediaRoot: string;
  let storage: LocalMediaStore;
  let seasons: readonly { id: string; code: string; name: string }[] = [];
  let staff!: Phase3StaffMap;

  beforeAll(async () => {
    previousOrigin = process.env.AUTH_ORIGIN;
    process.env.AUTH_ORIGIN = origin;
    mediaRoot = assertIsolatedMediaRoot(await mkdtemp(join(tmpdir(), 'whistle-phase3-media-')));
    storage = new LocalMediaStore(mediaRoot, 'local');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue(database)
      .overrideProvider(LocalMediaStore)
      .useValue(storage)
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new SafeValidationPipe());
    app.useGlobalFilters(new SafeErrorFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
  });

  beforeEach(async () => {
    clock.set(new Date(initialIsoInstant));
    await resetPhase1Fixtures(databaseUrl, 'RESET_ISOLATED_TEST_DATABASE');
    for (const file of await readdir(mediaRoot)) await unlink(join(mediaRoot, file));
    const base = await createPhase1Fixtures(databaseUrl);
    seasons = base.seasons;
    const passwordHash = await security.hashPassword('Synthetic phase3 credential 🦉 only');
    const now = await database.now();

    const makeAccount = async (code: string, name: string, username: string) => {
      const created = await database.client.account.create({
        data: {
          id: randomUUID(),
          personnelCode: code,
          fullName: name,
          username,
          passwordHash,
          mustChangePassword: false,
          temporaryPasswordExpiresAt: null,
        },
        select: { id: true },
      });
      return created.id;
    };

    const seasonManagerB = await makeAccount('P3_SM_B', 'Quản lý mùa giải B', 'p3.manager.b');
    const registrationOfficerA = await makeAccount(
      'P3_RO_A',
      'Cán bộ đăng ký A',
      'p3.regofficer.a',
    );
    const registrationOfficerB = await makeAccount(
      'P3_RO_B',
      'Cán bộ đăng ký B',
      'p3.regofficer.b',
    );
    const registrationOfficerSeason2 = await makeAccount(
      'P3_RO_S2',
      'Cán bộ đăng ký mùa 2',
      'p3.regofficer.s2',
    );
    const playerMasterGrantee = await makeAccount(
      'P3_PM_01',
      'Cán bộ hồ sơ cầu thủ',
      'p3.player.master',
    );
    const unprivilegedUser = await makeAccount(
      'P3_NO_01',
      'Tài khoản không có quyền',
      'p3.unprivileged',
    );

    const admin = base.accounts[0].id;
    const seasonManagerA = base.accounts[2].id;
    const stadiumMasterGrantee = base.accounts[3].id;

    await database.client.account.updateMany({
      where: { id: { in: base.accounts.map((a) => a.id) } },
      data: { mustChangePassword: false, temporaryPasswordExpiresAt: null },
    });

    await database.client.seasonRoleAssignment.createMany({
      data: [
        {
          accountId: seasonManagerB,
          seasonId: seasons[0].id,
          roleCode: 'SEASON_MANAGER',
          grantedBy: admin,
          grantedAt: now,
        },
        {
          accountId: registrationOfficerA,
          seasonId: seasons[0].id,
          roleCode: 'REGISTRATION_OFFICER',
          grantedBy: admin,
          grantedAt: now,
        },
        {
          accountId: registrationOfficerB,
          seasonId: seasons[0].id,
          roleCode: 'REGISTRATION_OFFICER',
          grantedBy: admin,
          grantedAt: now,
        },
        {
          accountId: playerMasterGrantee,
          seasonId: seasons[0].id,
          roleCode: 'REGISTRATION_OFFICER',
          grantedBy: admin,
          grantedAt: now,
        },
        {
          accountId: registrationOfficerSeason2,
          seasonId: seasons[1].id,
          roleCode: 'REGISTRATION_OFFICER',
          grantedBy: admin,
          grantedAt: now,
        },
      ],
    });

    await database.client.sharedMasterGrant.createMany({
      data: [
        {
          accountId: playerMasterGrantee,
          masterKind: 'PLAYER_MASTER',
          grantedBy: admin,
          grantedAt: now,
        },
        {
          accountId: seasonManagerA,
          masterKind: 'CLUB_MASTER',
          grantedBy: admin,
          grantedAt: now,
        },
        {
          accountId: stadiumMasterGrantee,
          masterKind: 'STADIUM_MASTER',
          grantedBy: admin,
          grantedAt: now,
        },
      ],
    });

    staff = {
      admin,
      seasonManagerA,
      seasonManagerB,
      registrationOfficerA,
      registrationOfficerB,
      registrationOfficerSeason2,
      playerMasterGrantee,
      clubMasterGrantee: seasonManagerA,
      stadiumMasterGrantee,
      unprivilegedUser,
    };
  });

  afterAll(async () => {
    await app?.close();
    await database.close();
    if (mediaRoot) {
      for (const file of await readdir(mediaRoot)) await unlink(join(mediaRoot, file));
      await rmdir(mediaRoot);
    }
    if (previousOrigin === undefined) delete process.env.AUTH_ORIGIN;
    else process.env.AUTH_ORIGIN = previousOrigin;
  });

  async function authenticate(accountId: string): Promise<Phase3AuthTokens> {
    const account = await database.client.account.findUniqueOrThrow({ where: { id: accountId } });
    const tokens = security.createSessionTokens();
    const now = await database.now();
    await database.client.session.create({
      data: {
        accountId,
        tokenHash: tokens.tokenHash,
        csrfToken: tokens.csrfToken,
        accountAuthRevision: account.authRevision,
        createdAt: now,
        lastActivityAt: now,
        absoluteExpiresAt: security.sessionExpiry(now),
      },
    });
    return { accountId, ...tokens };
  }

  /** Seeds a declared test-only EFFECTIVE regulation version and windows for isolated tests. */
  async function seedEffectiveRegulation(
    seasonId: string,
    options: {
      clubWindow?: { opensAt: string; closesAt: string };
      playerWindow?: { opensAt: string; closesAt: string };
      activeFrom?: string;
      u21Cutoff?: string;
      squadLimit?: number;
      nonHomegrownLimit?: number;
    } = {},
  ) {
    const now = await database.now();
    const activeFrom = new Date(options.activeFrom ?? '2026-08-01T00:00:00.000Z');
    const clubWindow = options.clubWindow ?? {
      opensAt: '2026-08-05T00:00:00.000Z',
      closesAt: '2026-08-20T00:00:00.000Z',
    };
    const playerWindow = options.playerWindow ?? {
      opensAt: '2026-08-05T00:00:00.000Z',
      closesAt: '2026-08-31T00:00:00.000Z',
    };
    let regCase = await database.client.regulationCase.findUnique({ where: { seasonId } });
    if (!regCase) {
      regCase = await database.client.regulationCase.create({ data: { seasonId } });
    }
    const latest = await database.client.regulationVersion.findFirst({
      where: { caseId: regCase.id },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const version = await database.client.regulationVersion.create({
      data: {
        id: randomUUID(),
        seasonId,
        caseId: regCase.id,
        versionNumber: (latest?.versionNumber ?? 0) + 1,
        preparedBy: staff.seasonManagerA,
        state: 'DRAFT',
        effectiveMode: 'IMMEDIATE',
        squadLimit: options.squadLimit ?? DECLARED_TEST_ONLY_REGULATION.squadLimit,
        nonHomegrownLimit:
          options.nonHomegrownLimit ?? DECLARED_TEST_ONLY_REGULATION.nonHomegrownLimit,
        homegrownSeasons: DECLARED_TEST_ONLY_REGULATION.homegrownSeasons,
        homegrownMonths: DECLARED_TEST_ONLY_REGULATION.homegrownMonths,
        homegrownAgeStart: DECLARED_TEST_ONLY_REGULATION.homegrownAgeStart,
        homegrownAgeEnd: DECLARED_TEST_ONLY_REGULATION.homegrownAgeEnd,
        u21Cutoff: new Date(
          `${options.u21Cutoff ?? DECLARED_TEST_ONLY_REGULATION.u21Cutoff}T00:00:00.000Z`,
        ),
        clubCount: DECLARED_TEST_ONLY_REGULATION.clubCount,
        formatCode: DECLARED_TEST_ONLY_REGULATION.formatCode,
        legs: DECLARED_TEST_ONLY_REGULATION.legs,
        plannedMinutes: DECLARED_TEST_ONLY_REGULATION.plannedMinutes,
        preparationMinutes: DECLARED_TEST_ONLY_REGULATION.preparationMinutes,
        releaseMinutes: DECLARED_TEST_ONLY_REGULATION.releaseMinutes,
        winPoints: DECLARED_TEST_ONLY_REGULATION.winPoints,
        drawPoints: DECLARED_TEST_ONLY_REGULATION.drawPoints,
        lossPoints: DECLARED_TEST_ONLY_REGULATION.lossPoints,
        qualificationCount: DECLARED_TEST_ONLY_REGULATION.qualificationCount,
        relegationCount: DECLARED_TEST_ONLY_REGULATION.relegationCount,
        createdAt: activeFrom,
      },
    });
    await database.client.rankingPriority.createMany({
      data: [
        { versionId: version.id, position: 1, criterionCode: 'POINTS' },
        { versionId: version.id, position: 2, criterionCode: 'GOAL_DIFFERENCE' },
        { versionId: version.id, position: 3, criterionCode: 'GOALS_FOR' },
      ],
    });
    await database.client.goalType.createMany({
      data: [
        {
          regulationVersionId: version.id,
          code: 'A',
          name: 'Bàn thường',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: version.id,
          code: 'B',
          name: 'Phạt đền',
          isOwnGoal: false,
          enabled: true,
        },
        {
          regulationVersionId: version.id,
          code: 'C',
          name: 'Phản lưới',
          isOwnGoal: true,
          enabled: true,
        },
        {
          regulationVersionId: version.id,
          code: 'D',
          name: 'Đá phạt trực tiếp',
          isOwnGoal: false,
          enabled: true,
        },
      ],
    });
    await database.client.cardType.createMany({
      data: [
        {
          regulationVersionId: version.id,
          code: 'Y',
          name: 'Thẻ vàng',
          meaning: 'YELLOW',
          enabled: true,
        },
        {
          regulationVersionId: version.id,
          code: 'R',
          name: 'Thẻ đỏ',
          meaning: 'RED',
          enabled: true,
        },
      ],
    });
    await database.client.registrationWindow.createMany({
      data: [
        {
          regulationVersionId: version.id,
          intakeKind: 'CLUB_APPLICATION',
          opensAt: new Date(clubWindow.opensAt),
          closesAt: new Date(clubWindow.closesAt),
        },
        {
          regulationVersionId: version.id,
          intakeKind: 'PLAYER_CHANGE',
          opensAt: new Date(playerWindow.opensAt),
          closesAt: new Date(playerWindow.closesAt),
        },
      ],
    });
    await database.client.regulationVersion.update({
      where: { id: version.id },
      data: {
        state: 'EFFECTIVE',
        submittedAt: activeFrom,
        approvedAt: activeFrom,
        decidedAt: activeFrom,
        decidedBy: staff.seasonManagerB,
        decisionReason: 'Quy định kiểm thử cô lập PHASE 3.',
        activeFrom,
        activationProcessedAt: activeFrom,
      },
    });
    await database.client.season.update({
      where: { id: seasonId },
      data: { currentRegulationVersionId: version.id, updatedAt: now },
    });
    return {
      evidenceKind: 'ISOLATED_TEST_FIXTURE' as Phase3EvidenceMarker,
      versionId: version.id,
      caseId: regCase.id,
    };
  }

  async function seedClubAndStadium(suffix = '01') {
    const club = await database.client.club.create({
      data: {
        id: randomUUID(),
        code: `CLB_${suffix}`,
        name: `Câu lạc bộ Kiểm thử ${suffix}`,
        abbreviation: `C${suffix}`,
      },
    });
    const stadium = await database.client.stadium.create({
      data: {
        id: randomUUID(),
        code: `STD_${suffix}`,
        name: `Sân vận động Kiểm thử ${suffix}`,
        location: 'London',
      },
    });
    return { club, stadium };
  }

  async function seedPlayer(
    code: string,
    fullName = 'Cầu thủ Kiểm thử',
    birthDate = '2002-05-10',
    nationalityCode = 'ENG',
    positionCode = 'CM',
  ) {
    return database.client.player.create({
      data: {
        id: randomUUID(),
        code,
        fullName,
        birthDate: new Date(`${birthDate}T00:00:00.000Z`),
        nationalityCode,
        positionCode,
      },
    });
  }

  function apiRequest(
    tokens: Phase3AuthTokens,
    method: 'get' | 'post' | 'patch',
    path: string,
    body?: object,
    idempotencyKey?: string,
  ) {
    const client = request(app.getHttpServer());
    const req = client[method](`/api/v1${path}`).set('Cookie', `${SESSION_COOKIE}=${tokens.token}`);
    if (method !== 'get') {
      req.set('Origin', origin).set('X-CSRF-Token', tokens.csrfToken);
    }
    if (idempotencyKey) {
      req.set('Idempotency-Key', idempotencyKey);
    }
    return body ? req.send(body) : req;
  }

  return {
    database,
    clock,
    origin,
    authenticate,
    seedEffectiveRegulation,
    seedClubAndStadium,
    seedPlayer,
    apiRequest,
    get app() {
      return app;
    },
    get storage() {
      return storage;
    },
    get mediaRoot() {
      return mediaRoot;
    },
    get seasons() {
      return seasons;
    },
    get staff() {
      return staff;
    },
  };
}
