import { ValidationPipe, type ArgumentMetadata } from '@nestjs/common';
import { ApplicationError } from './application-error';

export class SafeValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transform: false,
      transformOptions: { enableImplicitConversion: false },
      validationError: { target: false, value: false },
      exceptionFactory: (errors) =>
        new ApplicationError(
          400,
          'VALIDATION_FAILED',
          'Dữ liệu không hợp lệ.',
          errors.flatMap((error) =>
            Object.keys(error.constraints ?? {}).map((code) => ({
              field: code === 'whitelistValidation' ? 'input' : error.property,
              code,
            })),
          ),
        ),
    });
  }
  override async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    if (
      metadata.type === 'body' &&
      metadata.data === undefined &&
      (value === null || typeof value !== 'object' || Array.isArray(value))
    ) {
      throw new ApplicationError(400, 'VALIDATION_FAILED', 'Dữ liệu phải là một đối tượng.');
    }
    return super.transform(value, metadata);
  }
}
