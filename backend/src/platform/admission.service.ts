import { readFile, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Prisma } from '../generated/prisma/client';
import { ApplicationError } from './application-error';

export class AdmissionService {
  constructor(private readonly markerPath?: string) {}

  async hostClosed(): Promise<boolean> {
    if (!this.markerPath) return false;
    try {
      await readFile(this.markerPath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return true;
      // Missing/inaccessible marker directory is not proof of an open host.
      try {
        await access(dirname(this.markerPath));
        return false;
      } catch {
        return true;
      }
    }
  }

  async acquire(db: Prisma.TransactionClient, exclusive = false): Promise<void> {
    const mode = exclusive ? 'FOR UPDATE' : 'FOR SHARE';
    const guards = await db.$queryRawUnsafe<unknown[]>(
      `SELECT key FROM system_guard WHERE key='maintenance-admission' ${mode}`,
    );
    const state = await db.maintenanceState.findUnique({ where: { singletonId: 1 } });
    if (
      guards.length !== 1 ||
      !state ||
      (!exclusive && (state.closed || (await this.hostClosed())))
    ) {
      throw new ApplicationError(
        503,
        'MAINTENANCE',
        'Hệ thống đang bảo trì. Vui lòng thử lại sau.',
      );
    }
  }
}
