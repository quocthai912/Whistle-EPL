import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/platform/database.service';
import { SafeValidationPipe } from '../../src/platform/validation.pipe';
import { SafeErrorFilter } from '../../src/platform/error.filter';
import { ResponseEnvelopeInterceptor } from '../../src/platform/response-envelope.interceptor';
import { TestClock } from './test-clock';
import { createPhase1Fixtures, resetPhase1Fixtures } from './phase-1-fixtures';

const origin = 'https://whistle.test';
export const fixturePassword = 'Synthetic fixture credential 🦉 only';

export function administrationHarness() {
  const url = process.env.TEST_DATABASE_URL!;
  const clock = new TestClock(new Date('2026-11-05T03:00:00Z'));
  const database = new DatabaseService(url, clock);
  const observer = new DatabaseService(url);
  let app: INestApplication;
  let droppedKey: string | undefined;
  beforeAll(async () => {
    process.env.AUTH_ORIGIN = origin;
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue(database)
      .compile();
    app = module.createNestApplication();
    app.use((incoming: Request, response: Response, next: NextFunction) => {
      if (droppedKey && incoming.get('Idempotency-Key') === droppedKey) {
        droppedKey = undefined;
        // Simulate transport loss after the handler has committed and attempts to reply.
        response.json = () => {
          response.destroy();
          return response;
        };
      }
      next();
    });
    app.useGlobalPipes(new SafeValidationPipe());
    app.useGlobalFilters(new SafeErrorFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
    await observer.close();
    delete process.env.AUTH_ORIGIN;
  });
  const cookie = (response: request.Response) =>
    (response.headers['set-cookie'] as unknown as string[])[0].split(';')[0];

  async function login(username: string) {
    const http = request(app.getHttpServer());
    const pre = await http.get('/api/v1/auth/csrf').expect(200);
    const logged = await http
      .post('/api/v1/auth/login')
      .set('Origin', origin)
      .set('Cookie', cookie(pre))
      .set('X-CSRF-Token', pre.body.data.csrfToken)
      .send({ username, password: fixturePassword })
      .expect(200);
    const session = cookie(logged);
    const csrf = await http.get('/api/v1/auth/csrf').set('Cookie', session).expect(200);
    return {
      get: (path: string) => http.get('/api/v1' + path).set('Cookie', session),
      send: (path: string, body: object, key = randomUUID(), method: 'post' | 'patch' = 'post') =>
        http[method]('/api/v1' + path)
          .set('Origin', origin)
          .set('Cookie', session)
          .set('X-CSRF-Token', csrf.body.data.csrfToken)
          .set('Idempotency-Key', key)
          .send(body),
    };
  }
  async function fixtures() {
    clock.set(new Date('2026-11-05T03:00:00Z'));
    await resetPhase1Fixtures(url, 'RESET_ISOLATED_TEST_DATABASE');
    const data = await createPhase1Fixtures(url);
    await database.client.account.updateMany({
      data: { mustChangePassword: false, temporaryPasswordExpiresAt: null },
    });
    return data;
  }
  return {
    clock,
    observer: observer.client,
    login,
    fixtures,
    dropNextResponse: (key: string) => {
      droppedKey = key;
    },
  };
}
