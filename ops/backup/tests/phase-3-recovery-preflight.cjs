const assert = require('node:assert/strict');
const { URL } = require('node:url');
const { readFile, realpath } = require('node:fs/promises');
const { isAbsolute, join, relative, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { execFileSync } = require('node:child_process');

async function preflight() {
  const target = new URL(process.env.DATABASE_URL);
  assert.equal(process.env.NODE_ENV, 'test');
  assert.equal(process.env.OPS_PROFILE, 'test');
  assert.equal(process.env.OPS_ISOLATED, 'yes');
  assert.ok(['postgres:', 'postgresql:'].includes(target.protocol));
  assert.match(target.pathname, /^\/whistle_test_portrait_[a-z0-9_]+$/);
  assert.equal(target.pathname, '/' + process.env.OPS_DB_NAME);
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(target.hostname));
  assert.ok(target.port && !target.search && !target.hash);
  assert.equal(process.env.MEDIA_ROOT, process.env.OPS_MEDIA_ROOT);
  const mediaRoot = await realpath(process.env.OPS_MEDIA_ROOT);
  assert.equal(mediaRoot, resolve(process.env.OPS_MEDIA_ROOT));
  const mediaRelative = relative(tmpdir(), mediaRoot);
  assert.ok(mediaRelative && !mediaRelative.startsWith('..') && !isAbsolute(mediaRelative));
  execFileSync(
    process.execPath,
    [join(process.env.OPS_APP_DIR, 'ops/backup/verify-target.cjs'), 'isolated'],
    { stdio: 'ignore' },
  );
  const fixture = JSON.parse(await readFile(process.env.PHASE3_RECOVERY_FIXTURE, 'utf8'));
  assert.match(
    fixture.assetId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  assert.equal(fixture.objectKey, fixture.assetId + '.webp');
  return fixture;
}

module.exports = preflight;
if (require.main === module) {
  preflight().catch(() => {
    console.error(
      'T025 requires a matching isolated test target and canonical temporary media root.',
    );
    process.exitCode = 1;
  });
}
