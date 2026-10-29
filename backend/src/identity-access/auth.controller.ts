import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  CsrfService,
  PRELOGIN_COOKIE,
  SESSION_COOKIE,
  readCookie,
  setAuthCookie,
  clearAuthCookie,
} from './csrf.service';
import { ApplicationError } from '../platform/application-error';
import { AuthService } from './auth.service';
import { LoginDto, ChangePasswordDto, EmptyBodyPipe } from './auth.dto';
import { trustedSource } from './trusted-source.policy';

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    @Inject(CsrfService) private readonly csrf: CsrfService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}
  private origin(): string {
    const value = process.env.AUTH_ORIGIN;
    try {
      if (!value || new URL(value).origin !== value || !value.startsWith('https://'))
        throw new Error();
    } catch {
      throw new ApplicationError(503, 'AUTH_CONFIGURATION', 'Cấu hình xác thực chưa sẵn sàng.');
    }
    return value!;
  }
  @Get('csrf')
  async bootstrap(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    this.origin();
    const token = readCookie(request, SESSION_COOKIE);
    if (token) {
      try {
        return { csrfToken: (await this.auth.current(token)).csrfToken };
      } catch (error) {
        if (!(error instanceof ApplicationError) || error.status !== 401) throw error;
        clearAuthCookie(response, SESSION_COOKIE);
      }
    }
    const context = await this.csrf.bootstrap(readCookie(request, PRELOGIN_COOKIE));
    setAuthCookie(response, PRELOGIN_COOKIE, context.id);
    return { csrfToken: context.csrfToken };
  }
  @Get('session')
  async session(@Req() request: Request) {
    return (await this.auth.current(readCookie(request, SESSION_COOKIE))).data;
  }
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() input: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.csrf.requireOrigin(request, this.origin());
    const result = await this.auth.login(
      input,
      trustedSource(
        request,
        (process.env.AUTH_TRUSTED_PROXY_CIDRS ?? '').split(',').filter(Boolean),
      ),
      readCookie(request, PRELOGIN_COOKIE) ?? '',
      request.get('X-CSRF-Token') ?? '',
      response.locals.requestId,
    );
    setAuthCookie(response, SESSION_COOKIE, result.token!);
    clearAuthCookie(response, PRELOGIN_COOKIE);
    return result.data;
  }
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    new EmptyBodyPipe().transform(request.body);
    this.csrf.requireOrigin(request, this.origin());
    await this.auth.current(
      readCookie(request, SESSION_COOKIE),
      request.get('X-CSRF-Token'),
      true,
      response.locals.requestId,
    );
    clearAuthCookie(response, SESSION_COOKIE);
    return { acknowledged: true };
  }
  @Post('password/change')
  @HttpCode(200)
  async changePassword(
    @Body() input: ChangePasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.csrf.requireOrigin(request, this.origin());
    const result = await this.auth.changePassword(
      readCookie(request, SESSION_COOKIE),
      request.get('X-CSRF-Token'),
      input,
      response.locals.requestId,
    );
    clearAuthCookie(response, SESSION_COOKIE);
    return result;
  }
}
