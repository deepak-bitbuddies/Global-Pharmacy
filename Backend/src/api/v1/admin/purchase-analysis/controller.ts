import type { FastifyReply, FastifyRequest } from "fastify"

import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { ValidationError } from "../../../../shared/errors/index.js"
import { createPurchaseAnalysisExportSchema, idParamSchema, purchaseAnalysisQuerySchema } from "./schema.js"
import {
  createPurchaseAnalysisExport,
  deletePurchaseAnalysisBatch,
  getPurchaseAnalysisExportFileForDownload,
  importPurchaseAnalysisFile,
  listPurchaseAnalysisExports,
  purchaseAnalysisAreas,
  purchaseAnalysisCompanies,
  purchaseAnalysisImportBatches,
  purchaseAnalysisItems,
  purchaseAnalysisLines,
  purchaseAnalysisParties,
  purchaseAnalysisRoutes,
  purchaseAnalysisSummary,
  purchaseAnalysisTypes,
} from "./service.js"

function paginationMeta(page: { hasNextPage: boolean; nextCursor: string | null; total: number }, pageSize: number) {
  return { nextCursor: page.nextCursor, hasNextPage: page.hasNextPage, total: page.total, totalPages: Math.ceil(page.total / pageSize) }
}

export async function purchaseAnalysisLinesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...filters } = validateSchema(purchaseAnalysisQuerySchema, request.query)
  const { rows, ...page } = await purchaseAnalysisLines(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function purchaseAnalysisSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor: _cursor, pageSize: _pageSize, ...filters } = validateSchema(purchaseAnalysisQuerySchema, request.query)
  sendSuccess(reply, await purchaseAnalysisSummary(filters))
}

export async function purchaseAnalysisPartiesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await purchaseAnalysisParties())
}

export async function purchaseAnalysisItemsHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await purchaseAnalysisItems())
}

export async function purchaseAnalysisCompaniesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await purchaseAnalysisCompanies())
}

export async function purchaseAnalysisTypesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await purchaseAnalysisTypes())
}

export async function purchaseAnalysisAreasHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await purchaseAnalysisAreas())
}

export async function purchaseAnalysisRoutesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await purchaseAnalysisRoutes())
}

export async function uploadPurchaseAnalysisHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const file = await request.file()
  if (!file) throw new ValidationError("No file was uploaded")

  const buffer = await file.toBuffer()

  const ack = await importPurchaseAnalysisFile(file.filename, buffer)
  sendSuccess(reply, ack, "File received — processing", 202)
}

export async function listPurchaseAnalysisBatchesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await purchaseAnalysisImportBatches())
}

export async function deletePurchaseAnalysisBatchHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(idParamSchema, request.params)
  await deletePurchaseAnalysisBatch(id)
  sendSuccess(reply, null, "Import batch deleted")
}

export async function createPurchaseAnalysisExportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = validateSchema(createPurchaseAnalysisExportSchema, request.body)
  const job = await createPurchaseAnalysisExport(filters)
  sendSuccess(reply, job, "Export started — processing in background", 202)
}

export async function listPurchaseAnalysisExportsHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  sendSuccess(reply, await listPurchaseAnalysisExports())
}

export async function downloadPurchaseAnalysisExportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(idParamSchema, request.params)
  const { buffer, fileName } = await getPurchaseAnalysisExportFileForDownload(id)
  reply
    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    .header("Content-Disposition", `attachment; filename="${fileName}"`)
    .send(buffer)
}
