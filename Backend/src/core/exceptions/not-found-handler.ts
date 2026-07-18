import type { FastifyReply, FastifyRequest } from "fastify"

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): void {
  reply.code(404).send({
    success: false,
    message: `Route ${request.method} ${request.url} not found`,
    errors: [],
  })
}
