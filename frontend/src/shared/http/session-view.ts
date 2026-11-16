import { HttpFailure } from './client';
import type {
  PreparationActionCode,
  PreparationCapabilities,
  PreparationCapability,
  SeasonRoleCode,
  SeasonRoleHint,
  SessionView,
  SharedMasterKind,
} from './session-store';

const sharedMasterKinds = new Set<SharedMasterKind>([
  'CLUB_MASTER',
  'STADIUM_MASTER',
  'PLAYER_MASTER',
]);
const seasonRoleCodes = new Set<SeasonRoleCode>([
  'SEASON_MANAGER',
  'REGISTRATION_OFFICER',
  'SCHEDULING_OFFICER',
  'RESULTS_OFFICER',
]);
const preparationActionCodes = new Set<PreparationActionCode>(['PREPARE_REGULATION_CHANGE']);

function safeId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(value);
}
function projectSeasonRoles(value: unknown): SeasonRoleHint[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const projected = new Map<string, SeasonRoleHint>();
  for (const item of value) {
    if (
      item &&
      typeof item === 'object' &&
      'seasonId' in item &&
      safeId(item.seasonId) &&
      'roleCode' in item &&
      typeof item.roleCode === 'string' &&
      seasonRoleCodes.has(item.roleCode as SeasonRoleCode)
    ) {
      const hint = { seasonId: item.seasonId, roleCode: item.roleCode as SeasonRoleCode };
      projected.set(`${hint.seasonId}:${hint.roleCode}`, hint);
    }
  }
  return [...projected.values()].sort(
    (left, right) =>
      left.seasonId.localeCompare(right.seasonId) || left.roleCode.localeCompare(right.roleCode),
  );
}
function projectCapabilities(value: unknown): PreparationCapabilities | undefined {
  if (!value || typeof value !== 'object' || !('direct' in value) || !('delegated' in value))
    return undefined;
  const project = (items: unknown): PreparationCapability[] => {
    if (!Array.isArray(items)) return [];
    const projected = new Map<string, PreparationCapability>();
    for (const item of items) {
      if (
        item &&
        typeof item === 'object' &&
        'seasonId' in item &&
        safeId(item.seasonId) &&
        'actionCode' in item &&
        typeof item.actionCode === 'string' &&
        preparationActionCodes.has(item.actionCode as PreparationActionCode)
      ) {
        const hint = {
          seasonId: item.seasonId,
          actionCode: item.actionCode as PreparationActionCode,
        };
        projected.set(`${hint.seasonId}:${hint.actionCode}`, hint);
      }
    }
    return [...projected.values()].sort(
      (left, right) =>
        left.seasonId.localeCompare(right.seasonId) ||
        left.actionCode.localeCompare(right.actionCode),
    );
  };
  return { direct: project(value.direct), delegated: project(value.delegated) };
}

/** Select only the authenticated account projection; never retain transport extras. */
export function sessionView(value: unknown): SessionView {
  if (!value || typeof value !== 'object') throw new HttpFailure(200, 'INVALID_RESPONSE');
  const data = value as Record<string, unknown>;
  if (
    ['id', 'personnelCode', 'fullName', 'username'].some((key) => typeof data[key] !== 'string') ||
    typeof data.changeRequired !== 'boolean'
  )
    throw new HttpFailure(200, 'INVALID_RESPONSE');
  if (data.changeRequired)
    return {
      account: {
        id: data.id as string,
        personnelCode: data.personnelCode as string,
        fullName: data.fullName as string,
        username: data.username as string,
      },
      changeRequired: true,
    };
  const roleHints = projectSeasonRoles(data.seasonRoles);
  const masterKinds = Array.isArray(data.sharedGrants)
    ? [
        ...new Set(
          data.sharedGrants.flatMap((grant: unknown) => {
            if (
              grant &&
              typeof grant === 'object' &&
              'masterKind' in grant &&
              typeof grant.masterKind === 'string' &&
              sharedMasterKinds.has(grant.masterKind as SharedMasterKind)
            )
              return [grant.masterKind as SharedMasterKind];
            return [];
          }),
        ),
      ]
    : undefined;
  const preparationCapabilities = projectCapabilities(data.preparationCapabilities);
  const canCreateSeason =
    typeof data.canCreateSeason === 'boolean'
      ? data.canCreateSeason
      : typeof data.createSeason === 'boolean'
        ? data.createSeason
        : undefined;
  return {
    account: {
      id: data.id as string,
      personnelCode: data.personnelCode as string,
      fullName: data.fullName as string,
      username: data.username as string,
    },
    changeRequired: data.changeRequired,
    ...(Array.isArray(data.systemRoles) && {
      systemAdministrator: data.systemRoles.some(
        (role: unknown) =>
          !!role &&
          typeof role === 'object' &&
          'roleCode' in role &&
          role.roleCode === 'SYSTEM_ADMINISTRATOR',
      ),
    }),
    ...(roleHints && {
      seasonRoles: roleHints,
      seasonManagerIds: roleHints.flatMap((role) =>
        role.roleCode === 'SEASON_MANAGER' ? [role.seasonId] : [],
      ),
    }),
    ...(typeof canCreateSeason === 'boolean' && { canCreateSeason }),
    ...(masterKinds && { sharedMasterKinds: masterKinds }),
    ...(preparationCapabilities && { preparationCapabilities }),
  };
}
