const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const { fetch } = globalThis;
const { readFile, unlink } = require('node:fs/promises');
const { join } = require('node:path');
const { createRequire } = require('node:module');
const preflight = require('./phase-3-recovery-preflight.cjs');

(async () => {
  const fixture = await preflight();
  const backend = createRequire(process.env.OPS_APP_DIR + '/backend/package.json');
  const { createApplication } = backend('./dist/main');
  process.env.AUTH_ORIGIN = 'https://whistle-recovery.test';
  const app = await createApplication();
  try {
    await app.listen(0, '127.0.0.1');
    const base = 'http://127.0.0.1:' + app.getHttpServer().address().port;
    const call = (route, options) =>
      fetch(base + '/api/v1' + route, { ...options, redirect: 'error' });
    assert.equal(
      (await call('/auth/session', { headers: { Cookie: fixture.oldCookie } })).status,
      401,
    );
    const csrf = await call('/auth/csrf');
    const csrfBody = await csrf.json();
    const cookies = (response) =>
      response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');
    const login = await call('/auth/login', {
      method: 'POST',
      headers: {
        Cookie: cookies(csrf),
        Origin: process.env.AUTH_ORIGIN,
        'X-CSRF-Token': csrfBody.data.csrfToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: fixture.login.username, password: fixture.login.password }),
    });
    assert.equal(login.status, 200, 'fresh login');
    const headers = { Cookie: cookies(login) };
    const session = await call('/auth/session', { headers });
    assert.equal((await session.json()).data.id, fixture.login.accountId);
    const player = await call('/players/' + fixture.playerId, { headers });
    assert.equal((await player.json()).data.portrait.id, fixture.assetId);
    const image = await call('/media/' + fixture.assetId, { headers });
    assert.equal(image.status, 200, 'restored portrait bytes');
    assert.equal(image.headers.get('cache-control'), 'no-store');
    const { createHash } = require('node:crypto');
    assert.equal(
      createHash('sha256')
        .update(Buffer.from(await image.arrayBuffer()))
        .digest('hex'),
      fixture.checksum,
    );
    assert.equal((await call('/media/' + fixture.assetId)).status, 404);
    const path = join(process.env.OPS_MEDIA_ROOT, fixture.objectKey);
    const bytes = await readFile(path);
    const { writeFile } = require('node:fs/promises');
    try {
      await unlink(path);
      assert.equal(
        (await call('/media/' + fixture.assetId, { headers })).status,
        503,
        'unavailable-byte fallback',
      );
    } finally {
      await writeFile(path, bytes, { mode: 0o600 });
    }
    console.log(
      'Fresh login, current portrait, no-store, anonymous denial and unavailable-byte fallback PASS.',
    );
  } finally {
    await app.close();
  }
})().catch((error) => {
  console.error('T025 restored portrait HTTP verification failed.');
  if (error.code === 'ERR_ASSERTION') console.error(error.message);
  process.exitCode = 1;
});
