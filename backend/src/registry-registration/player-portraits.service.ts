import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import { assertRevision, conflict, missing } from '../identity-access/accounts.dto';
import { LocalMediaStore, mediaChecksum } from '../media/local-media.store';
import { normalizePlayerPortrait } from '../media/media-validation';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { MissingLockResource } from '../platform/transaction-context';
import { requirePlayerMasterWrite } from './registration-execution';

export class PlayerPortraitsService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly audit: AuditWriterService,
    private readonly storage: LocalMediaStore,
  ) {}

  async upload(request: Request, playerId: string, expectedRevision: string, input: Buffer) {
    const assetId = randomUUID();
    const objectKey = `${assetId}.webp`;
    try {
      return await this.execution.execute(
        request,
        {
          locks: [
            { kind: 'masterIdentity', key: `media:${objectKey}`, mode: 'exclusive' },
            { kind: 'player', key: playerId, mode: 'exclusive' },
          ],
          authorize: requirePlayerMasterWrite,
          discover: async (db) => {
            const player = await db.player.findUnique({
              where: { id: playerId },
              select: { currentPortraitId: true },
            });
            return player?.currentPortraitId
              ? [{ kind: 'mediaAsset', key: player.currentPortraitId, mode: 'exclusive' }]
              : [];
          },
        },
        async (context, accountId) => {
          const { db } = context;
          const player = await db.player.findUniqueOrThrow({ where: { id: playerId } });
          assertRevision(player.revision, expectedRevision);
          const { bytes, width, height } = await normalizePlayerPortrait(input);
          await this.storage.put(objectKey, bytes);
          await context.recheckAuthority();
          const now = await context.now();
          const content = { mimeType: 'image/webp', byteSize: bytes.length, width, height };
          await db.mediaAsset.create({
            data: {
              id: assetId,
              playerId,
              objectKey,
              ...content,
              checksum: mediaChecksum(bytes),
              storedBy: accountId,
              createdAt: now,
            },
            select: { id: true },
          });
          const previous = player.currentPortraitId;
          const saved = await db.player.update({
            where: { id: playerId },
            data: { currentPortraitId: assetId, revision: { increment: 1 }, updatedAt: now },
            select: { revision: true },
          });
          if (previous) {
            await db.mediaAsset.update({ where: { id: previous }, data: { unreferencedAt: now } });
          }
          const event = {
            actor: { kind: 'ACCOUNT' as const, accountId },
            objectKind: 'MediaAsset',
            objectId: assetId,
            outcome: 'SUCCESS' as const,
          };
          const owner = { assetId, ownerKind: 'PLAYER', ownerId: playerId };
          await this.audit.append(context, {
            ...event,
            action: 'MEDIA_ASSET_STORED',
            after: { ...owner, ...content },
          });
          await this.audit.append(context, {
            ...event,
            action: previous ? 'MEDIA_ASSET_REPLACED' : 'MEDIA_ASSET_ATTACHED',
            before: { ...owner, currentAssetId: previous },
            after: {
              ...owner,
              currentAssetId: assetId,
              ...(previous ? { previousAssetId: previous } : {}),
            },
          });
          return {
            id: playerId,
            revision: saved.revision.toString(),
            mediaAssetId: assetId,
            url: `/api/v1/media/${assetId}`,
          };
        },
      );
    } catch (error) {
      if (error instanceof MissingLockResource && error.kind === 'player') throw missing();
      throw error;
    }
  }

  async remove(request: Request, playerId: string, expectedRevision: string, mediaAssetId: string) {
    try {
      return await this.execution.execute(
        request,
        {
          locks: [{ kind: 'player', key: playerId, mode: 'exclusive' }],
          authorize: requirePlayerMasterWrite,
          discover: async (db) => {
            const player = await db.player.findUnique({
              where: { id: playerId },
              select: { currentPortraitId: true },
            });
            return player?.currentPortraitId
              ? [{ kind: 'mediaAsset', key: player.currentPortraitId, mode: 'exclusive' }]
              : [];
          },
        },
        async (context, accountId) => {
          const { db } = context;
          const player = await db.player.findUniqueOrThrow({ where: { id: playerId } });
          assertRevision(player.revision, expectedRevision);
          if (player.currentPortraitId !== mediaAssetId.toLowerCase())
            throw conflict('BASIS_CHANGED');
          await context.recheckAuthority();
          const now = await context.now();
          const saved = await db.player.update({
            where: { id: playerId },
            data: { currentPortraitId: null, revision: { increment: 1 }, updatedAt: now },
            select: { revision: true },
          });
          await db.mediaAsset.update({
            where: { id: player.currentPortraitId },
            data: { unreferencedAt: now },
          });
          const owner = {
            assetId: player.currentPortraitId,
            ownerKind: 'PLAYER',
            ownerId: playerId,
          };
          await this.audit.append(context, {
            action: 'MEDIA_ASSET_DETACHED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'MediaAsset',
            objectId: player.currentPortraitId,
            outcome: 'SUCCESS',
            before: { ...owner, currentAssetId: player.currentPortraitId },
            after: { ...owner, currentAssetId: null },
          });
          return { id: playerId, revision: saved.revision.toString(), mediaAssetId: null };
        },
      );
    } catch (error) {
      if (error instanceof MissingLockResource && error.kind === 'player') throw missing();
      throw error;
    }
  }
}
