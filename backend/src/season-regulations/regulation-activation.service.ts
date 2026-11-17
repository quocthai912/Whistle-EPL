import { conflict } from '../identity-access/accounts.dto';
import type { Prisma } from '../generated/prisma/client';
import { ApplicationError } from '../platform/application-error';
import type { TransactionContext } from '../platform/transaction-context';
import type {
  DependencyResult,
  DependencyKind,
  SeasonDependenciesPort,
} from './season-dependencies.port';
import type { CompleteRegulationContent } from './regulation-validation';
import type { AuditWriterService } from '../audit/audit-writer.service';

export function unresolvedRegulationBasis() {
  return new ApplicationError(
    503,
    'REGULATION_BASIS_UNRESOLVED',
    'Chưa thể xác định quy định đang có hiệu lực. Vui lòng thử lại sau.',
  );
}

function available<K extends DependencyKind>(result: DependencyResult<K>) {
  if (result.status === 'UNAVAILABLE')
    throw new ApplicationError(
      503,
      'DEPENDENCY_UNAVAILABLE',
      'Chưa thể xác minh dữ liệu liên quan.',
    );
  return result.facts;
}

export class RegulationActivationService {
  constructor(
    private readonly dependencies: SeasonDependenciesPort,
    private readonly audit: AuditWriterService,
  ) {}

  async findWaiting(db: Prisma.TransactionClient, seasonId: string) {
    return db.regulationVersion.findFirst({
      where: { seasonId, state: 'APPROVED_WAITING' },
      select: { id: true, seasonId: true, caseId: true, proposedEffectiveAt: true },
    });
  }

  async discoverWaiting(db: Prisma.TransactionClient, seasonId: string) {
    const waiting = await this.findWaiting(db, seasonId);
    if (!waiting) return [];
    return [
      { kind: 'regulationVersion', key: waiting.id, mode: 'exclusive' } as const,
      ...(await this.discover(db, waiting)),
    ];
  }

  async requireResolvedBasis(context: TransactionContext, seasonId: string) {
    const now = await context.now();
    const due = await context.db.regulationVersion.findFirst({
      where: { seasonId, state: 'APPROVED_WAITING', proposedEffectiveAt: { lte: now } },
      select: { id: true },
    });
    if (due) throw unresolvedRegulationBasis();
  }

  async resolveDue(
    context: TransactionContext,
    target: { id: string; seasonId: string },
    loadContent: () => Promise<CompleteRegulationContent>,
  ): Promise<'ACTIVATED' | 'BLOCKED' | 'NO_OP'> {
    const version = await context.db.regulationVersion.findFirst({
      where: { id: target.id, seasonId: target.seasonId, state: 'APPROVED_WAITING' },
      include: { season: { select: { state: true, currentRegulationVersionId: true } } },
    });
    if (!version?.proposedEffectiveAt || version.proposedEffectiveAt > (await context.now()))
      return 'NO_OP';
    const effectiveAt = version.proposedEffectiveAt;
    const content = await loadContent();
    let blocked = version.season.state !== 'OPEN';
    if (!blocked) {
      try {
        await this.verifyCompatibility(context, target, content, effectiveAt);
      } catch (error) {
        if (!(error instanceof ApplicationError) || error.code !== 'BASIS_CHANGED') throw error;
        blocked = true;
      }
    }
    await context.recheckAuthority();
    const processedAt = await context.now();
    if (effectiveAt > processedAt) return 'NO_OP';
    if (blocked) {
      await context.db.regulationVersion.update({
        where: { id: target.id },
        data: {
          state: 'ACTIVATION_BLOCKED',
          activationProcessedAt: processedAt,
          revision: { increment: 1n },
        },
      });
      await this.audit.appendSystemTechnical(context, {
        action: 'REGULATION_ACTIVATION_BLOCKED',
        objectKind: 'RegulationVersion',
        objectId: target.id,
        seasonId: target.seasonId,
        outcome: 'FAILURE',
        reason: 'Điều kiện áp dụng quy định đã thay đổi.',
        before: { versionId: target.id, state: version.state },
        after: {
          versionId: target.id,
          state: 'ACTIVATION_BLOCKED',
          proposedEffectiveAt: effectiveAt.toISOString(),
          blockedAt: processedAt.toISOString(),
        },
      });
      return 'BLOCKED';
    }
    await this.setEffective(
      context,
      target,
      version.season.currentRegulationVersionId,
      effectiveAt,
      processedAt,
    );
    await this.audit.appendSystemTechnical(context, {
      action: 'REGULATION_ACTIVATED',
      objectKind: 'RegulationVersion',
      objectId: target.id,
      seasonId: target.seasonId,
      outcome: 'SUCCESS',
      before: { versionId: target.id, state: version.state },
      after: {
        versionId: target.id,
        state: 'EFFECTIVE',
        activeFrom: effectiveAt.toISOString(),
        processedAt: processedAt.toISOString(),
      },
    });
    return 'ACTIVATED';
  }

  private async catalogRequest(
    db: Prisma.TransactionClient,
    request: {
      seasonId: string;
      candidateVersionId: string;
    },
  ) {
    const rows = await db.regulationVersion.findMany({
      where: { seasonId: request.seasonId },
      select: { goalTypes: { select: { code: true } }, cardTypes: { select: { code: true } } },
    });
    return {
      ...request,
      catalogCodes: [
        ...new Set(
          rows.flatMap((row) => [...row.goalTypes, ...row.cardTypes].map((entry) => entry.code)),
        ),
      ].sort(),
    };
  }

