import { ForbiddenError, NotFoundError } from "../../../../shared/errors/index.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import { emitImportBatchUpdate } from "../../../../core/realtime/socket.js"
import { FileType, type FileTypeValue } from "./enums.js"
import { EmptyImportError, MissingDateError, MultiDayFileError, OutOfSequenceError, WrongFileTypeError } from "./errors.js"
import type {
  BulkUploadAcceptedDto,
  BulkUploadFileInputDto,
  BulkUploadRejectedDto,
  BulkUploadResultDto,
  ImportBatchListItemDto,
  UploadCycleStatusDto,
  UploadFileDto,
  UploadResultDto,
} from "./dto.js"
import { parseStockFile, type ParsedStockRow } from "./parsers/stock.parser.js"
import { parseSalesFile, type ParsedSalesRow } from "./parsers/sales.parser.js"
import { parsePurchaseFile, type ParsedPurchaseRow } from "./parsers/purchase.parser.js"
import { parseDaySalesFile, type ParsedDaySalesRow } from "./parsers/day-sales.parser.js"
import { normalizeItemName, sniffReportKind } from "./parsers/parse-utils.js"
import type { BranchDocument, NewDailySalesSummaryDocument, NewPurchaseLineDocument, NewSalesLineDocument, NewStockSnapshotDocument } from "./model.js"
import {
  createImportBatch,
  deleteDailySalesSummaryByBatch,
  deleteImportBatch,
  deletePurchaseLinesByBatch,
  deleteSalesLinesByBatch,
  deleteStockSnapshotsByBatch,
  findBranchById,
  findImportBatch,
  findImportBatchByDate,
  findLatestBatchDate,
  hasBatchForDate,
  insertDailySalesSummary,
  insertPurchaseLines,
  insertSalesLines,
  insertStockSnapshots,
  listBranches,
  listImportBatches,
  resolveItemIdsByCode,
  resolveItemIdsByName,
  updateImportBatchStatus,
} from "./repository.js"

/** Branches are now registered explicitly (see `admin/branches`) — letterhead data is no longer used to resolve or create one, just looked up by the id the upload was made against. */
async function requireBranch(branchId: string): Promise<BranchDocument> {
  const branch = await findBranchById(branchId)
  if (!branch) throw new NotFoundError("Branch not found")
  return branch
}

/** Blocks a file from landing under the wrong section (e.g. a Purchase Register uploaded as Sales) by checking its own title row. A sniff that doesn't recognize the file at all (null) is let through — the type-specific parser below will reject it on its own terms (e.g. `EmptyImportError`) rather than this guard blocking an unrecognized-but-possibly-valid format. */
function assertReportKind(buffer: Buffer, expected: FileTypeValue): void {
  const detected = sniffReportKind(buffer)
  if (detected && detected !== expected) throw new WrongFileTypeError(expected, detected)
}

const FILE_TYPE_LABEL: Record<FileTypeValue, string> = {
  [FileType.Stock]: "Stock",
  [FileType.Sales]: "Sales",
  [FileType.Purchase]: "Purchase",
  [FileType.DayWiseSale]: "Day-Wise Sale",
}

/** Only a super admin may overwrite data that's already been imported — a `branch_user` re-uploading for a date/type (or filename, for Day-Wise Sale) that already has a batch gets blocked instead of silently replacing it. */
function assertReplaceAllowed(fileType: FileTypeValue, actorRole: SystemRoleCode, forLabel: string): void {
  if (actorRole === SystemRoleCode.SUPER_ADMIN) return
  throw new ForbiddenError(`A ${FILE_TYPE_LABEL[fileType]} file for ${forLabel} has already been imported — only a super admin can replace it.`)
}

/** Day-Wise Sale is exempt from the dated pipeline (one row per day, inherently multi-day) — it still replaces by exact filename, as every file type did before this pipeline existed. */
async function replaceExistingBatchByFilename(branchId: string, fileType: FileTypeValue, fileName: string, actorRole: SystemRoleCode): Promise<boolean> {
  const existing = await findImportBatch(branchId, fileType, fileName)
  if (!existing) return false
  assertReplaceAllowed(fileType, actorRole, fileName)

  await deleteDailySalesSummaryByBatch(existing.id)
  await deleteImportBatch(existing.id)
  return true
}

