import type { FastifyReply, FastifyRequest } from "fastify"

import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { ForbiddenError } from "../../../../shared/errors/index.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import { listBranches } from "../uploads/index.js"
import {
  expiryQuerySchema,
  grossProfitQuerySchema,
  itemWiseSalesQuerySchema,
  purchaseSummaryQuerySchema,
  reportFiltersSchema,
  stockReportQuerySchema,
} from "./schema.js"
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
  stockSummary,
  stockValueByCompany,
  zeroOrderAlerts,
} from "./service.js"

/** A `branch_user` can only ever see their own branch's data — whatever `branchId` they passed (or omitted) is overwritten server-side, never merely validated. */
function scopeToUserBranch<T extends { branchId?: string }>(request: FastifyRequest, filters: T): T {
  if (request.user.role !== SystemRoleCode.BRANCH_USER) return filters
  if (!request.user.branchId) throw new ForbiddenError("This account isn't linked to a branch")
  return { ...filters, branchId: request.user.branchId }
}

/** Builds the `meta` envelope for a cursor-paginated response — "Page X of Y" is derived client-side from `totalPages`, this just needs to report the totals and the seek state. */
function paginationMeta(page: { hasNextPage: boolean; nextCursor: string | null; total: number }, pageSize: number) {
  return { nextCursor: page.nextCursor, hasNextPage: page.hasNextPage, total: page.total, totalPages: Math.ceil(page.total / pageSize) }
}

export async function branchesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const branches = await listBranches()
  if (request.user.role === SystemRoleCode.BRANCH_USER) {
    sendSuccess(reply, branches.filter((branch) => branch.id === request.user.branchId))
    return
  }
  sendSuccess(reply, branches)
}

export async function companiesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await companies())
}

export async function itemWiseSalesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(itemWiseSalesQuerySchema, request.query)
  const filters = scopeToUserBranch(request, rest)
  const { rows, ...page } = await itemWiseSales(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function branchSalesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranch(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await branchSales(filters))
}

export async function grossProfitHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(grossProfitQuerySchema, request.query)
  const filters = scopeToUserBranch(request, rest)
  const { rows, ...page } = await grossProfitByItem(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function purchaseSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(purchaseSummaryQuerySchema, request.query)
  const filters = scopeToUserBranch(request, rest)
  const { rows, ...page } = await purchaseSummary(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function stockReportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(stockReportQuerySchema, request.query)
  const filters = scopeToUserBranch(request, rest)
  const { rows, ...page } = await stockReport(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function stockSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranch(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await stockSummary(filters))
}

export async function stockValueByCompanyHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranch(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await stockValueByCompany(filters))
}

export async function zeroOrderAlertsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranch(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await zeroOrderAlerts(filters))
}

export async function expiryReportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { withinDays, ...rest } = validateSchema(expiryQuerySchema, request.query)
  const filters = scopeToUserBranch(request, rest)
  sendSuccess(reply, await expiryReport(filters, withinDays))
}

export async function nonMovingHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranch(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await nonMovingItems(filters))
}

export async function dailyCollectionHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranch(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await dailyCollection(filters))
}

export async function cashInHandHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranch(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await cashInHand(filters))
}

export async function outstandingHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranch(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await outstanding(filters))
}

export async function dashboardSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranch(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await dashboardSummary(filters))
}
