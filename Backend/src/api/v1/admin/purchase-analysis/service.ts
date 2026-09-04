import { emitExportJobProgress, emitExportJobUpdate, emitPurchaseAnalysisBatchProgress, emitPurchaseAnalysisBatchUpdate } from "../../../../core/realtime/socket.js"
import { ValidationError, NotFoundError } from "../../../../shared/errors/index.js"
import { buildStyledXlsxBuffer } from "../../../../shared/helpers/xlsx-export.js"
import { createExportJob, findExportJob, listExportJobs, updateExportJobStatus } from "../reports/repository.js"
import type { ExportJobDocument } from "../reports/model.js"
import { readExportFile, saveExportFile } from "../../../../core/storage/export-storage.js"
import { readWorkbookRows } from "../uploads/parsers/parse-utils.js"
import { parsePurchaseAnalysisFile } from "./parser.js"
import {
  createImportBatch,
  deleteImportBatch,
  exportPurchaseAnalysisLines,
  getPurchaseAnalysisLines,
  getPurchaseAnalysisSummary,
  insertPurchaseAnalysisLines,
  listImportBatches,
  listPurchaseAnalysisAreas,
  listPurchaseAnalysisBranches,
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
  PurchaseAnalysisExportJobDto,
  PurchaseAnalysisFilters,
  PurchaseAnalysisImportBatchDto,
  PurchaseAnalysisRowDto,
  PurchaseAnalysisSummaryDto,
  PurchaseAnalysisUploadAckDto,
} from "./dto.js"

// This module is only ever the one "report" — unlike Reports' four, no per-request discriminant needed.
const PURCHASE_ANALYSIS_REPORT_TYPE = "purchase_analysis"

const num = (value: string | number | null): number | null => (value === null ? null : Number(value))

/**
 * `scheme`/`discount` are stored as the rupee amount knocked off the line (Marg's export gives no
 * separate %), but party-wise analysis wants the rate, not just the rupee figure — so it's derived
 * here as discount-or-scheme over the pre-discount gross (`amount` is already net of both), same
 * denominator for each so they're directly comparable. Rounded to 2dp for display; null once there's
 * nothing to divide by (no gross) or nothing to express as a rate (the source value is null).
 */
function toPct(value: number | null, grossAmount: number): number | null {
  if (value === null || grossAmount <= 0) return null
  return Math.round((value / grossAmount) * 10000) / 100
}

function toRowDto(row: Awaited<ReturnType<typeof getPurchaseAnalysisLines>>["rows"][number]): PurchaseAnalysisRowDto {
  const scheme = num(row.scheme)
  const discount = num(row.discount)
  const amount = Number(row.amount)
  const grossAmount = amount + (scheme ?? 0) + (discount ?? 0)

  return {
    id: row.id,
    partyName: row.partyName,
    itemName: row.itemName,
    billNo: row.billNo,
    billDate: row.billDate,
    type: row.type,
    pan: row.pan,
    branchName: row.branchName,
    ifscCode: row.ifscCode,
    batch: row.batch,
    qty: num(row.qty),
    freeQty: num(row.freeQty),
    rate: num(row.rate),
    scheme,
    schemePct: toPct(scheme, grossAmount),
    discount,
    discountPct: toPct(discount, grossAmount),
    amount,
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
export const purchaseAnalysisBranches = listPurchaseAnalysisBranches
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

// ---- Background export — same "ack now, live status/progress over the socket" shape as the
// import above, and reuses Reports' `export_jobs` table/CRUD (see reports/model.ts) rather than
// standing up a second copy of this job lifecycle for one more report type.

const EXPORT_CHUNK_SIZE = 2000

const EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: "billDate", label: "Date" },
  { key: "partyName", label: "Party" },
  { key: "itemName", label: "Item" },
  { key: "billNo", label: "Bill No." },
  { key: "branchName", label: "Branch" },
  { key: "batch", label: "Batch" },
  { key: "qty", label: "Qty" },
  { key: "freeQty", label: "Free Qty" },
  { key: "rate", label: "Rate" },
  { key: "discount", label: "Discount" },
  { key: "amount", label: "Amount" },
  { key: "discountPct", label: "Discount %" },
  { key: "scheme", label: "Scheme" },
  { key: "schemePct", label: "Scheme %" },
  { key: "gstPct", label: "GST %" },
  { key: "taxAmount", label: "Tax Amount" },
  { key: "companyName", label: "Company" },
  { key: "areaName", label: "Area" },
  { key: "routeName", label: "Route" },
  { key: "type", label: "Type" },
]

function rangeLabel(from: number | undefined, to: number | undefined): string {
  if (from !== undefined && to !== undefined) return `${from} – ${to}`
  if (from !== undefined) return `≥ ${from}`
  return `≤ ${to}`
}

