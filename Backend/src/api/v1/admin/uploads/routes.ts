import type { FastifyInstance } from "fastify"

import { requireAuth } from "../../../../core/auth/guards.js"
import { listImportBatchesHandler, uploadFileHandler } from "./controller.js"

export async function uploadsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/", { preHandler: requireAuth }, uploadFileHandler)
  fastify.get("/", { preHandler: requireAuth }, listImportBatchesHandler)
}
