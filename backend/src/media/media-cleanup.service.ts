import type { AuditWriterService } from '../audit/audit-writer.service';
import { BusinessExecutionService } from '../platform/business-execution';
import type { DatabaseService } from '../platform/database.service';
import type { LockResource } from '../platform/transaction-context';
import type { LocalMediaStore } from './local-media.store';
import type { OrphanInventoryService, OrphanObservation } from './orphan-inventory.service';

const grace = 24 * 60 * 60 * 1000;
const assetLock = (objectKey: string): LockResource => ({
  kind: 'masterIdentity',
  key: `media:${objectKey}`,
  mode: 'exclusive',
});
const technicalScope = {
  principal: { kind: 'system', actorKind: 'SYSTEM' },
  authority: async () => {},
} as const;

export class MediaCleanupService {
  private readonly execution: BusinessExecutionService;

  constructor(
    private readonly database: DatabaseService,
    private readonly store: LocalMediaStore,
    private readonly orphanInventory: OrphanInventoryService,
    private readonly audit: AuditWriterService,
  ) {
    this.execution = new BusinessExecutionService(database);
  }

  async recoverInterrupted(): Promise<void> {
    const { staged } = await this.store.inventory();
    for (const key of staged) {
      const candidate = await this.database.client.mediaAsset.findUnique({
        where: { provider_objectKey: { provider: 'LOCAL', objectKey: key } },
        select: { id: true, clubId: true },
      });
      if (!candidate) throw new Error('A cleanup rollback file has no matching asset metadata.');
      await this.settleKnown({ ...candidate, objectKey: key });
    }
  }

  /** Invoked by the daily operator job under the retention lock after verifying retained copies. */
  async execute(protectedCopies: ReadonlyMap<string, string>): Promise<number> {
    const cutoff = new Date((await this.database.now()).getTime() - grace);
    let failures = 0;
    let cursor: string | undefined;
    for (;;) {
      const candidates = await this.database.client.mediaAsset.findMany({
        where: {
          provider: 'LOCAL',
          contentDeletedAt: null,
          unreferencedAt: { lte: cutoff },
          ...(cursor ? { id: { gt: cursor } } : {}),
        },
        select: { id: true, clubId: true, objectKey: true, checksum: true },
        orderBy: { id: 'asc' },
        take: 100,
      });
      for (const candidate of candidates) {
        if (protectedCopies.get(candidate.objectKey) !== candidate.checksum) continue;
        try {
          await this.cleanKnown(candidate);
        } catch {
          failures += 1;
        }
      }
      if (candidates.length < 100) break;
      cursor = candidates.at(-1)!.id;
    }
    const records = await this.orphanInventory.read();
    const observed = new Map<string, OrphanObservation>();
    const { keys } = await this.store.inventory();
    for (const key of keys) {
      try {
        const previous = records.get(key);
        const result = await this.execution.execute(
          { ...technicalScope, locks: [assetLock(key)] },
          async (context) => {
            const registered = await context.db.mediaAsset.findUnique({
              where: { provider_objectKey: { provider: 'LOCAL', objectKey: key } },
              select: { id: true },
            });
            if (registered || protectedCopies.has(key)) return;
            const identity = await this.store.identity(key);
            if (!identity) return;
            const now = (await context.now()).getTime();
            if (!previous || previous.identity !== identity || previous.observedAt > now)
              return { identity, observedAt: now };
            if (now - previous.observedAt < grace) return previous;
            await this.store.deleteOrphan(key, identity);
          },
        );
        if (result) observed.set(key, result);
      } catch {
        failures += 1;
        const previous = records.get(key);
        if (previous) observed.set(key, previous);
      }
    }
    await this.orphanInventory.save(observed);
    return failures;
  }

  private scope(candidate: { id: string; clubId: string; objectKey: string }) {
    return {
      ...technicalScope,
      locks: [
        assetLock(candidate.objectKey),
        { kind: 'club', key: candidate.clubId, mode: 'exclusive' },
        { kind: 'mediaAsset', key: candidate.id, mode: 'exclusive' },
      ] satisfies LockResource[],
    };
  }

  private async cleanKnown(candidate: { id: string; clubId: string; objectKey: string }) {
    try {
      await this.execution.execute(this.scope(candidate), async (context) => {
        const asset = await context.db.mediaAsset.findUniqueOrThrow({
          where: { id: candidate.id },
          include: { club: { select: { currentLogoId: true } } },
        });
        const now = await context.now();
        if (
          !asset.unreferencedAt ||
          asset.contentDeletedAt ||
          asset.club.currentLogoId === asset.id ||
          now.getTime() - asset.unreferencedAt.getTime() < grace
        )
          return;
        await this.store.deleteKnown(asset.objectKey, asset.byteSize, asset.checksum);
        await context.db.mediaAsset.update({
          where: { id: asset.id },
          data: { contentDeletedAt: now },
        });
        await this.audit.appendSystemTechnical(context, {
          action: 'MEDIA_ASSET_CLEANED',
          objectKind: 'MediaAsset',
          objectId: asset.id,
          outcome: 'SUCCESS',
          before: { assetId: asset.id, contentDeletedAt: null },
          after: { assetId: asset.id, contentDeletedAt: now.toISOString() },
        });
      });
    } finally {
      await this.settleKnown(candidate);
    }
  }

  private async settleKnown(candidate: { id: string; clubId: string; objectKey: string }) {
    await this.execution.execute(this.scope(candidate), async (context) => {
      const asset = await context.db.mediaAsset.findUniqueOrThrow({
        where: { id: candidate.id },
        select: { contentDeletedAt: true },
      });
      await this.store.settleKnown(candidate.objectKey, !!asset.contentDeletedAt);
    });
  }
}
