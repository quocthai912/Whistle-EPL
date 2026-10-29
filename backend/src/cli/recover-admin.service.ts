import { DatabaseService } from '../platform/database.service';
import { AuditWriterService } from '../audit/audit-writer.service';
import { SecurityPrimitivesService } from '../identity-access/security-primitives.service';
import { recoveryInput, type RecoveryInput } from './operator-contract';

export class RecoverAdminService {
  constructor(private readonly database: DatabaseService) {}
  async execute(
    input: RecoveryInput & { password?: string },
    operator: string,
  ): Promise<{ accountId: string }> {
    const request = recoveryInput(input);
    const security = new SecurityPrimitivesService();
    const passwordHash = request.reset
      ? await security.hashPassword(input.password ?? '')
      : undefined;
    const target = await this.database.client.account.findUnique({
      where: { username: request.target },
    });
    if (!target) throw new Error('Existing administrator required.');
    return this.database.write(
      [
        { kind: 'system', key: 'last-active-admin', mode: 'exclusive' },
        { kind: 'account', key: target.id, mode: 'exclusive' },
      ],
      async (context) => {
        if (
          !(await context.db.systemRoleAssignment.count({
            where: { accountId: target.id, roleCode: 'SYSTEM_ADMINISTRATOR', revokedAt: null },
          }))
        )
          throw new Error('Existing administrator required.');
      },
      async (context) => {
        const before = await context.db.account.findUniqueOrThrow({ where: { id: target.id } });
        const now = await context.now();
        await context.recheckAuthority();
        const invalidated = await context.db.session.updateMany({
          where: { accountId: target.id, revokedAt: null },
          data: { revokedAt: now, revocationReason: 'ADMIN_RECOVERY' },
        });
        const account = await context.db.account.update({
          where: { id: target.id },
          data: {
            ...(request.unlock ? { state: 'ACTIVE' } : {}),
            ...(request.reset
              ? {
                  passwordHash,
                  mustChangePassword: true,
                  temporaryPasswordExpiresAt: security.credentialExpiry(now),
                  passwordChangedAt: null,
                }
              : {}),
            authRevision: { increment: 1 },
            revision: { increment: 1 },
            updatedAt: now,
          },
        });
        await new AuditWriterService().append(context, {
          actor: { kind: 'OPERATOR', identity: operator },
          action: 'ADMIN_RECOVERED',
          objectKind: 'Account',
          objectId: target.id,
          outcome: 'SUCCESS',
          reason: request.reason,
          before: { state: before.state, mustChangePassword: before.mustChangePassword },
          after: {
            state: account.state,
            mustChangePassword: account.mustChangePassword,
            sessionsInvalidated: invalidated.count,
            reset: request.reset,
            unlock: request.unlock,
          },
        });
        return { accountId: target.id };
      },
    );
  }
}
