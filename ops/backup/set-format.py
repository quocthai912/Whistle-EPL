"""Strict v1 foundation and no-assets v2 available-phase-2 backup sets."""
import hashlib
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


LEGACY_MIGRATIONS = (
    '202610280001_identity_security',
    '202610280002_authority',
    '202610280003_delegation',
    '202610280004_audit_operations',
    '202610290001_delegation_history',
    '202610290002_login_failure_sequence',
    '202611050001_delegation_version_recipient',
)
PHASE2_MIGRATIONS = LEGACY_MIGRATIONS + (
    '202611150001_season_foundation_expansion',
    '202611150002_phase2_relational_schema',
    '202611150003_club_stadium_media_asset',
    '202611170001_regulation_ranking_and_logo_lifecycle',
)

FOUNDATION_TABLES = {
    '_prisma_migrations', 'account', 'session', 'prelogin_csrf_context',
    'login_throttle_key', 'login_failure', 'season', 'system_role_assignment',
    'season_role_assignment', 'shared_master_grant', 'create_season_grant',
    'delegation_case', 'delegation_version', 'delegation_version_editor',
    'delegation_grant', 'delegation_boundary', 'audit_record', 'command_receipt',
    'system_guard', 'maintenance_state',
}
PHASE2_TABLES = FOUNDATION_TABLES | {
    'regulation_case', 'regulation_version', 'regulation_version_editor',
    'registration_window', 'ranking_priority', 'goal_type', 'card_type',
    'regulation_change_request', 'regulation_change_version',
    'regulation_change_version_editor', 'season_lifecycle_request',
    'season_lifecycle_version', 'season_lifecycle_version_editor',
    'season_summary_case', 'season_summary_version',
    'season_summary_version_editor', 'club', 'stadium', 'media_asset',
}
PHASE2_REQUIRED_COLUMNS = {
    'club': {
        'id', 'code', 'name', 'abbreviation', 'discontinued_at',
        'current_logo_id', 'revision', 'created_at', 'updated_at',
    },
    'stadium': {
        'id', 'code', 'name', 'location', 'discontinued_at',
        'revision', 'created_at', 'updated_at',
    },
    'media_asset': {
        'id', 'club_id', 'provider', 'object_key', 'mime_type', 'byte_size',
        'width', 'height', 'checksum', 'stored_by', 'unreferenced_at',
        'content_deleted_at', 'created_at',
    },
}
PHASE2_REQUIRED_FOREIGN_KEYS = {
    'club_id_current_logo_id_fkey': {
        'name': 'club_id_current_logo_id_fkey',
        'sourceSchema': 'public',
        'sourceTable': 'club',
        'sourceColumns': ['id', 'current_logo_id'],
        'targetSchema': 'public',
        'targetTable': 'media_asset',
        'targetColumns': ['club_id', 'id'],
        'onDelete': 'a',  # PostgreSQL NO ACTION.
        'onUpdate': 'a',
        'validated': True,
    },
    'media_asset_club_id_fkey': {
        'name': 'media_asset_club_id_fkey',
        'sourceSchema': 'public',
        'sourceTable': 'media_asset',
        'sourceColumns': ['club_id'],
        'targetSchema': 'public',
        'targetTable': 'club',
        'targetColumns': ['id'],
        'onDelete': 'r',  # PostgreSQL RESTRICT.
        'onUpdate': 'a',
        'validated': True,
    },
    'media_asset_stored_by_fkey': {
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
}
PHASE2_REQUIRED_UNIQUE_INDEXES = {
    'club_code_key': ('club', 'code'),
    'club_id_current_logo_id_key': ('club', 'id,current_logo_id'),
    'stadium_code_key': ('stadium', 'code'),
    'media_asset_provider_object_key_key': ('media_asset', 'provider,object_key'),
    'media_asset_club_id_id_key': ('media_asset', 'club_id,id'),
}
PHASE2_REQUIRED_TRIGGERS = {
    'club_identity': {
        'name': 'club_identity',
        'tableSchema': 'public',
        'table': 'club',
        'functionSchema': 'public',
        'function': 'preserve_shared_master_identity',
        'typeBits': 27,
        'enabled': 'O',
        'internal': False,
        'hasCondition': False,
    },
    'stadium_identity': {
        'name': 'stadium_identity',
        'tableSchema': 'public',
        'table': 'stadium',
        'functionSchema': 'public',
        'function': 'preserve_shared_master_identity',
        'typeBits': 27,
        'enabled': 'O',
        'internal': False,
        'hasCondition': False,
    },
    'media_asset_metadata': {
        'name': 'media_asset_metadata',
        'tableSchema': 'public',
        'table': 'media_asset',
        'functionSchema': 'public',
        'function': 'preserve_media_asset_metadata',
        'typeBits': 27,
        'enabled': 'O',
        'internal': False,
        'hasCondition': False,
    },
    'club_current_logo_lifecycle': {
        'name': 'club_current_logo_lifecycle',
        'tableSchema': 'public',
        'table': 'club',
        'functionSchema': 'public',
        'function': 'guard_current_club_logo',
        'typeBits': 23,
        'enabled': 'O',
        'internal': False,
        'hasCondition': False,
    },
    'media_asset_current_logo_lifecycle': {
        'name': 'media_asset_current_logo_lifecycle',
        'tableSchema': 'public',
        'table': 'media_asset',
        'functionSchema': 'public',
        'function': 'guard_current_logo_lifecycle',
        'typeBits': 19,
        'enabled': 'O',
        'internal': False,
        'hasCondition': False,
    },
}
SHA256 = re.compile(r'^[0-9a-f]{64}$')
UUID = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
SET_NAME = re.compile(r'^\d{8}T\d{6}Z-[0-9a-f-]{36}$')
APPLICATION_REVISION = re.compile(r'^[A-Za-z0-9][A-Za-z0-9._+:/@-]{0,254}$')


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def migrations(app):
    return sorted((Path(app) / 'backend/prisma/migrations').glob('*/migration.sql'))


def migration_inventory(app):
    return [
        {
            'name': path.parent.name,
            'sha256': hashlib.sha256(path.read_bytes().replace(b'\r\n', b'\n')).hexdigest(),
        }
        for path in migrations(app)
    ]


def schema_profile(app):
    names = {path.parent.name for path in migrations(app)}
    if names == set(LEGACY_MIGRATIONS):
        return 'available-foundation'
    if names == set(PHASE2_MIGRATIONS):
        return 'available-phase-2'
    raise ValueError('Unsupported application/schema migration profile.')


def compatibility(app):
    app = Path(app)
    migration_hash = hashlib.sha256()
    for path in migrations(app):
        migration_hash.update(path.parent.name.encode())
        migration_hash.update(path.read_bytes().replace(b'\r\n', b'\n'))
    return {
        'applicationVersion': json.loads((app / 'package.json').read_text())['version'],
        'schemaSha256': migration_hash.hexdigest(),
        'postgresMajor': 17,
    }


def load_inventory(path):
    inventory = json.loads((Path(path) / 'inventory.json').read_text())
    if not isinstance(inventory, dict):
        raise ValueError('Invalid data inventory.')
    return inventory


def validate_snapshot_at(value):
    if not isinstance(value, str):
        raise ValueError('Snapshot instant is required.')
    try:
        snapshot = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as error:
        raise ValueError('Invalid snapshot instant.') from error
    if snapshot.tzinfo is None:
        raise ValueError('Snapshot instant must include a timezone.')


def validate_foundation_inventory(inventory):
    if set(inventory) != FOUNDATION_TABLES:
        raise ValueError('Foundation table inventory differs from the legacy schema.')
    for value in inventory.values():
        if not isinstance(value, dict) or set(value) != {'rows', 'contentSha256'}:
            raise ValueError('Invalid foundation table inventory.')
        if type(value.get('rows')) is not int or value['rows'] < 0:
            raise ValueError('Invalid foundation row count.')
        if not isinstance(value.get('contentSha256'), str) or not SHA256.fullmatch(value['contentSha256']):
            raise ValueError('Invalid foundation content checksum.')


def validate_phase2_inventory(inventory):
    if set(inventory) != PHASE2_TABLES:
        raise ValueError('Available-phase-2 table inventory differs from the schema.')
    for name, value in inventory.items():
        expected_keys = {'rows', 'contentSha256'}
        if name == 'club':
            expected_keys.add('currentLogoReferences')
        if not isinstance(value, dict) or set(value) != expected_keys:
            raise ValueError('Invalid available-phase-2 table inventory.')
        if type(value.get('rows')) is not int or value['rows'] < 0:
            raise ValueError('Invalid available-phase-2 row count.')
        if not isinstance(value.get('contentSha256'), str) or not SHA256.fullmatch(value['contentSha256']):
            raise ValueError('Invalid available-phase-2 content checksum.')
    if inventory['media_asset']['rows'] != 0:
        raise ValueError('Nonempty media storage requires its owning recovery implementation.')
    if type(inventory['club']['currentLogoReferences']) is not int or inventory['club']['currentLogoReferences'] != 0:
        raise ValueError('Current media references require their owning recovery implementation.')


def validate_set_layout(backup, scope):
    backup = Path(backup)
    expected = {'database.dump', 'inventory.json', 'manifest.json', 'manifest.sha256'}
    if scope == 'available-phase-2':
        expected.add('media')
    if backup.is_symlink() or {item.name for item in backup.iterdir()} != expected:
        raise ValueError('Incomplete set or unexpected content.')
    for item in backup.iterdir():
        if item.name == 'media' and scope == 'available-phase-2':
            if item.is_symlink() or not item.is_dir() or any(item.iterdir()):
                raise ValueError('Available-phase-2 media directory must be a real empty directory.')
        elif item.is_symlink() or not item.is_file():
            raise ValueError('Set must contain regular files only.')


def create(app, backup, identifier, operation_id=None, application_revision=None, snapshot_at=None):
    backup = Path(backup)
    scope = schema_profile(app)
    inventory = load_inventory(backup)
    common = {
        'setId': identifier,
        'createdAt': datetime.now(timezone.utc).isoformat(),
        **compatibility(app),
        'media': [],
        'scope': scope,
        'files': {
            name: digest(backup / name)
            for name in ['database.dump', 'inventory.json']
        },
    }
    if scope == 'available-foundation':
        validate_foundation_inventory(inventory)
        files = {item.name for item in backup.iterdir()}
        if files not in (
            {'database.dump', 'inventory.json'},
            {'database.dump', 'inventory.json', 'manifest.json', 'manifest.sha256'},
        ):
            raise ValueError('Invalid legacy foundation set layout.')
        manifest = {'formatVersion': 1, **common}
    else:
        if not isinstance(operation_id, str) or not UUID.fullmatch(operation_id):
            raise ValueError('Available-phase-2 operation identity is required.')
        if not isinstance(application_revision, str) or not APPLICATION_REVISION.fullmatch(application_revision):
            raise ValueError('Available-phase-2 application revision is required.')
        validate_snapshot_at(snapshot_at)
        validate_phase2_inventory(inventory)
        media_dir = backup / 'media'
        if media_dir.exists():
            if media_dir.is_symlink() or not media_dir.is_dir() or any(media_dir.iterdir()):
                raise ValueError('Available-phase-2 media directory must be empty.')
        else:
            media_dir.mkdir(mode=0o700)
        manifest = {
            'formatVersion': 2,
            **common,
            'operationId': operation_id,
            'applicationRevision': application_revision,
            'snapshotAt': snapshot_at,
            'migrationInventory': migration_inventory(app),
        }
    (backup / 'manifest.json').write_text(json.dumps(manifest, sort_keys=True) + '\n')
    (backup / 'manifest.sha256').write_text(digest(backup / 'manifest.json') + '\n')


def verify(app, backup, identifier=None):
    backup = Path(backup)
    scope = schema_profile(app)
    validate_set_layout(backup, scope)
    if digest(backup / 'manifest.json') != (backup / 'manifest.sha256').read_text().strip():
        raise ValueError('Manifest integrity failed.')
    manifest = json.loads((backup / 'manifest.json').read_text())
    common_keys = {
        'setId', 'createdAt', 'applicationVersion', 'schemaSha256',
        'postgresMajor', 'media', 'scope', 'files',
    }
    if scope == 'available-foundation':
        expected_keys = common_keys | {'formatVersion'}
        expected_version = 1
    else:
        expected_keys = common_keys | {
            'formatVersion', 'operationId', 'applicationRevision',
            'snapshotAt', 'migrationInventory',
        }
        expected_version = 2
    if not isinstance(manifest, dict) or set(manifest) != expected_keys:
        raise ValueError('Unsupported backup manifest fields.')
    if (
        manifest.get('formatVersion') != expected_version
        or manifest.get('media') != []
        or manifest.get('scope') != scope
    ):
        raise ValueError('Unsupported backup scope/format.')
    if not isinstance(manifest.get('setId'), str) or not manifest['setId']:
        raise ValueError('Missing set identity.')
    if scope == 'available-phase-2':
        if not isinstance(manifest.get('operationId'), str) or not UUID.fullmatch(manifest['operationId']):
            raise ValueError('Missing operation identity.')
        if not isinstance(manifest.get('applicationRevision'), str) or not APPLICATION_REVISION.fullmatch(manifest['applicationRevision']):
            raise ValueError('Missing application revision.')
        validate_snapshot_at(manifest.get('snapshotAt'))
        if manifest.get('migrationInventory') != migration_inventory(app):
            raise ValueError('Backup migration inventory differs from application.')
    if identifier is None and SET_NAME.fullmatch(backup.name):
        identifier = backup.name
    if identifier is not None and manifest['setId'] != identifier:
        raise ValueError('Selected set identity differs from manifest.')
    for key, value in compatibility(app).items():
        if manifest.get(key) != value:
            raise ValueError('Backup/application/schema compatibility failed.')
    if set(manifest.get('files', {})) != {'database.dump', 'inventory.json'}:
        raise ValueError('Invalid inventory.')
    for name, checksum in manifest['files'].items():
        if not isinstance(checksum, str) or not SHA256.fullmatch(checksum) or digest(backup / name) != checksum:
            raise ValueError('Backup file integrity failed.')
    inventory = load_inventory(backup)
    if scope == 'available-foundation':
        validate_foundation_inventory(inventory)
    else:
        validate_phase2_inventory(inventory)
    return manifest


def retain(app, directory):
    complete = []
    for path in Path(directory).iterdir():
        if not SET_NAME.fullmatch(path.name):
            continue
        try:
            verify(app, path)
            complete.append(path)
        except (ValueError, OSError, KeyError):
            continue
    for path in sorted(complete, key=lambda item: item.name, reverse=True)[7:]:
        shutil.rmtree(path)


def sql(query):
    return subprocess.check_output(
        ['psql', '-XAt', '-v', 'ON_ERROR_STOP=1', '-c', query], text=True,
    ).strip()


def expected_tables(scope):
    if scope == 'available-foundation':
        return FOUNDATION_TABLES
    if scope == 'available-phase-2':
        return PHASE2_TABLES
    raise ValueError('Unsupported schema profile.')


def read_table_names():
    tables = sql("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
    return set(tables.splitlines()) if tables else set()


def inventory(app):
    scope = schema_profile(app)
    tables = read_table_names()
    if tables != expected_tables(scope):
        raise ValueError('Database table inventory differs from the supported schema.')
    result = {}
    for name in sorted(tables):
        if not re.fullmatch(r'[a-z_]+', name):
            raise ValueError('Unexpected table.')
        excluded = {
            'account': ['auth_revision'],
            'session': ['revoked_at', 'revocation_reason'],
            'maintenance_state': ['closed', 'operation_id', 'changed_at'],
        }.get(name, [])
        projection = 'to_jsonb(t)' + ''.join(" - '" + column + "'" for column in excluded)
        content = sql(
            "SELECT coalesce(jsonb_agg(obj ORDER BY obj::text),'[]'::jsonb)::text "
            f'FROM (SELECT {projection} obj FROM "{name}" t) rows'
        )
        row_count = int(sql(f'SELECT count(*) FROM "{name}"'))
        result[name] = {
            'rows': row_count,
            'contentSha256': hashlib.sha256(content.encode()).hexdigest(),
        }
        if scope == 'available-phase-2' and name == 'club':
            logo_references = int(sql('SELECT count(*) FROM "club" WHERE "current_logo_id" IS NOT NULL'))
            result[name]['currentLogoReferences'] = logo_references
            if logo_references:
                raise ValueError('Current media references require their owning recovery implementation.')
        if scope == 'available-phase-2' and name == 'media_asset' and row_count:
            raise ValueError('Nonempty media storage requires its owning recovery implementation.')
    required = {'account', 'session', 'audit_record', 'command_receipt', '_prisma_migrations'}
    if not required <= result.keys():
        raise ValueError('Missing foundation schema.')
    if scope == 'available-phase-2':
        validate_phase2_inventory(result)
    return result


def validate_phase2_catalog(foreign_keys, unique_indexes, triggers):
    foreign_key_map = {}
    for foreign_key in foreign_keys:
        if not isinstance(foreign_key, dict) or not isinstance(foreign_key.get('name'), str):
            raise ValueError('Club/Stadium/media foreign-key inventory is invalid.')
        if foreign_key['name'] in foreign_key_map:
            raise ValueError('Club/Stadium/media foreign-key inventory is ambiguous.')
        foreign_key_map[foreign_key['name']] = foreign_key
    if foreign_key_map != PHASE2_REQUIRED_FOREIGN_KEYS:
        raise ValueError('Club/Stadium/media foreign keys are incompatible.')
    if any(
        unique_indexes.get(name) != expected
        for name, expected in PHASE2_REQUIRED_UNIQUE_INDEXES.items()
    ):
        raise ValueError('Club/Stadium/media unique indexes are incompatible.')
    trigger_map = {}
    for trigger in triggers:
        if not isinstance(trigger, dict) or not isinstance(trigger.get('name'), str):
            raise ValueError('Club/Stadium/media trigger inventory is invalid.')
        if trigger['name'] in trigger_map:
            raise ValueError('Club/Stadium/media trigger inventory is ambiguous.')
        trigger_map[trigger['name']] = trigger
    if trigger_map != PHASE2_REQUIRED_TRIGGERS:
        raise ValueError('Club/Stadium/media triggers are incompatible.')


def verify_schema(app, scope):
    if read_table_names() != expected_tables(scope):
        raise ValueError('Database table inventory differs from the supported schema.')
    if scope != 'available-phase-2':
        return
    columns = sql(
        "SELECT table_name || ':' || column_name FROM information_schema.columns "
        "WHERE table_schema='public' ORDER BY table_name,column_name"
    ).splitlines()
    actual_columns = set(columns)
    for table, required in PHASE2_REQUIRED_COLUMNS.items():
        if any(f'{table}:{column}' not in actual_columns for column in required):
            raise ValueError('Club/Stadium/media schema columns are incomplete.')
    foreign_key_lines = sql(
        "SELECT jsonb_build_object("
        "'name', constraint_info.conname::text, "
        "'sourceSchema', source_namespace.nspname::text, "
        "'sourceTable', source_table.relname::text, "
        "'sourceColumns', (SELECT jsonb_agg(source_attribute.attname::text ORDER BY source_keys.ord) "
        "FROM unnest(constraint_info.conkey) WITH ORDINALITY AS source_keys(attnum,ord) "
        "JOIN pg_attribute source_attribute ON source_attribute.attrelid=source_table.oid "
        "AND source_attribute.attnum=source_keys.attnum), "
        "'targetSchema', target_namespace.nspname::text, "
        "'targetTable', target_table.relname::text, "
        "'targetColumns', (SELECT jsonb_agg(target_attribute.attname::text ORDER BY target_keys.ord) "
        "FROM unnest(constraint_info.confkey) WITH ORDINALITY AS target_keys(attnum,ord) "
        "JOIN pg_attribute target_attribute ON target_attribute.attrelid=target_table.oid "
        "AND target_attribute.attnum=target_keys.attnum), "
        "'onDelete', constraint_info.confdeltype::text, "
        "'onUpdate', constraint_info.confupdtype::text, "
        "'validated', constraint_info.convalidated)::text "
        "FROM pg_constraint constraint_info "
        "JOIN pg_class source_table ON source_table.oid=constraint_info.conrelid "
        "JOIN pg_namespace source_namespace ON source_namespace.oid=source_table.relnamespace "
        "JOIN pg_class target_table ON target_table.oid=constraint_info.confrelid "
        "JOIN pg_namespace target_namespace ON target_namespace.oid=target_table.relnamespace "
        "WHERE constraint_info.contype='f' AND constraint_info.connamespace='public'::regnamespace "
        "AND constraint_info.conname IN ('club_id_current_logo_id_fkey', "
        "'media_asset_club_id_fkey', 'media_asset_stored_by_fkey') "
        "ORDER BY constraint_info.conname, constraint_info.conrelid"
    ).splitlines()
    foreign_keys = [json.loads(line) for line in foreign_key_lines]
    unique_index_lines = sql(
        "SELECT index_class.relname || ':' || table_class.relname || ':' || "
        "string_agg(attribute.attname, ',' ORDER BY keys.ord) "
        "FROM pg_index index_info "
        "JOIN pg_class index_class ON index_class.oid=index_info.indexrelid "
        "JOIN pg_class table_class ON table_class.oid=index_info.indrelid "
        "JOIN pg_namespace table_namespace ON table_namespace.oid=table_class.relnamespace "
        "CROSS JOIN LATERAL unnest(index_info.indkey) WITH ORDINALITY AS keys(attnum,ord) "
        "JOIN pg_attribute attribute ON attribute.attrelid=table_class.oid AND attribute.attnum=keys.attnum "
        "WHERE table_namespace.nspname='public' AND index_info.indisunique "
        "AND index_info.indisvalid AND index_info.indisready AND index_info.indpred IS NULL "
        "AND index_info.indexprs IS NULL "
        "AND keys.ord <= index_info.indnkeyatts "
        "GROUP BY index_class.relname, table_class.relname"
    ).splitlines()
    unique_indexes = {}
    for line in unique_index_lines:
        name, table, key_columns = line.split(':', 2)
        unique_indexes[name] = (table, key_columns)
    trigger_lines = sql(
        "SELECT jsonb_build_object("
        "'name', trigger_info.tgname::text, "
        "'tableSchema', table_namespace.nspname::text, "
        "'table', table_class.relname::text, "
        "'functionSchema', function_namespace.nspname::text, "
        "'function', function_info.proname::text, "
        "'typeBits', trigger_info.tgtype, "
        "'enabled', trigger_info.tgenabled::text, "
        "'internal', trigger_info.tgisinternal, "
        "'hasCondition', trigger_info.tgqual IS NOT NULL)::text "
        "FROM pg_trigger trigger_info "
        "JOIN pg_class table_class ON table_class.oid=trigger_info.tgrelid "
        "JOIN pg_namespace table_namespace ON table_namespace.oid=table_class.relnamespace "
        "JOIN pg_proc function_info ON function_info.oid=trigger_info.tgfoid "
        "JOIN pg_namespace function_namespace ON function_namespace.oid=function_info.pronamespace "
        "WHERE trigger_info.tgname IN ('club_identity', 'stadium_identity', 'media_asset_metadata', "
        "'club_current_logo_lifecycle', 'media_asset_current_logo_lifecycle') "
        "ORDER BY trigger_info.tgname, trigger_info.tgrelid"
    ).splitlines()
    triggers = [json.loads(line) for line in trigger_lines]
    validate_phase2_catalog(foreign_keys, unique_indexes, triggers)


def database(app):
    scope = schema_profile(app)
    expected = {}
    for path in migrations(app):
        normalized = path.read_bytes().replace(b'\r\n', b'\n')
        expected[path.parent.name] = {
            hashlib.sha256(normalized).hexdigest(),
            hashlib.sha256(normalized.replace(b'\n', b'\r\n')).hexdigest(),
        }
    actual = sql(
        "SELECT migration_name || ':' || checksum "
        "FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL "
        "ORDER BY migration_name"
    ).splitlines()
    installed = dict(row.split(':', 1) for row in actual)
    if installed.keys() != expected.keys() or any(
        checksum not in expected[name] for name, checksum in installed.items()
    ):
        raise ValueError('Migration inventory differs from installed application.')
    if sql("SELECT count(*) FROM pg_constraint WHERE connamespace='public'::regnamespace AND NOT convalidated") != '0':
        raise ValueError('Invalid constraints.')
    verify_schema(app, scope)
    # Detect dangling references even if an archive was produced with disabled triggers.
    query = """SELECT format('SELECT count(*) FROM %s c WHERE %s AND NOT EXISTS (SELECT 1 FROM %s p WHERE %s)',
      conrelid::regclass, string_agg(format('c.%I IS NOT NULL', ca.attname),' AND ' ORDER BY keys.ord),
      confrelid::regclass, string_agg(format('p.%I=c.%I',pa.attname,ca.attname),' AND ' ORDER BY keys.ord))
      FROM pg_constraint k CROSS JOIN LATERAL unnest(k.conkey,k.confkey) WITH ORDINALITY AS keys(cnum,pnum,ord)
      JOIN pg_attribute ca ON ca.attrelid=k.conrelid AND ca.attnum=keys.cnum
      JOIN pg_attribute pa ON pa.attrelid=k.confrelid AND pa.attnum=keys.pnum
      WHERE k.contype='f' AND k.connamespace='public'::regnamespace GROUP BY k.oid"""
    for check in sql(query).splitlines():
        if sql(check) != '0':
            raise ValueError('Relationship verification failed.')
    inventory(app)


if __name__ == '__main__':
    try:
        action, app, *arguments = sys.argv[1:]
        if action == 'profile':
            print(schema_profile(app))
        elif action == 'inventory':
            print(json.dumps(inventory(app), sort_keys=True))
        elif action == 'database':
            database(app)
        elif action == 'create':
            operation_id = arguments[2] if len(arguments) > 2 else None
            application_revision = arguments[3] if len(arguments) > 3 else None
            snapshot_at = arguments[4] if len(arguments) > 4 else None
            create(app, Path(arguments[0]), arguments[1], operation_id, application_revision, snapshot_at)
        elif action == 'verify':
            verify(app, Path(arguments[0]))
        elif action == 'restored':
            backup = Path(arguments[0])
            verify(app, backup)
            database(app)
            if inventory(app) != load_inventory(backup):
                raise ValueError('Restored contents differ from selected set.')
        elif action == 'retain':
            retain(app, Path(arguments[0]))
        else:
            raise ValueError('Unknown verification action.')
    except Exception:
        print('Backup set verification failed; inspect protected operator state.', file=sys.stderr)
        sys.exit(1)
