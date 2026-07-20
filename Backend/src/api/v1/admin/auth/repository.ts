import { eq } from "drizzle-orm"

import { db, type DbOrTransaction } from "../../../../core/database/db.js"
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

/** `dbClient` accepts a transaction (`tx` from `db.transaction(async (tx) => ...)`) so this insert can participate in a caller's transaction; defaults to the module-level `db`. */
export async function createAuthUser(input: NewAuthUserDocument, dbClient: DbOrTransaction = db): Promise<AuthUserDocument> {
  const [user] = await dbClient.insert(authUsers).values(input).returning()
  if (!user) {
    throw new InternalServerError("Failed to create authentication user")
  }
  return user
}

export async function deleteAuthUserByBranchId(branchId: string, dbClient: DbOrTransaction = db): Promise<void> {
  await dbClient.delete(authUsers).where(eq(authUsers.branchId, branchId))
}
