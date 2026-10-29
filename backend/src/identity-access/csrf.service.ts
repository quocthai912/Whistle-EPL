import type { Request, Response } from 'express';
import { DatabaseService } from '../platform/database.service';
import { ApplicationError } from '../platform/application-error';
import { SecurityPrimitivesService } from './security-primitives.service';
import type { TransactionContext } from '../platform/transaction-context';

export const SESSION_COOKIE = '__Host-whistle-session';
export const PRELOGIN_COOKIE = '__Host-whistle-csrf-context';
export function readCookie(request: Request, name: string): string | undefined {
  const values = (request.headers.cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${name}=`));
  return values.length === 1 ? values[0].slice(name.length + 1) : undefined;
}
export function setAuthCookie(response: Response, name: string, value: string): void {
  response.cookie(name, value, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
}
export function clearAuthCookie(response: Response, name: string): void {
  response.clearCookie(name, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
}

export class CsrfService {
  constructor(
    private readonly database: DatabaseService,
    private readonly security = new SecurityPrimitivesService(),
  ) {}

  async bootstrap(id?: string): Promise<{ id: string; csrfToken: string }> {
    const candidate = this.validId(id) ? id! : this.security.createPreloginId();
    return this.database.write(
      [{ kind: 'security', key: `prelogin:${candidate}`, mode: 'exclusive' }],
      async () => {},
      async (context) => {
        const now = await context.now();
        const existing = await context.db.preloginCsrfContext.findUnique({
          where: { id: candidate },
        });
        if (existing && !existing.consumedAt && existing.expiresAt > now)
          return { id: existing.id, csrfToken: existing.csrfToken };
        const created = await context.db.preloginCsrfContext.create({
          data: {
            id: this.security.createPreloginId(),
            csrfToken: this.security.createCsrfToken(),
            createdAt: now,
            expiresAt: this.security.preloginExpiry(now),
          },
        });
        return { id: created.id, csrfToken: created.csrfToken };
      },
    );
  }
  validId(id?: string): boolean {
    return (
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    );
  }
  async requirePrelogin(
    context: TransactionContext,
    id: string,
    token: string,
    now: Date,
  ): Promise<void> {
    const row = await context.db.preloginCsrfContext.findUnique({ where: { id } });
    if (!row || row.consumedAt || row.expiresAt <= now) this.denied();
    this.requireToken(token, row!.csrfToken);
  }
  requireToken(actual: string | undefined, expected: string): void {
    if (!actual || !this.security.equalTokens(actual, expected)) this.denied();
  }
  requireOrigin(request: Request, expected: string): void {
    let origin = request.get('Origin');
    if (origin === undefined) {
      try {
        origin = new URL(request.get('Referer') ?? '').origin;
      } catch {
        this.denied();
      }
    }
    if (origin !== expected) this.denied();
  }
  denied(): never {
    throw new ApplicationError(403, 'CSRF_REJECTED', 'Yêu cầu không hợp lệ. Vui lòng tải lại.');
  }
}
