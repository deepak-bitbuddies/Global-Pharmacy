import { env } from "./core/config/env.js"
import { connectDatabase, disconnectDatabase } from "./core/database/db.js"
// import { redis } from "./core/cache/redis.js" // disabled until Redis is set up locally
import { buildApp } from "./app.js"
import { logger } from "./core/logger/logger.js"
import { attachSocketServer } from "./core/realtime/socket.js"

// BullMQ queues (notifications, invoices, audit logs) are deferred along with the order/rider
// domains they serve. Socket.io itself is back — see `core/realtime/socket.ts` — scoped for now
// to bulk-import status pushes; broaden it if/when rider tracking returns.

async function main(): Promise<void> {
  await connectDatabase()

  const fastify = await buildApp()
  await fastify.ready()
  attachSocketServer(fastify)

  await fastify.listen({ host: env.HOST, port: env.PORT })
  logger.info(`Server listening on http://${env.HOST}:${env.PORT}`)

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutting down gracefully")
    try {
      await fastify.close()
      await Promise.all([disconnectDatabase()]) // redis.quit() disabled along with the redis import above
      process.exit(0)
    } catch (err) {
      logger.error({ err }, "Error during shutdown")
      process.exit(1)
    }
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"))
  process.on("SIGINT", () => void shutdown("SIGINT"))
}

main().catch((err: unknown) => {
  logger.error({ err }, "Fatal error during startup")
  process.exit(1)
})
