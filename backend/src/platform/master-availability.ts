import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import {
  assertRevision,
  conflict,
  invalid,
  missing,
  RevisionDto,
} from '../identity-access/accounts.dto';
import { IsString } from 'class-validator';
import { normalizeMultilineText } from './business-text';
import type {
  HttpBusinessExecutionAdapter,
  HttpBusinessOperation,
} from './http-business-execution';
import { MissingLockResource, type TransactionContext } from './transaction-context';

type MasterKind = 'club' | 'stadium';
type AvailabilityAction = 'discontinue' | 'resume';

export class MasterAvailabilityDto extends RevisionDto {
  @IsString()
  reason!: string;
}

/** Owning commands call this under their final exclusive master lock before creating a commitment. */
export async function assertAvailableForNewUse(
  context: TransactionContext,
  kind: MasterKind,
  id: string,
): Promise<void> {
  context.assertLockCoverage([{ kind, key: id, mode: 'exclusive' }]);
  const current =
    kind === 'club'
      ? await context.db.club.findUnique({ where: { id }, select: { discontinuedAt: true } })
      : await context.db.stadium.findUnique({ where: { id }, select: { discontinuedAt: true } });
  if (!current) throw missing();
  if (current.discontinuedAt)
    throw conflict('MASTER_DISCONTINUED', 'Hồ sơ đã ngừng sử dụng cho nghiệp vụ mới.');
}

export class MasterAvailabilityService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly audit: AuditWriterService,
  ) {}

  async record(
    request: Request,
    kind: MasterKind,
    id: string,
    action: AvailabilityAction,
    input: MasterAvailabilityDto,
    authorize: HttpBusinessOperation['authorize'],
  ) {
    const reason = normalizeMultilineText(input.reason);
    if (
      !reason ||
      [...reason].length > 2000 ||
      reason.includes('\0') ||
      Buffer.from(reason).toString() !== reason
    )
      throw invalid('Vui lòng nhập lý do không quá 2.000 ký tự.');
    try {
      return await this.execution.execute(
        request,
        { locks: [{ kind, key: id, mode: 'exclusive' }], authorize },
        async (context, accountId) => {
          const where = { id };
          const select = { revision: true, discontinuedAt: true };
          const db = context.db;
          const current =
            kind === 'club'
              ? await db.club.findUniqueOrThrow({ where, select })
              : await db.stadium.findUniqueOrThrow({ where, select });
          assertRevision(current.revision, input.expectedRevision);
          if ((action === 'discontinue') === !!current.discontinuedAt) throw conflict();
          const now = await context.now();
          const discontinuedAt = action === 'discontinue' ? now : null;
          const data = { discontinuedAt, updatedAt: now, revision: { increment: 1 } };
          const saved =
            kind === 'club'
              ? await db.club.update({ where, data, select })
              : await db.stadium.update({ where, data, select });
          await this.audit.append(context, {
            actor: { kind: 'ACCOUNT', accountId },
            action:
              kind === 'club'
                ? action === 'discontinue'
                  ? 'CLUB_DISCONTINUED'
                  : 'CLUB_RESUMED'
                : action === 'discontinue'
                  ? 'STADIUM_DISCONTINUED'
                  : 'STADIUM_RESUMED',
            objectKind: kind === 'club' ? 'Club' : 'Stadium',
            objectId: id,
            reason,
            outcome: 'SUCCESS',
            before: { discontinuedAt: current.discontinuedAt?.toISOString() ?? null },
            after: {
              discontinuedAt: discontinuedAt?.toISOString() ?? null,
              effectiveAt: now.toISOString(),
            },
          });
          return { id, revision: saved.revision.toString(), discontinuedAt: saved.discontinuedAt };
        },
      );
    } catch (error) {
      if (error instanceof MissingLockResource && error.kind === kind) throw missing();
      throw error;
    }
  }
}
