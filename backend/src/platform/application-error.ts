export type ApplicationErrorDetail = Readonly<{
  field: string;
  code: string;
  message?: string;
}>;

export class ApplicationError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ReadonlyArray<ApplicationErrorDetail>,
  ) {
    super(message);
  }
}

export class MasterNameConflict extends ApplicationError {
  constructor(readonly candidates: ReadonlyArray<{ id: string; code: string; name: string }>) {
    super(409, 'BASIS_CHANGED', 'Danh sách hồ sơ trùng tên đã thay đổi. Vui lòng kiểm tra lại.');
  }
}
