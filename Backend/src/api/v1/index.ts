import type { FastifyInstance } from "fastify"

import { authRoutes } from "./admin/auth/index.js"

export async function registerV1Routes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(authRoutes, { prefix: "/api/v1/auth" })
}
