import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / 'set-format.py'
spec = importlib.util.spec_from_file_location('set_format', MODULE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class SetFormatTest(unittest.TestCase):
    def test_complete_manifest_rejects_corruption_and_compatibility_drift(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = root / 'app'
            (app / 'backend/prisma/migrations/one').mkdir(parents=True)
            (app / 'backend/prisma/migrations/one/migration.sql').write_text('SELECT 1;')
            (app / 'package.json').write_text('{"version":"0.1.0"}')
            backup = root / 'backup'
            backup.mkdir()
            (backup / 'database.dump').write_bytes(b'isolated archive fixture')
            (backup / 'inventory.json').write_text('{"account":2,"audit_record":1}')
            module.create(app, backup, 'test-set')
            module.verify(app, backup)
            manifest = json.loads((backup / 'manifest.json').read_text())
            manifest['setId'] = 'other-set'
            (backup / 'manifest.json').write_text(json.dumps(manifest))
            (backup / 'manifest.sha256').write_text(module.digest(backup / 'manifest.json'))
            with self.assertRaises(ValueError):
                module.verify(app, backup, 'test-set')
            module.create(app, backup, 'test-set')
            (backup / 'database.dump').write_bytes(b'corrupt')
            with self.assertRaises(ValueError):
                module.verify(app, backup)
            (backup / 'database.dump').write_bytes(b'isolated archive fixture')
            (app / 'package.json').write_text('{"version":"0.2.0"}')
            with self.assertRaises(ValueError):
                module.verify(app, backup)

    def test_retention_preserves_seven_complete_sets_and_ignores_failed_sets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = root / 'app'
            (app / 'backend/prisma/migrations').mkdir(parents=True)
            (app / 'package.json').write_text('{"version":"0.1.0"}')
            sets = root / 'sets'
            sets.mkdir()
            for index in range(9):
                backup = sets / f'202610{index + 1:02d}T000000Z-00000000-0000-4000-8000-000000000000'
                backup.mkdir()
                (backup / 'database.dump').write_bytes(b'fixture')
                (backup / 'inventory.json').write_text('{}')
                module.create(app, backup, backup.name)
            (sets / '.incomplete-failed').mkdir()
            module.retain(app, sets)
            self.assertEqual(len([p for p in sets.iterdir() if not p.name.startswith('.')]), 7)
            self.assertTrue((sets / '.incomplete-failed').exists())


if __name__ == '__main__':
    unittest.main()
