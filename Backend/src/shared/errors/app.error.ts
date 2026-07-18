export abstract class AppError extends Error {
  abstract readonly statusCode: number
  readonly errors: unknown[]

  constructor(message: string, errors: unknown[] = []) {
    super(message)
    this.name = new.target.name
    this.errors = errors
  }
}
