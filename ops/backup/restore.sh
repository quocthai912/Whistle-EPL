#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "$0")/common.sh"
[[ $# = 2 && $1 =~ ^[0-9]{8}T[0-9]{6}Z-[0-9a-f-]{36}$ && $2 = "RESTORE:$OPS_DB_NAME:$1" ]] || { echo 'Usage: restore.sh set-id RESTORE:database:set-id' >&2; exit 1; }
ops_lock
OPS_SET="$OPS_BACKUP_DIR/$1"
python3 "$OPS_SCRIPT_DIR/set-format.py" verify "$OPS_APP_DIR" "$OPS_SET"
pg_restore --list "$OPS_SET/database.dump" >/dev/null
OPS_ID=$(cat /proc/sys/kernel/random/uuid)
OPS_DONE=0
trap 'if [[ $OPS_DONE != 1 ]]; then ops_feedback "RESTORE_FAILED maintenance remains closed; repair and verify explicitly"; fi' EXIT
ops_maintenance close restore "restore set $1" "$OPS_ID" "$OPS_SET"
# Atomic restore: --clean can encounter missing objects but --if-exists is deliberate.
pg_restore --dbname="$OPS_DB_NAME" --clean --if-exists --no-owner --no-privileges --single-transaction --exit-on-error "$OPS_SET/database.dump"
ops_inventory > "$OPS_STATE_DIR/restored-inventory.json"
cmp -- "$OPS_SET/inventory.json" "$OPS_STATE_DIR/restored-inventory.json"
ops_verify_database
# Persisted host closure is still present even when the restored DB predates maintenance.
psql -Xv ON_ERROR_STOP=1 -qc "BEGIN; SELECT key FROM system_guard WHERE key='maintenance-admission' FOR UPDATE; UPDATE session SET revoked_at=clock_timestamp(),revocation_reason='RESTORE' WHERE revoked_at IS NULL; UPDATE account SET auth_revision=auth_revision+1; COMMIT;" >/dev/null
ops_maintenance verify restore 'verify restored foundation' "$OPS_ID"
ops_maintenance release restore 'release verified restore' "$OPS_ID"
ops_feedback "RESTORE_SUCCESS $1"
OPS_DONE=1
