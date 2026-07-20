import Fastify, { type FastifyInstance } from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import multipart from "@fastify/multipart"

import { env } from "./env.js"
import { loggerOptions } from "../logger/logger.js"
import { registerJwtPlugin } from "../auth/jwt.plugin.js"
import { registerRequestLogger } from "../middlewares/request-logger.middleware.js"
import { globalErrorHandler } from "../exceptions/global-error-handler.js"
import { notFoundHandler } from "../exceptions/not-found-handler.js"

export async function buildFastify(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: loggerOptions,
    trustProxy: true,
    disableRequestLogging: true, // we log ourselves via registerRequestLogger
  })

  await fastify.register(helmet, { global: true })
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
    credentials: true,
  })
  await registerJwtPlugin(fastify)
  await fastify.register(multipart, {
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB — Marg exports are small, this just guards against bad uploads
  })

  registerRequestLogger(fastify)

  fastify.setErrorHandler(globalErrorHandler)
  fastify.setNotFoundHandler(notFoundHandler)

  return fastify
}
