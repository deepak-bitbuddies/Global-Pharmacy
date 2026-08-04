import type { FastifyInstance } from "fastify"

import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import { bulkUploadFileHandler, listImportBatchesHandler, uploadCycleStatusHandler, uploadFileHandler } from "./controller.js"

export async function uploadsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post("/", { preHandler: requireAuth }, uploadFileHandler)
  fastify.post("/bulk", { preHandler: [requireAuth, requireRole(SystemRoleCode.SUPER_ADMIN)] }, bulkUploadFileHandler)
  fastify.get("/", { preHandler: requireAuth }, listImportBatchesHandler)
  fastify.get("/cycle-status", { preHandler: requireAuth }, uploadCycleStatusHandler)
}
