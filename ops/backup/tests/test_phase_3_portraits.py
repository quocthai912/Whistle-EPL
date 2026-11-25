"""Portrait recovery through the existing backup-set interface (T025)."""
from pathlib import Path
import os
import re
import subprocess
import tempfile
import unittest

from test_set_format import module


class Phase3PortraitSets(unittest.TestCase):
    def test_current_application_migrations_select_portrait_capable_profile(self):
        app = Path(__file__).resolve().parents[3]
        self.assertEqual(module.schema_profile(app), 'available-phase-3')

    def test_portrait_inventory_names_only_tables_created_by_the_owned_migrations(self):
        app = Path(__file__).resolve().parents[3]
        tables = {'_prisma_migrations'}
        for migration in (app / 'backend/prisma/migrations').glob('*/migration.sql'):
            tables.update(re.findall(r'CREATE TABLE\s+"?([a-z_]+)"?\s*\(', migration.read_text()))
        self.assertEqual(module.expected_tables('available-phase-3'), tables)

    def test_standalone_recovery_rejects_non_test_execution_before_loading_the_application(self):
        script = Path(__file__).with_name('phase-3-recovery.cjs')
        with tempfile.TemporaryDirectory() as directory:
            media = Path(directory) / 'untouched.webp'
            media.write_bytes(b'protected sentinel')
            for node_env, profile, rejected in [('production', 'test', 'production'), ('test', 'local', 'local')]:
                with self.subTest(node_env=node_env, profile=profile):
                    environment = {
                        **os.environ, 'NODE_ENV': node_env, 'OPS_PROFILE': profile,
                        'OPS_ISOLATED': 'yes', 'OPS_APP_DIR': str(Path(directory) / 'absent-application'),
                        'DATABASE_URL': 'postgresql://synthetic:synthetic@127.0.0.1:1/whistle_test_portrait_guard',
                    }
                    result = subprocess.run(['node', str(script)], env=environment, capture_output=True, text=True, timeout=10)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(rejected, result.stderr)
                    self.assertEqual(media.read_bytes(), b'protected sentinel')


if __name__ == '__main__':
    unittest.main()
