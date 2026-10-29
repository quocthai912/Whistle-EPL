import { DatabaseService } from '../platform/database.service';
import { AuditWriterService } from '../audit/audit-writer.service';
import { SecurityPrimitivesService } from '../identity-access/security-primitives.service';
import { normalizeIdentity, type PersonalIdentity } from './operator-contract';

export class BootstrapAdminService {
  constructor(private readonly database: DatabaseService) {}
  async execute(
    input: PersonalIdentity & { password: string },
    operator: string,
  ): Promise<{ accountId: string }> {
    const identity = normalizeIdentity(input);
    const security = new SecurityPrimitivesService();
    const passwordHash = await security.hashPassword(input.password);
    return this.database.write(
      [{ kind: 'system', key: 'bootstrap', mode: 'exclusive' }],
      async () => {},
      async (context) => {
        if (
          await context.db.systemRoleAssignment.count({
            where: { roleCode: 'SYSTEM_ADMINISTRATOR', revokedAt: null },
          })
        )
          throw new Error('Administrator already exists, including locked accounts. Use recovery.');
        const now = await context.now();
        const account = await context.db.account.create({
          data: {
            ...identity,
            passwordHash,
            mustChangePassword: true,
            temporaryPasswordExpiresAt: security.credentialExpiry(now),
            createdAt: now,
            updatedAt: now,
          },
        });
        await context.db.systemRoleAssignment.create({
          data: { accountId: account.id, roleCode: 'SYSTEM_ADMINISTRATOR', grantedAt: now },
        });
        await new AuditWriterService().append(context, {
          actor: { kind: 'OPERATOR', identity: operator },
          action: 'ADMIN_BOOTSTRAPPED',
          objectKind: 'Account',
          objectId: account.id,
          outcome: 'SUCCESS',
          after: {
            ...identity,
            state: 'ACTIVE',
            mustChangePassword: true,
            roleCode: 'SYSTEM_ADMINISTRATOR',
          },
        });
        return { accountId: account.id };
      },
    );
  }
}
