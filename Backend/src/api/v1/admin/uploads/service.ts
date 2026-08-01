import { FileType, type FileTypeValue } from "./enums.js"
import { EmptyImportError, MissingDateError, MultiDayFileError, OutOfSequenceError } from "./errors.js"
import { NotFoundError } from "../../../../shared/errors/index.js"
import type { UploadFileDto, UploadResultDto, ImportBatchListItemDto, UploadCycleStatusDto } from "./dto.js"
import { parseStockFile } from "./parsers/stock.parser.js"
import { parseSalesFile } from "./parsers/sales.parser.js"
import { parsePurchaseFile } from "./parsers/purchase.parser.js"
import { parseDaySalesFile } from "./parsers/day-sales.parser.js"
import { normalizeItemName } from "./parsers/parse-utils.js"
import type { BranchDocument } from "./model.js"
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
} from "./repository.js"

/** Branches are now registered explicitly (see `admin/branches`) — letterhead data is no longer used to resolve or create one, just looked up by the id the upload was made against. */
async function requireBranch(branchId: string): Promise<BranchDocument> {
  const branch = await findBranchById(branchId)
  if (!branch) throw new NotFoundError("Branch not found")
  return branch
}

/** Day-Wise Sale is exempt from the dated pipeline (one row per day, inherently multi-day) — it still replaces by exact filename, as every file type did before this pipeline existed. */
async function replaceExistingBatchByFilename(branchId: string, fileType: FileTypeValue, fileName: string): Promise<boolean> {
  const existing = await findImportBatch(branchId, fileType, fileName)
  if (!existing) return false

  await deleteDailySalesSummaryByBatch(existing.id)
  await deleteImportBatch(existing.id)
  return true
}

/** Stock/Sales/Purchase are now single-day-per-upload — re-uploading for a date that already has a batch (whatever the filename) replaces it, so corrections never duplicate. */
async function replaceExistingBatchByDate(branchId: string, fileType: FileTypeValue, date: string): Promise<boolean> {
  const existing = await findImportBatchByDate(branchId, fileType, date)
  if (!existing) return false

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

async function importStock(branchId: string, fileName: string, buffer: Buffer): Promise<UploadResultDto> {
  const parsed = parseStockFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Stock)
  const asOfDate = parsed.asOfDate
  if (!asOfDate) throw new MissingDateError(FileType.Stock)

  const branch = await requireBranch(branchId)
  await assertUploadAllowed(branch.id, FileType.Stock, asOfDate)
  const replaced = await replaceExistingBatchByDate(branch.id, FileType.Stock, asOfDate)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.Stock, fileName, date: asOfDate, rowCount: parsed.rows.length })

  const itemIdByCode = await resolveItemIdsByCode(
    parsed.rows.map((row) => ({ code: row.itemCode, name: row.itemName, unit: row.unit, company: row.company, manufacturer: row.manufacturer })),
  )

  const inserted = await insertStockSnapshots(
    parsed.rows.map((row) => ({
      branchId: branch.id,
      itemId: itemIdByCode.get(row.itemCode) ?? null,
      importBatchId: batch.id,
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
    })),
  )

  return { branchId: branch.id, branchName: branch.name, fileType: FileType.Stock, fileName, rowCount: inserted, importedAt: batch.importedAt, replaced }
}

async function importSales(branchId: string, fileName: string, buffer: Buffer): Promise<UploadResultDto> {
  const parsed = parseSalesFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Sales)
  const { reportDateFrom, reportDateTo } = parsed
  if (!reportDateFrom || !reportDateTo) throw new MissingDateError(FileType.Sales)
  if (reportDateFrom !== reportDateTo) throw new MultiDayFileError(reportDateFrom, reportDateTo)

  const branch = await requireBranch(branchId)
  await assertUploadAllowed(branch.id, FileType.Sales, reportDateFrom)
  const replaced = await replaceExistingBatchByDate(branch.id, FileType.Sales, reportDateFrom)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.Sales, fileName, date: reportDateFrom, rowCount: parsed.rows.length })

  const itemIdByName = await resolveItemIdsByName(parsed.rows.map((row) => row.itemNameRaw))

  const inserted = await insertSalesLines(
    parsed.rows.map((row) => ({
      branchId: branch.id,
      itemId: itemIdByName.get(normalizeItemName(row.itemNameRaw)) ?? null,
      importBatchId: batch.id,
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
    })),
  )

  return { branchId: branch.id, branchName: branch.name, fileType: FileType.Sales, fileName, rowCount: inserted, importedAt: batch.importedAt, replaced }
}

async function importPurchase(branchId: string, fileName: string, buffer: Buffer): Promise<UploadResultDto> {
  const parsed = parsePurchaseFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Purchase)
  const { reportDateFrom, reportDateTo } = parsed
  if (!reportDateFrom || !reportDateTo) throw new MissingDateError(FileType.Purchase)
  if (reportDateFrom !== reportDateTo) throw new MultiDayFileError(reportDateFrom, reportDateTo)

  const branch = await requireBranch(branchId)
  await assertUploadAllowed(branch.id, FileType.Purchase, reportDateFrom)
  const replaced = await replaceExistingBatchByDate(branch.id, FileType.Purchase, reportDateFrom)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.Purchase, fileName, date: reportDateFrom, rowCount: parsed.rows.length })

  const itemIdByName = await resolveItemIdsByName(parsed.rows.map((row) => row.itemNameRaw))

  const inserted = await insertPurchaseLines(
    parsed.rows.map((row) => ({
      branchId: branch.id,
      itemId: itemIdByName.get(normalizeItemName(row.itemNameRaw)) ?? null,
      importBatchId: batch.id,
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
    })),
  )

  return { branchId: branch.id, branchName: branch.name, fileType: FileType.Purchase, fileName, rowCount: inserted, importedAt: batch.importedAt, replaced }
}

async function importDaySales(branchId: string, fileName: string, buffer: Buffer): Promise<UploadResultDto> {
  const parsed = parseDaySalesFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.DayWiseSale)

  const branch = await requireBranch(branchId)
  const replaced = await replaceExistingBatchByFilename(branch.id, FileType.DayWiseSale, fileName)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.DayWiseSale, fileName, rowCount: parsed.rows.length })

  const inserted = await insertDailySalesSummary(
    parsed.rows.map((row) => ({
      branchId: branch.id,
      importBatchId: batch.id,
      date: row.date,
      billNoRange: row.billNoRange,
      billValue: row.billValue,
      taxable: row.taxable,
      taxPayable: row.taxPayable,
      taxFree: row.taxFree,
      exempted: row.exempted,
      roundOff: row.roundOff,
    })),
  )

  return { branchId: branch.id, branchName: branch.name, fileType: FileType.DayWiseSale, fileName, rowCount: inserted, importedAt: batch.importedAt, replaced }
}

export async function importFile(input: UploadFileDto): Promise<UploadResultDto> {
  switch (input.fileType) {
    case FileType.Stock:
      return importStock(input.branchId, input.fileName, input.buffer)
    case FileType.Sales:
      return importSales(input.branchId, input.fileName, input.buffer)
    case FileType.Purchase:
      return importPurchase(input.branchId, input.fileName, input.buffer)
    case FileType.DayWiseSale:
      return importDaySales(input.branchId, input.fileName, input.buffer)
  }
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
