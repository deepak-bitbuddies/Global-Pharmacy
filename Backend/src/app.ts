import type { FastifyInstance } from "fastify"

import { buildFastify } from "./core/config/fastify.js"
import { registerV1Routes } from "./api/v1/index.js"
import { sendSuccess } from "./shared/helpers/http-response.js"

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = await buildFastify()

  fastify.get("/health", async (_request, reply) => {
    sendSuccess(reply, { status: "ok", timestamp: Date.now() })
  })

  await registerV1Routes(fastify)

  return fastify
}
