import { HttpFailure } from './client';
import type { SessionView } from './session-store';

/** Select only the authenticated account projection; never retain transport extras. */
export function sessionView(value: unknown): SessionView {
  if (!value || typeof value !== 'object') throw new HttpFailure(200, 'INVALID_RESPONSE');
  const data = value as Record<string, unknown>;
  if (
    ['id', 'personnelCode', 'fullName', 'username'].some((key) => typeof data[key] !== 'string') ||
    typeof data.changeRequired !== 'boolean'
  )
    throw new HttpFailure(200, 'INVALID_RESPONSE');
  return {
    account: {
      id: data.id as string,
      personnelCode: data.personnelCode as string,
      fullName: data.fullName as string,
      username: data.username as string,
    },
    changeRequired: data.changeRequired,
    ...(!data.changeRequired &&
      Array.isArray(data.systemRoles) && {
        systemAdministrator: data.systemRoles.some(
          (role: unknown) =>
            !!role &&
            typeof role === 'object' &&
            'roleCode' in role &&
            role.roleCode === 'SYSTEM_ADMINISTRATOR',
        ),
      }),
    ...(!data.changeRequired &&
      Array.isArray(data.seasonRoles) && {
        seasonManagerIds: data.seasonRoles.flatMap((role: unknown) =>
          role &&
          typeof role === 'object' &&
          'roleCode' in role &&
          role.roleCode === 'SEASON_MANAGER' &&
          'seasonId' in role &&
          typeof role.seasonId === 'string'
            ? [role.seasonId]
            : [],
        ),
      }),
  };
}
