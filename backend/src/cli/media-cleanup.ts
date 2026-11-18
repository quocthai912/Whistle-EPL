import { execFile } from 'node:child_process';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { AuditWriterService } from '../audit/audit-writer.service';
import { LocalMediaStore } from '../media/local-media.store';
import { MediaCleanupService } from '../media/media-cleanup.service';
import { OrphanInventoryService } from '../media/orphan-inventory.service';
import { runOperator } from './operator-runtime';

if (require.main === module)
  void runOperator(async (database) => {
    const [action] = process.argv.slice(2);
    if (!['recover', 'clean'].includes(action) || process.argv.length !== 3)
      throw new Error('Invalid media maintenance action.');
    const { OPS_APP_DIR, OPS_MEDIA_ROOT, OPS_STATE_DIR, OPS_MEDIA_UID } = process.env;
    if (!OPS_APP_DIR || !OPS_MEDIA_ROOT || !OPS_STATE_DIR)
      throw new Error('Protected media and operator state paths required.');
    const uid = Number(OPS_MEDIA_UID || '1000');
    if (!Number.isSafeInteger(uid) || uid < 1) throw new Error('Backend UID required.');
    const cleanup = new MediaCleanupService(
      database,
      new LocalMediaStore(OPS_MEDIA_ROOT, 'local', uid),
      new OrphanInventoryService(join(OPS_STATE_DIR, 'media-orphans.json')),
      new AuditWriterService(),
    );
    await cleanup.recoverInterrupted();
    if (action === 'recover') return;
    const { stdout } = await promisify(execFile)('python3', [
      join(OPS_APP_DIR, 'ops/backup/set-format.py'),
      'protected-media',
      OPS_APP_DIR,
    ]);
    const copies = new Map<string, string>(Object.entries(JSON.parse(stdout)));
    const failures = await cleanup.execute(copies);
    if (failures) throw new Error('Media cleanup will retry failed objects on the next daily run.');
  });
