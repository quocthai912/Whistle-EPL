"""Strict v1 foundation and v2 available-phase-2 backup sets."""
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
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
LIFECYCLE_MIGRATION = '202611170002_lifecycle_readiness_basis'
PHASE3_MIGRATION = '202611200001_phase3_registry_registration'
PHASE3_MIGRATIONS = PHASE2_MIGRATIONS + (LIFECYCLE_MIGRATION, PHASE3_MIGRATION)
MEDIA_SCOPES = {'available-phase-2', 'available-phase-3'}

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
PHASE3_TABLES = PHASE2_TABLES | {
    'position', 'nationality', 'player', 'club_application',
    'club_application_version', 'club_application_version_editor',
    'proposed_player_item', 'player_registration', 'registration_version',
    'registration_version_editor', 'transfer_operation',
    'receipt_exception_case', 'receipt_exception_version',
    'receipt_exception_version_editor', 'registration_correction_case',
    'registration_correction_version', 'registration_correction_version_editor',
    'registration_correction_segment',
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
PHASE3_REQUIRED_COLUMNS = {
    **PHASE2_REQUIRED_COLUMNS,
    'player': {
        'id', 'code', 'full_name', 'birth_date', 'nationality_code',
        'position_code', 'current_portrait_id', 'revision', 'created_at',
        'updated_at',
    },
    'media_asset': PHASE2_REQUIRED_COLUMNS['media_asset'] | {'player_id'},
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
        'updateColumns': [],
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
        'updateColumns': [],
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
        'updateColumns': [],
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
        'updateColumns': ['current_logo_id'],
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
        'updateColumns': ['unreferenced_at'],
    },
}
PHASE3_REQUIRED_FOREIGN_KEYS = {
    **PHASE2_REQUIRED_FOREIGN_KEYS,
    'player_id_current_portrait_id_fkey': {
        'name': 'player_id_current_portrait_id_fkey',
        'sourceSchema': 'public',
        'sourceTable': 'player',
        'sourceColumns': ['id', 'current_portrait_id'],
        'targetSchema': 'public',
        'targetTable': 'media_asset',
        'targetColumns': ['player_id', 'id'],
        'onDelete': 'a',
        'onUpdate': 'a',
        'validated': True,
    },
    'media_asset_player_id_fkey': {
        'name': 'media_asset_player_id_fkey',
        'sourceSchema': 'public',
        'sourceTable': 'media_asset',
        'sourceColumns': ['player_id'],
        'targetSchema': 'public',
        'targetTable': 'player',
        'targetColumns': ['id'],
        'onDelete': 'r',
        'onUpdate': 'a',
        'validated': True,
    },
}
PHASE3_REQUIRED_UNIQUE_INDEXES = {
    **PHASE2_REQUIRED_UNIQUE_INDEXES,
    'player_code_key': ('player', 'code'),
    'player_id_current_portrait_id_key': ('player', 'id,current_portrait_id'),
    'media_asset_player_id_id_key': ('media_asset', 'player_id,id'),
}
PHASE3_REQUIRED_TRIGGERS = {
    **PHASE2_REQUIRED_TRIGGERS,
    'player_identity': {
        'name': 'player_identity',
        'tableSchema': 'public',
        'table': 'player',
        'functionSchema': 'public',
        'function': 'preserve_shared_master_identity',
        'typeBits': 27,
        'enabled': 'O',
        'internal': False,
        'hasCondition': False,
        'updateColumns': [],
    },
    'player_current_portrait_lifecycle': {
        'name': 'player_current_portrait_lifecycle',
        'tableSchema': 'public',
        'table': 'player',
        'functionSchema': 'public',
        'function': 'guard_current_player_portrait',
        'typeBits': 23,
        'enabled': 'O',
        'internal': False,
        'hasCondition': False,
        'updateColumns': ['current_portrait_id'],
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
    if names in (set(PHASE2_MIGRATIONS), set(PHASE2_MIGRATIONS) | {LIFECYCLE_MIGRATION}):
        return 'available-phase-2'
    if names == set(PHASE3_MIGRATIONS):
        return 'available-phase-3'
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
        if name == 'media_asset' and isinstance(value, dict) and value.get('rows'):
            expected_keys.add('storedContent')
        if not isinstance(value, dict) or set(value) != expected_keys:
            raise ValueError('Invalid available-phase-2 table inventory.')
        if type(value.get('rows')) is not int or value['rows'] < 0:
            raise ValueError('Invalid available-phase-2 row count.')
        if not isinstance(value.get('contentSha256'), str) or not SHA256.fullmatch(value['contentSha256']):
            raise ValueError('Invalid available-phase-2 content checksum.')
    assets = inventory['media_asset']
    stored = assets.get('storedContent', [])
    validate_media_inventory(stored)
    references = inventory['club']['currentLogoReferences']
    if len(stored) > assets['rows'] or type(references) is not int or not 0 <= references <= min(
        len(stored), inventory['club']['rows'],
    ):
        raise ValueError('Invalid available-phase-2 media inventory counts.')


def validate_phase3_inventory(inventory):
    if set(inventory) != PHASE3_TABLES:
        raise ValueError('Available-phase-3 table inventory differs from the schema.')
    for name, value in inventory.items():
        expected_keys = {'rows', 'contentSha256'}
        if name == 'club':
            expected_keys.add('currentLogoReferences')
        if name == 'player':
            expected_keys.add('currentPortraitReferences')
        if name == 'media_asset' and isinstance(value, dict) and value.get('rows'):
            expected_keys.add('storedContent')
        if not isinstance(value, dict) or set(value) != expected_keys:
            raise ValueError('Invalid available-phase-3 table inventory.')
        if type(value.get('rows')) is not int or value['rows'] < 0:
            raise ValueError('Invalid available-phase-3 row count.')
        if not isinstance(value.get('contentSha256'), str) or not SHA256.fullmatch(value['contentSha256']):
            raise ValueError('Invalid available-phase-3 content checksum.')
    assets = inventory['media_asset']
    stored = assets.get('storedContent', [])
    validate_media_inventory(stored)
    logo_refs = inventory['club']['currentLogoReferences']
    portrait_refs = inventory['player']['currentPortraitReferences']
    if (
        len(stored) > assets['rows']
        or type(logo_refs) is not int
        or type(portrait_refs) is not int
        or not 0 <= logo_refs <= min(len(stored), inventory['club']['rows'])
        or not 0 <= portrait_refs <= min(len(stored), inventory['player']['rows'])
        or logo_refs + portrait_refs > len(stored)
    ):
        raise ValueError('Invalid available-phase-3 media inventory counts.')


def validate_media_inventory(media):
    if not isinstance(media, list):
        raise ValueError('Invalid media inventory.')
    previous = ''
    for asset in media:
        if not isinstance(asset, dict) or set(asset) != {
            'id', 'provider', 'objectKey', 'mimeType', 'byteSize', 'width', 'height', 'checksum',
        }:
            raise ValueError('Unexpected media inventory fields.')
        key = asset['id']
        if (
            not isinstance(key, str) or not UUID.fullmatch(key) or key <= previous
            or asset['objectKey'] != f'{key}.webp'
            or asset['provider'] != 'LOCAL' or asset['mimeType'] != 'image/webp'
            or any(type(asset[field]) is not int or not 1 <= asset[field] <= maximum
                   for field, maximum in [('byteSize', 2097152), ('width', 2048), ('height', 2048)])
            or not isinstance(asset['checksum'], str) or not SHA256.fullmatch(asset['checksum'])
        ):
            raise ValueError('Invalid or duplicate media record.')
        previous = key


def media_root():
    raw = os.environ.get('OPS_MEDIA_ROOT', '')
    path = Path(raw)
    if not path.is_absolute() or path == Path(path.anchor) or path.resolve() != path or not path.is_dir():
        raise ValueError('Protected absolute media root required.')
    uid = media_uid()
    if path.stat().st_uid != uid or path.stat().st_mode & 0o077:
        raise ValueError('Media root must be private and backend-owned.')
    for name in ('OPS_APP_DIR', 'OPS_STATE_DIR', 'OPS_BACKUP_DIR', 'OPS_OFFHOST_DIR'):
        if os.environ.get(name):
            owned = Path(os.environ[name]).resolve()
            if path == owned or path.is_relative_to(owned) or owned.is_relative_to(path):
                raise ValueError('Media root must be separate from application, state and backup roots.')
    return path


def media_uid():
    uid = int(os.environ.get('OPS_MEDIA_UID', '1000'))
    if uid <= 0:
        raise ValueError('Non-root backend UID required.')
    return uid


def read_media(path, asset):
    observed = path.lstat()
    if not stat.S_ISREG(observed.st_mode):
        raise ValueError('Unexpected media file.')
    flags = os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0) | getattr(os, 'O_NONBLOCK', 0) | getattr(os, 'O_BINARY', 0)
    with os.fdopen(os.open(path, flags), 'rb') as handle:
        info = os.fstat(handle.fileno())
        if (
            not stat.S_ISREG(info.st_mode) or info.st_nlink != 1
            or (info.st_dev, info.st_ino) != (observed.st_dev, observed.st_ino)
            or info.st_size != asset['byteSize']
        ):
            raise ValueError('Unexpected media file.')
        data = handle.read(asset['byteSize'] + 1)
    if len(data) != asset['byteSize'] or hashlib.sha256(data).hexdigest() != asset['checksum']:
        raise ValueError('Media integrity failed.')
    return data


def verify_media(directory, media):
    validate_media_inventory(media)
    if directory.is_symlink() or not directory.is_dir() or {
        item.name for item in directory.iterdir()
    } != {asset['objectKey'] for asset in media}:
        raise ValueError('Unexpected or incomplete set media directory.')
    for asset in media:
        read_media(directory / asset['objectKey'], asset)


def validate_set_layout(backup, scope):
    backup = Path(backup)
    expected = {'database.dump', 'inventory.json', 'manifest.json', 'manifest.sha256'}
    if scope in MEDIA_SCOPES:
        expected.add('media')
    if backup.is_symlink() or {item.name for item in backup.iterdir()} != expected:
        raise ValueError('Incomplete set or unexpected content.')
    for item in backup.iterdir():
        if item.name == 'media' and scope in MEDIA_SCOPES:
            if item.is_symlink() or not item.is_dir():
                raise ValueError('Available-phase-2 media directory must be a real directory.')
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
        if scope == 'available-phase-3':
            validate_phase3_inventory(inventory)
        else:
            validate_phase2_inventory(inventory)
        stored = inventory['media_asset'].get('storedContent', [])
        media_dir = backup / 'media'
        if media_dir.exists():
            if media_dir.is_symlink() or not media_dir.is_dir() or any(media_dir.iterdir()):
                raise ValueError('Available-phase-2 media directory must be empty.')
        else:
            media_dir.mkdir(mode=0o700)
        if stored:
            source = media_root()
            for asset in stored:
                key = asset['objectKey']
                (media_dir / key).write_bytes(read_media(source / key, asset))
        manifest = {
            'formatVersion': 2,
            **common,
            'media': stored,
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
        or (scope == 'available-foundation' and manifest.get('media') != [])
        or manifest.get('scope') != scope
    ):
        raise ValueError('Unsupported backup scope/format.')
    if not isinstance(manifest.get('setId'), str) or not manifest['setId']:
        raise ValueError('Missing set identity.')
    if scope in MEDIA_SCOPES:
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
        if scope == 'available-phase-3':
            validate_phase3_inventory(inventory)
        else:
            validate_phase2_inventory(inventory)
        if manifest['media'] != inventory['media_asset'].get('storedContent', []):
            raise ValueError('Manifest and media inventory differ.')
        verify_media(backup / 'media', manifest['media'])
    return manifest


def restore_media(app, backup):
    manifest = verify(app, backup)
    if not manifest['media']:
        return
    root = media_root()
    uid = media_uid()
    for asset in manifest['media']:
        key = asset['objectKey']
        content = read_media(backup / 'media' / key, asset)
        descriptor, stage = tempfile.mkstemp(prefix='.restore-', dir=root)
        try:
            with os.fdopen(descriptor, 'wb') as handle:
                os.fchown(handle.fileno(), uid, -1)
                handle.write(content)
                handle.flush()
                os.fsync(handle.fileno())
            target = root / key
            if target.is_symlink() or (target.exists() and not target.is_file()):
                raise ValueError('Unsafe destination for restored media.')
            os.replace(stage, target)
        finally:
            Path(stage).unlink(missing_ok=True)
    descriptor = os.open(root, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def verify_live_media(app):
    if schema_profile(app) not in MEDIA_SCOPES:
        return
    media = inventory(app)['media_asset'].get('storedContent', [])
    if media:
        root = media_root()
        for asset in media:
            read_media(root / asset['objectKey'], asset)


def archive_rows(backup, table):
    # Read COPY data without applying SQL to the restore target.
    query = subprocess.check_output(
        ['pg_restore', '--data-only', '--table', table, '--file', '-', str(backup / 'database.dump')],
        text=True, encoding='UTF-8',
    )
    prefix = f'COPY public.{table} ('
    columns = None
    rows = []
    for line in query.split('\n'):
        if line.startswith(prefix) and line.endswith(') FROM stdin;'):
            if columns is not None:
                raise ValueError('Duplicate restore table stream.')
            columns = line[len(prefix):-len(') FROM stdin;')].split(', ')
            continue
        if columns is None:
            continue
        if line == r'\.':
            return rows
        fields = line.split('\t')
        if len(fields) != len(columns):
            raise ValueError('Invalid restore table row.')
        rows.append(dict(zip(columns, fields)))
    raise ValueError('Missing restore table stream.')


def verify_archive(app, backup):
    manifest = verify(app, backup)
    if manifest['formatVersion'] == 1:
        return
    inventory = load_inventory(backup)
    assets = archive_rows(backup, 'media_asset')
    clubs = archive_rows(backup, 'club')
    null = r'\N'
    if len(assets) != inventory['media_asset']['rows'] or len(clubs) != inventory['club']['rows']:
        raise ValueError('Archive and master inventory row counts differ.')
    referenced = {club['current_logo_id']: club['id'] for club in clubs if club['current_logo_id'] != null}
    if len(referenced) != inventory['club']['currentLogoReferences']:
        raise ValueError('Archive current logo inventory differs.')
    by_id = {asset['id']: asset for asset in assets}
    for asset_id, club_id in referenced.items():
        asset = by_id.get(asset_id)
        if (
            not asset
            or asset['club_id'] != club_id
            or asset.get('player_id', null) != null
            or asset['unreferenced_at'] != null
            or asset['content_deleted_at'] != null
        ):
            raise ValueError('Archive current logo reference is invalid.')
    if manifest['scope'] == 'available-phase-3':
        players = archive_rows(backup, 'player')
        if len(players) != inventory['player']['rows']:
            raise ValueError('Archive and player inventory row counts differ.')
        portrait_refs = {
            player['current_portrait_id']: player['id']
            for player in players if player['current_portrait_id'] != null
        }
        if len(portrait_refs) != inventory['player']['currentPortraitReferences']:
            raise ValueError('Archive current portrait inventory differs.')
        for asset_id, player_id in portrait_refs.items():
            asset = by_id.get(asset_id)
            if (
                not asset
                or asset.get('player_id') != player_id
                or asset['club_id'] != null
                or asset['unreferenced_at'] != null
                or asset['content_deleted_at'] != null
            ):
                raise ValueError('Archive current portrait reference is invalid.')
    stored = [{
        'id': asset['id'], 'provider': asset['provider'], 'objectKey': asset['object_key'],
        'mimeType': asset['mime_type'], 'byteSize': int(asset['byte_size']),
        'width': int(asset['width']), 'height': int(asset['height']), 'checksum': asset['checksum'],
    } for asset in sorted(assets, key=lambda row: row['id']) if asset['content_deleted_at'] == null]
    if stored != manifest['media']:
        raise ValueError('Archive media metadata differs from the selected set.')


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


def protected_media(app):
    directories = [Path(os.environ['OPS_BACKUP_DIR'])]
    if os.environ.get('OPS_PROFILE') == 'internet':
        directories.append(Path(os.environ['OPS_OFFHOST_DIR']))
    protected = {}
    for directory in directories:
        for backup in directory.iterdir():
            if not SET_NAME.fullmatch(backup.name):
                continue
            try:
                manifest = verify(app, backup)
            except (ValueError, OSError, KeyError) as error:
                raise ValueError(
                    f'Retained backup set {backup.name} cannot be verified. '
                    'Verify it with its matching application release and preserve a recoverable '
                    'copy in a separately managed archive before removing it from active retention. '
                    'Media cleanup is blocked until all active retained sets verify.'
                ) from error
            for asset in manifest['media']:
                key, checksum = asset['objectKey'], asset['checksum']
                if protected.setdefault(key, checksum) != checksum:
                    raise ValueError('Retained copies of an asset disagree.')
    return protected


def sql(query):
    return subprocess.check_output(
        ['psql', '-XAt', '-v', 'ON_ERROR_STOP=1', '-c', query], text=True,
    ).strip()


def expected_tables(scope):
    if scope == 'available-foundation':
        return FOUNDATION_TABLES
    if scope == 'available-phase-2':
        return PHASE2_TABLES
    if scope == 'available-phase-3':
        return PHASE3_TABLES
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
        if scope in MEDIA_SCOPES and name == 'club':
            logo_references = int(sql('SELECT count(*) FROM "club" WHERE "current_logo_id" IS NOT NULL'))
            result[name]['currentLogoReferences'] = logo_references
        if scope == 'available-phase-3' and name == 'player':
            portrait_references = int(sql('SELECT count(*) FROM "player" WHERE "current_portrait_id" IS NOT NULL'))
            result[name]['currentPortraitReferences'] = portrait_references
        if scope in MEDIA_SCOPES and name == 'media_asset' and row_count:
            result[name]['storedContent'] = json.loads(sql("""
                SELECT coalesce(jsonb_agg(jsonb_build_object(
                  'id', id, 'provider', provider, 'objectKey', object_key,
                  'mimeType', mime_type, 'byteSize', byte_size, 'width', width,
                  'height', height, 'checksum', checksum
                ) ORDER BY id), '[]') FROM media_asset WHERE content_deleted_at IS NULL
            """))
    required = {'account', 'session', 'audit_record', 'command_receipt', '_prisma_migrations'}
    if not required <= result.keys():
        raise ValueError('Missing foundation schema.')
    if scope == 'available-phase-2':
        validate_phase2_inventory(result)
    elif scope == 'available-phase-3':
        validate_phase3_inventory(result)
    return result


def validate_phase2_catalog(foreign_keys, unique_indexes, triggers, scope='available-phase-2'):
    expected_fks = (
        PHASE3_REQUIRED_FOREIGN_KEYS if scope == 'available-phase-3' else PHASE2_REQUIRED_FOREIGN_KEYS
    )
    expected_uniques = (
        PHASE3_REQUIRED_UNIQUE_INDEXES if scope == 'available-phase-3' else PHASE2_REQUIRED_UNIQUE_INDEXES
    )
    expected_triggers = (
        PHASE3_REQUIRED_TRIGGERS if scope == 'available-phase-3' else PHASE2_REQUIRED_TRIGGERS
    )
    foreign_key_map = {}
    for foreign_key in foreign_keys:
        if not isinstance(foreign_key, dict) or not isinstance(foreign_key.get('name'), str):
            raise ValueError('Club/Stadium/media foreign-key inventory is invalid.')
        if foreign_key['name'] in foreign_key_map:
            raise ValueError('Club/Stadium/media foreign-key inventory is ambiguous.')
        foreign_key_map[foreign_key['name']] = foreign_key
    if foreign_key_map != expected_fks:
        raise ValueError('Club/Stadium/media foreign keys are incompatible.')
    if any(
        unique_indexes.get(name) != expected
        for name, expected in expected_uniques.items()
    ):
        raise ValueError('Club/Stadium/media unique indexes are incompatible.')
    trigger_map = {}
    for trigger in triggers:
        if not isinstance(trigger, dict) or not isinstance(trigger.get('name'), str):
            raise ValueError('Club/Stadium/media trigger inventory is invalid.')
        if trigger['name'] in trigger_map:
            raise ValueError('Club/Stadium/media trigger inventory is ambiguous.')
        trigger_map[trigger['name']] = trigger
    if trigger_map != expected_triggers:
        raise ValueError('Club/Stadium/media triggers are incompatible.')


def verify_schema(app, scope):
    if read_table_names() != expected_tables(scope):
        raise ValueError('Database table inventory differs from the supported schema.')
    if scope not in MEDIA_SCOPES:
        return
    columns = sql(
        "SELECT table_name || ':' || column_name FROM information_schema.columns "
        "WHERE table_schema='public' ORDER BY table_name,column_name"
    ).splitlines()
    actual_columns = set(columns)
    required_columns = (
        PHASE3_REQUIRED_COLUMNS if scope == 'available-phase-3' else PHASE2_REQUIRED_COLUMNS
    )
    for table, required in required_columns.items():
        if any(f'{table}:{column}' not in actual_columns for column in required):
            raise ValueError('Club/Stadium/media schema columns are incomplete.')
    fk_names = (
        tuple(PHASE3_REQUIRED_FOREIGN_KEYS)
        if scope == 'available-phase-3'
        else tuple(PHASE2_REQUIRED_FOREIGN_KEYS)
    )
    fk_list_sql = ', '.join(f"'{name}'" for name in fk_names)
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
        f"AND constraint_info.conname IN ({fk_list_sql}) "
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
    trigger_names = (
        tuple(PHASE3_REQUIRED_TRIGGERS)
        if scope == 'available-phase-3'
        else tuple(PHASE2_REQUIRED_TRIGGERS)
    )
    trigger_list_sql = ', '.join(f"'{name}'" for name in trigger_names)
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
        "'hasCondition', trigger_info.tgqual IS NOT NULL, "
        "'updateColumns', (SELECT coalesce(jsonb_agg(attribute.attname::text "
        "ORDER BY attribute.attname), '[]'::jsonb) "
        "FROM unnest(trigger_info.tgattr) AS watched(attnum) "
        "JOIN pg_attribute attribute ON attribute.attrelid=trigger_info.tgrelid "
        "AND attribute.attnum=watched.attnum))::text "
        "FROM pg_trigger trigger_info "
        "JOIN pg_class table_class ON table_class.oid=trigger_info.tgrelid "
        "JOIN pg_namespace table_namespace ON table_namespace.oid=table_class.relnamespace "
        "JOIN pg_proc function_info ON function_info.oid=trigger_info.tgfoid "
        "JOIN pg_namespace function_namespace ON function_namespace.oid=function_info.pronamespace "
        f"WHERE trigger_info.tgname IN ({trigger_list_sql}) "
        "ORDER BY trigger_info.tgname, trigger_info.tgrelid"
    ).splitlines()
    triggers = [json.loads(line) for line in trigger_lines]
    validate_phase2_catalog(foreign_keys, unique_indexes, triggers, scope)


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
        elif action == 'verify-archive':
            verify_archive(app, Path(arguments[0]))
        elif action == 'restored':
            backup = Path(arguments[0])
            manifest = verify(app, backup)
            database(app)
            if inventory(app) != load_inventory(backup):
                raise ValueError('Restored contents differ from selected set.')
            if manifest['media']:
                root = media_root()
                for asset in manifest['media']:
                    read_media(root / asset['objectKey'], asset)
        elif action == 'restore-media':
            restore_media(app, Path(arguments[0]))
        elif action == 'preflight-media':
            if verify(app, Path(arguments[0]))['media']:
                media_root()
        elif action == 'live-media':
            verify_live_media(app)
        elif action == 'retain':
            retain(app, Path(arguments[0]))
        elif action == 'protected-media':
            print(json.dumps(protected_media(app), sort_keys=True))
        else:
            raise ValueError('Unknown verification action.')
    except Exception as error:
        if action == 'protected-media':
            print(str(error), file=sys.stderr)
        print('Backup set verification failed; inspect protected operator state.', file=sys.stderr)
        sys.exit(1)
