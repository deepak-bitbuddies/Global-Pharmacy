import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm"

import { db, type DbOrTransaction } from "../../../../core/database/db.js"
import { InternalServerError } from "../../../../shared/errors/index.js"
import { buildPage, decodeCursor } from "../../../../shared/helpers/cursor.js"
import type { CursorPaginationParams, PaginatedResult } from "../../../../shared/types/pagination.js"
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

export async function findBranchById(branchId: string): Promise<BranchDocument | null> {
  const [branch] = await db.select().from(branches).where(eq(branches.id, branchId)).limit(1)
  return branch ?? null
}

/** `dbClient` accepts a transaction (`tx` from `db.transaction(async (tx) => ...)`) so this insert can participate in a caller's transaction; defaults to the module-level `db`. */
export async function createBranch(input: NewBranchDocument, dbClient: DbOrTransaction = db): Promise<BranchDocument> {
  const [branch] = await dbClient.insert(branches).values(input).returning()
  if (!branch) throw new InternalServerError("Failed to create branch")
  return branch
}

export async function updateBranch(branchId: string, input: Partial<NewBranchDocument>): Promise<BranchDocument | null> {
  const [branch] = await db
    .update(branches)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(branches.id, branchId))
    .returning()
  return branch ?? null
}

export async function deleteBranch(branchId: string, dbClient: DbOrTransaction = db): Promise<void> {
  await dbClient.delete(branches).where(eq(branches.id, branchId))
}

/** Full, unpaginated list — used only for branch-filter dropdowns (dashboard/report pages), which must always show every branch. Do not add pagination here; see `listBranchesPaginated` for the management page's list. */
export async function listBranches(): Promise<BranchDocument[]> {
  return db.select().from(branches).orderBy(branches.name)
}

type BranchCursor = { name: string; id: string }

/** Paginated branches list — for the branch-management page only. */
export async function listBranchesPaginated(pagination: CursorPaginationParams): Promise<PaginatedResult<BranchDocument>> {
  const cursor = decodeCursor<BranchCursor>(pagination.cursor)
  const where = cursor ? sql`(${branches.name}, ${branches.id}) > (${cursor.name}, ${cursor.id})` : undefined

  const [rows, countRows] = await Promise.all([
    db.select().from(branches).where(where).orderBy(branches.name, branches.id).limit(pagination.pageSize + 1),
    db.select({ count: sql<string>`count(*)` }).from(branches),
  ])

  const { rows: page, hasNextPage, nextCursor } = buildPage(rows, pagination.pageSize, (r) => ({ name: r.name, id: r.id }))

  return { rows: page, hasNextPage, nextCursor, total: Number(countRows[0]?.count ?? 0) }
}

export async function countImportBatchesForBranch(branchId: string): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(importBatches).where(eq(importBatches.branchId, branchId))
  return row?.count ?? 0
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
  if (missing.length === 0) return map

  // A codeless item may already exist under this name (created earlier by a Sales/Purchase
  // import that ran before Stock ever did) — adopt that row instead of creating a duplicate,
  // so rows already linked to it stay correctly connected instead of being orphaned.
  const missingNormalizedNames = missing.map((row) => normalizeItemName(row.name))
  const existingCodeless = await db
    .select()
    .from(items)
    .where(and(inArray(items.normalizedName, missingNormalizedNames), isNull(items.code)))
  const codelessByNormalizedName = new Map(existingCodeless.map((item) => [item.normalizedName, item]))

  const toCreate: StockItemInput[] = []
  for (const row of missing) {
    const codeless = codelessByNormalizedName.get(normalizeItemName(row.name))
    if (!codeless) {
      toCreate.push(row)
      continue
    }
    await db
      .update(items)
      .set({ code: row.code, unit: row.unit, company: row.company, manufacturer: row.manufacturer, updatedAt: new Date() })
      .where(eq(items.id, codeless.id))
    map.set(row.code, codeless.id)
  }

  if (toCreate.length > 0) {
    const created = await db
      .insert(items)
      .values(
        toCreate.map((row) => ({
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

/** Stock/Sales/Purchase are now single-day-per-upload, so "the batch for this date" (regardless of filename) is what re-upload/replace and the sequence gate key off. */
export async function findImportBatchByDate(branchId: string, fileType: string, date: string): Promise<ImportBatchDocument | null> {
  const [batch] = await db
    .select()
    .from(importBatches)
    .where(and(eq(importBatches.branchId, branchId), eq(importBatches.fileType, fileType), eq(importBatches.date, date)))
    .limit(1)
  return batch ?? null
}

/** The most recent dated batch of this type for the branch — e.g. the branch's latest Stock date, to find the currently-open pipeline date. */
export async function findLatestBatchDate(branchId: string, fileType: string): Promise<string | null> {
  const [row] = await db
    .select({ date: importBatches.date })
    .from(importBatches)
    .where(and(eq(importBatches.branchId, branchId), eq(importBatches.fileType, fileType)))
    .orderBy(desc(importBatches.date))
    .limit(1)
  return row?.date ?? null
}

/** Whether a dated batch of this type already exists for the branch on this exact date. */
export async function hasBatchForDate(branchId: string, fileType: string, date: string): Promise<boolean> {
  const [row] = await db
    .select({ id: importBatches.id })
    .from(importBatches)
    .where(and(eq(importBatches.branchId, branchId), eq(importBatches.fileType, fileType), eq(importBatches.date, date)))
    .limit(1)
  return !!row
}

export async function createImportBatch(input: NewImportBatchDocument): Promise<ImportBatchDocument> {
  const [batch] = await db.insert(importBatches).values(input).returning()
  if (!batch) throw new InternalServerError("Failed to record import batch")
  return batch
}

export async function deleteImportBatch(batchId: string): Promise<void> {
  await db.delete(importBatches).where(eq(importBatches.id, batchId))
}

export type ImportBatchStatusUpdate = { status: "completed" | "failed"; rowCount?: number; errorMessage?: string | null }

/** Flips a bulk-uploaded batch's placeholder "processing" row to its final outcome once the background committer finishes with it. */
export async function updateImportBatchStatus(batchId: string, update: ImportBatchStatusUpdate): Promise<void> {
  await db.update(importBatches).set(update).where(eq(importBatches.id, batchId))
}

export async function listImportBatches(branchId?: string, fileType?: string): Promise<ImportBatchDocument[]> {
  const clauses = [branchId ? eq(importBatches.branchId, branchId) : undefined, fileType ? eq(importBatches.fileType, fileType) : undefined].filter(
    (clause): clause is NonNullable<typeof clause> => clause !== undefined,
  )
  const query = db.select().from(importBatches)
  return (clauses.length > 0 ? query.where(and(...clauses)) : query).orderBy(importBatches.importedAt)
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