/** Stock/Sales/Purchase are now single-day-per-upload — re-uploading for a date that already has a batch (whatever the filename) replaces it, so corrections never duplicate. */
async function replaceExistingBatchByDate(branchId: string, fileType: FileTypeValue, date: string, actorRole: SystemRoleCode): Promise<boolean> {
  const existing = await findImportBatchByDate(branchId, fileType, date)
  if (!existing) return false
  assertReplaceAllowed(fileType, actorRole, date)

  switch (fileType) {
    case FileType.Stock:
      await deleteStockSnapshotsByBatch(existing.id)
      break
    case FileType.Sales:
      await deleteSalesLinesByBatch(existing.id)
      break
    case FileType.Purchase:
      await deletePurchaseLinesByBatch(existing.id)
      break
  }
  await deleteImportBatch(existing.id)
  return true
}

/**
 * Enforces Stock -> Purchase -> Sales, one date at a time, per branch:
 * - Stock for a new date is blocked while the branch's current open date still has
 *   Purchase and/or Sales pending.
 * - Purchase/Sales for a date is blocked until Stock exists for that exact date.
 * Re-uploading for a date that already has a batch of that type is always a "correction"
 * and skips these checks entirely (handled by `replaceExistingBatchByDate` instead).
 */
async function assertUploadAllowed(branchId: string, fileType: FileTypeValue, date: string): Promise<void> {
  if (await hasBatchForDate(branchId, fileType, date)) return // correction to an existing date — always allowed

  if (fileType === FileType.Stock) {
    const openStockDate = await findLatestBatchDate(branchId, FileType.Stock)
    if (!openStockDate) return // first-ever upload for this branch

    const [purchaseDone, salesDone] = await Promise.all([
      hasBatchForDate(branchId, FileType.Purchase, openStockDate),
      hasBatchForDate(branchId, FileType.Sales, openStockDate),
    ])
    if (purchaseDone && salesDone) return // previous cycle closed — free to start a new date

    const pending = [!purchaseDone && "Purchase", !salesDone && "Sales"].filter(Boolean).join(" and ")
    throw new OutOfSequenceError(
      `${pending} for ${openStockDate} still pending — finish that before uploading Stock for a new date (${date}).`,
    )
  }

  // Purchase or Sales
  if (!(await hasBatchForDate(branchId, FileType.Stock, date))) {
    const label = fileType === FileType.Purchase ? "Purchase" : "Sales"
    throw new OutOfSequenceError(`Upload Stock for ${date} before ${label} for that date.`)
  }
}

// ---- Shared row-builders — used by both the synchronous single-file path below and the
// background bulk committer, so the two paths can never drift on how a parsed row becomes a DB row.

function buildStockSnapshotRows(
  rows: ParsedStockRow[],
  branchId: string,
  batchId: string,
  asOfDate: string,
  itemIdByCode: Map<string, string>,
): NewStockSnapshotDocument[] {
  return rows.map((row) => ({
    branchId,
    itemId: itemIdByCode.get(row.itemCode) ?? null,
    importBatchId: batchId,
    asOfDate,
    itemCode: row.itemCode,
    itemName: row.itemName,
    unit: row.unit,
    currentStock: row.currentStock,
    costPrice: row.costPrice,
    value: row.value,
    mrp: row.mrp,
    purchasePrice: row.purchasePrice,
    salesPrice: row.salesPrice,
    company: row.company,
    manufacturer: row.manufacturer,
    batch: row.batch,
    mfgDateRaw: row.mfgDateRaw,
    expDate: row.expDate,
    supplier: row.supplier,
    invNo: row.invNo,
    invDate: row.invDate,
    rackNo: row.rackNo,
    salesSchemeDeal: row.salesSchemeDeal,
    salesSchemeFree: row.salesSchemeFree,
    purcSchemeDeal: row.purcSchemeDeal,
    purcSchemeFree: row.purcSchemeFree,
    recDate: row.recDate,
  }))
}

function buildSalesLineRows(
  rows: ParsedSalesRow[],
  branchId: string,
  batchId: string,
  reportDateFrom: string,
  reportDateTo: string,
  itemIdByName: Map<string, string>,
): NewSalesLineDocument[] {
  return rows.map((row) => ({
    branchId,
    itemId: itemIdByName.get(normalizeItemName(row.itemNameRaw)) ?? null,
    importBatchId: batchId,
    reportDateFrom,
    reportDateTo,
    partyGroup: row.partyGroup,
    itemNameRaw: row.itemNameRaw,
    packSizeRaw: row.packSizeRaw,
    qty: row.qty,
    unit: row.unit,
    rate: row.rate,
    amount: row.amount,
    pctContribution: row.pctContribution,
  }))
}

