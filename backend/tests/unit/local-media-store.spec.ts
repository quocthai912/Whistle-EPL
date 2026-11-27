import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalMediaStore } from '../../src/media/local-media.store';

describe('LocalMediaStore.put cleanup ownership', () => {
  let mediaRoot: string;

  beforeEach(async () => {
    mediaRoot = await mkdtemp(join(tmpdir(), 'whistle-local-media-unit-'));
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await rm(mediaRoot, { recursive: true, force: true });
  });

  it('removes a newly created object when directory synchronization fails after exclusive creation', async () => {
    const store = new LocalMediaStore(mediaRoot, 'local');
    const key = `${randomUUID()}.webp`;
    jest
      .spyOn(store as unknown as { syncRoot: (root: string) => Promise<void> }, 'syncRoot')
      .mockRejectedValueOnce(new Error('simulated fsync failure'));

    await expect(store.put(key, Buffer.from('RIFFtestWEBP'))).rejects.toMatchObject({
      code: 'MEDIA_UNAVAILABLE',
    });

    await expect(stat(join(mediaRoot, key))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('preserves a pre-existing object when exclusive creation fails with EEXIST', async () => {
    const store = new LocalMediaStore(mediaRoot, 'local');
    const key = `${randomUUID()}.webp`;
    const originalBytes = Buffer.from('RIFForigWEBP');

    await store.put(key, originalBytes);

    await expect(store.put(key, Buffer.from('RIFFnextWEBP'))).rejects.toMatchObject({
      code: 'MEDIA_UNAVAILABLE',
    });

    const retained = await readFile(join(mediaRoot, key));
    expect(retained.equals(originalBytes)).toBe(true);
  });
});
