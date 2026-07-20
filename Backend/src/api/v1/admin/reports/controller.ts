import type { FastifyReply, FastifyRequest } from "fastify"

import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { listBranches } from "../uploads/index.js"
import { expiryQuerySchema, reportFiltersSchema } from "./schema.js"
import {
  branchSales,
  cashInHand,
  companies,
  dailyCollection,
  dashboardSummary,
  expiryReport,
  grossProfitByItem,
  itemWiseSales,
  nonMovingItems,
  outstanding,
  purchaseSummary,
  stockReport,
  zeroOrderAlerts,
} from "./service.js"

export async function branchesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await listBranches())
}

export async function companiesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await companies())
}

export async function itemWiseSalesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await itemWiseSales(filters))
}

export async function branchSalesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await branchSales(filters))
}

export async function grossProfitHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await grossProfitByItem(filters))
}

export async function purchaseSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await purchaseSummary(filters))
}

export async function stockReportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await stockReport(filters))
}

export async function zeroOrderAlertsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await zeroOrderAlerts(filters))
}

export async function expiryReportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { withinDays, ...filters } = validateSchema(expiryQuerySchema, request.query)
  sendSuccess(reply, await expiryReport(filters, withinDays))
}

export async function nonMovingHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await nonMovingItems(filters))
}

export async function dailyCollectionHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await dailyCollection(filters))
}

export async function cashInHandHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await cashInHand(filters))
}

export async function outstandingHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await outstanding(filters))
}

export async function dashboardSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(reportFiltersSchema, request.query)
  sendSuccess(reply, await dashboardSummary(filters))
}
