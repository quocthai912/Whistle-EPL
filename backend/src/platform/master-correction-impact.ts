import type { Request } from 'express';
import { hasSeasonRole } from '../identity-access/authority.policy';
import { missing } from '../identity-access/accounts.dto';
import type { SeasonDependenciesPort } from '../season-regulations/season-dependencies.port';
import type {
  HttpBusinessExecutionAdapter,
  HttpBusinessOperation,
} from './http-business-execution';
import { MissingLockResource } from './transaction-context';

export class MasterCorrectionImpactService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly dependencies: SeasonDependenciesPort,
  ) {}

  async list(
    request: Request,
    kind: 'club' | 'stadium',
    id: string,
    seasonId: string,
    authorize: HttpBusinessOperation['authorize'],
  ) {
    const source = {
      seasonId,
      resourceId: id,
      resourceKind: kind === 'club' ? 'CLUB' : 'STADIUM',
    } as const;
    const role = kind === 'club' ? 'SEASON_MANAGER' : 'SCHEDULING_OFFICER';
    try {
      return await this.execution.read(
        request,
        {
          locks: [
            { kind: 'season', key: seasonId, mode: 'shared' },
            { kind, key: id, mode: 'shared' },
          ],
          authorize: async (context, accountId, now) => {
            await authorize(context, accountId, now);
            if (!(await hasSeasonRole(context.db, accountId, [role], seasonId))) throw missing();
          },
          discover: async (db) => [
            ...(await this.dependencies.discover('masterImpact', db, source)).locks,
          ],
        },
        async (context) => {
          const result = await this.dependencies.read('masterImpact', context, source);
          return {
            status: result.status,
            affected: result.status === 'KNOWN' ? result.facts.affected : null,
          };
        },
      );
    } catch (error) {
      if (error instanceof MissingLockResource) throw missing();
      throw error;
    }
  }
}
