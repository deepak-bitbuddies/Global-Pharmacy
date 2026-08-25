import { and, desc, eq, gte, ilike, inArray, lte, or, sql, type AnyColumn, type SQL } from "drizzle-orm"

import { db } from "../../../../core/database/db.js"
import { buildPage, decodeCursor } from "../../../../shared/helpers/cursor.js"
import { purchaseAnalysisImportBatches, purchaseAnalysisLines } from "./model.js"
import type { ParsedPurchaseAnalysisRow } from "./parser.js"
import type { CursorPaginationParams, PurchaseAnalysisFilters } from "./dto.js"

function arrayFilter(column: AnyColumn, values: string[] | undefined): SQL | undefined {
  return values?.length ? inArray(column, values) : undefined
}

function filterClauses(filters: PurchaseAnalysisFilters): SQL[] {
  const clauses: SQL[] = []
  const partyClause = arrayFilter(purchaseAnalysisLines.partyName, filters.partyName)
  if (partyClause) clauses.push(partyClause)
  const itemClause = arrayFilter(purchaseAnalysisLines.itemName, filters.itemName)
  if (itemClause) clauses.push(itemClause)
  const companyClause = arrayFilter(purchaseAnalysisLines.companyName, filters.company)
  if (companyClause) clauses.push(companyClause)
  const typeClause = arrayFilter(purchaseAnalysisLines.type, filters.type)
  if (typeClause) clauses.push(typeClause)
  const areaClause = arrayFilter(purchaseAnalysisLines.areaName, filters.area)
  if (areaClause) clauses.push(areaClause)
  const routeClause = arrayFilter(purchaseAnalysisLines.routeName, filters.route)
  if (routeClause) clauses.push(routeClause)
  // The bill's own date — this report has no branch/upload-time date concept, this is the only
  // date dimension there is.
  if (filters.dateFrom) clauses.push(gte(purchaseAnalysisLines.billDate, filters.dateFrom))
  if (filters.dateTo) clauses.push(lte(purchaseAnalysisLines.billDate, filters.dateTo))
  if (filters.amountFrom !== undefined) clauses.push(gte(purchaseAnalysisLines.amount, filters.amountFrom))
  if (filters.amountTo !== undefined) clauses.push(lte(purchaseAnalysisLines.amount, filters.amountTo))
  if (filters.qtyFrom !== undefined) clauses.push(gte(purchaseAnalysisLines.qty, filters.qtyFrom))
  if (filters.qtyTo !== undefined) clauses.push(lte(purchaseAnalysisLines.qty, filters.qtyTo))
  if (filters.search) {
    const pattern = `%${filters.search}%`
    clauses.push(or(ilike(purchaseAnalysisLines.billNo, pattern), ilike(purchaseAnalysisLines.itemName, pattern)) as SQL)
  }
  return clauses
}

const ROW_SELECTION = {
  id: purchaseAnalysisLines.id,
  partyName: purchaseAnalysisLines.partyName,
  itemName: purchaseAnalysisLines.itemName,
  billNo: purchaseAnalysisLines.billNo,
  billDate: purchaseAnalysisLines.billDate,
  type: purchaseAnalysisLines.type,
  pan: purchaseAnalysisLines.pan,
  bankAcctNo: purchaseAnalysisLines.bankAcctNo,
  ifscCode: purchaseAnalysisLines.ifscCode,
  batch: purchaseAnalysisLines.batch,
  qty: purchaseAnalysisLines.qty,
  freeQty: purchaseAnalysisLines.freeQty,
  rate: purchaseAnalysisLines.rate,
  scheme: purchaseAnalysisLines.scheme,
  discount: purchaseAnalysisLines.discount,
  amount: purchaseAnalysisLines.amount,
  gstPct: purchaseAnalysisLines.gstPct,
  taxAmount: purchaseAnalysisLines.taxAmount,
  mrp: purchaseAnalysisLines.mrp,
  mrpAmt: purchaseAnalysisLines.mrpAmt,
  companyName: purchaseAnalysisLines.companyName,
  areaName: purchaseAnalysisLines.areaName,
  routeName: purchaseAnalysisLines.routeName,
  saleType: purchaseAnalysisLines.saleType,
  gstNo: purchaseAnalysisLines.gstNo,
}

type ListCursor = { billDate: string; id: string }

const LIST_ROW_CAP = 20_000

/** Newest bill first — same "how a ledger reads" precedent as the Expense Tracker ledger. */
export async function getPurchaseAnalysisLines(filters: PurchaseAnalysisFilters, pagination: CursorPaginationParams) {
  const where = and(...filterClauses(filters))

  const cursor = decodeCursor<ListCursor>(pagination.cursor)
  const dataWhere = cursor
    ? and(where, sql`(coalesce(${purchaseAnalysisLines.billDate}, '0001-01-01'), ${purchaseAnalysisLines.id}) < (${cursor.billDate}, ${cursor.id})`)
    : where

  const [rows, countRows] = await Promise.all([
    db
      .select(ROW_SELECTION)
      .from(purchaseAnalysisLines)
      .where(dataWhere)
      .orderBy(desc(purchaseAnalysisLines.billDate), desc(purchaseAnalysisLines.id))
      .limit(Math.min(pagination.pageSize + 1, LIST_ROW_CAP)),
    db
      .select({ count: sql<string>`count(*)` })
      .from(purchaseAnalysisLines)
      .where(where),
  ])

  const { rows: page, hasNextPage, nextCursor } = buildPage(rows, pagination.pageSize, (r) => ({ billDate: r.billDate ?? "0001-01-01", id: r.id }))
  return { rows: page, hasNextPage, nextCursor, total: Number(countRows[0]?.count ?? 0) }
}

