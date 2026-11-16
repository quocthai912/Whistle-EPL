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
