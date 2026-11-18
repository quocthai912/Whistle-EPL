#!/usr/bin/env bash
# Destructive verification: only an empty, explicitly isolated test database/root.
set -Eeuo pipefail
umask 077
source "$(dirname -- "$0")/../common.sh"
[[ ${OPS_ISOLATED:-} = yes && $OPS_PROFILE = test && $OPS_DB_NAME =~ ^whistle_test_phase2_recovery_[a-z0-9]+$ && ${PGHOST:-} = 127.0.0.1 && ${NODE_ENV:-} = test ]] || {
  echo 'Explicit isolated phase-2 recovery target required.' >&2; exit 1;
}
node "$OPS_SCRIPT_DIR/verify-target.cjs" isolated
[[ ! -e $OPS_STATE_DIR/schedule.json && ! -L $OPS_STATE_DIR/schedule.json ]] || {
  echo 'Daily scheduler verification requires fresh schedule state.' >&2; exit 1;
}
if ! media_entries=$(find "$OPS_MEDIA_ROOT" -mindepth 1 -maxdepth 1 -print -quit); then
  echo 'Cannot inspect dedicated media root.' >&2; exit 1;
fi
if ! backup_entries=$(find "$OPS_BACKUP_DIR" -mindepth 1 -maxdepth 1 -print -quit); then
  echo 'Cannot inspect dedicated backup root.' >&2; exit 1;
fi
[[ -z $media_entries && -z $backup_entries ]] || {
  echo 'Recovery rehearsal requires empty dedicated media and backup roots.' >&2; exit 1;
}
probe=$(mktemp -d "$OPS_STATE_DIR/phase2-drill.XXXXXX")
trap 'rm -rf -- "$probe"' EXIT
export PHASE2_RECOVERY_FIXTURE="$probe/fixture.json"
asset=$(node "$OPS_APP_DIR/backend/scripts/prepare-phase2-recovery.cjs")
for iteration in {1..8}; do
  set_id=$(bash "$OPS_SCRIPT_DIR/backup.sh" 'isolated 20-logo phase-2 rehearsal' | tail -1)
