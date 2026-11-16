import {
  Get,
  Controller,
  Post,
  Body,
  Module,
  Logger,
  BadRequestException,
  Res,
  type INestApplication,
} from '@nestjs/common';
import { Readable } from 'node:stream';
import type { Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { IsString } from 'class-validator';
import request from 'supertest';
import { SafeValidationPipe } from '../../src/platform/validation.pipe';
import { SafeErrorFilter } from '../../src/platform/error.filter';
import { ApplicationError } from '../../src/platform/application-error';
import {
  markValidatedFileResponse,
  ResponseEnvelopeInterceptor,
  withPaginationMeta,
} from '../../src/platform/response-envelope.interceptor';
import { lastValueFrom, of } from 'rxjs';

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
  @Get('file') file(@Res({ passthrough: true }) response: Response) {
    return markValidatedFileResponse(response, Buffer.from([137, 80, 78, 71]), 'image/png');
  }
  @Get('paged') paged() {
    return withPaginationMeta({ items: [{ id: 'one' }] }, { page: 1, pageSize: 20, total: 1 });
  }
  @Get('raw-buffer') rawBuffer() {
    return Buffer.from([137, 80, 78, 71]);
  }
  @Get('marked-json') markedJson(@Res({ passthrough: true }) response: Response) {
    markValidatedFileResponse(response, Buffer.from([137, 80, 78, 71]), 'image/png');
    return { result: 'ordinary JSON' };
  }
  @Get('lazy-file') lazyFile(@Res({ passthrough: true }) response: Response) {
    return markValidatedFileResponse(
      response,
      Readable.from([Buffer.from('lazy image bytes')]) as unknown as Buffer,
      'image/png',
    );
  }
  @Get('file-failure') fileFailure(@Res({ passthrough: true }) response: Response): never {
    markValidatedFileResponse(response, Buffer.from([137, 80, 78, 71]), 'image/png');
    throw new Error('Media details stay private.');
  }
  @Post('field-error') fieldError() {
    throw new ApplicationError(400, 'INVALID_INPUT', 'Dữ liệu không hợp lệ.', [
      { field: 'fullName', code: 'isString', message: 'Nhập họ tên hợp lệ.' },
      { field: 'bad field', code: 'isString', message: 'password=do-not-leak' },
      { field: 'nickname', code: 'isString', message: '<script>alert(1)</script>' },
      { field: 'description', code: 'isString', message: 'x'.repeat(241) },
      { field: 'english', code: 'isString', message: 'Value is invalid.' },
      { field: 'legacyField', code: 'isDefined' },
    ]);
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
    for (const [body, hasStringError] of [
      [{ fullName: 42 }, true],
      [{ fullName: 'Name', actorId: 'forged' }, false],
      [[], false],
    ] as const) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/test')
        .send(body)
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
      expect(response.body.requestId).toMatch(/^[a-f0-9-]{36}$/);
      expect(JSON.stringify(response.body)).not.toContain('forged');
      if (hasStringError)
        expect(response.body.error.details).toContainEqual({
          field: 'fullName',
          code: 'isString',
          message: 'Giá trị phải là chuỗi.',
        });
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
  it('places pagination metadata at the envelope level only for marked list responses', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/test/paged').expect(200);
    expect(response.body).toEqual({
      data: { items: [{ id: 'one' }] },
      meta: { page: 1, pageSize: 20, total: 1 },
      requestId: expect.stringMatching(/^[a-f0-9-]{36}$/),
    });
  });
  it('bypasses the success envelope only for explicitly marked image bytes', async () => {
    const payload = Buffer.from([137, 80, 78, 71]);
    let contentType: string | undefined;
    const response = {
      locals: {},
      statusCode: 200,
      setHeader: jest.fn((name: string, value: string) => {
        if (name === 'Content-Type') contentType = value;
      }),
      getHeader: jest.fn(() => contentType),
    };
    const file = markValidatedFileResponse(response as never, payload, 'image/png');
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ path: '/api/v1/media/current-logo' }),
        getResponse: () => response,
      }),
    };

    await expect(
      lastValueFrom(
        new ResponseEnvelopeInterceptor().intercept(context as never, {
          handle: () => of(file),
        }),
      ),
    ).resolves.toBe(file);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(response.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });
  it('keeps route-only, non-byte and non-success responses inside the envelope', async () => {
    const run = async (statusCode: number, payload: unknown, marked = false) => {
      let contentType: string | undefined;
      const response = {
        locals: {},
        statusCode,
        setHeader: jest.fn((name: string, value: string) => {
          if (name === 'Content-Type') contentType = value;
        }),
        getHeader: jest.fn(() => contentType),
      };
      if (marked)
        markValidatedFileResponse(response as never, Buffer.from('valid test image'), 'image/jpeg');
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ path: '/api/v1/media/current-logo' }),
          getResponse: () => response,
        }),
      };
      return lastValueFrom(
        new ResponseEnvelopeInterceptor().intercept(context as never, {
          handle: () => of(payload),
        }),
      );
    };

    const routeOnly = await run(200, { secret: 'not-a-file' });
    expect(routeOnly).toMatchObject({
      data: { secret: 'not-a-file' },
      requestId: expect.any(String),
    });
    const markedObject = await run(200, { secret: 'not-bytes' }, true);
    expect(markedObject).toMatchObject({
      data: { secret: 'not-bytes' },
      requestId: expect.any(String),
    });
    const markedFailure = await run(404, Buffer.from('missing'), true);
    expect(markedFailure).toMatchObject({
      data: Buffer.from('missing'),
      requestId: expect.any(String),
    });
  });
  it('rejects unnormalized MIME types when marking a file response', () => {
    const response = {
      locals: {},
      statusCode: 200,
      setHeader: jest.fn(),
      getHeader: jest.fn(),
    };
    expect(() =>
      markValidatedFileResponse(response as never, Buffer.from('test'), 'text/html' as never),
    ).toThrow();
    expect(() =>
      markValidatedFileResponse(response as never, Buffer.alloc(2_097_153), 'image/png'),
    ).toThrow();
  });
  it('streams explicitly validated image bytes and keeps marked-route failures JSON protected', async () => {
    const bytes = await request(app.getHttpServer())
      .get('/api/v1/test/file')
      .expect(200)
      .expect('Content-Type', /image\/png/)
      .expect('Cache-Control', 'no-store');
    expect(bytes.body).toEqual(Buffer.from([137, 80, 78, 71]));

    const failure = await request(app.getHttpServer()).get('/api/v1/test/file-failure').expect(500);
    expect(failure.headers['content-type']).toMatch(/^application\/json/);
    expect(failure.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(failure.body)).not.toContain('Media details stay private');
  });
  it('keeps marked ordinary JSON on the JSON media type', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/test/marked-json').expect(200);

    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body.data).toEqual({ result: 'ordinary JSON' });
  });
  it('rejects a lazy Readable before streaming and returns a filtered JSON error', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/test/lazy-file').expect(500);

    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(response.body.requestId).toMatch(/^[a-f0-9-]{36}$/);
  });
  it('serializes only bounded safe localized application field details', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/test/field-error')
      .send({})
      .expect(400);

    expect(response.body.error.details).toEqual([
      { field: 'fullName', code: 'isString', message: 'Nhập họ tên hợp lệ.' },
      { field: 'legacyField', code: 'isDefined' },
    ]);
  });
  it('keeps a bare Buffer inside the JSON success envelope', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/test/raw-buffer').expect(200);

    expect(response.headers['content-type']).toMatch(/^application\/json/);
    expect(response.body).toMatchObject({
      data: { type: 'Buffer', data: [137, 80, 78, 71] },
      requestId: expect.stringMatching(/^[a-f0-9-]{36}$/),
    });
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
