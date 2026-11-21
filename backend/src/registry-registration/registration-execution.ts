import type { Prisma } from '../generated/prisma/client';
import { conflict, denied, missing } from '../identity-access/accounts.dto';
import { hasSeasonRole } from '../identity-access/authority.policy';
import { assertAvailableForNewUse } from '../platform/master-availability';
import type { LockResource, TransactionContext } from '../platform/transaction-context';
import {
  unresolvedRegulationBasis,
  type RegulationActivationService,
} from '../season-regulations/regulation-activation.service';
import { loadRegulationContent } from '../season-regulations/regulation-content';
import { validateCompleteRegulationContent } from '../season-regulations/regulation-validation';

export async function canWritePlayerMaster(
  context: TransactionContext,
  accountId: string,
  now: Date,
): Promise<boolean> {
  return !!(await context.db.sharedMasterGrant.findFirst({
    where: { accountId, masterKind: 'PLAYER_MASTER', endedAt: null, grantedAt: { lte: now } },
    select: { id: true },
  }));
}

export async function requirePlayerMasterWrite(
  context: TransactionContext,
  accountId: string,
  now: Date,
): Promise<void> {
  if (!(await canWritePlayerMaster(context, accountId, now))) throw denied();
}

export async function requirePlayerMasterRead(
  context: TransactionContext,
  accountId: string,
  now: Date,
): Promise<void> {
  if (
    !(await canWritePlayerMaster(context, accountId, now)) &&
    !(await hasSeasonRole(context.db, accountId, ['REGISTRATION_OFFICER', 'SEASON_MANAGER']))
  )
    throw denied();
}

export async function requireSeasonRegistrationOfficer(
  context: TransactionContext,
  accountId: string,
  seasonId: string,
): Promise<void> {
  if (!(await hasSeasonRole(context.db, accountId, ['REGISTRATION_OFFICER'], seasonId)))
    throw denied();
}

export async function requireSeasonManager(
  context: TransactionContext,
  accountId: string,
  seasonId: string,
): Promise<void> {
  if (!(await hasSeasonRole(context.db, accountId, ['SEASON_MANAGER'], seasonId))) throw denied();
}

export async function requireSeasonRegistrationReader(
  context: TransactionContext,
  accountId: string,
  seasonId: string,
): Promise<void> {
  if (
    !(await hasSeasonRole(
      context.db,
      accountId,
      ['REGISTRATION_OFFICER', 'SEASON_MANAGER'],
      seasonId,
    ))
  )
    throw missing();
}

export function assertIndependentApprover(
  preparedBy: string,
  editorIds: readonly string[],
  actorAccountId: string,
): void {
  if (preparedBy === actorAccountId || editorIds.includes(actorAccountId)) throw denied();
}

/** Discovers the season exclusive lock plus any due waiting regulation locks in D096 order. */
export async function discoverSeasonWithDueRules(
  db: Prisma.TransactionClient,
  seasonId: string,
  activation: RegulationActivationService,
): Promise<LockResource[]> {
  return [
    { kind: 'season', key: seasonId, mode: 'exclusive' },
    ...(await activation.discoverWaiting(db, seasonId)),
  ];
}

/**
 * Resolves any due approved-waiting regulation inside the caller's transaction, enforces that
 * the season is OPEN and has an effective regulation version, and returns it with its windows.
 */
export async function resolveEffectiveRegulationForWrite(
  context: TransactionContext,
  seasonId: string,
  activation: RegulationActivationService,
) {
  const season = await context.db.season.findUnique({
    where: { id: seasonId },
    select: { id: true, state: true, currentRegulationVersionId: true },
  });
  if (!season) throw missing();
  if (season.state !== 'OPEN')
    throw conflict('STATE_CONFLICT', 'Mùa giải đã đóng và không thể thực hiện thao tác này.');

  const waiting = await activation.findWaiting(context.db, seasonId);
  if (waiting) {
    await activation.resolveDue(context, waiting, async () =>
      validateCompleteRegulationContent(await loadRegulationContent(context, waiting.id)),
    );
  }

  const refreshed = await context.db.season.findUniqueOrThrow({
    where: { id: seasonId },
    select: { state: true, currentRegulationVersionId: true },
  });
  if (refreshed.state !== 'OPEN')
    throw conflict('STATE_CONFLICT', 'Mùa giải đã đóng và không thể thực hiện thao tác này.');
  if (!refreshed.currentRegulationVersionId)
    throw conflict(
      'STATE_CONFLICT',
      'Mùa giải chưa có quy định đang có hiệu lực để tiếp nhận hoặc xác nhận.',
    );

  const effective = await context.db.regulationVersion.findUnique({
    where: { id: refreshed.currentRegulationVersionId },
    include: { registrationWindows: { orderBy: [{ opensAt: 'asc' }, { id: 'asc' }] } },
  });
  if (!effective || effective.seasonId !== seasonId || effective.state !== 'EFFECTIVE')
    throw conflict('BASIS_CHANGED', 'Không xác định được phiên bản quy định đang có hiệu lực.');
  return effective;
}

/**
 * Resolves due waiting regulations and samples a post-lock decision instant.
 * Ensures no waiting regulation crossed effectivity by that instant, then rechecks authority.
 */
export async function resolveEffectiveRegulationWithInstant(
  context: TransactionContext,
  seasonId: string,
  activation: RegulationActivationService,
) {
  let regulation = await resolveEffectiveRegulationForWrite(context, seasonId, activation);
  await context.recheckAuthority();
  let resolvedAt = await context.now();
  const lateDue = await context.db.regulationVersion.findFirst({
    where: { seasonId, state: 'APPROVED_WAITING', proposedEffectiveAt: { lte: resolvedAt } },
    select: { id: true },
  });
  if (lateDue) {
    regulation = await resolveEffectiveRegulationForWrite(context, seasonId, activation);
    await context.recheckAuthority();
    resolvedAt = await context.now();
    const stillDue = await context.db.regulationVersion.findFirst({
      where: { seasonId, state: 'APPROVED_WAITING', proposedEffectiveAt: { lte: resolvedAt } },
      select: { id: true },
    });
    if (stillDue) throw unresolvedRegulationBasis();
  }
  await context.recheckAuthority();
  return { regulation, resolvedAt };
}

export async function requireOpenSeason(
  context: TransactionContext,
  seasonId: string,
): Promise<void> {
  const season = await context.db.season.findUnique({
    where: { id: seasonId },
    select: { state: true },
  });
  if (!season) throw missing();
  if (season.state !== 'OPEN')
    throw conflict('STATE_CONFLICT', 'Mùa giải đã đóng và không thể chỉnh sửa hồ sơ.');
}

/** Verifies D099 master availability under the caller's exclusive Club/Stadium locks. */
export async function assertMastersAvailableForNewUse(
  context: TransactionContext,
  masters: { clubId?: string; stadiumId?: string },
): Promise<void> {
  if (masters.clubId) await assertAvailableForNewUse(context, 'club', masters.clubId);
  if (masters.stadiumId) await assertAvailableForNewUse(context, 'stadium', masters.stadiumId);
}
