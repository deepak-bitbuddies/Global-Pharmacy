import { AppError } from "./app.error.js"

export class NotFoundError extends AppError {
  readonly statusCode = 404

  constructor(message = "Not found") {
    super(message)
  }
}
