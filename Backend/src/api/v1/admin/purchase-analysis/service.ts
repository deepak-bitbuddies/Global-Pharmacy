import { emitPurchaseAnalysisBatchProgress, emitPurchaseAnalysisBatchUpdate } from "../../../../core/realtime/socket.js"
import { ValidationError } from "../../../../shared/errors/index.js"
import { readWorkbookRows } from "../uploads/parsers/parse-utils.js"
import { parsePurchaseAnalysisFile } from "./parser.js"
import {
  createImportBatch,
  deleteImportBatch,
  getPurchaseAnalysisLines,
  getPurchaseAnalysisSummary,
  insertPurchaseAnalysisLines,
  listImportBatches,
  listPurchaseAnalysisAreas,
  listPurchaseAnalysisCompanies,
  listPurchaseAnalysisItems,
  listPurchaseAnalysisParties,
  listPurchaseAnalysisRoutes,
  listPurchaseAnalysisTypes,
  updateImportBatchStatus,
} from "./repository.js"
import type {
  CursorPaginationParams,
  PaginatedResult,
  PurchaseAnalysisFilters,
  PurchaseAnalysisImportBatchDto,
  PurchaseAnalysisRowDto,
  PurchaseAnalysisSummaryDto,
  PurchaseAnalysisUploadAckDto,
} from "./dto.js"

const num = (value: string | number | null): number | null => (value === null ? null : Number(value))

function toRowDto(row: Awaited<ReturnType<typeof getPurchaseAnalysisLines>>["rows"][number]): PurchaseAnalysisRowDto {
  return {
    id: row.id,
    partyName: row.partyName,
    itemName: row.itemName,
    billNo: row.billNo,
    billDate: row.billDate,
    type: row.type,
    pan: row.pan,
    bankAcctNo: row.bankAcctNo,
    ifscCode: row.ifscCode,
    batch: row.batch,
    qty: num(row.qty),
    freeQty: num(row.freeQty),
    rate: num(row.rate),
    scheme: num(row.scheme),
    discount: num(row.discount),
    amount: Number(row.amount),
    gstPct: num(row.gstPct),
    taxAmount: num(row.taxAmount),
    mrp: num(row.mrp),
    mrpAmt: num(row.mrpAmt),
    companyName: row.companyName,
    areaName: row.areaName,
    routeName: row.routeName,
    saleType: row.saleType,
    gstNo: row.gstNo,
  }
}

export async function purchaseAnalysisLines(
  filters: PurchaseAnalysisFilters,
  pagination: CursorPaginationParams,
): Promise<PaginatedResult<PurchaseAnalysisRowDto>> {
  const { rows, ...page } = await getPurchaseAnalysisLines(filters, pagination)
  return { ...page, rows: rows.map(toRowDto) }
}

export async function purchaseAnalysisSummary(filters: PurchaseAnalysisFilters): Promise<PurchaseAnalysisSummaryDto> {
  const totals = await getPurchaseAnalysisSummary(filters)
  return {
    totalAmount: Number(totals.totalAmount),
    totalTaxAmount: Number(totals.totalTaxAmount),
    totalQty: Number(totals.totalQty),
    billCount: Number(totals.billCount),
    partyCount: Number(totals.partyCount),
  }
}

export const purchaseAnalysisParties = listPurchaseAnalysisParties
export const purchaseAnalysisItems = listPurchaseAnalysisItems
export const purchaseAnalysisCompanies = listPurchaseAnalysisCompanies
export const purchaseAnalysisTypes = listPurchaseAnalysisTypes
export const purchaseAnalysisAreas = listPurchaseAnalysisAreas
export const purchaseAnalysisRoutes = listPurchaseAnalysisRoutes

/**
 * The one place that does the "slow" work (parse + chunked insert) — called fire-and-forget from
 * `importPurchaseAnalysisFile` right after the placeholder batch row is created, so the request
 * itself only ever waits on that one fast insert. Never throws: every outcome (success or failure)
 * is written to the batch row and pushed over the socket, since nothing awaits this beyond the
 * background event loop — same shape as `uploads/service.ts`'s `processSingleFileInBackground`.
 */
async function processPurchaseAnalysisFileInBackground(batchId: string, fileName: string, buffer: Buffer): Promise<void> {
  try {
    const rows = readWorkbookRows(buffer)
    const parsed = parsePurchaseAnalysisFile(rows)

    if (parsed.rows.length === 0) {
      throw new ValidationError("No purchase-analysis rows were found in this file — check it's the right export (Party/Item Wise Purchase Analysis).")
    }

    const onProgress = (rowsProcessed: number, totalRows: number) => emitPurchaseAnalysisBatchProgress({ batchId, rowsProcessed, totalRows })
    const rowCount = await insertPurchaseAnalysisLines(batchId, parsed.rows, onProgress)

    await updateImportBatchStatus(batchId, { status: "completed", rowCount, periodFrom: parsed.periodFrom, periodTo: parsed.periodTo })
    emitPurchaseAnalysisBatchUpdate({ batchId, fileName, status: "completed", rowCount })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error while importing this file"
    await updateImportBatchStatus(batchId, { status: "failed", errorMessage })
    emitPurchaseAnalysisBatchUpdate({ batchId, fileName, status: "failed", errorMessage })
  }
}

/** Instant ack (placeholder batch row, status "processing") — the real parse/insert runs in the background via `processPurchaseAnalysisFileInBackground`, with live status/progress over the socket, same "ack now, live status after" pattern every other import in this app uses. */
export async function importPurchaseAnalysisFile(fileName: string, buffer: Buffer): Promise<PurchaseAnalysisUploadAckDto> {
  const batch = await createImportBatch({ fileName, periodFrom: null, periodTo: null, rowCount: 0, status: "processing" })
  if (!batch) throw new ValidationError("Could not create the import batch")
  emitPurchaseAnalysisBatchUpdate({ batchId: batch.id, fileName, status: "processing" })

  void processPurchaseAnalysisFileInBackground(batch.id, fileName, buffer)

  return { batchId: batch.id, fileName }
}

function toBatchDto(row: Awaited<ReturnType<typeof listImportBatches>>[number]): PurchaseAnalysisImportBatchDto {
  return {
    id: row.id,
    fileName: row.fileName,
    periodFrom: row.periodFrom,
    periodTo: row.periodTo,
    rowCount: row.rowCount,
    status: row.status,
    errorMessage: row.errorMessage,
    importedAt: row.importedAt.toISOString(),
  }
}

export async function purchaseAnalysisImportBatches(): Promise<PurchaseAnalysisImportBatchDto[]> {
  const rows = await listImportBatches()
  return rows.map(toBatchDto)
}

export async function deletePurchaseAnalysisBatch(id: string): Promise<void> {
  await deleteImportBatch(id)
}
