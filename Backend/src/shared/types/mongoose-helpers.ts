import type { Types } from "mongoose"

/**
 * `InferSchemaType` reflects only the paths declared in the schema — it
 * does not add the `_id` Mongoose injects into every document at runtime.
 * Wrap every inferred document type with this so `_id` is actually typed.
 */
export type WithId<T> = T & { _id: Types.ObjectId }
