import mongoose from "mongoose"

import { env } from "../config/env.js"
import { logger } from "../logger/logger.js"

mongoose.set("strictQuery", true)

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on("connected", () => logger.info("[mongo] connected"))
  mongoose.connection.on("error", (err) =>
    logger.error({ err }, "[mongo] connection error"),
  )
  mongoose.connection.on("disconnected", () =>
    logger.warn("[mongo] disconnected"),
  )

  await mongoose.connect(env.MONGO_URI, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  })

}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect()
}
