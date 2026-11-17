import type { AuditWriterService } from '../audit/audit-writer.service';
import { conflict, denied, missing } from '../identity-access/accounts.dto';
import type { ReceiptCommand, ReceiptOutcome } from '../platform/command-receipt.service';
import type { TransactionContext } from '../platform/transaction-context';
import type { RegulationActivationService } from './regulation-activation.service';
import type { CompleteRegulationContent } from './regulation-validation';

export class RegulationDecisionService {
  constructor(
    private readonly activation: RegulationActivationService,
    private readonly audit: AuditWriterService,
  ) {}

  async approve(
    context: TransactionContext,
    command: ReceiptCommand,
    loadContent: (versionId: string) => Promise<CompleteRegulationContent>,
  ): Promise<ReceiptOutcome> {
    const version = await context.db.regulationVersion.findUnique({
      where: { id: command.targetId },
      include: { season: true, editors: { select: { accountId: true } } },
    });
    if (!version) throw missing();
    if (
      version.preparedBy === command.accountId ||
      version.editors.some((editor) => editor.accountId === command.accountId)
    )
      throw denied();
    if (version.revision.toString() !== command.payload.expectedRevision)
      throw conflict('REVISION_CONFLICT');
    if (version.season.state !== 'OPEN' || version.state !== 'SUBMITTED' || !version.submittedAt)
      throw conflict('STATE_CONFLICT');
    const waiting = await this.activation.findWaiting(context.db, version.seasonId);
    if (waiting) {
      const resolved = await this.activation.resolveDue(context, waiting, () =>
        loadContent(waiting.id),
      );
      if (resolved === 'NO_OP') throw conflict('STATE_CONFLICT');
    }
    const season = await context.db.season.findUniqueOrThrow({
      where: { id: version.seasonId },
      select: { currentRegulationVersionId: true },
    });
    if (season.currentRegulationVersionId !== (command.payload.currentBasisVersionId ?? null))
      throw conflict('BASIS_CHANGED');

    const content = await loadContent(version.id);
    const reviewTime = await context.now();
    await this.activation.verifyCompatibility(
      context,
      version,
      content,
      content.proposedEffectiveAt ? new Date(content.proposedEffectiveAt) : reviewTime,
    );
    await context.recheckAuthority();
    const recordedAt = await context.now();
    const scheduled = content.effectiveMode === 'SCHEDULED';
    const effectiveAt = scheduled ? new Date(content.proposedEffectiveAt!) : recordedAt;
    if (scheduled && effectiveAt <= recordedAt) throw conflict('STATE_CONFLICT');
    const reason = command.payload.reason;
    const decision = {
      approvedAt: recordedAt,
      decidedAt: recordedAt,
      decidedBy: command.accountId,
      decisionReason: reason,
    };
    const updated = await context.db.regulationVersion.update({
      where: { id: version.id },
      data: {
        ...decision,
        ...(scheduled ? { state: 'APPROVED_WAITING', revision: { increment: 1n } } : {}),
      },
      select: { id: true, revision: true },
    });
    const result = scheduled
      ? updated
      : await this.activation.setEffective(
          context,
          version,
          season.currentRegulationVersionId,
          effectiveAt,
          recordedAt,
        );
    await this.audit.append(context, {
      actor: { kind: 'ACCOUNT', accountId: command.accountId },
      action: 'REGULATION_APPROVED',
      objectKind: 'RegulationVersion',
      objectId: version.id,
      seasonId: version.seasonId,
      outcome: 'SUCCESS',
      reason,
      before: { versionId: version.id, versionNumber: version.versionNumber, state: version.state },
      after: {
        versionId: version.id,
        versionNumber: version.versionNumber,
        state: scheduled ? 'APPROVED_WAITING' : 'EFFECTIVE',
        effectiveMode: content.effectiveMode,
        effectiveAt: effectiveAt.toISOString(),
      },
    });
    return { status: 200, data: { id: result.id, revision: result.revision.toString() } };
  }
}
