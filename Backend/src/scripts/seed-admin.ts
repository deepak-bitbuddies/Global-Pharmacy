import { hash } from "bcryptjs"

import { connectDatabase, disconnectDatabase } from "../core/database/db.js"
import { createAuthUser, findAuthUserByEmail } from "../api/v1/admin/auth/index.js"
import { BCRYPT_SALT_ROUNDS } from "../shared/constants/auth.constants.js"
import { logger } from "../core/logger/logger.js"
import { SystemRoleCode } from "../shared/enums/index.js"

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@bitbuddies.com"
  await connectDatabase()

  if (await findAuthUserByEmail(email)) {
    logger.info({ email }, "[seed-admin] admin account already exists")
  } else {
    await createAuthUser({
      name: process.env.SEED_ADMIN_NAME ?? "Admin",
      email,
      passwordHash: await hash(process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!", BCRYPT_SALT_ROUNDS),
      role: SystemRoleCode.SUPER_ADMIN,
    })
    logger.info({ email }, "[seed-admin] admin account created")
  }

  await disconnectDatabase()
}

main().catch((err: unknown) => {
  logger.error({ err }, "[seed-admin] failed")
  process.exit(1)
})
