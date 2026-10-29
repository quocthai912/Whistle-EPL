import type { Prisma } from '../generated/prisma/client';

export class ClockService {
  async now(db: Prisma.TransactionClient): Promise<Date> {
    const rows = await db.$queryRaw<Array<{ now: Date }>>`SELECT clock_timestamp() AS now`;
    return rows[0].now;
  }
}
