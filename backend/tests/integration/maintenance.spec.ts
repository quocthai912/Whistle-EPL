import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseService } from '../../src/platform/database.service';
import { AdmissionService } from '../../src/platform/admission.service';
import { ClockService } from '../../src/platform/clock.service';
import { MaintenanceService } from '../../src/operations/maintenance.service';

describe('durable host maintenance outside restored database', () => {
  it('fails closed across restart and old-snapshot state, and requires matching verification to release', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'whistle-maintenance-'));
    const marker = join(directory, 'maintenance.json');
    const database = new DatabaseService(
      process.env.TEST_DATABASE_URL!,
      new ClockService(),
      new AdmissionService(marker),
    );
    const maintenance = new MaintenanceService(database, marker);
    try {
      await expect(maintenance.close('restore', 'missing selected set')).rejects.toThrow();
      await maintenance.close('manual', 'isolated recovery drill');
      const state = JSON.parse(await readFile(marker, 'utf8')) as { operationId: string };
      await database.client.maintenanceState.update({
        where: { singletonId: 1 },
        data: { closed: false, operationId: null },
      });
      const restarted = new DatabaseService(
        process.env.TEST_DATABASE_URL!,
        new ClockService(),
        new AdmissionService(marker),
      );
      try {
        await expect(
          restarted.write(
            [],
            async () => {},
            async () => true,
          ),
        ).rejects.toMatchObject({ code: 'MAINTENANCE' });
      } finally {
        await restarted.close();
      }
      await expect(maintenance.release('other')).rejects.toThrow();
      await expect(maintenance.release(state.operationId)).rejects.toThrow();
      await writeFile(
        join(directory, 'verified.json'),
        JSON.stringify({ operationId: state.operationId, verified: true }),
      );
      // An arbitrary file is not a verification capability.
      await expect(maintenance.release(state.operationId)).rejects.toThrow();
      await maintenance.verify(state.operationId);
      await maintenance.release(state.operationId);
      expect(
        await database.write(
          [],
          async () => {},
          async () => true,
        ),
      ).toBe(true);
    } finally {
      await rm(marker, { force: true });
      await database.setMaintenance(
        false,
        (await database.client.maintenanceState.findUniqueOrThrow({ where: { singletonId: 1 } }))
          .operationId ?? 'cleanup',
      );
      await database.close();
      await rm(directory, { recursive: true, force: true });
    }
  });
});
