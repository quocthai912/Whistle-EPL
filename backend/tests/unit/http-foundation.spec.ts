import {
  Controller,
  Post,
  Body,
  Module,
  Logger,
  BadRequestException,
  type INestApplication,
} from '@nestjs/common';
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
  @Post('property') property(@Body('fullName') fullName: string) {
    return { fullName };
  }
  @Post('expected') expected() {
    throw new BadRequestException('internal diagnostic');
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
  it('preserves property-bound body values while still rejecting non-object whole bodies', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/test/property')
      .send({ fullName: 'Nhân viên kiểm thử' })
      .expect(201);
    expect(response.body.data).toEqual({ fullName: 'Nhân viên kiểm thử' });
    await request(app.getHttpServer()).post('/api/v1/test').send([]).expect(400);
  });
  it('logs only a safe unexpected-error event with the client trace identifier', async () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    try {
      const response = await request(app.getHttpServer())
        .post('/api/v1/test/failure')
        .send({})
        .expect(500);
      expect(log).toHaveBeenCalledWith({
        event: 'UNEXPECTED_EXCEPTION',
        requestId: response.body.requestId,
      });
      expect(JSON.stringify(log.mock.calls)).not.toMatch(/password|secret|SELECT|stack/);
      expect(response.body.error).toEqual({
        code: 'INTERNAL_ERROR',
        message: 'Có lỗi hệ thống. Vui lòng thử lại sau.',
      });
      log.mockClear();
      await request(app.getHttpServer()).post('/api/v1/test/expected').send({}).expect(400);
      await request(app.getHttpServer()).post('/api/v1/test').send([]).expect(400);
      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });
});
