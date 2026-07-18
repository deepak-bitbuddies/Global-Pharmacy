import pino from "pino"

const isProduction = process.env.NODE_ENV === "production"

export const loggerOptions = {
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
}

/** Shared logger for non-Fastify modules (db, redis, queues, sockets). */
export const logger = pino(loggerOptions)
