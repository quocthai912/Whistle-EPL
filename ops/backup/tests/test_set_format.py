import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

MODULE = Path(__file__).resolve().parents[1] / 'set-format.py'
spec = importlib.util.spec_from_file_location('set_format', MODULE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

LEGACY_MIGRATIONS = [
    '202610280001_identity_security',
    '202610280002_authority',
    '202610280003_delegation',
    '202610280004_audit_operations',
    '202610290001_delegation_history',
    '202610290002_login_failure_sequence',
    '202611050001_delegation_version_recipient',
]
PHASE2_MIGRATIONS = LEGACY_MIGRATIONS + [
    '202611150001_season_foundation_expansion',
    '202611150002_phase2_relational_schema',
    '202611150003_club_stadium_media_asset',
    '202611170001_regulation_ranking_and_logo_lifecycle',
]
PHASE2_TABLES = {
    '_prisma_migrations', 'account', 'session', 'prelogin_csrf_context',
    'login_throttle_key', 'login_failure', 'season', 'system_role_assignment',
    'season_role_assignment', 'shared_master_grant', 'create_season_grant',
    'delegation_case', 'delegation_version', 'delegation_version_editor',
    'delegation_grant', 'delegation_boundary', 'audit_record', 'command_receipt',
    'system_guard', 'maintenance_state', 'regulation_case', 'regulation_version',
    'regulation_version_editor', 'registration_window', 'ranking_priority',
    'goal_type', 'card_type', 'regulation_change_request',
    'regulation_change_version', 'regulation_change_version_editor',
    'season_lifecycle_request', 'season_lifecycle_version',
    'season_lifecycle_version_editor', 'season_summary_case',
    'season_summary_version', 'season_summary_version_editor', 'club', 'stadium',
    'media_asset',
}


def make_app(root, migration_names):
    app = root / 'app'
    for name in migration_names:
        migration = app / 'backend/prisma/migrations' / name / 'migration.sql'
        migration.parent.mkdir(parents=True, exist_ok=True)
        migration.write_text(f'-- {name}\nSELECT 1;')
    (app / 'package.json').write_text('{"version":"0.1.0"}')
    return app


def make_backup(root, inventory):
    backup = root / 'backup'
    backup.mkdir()
    (backup / 'database.dump').write_bytes(b'isolated archive fixture')
    (backup / 'inventory.json').write_text(json.dumps(inventory, sort_keys=True))
    return backup


def inventory_table(rows):
    return {'rows': rows, 'contentSha256': '0' * 64}


def phase2_inventory():
    result = {name: inventory_table(0) for name in PHASE2_TABLES}
    result['account'] = inventory_table(2)
    result['club'] = {**inventory_table(3), 'currentLogoReferences': 0}
    result['stadium'] = inventory_table(2)
    return result


def legacy_inventory():
    phase2_only_tables = {
        'regulation_case', 'regulation_version', 'regulation_version_editor',
        'registration_window', 'ranking_priority', 'goal_type', 'card_type',
        'regulation_change_request', 'regulation_change_version',
        'regulation_change_version_editor', 'season_lifecycle_request',
        'season_lifecycle_version', 'season_lifecycle_version_editor',
        'season_summary_case', 'season_summary_version',
        'season_summary_version_editor', 'club', 'stadium', 'media_asset',
    }
    result = {name: inventory_table(0) for name in PHASE2_TABLES - phase2_only_tables}
    result['account'] = inventory_table(2)
    result['audit_record'] = inventory_table(1)
    return result


class SetFormatTest(unittest.TestCase):
    def test_expanded_no_asset_set_uses_v2_and_includes_populated_masters(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = make_app(root, PHASE2_MIGRATIONS)
            backup = make_backup(root, phase2_inventory())

            module.create(
                app,
                backup,
                '20261115T120000Z-00000000-0000-4000-8000-000000000001',
                '00000000-0000-4000-8000-000000000002',
                'test-image-sha256:abcdef0123456789',
                '2026-11-15T12:00:00Z',
            )

            manifest = module.verify(app, backup)
            self.assertEqual(manifest['formatVersion'], 2)
            self.assertEqual(manifest['scope'], 'available-phase-2')
            self.assertEqual(manifest['media'], [])
            self.assertEqual(manifest['operationId'], '00000000-0000-4000-8000-000000000002')
            self.assertEqual(manifest['applicationRevision'], 'test-image-sha256:abcdef0123456789')
            self.assertEqual(manifest['snapshotAt'], '2026-11-15T12:00:00Z')
            self.assertEqual(
                manifest['migrationInventory'],
                [
                    {'name': name, 'sha256': module.digest(app / 'backend/prisma/migrations' / name / 'migration.sql')}
                    for name in PHASE2_MIGRATIONS
                ],
            )
            self.assertTrue((backup / 'media').is_dir())
            self.assertEqual(list((backup / 'media').iterdir()), [])

    def test_nonempty_media_or_current_logo_reference_fails_closed(self):
        for field, value in [('media_asset', inventory_table(1)),
                             ('club', {**inventory_table(1), 'currentLogoReferences': 1})]:
            with self.subTest(field=field), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                app = make_app(root, PHASE2_MIGRATIONS)
                inventory = phase2_inventory()
                inventory[field] = value
                backup = make_backup(root, inventory)

                with self.assertRaises(ValueError):
                    module.create(
                        app,
                        backup,
                        '20261115T120000Z-00000000-0000-4000-8000-000000000001',
                        '00000000-0000-4000-8000-000000000002',
                        'test-image-sha256:abcdef0123456789',
                        '2026-11-15T12:00:00Z',
                    )

    def test_v2_rejects_unexpected_media_files_and_unknown_migration_profiles(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = make_app(root, PHASE2_MIGRATIONS)
            backup = make_backup(root, phase2_inventory())
            module.create(
                app,
                backup,
                '20261115T120000Z-00000000-0000-4000-8000-000000000001',
                '00000000-0000-4000-8000-000000000002',
                'test-image-sha256:abcdef0123456789',
                '2026-11-15T12:00:00Z',
            )
            (backup / 'media' / 'unexpected.webp').write_bytes(b'not a supported T003 asset')
            with self.assertRaises(ValueError):
                module.verify(app, backup)

            unknown_app = make_app(root / 'unknown', LEGACY_MIGRATIONS[:-1])
            with self.assertRaises(ValueError):
                module.verify(unknown_app, backup)

    def test_phase2_catalog_rejects_same_name_fk_drift_and_disabled_triggers(self):
        foreign_keys = [
            {
                'name': 'club_id_current_logo_id_fkey',
                'sourceSchema': 'public',
                'sourceTable': 'club',
                'sourceColumns': ['id', 'current_logo_id'],
                'targetSchema': 'public',
                'targetTable': 'media_asset',
                'targetColumns': ['club_id', 'id'],
                'onDelete': 'a',
                'onUpdate': 'a',
                'validated': True,
            },
            {
                'name': 'media_asset_club_id_fkey',
                'sourceSchema': 'public',
                'sourceTable': 'media_asset',
                'sourceColumns': ['club_id'],
                'targetSchema': 'public',
                'targetTable': 'club',
                'targetColumns': ['id'],
                'onDelete': 'r',
                'onUpdate': 'a',
                'validated': True,
            },
            {
                'name': 'media_asset_stored_by_fkey',
                'sourceSchema': 'public',
                'sourceTable': 'media_asset',
                'sourceColumns': ['stored_by'],
                'targetSchema': 'public',
                'targetTable': 'account',
                'targetColumns': ['id'],
                'onDelete': 'r',
                'onUpdate': 'a',
                'validated': True,
            },
        ]
        triggers = [
            {
                'name': 'club_identity', 'tableSchema': 'public', 'table': 'club',
                'functionSchema': 'public', 'function': 'preserve_shared_master_identity',
                'typeBits': 27, 'enabled': 'O', 'internal': False, 'hasCondition': False,
            },
            {
                'name': 'stadium_identity', 'tableSchema': 'public', 'table': 'stadium',
                'functionSchema': 'public', 'function': 'preserve_shared_master_identity',
                'typeBits': 27, 'enabled': 'O', 'internal': False, 'hasCondition': False,
            },
            {
                'name': 'media_asset_metadata', 'tableSchema': 'public', 'table': 'media_asset',
                'functionSchema': 'public', 'function': 'preserve_media_asset_metadata',
                'typeBits': 27, 'enabled': 'O', 'internal': False, 'hasCondition': False,
            },
        ]
        unique_indexes = module.PHASE2_REQUIRED_UNIQUE_INDEXES.copy()
        triggers.extend(dict(module.PHASE2_REQUIRED_TRIGGERS[name]) for name in (
            'club_current_logo_lifecycle', 'media_asset_current_logo_lifecycle',
        ))

        module.validate_phase2_catalog(foreign_keys, unique_indexes, triggers)

        wrong_owner = [dict(foreign_key) for foreign_key in foreign_keys]
        wrong_owner[0]['targetColumns'] = ['id', 'club_id']
        with self.assertRaises(ValueError):
            module.validate_phase2_catalog(wrong_owner, unique_indexes, triggers)

        disabled_trigger = [dict(trigger) for trigger in triggers]
        disabled_trigger[0]['enabled'] = 'D'
        with self.assertRaises(ValueError):
            module.validate_phase2_catalog(foreign_keys, unique_indexes, disabled_trigger)

        conditional_trigger = [dict(trigger) for trigger in triggers]
        conditional_trigger[0]['hasCondition'] = True
        with self.assertRaises(ValueError):
            module.validate_phase2_catalog(foreign_keys, unique_indexes, conditional_trigger)

        # Expression indexes are omitted by the catalog query, even when the
        # first key is the required code column.
        expression_index = dict(unique_indexes)
        del expression_index['club_code_key']
        with self.assertRaises(ValueError):
            module.validate_phase2_catalog(foreign_keys, expression_index, triggers)

    def test_v1_stays_legacy_only_and_rejects_expanded_schema_or_media_claims(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            legacy_app = make_app(root, LEGACY_MIGRATIONS)
            backup = make_backup(root, legacy_inventory())
            module.create(legacy_app, backup, 'legacy-set')
            manifest = module.verify(legacy_app, backup)
            self.assertEqual(manifest['formatVersion'], 1)
            self.assertEqual(manifest['scope'], 'available-foundation')
            self.assertEqual(manifest['media'], [])
            self.assertNotIn('media', {item.name for item in backup.iterdir()})

            expanded_app = make_app(root / 'expanded', PHASE2_MIGRATIONS)
            with self.assertRaises(ValueError):
                module.verify(expanded_app, backup)

            manifest['media'] = [{'id': 'untrusted-asset'}]
            (backup / 'manifest.json').write_text(json.dumps(manifest, sort_keys=True) + '\n')
            (backup / 'manifest.sha256').write_text(module.digest(backup / 'manifest.json') + '\n')
            with self.assertRaises(ValueError):
                module.verify(legacy_app, backup)

            manifest['media'] = []
            (backup / 'inventory.json').write_text(json.dumps(phase2_inventory(), sort_keys=True))
            manifest['files']['inventory.json'] = module.digest(backup / 'inventory.json')
            (backup / 'manifest.json').write_text(json.dumps(manifest, sort_keys=True) + '\n')
            (backup / 'manifest.sha256').write_text(module.digest(backup / 'manifest.json') + '\n')
            with self.assertRaises(ValueError):
                module.verify(legacy_app, backup)

    def test_complete_manifest_rejects_corruption_and_compatibility_drift(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            app = make_app(root, LEGACY_MIGRATIONS)
            backup = root / 'backup'
            backup.mkdir()
            (backup / 'database.dump').write_bytes(b'isolated archive fixture')
            (backup / 'inventory.json').write_text(json.dumps(legacy_inventory(), sort_keys=True))
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
            app = make_app(root, LEGACY_MIGRATIONS)
            sets = root / 'sets'
            sets.mkdir()
            for index in range(9):
                backup = sets / f'202610{index + 1:02d}T000000Z-00000000-0000-4000-8000-000000000000'
                backup.mkdir()
                (backup / 'database.dump').write_bytes(b'fixture')
                (backup / 'inventory.json').write_text(json.dumps(legacy_inventory(), sort_keys=True))
                module.create(app, backup, backup.name)
            (sets / '.incomplete-failed').mkdir()
            module.retain(app, sets)
            self.assertEqual(len([p for p in sets.iterdir() if not p.name.startswith('.')]), 7)
            self.assertTrue((sets / '.incomplete-failed').exists())


if __name__ == '__main__':
    unittest.main()
