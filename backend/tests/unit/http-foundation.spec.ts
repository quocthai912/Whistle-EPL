import { Controller, Post, Body, Module, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IsString } from 'class-validator';
import request from 'supertest';
import { SafeValidationPipe } from '../../src/platform/validation.pipe';
import { SafeErrorFilter } from '../../src/platform/error.filter';
import { ResponseEnvelopeInterceptor } from '../../src/platform/response-envelope.interceptor';

class Input {
  @IsString() fullName!: string;
}
@Controller('api/v1/test')
class TestController {
  @Post() write(@Body() input: Input) {
    return input;
  }
  @Post('failure') fail() {
    throw new Error('password=secret SQL SELECT stack');
  }
}
@Module({ controllers: [TestController] })
class TestModule {}

describe('safe HTTP validation and failure interface', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await NestFactory.create(TestModule, { logger: false });
    app.useGlobalPipes(new SafeValidationPipe());
    app.useGlobalFilters(new SafeErrorFilter());
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    await app.init();
  });
  afterAll(() => app.close());
  it('rejects unknown fields, incorrect types, arrays and raw diagnostics', async () => {
    for (const body of [{ fullName: 42 }, { fullName: 'Name', actorId: 'forged' }, []]) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/test')
        .send(body)
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
      expect(response.body.requestId).toMatch(/^[a-f0-9-]{36}$/);
      expect(JSON.stringify(response.body)).not.toContain('forged');
    }
    const response = await request(app.getHttpServer())
      .post('/api/v1/test/failure')
      .send({})
      .expect(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toMatch(/secret|SELECT|stack/);
  });
  it('returns the shared success envelope with a server-owned trace identifier', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/test')
      .send({ fullName: 'Nhân viên kiểm thử' })
      .expect(201);
    expect(response.body.data).toEqual({ fullName: 'Nhân viên kiểm thử' });
    expect(response.body.requestId).toMatch(/^[a-f0-9-]{36}$/);
  });
});
