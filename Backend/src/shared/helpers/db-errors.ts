import postgres from "postgres"
import { ConflictError } from "../errors/index.js"

const UNIQUE_VIOLATION = "23505"

/** Unwraps a Drizzle query error (which wraps the driver error in `.cause`) down to the underlying `postgres` driver error, if any. */
function findPostgresError(error: unknown): postgres.PostgresError | null {
  let current: unknown = error
  while (current) {
    if (current instanceof postgres.PostgresError) return current
    current = current instanceof Error ? current.cause : undefined
  }
  return null
}

/**
 * Re-throws a Postgres unique-constraint violation as a friendly `ConflictError`,
 * looked up by constraint name — e.g. `rethrowUniqueViolation(error, { branches_gstin_unique: "A branch with this GSTIN already exists" })`.
 * Any other error (validation, connection, an unmapped constraint) is re-thrown untouched.
 */
export function rethrowUniqueViolation(error: unknown, messagesByConstraint: Record<string, string>): never {
  const pgError = findPostgresError(error)
  if (pgError?.code === UNIQUE_VIOLATION && pgError.constraint_name) {
    const message = messagesByConstraint[pgError.constraint_name]
    if (message) throw new ConflictError(message)
  }
  throw error
}