function buildPurchaseLineRows(
  rows: ParsedPurchaseRow[],
  branchId: string,
  batchId: string,
  reportDateFrom: string,
  reportDateTo: string,
  itemIdByName: Map<string, string>,
): NewPurchaseLineDocument[] {
  return rows.map((row) => ({
    branchId,
    itemId: itemIdByName.get(normalizeItemName(row.itemNameRaw)) ?? null,
    importBatchId: batchId,
    reportDateFrom,
    reportDateTo,
    supplierGroup: row.supplierGroup,
    itemNameRaw: row.itemNameRaw,
    packSizeRaw: row.packSizeRaw,
    qty: row.qty,
    freeQty: row.freeQty,
    rate: row.rate,
    amount: row.amount,
    pctContribution: row.pctContribution,
    schemePct: row.schemePct,
  }))
}

function buildDailySalesSummaryRows(rows: ParsedDaySalesRow[], branchId: string, batchId: string): NewDailySalesSummaryDocument[] {
  return rows.map((row) => ({
    branchId,
    importBatchId: batchId,
    date: row.date,
    billNoRange: row.billNoRange,
    billValue: row.billValue,
    taxable: row.taxable,
    taxPayable: row.taxPayable,
    taxFree: row.taxFree,
    exempted: row.exempted,
    roundOff: row.roundOff,
  }))
}

// ---- Single-file upload path (unchanged behavior — fully synchronous) ----

async function importStock(branchId: string, fileName: string, buffer: Buffer, actorRole: SystemRoleCode): Promise<UploadResultDto> {
  assertReportKind(buffer, FileType.Stock)
  const parsed = parseStockFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Stock)
  const asOfDate = parsed.asOfDate
  if (!asOfDate) throw new MissingDateError(FileType.Stock)

  const branch = await requireBranch(branchId)
  await assertUploadAllowed(branch.id, FileType.Stock, asOfDate)
  const replaced = await replaceExistingBatchByDate(branch.id, FileType.Stock, asOfDate, actorRole)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.Stock, fileName, date: asOfDate, rowCount: parsed.rows.length })

  const itemIdByCode = await resolveItemIdsByCode(
    parsed.rows.map((row) => ({ code: row.itemCode, name: row.itemName, unit: row.unit, company: row.company, manufacturer: row.manufacturer })),
  )
  const inserted = await insertStockSnapshots(buildStockSnapshotRows(parsed.rows, branch.id, batch.id, asOfDate, itemIdByCode))

  return { branchId: branch.id, branchName: branch.name, fileType: FileType.Stock, fileName, rowCount: inserted, importedAt: batch.importedAt, replaced }
}

async function importSales(branchId: string, fileName: string, buffer: Buffer, actorRole: SystemRoleCode): Promise<UploadResultDto> {
  assertReportKind(buffer, FileType.Sales)
  const parsed = parseSalesFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Sales)
  const { reportDateFrom, reportDateTo } = parsed
  if (!reportDateFrom || !reportDateTo) throw new MissingDateError(FileType.Sales)
  if (reportDateFrom !== reportDateTo) throw new MultiDayFileError(reportDateFrom, reportDateTo)

  const branch = await requireBranch(branchId)
  await assertUploadAllowed(branch.id, FileType.Sales, reportDateFrom)
  const replaced = await replaceExistingBatchByDate(branch.id, FileType.Sales, reportDateFrom, actorRole)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.Sales, fileName, date: reportDateFrom, rowCount: parsed.rows.length })

  const itemIdByName = await resolveItemIdsByName(parsed.rows.map((row) => row.itemNameRaw))
  const inserted = await insertSalesLines(buildSalesLineRows(parsed.rows, branch.id, batch.id, reportDateFrom, reportDateTo, itemIdByName))

  return { branchId: branch.id, branchName: branch.name, fileType: FileType.Sales, fileName, rowCount: inserted, importedAt: batch.importedAt, replaced }
}

