#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
export LC_ALL=C.UTF-8
OPS_SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
[[ ${OPS_CONFIG_FILE:-} = /* && -f $OPS_CONFIG_FILE && ! -L $OPS_CONFIG_FILE ]] || { echo 'Explicit protected OPS_CONFIG_FILE required.' >&2; exit 1; }
[[ $(stat -c %u "$OPS_CONFIG_FILE") = 0 && $(( 8#$(stat -c %a "$OPS_CONFIG_FILE") & 0022 )) = 0 ]] || { echo 'Configuration must be root-owned and not group/world writable.' >&2; exit 1; }
# Trusted operator configuration is shell syntax; never source a caller-uploaded file.
source "$OPS_CONFIG_FILE"
: "${OPS_PROFILE:?}" "${OPS_STATE_DIR:?}" "${OPS_BACKUP_DIR:?}" "${OPS_APP_DIR:?}" "${OPS_DB_NAME:?}" "${PGSERVICE:?}" "${PGPASSFILE:?}" "${DATABASE_URL:?}"
[[ $OPS_PROFILE =~ ^(development|test|local|internet)$ ]] || exit 1
for OPS_PATH in "$OPS_STATE_DIR" "$OPS_BACKUP_DIR" "$OPS_APP_DIR"; do [[ $OPS_PATH = /* && -d $OPS_PATH && ! -L $OPS_PATH ]] || exit 1; done
OPS_APP_REAL=$(realpath "$OPS_APP_DIR")
OPS_BACKUP_REAL=$(realpath "$OPS_BACKUP_DIR")
OPS_STATE_REAL=$(realpath "$OPS_STATE_DIR")
[[ $OPS_BACKUP_REAL != / && $OPS_STATE_REAL != / && $OPS_BACKUP_REAL != "$OPS_APP_REAL" && $OPS_STATE_REAL != "$OPS_APP_REAL" && $OPS_BACKUP_REAL != "$OPS_APP_REAL"/* && $OPS_STATE_REAL != "$OPS_APP_REAL"/* && $OPS_BACKUP_REAL != "$OPS_STATE_REAL" && $OPS_BACKUP_REAL != "$OPS_STATE_REAL"/* && $OPS_STATE_REAL != "$OPS_BACKUP_REAL"/* ]] || { echo 'Separate protected state/backups must be outside application/Git/public paths.' >&2; exit 1; }
[[ $OPS_DB_NAME =~ ^[a-z][a-z0-9_]*$ ]] || exit 1
export DATABASE_URL PGSERVICE PGPASSFILE OPS_APP_DIR OPS_DB_NAME OPS_PROFILE OPS_ISOLATED
export PGSERVICEFILE PGHOST PGPORT PGUSER
export MAINTENANCE_MARKER_PATH="$OPS_STATE_DIR/maintenance.json"
export PGDATABASE="$OPS_DB_NAME"
node "$OPS_SCRIPT_DIR/verify-target.cjs"
[[ $(psql -XAtqc 'SHOW server_version_num') =~ ^17[0-9]{4}$ ]] || { echo 'PostgreSQL 17 required.' >&2; exit 1; }
[[ $(pg_dump --version) =~ ' 17.' && $(pg_restore --version) =~ ' 17.' ]] || { echo 'PostgreSQL 17 client tools required.' >&2; exit 1; }
ops_lock() {
  exec 9>"$OPS_STATE_DIR/controller.lock"
  flock -n 9 || { echo 'Another operation owns maintenance/backup.' >&2; exit 1; }
}
ops_maintenance() {
  node "$OPS_APP_DIR/backend/dist/cli/maintenance.js" --action "$1" --kind "$2" --reason "$3" --operation-id "$4" --set-path "${5:--}"
}
ops_inventory() {
  python3 "$OPS_SCRIPT_DIR/set-format.py" inventory "$OPS_APP_DIR"
}
ops_verify_database() {
  python3 "$OPS_SCRIPT_DIR/set-format.py" database "$OPS_APP_DIR"
}
ops_feedback() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$1" >> "$OPS_STATE_DIR/operations.log"; }
