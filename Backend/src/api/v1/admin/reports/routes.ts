import type { FastifyInstance } from "fastify"

import { requireAuth } from "../../../../core/auth/guards.js"
import {
  branchesHandler,
  branchSalesHandler,
  cashInHandHandler,
  companiesHandler,
  dailyCollectionHandler,
  dashboardSummaryHandler,
  daySalesDetailHandler,
  expiryReportHandler,
  grossProfitHandler,
  itemWiseSalesHandler,
  nonMovingHandler,
  outstandingHandler,
  purchaseDetailHandler,
  purchaseSummaryHandler,
  stockReportHandler,
  stockSummaryHandler,
  stockValueByCompanyHandler,
  zeroOrderAlertsHandler,
} from "./controller.js"

export async function reportsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", requireAuth)

  fastify.get("/branches", branchesHandler)
  fastify.get("/companies", companiesHandler)
  fastify.get("/sales/item-wise", itemWiseSalesHandler)
  fastify.get("/sales/by-branch", branchSalesHandler)
  fastify.get("/sales/gross-profit", grossProfitHandler)
  fastify.get("/purchase", purchaseSummaryHandler)
  fastify.get("/purchase/detail", purchaseDetailHandler)
  fastify.get("/stock", stockReportHandler)
  fastify.get("/stock/summary", stockSummaryHandler)
  fastify.get("/stock/by-company", stockValueByCompanyHandler)
  fastify.get("/stock/zero-order-alerts", zeroOrderAlertsHandler)
  fastify.get("/stock/expiry", expiryReportHandler)
  fastify.get("/stock/non-moving", nonMovingHandler)
  fastify.get("/collection/daily", dailyCollectionHandler)
  fastify.get("/collection/detail", daySalesDetailHandler)
  fastify.get("/finance/cash-in-hand", cashInHandHandler)
  fastify.get("/finance/outstanding", outstandingHandler)
  fastify.get("/dashboard/summary", dashboardSummaryHandler)
}