async function importPurchase(branchId: string, fileName: string, buffer: Buffer, actorRole: SystemRoleCode): Promise<UploadResultDto> {
  assertReportKind(buffer, FileType.Purchase)
  const parsed = parsePurchaseFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Purchase)
  const { reportDateFrom, reportDateTo } = parsed
  if (!reportDateFrom || !reportDateTo) throw new MissingDateError(FileType.Purchase)
  if (reportDateFrom !== reportDateTo) throw new MultiDayFileError(reportDateFrom, reportDateTo)

  const branch = await requireBranch(branchId)
  await assertUploadAllowed(branch.id, FileType.Purchase, reportDateFrom)
  const replaced = await replaceExistingBatchByDate(branch.id, FileType.Purchase, reportDateFrom, actorRole)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.Purchase, fileName, date: reportDateFrom, rowCount: parsed.rows.length })

  const itemIdByName = await resolveItemIdsByName(parsed.rows.map((row) => row.itemNameRaw))
  const inserted = await insertPurchaseLines(buildPurchaseLineRows(parsed.rows, branch.id, batch.id, reportDateFrom, reportDateTo, itemIdByName))

  return { branchId: branch.id, branchName: branch.name, fileType: FileType.Purchase, fileName, rowCount: inserted, importedAt: batch.importedAt, replaced }
}

async function importDaySales(branchId: string, fileName: string, buffer: Buffer, actorRole: SystemRoleCode): Promise<UploadResultDto> {
  assertReportKind(buffer, FileType.DayWiseSale)
  const parsed = parseDaySalesFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.DayWiseSale)

  const branch = await requireBranch(branchId)
  const replaced = await replaceExistingBatchByFilename(branch.id, FileType.DayWiseSale, fileName, actorRole)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.DayWiseSale, fileName, rowCount: parsed.rows.length })

  const inserted = await insertDailySalesSummary(buildDailySalesSummaryRows(parsed.rows, branch.id, batch.id))

  return { branchId: branch.id, branchName: branch.name, fileType: FileType.DayWiseSale, fileName, rowCount: inserted, importedAt: batch.importedAt, replaced }
}

export async function importFile(input: UploadFileDto): Promise<UploadResultDto> {
  switch (input.fileType) {
    case FileType.Stock:
      return importStock(input.branchId, input.fileName, input.buffer, input.actorRole)
    case FileType.Sales:
      return importSales(input.branchId, input.fileName, input.buffer, input.actorRole)
    case FileType.Purchase:
      return importPurchase(input.branchId, input.fileName, input.buffer, input.actorRole)
    case FileType.DayWiseSale:
      return importDaySales(input.branchId, input.fileName, input.buffer, input.actorRole)
  }
}

// ---- Bulk upload path (super_admin only — enforced at the route) ----
// Split in two: `prepareBulkFile` does everything fast/synchronous (sniff, parse, date/sequence
// validation, replace-lookup, and creating the "processing" placeholder row) so the client gets an
// immediate accept/reject verdict per file. `commitBulkFile` does the slow part (item resolution +
// bulk insert) in the background — called from `bulkImportFiles` without being awaited — and pushes
// the final outcome over the socket once it's done.

type BulkPrepared =
  | { kind: typeof FileType.Stock; batchId: string; branchId: string; asOfDate: string; rows: ParsedStockRow[] }
  | { kind: typeof FileType.Sales; batchId: string; branchId: string; reportDateFrom: string; reportDateTo: string; rows: ParsedSalesRow[] }
  | { kind: typeof FileType.Purchase; batchId: string; branchId: string; reportDateFrom: string; reportDateTo: string; rows: ParsedPurchaseRow[] }
  | { kind: typeof FileType.DayWiseSale; batchId: string; branchId: string; rows: ParsedDaySalesRow[] }

