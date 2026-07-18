import type { FastifyInstance } from "fastify"

import { loginHandler } from "./controller.js"

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/login", loginHandler)
}
