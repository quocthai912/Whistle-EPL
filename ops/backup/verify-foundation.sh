#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "$0")/common.sh"
[[ $# = 1 && ${OPS_ISOLATED:-} = yes && $OPS_PROFILE = test && $OPS_DB_NAME =~ ^whistle_test_[a-z0-9_]+$ && ${PGHOST:-} =~ ^(127\.0\.0\.1|localhost|::1)$ && $1 =~ ^[0-9]{8}T[0-9]{6}Z-[0-9a-f-]{36}$ ]] || { echo 'Explicit isolated loopback test target and complete-set manifest required.' >&2; exit 1; }
node "$OPS_SCRIPT_DIR/verify-target.cjs" isolated
"$OPS_SCRIPT_DIR/verify-set.sh" "$1"
ops_verify_database
OPS_BASE=$(ops_inventory)
OPS_RESULT=$("$OPS_SCRIPT_DIR/backup.sh" 'isolated available-foundation verification' | tail -n 1)
"$OPS_SCRIPT_DIR/verify-set.sh" "$OPS_RESULT"
"$OPS_SCRIPT_DIR/restore.sh" "$OPS_RESULT" "RESTORE:$OPS_DB_NAME:$OPS_RESULT"
[[ $(ops_inventory) = "$OPS_BASE" ]] || { echo 'Restored available-data inventory differs.' >&2; exit 1; }
[[ $(psql -XAtqc 'SELECT count(*) FROM session WHERE revoked_at IS NULL') = 0 ]] || exit 1
# Check detection using an isolated copy, never corrupt the retained original.
OPS_PROBE=$(mktemp -d "$OPS_STATE_DIR/corrupt-probe.XXXXXX")
trap 'rm -rf -- "$OPS_PROBE"' EXIT
cp -- "$OPS_BACKUP_DIR/$OPS_RESULT/"* "$OPS_PROBE/"
printf 'corruption probe' >> "$OPS_PROBE/database.dump"
if python3 "$OPS_SCRIPT_DIR/set-format.py" verify "$OPS_APP_DIR" "$OPS_PROBE" 2>/dev/null; then echo 'Corruption was not detected.' >&2; exit 1; fi
printf 'Available-foundation persistence, same-set restore, session invalidation and corrupt-set refusal PASS.\n'
