#!/usr/bin/env bash
# Destructive verification: only an empty, explicitly isolated test database/root.
set -Eeuo pipefail
umask 077
source "$(dirname -- "$0")/../common.sh"
[[ ${OPS_ISOLATED:-} = yes && $OPS_PROFILE = test && $OPS_DB_NAME =~ ^whistle_test_phase2_recovery_[a-z0-9]+$ && ${PGHOST:-} = 127.0.0.1 && ${NODE_ENV:-} = test ]] || {
  echo 'Explicit isolated phase-2 recovery target required.' >&2; exit 1;
}
node "$OPS_SCRIPT_DIR/verify-target.cjs" isolated
[[ -z $(find "$OPS_MEDIA_ROOT" -mindepth 1 -maxdepth 1 -print -quit) && -z $(find "$OPS_BACKUP_DIR" -mindepth 1 -maxdepth 1 -print -quit) ]] || {
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
OPS_SCRIPT_DIR="$OPS_SCRIPT_DIR" python3 "$OPS_SCRIPT_DIR/schedule-run.py" daily
python3 -c 'import json,os; from pathlib import Path; s=json.loads((Path(os.environ["OPS_STATE_DIR"])/"schedule.json").read_text()); assert s["success"] and s["attempts"] == 1'
echo '20-logo / two-season same-set restore, interruption, seven-set retention and fresh-login barrier PASS.'
