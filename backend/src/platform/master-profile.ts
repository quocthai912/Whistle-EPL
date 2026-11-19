import { Prisma } from '../generated/prisma/client';
import { invalid } from '../identity-access/accounts.dto';
import { MasterNameConflict } from './application-error';
import type { LockResource } from './transaction-context';

type Master = 'club' | 'stadium';
type DuplicateReview = { candidateIds: readonly string[] };

export function boundedMasterText(value: string, limit: number): string {
  if (
    !value ||
    [...value].length > limit ||
    value.includes('\0') ||
    Buffer.from(value).toString() !== value
  )
    throw invalid();
  return value;
}

export function masterName(value: string, limit: number): string {
  return boundedMasterText(value.normalize('NFC').trim().replace(/\s+/gu, ' '), limit);
}

export function masterCode(value: string): string {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,31}$/.test(trimmed)) throw invalid();
  return trimmed.toUpperCase();
}

export async function masterNameGuards(
  db: Prisma.TransactionClient,
  kind: Master,
  names: string[],
): Promise<LockResource[]> {
  const rows = await db.$queryRaw<{ key: string }[]>`
    SELECT normalize(lower(name), NFC) AS key FROM unnest(ARRAY[${Prisma.join(names)}]::text[]) AS name
  `;
  return rows.map(({ key }) => ({
    kind: 'masterIdentity',
    key: `${kind}:name:${key}`,
    mode: 'exclusive',
  }));
}

export async function checkMasterDuplicate(
  db: Prisma.TransactionClient,
  kind: Master,
  name: string,
  review: DuplicateReview | undefined,
  excludedId?: string,
) {
  const table = kind === 'club' ? Prisma.sql`club` : Prisma.sql`stadium`;
  const candidates = await db.$queryRaw<{ id: string; code: string; name: string }[]>`
    SELECT id, code, name FROM ${table}
    WHERE normalize(lower(name), NFC) = normalize(lower(${name}::text), NFC)
      ${excludedId ? Prisma.sql`AND id <> ${excludedId}::uuid` : Prisma.empty}
    ORDER BY id
  `;
  const reviewed = review?.candidateIds.map((id) => id.toLowerCase()).sort() ?? [];
  if (
    candidates.length !== reviewed.length ||
    candidates.some((candidate, index) => candidate.id !== reviewed[index])
  )
    throw new MasterNameConflict(candidates);
}
