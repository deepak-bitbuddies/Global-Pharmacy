import { FileType, type FileTypeValue } from "./enums.js"
import { EmptyImportError } from "./errors.js"
import { NotFoundError } from "../../../../shared/errors/index.js"
import type { UploadFileDto, UploadResultDto, ImportBatchListItemDto } from "./dto.js"
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
  findImportBatchesByBranchAndType,
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

/** If this exact file (same branch + type + name) was imported before, wipe its old fact rows so re-uploads replace rather than duplicate. */
async function replaceExistingBatchIfPresent(branchId: string, fileType: FileTypeValue, fileName: string): Promise<boolean> {
  const existing = await findImportBatch(branchId, fileType, fileName)
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
    case FileType.DayWiseSale:
      await deleteDailySalesSummaryByBatch(existing.id)
      break
  }
  await deleteImportBatch(existing.id)
  return true
}

/**
 * Stock is a point-in-time snapshot, not a dated period like Sales/Purchase/
 * Day-Wise Sale — there should only ever be one "current" stock batch per
 * branch. Wipe every previous stock batch for this branch regardless of
 * filename, so a re-upload under a different filename still replaces
 * instead of doubling every row (this is the fix for exactly that bug).
 */
async function replaceAllStockBatchesForBranch(branchId: string): Promise<boolean> {
  const existingBatches = await findImportBatchesByBranchAndType(branchId, FileType.Stock)
  for (const existing of existingBatches) {
    await deleteStockSnapshotsByBatch(existing.id)
    await deleteImportBatch(existing.id)
  }
  return existingBatches.length > 0
}

async function importStock(branchId: string, fileName: string, buffer: Buffer): Promise<UploadResultDto> {
  const parsed = parseStockFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Stock)

  const branch = await requireBranch(branchId)
  const replaced = await replaceAllStockBatchesForBranch(branch.id)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.Stock, fileName, rowCount: parsed.rows.length })

  const itemIdByCode = await resolveItemIdsByCode(
    parsed.rows.map((row) => ({ code: row.itemCode, name: row.itemName, unit: row.unit, company: row.company, manufacturer: row.manufacturer })),
  )

  const inserted = await insertStockSnapshots(
    parsed.rows.map((row) => ({
      branchId: branch.id,
      itemId: itemIdByCode.get(row.itemCode) ?? null,
      importBatchId: batch.id,
      asOfDate: parsed.asOfDate,
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

  const branch = await requireBranch(branchId)
  const replaced = await replaceExistingBatchIfPresent(branch.id, FileType.Sales, fileName)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.Sales, fileName, rowCount: parsed.rows.length })

  const itemIdByName = await resolveItemIdsByName(parsed.rows.map((row) => row.itemNameRaw))

  const inserted = await insertSalesLines(
    parsed.rows.map((row) => ({
      branchId: branch.id,
      itemId: itemIdByName.get(normalizeItemName(row.itemNameRaw)) ?? null,
      importBatchId: batch.id,
      reportDateFrom: parsed.reportDateFrom,
      reportDateTo: parsed.reportDateTo,
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

  const branch = await requireBranch(branchId)
  const replaced = await replaceExistingBatchIfPresent(branch.id, FileType.Purchase, fileName)
  const batch = await createImportBatch({ branchId: branch.id, fileType: FileType.Purchase, fileName, rowCount: parsed.rows.length })

  const itemIdByName = await resolveItemIdsByName(parsed.rows.map((row) => row.itemNameRaw))

  const inserted = await insertPurchaseLines(
    parsed.rows.map((row) => ({
      branchId: branch.id,
      itemId: itemIdByName.get(normalizeItemName(row.itemNameRaw)) ?? null,
      importBatchId: batch.id,
      reportDateFrom: parsed.reportDateFrom,
      reportDateTo: parsed.reportDateTo,
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
  const replaced = await replaceExistingBatchIfPresent(branch.id, FileType.DayWiseSale, fileName)
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

export async function getImportBatches(branchId?: string): Promise<ImportBatchListItemDto[]> {
  const [batches, branches] = await Promise.all([listImportBatches(branchId), listBranches()])
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
