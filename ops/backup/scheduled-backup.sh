#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "$0")/common.sh"
[[ $# = 1 && $1 =~ ^(daily|retry|resume)$ ]] || exit 1
export OPS_STATE_DIR OPS_SCRIPT_DIR
exec 8>"$OPS_STATE_DIR/schedule.lock"
flock -n 8 || { echo 'Scheduled backup already running.' >&2; exit 1; }
python3 "$OPS_SCRIPT_DIR/schedule-run.py" "$1"
