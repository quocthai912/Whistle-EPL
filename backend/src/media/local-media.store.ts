import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readdir, realpath, rename, unlink } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { ApplicationError } from '../platform/application-error';
import { CLUB_LOGO_MAX_BYTES } from './media-validation';

export const objectKeyPattern =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
const unavailable = () =>
  new ApplicationError(503, 'MEDIA_UNAVAILABLE', 'Tạm thời không thể truy cập nội dung logo.');

export function mediaChecksum(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export class LocalMediaStore {
  constructor(
    private readonly root = process.env.MEDIA_ROOT,
    private readonly profile = process.env.MEDIA_STORAGE_PROFILE,
    private readonly ownerUid = process.getuid?.(),
  ) {}

  private async location(key: string) {
    if (
      !objectKeyPattern.test(key) ||
      this.profile !== 'local' ||
      !this.root ||
      !isAbsolute(this.root)
    )
      throw unavailable();
    const root = resolve(this.root);
    const [canonical, info] = await Promise.all([realpath(root), lstat(root)]);
    const sameRoot =
      process.platform === 'win32'
        ? canonical.toLowerCase() === root.toLowerCase()
        : canonical === root;
    if (!sameRoot || !info.isDirectory() || info.isSymbolicLink()) throw unavailable();
    if (process.platform !== 'win32' && ((info.mode & 0o077) !== 0 || info.uid !== this.ownerUid))
      throw unavailable();
    return { root, path: join(root, key) };
  }

  private async syncRoot(root: string) {
    if (process.platform === 'win32') return;
    const parent = await open(root, constants.O_RDONLY | constants.O_DIRECTORY);
    try {
      await parent.sync();
    } finally {
      await parent.close();
    }
  }

  async put(key: string, bytes: Buffer): Promise<void> {
    if (!bytes.length || bytes.length > CLUB_LOGO_MAX_BYTES) throw unavailable();
    let createdPath: string | null = null;
    try {
      const { root, path } = await this.location(key);
      const file = await open(path, 'wx', 0o600);
      createdPath = path;
      try {
        await file.writeFile(bytes);
        await file.sync();
      } finally {
        await file.close();
      }
      await this.syncRoot(root);
    } catch {
      if (createdPath) {
        await unlink(createdPath).catch(() => undefined);
      }
      throw unavailable();
    }
  }

  async inventory(): Promise<{ keys: string[]; staged: string[] }> {
    const { root } = await this.location('00000000-0000-4000-8000-000000000000.webp');
    const names = await readdir(root);
    return {
      keys: names.filter((name) => objectKeyPattern.test(name)),
      staged: names
        .filter((name) => name.startsWith('.cleanup-') && objectKeyPattern.test(name.slice(9)))
        .map((name) => name.slice(9)),
    };
  }

  async identity(key: string) {
    const { path } = await this.location(key);
    const observed = await this.statFile(path);
    return observed
      ? `${observed.dev}:${observed.ino}:${observed.size}:${observed.mtimeMs}:${observed.ctimeMs}`
      : null;
  }

  private async statFile(path: string) {
    try {
      const info = await lstat(path);
      if (!info.isFile() || info.nlink !== 1) throw unavailable();
      return info;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  async deleteOrphan(key: string, expectedIdentity: string) {
    const { path, root } = await this.location(key);
    if ((await this.identity(key)) !== expectedIdentity) return;
    await unlink(path);
    await this.syncRoot(root);
  }

  /** Keep a durable private rollback copy until the database deletion marker has committed. */
  async deleteKnown(key: string, size: number, checksum: string) {
    const { path, root } = await this.location(key);
    const bytes = await this.read(key, size, checksum);
    const staged = await open(join(root, '.cleanup-' + key), 'wx', 0o600);
    try {
      if (this.ownerUid !== undefined && process.getuid?.() !== this.ownerUid)
        await staged.chown(this.ownerUid, -1);
      await staged.writeFile(bytes);
      await staged.sync();
    } finally {
      await staged.close();
    }
    await this.syncRoot(root);
    await unlink(path);
    await this.syncRoot(root);
  }

  async settleKnown(key: string, deleted: boolean) {
    const { path, root } = await this.location(key);
    const staged = join(root, '.cleanup-' + key);
    if (!(await this.statFile(staged))) return;
    if (deleted || (await this.statFile(path))) await unlink(staged);
    else await rename(staged, path);
    await this.syncRoot(root);
  }

  async read(key: string, size: number, checksum: string): Promise<Buffer> {
    if (size < 1 || size > CLUB_LOGO_MAX_BYTES) throw unavailable();
    try {
      const { path } = await this.location(key);
      const observed = await lstat(path);
      if (!observed.isFile() || observed.isSymbolicLink() || observed.nlink !== 1)
        throw unavailable();
      const file = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      try {
        const info = await file.stat();
        if (
          !info.isFile() ||
          info.ino !== observed.ino ||
          info.dev !== observed.dev ||
          info.size !== size
        )
          throw unavailable();
        const bytes = Buffer.alloc(size + 1);
        let offset = 0;
        while (offset < bytes.length) {
          const { bytesRead } = await file.read(bytes, offset, bytes.length - offset, offset);
          if (bytesRead === 0) break;
          offset += bytesRead;
        }
        if (offset !== size || mediaChecksum(bytes.subarray(0, size)) !== checksum)
          throw unavailable();
        return bytes.subarray(0, size);
      } finally {
        await file.close();
      }
    } catch {
      throw unavailable();
    }
  }
}