  async discover(db: Prisma.TransactionClient, target: { id: string; seasonId: string }) {
    const request = { seasonId: target.seasonId, candidateVersionId: target.id };
    const current = await db.season.findUnique({
      where: { id: target.seasonId },
      select: { currentRegulationVersionId: true },
    });
    const catalog = await this.catalogRequest(db, request);
    const sources = [
      await this.dependencies.discover('registrationCompatibility', db, request),
      await this.dependencies.discover('scheduleFreeze', db, request),
      await this.dependencies.discover('officialResultFreeze', db, request),
      await this.dependencies.discover('referencedCatalogUsage', db, catalog),
    ];
    const locks = sources.flatMap((source) => source.locks);
    if (current?.currentRegulationVersionId)
      locks.push({
        kind: 'regulationVersion',
        key: current.currentRegulationVersionId,
        mode: 'exclusive',
      });
    return locks;
  }

  async verifyCompatibility(
    context: TransactionContext,
    target: { id: string; seasonId: string },
    content: CompleteRegulationContent,
    effectiveAt: Date,
  ) {
    const request = { seasonId: target.seasonId, candidateVersionId: target.id };
    const catalog = await this.catalogRequest(context.db, request);
    const registrations = available(
      await this.dependencies.read('registrationCompatibility', context, request),
    );
    const schedule = available(await this.dependencies.read('scheduleFreeze', context, request));
    const results = available(
      await this.dependencies.read('officialResultFreeze', context, request),
    );
    const usage = available(
      await this.dependencies.read('referencedCatalogUsage', context, catalog),
    );
    const sameFields = <K extends keyof CompleteRegulationContent>(
      basis: Partial<Record<K, unknown>>,
    ) => Object.entries(basis).every(([key, value]) => content[key as K] === value);

    if (
      (schedule?.structure && !sameFields(schedule.structure)) ||
      (schedule?.planning && !sameFields(schedule.planning))
    )
      throw conflict('BASIS_CHANGED');
    if (results?.frozenRules) {
      const { rankingPriority, ...fields } = results.frozenRules;
      if (
        !sameFields(fields) ||
        rankingPriority.join(',') !==
          content.rankingPriority.map((entry) => entry.criterionCode).join(',')
      )
        throw conflict('BASIS_CHANGED');
    }
    for (const interval of registrations?.intervalCompositions ?? []) {
      if (interval.endsAt && new Date(interval.endsAt) <= effectiveAt) continue;
      const counts = new Map<string, { squad: number; nonHomegrown: number }>();
      for (const entry of interval.registrations) {
        if (entry.u21 === null || (!entry.u21 && entry.homegrown === null))
          throw new ApplicationError(
            503,
            'DEPENDENCY_UNAVAILABLE',
            'Chưa đủ dữ liệu phân loại cầu thủ.',
          );
        if (entry.u21) continue;
        const count = counts.get(entry.clubId) ?? { squad: 0, nonHomegrown: 0 };
        count.squad++;
        if (!entry.homegrown) count.nonHomegrown++;
        if (count.squad > content.squadLimit || count.nonHomegrown > content.nonHomegrownLimit)
          throw conflict('BASIS_CHANGED');
        counts.set(entry.clubId, count);
      }
    }
    for (const reference of usage?.references ?? []) {
      const source = await context.db.regulationVersion.findFirst({
        where: { id: reference.sourceVersionId, seasonId: target.seasonId },
        select: {
          goalTypes: {
            where: { code: reference.catalogCode },
            select: { isOwnGoal: true },
          },
          cardTypes: {
            where: { code: reference.catalogCode },
            select: { meaning: true },
          },
        },
      });
      if (!source || (!source.goalTypes.length && !source.cardTypes.length))
        throw conflict('BASIS_CHANGED');
      for (const goal of source.goalTypes) {
        const candidate = content.goalTypes.find((entry) => entry.code === reference.catalogCode);
        if (!candidate || candidate.isOwnGoal !== goal.isOwnGoal) throw conflict('BASIS_CHANGED');
      }
      for (const card of source.cardTypes) {
        const candidate = content.cardTypes.find((entry) => entry.code === reference.catalogCode);
        if (!candidate || candidate.meaning !== card.meaning) throw conflict('BASIS_CHANGED');
      }
    }
  }

  async setEffective(
    context: TransactionContext,
    target: { id: string; seasonId: string },
    currentVersionId: string | null,
    activeFrom: Date,
    processedAt: Date,
  ) {
    if (currentVersionId) {
      const closed = await context.db.regulationVersion.updateMany({
        where: {
          id: currentVersionId,
          seasonId: target.seasonId,
          state: 'EFFECTIVE',
          activeFrom: { lt: activeFrom },
        },
        data: { state: 'SUPERSEDED', activeUntil: activeFrom, revision: { increment: 1n } },
      });
      if (closed.count !== 1) throw conflict('BASIS_CHANGED');
    }
    const updated = await context.db.regulationVersion.update({
      where: { id: target.id },
      data: {
        state: 'EFFECTIVE',
        activeFrom,
        activationProcessedAt: processedAt,
        revision: { increment: 1n },
      },
      select: { id: true, revision: true },
    });
    await context.db.season.update({
      where: { id: target.seasonId },
      data: {
        currentRegulationVersionId: target.id,
        revision: { increment: 1n },
        updatedAt: processedAt,
      },
    });
    return updated;
  }
}