done
[[ $(find "$OPS_BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l) = 7 ]]
bash "$OPS_SCRIPT_DIR/verify-set.sh" "$set_id"
[[ $(find "$OPS_BACKUP_DIR/$set_id/media" -type f | wc -l) = 20 ]]
psql -Xv ON_ERROR_STOP=1 -qc "UPDATE club SET name='Changed after backup' WHERE code='RECOVERY_01'"
unlink "$OPS_MEDIA_ROOT/$asset"
ln -s /dev/null "$OPS_MEDIA_ROOT/$asset"
if bash "$OPS_SCRIPT_DIR/restore.sh" "$set_id" "RESTORE:$OPS_DB_NAME:$set_id"; then
  echo 'Unsafe media destination was accepted.' >&2; exit 1;
fi
[[ -f $OPS_STATE_DIR/maintenance.json ]]
[[ $(psql -XAtqc "SELECT name FROM club WHERE code='RECOVERY_01'") = 'CLB phục hồi 1' ]]
echo 'Interrupted restore retained the maintenance barrier.'
unlink "$OPS_MEDIA_ROOT/$asset"
bash "$OPS_SCRIPT_DIR/restore.sh" "$set_id" "RESTORE:$OPS_DB_NAME:$set_id" --resume
while IFS= read -r file; do
  cmp -- "$file" "$OPS_MEDIA_ROOT/$(basename -- "$file")"
done < <(find "$OPS_BACKUP_DIR/$set_id/media" -type f)
[[ $(psql -XAtqc "SELECT count(*) FROM club WHERE current_logo_id IS NOT NULL AND discontinued_at IS NULL AND revision=3") = 20 ]]
[[ $(psql -XAtqc "SELECT name FROM club WHERE code='RECOVERY_01'") = 'CLB phục hồi 1' ]]
[[ $(psql -XAtqc 'SELECT count(*) FROM season') = 2 ]]
[[ $(psql -XAtqc 'SELECT count(*) FROM season_lifecycle_version') = 2 ]]
[[ $(psql -XAtqc "SELECT count(*) FROM audit_record WHERE action_code IN ('CLUB_CREATED','CLUB_DISCONTINUED','CLUB_RESUMED')") = 60 ]]
[[ $(psql -XAtqc 'SELECT count(*) FROM session WHERE revoked_at IS NULL') = 0 ]]
[[ $(psql -XAtqc 'SELECT closed FROM maintenance_state WHERE singleton_id=1') = f ]]
[[ ! -e $OPS_STATE_DIR/maintenance.json ]]
bash "$OPS_SCRIPT_DIR/verify-foundation.sh" "$set_id"
[[ ! -e $OPS_STATE_DIR/schedule.json && ! -L $OPS_STATE_DIR/schedule.json ]] || {
  echo 'Daily scheduler verification requires fresh schedule state.' >&2; exit 1;
}
OPS_SCRIPT_DIR="$OPS_SCRIPT_DIR" python3 "$OPS_SCRIPT_DIR/schedule-run.py" daily
python3 -c 'import json,os; from pathlib import Path; s=json.loads((Path(os.environ["OPS_STATE_DIR"])/"schedule.json").read_text()); assert s["success"] and s["attempts"] == 1'
node <<'NODE'
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createRequire } = require('node:module');
const backend = createRequire(process.env.OPS_APP_DIR + '/backend/package.json');
const { DatabaseService } = backend('./dist/platform/database.service');
const { createApplication } = backend('./dist/main');
const fixture = JSON.parse(readFileSync(process.env.PHASE2_RECOVERY_FIXTURE, 'utf8'));
(async () => {
  const db = new DatabaseService(process.env.DATABASE_URL);
  let app;
  try {
    for (const expected of fixture.assets) {
      const club = await db.client.club.findUniqueOrThrow({ where: { id: expected.clubId } });
      const asset = await db.client.mediaAsset.findUniqueOrThrow({ where: { id: expected.id } });
      assert.equal(club.currentLogoId, expected.id);
      assert.equal(club.discontinuedAt, null);
      assert.equal(club.revision, 3n);
      assert.equal(asset.clubId, expected.clubId);
      assert.equal(asset.objectKey, expected.objectKey);
      assert.equal(asset.checksum, expected.checksum);
    }
    for (const expected of fixture.lifecycles) {
      await db.client.season.findUniqueOrThrow({ where: { id: expected.seasonId } });
      const proposal = await db.client.seasonLifecycleRequest.findUniqueOrThrow({ where: { id: expected.requestId } });
      const version = await db.client.seasonLifecycleVersion.findUniqueOrThrow({ where: { id: expected.versionId } });
      assert.equal(proposal.seasonId, expected.seasonId);
      assert.equal(proposal.currentVersionId, expected.versionId);
      assert.equal(version.seasonId, expected.seasonId);
      assert.equal(version.caseId, expected.requestId);
    }
    process.env.AUTH_ORIGIN = 'https://whistle-recovery.test';
    app = await createApplication();
    await app.listen(0, '127.0.0.1');
    const origin = 'http://127.0.0.1:' + app.getHttpServer().address().port;
    const call = async (route, options) => {
      const response = await fetch(origin + route, { ...options, redirect: 'error' });
      assert.equal(response.status, 200);
      return { body: await response.json(), cookies: response.headers.getSetCookie().map((value) => value.split(';')[0]).join('; ') };
    };
    const csrf = await call('/api/v1/auth/csrf');
    const login = await call('/api/v1/auth/login', { method: 'POST', headers: {
      Cookie: csrf.cookies, Origin: process.env.AUTH_ORIGIN,
      'X-CSRF-Token': csrf.body.data.csrfToken, 'Content-Type': 'application/json',
    }, body: JSON.stringify({ username: fixture.login.username, password: fixture.login.password }) });
    assert.equal(login.body.data.changeRequired, false);
    const session = await call('/api/v1/auth/session', { headers: { Cookie: login.cookies } });
    assert.equal(session.body.data.id, fixture.login.accountId);
  } finally {
    try { if (app) await app.close(); }
    finally { await db.close(); }
  }
})().catch(() => { console.error('Restored identity or real fresh-login verification failed.'); process.exitCode = 1; });
NODE
echo '20-logo / two-season same-set restore, interruption, seven-set retention and fresh-login barrier PASS.'
