import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { open, rename } from 'node:fs/promises';
import { dirname, isAbsolute } from 'node:path';
import { objectKeyPattern } from './local-media.store';

export type OrphanObservation = { identity: string; observedAt: number };

export class OrphanInventoryService {
  constructor(private readonly path: string) {
    if (!isAbsolute(path)) throw new Error('Protected orphan inventory path required.');
  }

  async read(): Promise<Map<string, OrphanObservation>> {
    try {
      const handle = await open(this.path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      try {
        if (!(await handle.stat()).isFile()) throw new Error('Invalid orphan inventory.');
        const data: unknown = JSON.parse(await handle.readFile('utf8'));
        if (!data || typeof data !== 'object' || Array.isArray(data))
          throw new Error('Invalid orphan inventory.');
        const observations = new Map<string, OrphanObservation>();
        for (const [key, value] of Object.entries(data as Record<string, OrphanObservation>)) {
          if (
            !objectKeyPattern.test(key) ||
            !value ||
            typeof value.identity !== 'string' ||
            !Number.isSafeInteger(value.observedAt) ||
            value.observedAt < 0
          )
            throw new Error('Invalid orphan observation.');
          observations.set(key, value);
        }
        return observations;
      } finally {
        await handle.close();
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Map();
      throw error;
    }
  }

  async save(observations: Map<string, OrphanObservation>): Promise<void> {
    const temporary = `${this.path}.${randomUUID()}.tmp`;
    const handle = await open(temporary, 'wx', 0o600);
    try {
      await handle.writeFile(JSON.stringify(Object.fromEntries(observations)));
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(temporary, this.path);
    if (process.platform !== 'win32') {
      const parent = await open(dirname(this.path), constants.O_RDONLY | constants.O_DIRECTORY);
      try {
        await parent.sync();
      } finally {
        await parent.close();
      }
    }
  }
}
