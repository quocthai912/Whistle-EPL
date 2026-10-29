#!/usr/bin/env bash
set -Eeuo pipefail
source "$(dirname -- "$0")/common.sh"
[[ $# = 4 || $# = 5 ]] || { echo 'Usage: maintenance.sh status|close|verify|release backup|restore|manual reason operation-uuid [selected-set-path]' >&2; exit 1; }
ops_lock
ops_maintenance "$1" "$2" "$3" "$4" "${5:--}"
