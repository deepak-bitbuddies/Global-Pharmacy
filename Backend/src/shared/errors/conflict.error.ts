import { AppError } from "./app.error.js"

export class ConflictError extends AppError {
  readonly statusCode = 409

  constructor(message = "Conflict") {
    super(message)
  }
}
