import { ClockService } from '../../src/platform/clock.service';
import type { Pool } from 'pg';

export class TestClock extends ClockService {
  constructor(private instant: Date) {
    super();
  }
  set(instant: Date): void {
    this.instant = new Date(instant);
  }
  override async now(): Promise<Date> {
    return new Date(this.instant);
  }
}

/** Explicit gates expose race milestones without guessing sleeps. */
export function barrier(): { reached: Promise<void>; release: () => void } {
  let release!: () => void;
  const reached = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { reached, release };
}

export async function waitForBlockedBy(observer: Pool, blockerPid: number): Promise<void> {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    const result = await observer.query(
      'SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE $1 = ANY(pg_blocking_pids(pid))) AS blocked',
      [blockerPid],
    );
    if (result.rows[0].blocked) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error('Expected PostgreSQL lock wait was not observed.');
}
