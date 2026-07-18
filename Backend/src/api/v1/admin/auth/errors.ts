import { ForbiddenError, UnauthorizedError } from "../../../../shared/errors/index.js"

export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super("Invalid email or password")
  }
}

export class AccountDisabledError extends ForbiddenError {
  constructor() {
    super("This account has been deactivated")
  }
}
