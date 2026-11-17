import { ValidationPipe, type ArgumentMetadata } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ApplicationError } from './application-error';

const validationMessages: Record<string, string> = {
  isDefined: 'Trường này là bắt buộc.',
  isNotEmpty: 'Trường này không được để trống.',
  isString: 'Giá trị phải là chuỗi.',
  isBoolean: 'Giá trị phải là đúng hoặc sai.',
  isInt: 'Giá trị phải là số nguyên.',
  isNumber: 'Giá trị phải là số.',
  isDateString: 'Ngày hoặc thời điểm không hợp lệ.',
  isUUID: 'Mã định danh không hợp lệ.',
  isEmail: 'Địa chỉ email không hợp lệ.',
  minLength: 'Giá trị ngắn hơn mức cho phép.',
  maxLength: 'Giá trị vượt quá độ dài cho phép.',
  min: 'Giá trị nhỏ hơn giới hạn cho phép.',
  max: 'Giá trị vượt quá giới hạn cho phép.',
  isArray: 'Giá trị phải là danh sách.',
  arrayMinSize: 'Danh sách có quá ít mục.',
  arrayMaxSize: 'Danh sách có quá nhiều mục.',
  whitelistValidation: 'Trường này không được hỗ trợ.',
};

function appendPath(parent: string, property: string): string {
  if (!parent) return property || 'input';
  return /^\d+$/.test(property) ? `${parent}[${property}]` : `${parent}.${property}`;
}

function fieldDetails(
  errors: ValidationError[],
): { field: string; code: string; message: string }[] {
  const details: { field: string; code: string; message: string }[] = [];
  const visit = (items: ValidationError[], parent = '') => {
    for (const error of items) {
      if (details.length >= 64) return;
      const path = appendPath(parent, error.property);
      for (const code of Object.keys(error.constraints ?? {}).sort()) {
        if (details.length >= 64) return;
        details.push({
          field: code === 'whitelistValidation' && !parent ? 'input' : path,
          code,
          message: validationMessages[code] ?? 'Giá trị không hợp lệ.',
        });
      }
      if (error.children?.length) visit(error.children, path);
    }
  };
  visit(errors);
  return details;
}

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
          fieldDetails(errors),
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
