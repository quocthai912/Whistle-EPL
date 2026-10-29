"""Foundation set format. Never emits connection strings or credential-bearing rows."""
import hashlib
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def digest(path):
    with Path(path).open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def compatibility(app):
    app = Path(app)
    migrations = hashlib.sha256()
    for path in sorted((app / 'backend/prisma/migrations').glob('*/migration.sql')):
        migrations.update(path.parent.name.encode())
        migrations.update(path.read_bytes().replace(b'\r\n', b'\n'))
    return {'applicationVersion': json.loads((app / 'package.json').read_text())['version'],
            'schemaSha256': migrations.hexdigest(), 'postgresMajor': 17}


def create(app, backup, identifier):
    backup = Path(backup)
    manifest = {'formatVersion': 1, 'setId': identifier,
                'createdAt': datetime.now(timezone.utc).isoformat(), **compatibility(app),
                'media': [], 'scope': 'available-foundation',
                'files': {name: digest(backup / name) for name in ['database.dump', 'inventory.json']}}
    (backup / 'manifest.json').write_text(json.dumps(manifest, sort_keys=True) + '\n')
    (backup / 'manifest.sha256').write_text(digest(backup / 'manifest.json') + '\n')


def verify(app, backup, identifier=None):
    backup = Path(backup)
    expected = {'database.dump', 'inventory.json', 'manifest.json', 'manifest.sha256'}
    if backup.is_symlink() or {p.name for p in backup.iterdir()} != expected:
        raise ValueError('Incomplete set or unexpected content.')
    if any(p.is_symlink() or not p.is_file() for p in backup.iterdir()):
        raise ValueError('Set must contain regular files only.')
    if digest(backup / 'manifest.json') != (backup / 'manifest.sha256').read_text().strip():
        raise ValueError('Manifest integrity failed.')
    manifest = json.loads((backup / 'manifest.json').read_text())
    if manifest.get('formatVersion') != 1 or manifest.get('media') != [] or manifest.get('scope') != 'available-foundation':
        raise ValueError('Unsupported backup scope/format.')
    if not isinstance(manifest.get('setId'), str) or not manifest['setId']:
        raise ValueError('Missing set identity.')
    if identifier is None and re.fullmatch(r'\d{8}T\d{6}Z-[0-9a-f-]{36}', backup.name):
        identifier = backup.name
    if identifier is not None and manifest['setId'] != identifier:
        raise ValueError('Selected set identity differs from manifest.')
    for key, value in compatibility(app).items():
        if manifest.get(key) != value:
            raise ValueError('Backup/application/schema compatibility failed.')
    if set(manifest.get('files', {})) != {'database.dump', 'inventory.json'}:
        raise ValueError('Invalid inventory.')
    for name, checksum in manifest['files'].items():
        if digest(backup / name) != checksum:
            raise ValueError('Backup file integrity failed.')
    if not isinstance(json.loads((backup / 'inventory.json').read_text()), dict):
        raise ValueError('Invalid data inventory.')
    return manifest


def retain(app, directory):
    complete = []
    for path in Path(directory).iterdir():
        if not re.fullmatch(r'\d{8}T\d{6}Z-[0-9a-f-]{36}', path.name):
            continue
        try:
            verify(app, path)
            complete.append(path)
        except (ValueError, OSError, KeyError):
            continue
    for path in sorted(complete, key=lambda p: p.name, reverse=True)[7:]:
        shutil.rmtree(path)


def sql(query):
    return subprocess.check_output(['psql', '-XAt', '-v', 'ON_ERROR_STOP=1', '-c', query], text=True).strip()


def inventory():
    tables = sql("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename").splitlines()
    result = {}
    for name in tables:
        if not re.fullmatch(r'[a-z_]+', name):
            raise ValueError('Unexpected table.')
        if name in {'media_asset', 'club', 'player', 'match'}:
            raise ValueError('Later-Phase data requires its owning recovery implementation.')
        excluded = {'account': ['auth_revision'], 'session': ['revoked_at', 'revocation_reason'],
                    'maintenance_state': ['closed', 'operation_id', 'changed_at']}.get(name, [])
        projection = 'to_jsonb(t)' + ''.join(" - '" + column + "'" for column in excluded)
        content = sql(f'SELECT coalesce(jsonb_agg(obj ORDER BY obj::text),\'[]\'::jsonb)::text FROM (SELECT {projection} obj FROM "{name}" t) rows')
        result[name] = {'rows': int(sql(f'SELECT count(*) FROM "{name}"')),
                        'contentSha256': hashlib.sha256(content.encode()).hexdigest()}
    if not {'account', 'session', 'audit_record', 'command_receipt', '_prisma_migrations'} <= result.keys():
        raise ValueError('Missing foundation schema.')
    return result


def database(app):
    expected = {}
    for path in (Path(app) / 'backend/prisma/migrations').glob('*/migration.sql'):
        normalized = path.read_bytes().replace(b'\r\n', b'\n')
        expected[path.parent.name] = {hashlib.sha256(normalized).hexdigest(), hashlib.sha256(normalized.replace(b'\n', b'\r\n')).hexdigest()}
    actual = sql("SELECT migration_name || ':' || checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY migration_name").splitlines()
    installed = dict(row.split(':', 1) for row in actual)
    if installed.keys() != expected.keys() or any(checksum not in expected[name] for name,checksum in installed.items()):
        raise ValueError('Migration inventory differs from installed application.')
    if sql("SELECT count(*) FROM pg_constraint WHERE connamespace='public'::regnamespace AND NOT convalidated") != '0':
        raise ValueError('Invalid constraints.')
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
    inventory()


if __name__ == '__main__':
    try:
        action, app, *arguments = sys.argv[1:]
        if action == 'inventory': print(json.dumps(inventory(), sort_keys=True))
        elif action == 'database': database(app)
        elif action == 'create': create(app, Path(arguments[0]), arguments[1])
        elif action == 'verify': verify(app, Path(arguments[0]))
        elif action == 'restored':
            backup = Path(arguments[0])
            verify(app, backup)
            database(app)
            if inventory() != json.loads((backup / 'inventory.json').read_text()):
                raise ValueError('Restored contents differ from selected set.')
        elif action == 'retain': retain(app, Path(arguments[0]))
        else: raise ValueError('Unknown verification action.')
    except Exception:
        print('Foundation set verification failed; inspect protected operator state.', file=sys.stderr)
        sys.exit(1)