/** Human-readable one-line summary of which filters produced an export — same purpose as Reports' `describeFilters`, just this module's own (smaller, branch-less) filter shape. */
function describeFilters(filters: PurchaseAnalysisFilters): string {
  const parts: string[] = []
  if (filters.dateFrom && filters.dateTo) parts.push(`${filters.dateFrom} – ${filters.dateTo}`)
  if (filters.partyName?.length) parts.push(filters.partyName.join(", "))
  if (filters.itemName?.length) parts.push(filters.itemName.map((name) => `"${name}"`).join(", "))
  if (filters.company?.length) parts.push(filters.company.join(", "))
  if (filters.branch?.length) parts.push(filters.branch.join(", "))
  if (filters.type?.length) parts.push(filters.type.join(", "))
  if (filters.area?.length) parts.push(filters.area.join(", "))
  if (filters.route?.length) parts.push(filters.route.join(", "))
  if (filters.search) parts.push(`Search "${filters.search}"`)
  if (filters.amountFrom !== undefined || filters.amountTo !== undefined) parts.push(`Amount ${rangeLabel(filters.amountFrom, filters.amountTo)}`)
  if (filters.qtyFrom !== undefined || filters.qtyTo !== undefined) parts.push(`Qty ${rangeLabel(filters.qtyFrom, filters.qtyTo)}`)
  return parts.length > 0 ? parts.join(" | ") : "All records — no filters applied"
}

function toExportJobDto(job: ExportJobDocument): PurchaseAnalysisExportJobDto {
  return {
    id: job.id,
    reportType: job.reportType,
    branchId: job.branchId,
    // This module's own listing/lookup calls are always scoped to `PURCHASE_ANALYSIS_REPORT_TYPE`,
    // so a job reaching here is always genuinely `PurchaseAnalysisFilters`-shaped.
    filters: job.filters as PurchaseAnalysisFilters,
    status: job.status,
    rowCount: job.rowCount,
    fileName: job.fileName,
    errorMessage: job.errorMessage,
    requestedAt: job.requestedAt,
    completedAt: job.completedAt,
  }
}

/** Maps in chunks purely to emit progress ticks (`export-job:progress`) on the way — same reason `reports/service.ts`'s `mapWithProgress` does. */
function mapWithProgress(rows: Awaited<ReturnType<typeof exportPurchaseAnalysisLines>>, job: PurchaseAnalysisExportJobDto): Record<string, unknown>[] {
  const mapped: Record<string, unknown>[] = []
  const total = rows.length
  for (let i = 0; i < total; i += EXPORT_CHUNK_SIZE) {
    for (const row of rows.slice(i, i + EXPORT_CHUNK_SIZE)) mapped.push(toRowDto(row))
    emitExportJobProgress({ id: job.id, reportType: job.reportType, branchId: job.branchId, rowsProcessed: mapped.length, totalRows: total })
  }
  if (total === 0) emitExportJobProgress({ id: job.id, reportType: job.reportType, branchId: job.branchId, rowsProcessed: 0, totalRows: 0 })
  return mapped
}

async function runExportPipeline(job: PurchaseAnalysisExportJobDto, filters: PurchaseAnalysisFilters): Promise<void> {
  try {
    const rows = await exportPurchaseAnalysisLines(filters)
    const mappedRows = mapWithProgress(rows, job)

    const filterSummary = describeFilters(filters)
    const buffer = await buildStyledXlsxBuffer("Party Wise Analysis", filterSummary, EXPORT_COLUMNS, mappedRows)
    const fileName = `party-wise-analysis-${new Date().toISOString().slice(0, 10)}.xlsx`
    const { storageKey } = await saveExportFile(job.id, buffer)

    await updateExportJobStatus(job.id, { status: "completed", rowCount: mappedRows.length, fileName, storageKey })
    emitExportJobUpdate({ id: job.id, reportType: job.reportType, branchId: job.branchId, status: "completed", rowCount: mappedRows.length })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error while generating this export"
    await updateExportJobStatus(job.id, { status: "failed", errorMessage })
    emitExportJobUpdate({ id: job.id, reportType: job.reportType, branchId: job.branchId, status: "failed", errorMessage })
  }
}

export async function createPurchaseAnalysisExport(filters: PurchaseAnalysisFilters): Promise<PurchaseAnalysisExportJobDto> {
  const job = toExportJobDto(await createExportJob({ reportType: PURCHASE_ANALYSIS_REPORT_TYPE, branchId: null, filters }))
  emitExportJobUpdate({ id: job.id, reportType: job.reportType, branchId: job.branchId, status: "processing" })

  // Not awaited — same fire-and-forget shape as `importPurchaseAnalysisFile` above.
  void runExportPipeline(job, filters)

  return job
}

export async function listPurchaseAnalysisExports(): Promise<PurchaseAnalysisExportJobDto[]> {
  const jobs = await listExportJobs(undefined, PURCHASE_ANALYSIS_REPORT_TYPE)
  return jobs.map(toExportJobDto)
}

export async function getPurchaseAnalysisExportFileForDownload(id: string): Promise<{ buffer: Buffer; fileName: string }> {
  const job = await findExportJob(id)
  if (!job || job.status !== "completed" || !job.storageKey || !job.fileName) {
    throw new NotFoundError("Export not found, or it isn't ready to download yet")
  }
  return { buffer: await readExportFile(job.storageKey), fileName: job.fileName }
}
