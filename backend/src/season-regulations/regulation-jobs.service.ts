import { ConsoleLogger, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type {
  BusinessExecutionPrincipal,
  BusinessExecutionService,
} from '../platform/business-execution';
import type { DatabaseService } from '../platform/database.service';
import { ApplicationError } from '../platform/application-error';
import type { RegulationActivationService } from './regulation-activation.service';
import { loadRegulationContent } from './regulation-content';
import { validateCompleteRegulationContent } from './regulation-validation';

export class RegulationJobsService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new ConsoleLogger(RegulationJobsService.name, { json: true });
  private active?: Promise<unknown>;
  private stopping = false;

  constructor(
    private readonly database: DatabaseService | null,
    private readonly execution: BusinessExecutionService | null,
    private readonly activation: RegulationActivationService,
  ) {}

  onApplicationBootstrap() {
    void this.runScheduled();
  }

  async onModuleDestroy() {
    this.stopping = true;
    await this.active;
  }

  @Cron('0 * * * * *', { waitForCompletion: true })
  runScheduled() {
    if (!this.database || this.stopping || process.env.NODE_ENV === 'test') return;
    if (this.active) return this.active;
    this.active = this.processDue()
      .then((result) => {
        const record = { event: 'REGULATION_DUE_RUN', ...result };
        if (result.failed) this.logger.warn(record);
        else this.logger.log(record);
      })
      .catch(() => this.logger.error({ event: 'REGULATION_DUE_DISCOVERY_FAILED' }))
      .finally(() => {
        this.active = undefined;
      });
    return this.active;
  }

  async processDue(
    principal: Extract<BusinessExecutionPrincipal, { kind: 'system' | 'operator' }> = {
      kind: 'system',
      actorKind: 'SYSTEM',
    },
  ) {
    const database = this.database;
    const execution = this.execution;
    if (!database || !execution) throw new Error('Regulation activation requires a database.');
    const cutoff = await database.now();
    const candidates = await database.client.regulationVersion.findMany({
      where: { state: 'APPROVED_WAITING', proposedEffectiveAt: { lte: cutoff } },
      orderBy: [{ proposedEffectiveAt: 'asc' }, { seasonId: 'asc' }, { id: 'asc' }],
      select: { id: true, seasonId: true, caseId: true },
    });
    const result = { activated: 0, blocked: 0, skipped: 0, failed: 0 };
    for (const candidate of candidates) {
      try {
        const status = await execution.execute(
          {
            principal,
            locks: [
              { kind: 'season', key: candidate.seasonId, mode: 'exclusive' },
              { kind: 'regulationCase', key: candidate.caseId, mode: 'exclusive' },
              { kind: 'regulationVersion', key: candidate.id, mode: 'exclusive' },
            ],
            authority: async () => undefined,
            discover: (db) => this.activation.discover(db, candidate),
          },
          (context) =>
            this.activation.resolveDue(context, candidate, async () =>
              validateCompleteRegulationContent(await loadRegulationContent(context, candidate.id)),
            ),
        );
        if (status === 'ACTIVATED') result.activated++;
        else if (status === 'BLOCKED') result.blocked++;
        else result.skipped++;
      } catch (error) {
        result.failed++;
        const knownCauses = ['MAINTENANCE', 'DEPENDENCY_UNAVAILABLE', 'TRANSACTION_UNAVAILABLE'];
        const category =
          error instanceof ApplicationError && knownCauses.includes(error.code)
            ? error.code
            : 'EXECUTION_ERROR';
        this.logger.warn({
          event: 'REGULATION_DUE_CANDIDATE_FAILED',
          seasonId: candidate.seasonId,
          versionId: candidate.id,
          runAt: cutoff.toISOString(),
          category,
        });
      }
    }
    return result;
  }
}
