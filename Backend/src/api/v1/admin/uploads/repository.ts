import { and, eq, inArray } from "drizzle-orm"

import { db } from "../../../../core/database/db.js"
import { InternalServerError } from "../../../../shared/errors/index.js"
import { normalizeItemName } from "./parsers/parse-utils.js"
import {
  branches,
  dailySalesSummary,
  importBatches,
  items,
  purchaseLines,
  salesLines,
  stockSnapshots,
  type BranchDocument,
  type ImportBatchDocument,
  type NewBranchDocument,
  type NewDailySalesSummaryDocument,
  type NewImportBatchDocument,
  type NewPurchaseLineDocument,
  type NewSalesLineDocument,
  type NewStockSnapshotDocument,
} from "./model.js"

export async function findBranchByGstin(gstin: string): Promise<BranchDocument | null> {
  const [branch] = await db.select().from(branches).where(eq(branches.gstin, gstin)).limit(1)
  return branch ?? null
}

export async function findBranchByName(name: string): Promise<BranchDocument | null> {
  const [branch] = await db.select().from(branches).where(eq(branches.name, name)).limit(1)
  return branch ?? null
}

export async function createBranch(input: NewBranchDocument): Promise<BranchDocument> {
  const [branch] = await db.insert(branches).values(input).returning()
  if (!branch) throw new InternalServerError("Failed to create branch")
  return branch
}

export async function listBranches(): Promise<BranchDocument[]> {
  return db.select().from(branches).orderBy(branches.name)
}

export async function setBranchGstin(branchId: string, gstin: string): Promise<void> {
  await db.update(branches).set({ gstin, updatedAt: new Date() }).where(eq(branches.id, branchId))
}

/** Bulk-resolves item ids by normalized name, creating any item that doesn't exist yet. */
export async function resolveItemIdsByName(names: string[]): Promise<Map<string, string>> {
  const uniqueNormalized = [...new Set(names.map(normalizeItemName))].filter(Boolean)
  if (uniqueNormalized.length === 0) return new Map()

  const existing = await db
    .select()
    .from(items)
    .where(inArray(items.normalizedName, uniqueNormalized))

  const map = new Map<string, string>(existing.map((item) => [item.normalizedName, item.id]))

  const missing = uniqueNormalized.filter((name) => !map.has(name))
  if (missing.length > 0) {
    const created = await db
      .insert(items)
      .values(missing.map((normalizedName) => ({ name: normalizedName, normalizedName })))
      .returning()
    for (const item of created) map.set(item.normalizedName, item.id)
  }

  return map
}

export type StockItemInput = {
  code: string
  name: string
  unit: string | null
  company: string | null
  manufacturer: string | null
}

/** Bulk-resolves item ids by code (Stock file is the one source with real item codes), creating any that don't exist yet. */
export async function resolveItemIdsByCode(rows: StockItemInput[]): Promise<Map<string, string>> {
  const distinctByCode = new Map(rows.map((row) => [row.code, row]))
  const codes = [...distinctByCode.keys()]
  if (codes.length === 0) return new Map()

  const existing = await db.select().from(items).where(inArray(items.code, codes))
  const map = new Map<string, string>()
  for (const item of existing) if (item.code) map.set(item.code, item.id)

  const missing = codes.filter((code) => !map.has(code)).map((code) => distinctByCode.get(code)!)
  if (missing.length > 0) {
    const created = await db
      .insert(items)
      .values(
        missing.map((row) => ({
          code: row.code,
          name: row.name,
          normalizedName: normalizeItemName(row.name),
          unit: row.unit,
          company: row.company,
          manufacturer: row.manufacturer,
        })),
      )
      .returning()
    for (const item of created) if (item.code) map.set(item.code, item.id)
  }

  return map
}

export async function findImportBatch(branchId: string, fileType: string, fileName: string): Promise<ImportBatchDocument | null> {
  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.branchId, branchId), eq(importBatches.fileType, fileType), eq(importBatches.fileName, fileName)))
    .limit(1)
  return batch ?? null
}

/** Every batch of this type for the branch, regardless of filename — used by Stock, which is a point-in-time snapshot, not a dated period, so any re-upload should replace whatever was there before. */
export async function findImportBatchesByBranchAndType(branchId: string, fileType: string): Promise<ImportBatchDocument[]> {
  return db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.branchId, branchId), eq(importBatches.fileType, fileType)))
}

export async function createImportBatch(input: NewImportBatchDocument): Promise<ImportBatchDocument> {
  const [batch] = await db.insert(importBatches).values(input).returning()
  if (!batch) throw new InternalServerError("Failed to record import batch")
  return batch
}

export async function deleteImportBatch(batchId: string): Promise<void> {
  await db.delete(importBatches).where(eq(importBatches.id, batchId))
}

export async function listImportBatches(): Promise<ImportBatchDocument[]> {
  return db.select().from(importBatches).orderBy(importBatches.importedAt)
}

export async function deleteStockSnapshotsByBatch(batchId: string): Promise<void> {
  await db.delete(stockSnapshots).where(eq(stockSnapshots.importBatchId, batchId))
}

export async function insertStockSnapshots(rows: NewStockSnapshotDocument[]): Promise<number> {
  if (rows.length === 0) return 0
  const inserted = await db.insert(stockSnapshots).values(rows).returning({ id: stockSnapshots.id })
  return inserted.length
}

export async function deleteSalesLinesByBatch(batchId: string): Promise<void> {
  await db.delete(salesLines).where(eq(salesLines.importBatchId, batchId))
}

export async function insertSalesLines(rows: NewSalesLineDocument[]): Promise<number> {
  if (rows.length === 0) return 0
  const inserted = await db.insert(salesLines).values(rows).returning({ id: salesLines.id })
  return inserted.length
}

export async function deletePurchaseLinesByBatch(batchId: string): Promise<void> {
  await db.delete(purchaseLines).where(eq(purchaseLines.importBatchId, batchId))
}

export async function insertPurchaseLines(rows: NewPurchaseLineDocument[]): Promise<number> {
  if (rows.length === 0) return 0
  const inserted = await db.insert(purchaseLines).values(rows).returning({ id: purchaseLines.id })
  return inserted.length
}

export async function deleteDailySalesSummaryByBatch(batchId: string): Promise<void> {
  await db.delete(dailySalesSummary).where(eq(dailySalesSummary.importBatchId, batchId))
}

export async function insertDailySalesSummary(rows: NewDailySalesSummaryDocument[]): Promise<number> {
  if (rows.length === 0) return 0
  const inserted = await db.insert(dailySalesSummary).values(rows).returning({ id: dailySalesSummary.id })
  return inserted.length
}
