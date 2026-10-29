import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { readCookie, SESSION_COOKIE } from './csrf.service';

/** Authentication admission only: owning use cases must recheck scoped authority at commit. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const mutation = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (mutation) this.auth.csrf.requireOrigin(request, process.env.AUTH_ORIGIN ?? '');
    await this.auth.authorize(
      readCookie(request, SESSION_COOKIE),
      request.get('X-CSRF-Token'),
      mutation,
    );
    return true;
  }
}
