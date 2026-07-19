import { eq } from "drizzle-orm"

import { db } from "../../../../core/database/db.js"
import { InternalServerError } from "../../../../shared/errors/index.js"
import { authUsers, type AuthUserDocument, type NewAuthUserDocument } from "./model.js"

export async function findAuthUserByEmail(email: string): Promise<AuthUserDocument | null> {
  const [user] = await db
    .select()
    .from(authUsers)
    .where(eq(authUsers.email, email.toLowerCase()))
    .limit(1)

  return user ?? null
}

export async function createAuthUser(input: NewAuthUserDocument): Promise<AuthUserDocument> {
  const [user] = await db.insert(authUsers).values(input).returning()
  if (!user) {
    throw new InternalServerError("Failed to create authentication user")
  }
  return user
}
