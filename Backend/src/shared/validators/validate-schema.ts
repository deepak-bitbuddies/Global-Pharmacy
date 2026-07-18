import type { ZodType } from "zod"

import { ValidationError } from "../errors/index.js"

/** Parses `data` against `schema`, throwing `ValidationError` on failure. */
export function validateSchema<T>(schema: ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new ValidationError("Validation failed", parsed.error.issues)
  }
  return parsed.data
}
