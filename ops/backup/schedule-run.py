"""Durable daily due-run/retry evidence; systemd owns the 15-minute delays."""
import json
import os
from pathlib import Path
import subprocess
import sys
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo


def save(path, state):
    temporary = path.with_suffix('.tmp')
    with temporary.open('w') as stream:
        json.dump(state, stream, sort_keys=True)
        stream.flush()
        os.fsync(stream.fileno())
    temporary.replace(path)
    if os.name != 'nt':
        descriptor = os.open(path.parent, os.O_RDONLY)
        try: os.fsync(descriptor)
        finally: os.close(descriptor)


def run_due(mode, root, scripts, now, clock=time.time, execute=subprocess.run, wait=time.sleep):
    state_path = root / 'schedule.json'
    due = now.replace(hour=3, minute=0, second=0, microsecond=0)
    if due > now: due -= timedelta(days=1)
    identifier = due.isoformat()
    state = json.loads(state_path.read_text()) if state_path.exists() else None
    if mode == 'resume':
        if not state: return 0
        if state['due'] != identifier: mode = 'daily'
        else:
            if not state['success'] and state['attempts'] < 4:
                wait(max(0, min(900, state['nextRetry'] - clock())))
            mode = 'retry'
    if mode == 'daily':
        if state and state['due'] != identifier:
            skipped = max(0, (due.date() - datetime.fromisoformat(state['due']).date()).days - 1)
            if skipped:
                with (root / 'missed-runs.log').open('a') as stream:
                    stream.write(json.dumps({'previousDue':state['due'], 'resumedDue':identifier, 'missedDays':skipped}) + '\n')
                    stream.flush()
                    os.fsync(stream.fileno())
                print(f'Detected {skipped} missed daily backups during downtime.', file=sys.stderr)
            if not state['success']: print('Unresolved prior backup: ' + state['due'], file=sys.stderr)
        if not state or state['due'] != identifier:
            state = {'due':identifier, 'attempts':0, 'success':False, 'nextRetry':0}
    elif mode != 'retry':
        raise ValueError('Unknown schedule mode.')
    if not state or state['success']: return 0
    if state['attempts'] >= 4:
        print('Backup remains failed after three retries; operator action required.', file=sys.stderr)
        return 1
    if state['nextRetry'] > clock():
        print('Retry is not due yet.', file=sys.stderr)
        return 1
    state['attempts'] += 1
    state['nextRetry'] = clock() + 900
    save(state_path, state)
    marker_path = root / 'maintenance.json'
    if marker_path.exists():
        marker = json.loads(marker_path.read_text())
        if marker['kind'] != 'backup':
            print('Non-backup maintenance requires operator recovery.', file=sys.stderr)
            return 1
        for action in ['verify','release']:
            result = execute([str(scripts / 'maintenance.sh'),action,'backup','scheduled failed-backup reconciliation',marker['operationId']], stdout=subprocess.DEVNULL)
            if result.returncode: return 1
    result = execute([str(scripts / 'backup.sh'),'scheduled daily due run'], stdout=subprocess.DEVNULL)
    state['success'] = result.returncode == 0
    state['nextRetry'] = clock() + 900
    save(state_path, state)
    if not state['success']: print('Scheduled backup failed; inspect protected schedule.json and journal.', file=sys.stderr)
    return result.returncode


if __name__ == '__main__':
    try:
        sys.exit(run_due(sys.argv[1],Path(os.environ['OPS_STATE_DIR']),Path(os.environ['OPS_SCRIPT_DIR']),datetime.now(ZoneInfo('Asia/Ho_Chi_Minh'))))
    except Exception:
        print('Backup scheduler failed; operator inspection required.', file=sys.stderr)
        sys.exit(1)
