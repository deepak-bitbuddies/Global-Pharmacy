import type { FastifyInstance } from "fastify"

/**
 * Sub-30ms budget tracking: logs every request's wall-clock time so slow
 * routes surface immediately instead of hiding in aggregate metrics.
 */
export function registerRequestLogger(fastify: FastifyInstance): void {
  fastify.addHook("onRequest", async (request) => {
    ;(request as { startTime?: number }).startTime = performance.now()
  })

  fastify.addHook("onResponse", async (request, reply) => {
    const startTime = (request as { startTime?: number }).startTime
    const durationMs = startTime ? performance.now() - startTime : undefined
    fastify.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        durationMs: durationMs ? Number(durationMs.toFixed(2)) : undefined,
      },
      "request completed",
    )
  })
}
