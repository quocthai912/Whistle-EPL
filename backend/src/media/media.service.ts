import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import type { AuditWriterService } from '../audit/audit-writer.service';
import { assertRevision, conflict, missing } from '../identity-access/accounts.dto';
import { ApplicationError } from '../platform/application-error';
import type { HttpBusinessExecutionAdapter } from '../platform/http-business-execution';
import { MissingLockResource, type LockResource } from '../platform/transaction-context';
import { requireClubRead, requireClubWrite } from '../registry-registration/clubs.service';
import { LocalMediaStore, mediaChecksum } from './local-media.store';
import { normalizeClubLogo } from './media-validation';

export class MediaService {
  constructor(
    private readonly execution: HttpBusinessExecutionAdapter,
    private readonly audit: AuditWriterService,
    private readonly storage: LocalMediaStore,
  ) {}

  async upload(request: Request, clubId: string, expectedRevision: string, input: Buffer) {
    const normalized = await normalizeClubLogo(input);
    const assetId = randomUUID();
    const objectKey = `${assetId}.webp`;
    try {
      return await this.execution.execute(
        request,
        {
          locks: [
            { kind: 'masterIdentity', key: `media:${objectKey}`, mode: 'exclusive' },
            { kind: 'club', key: clubId, mode: 'exclusive' },
          ],
          authorize: requireClubWrite,
          discover: async (db) => {
            const club = await db.club.findUnique({
              where: { id: clubId },
              select: { currentLogoId: true },
            });
            return club?.currentLogoId
              ? [{ kind: 'mediaAsset', key: club.currentLogoId, mode: 'exclusive' }]
              : [];
          },
        },
        async (context, accountId) => {
          const { db } = context;
          const club = await db.club.findUniqueOrThrow({ where: { id: clubId } });
          assertRevision(club.revision, expectedRevision);
          const { bytes, width, height } = normalized;
          await this.storage.put(objectKey, bytes);
          await context.recheckAuthority();
          const now = await context.now();
          const content = { mimeType: 'image/webp', byteSize: bytes.length, width, height };
          await db.mediaAsset.create({
            data: {
              id: assetId,
              clubId,
              objectKey,
              ...content,
              checksum: mediaChecksum(bytes),
              storedBy: accountId,
              createdAt: now,
            },
            select: { id: true },
          });
          const previous = club.currentLogoId;
          const saved = await db.club.update({
            where: { id: clubId },
            data: { currentLogoId: assetId, revision: { increment: 1 }, updatedAt: now },
            select: { revision: true },
          });
          if (previous)
            await db.mediaAsset.update({ where: { id: previous }, data: { unreferencedAt: now } });
          const event = {
            actor: { kind: 'ACCOUNT' as const, accountId },
            objectKind: 'MediaAsset',
            objectId: assetId,
            outcome: 'SUCCESS' as const,
          };
          const owner = { assetId, ownerKind: 'CLUB', ownerId: clubId };
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
          return { id: clubId, revision: saved.revision.toString(), mediaAssetId: assetId };
        },
      );
    } catch (error) {
      if (error instanceof MissingLockResource && error.kind === 'club') throw missing();
      throw error;
    }
  }

  async remove(request: Request, clubId: string, expectedRevision: string, mediaAssetId: string) {
    try {
      return await this.execution.execute(
        request,
        {
          locks: [{ kind: 'club', key: clubId, mode: 'exclusive' }],
          authorize: requireClubWrite,
          discover: async (db) => {
            const club = await db.club.findUnique({
              where: { id: clubId },
              select: { currentLogoId: true },
            });
            return club?.currentLogoId
              ? [{ kind: 'mediaAsset', key: club.currentLogoId, mode: 'exclusive' }]
              : [];
          },
        },
        async (context, accountId) => {
          const { db } = context;
          const club = await db.club.findUniqueOrThrow({ where: { id: clubId } });
          assertRevision(club.revision, expectedRevision);
          if (club.currentLogoId !== mediaAssetId.toLowerCase()) throw conflict('BASIS_CHANGED');
          const now = await context.now();
          const saved = await db.club.update({
            where: { id: clubId },
            data: { currentLogoId: null, revision: { increment: 1 }, updatedAt: now },
            select: { revision: true },
          });
          await db.mediaAsset.update({
            where: { id: club.currentLogoId },
            data: { unreferencedAt: now },
          });
          const owner = { assetId: club.currentLogoId, ownerKind: 'CLUB', ownerId: clubId };
          await this.audit.append(context, {
            action: 'MEDIA_ASSET_DETACHED',
            actor: { kind: 'ACCOUNT', accountId },
            objectKind: 'MediaAsset',
            objectId: club.currentLogoId,
            outcome: 'SUCCESS',
            before: { ...owner, currentAssetId: club.currentLogoId },
            after: { ...owner, currentAssetId: null },
          });
          return { id: clubId, revision: saved.revision.toString(), mediaAssetId: null };
        },
      );
    } catch (error) {
      if (error instanceof MissingLockResource && error.kind === 'club') throw missing();
      throw error;
    }
  }

  async readCurrent(request: Request, id: string) {
    try {
      return await this.execution.read(
        request,
        {
          locks: [],
          authorize: requireClubRead,
          discover: async (db): Promise<LockResource[]> => {
            const asset = await db.mediaAsset.findUnique({
              where: { id },
              select: { clubId: true },
            });
            return asset
              ? [
                  { kind: 'club', key: asset.clubId, mode: 'shared' },
                  { kind: 'mediaAsset', key: id, mode: 'shared' },
                ]
              : [];
          },
        },
        async (context) => {
          const asset = await context.db.mediaAsset.findUnique({
            where: { id },
            include: { club: { select: { currentLogoId: true } } },
          });
          if (
            !asset ||
            asset.club.currentLogoId !== asset.id ||
            asset.contentDeletedAt ||
            asset.unreferencedAt
          )
            throw missing();
          if (asset.provider !== 'LOCAL' || asset.mimeType !== 'image/webp')
            throw new ApplicationError(
              503,
              'MEDIA_UNAVAILABLE',
              'Tạm thời không thể truy cập nội dung logo.',
            );
          return this.storage.read(asset.objectKey, asset.byteSize, asset.checksum);
        },
      );
    } catch (error) {
      if (
        error instanceof MissingLockResource ||
        (error instanceof ApplicationError && [401, 403].includes(error.status))
      )
        throw missing();
      throw error;
    }
  }
}
