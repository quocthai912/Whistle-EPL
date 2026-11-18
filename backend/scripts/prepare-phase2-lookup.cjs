const { randomUUID } = require('node:crypto');
const { openSync, closeSync, writeFileSync, fsyncSync, unlinkSync } = require('node:fs');
const { isAbsolute } = require('node:path');
const { URL } = require('node:url');
const { DatabaseService } = require('../dist/platform/database.service');
const {
  SecurityPrimitivesService,
} = require('../dist/identity-access/security-primitives.service');

async function prepare() {
  const url = new URL(process.env.TEST_DATABASE_URL || '');
  const identity = (target) => ({
    host: ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname.toLowerCase())
      ? 'loopback'
      : target.hostname.toLowerCase(),
    port: Number(target.port || '5432'),
    database: decodeURIComponent(target.pathname.slice(1)),
  });
  const operational = process.env.DATABASE_URL && new URL(process.env.DATABASE_URL);
  const sameTarget =
    operational && JSON.stringify(identity(operational)) === JSON.stringify(identity(url));
  const destination = process.env.PHASE2_LOOKUP_FIXTURE;
  if (
    process.env.NODE_ENV !== 'test' ||
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.port ||
    !['localhost', '127.0.0.1'].includes(url.hostname) ||
    url.pathname !== '/whistle_test_phase2_lookup' ||
    url.search ||
    url.hash ||
    !destination ||
    !isAbsolute(destination) ||
    (operational &&
      (!['postgres:', 'postgresql:'].includes(operational.protocol) ||
        !operational.hostname ||
        !operational.port ||
        !operational.pathname.slice(1) ||
        operational.search ||
        operational.hash)) ||
    sameTarget
  )
    throw new Error('A dedicated lookup database and absolute protected output path are required.');
  const db = new DatabaseService(url.href);
  let reservation;
  let owned = false;
  let databaseCloseAttempted = false;
  let complete = false;
  try {
    reservation = openSync(destination, 'wx', 0o600);
    owned = true;
    if (
      (await db.client.account.count()) ||
      (await db.client.club.count()) ||
      (await db.client.season.count())
    )
      throw new Error('Prepare only an empty dedicated lookup database.');
    const password = 'Synthetic lookup ' + randomUUID();
    const passwordHash = await new SecurityPrimitivesService().hashPassword(password);
    const seasonId = randomUUID();
    const accounts = Array.from({ length: 20 }, (_, index) => ({
      id: randomUUID(),
      username: 'lookup.fixture.' + String(index + 1).padStart(2, '0'),
      personnelCode: 'LOOKUP_' + String(index + 1).padStart(2, '0'),
      fullName: 'Nhân viên đo tải ' + (index + 1),
      passwordHash,
      mustChangePassword: false,
    }));
    const clubs = Array.from({ length: 25 }, (_, index) => ({
      id: randomUUID(),
      code: 'LOOKUP_' + String(index + 1).padStart(2, '0'),
      name: index === 0 ? 'Câu lạc bộ Đà Nẵng fixture' : 'Câu lạc bộ kiểm thử ' + (index + 1),
      abbreviation: 'L' + (index + 1),
    }));
    await db.client.$transaction(async (tx) => {
      await tx.account.createMany({ data: accounts });
      await tx.season.create({
        data: {
          id: seasonId,
          code: 'EPL-TEST-2026',
          name: 'Mùa giải đo tải 2026',
          competitionName: 'Premier League Test Fixture',
          startDate: new Date('2026-08-01'),
          endDate: new Date('2027-05-31'),
        },
      });
      await tx.seasonRoleAssignment.createMany({
        data: accounts.map((account) => ({
          accountId: account.id,
          seasonId,
          roleCode: 'SEASON_MANAGER',
          grantedBy: accounts[0].id,
          grantedAt: new Date(),
        })),
      });
      await tx.club.createMany({ data: clubs });
    });
    writeFileSync(
      reservation,
      JSON.stringify({
        accounts: accounts.map(({ username }) => ({ username, password })),
        total: 25,
        expectedIds: clubs.map(({ id }) => id),
        targetId: clubs[0].id,
        search: 'Đà Nẵng',
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
      throw new Error('Database shutdown failed; the complete lookup manifest is retained.');
    }
    process.stdout.write(
      'Prepared 20 synthetic lookup users and 25 clubs in one isolated season.\n',
    );
  } finally {
    try {
      if (reservation !== undefined) {
        closeSync(reservation);
      }
    } finally {
      try {
        if (owned && !complete) unlinkSync(destination);
      } finally {
        if (!databaseCloseAttempted) await db.close();
      }
    }
  }
}
prepare().catch((error) => {
  process.stderr.write(
    'Lookup fixture preparation failed. ' +
      (error.message === 'Database shutdown failed; the complete lookup manifest is retained.'
        ? error.message + ' '
        : 'Incomplete output created by this run is removed; existing output is preserved. ') +
      'Check protected configuration and empty target. ' +
      'After a partial or post-commit failure, replace the disposable lookup database and use a new fixture output before retrying; ' +
      'follow the Phase 2 quickstart reset procedure. No database reset is performed automatically.\n',
  );
  process.exitCode = 1;
});
