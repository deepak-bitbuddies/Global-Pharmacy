import type { FastifyInstance } from "fastify"

import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import {
  createPurchaseAnalysisExportHandler,
  deletePurchaseAnalysisBatchHandler,
  downloadPurchaseAnalysisExportHandler,
  listPurchaseAnalysisBatchesHandler,
  listPurchaseAnalysisExportsHandler,
  purchaseAnalysisAreasHandler,
  purchaseAnalysisCompaniesHandler,
  purchaseAnalysisItemsHandler,
  purchaseAnalysisLinesHandler,
  purchaseAnalysisPartiesHandler,
  purchaseAnalysisRoutesHandler,
  purchaseAnalysisSummaryHandler,
  purchaseAnalysisTypesHandler,
  uploadPurchaseAnalysisHandler,
} from "./controller.js"

// A fully separate module, entirely super_admin only — no branch_user access at all (unlike
// Stock/Sales/Purchase/Expenses, which a branch_user works with day to day, this is a one-off
// analysis dataset a super_admin imports and reviews).
export async function purchaseAnalysisRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", requireAuth)
  fastify.addHook("preHandler", requireRole(SystemRoleCode.SUPER_ADMIN))

  fastify.get("/", purchaseAnalysisLinesHandler)
  fastify.get("/summary", purchaseAnalysisSummaryHandler)
  fastify.get("/parties", purchaseAnalysisPartiesHandler)
  fastify.get("/items", purchaseAnalysisItemsHandler)
  fastify.get("/companies", purchaseAnalysisCompaniesHandler)
  fastify.get("/types", purchaseAnalysisTypesHandler)
  fastify.get("/areas", purchaseAnalysisAreasHandler)
  fastify.get("/routes", purchaseAnalysisRoutesHandler)
  fastify.post("/upload", uploadPurchaseAnalysisHandler)
  fastify.get("/batches", listPurchaseAnalysisBatchesHandler)
  fastify.delete("/batches/:id", deletePurchaseAnalysisBatchHandler)
  fastify.post("/exports", createPurchaseAnalysisExportHandler)
  fastify.get("/exports", listPurchaseAnalysisExportsHandler)
  fastify.get("/exports/:id/download", downloadPurchaseAnalysisExportHandler)
}
