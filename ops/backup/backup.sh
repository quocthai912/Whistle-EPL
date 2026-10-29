#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "$0")/common.sh"
[[ $# -le 1 ]] || exit 1
ops_lock
OPS_ID=$(cat /proc/sys/kernel/random/uuid)
OPS_SET="$(date -u +%Y%m%dT%H%M%SZ)-$OPS_ID"
OPS_PENDING="$OPS_BACKUP_DIR/.incomplete-$OPS_SET"
OPS_DONE=0
trap 'if [[ $OPS_DONE != 1 ]]; then ops_feedback "BACKUP_FAILED $OPS_SET maintenance remains closed; inspect and verify before release"; fi' EXIT
ops_maintenance close backup "${1:-scheduled foundation backup}" "$OPS_ID"
ops_verify_database
mkdir -m 700 "$OPS_PENDING"
ops_inventory > "$OPS_PENDING/inventory.json"
pg_dump -Fc --no-owner --no-privileges --file="$OPS_PENDING/database.dump"
pg_restore --list "$OPS_PENDING/database.dump" >/dev/null
python3 "$OPS_SCRIPT_DIR/set-format.py" create "$OPS_APP_DIR" "$OPS_PENDING" "$OPS_SET"
python3 "$OPS_SCRIPT_DIR/set-format.py" verify "$OPS_APP_DIR" "$OPS_PENDING"
# Flush files and directory entries before atomic complete-set publication.
sync -f "$OPS_PENDING"
if [[ $OPS_PROFILE = internet ]]; then
  : "${OPS_OFFHOST_DIR:?Supply an operator-mounted off-host destination}"
  mountpoint -q "$OPS_OFFHOST_DIR" || { echo 'Off-host destination must be a mounted separate filesystem.' >&2; exit 1; }
  cp -a -- "$OPS_PENDING" "$OPS_OFFHOST_DIR/.incomplete-$OPS_SET"
  python3 "$OPS_SCRIPT_DIR/set-format.py" verify "$OPS_APP_DIR" "$OPS_OFFHOST_DIR/.incomplete-$OPS_SET"
  mv -- "$OPS_OFFHOST_DIR/.incomplete-$OPS_SET" "$OPS_OFFHOST_DIR/$OPS_SET"
  sync -f "$OPS_OFFHOST_DIR"
fi
mv -- "$OPS_PENDING" "$OPS_BACKUP_DIR/$OPS_SET"
sync -f "$OPS_BACKUP_DIR"
ops_maintenance verify backup 'verify completed backup' "$OPS_ID"
ops_maintenance release backup 'release completed backup' "$OPS_ID"
# Only verified complete sets participate in retention. Failures never replace a good set.
python3 "$OPS_SCRIPT_DIR/set-format.py" retain "$OPS_APP_DIR" "$OPS_BACKUP_DIR"
ops_feedback "BACKUP_SUCCESS $OPS_SET"
OPS_DONE=1
printf '%s\n' "$OPS_SET"
