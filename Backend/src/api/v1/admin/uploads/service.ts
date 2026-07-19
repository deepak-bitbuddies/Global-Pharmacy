import { FileType, type FileTypeValue } from "./enums.js"
import { EmptyImportError } from "./errors.js"
import type { UploadFileDto, UploadResultDto, ImportBatchListItemDto } from "./dto.js"
import { parseStockFile } from "./parsers/stock.parser.js"
import { parseSalesFile } from "./parsers/sales.parser.js"
import { parsePurchaseFile } from "./parsers/purchase.parser.js"
import { parseDaySalesFile } from "./parsers/day-sales.parser.js"
import { normalizeItemName, type BranchHeader } from "./parsers/parse-utils.js"
import type { BranchDocument } from "./model.js"
import {
  createBranch,
  createImportBatch,
  deleteDailySalesSummaryByBatch,
  deleteImportBatch,
  deletePurchaseLinesByBatch,
  deleteSalesLinesByBatch,
  deleteStockSnapshotsByBatch,
  findBranchByGstin,
  findBranchByName,
  findImportBatch,
  findImportBatchesByBranchAndType,
  setBranchGstin,
  insertDailySalesSummary,
  insertPurchaseLines,
  insertSalesLines,
  insertStockSnapshots,
  listImportBatches,
  resolveItemIdsByCode,
  resolveItemIdsByName,
} from "./repository.js"

/**
 * Resolves the branch a file belongs to from its letterhead. GSTIN (present
 * on Sale/Purchase/Day-Wise Sale exports) is the reliable key; the Stock
 * export has no GSTIN, so it falls back to matching by name. Creates the
 * branch on first sight either way.
 */
async function resolveBranch(header: BranchHeader): Promise<BranchDocument> {
  if (header.gstin) {
    const byGstin = await findBranchByGstin(header.gstin)
    if (byGstin) return byGstin
  }

  const byName = await findBranchByName(header.name)
  if (byName) {
    // Learned the real GSTIN from this (later) file — backfill it so
    // future GSTIN-bearing files resolve directly instead of by name.
    if (header.gstin && !byName.gstin) {
      await setBranchGstin(byName.id, header.gstin)
      return { ...byName, gstin: header.gstin }
    }
    return byName
  }

  return createBranch({
    name: header.name,
    address: header.address,
    gstin: header.gstin,
    phone: header.phone,
    drugLicenseNo: header.drugLicenseNo,
  })
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

async function importStock(fileName: string, buffer: Buffer): Promise<UploadResultDto> {
  const parsed = parseStockFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Stock)

  const branch = await resolveBranch({ ...parsed.branch, gstin: null, phone: null, drugLicenseNo: null })
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

async function importSales(fileName: string, buffer: Buffer): Promise<UploadResultDto> {
  const parsed = parseSalesFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Sales)

  const branch = await resolveBranch(parsed.branch)
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

async function importPurchase(fileName: string, buffer: Buffer): Promise<UploadResultDto> {
  const parsed = parsePurchaseFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.Purchase)

  const branch = await resolveBranch(parsed.branch)
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
    })),
  )

  return { branchId: branch.id, branchName: branch.name, fileType: FileType.Purchase, fileName, rowCount: inserted, importedAt: batch.importedAt, replaced }
}

async function importDaySales(fileName: string, buffer: Buffer): Promise<UploadResultDto> {
  const parsed = parseDaySalesFile(buffer)
  if (parsed.rows.length === 0) throw new EmptyImportError(FileType.DayWiseSale)

  const branch = await resolveBranch(parsed.branch)
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
      return importStock(input.fileName, input.buffer)
    case FileType.Sales:
      return importSales(input.fileName, input.buffer)
    case FileType.Purchase:
      return importPurchase(input.fileName, input.buffer)
    case FileType.DayWiseSale:
      return importDaySales(input.fileName, input.buffer)
  }
}

export async function getImportBatches(): Promise<ImportBatchListItemDto[]> {
  const batches = await listImportBatches()
  return batches.map((batch) => ({
    id: batch.id,
    branchId: batch.branchId,
    branchName: "", // populated by controller-level join if ever needed; not required by the current UI
    fileType: batch.fileType as FileTypeValue,
    fileName: batch.fileName,
    rowCount: batch.rowCount,
    status: batch.status,
    importedAt: batch.importedAt,
  }))
}
