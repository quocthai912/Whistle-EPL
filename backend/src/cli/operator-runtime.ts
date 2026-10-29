import { userInfo } from 'node:os';
import { randomUUID } from 'node:crypto';
import { operatorIdentity } from './operator-contract';
import { DatabaseService } from '../platform/database.service';

export async function runOperator(
  action: (database: DatabaseService, identity: string) => Promise<unknown>,
): Promise<void> {
  const correlation = randomUUID();
  let database: DatabaseService | undefined;
  try {
    // Root-owned installation, group/sudo allowlist and protected environment are mandatory.
    // No argv/environment display-name can replace the kernel-authenticated identity.
    if (process.platform !== 'linux' || !process.getuid)
      throw new Error('Reference Linux host required.');
    const identity = operatorIdentity({
      uid: process.getuid(),
      username: userInfo().username,
      sudoUid: process.env.SUDO_UID,
      sudoUser: process.env.SUDO_USER,
    });
    database = new DatabaseService(process.env.DATABASE_URL ?? '');
    await action(database, identity);
    console.log(`Operation completed. Correlation: ${correlation}`);
  } catch {
    console.error(
      `Operation failed. Check operator authorization, input and maintenance status. Correlation: ${correlation}`,
    );
    process.exitCode = 1;
  } finally {
    try {
      await database?.close();
    } catch {
      console.error(`Database disconnect needs operator inspection. Correlation: ${correlation}`);
      process.exitCode = 1;
    }
  }
}

export function commandArguments(allowed: readonly string[]): Record<string, string> {
  const result: Record<string, string> = {};
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    if (
      !allowed.includes(key) ||
      key in result ||
      args[index + 1] === undefined ||
      args[index + 1].startsWith('--')
    )
      throw new Error('Invalid command arguments.');
    result[key] = args[index + 1];
  }
  for (const key of allowed) if (!(key in result)) throw new Error('Missing command input.');
  return result;
}
