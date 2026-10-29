#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "$0")/common.sh"
[[ $# = 1 && $1 =~ ^[0-9]{8}T[0-9]{6}Z-[0-9a-f-]{36}$ ]] || { echo 'Explicit complete set identifier required.' >&2; exit 1; }
python3 "$OPS_SCRIPT_DIR/set-format.py" verify "$OPS_APP_DIR" "$OPS_BACKUP_DIR/$1"
pg_restore --list "$OPS_BACKUP_DIR/$1/database.dump" >/dev/null
