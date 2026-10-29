import { userInfo } from 'node:os';
import { randomUUID } from 'node:crypto';
import { operatorIdentity } from './operator-contract';
import { DatabaseService } from '../platform/database.service';
import { readFile } from 'node:fs/promises';
import { ApplicationError } from '../platform/application-error';

export function operatorErrorKind(error: unknown): string {
  if (error instanceof ApplicationError) return 'APPLICATION_ERROR';
  if (error instanceof TypeError) return 'TYPE_ERROR';
  if (error instanceof RangeError) return 'RANGE_ERROR';
  return error instanceof Error ? 'OPERATOR_ERROR' : 'UNKNOWN_ERROR';
}

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
    const uid = process.getuid();
    const identity = operatorIdentity({
      uid,
      username: userInfo().username,
      loginUid: uid === 0 ? (await readFile('/proc/self/loginuid', 'utf8')).trim() : undefined,
    });
    database = new DatabaseService(process.env.DATABASE_URL ?? '');
    await action(database, identity);
    console.log(`Operation completed. Correlation: ${correlation}`);
  } catch (error) {
    console.error(
      `Operation failed (${operatorErrorKind(error)}). Check operator authorization, input and maintenance status. Correlation: ${correlation}`,
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
      allowed.includes(args[index + 1])
    )
      throw new Error('Invalid command arguments.');
    result[key] = args[index + 1];
  }
  for (const key of allowed) if (!(key in result)) throw new Error('Missing command input.');
  return result;
}