async function prepareBulkFile(
  branch: BranchDocument,
  fileName: string,
  buffer: Buffer,
): Promise<{ accepted: BulkUploadAcceptedDto; prepared: BulkPrepared } | { rejected: BulkUploadRejectedDto }> {
  try {
    const kind = sniffReportKind(buffer)
    if (!kind) return { rejected: { fileName, reason: "Could not identify this file's report type from its content — check the file format." } }

    if (kind === FileType.Stock) {
      const parsed = parseStockFile(buffer)
      if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Stock)
      if (!parsed.asOfDate) throw new MissingDateError(FileType.Stock)
      await assertUploadAllowed(branch.id, FileType.Stock, parsed.asOfDate)
      await replaceExistingBatchByDate(branch.id, FileType.Stock, parsed.asOfDate, SystemRoleCode.SUPER_ADMIN)
      const batch = await createImportBatch({
        branchId: branch.id,
        fileType: FileType.Stock,
        fileName,
        date: parsed.asOfDate,
        rowCount: parsed.rows.length,
        status: "processing",
      })
      return {
        accepted: { fileName, batchId: batch.id, fileType: FileType.Stock, date: parsed.asOfDate },
        prepared: { kind: FileType.Stock, batchId: batch.id, branchId: branch.id, asOfDate: parsed.asOfDate, rows: parsed.rows },
      }
    }

    if (kind === FileType.Sales) {
      const parsed = parseSalesFile(buffer)
      if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Sales)
      if (!parsed.reportDateFrom || !parsed.reportDateTo) throw new MissingDateError(FileType.Sales)
      if (parsed.reportDateFrom !== parsed.reportDateTo) throw new MultiDayFileError(parsed.reportDateFrom, parsed.reportDateTo)
      await assertUploadAllowed(branch.id, FileType.Sales, parsed.reportDateFrom)
      await replaceExistingBatchByDate(branch.id, FileType.Sales, parsed.reportDateFrom, SystemRoleCode.SUPER_ADMIN)
      const batch = await createImportBatch({
        branchId: branch.id,
        fileType: FileType.Sales,
        fileName,
        date: parsed.reportDateFrom,
        rowCount: parsed.rows.length,
        status: "processing",
      })
      return {
        accepted: { fileName, batchId: batch.id, fileType: FileType.Sales, date: parsed.reportDateFrom },
        prepared: {
          kind: FileType.Sales,
          batchId: batch.id,
          branchId: branch.id,
          reportDateFrom: parsed.reportDateFrom,
          reportDateTo: parsed.reportDateTo,
          rows: parsed.rows,
        },
      }
    }

    if (kind === FileType.Purchase) {
      const parsed = parsePurchaseFile(buffer)
      if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Purchase)
      if (!parsed.reportDateFrom || !parsed.reportDateTo) throw new MissingDateError(FileType.Purchase)
      if (parsed.reportDateFrom !== parsed.reportDateTo) throw new MultiDayFileError(parsed.reportDateFrom, parsed.reportDateTo)
      await assertUploadAllowed(branch.id, FileType.Purchase, parsed.reportDateFrom)
      await replaceExistingBatchByDate(branch.id, FileType.Purchase, parsed.reportDateFrom, SystemRoleCode.SUPER_ADMIN)
      const batch = await createImportBatch({
        branchId: branch.id,
        fileType: FileType.Purchase,
        fileName,
        date: parsed.reportDateFrom,
        rowCount: parsed.rows.length,
        status: "processing",
      })
      return {
        accepted: { fileName, batchId: batch.id, fileType: FileType.Purchase, date: parsed.reportDateFrom },
        prepared: {
          kind: FileType.Purchase,
          batchId: batch.id,
          branchId: branch.id,
          reportDateFrom: parsed.reportDateFrom,
          reportDateTo: parsed.reportDateTo,
          rows: parsed.rows,
        },
      }
    }

    // Day-Wise Sale
    const parsed = parseDaySalesFile(buffer)
    if (parsed.rows.length === 0) throw new EmptyImportError(FileType.DayWiseSale)
    await replaceExistingBatchByFilename(branch.id, FileType.DayWiseSale, fileName, SystemRoleCode.SUPER_ADMIN)
    const batch = await createImportBatch({
      branchId: branch.id,
      fileType: FileType.DayWiseSale,
      fileName,
      rowCount: parsed.rows.length,
      status: "processing",
    })
    return {
      accepted: { fileName, batchId: batch.id, fileType: FileType.DayWiseSale, date: null },
      prepared: { kind: FileType.DayWiseSale, batchId: batch.id, branchId: branch.id, rows: parsed.rows },
    }
  } catch (err) {
    return { rejected: { fileName, reason: err instanceof Error ? err.message : "Unknown error while reading this file" } }
  }
}

