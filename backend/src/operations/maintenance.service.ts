import { randomUUID } from 'node:crypto';
import { readFile, open, rename, unlink } from 'node:fs/promises';
import { dirname, isAbsolute } from 'node:path';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { DatabaseService } from '../platform/database.service';

type Marker = {
  operationId: string;
  kind: string;
  reason: string;
  verified: boolean;
  backupSetPath?: string;
};
export class MaintenanceService {
  constructor(
    private readonly database: DatabaseService,
    private readonly markerPath: string,
  ) {
    if (!isAbsolute(markerPath)) throw new Error('Absolute protected marker path required.');
  }
  private async syncDirectory(): Promise<void> {
    if (process.platform === 'win32') return; // Reference deployment requires Linux fsync.
    const directory = await open(dirname(this.markerPath), 'r');
    try {
      await directory.sync();
    } finally {
      await directory.close();
    }
  }
  async status(): Promise<Marker | null> {
    try {
      return JSON.parse(await readFile(this.markerPath, 'utf8')) as Marker;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }
  async close(
    kind: string,
    reason: string,
    operationId: string = randomUUID(),
    backupSetPath?: string,
  ): Promise<string> {
    if (
      !['backup', 'restore', 'manual'].includes(kind) ||
      !reason.trim() ||
      [...reason].length > 2000 ||
      !/^[0-9a-f-]{36}$/.test(operationId)
    )
      throw new Error('Invalid maintenance request.');
    if (kind === 'restore' && (!backupSetPath || !isAbsolute(backupSetPath)))
      throw new Error('Selected complete restore set required.');
    // O_EXCL prevents competing controllers. Persist before touching the restorable DB.
    const file = await open(this.markerPath, 'wx', 0o640);
    try {
      await file.writeFile(
        JSON.stringify({ operationId, kind, reason, verified: false, backupSetPath }),
      );
      await file.sync();
    } finally {
      await file.close();
    }
    await this.syncDirectory();
    await this.database.setMaintenance(true, operationId);
    return operationId;
  }
  private async requireMarker(operationId: string): Promise<Marker> {
    const marker = await this.status();
    if (!marker || marker.operationId !== operationId)
      throw new Error('Matching durable operation required.');
    return marker;
  }
  async verify(operationId: string): Promise<void> {
    const marker = await this.requireMarker(operationId);
    if (marker.kind === 'restore') {
      if (!marker.backupSetPath || !isAbsolute(marker.backupSetPath))
        throw new Error('Selected restore set missing.');
      const app = resolve(__dirname, '../../..');
      // Re-run actual same-set content, compatibility and relationship verification on every release.
      execFileSync(
        'python3',
        [resolve(app, 'ops/backup/set-format.py'), 'restored', app, marker.backupSetPath],
        { stdio: 'pipe' },
      );
    }
    await this.database.client.$transaction(async (db) => {
      // Reconcile old snapshot state only while the matching external marker closes writers.
      await db.$queryRaw`SELECT key FROM system_guard WHERE key='maintenance-admission' FOR UPDATE`;
      const version = await db.$queryRaw<
        Array<{ version: number }>
      >`SELECT current_setting('server_version_num')::int AS version`;
      if (version[0].version < 170000 || version[0].version >= 180000)
        throw new Error('PostgreSQL 17 required.');
      const constraints = await db.$queryRaw<
        Array<{ conname: string; convalidated: boolean }>
      >`SELECT conname,convalidated FROM pg_constraint WHERE connamespace='public'::regnamespace`;
      for (const name of [
        'account_personnel_code',
        'account_hash',
        'session_token_hash',
        'audit_actor_context',
        'receipt_outcome',
      ])
        if (!constraints.some((c) => c.conname === name && c.convalidated))
          throw new Error('Foundation constraints missing.');
      if (constraints.some((c) => !c.convalidated))
        throw new Error('Unvalidated relationship/constraint.');
      if (
        (await db.systemGuard.count({
          where: { key: { in: ['bootstrap', 'last-active-admin', 'maintenance-admission'] } },
        })) !== 3
      )
        throw new Error('Foundation guards missing.');
      const triggers = await db.$queryRaw<
        Array<{ tgname: string }>
      >`SELECT tgname FROM pg_trigger WHERE tgname IN ('audit_history','account_identity') AND tgenabled='O'`;
      if (!triggers.some((t) => t.tgname === 'audit_history'))
        throw new Error('Audit protection missing.');
      await db.account.count();
      await db.auditRecord.count();
      await db.commandReceipt.count();
      if (marker.kind === 'restore' && (await db.session.count({ where: { revokedAt: null } })))
        throw new Error('Restored sessions must be invalidated.');
      await db.maintenanceState.update({
        where: { singletonId: 1 },
        data: { closed: true, operationId, changedAt: new Date() },
      });
    });
    const temporary = `${this.markerPath}.${randomUUID()}.tmp`;
    const file = await open(temporary, 'wx', 0o640);
    try {
      await file.writeFile(JSON.stringify({ ...marker, verified: true }));
      await file.sync();
    } finally {
      await file.close();
    }
    await rename(temporary, this.markerPath);
    await this.syncDirectory();
  }
  async release(operationId: string): Promise<void> {
    const marker = await this.requireMarker(operationId);
    if (!marker.verified) throw new Error('Verify the selected operation before release.');
    // Verify again immediately before release; interruption leaves at least the DB closed.
    await this.verify(operationId);
    await unlink(this.markerPath);
    await this.syncDirectory();
    await this.database.setMaintenance(false, operationId);
  }
}
