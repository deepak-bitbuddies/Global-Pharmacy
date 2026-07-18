import type { FastifyReply } from "fastify"

/** The only way a controller should send a success response. */
export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: Record<string, unknown>,
): void {
  reply.code(statusCode).send({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  })
}
