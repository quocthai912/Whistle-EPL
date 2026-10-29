import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from datetime import datetime
from types import SimpleNamespace
from zoneinfo import ZoneInfo

spec = importlib.util.spec_from_file_location('schedule_run', Path(__file__).resolve().parents[1] / 'schedule-run.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ScheduleTest(unittest.TestCase):
    def test_boot_resumes_pending_retry_after_remaining_delay(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'schedule.json').write_text(json.dumps({'due':'2026-10-29T03:00:00+07:00','attempts':1,'success':False,'nextRetry':100900}))
            current = [100400]
            waits = []
            def wait(seconds):
                waits.append(seconds)
                current[0] += seconds
            result = module.run_due('resume',root,root,datetime.fromisoformat('2026-10-29T03:00:00+07:00'),lambda:current[0],lambda *args,**kwargs:SimpleNamespace(returncode=0),wait)
            self.assertEqual(waits,[500])
            self.assertEqual(result,0)
            self.assertEqual(json.loads((root / 'schedule.json').read_text())['attempts'],2)
    def test_failed_due_run_has_only_three_retries_across_restarts(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            now = datetime.fromisoformat('2026-10-29T03:00:00+07:00')
            executions = []
            def fail(arguments, **kwargs):
                executions.append(arguments)
                return SimpleNamespace(returncode=1)
            for index in range(6):
                module.run_due('daily' if index == 0 else 'retry', root, root, now, lambda: 100000 + index * 901, fail)
            self.assertEqual(len(executions), 4)
            self.assertEqual(json.loads((root / 'schedule.json').read_text())['attempts'], 4)

    def test_records_downtime_after_success_and_rejects_early_retry(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'schedule.json').write_text(json.dumps({'due':'2026-10-26T03:00:00+07:00', 'attempts':1, 'success':True, 'nextRetry':0}))
            now = datetime.fromisoformat('2026-10-29T03:00:00+07:00')
            execute = lambda *args, **kwargs: SimpleNamespace(returncode=1)
            self.assertEqual(module.run_due('daily', root, root, now, lambda:100000, execute), 1)
            self.assertEqual(json.loads((root / 'missed-runs.log').read_text())['missedDays'], 2)
            self.assertEqual(module.run_due('retry', root, root, now, lambda:100001, execute), 1)
            self.assertEqual(json.loads((root / 'schedule.json').read_text())['attempts'], 1)


if __name__ == '__main__': unittest.main()
