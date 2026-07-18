import { AppError } from "./app.error.js"

export class InternalServerError extends AppError {
  readonly statusCode = 500

  constructor(message = "Internal server error") {
    super(message)
  }
}
