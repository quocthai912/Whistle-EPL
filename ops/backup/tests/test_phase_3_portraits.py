"""Portrait recovery through the existing backup-set interface (T025)."""
from pathlib import Path
from contextlib import contextmanager
import json
import os
import re
import subprocess
import tempfile
import unittest

from test_set_format import module


@contextmanager
def recovery_fixture():
    """Valid preflight inputs with controlled verifier and application-load boundaries."""
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory).resolve()
        media = root / 'media'
        media.mkdir()
        sentinel = media / 'untouched.webp'
        sentinel.write_bytes(b'protected sentinel')
        app = root / 'app'
        verifier = app / 'ops/backup/verify-target.cjs'
        verifier.parent.mkdir(parents=True)
        verifier.write_text(
            "require('node:assert/strict').equal(process.argv[2], 'isolated');\n"
            "require('node:fs').appendFileSync(process.env.RECOVERY_VERIFIER_PROBE, 'verified\\n');\n"
        )
        backend = app / 'backend'
        (backend / 'dist').mkdir(parents=True)
        (backend / 'package.json').write_text('{}')
        # A safe standalone invocation succeeds at application load, before any HTTP/DB work.
        (backend / 'dist/main.js').write_text(
            "require('node:fs').writeFileSync(process.env.RECOVERY_APPLICATION_PROBE, 'loaded');\n"
            "process.exit(0);\n"
        )
        asset_id = '11111111-1111-4111-8111-111111111111'
        fixture = root / 'fixture.json'
        fixture.write_text(json.dumps({'assetId': asset_id, 'objectKey': asset_id + '.webp'}))
        yield {
            **os.environ, 'NODE_ENV': 'test', 'OPS_PROFILE': 'test', 'OPS_ISOLATED': 'yes',
            'OPS_APP_DIR': str(app), 'OPS_DB_NAME': 'whistle_test_portrait_guard',
            'DATABASE_URL': 'postgresql://synthetic:synthetic@127.0.0.1:1/whistle_test_portrait_guard',
            'OPS_MEDIA_ROOT': str(media), 'MEDIA_ROOT': str(media),
            'PHASE3_RECOVERY_FIXTURE': str(fixture),
            'RECOVERY_VERIFIER_PROBE': str(root / 'verifier-probe'),
            'RECOVERY_APPLICATION_PROBE': str(root / 'application-probe'),
        }, sentinel


class Phase3PortraitSets(unittest.TestCase):
    def test_shared_recovery_preflight_rejects_unsafe_environment_and_media(self):
        script = Path(__file__).with_name('phase-3-recovery-preflight.cjs')
        with recovery_fixture() as (environment, sentinel):
            baseline = subprocess.run(['node', str(script)], env=environment,
                                      capture_output=True, text=True, timeout=10)
            self.assertEqual(baseline.returncode, 0, baseline.stderr)
            verifier_probe = Path(environment['RECOVERY_VERIFIER_PROBE'])
            self.assertEqual(verifier_probe.read_text(), 'verified\n')
            self.assertFalse(Path(environment['RECOVERY_APPLICATION_PROBE']).exists())
            media = Path(environment['MEDIA_ROOT'])
            cases = [
                {'NODE_ENV': 'production'}, {'OPS_PROFILE': 'local'}, {'OPS_ISOLATED': 'no'},
                {'DATABASE_URL': 'postgresql://synthetic:synthetic@remote.invalid:1/whistle_test_portrait_guard'},
                {'DATABASE_URL': 'postgresql://synthetic:synthetic@127.0.0.1/whistle_test_portrait_guard'},
                {'OPS_DB_NAME': 'whistle_test_portrait_other'},
                {'MEDIA_ROOT': str(media / 'different')},
                {'OPS_MEDIA_ROOT': str(media.anchor), 'MEDIA_ROOT': str(media.anchor)},
            ]
            for override in cases:
                with self.subTest(override=override):
                    result = subprocess.run(['node', str(script)], env={**environment, **override},
                                            capture_output=True, text=True, timeout=10)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn('matching isolated test target', result.stderr)
                    self.assertNotIn('synthetic', result.stderr)
                    self.assertEqual(sentinel.read_bytes(), b'protected sentinel')
                    self.assertEqual(verifier_probe.read_text(), 'verified\n')

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
        with recovery_fixture() as (environment, sentinel):
            baseline = subprocess.run(['node', str(script)], env=environment,
                                      capture_output=True, text=True, timeout=10)
            self.assertEqual(baseline.returncode, 0, baseline.stderr)
            application_probe = Path(environment['RECOVERY_APPLICATION_PROBE'])
            self.assertEqual(application_probe.read_text(), 'loaded')
            application_probe.unlink()
            verifier_probe = Path(environment['RECOVERY_VERIFIER_PROBE'])
            self.assertEqual(verifier_probe.read_text(), 'verified\n')
            for node_env, profile, rejected in [('production', 'test', 'production'), ('test', 'local', 'local')]:
                with self.subTest(node_env=node_env, profile=profile):
                    result = subprocess.run(['node', str(script)],
                                            env={**environment, 'NODE_ENV': node_env, 'OPS_PROFILE': profile},
                                            capture_output=True, text=True, timeout=10)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(rejected, result.stderr)
                    self.assertEqual(sentinel.read_bytes(), b'protected sentinel')
                    self.assertFalse(application_probe.exists())
                    self.assertEqual(verifier_probe.read_text(), 'verified\n')


if __name__ == '__main__':
    unittest.main()
