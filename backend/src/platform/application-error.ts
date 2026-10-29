export class ApplicationError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ReadonlyArray<{ field: string; code: string }>,
  ) {
    super(message);
  }
}
