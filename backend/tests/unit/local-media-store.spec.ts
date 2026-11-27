import { randomUUID } from 'node:crypto';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import type * as FsPromises from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalMediaStore, mediaChecksum } from '../../src/media/local-media.store';

let mockOpenHook:
  | ((
      realOpen: typeof FsPromises.open,
      ...args: Parameters<typeof FsPromises.open>
    ) => ReturnType<typeof FsPromises.open>)
  | null = null;

jest.mock('node:fs/promises', () => {
  const actual = jest.requireActual<typeof FsPromises>('node:fs/promises');
  return {
    ...actual,
    open: (...args: Parameters<typeof FsPromises.open>) =>
      mockOpenHook ? mockOpenHook(actual.open, ...args) : actual.open(...args),
  };
});

describe('LocalMediaStore.put cleanup ownership', () => {
  let mediaRoot: string;

  beforeEach(async () => {
    mediaRoot = await realpath(await mkdtemp(join(tmpdir(), 'whistle-local-media-unit-')));
  });

  afterEach(async () => {
    mockOpenHook = null;
    jest.restoreAllMocks();
    await rm(mediaRoot, { recursive: true, force: true });
  });

  it('removes a newly created object when synchronization fails after exclusive creation', async () => {
    const store = new LocalMediaStore(mediaRoot, 'local');
    const key = `${randomUUID()}.webp`;
    let existedAtFailurePoint = false;

    mockOpenHook = async (realOpen, targetPath, flags, mode) => {
      const handle = await realOpen(targetPath, flags, mode);
      if (flags === 'wx') {
        jest.spyOn(handle, 'sync').mockImplementationOnce(async () => {
          const { keys } = await store.inventory();
          existedAtFailurePoint = keys.includes(key);
          throw new Error('simulated file sync failure');
        });
      }
      return handle;
    };

    await expect(store.put(key, Buffer.from('RIFFtestWEBP'))).rejects.toMatchObject({
      code: 'MEDIA_UNAVAILABLE',
    });

    expect(existedAtFailurePoint).toBe(true);
    await expect(store.inventory()).resolves.toEqual({ keys: [], staged: [] });
  });

  it('preserves a pre-existing object when exclusive creation fails with EEXIST', async () => {
    const store = new LocalMediaStore(mediaRoot, 'local');
    const key = `${randomUUID()}.webp`;
    const originalBytes = Buffer.from('RIFForigWEBP');

    await store.put(key, originalBytes);

    await expect(store.put(key, Buffer.from('RIFFnextWEBP'))).rejects.toMatchObject({
      code: 'MEDIA_UNAVAILABLE',
    });

    const retained = await store.read(key, originalBytes.length, mediaChecksum(originalBytes));
    expect(retained.equals(originalBytes)).toBe(true);
  });
});