async function commitBulkFile(prepared: BulkPrepared): Promise<void> {
  try {
    let rowCount: number

    switch (prepared.kind) {
      case FileType.Stock: {
        const itemIdByCode = await resolveItemIdsByCode(
          prepared.rows.map((row) => ({ code: row.itemCode, name: row.itemName, unit: row.unit, company: row.company, manufacturer: row.manufacturer })),
        )
        rowCount = await insertStockSnapshots(buildStockSnapshotRows(prepared.rows, prepared.branchId, prepared.batchId, prepared.asOfDate, itemIdByCode))
        break
      }
      case FileType.Sales: {
        const itemIdByName = await resolveItemIdsByName(prepared.rows.map((row) => row.itemNameRaw))
        rowCount = await insertSalesLines(
          buildSalesLineRows(prepared.rows, prepared.branchId, prepared.batchId, prepared.reportDateFrom, prepared.reportDateTo, itemIdByName),
        )
        break
      }
      case FileType.Purchase: {
        const itemIdByName = await resolveItemIdsByName(prepared.rows.map((row) => row.itemNameRaw))
        rowCount = await insertPurchaseLines(
          buildPurchaseLineRows(prepared.rows, prepared.branchId, prepared.batchId, prepared.reportDateFrom, prepared.reportDateTo, itemIdByName),
        )
        break
      }
      case FileType.DayWiseSale:
        rowCount = await insertDailySalesSummary(buildDailySalesSummaryRows(prepared.rows, prepared.branchId, prepared.batchId))
        break
    }

    await updateImportBatchStatus(prepared.batchId, { status: "completed", rowCount })
    emitImportBatchUpdate({ batchId: prepared.batchId, branchId: prepared.branchId, fileType: prepared.kind, status: "completed", rowCount })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error while importing this file"
    await updateImportBatchStatus(prepared.batchId, { status: "failed", errorMessage })
    emitImportBatchUpdate({ batchId: prepared.batchId, branchId: prepared.branchId, fileType: prepared.kind, status: "failed", errorMessage })
  }
}

export async function bulkImportFiles(branchId: string, files: BulkUploadFileInputDto[]): Promise<BulkUploadResultDto> {
  const branch = await requireBranch(branchId)

  const accepted: BulkUploadAcceptedDto[] = []
  const rejected: BulkUploadRejectedDto[] = []
  const toCommit: BulkPrepared[] = []

  for (const file of files) {
    const result = await prepareBulkFile(branch, file.fileName, file.buffer)
    if ("rejected" in result) {
      rejected.push(result.rejected)
    } else {
      accepted.push(result.accepted)
      toCommit.push(result.prepared)
    }
  }

  // Not awaited — this keeps running after `bulkImportFiles` returns (plain Node async execution,
  // no queue/worker needed). The prepare loop above already ran sequentially and awaited each
  // `createImportBatch`, so if the batch includes e.g. Stock and Purchase for the same new date,
  // Stock's placeholder row is already committed by the time Purchase's sequence-gate check runs
  // — same ordering requirement as two separate uploads (Stock must come first in the file list).
  // This background loop stays sequential too, just to avoid hammering the DB with many
  // concurrent bulk inserts at once — gate correctness doesn't depend on it.
  void (async () => {
    for (const prepared of toCommit) {
      await commitBulkFile(prepared)
    }
  })()

  return { accepted, rejected }
}

export async function getImportBatches(branchId?: string, fileType?: FileTypeValue): Promise<ImportBatchListItemDto[]> {
  const [batches, branches] = await Promise.all([listImportBatches(branchId, fileType), listBranches()])
  const branchNameById = new Map(branches.map((branch) => [branch.id, branch.name]))

  return batches.map((batch) => ({
    id: batch.id,
    branchId: batch.branchId,
    branchName: branchNameById.get(batch.branchId) ?? "",
    fileType: batch.fileType as FileTypeValue,
    fileName: batch.fileName,
    rowCount: batch.rowCount,
    status: batch.status,
    errorMessage: batch.errorMessage,
    importedAt: batch.importedAt,
  }))
}

/**
 * Drives the Import page's "what do I upload next" guidance from the same source of truth the
 * upload gate itself checks (`assertUploadAllowed`) — `openDate` is the branch's latest Stock
 * date, whether or not its Purchase/Sales are done yet; null means no Stock has ever been uploaded.
 */
export async function getUploadCycleStatus(branchId: string): Promise<UploadCycleStatusDto> {
  const openDate = await findLatestBatchDate(branchId, FileType.Stock)
  if (!openDate) return { openDate: null, stockDone: false, purchaseDone: false, salesDone: false }

  const [purchaseDone, salesDone] = await Promise.all([
    hasBatchForDate(branchId, FileType.Purchase, openDate),
    hasBatchForDate(branchId, FileType.Sales, openDate),
  ])

  return { openDate, stockDone: true, purchaseDone, salesDone }
}
