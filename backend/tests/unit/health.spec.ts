import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApplication } from '../../src/main';

describe('foundation HTTP health', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it('boots without a database or default accounts and serves a safe liveness response', async () => {
    app = await createApplication();
    await app.init();

    await request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
  });
  it('returns unavailable rather than an internal failure when readiness lacks database configuration', async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      app = await createApplication();
      await app.init();
      const response = await request(app.getHttpServer()).get('/ready').expect(503);
      expect(response.body.error.code).toBe('TEMPORARILY_UNAVAILABLE');
    } finally {
      if (previous === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previous;
    }
  });
});
