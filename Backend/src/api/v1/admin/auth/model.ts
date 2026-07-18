import { Schema, model, type InferSchemaType } from "mongoose"

import type { WithId } from "../../../../shared/types/mongoose-helpers.js"

const authUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, default: "admin" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export type AuthUserDocument = WithId<InferSchemaType<typeof authUserSchema>>
// Reuse the existing users collection for authentication; this MVP does not
// create a separate authentication-only collection.
export const AuthUserModel = model("AuthUser", authUserSchema, "users")