export async function getPurchaseAnalysisSummary(filters: PurchaseAnalysisFilters) {
  const where = and(...filterClauses(filters))

  const [row] = await db
    .select({
      totalAmount: sql<string>`coalesce(sum(${purchaseAnalysisLines.amount}), 0)`,
      totalTaxAmount: sql<string>`coalesce(sum(${purchaseAnalysisLines.taxAmount}), 0)`,
      totalQty: sql<string>`coalesce(sum(${purchaseAnalysisLines.qty}), 0)`,
      billCount: sql<string>`count(distinct ${purchaseAnalysisLines.billNo})`,
      partyCount: sql<string>`count(distinct ${purchaseAnalysisLines.partyName})`,
    })
    .from(purchaseAnalysisLines)
    .where(where)

  return row ?? { totalAmount: "0", totalTaxAmount: "0", totalQty: "0", billCount: "0", partyCount: "0" }
}

export async function listPurchaseAnalysisParties(): Promise<string[]> {
  const rows = await db.selectDistinct({ partyName: purchaseAnalysisLines.partyName }).from(purchaseAnalysisLines).orderBy(purchaseAnalysisLines.partyName)
  return rows.map((row) => row.partyName)
}

export async function listPurchaseAnalysisItems(): Promise<string[]> {
  const rows = await db.selectDistinct({ itemName: purchaseAnalysisLines.itemName }).from(purchaseAnalysisLines).orderBy(purchaseAnalysisLines.itemName)
  return rows.map((row) => row.itemName)
}

export async function listPurchaseAnalysisCompanies(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ companyName: purchaseAnalysisLines.companyName })
    .from(purchaseAnalysisLines)
    .where(sql`${purchaseAnalysisLines.companyName} is not null`)
    .orderBy(purchaseAnalysisLines.companyName)
  return rows.map((row) => row.companyName).filter((value): value is string => value !== null)
}

export async function listPurchaseAnalysisTypes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ type: purchaseAnalysisLines.type })
    .from(purchaseAnalysisLines)
    .where(sql`${purchaseAnalysisLines.type} is not null`)
    .orderBy(purchaseAnalysisLines.type)
  return rows.map((row) => row.type).filter((value): value is string => value !== null)
}

export async function listPurchaseAnalysisAreas(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ areaName: purchaseAnalysisLines.areaName })
    .from(purchaseAnalysisLines)
    .where(sql`${purchaseAnalysisLines.areaName} is not null`)
    .orderBy(purchaseAnalysisLines.areaName)
  return rows.map((row) => row.areaName).filter((value): value is string => value !== null)
}

export async function listPurchaseAnalysisRoutes(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ routeName: purchaseAnalysisLines.routeName })
    .from(purchaseAnalysisLines)
    .where(sql`${purchaseAnalysisLines.routeName} is not null`)
    .orderBy(purchaseAnalysisLines.routeName)
  return rows.map((row) => row.routeName).filter((value): value is string => value !== null)
}

export async function createImportBatch(input: {
  fileName: string
  periodFrom: string | null
  periodTo: string | null
  rowCount: number
  status: string
}) {
  const [row] = await db.insert(purchaseAnalysisImportBatches).values(input).returning()
  return row ?? null
}

/** Chunked insert — a full file can run into thousands of rows, comfortably past Postgres's per-statement parameter limit if sent as one `INSERT`. Reports live progress per chunk (same reasoning as `uploads/service.ts`'s `insertRowsWithProgress`) since this now runs as a background job, not inline in the request. */
const INSERT_CHUNK_SIZE = 500

export async function insertPurchaseAnalysisLines(
  importBatchId: string,
  rows: ParsedPurchaseAnalysisRow[],
  onProgress?: (processed: number, total: number) => void,
): Promise<number> {
  let processed = 0
  for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + INSERT_CHUNK_SIZE).map((row) => ({ ...row, importBatchId }))
    if (chunk.length > 0) {
      await db.insert(purchaseAnalysisLines).values(chunk)
      processed += chunk.length
      onProgress?.(processed, rows.length)
    }
  }
  return processed
}

export async function listImportBatches() {
  return db.select().from(purchaseAnalysisImportBatches).orderBy(desc(purchaseAnalysisImportBatches.importedAt)).limit(50)
}

export async function findImportBatchById(id: string) {
  const [row] = await db.select().from(purchaseAnalysisImportBatches).where(eq(purchaseAnalysisImportBatches.id, id)).limit(1)
  return row ?? null
}

export async function updateImportBatchStatus(
  id: string,
  update: { status: string; rowCount?: number; errorMessage?: string; periodFrom?: string | null; periodTo?: string | null },
): Promise<void> {
  await db.update(purchaseAnalysisImportBatches).set(update).where(eq(purchaseAnalysisImportBatches.id, id))
}

export async function deleteImportBatch(id: string): Promise<void> {
  // No FK cascade configured — lines are removed explicitly first, same order Stock/Sales/Purchase
  // reverts already follow, so a partial failure never orphans a batch row with no lines under it.
  await db.delete(purchaseAnalysisLines).where(eq(purchaseAnalysisLines.importBatchId, id))
  await db.delete(purchaseAnalysisImportBatches).where(eq(purchaseAnalysisImportBatches.id, id))
}
