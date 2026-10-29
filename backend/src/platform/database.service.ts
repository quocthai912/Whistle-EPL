import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { AdmissionService } from './admission.service';
import { ClockService } from './clock.service';
import { ApplicationError } from './application-error';
import { TransactionContext, type LockResource } from './transaction-context';

function knownRollback(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as {
    code?: string;
    meta?: { driverAdapterError?: { cause?: { originalCode?: string } } };
  };
  // P2034 is Prisma's documented transaction-conflict/deadlock rollback.
  return (
    e.code === 'P2034' ||
    ['40001', '40P01'].includes(e.meta?.driverAdapterError?.cause?.originalCode ?? '')
  );
}

export class DatabaseService {
  readonly client: PrismaClient;
  constructor(
    url: string,
    private readonly clock = new ClockService(),
    private readonly admission = new AdmissionService(process.env.MAINTENANCE_MARKER_PATH),
  ) {
    if (!url) throw new Error('An explicit database URL is required.');
    this.client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }), log: [] });
  }

  async write<T>(
    locks: readonly LockResource[],
    authority: (context: TransactionContext, now: Date) => Promise<void>,
    execute: (context: TransactionContext) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.client.$transaction(
          async (db) => {
            await this.admission.acquire(db);
            const context = new TransactionContext(db, this.clock, authority);
            await context.acquire(locks);
            // clock_timestamp is sampled after all waits, never transaction-start now().
            await context.recheckAuthority();
            return execute(context);
          },
          { isolationLevel: 'ReadCommitted', maxWait: 10000, timeout: 20000 },
        );
      } catch (error) {
        if (!knownRollback(error)) throw error;
        if (attempt === 3)
          throw new ApplicationError(
            503,
            'TRANSACTION_UNAVAILABLE',
            'Không thể hoàn tất giao dịch. Vui lòng thử lại sau.',
          );
      }
    }
    throw new Error('Unreachable transaction state.');
  }

  async setMaintenance(closed: boolean, operationId: string): Promise<void> {
    if (closed) {
      // Publish the drain boundary first. PostgreSQL compatible row lockers may
      // otherwise enter ahead of an exclusive admission waiter.
      await this.client.$transaction(async (db) => {
        const rows = await db.$queryRaw<
          Array<{ closed: boolean; operation_id: string | null }>
        >`SELECT closed,operation_id FROM maintenance_state WHERE singleton_id=1 FOR UPDATE`;
        if (rows.length !== 1)
          throw new ApplicationError(503, 'MAINTENANCE', 'Thiếu trạng thái bảo trì.');
        if (rows[0].closed && rows[0].operation_id !== operationId)
          throw new ApplicationError(
            409,
            'STATE_CONFLICT',
            'Một thao tác bảo trì khác đang hoạt động.',
          );
        await db.maintenanceState.update({
          where: { singletonId: 1 },
          data: { closed: true, operationId, changedAt: await this.clock.now(db) },
        });
      });
    }
    await this.client.$transaction(
      async (db) => {
        await this.admission.acquire(db, true);
        const current = await db.maintenanceState.findUniqueOrThrow({ where: { singletonId: 1 } });
        if (current.closed && current.operationId !== operationId)
          throw new ApplicationError(
            409,
            'STATE_CONFLICT',
            'Một thao tác bảo trì khác đang hoạt động.',
          );
        if (!closed && (await this.admission.hostClosed()))
          throw new ApplicationError(503, 'MAINTENANCE', 'Chưa thể mở lại hệ thống.');
        await db.maintenanceState.update({
          where: { singletonId: 1 },
          data: {
            closed,
            operationId: closed ? operationId : null,
            changedAt: await this.clock.now(db),
          },
        });
      },
      { maxWait: 10000, timeout: 20000 },
    );
  }

  close(): Promise<void> {
    return this.client.$disconnect();
  }
}
