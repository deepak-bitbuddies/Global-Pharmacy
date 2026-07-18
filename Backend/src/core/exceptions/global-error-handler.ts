import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"

import { AppError } from "../../shared/errors/index.js"

export function globalErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  request.log.error(
    { err: error, method: request.method, url: request.url },
    "unhandled request error",
  )

  if (error instanceof AppError) {
    reply.code(error.statusCode).send({
      success: false,
      message: error.message,
      errors: error.errors,
    })
    return
  }

  const statusCode = error.statusCode ?? 500
  reply.code(statusCode).send({
    success: false,
    message: statusCode >= 500 ? "Internal server error" : error.message,
    errors: [],
  })
}
