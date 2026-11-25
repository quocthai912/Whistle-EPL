#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "$0")/../common.sh"
[[ $OPS_ISOLATED = yes && $OPS_DB_NAME =~ ^whistle_test_portrait_[a-z0-9_]+$ ]]
: "${PHASE3_RECOVERY_FIXTURE:?Explicit isolated portrait fixture required}"
asset=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["objectKey"])' "$PHASE3_RECOVERY_FIXTURE")
[[ $asset =~ ^[0-9a-f-]{36}\.webp$ ]]
bash "$OPS_SCRIPT_DIR/backup.sh" 'T025 isolated Player portrait backup'
set_id=$(find "$OPS_BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d ! -name '.*' -printf '%f\n' | sort | tail -1)
bash "$OPS_SCRIPT_DIR/verify-set.sh" "$set_id"
alternate_set=$(bash "$OPS_SCRIPT_DIR/backup.sh" 'T025 alternate complete set' | tail -1)
[[ $alternate_set != "$set_id" && $alternate_set =~ ^[0-9]{8}T[0-9]{6}Z-[0-9a-f-]{36}$ ]]
bash "$OPS_SCRIPT_DIR/verify-set.sh" "$alternate_set"
python3 - "$OPS_BACKUP_DIR/$set_id" "$OPS_APP_DIR" <<'PY'
import hashlib, importlib.util, json, shutil, sys, tempfile
from pathlib import Path
source, app = map(Path, sys.argv[1:])
spec = importlib.util.spec_from_file_location('sets', app / 'ops/backup/set-format.py')
sets = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sets)
for failure in ('incomplete', 'corrupt', 'wrong-profile'):
    with tempfile.TemporaryDirectory() as directory:
        target = Path(directory) / 'set'
        shutil.copytree(source, target)
        if failure == 'incomplete':
            (target / 'database.dump').unlink()
        elif failure == 'corrupt':
            next((target / 'media').iterdir()).write_bytes(b'corrupt portrait')
        else:
            manifest = json.loads((target / 'manifest.json').read_text())
            manifest['scope'] = 'available-phase-2'
            raw = json.dumps(manifest).encode()
            (target / 'manifest.json').write_bytes(raw)
            (target / 'manifest.sha256').write_text(hashlib.sha256(raw).hexdigest())
        try:
            sets.verify(app, target)
        except (ValueError, FileNotFoundError):
            print('Rejected ' + failure + ' portrait set')
        else:
            raise AssertionError('Accepted ' + failure + ' portrait set')
PY
psql -Xv ON_ERROR_STOP=1 -qc "UPDATE player SET full_name='Changed after backup' WHERE code='P_RESTORE'"
unlink "$OPS_MEDIA_ROOT/$asset"
ln -s /dev/null "$OPS_MEDIA_ROOT/$asset"
if bash "$OPS_SCRIPT_DIR/restore.sh" "$set_id" "RESTORE:$OPS_DB_NAME:$set_id"; then
  echo 'Unsafe media destination was accepted.' >&2; exit 1
fi
[[ -f $OPS_STATE_DIR/maintenance.json ]]
[[ $(psql -XAtqc "SELECT full_name FROM player WHERE code='P_RESTORE'") = 'Cầu thủ RESTORE' ]]
[[ $(psql -XAtqc 'SELECT closed FROM maintenance_state WHERE singleton_id=1') = t ]]
# Another complete, independently verified set must reach and fail the selected-set guard.
if bash "$OPS_SCRIPT_DIR/restore.sh" "$alternate_set" "RESTORE:$OPS_DB_NAME:$alternate_set" --resume; then exit 1; fi
[[ -f $OPS_STATE_DIR/maintenance.json ]]
python3 - "$OPS_STATE_DIR/maintenance.json" "$OPS_BACKUP_DIR/$set_id" <<'PY'
import json,sys
assert json.load(open(sys.argv[1]))['backupSetPath'] == sys.argv[2]
PY
[[ $(psql -XAtqc 'SELECT closed FROM maintenance_state WHERE singleton_id=1') = t ]]
[[ $(psql -XAtqc "SELECT full_name FROM player WHERE code='P_RESTORE'") = 'Cầu thủ RESTORE' ]]
unlink "$OPS_MEDIA_ROOT/$asset"
bash "$OPS_SCRIPT_DIR/restore.sh" "$set_id" "RESTORE:$OPS_DB_NAME:$set_id" --resume
cmp -- "$OPS_BACKUP_DIR/$set_id/media/$asset" "$OPS_MEDIA_ROOT/$asset"
[[ $(psql -XAtqc 'SELECT count(*) FROM session WHERE revoked_at IS NULL') = 0 ]]
[[ ! -e $OPS_STATE_DIR/maintenance.json ]]
node "$OPS_APP_DIR/ops/backup/tests/phase-3-recovery.cjs"
OPS_SCRIPT_DIR="$OPS_SCRIPT_DIR" python3 "$OPS_SCRIPT_DIR/schedule-run.py" daily
python3 -c 'import json,os; from pathlib import Path; s=json.loads((Path(os.environ["OPS_STATE_DIR"])/"schedule.json").read_text()); assert s["success"] and s["attempts"] == 1'
echo 'T025 same-set portrait restore, interrupted maintenance, fresh login and daily backup/cleanup PASS.'
