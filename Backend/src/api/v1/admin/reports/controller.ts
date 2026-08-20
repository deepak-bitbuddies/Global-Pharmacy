import type { FastifyReply, FastifyRequest } from "fastify"

import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { scopeToUserBranch, scopeToUserBranchList } from "../../../../shared/helpers/scope-to-user-branch.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import { listBranches } from "../uploads/index.js"
import {
  createExportSchema,
  daySalesDetailQuerySchema,
  exportIdParamSchema,
  expiryQuerySchema,
  grossProfitQuerySchema,
  itemWiseSalesQuerySchema,
  listExportJobsQuerySchema,
  nonMovingDetailQuerySchema,
  purchaseDetailQuerySchema,
  purchaseSummaryQuerySchema,
  reportFiltersSchema,
  salesDetailQuerySchema,
  stockReportQuerySchema,
} from "./schema.js"
import {
  branchSales,
  companies,
  createExport,
  dailyCollection,
  dashboardSummary,
  daySalesDetail,
  expiryReport,
  getExportFileForDownload,
  grossProfitByItem,
  itemWiseSales,
  items,
  listExports,
  nonMovingDetail,
  nonMovingItems,
  purchaseDetail,
  purchaseSummary,
  purchaseValueByCompany,
  salesDetail,
  salesValueByCompany,
  stockReport,
  stockSummary,
  stockValueByCompany,
  supplierGroups,
  suppliers,
  topGrossProfitPercentItems,
  topReturnsByItem,
  topStockItemsByValue,
  zeroOrderAlerts,
} from "./service.js"

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

export async function itemsHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await items())
}

export async function companiesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await companies())
}

export async function suppliersHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await suppliers())
}

export async function supplierGroupsHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await supplierGroups())
}

export async function itemWiseSalesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(itemWiseSalesQuerySchema, request.query)
  const filters = scopeToUserBranchList(request, rest)
  const { rows, ...page } = await itemWiseSales(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function salesDetailHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(salesDetailQuerySchema, request.query)
  const filters = scopeToUserBranchList(request, rest)
  const { rows, ...page } = await salesDetail(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function branchSalesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await branchSales(filters))
}

export async function grossProfitHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(grossProfitQuerySchema, request.query)
  const filters = scopeToUserBranchList(request, rest)
  const { rows, ...page } = await grossProfitByItem(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function topGrossProfitPercentHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await topGrossProfitPercentItems(filters))
}

export async function topReturnsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await topReturnsByItem(filters))
}

export async function salesByCompanyHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await salesValueByCompany(filters))
}

export async function purchaseSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(purchaseSummaryQuerySchema, request.query)
  const filters = scopeToUserBranchList(request, rest)
  const { rows, ...page } = await purchaseSummary(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function purchaseDetailHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(purchaseDetailQuerySchema, request.query)
  const filters = scopeToUserBranchList(request, rest)
  const { rows, ...page } = await purchaseDetail(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function purchaseByCompanyHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await purchaseValueByCompany(filters))
}

export async function stockReportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(stockReportQuerySchema, request.query)
  const filters = scopeToUserBranchList(request, rest)
  const { rows, ...page } = await stockReport(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function stockSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await stockSummary(filters))
}

export async function stockValueByCompanyHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await stockValueByCompany(filters))
}

export async function topStockByValueHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await topStockItemsByValue(filters))
}

export async function zeroOrderAlertsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await zeroOrderAlerts(filters))
}

export async function expiryReportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { withinDays, ...rest } = validateSchema(expiryQuerySchema, request.query)
  const filters = scopeToUserBranchList(request, rest)
  sendSuccess(reply, await expiryReport(filters, withinDays))
}

export async function nonMovingHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await nonMovingItems(filters))
}

export async function nonMovingDetailHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(nonMovingDetailQuerySchema, request.query)
  const filters = scopeToUserBranchList(request, rest)
  const { rows, ...page } = await nonMovingDetail(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function dailyCollectionHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await dailyCollection(filters))
}

export async function daySalesDetailHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(daySalesDetailQuerySchema, request.query)
  const filters = scopeToUserBranchList(request, rest)
  const { rows, ...page } = await daySalesDetail(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function dashboardSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(reportFiltersSchema, request.query))
  sendSuccess(reply, await dashboardSummary(filters))
}

export async function createExportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { reportType, ...rest } = validateSchema(createExportSchema, request.body)
  const filters = scopeToUserBranchList(request, rest)
  // `export_jobs.branch_id` is a single nullable column (used only to filter the export-history
  // panel by branch) — kept populated for the common single-branch case, null for zero/multiple.
  const job = await createExport(reportType, filters, filters.branchId?.length === 1 ? filters.branchId[0] : null)
  sendSuccess(reply, job, "Export started — processing in background", 202)
}

export async function listExportsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { branchId: requestedBranchId, reportType } = validateSchema(listExportJobsQuerySchema, request.query)
  const { branchId } = scopeToUserBranch(request, { branchId: requestedBranchId })
  sendSuccess(reply, await listExports(branchId, reportType))
}

export async function downloadExportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(exportIdParamSchema, request.params)
  const { buffer, fileName } = await getExportFileForDownload(id)
  reply
    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    .header("Content-Disposition", `attachment; filename="${fileName}"`)
    .send(buffer)
}
