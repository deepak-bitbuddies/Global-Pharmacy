import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { env } from "../config/env.js"
import { logger } from "../logger/logger.js"

const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
})

export const db = drizzle({ client: sql })

export async function connectDatabase(): Promise<void> {
  await sql`select 1`
  logger.info("[postgres] connected")
}

export async function disconnectDatabase(): Promise<void> {
  await sql.end({ timeout: 5 })
  logger.info("[postgres] disconnected")
}
