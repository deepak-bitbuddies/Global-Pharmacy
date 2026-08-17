import type { FastifyInstance } from "fastify"

import { requireAuth } from "../../../../core/auth/guards.js"
import {
  branchesHandler,
  branchSalesHandler,
  companiesHandler,
  createExportHandler,
  dailyCollectionHandler,
  dashboardSummaryHandler,
  daySalesDetailHandler,
  downloadExportHandler,
  expiryReportHandler,
  grossProfitHandler,
  itemWiseSalesHandler,
  listExportsHandler,
  nonMovingDetailHandler,
  nonMovingHandler,
  purchaseByCompanyHandler,
  purchaseDetailHandler,
  purchaseSummaryHandler,
  salesByCompanyHandler,
  salesDetailHandler,
  stockReportHandler,
  stockSummaryHandler,
  stockValueByCompanyHandler,
  supplierGroupsHandler,
  suppliersHandler,
  topGrossProfitPercentHandler,
  topReturnsHandler,
  topStockByValueHandler,
  zeroOrderAlertsHandler,
} from "./controller.js"

export async function reportsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", requireAuth)

  fastify.get("/branches", branchesHandler)
  fastify.get("/companies", companiesHandler)
  fastify.get("/suppliers", suppliersHandler)
  fastify.get("/supplier-groups", supplierGroupsHandler)
  fastify.post("/exports", createExportHandler)
  fastify.get("/exports", listExportsHandler)
  fastify.get("/exports/:id/download", downloadExportHandler)
  fastify.get("/sales/item-wise", itemWiseSalesHandler)
  fastify.get("/sales/detail", salesDetailHandler)
  fastify.get("/sales/by-branch", branchSalesHandler)
  fastify.get("/sales/gross-profit", grossProfitHandler)
  fastify.get("/sales/gross-profit/top-by-pct", topGrossProfitPercentHandler)
  fastify.get("/sales/top-returns", topReturnsHandler)
  fastify.get("/sales/by-company", salesByCompanyHandler)
  fastify.get("/purchase", purchaseSummaryHandler)
  fastify.get("/purchase/detail", purchaseDetailHandler)
  fastify.get("/purchase/by-company", purchaseByCompanyHandler)
  fastify.get("/stock", stockReportHandler)
  fastify.get("/stock/summary", stockSummaryHandler)
  fastify.get("/stock/by-company", stockValueByCompanyHandler)
  fastify.get("/stock/top-by-value", topStockByValueHandler)
  fastify.get("/stock/zero-order-alerts", zeroOrderAlertsHandler)
  fastify.get("/stock/expiry", expiryReportHandler)
  fastify.get("/stock/non-moving", nonMovingHandler)
  fastify.get("/stock/non-moving/detail", nonMovingDetailHandler)
  fastify.get("/collection/daily", dailyCollectionHandler)
  fastify.get("/collection/detail", daySalesDetailHandler)
  fastify.get("/dashboard/summary", dashboardSummaryHandler)
}
