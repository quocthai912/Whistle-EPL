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
});
