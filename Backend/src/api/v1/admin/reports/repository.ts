import { and, desc, eq, gte, lte, notExists, sql, type AnyColumn, type SQL } from "drizzle-orm"

import { db } from "../../../../core/database/db.js"
import { buildPage, decodeCursor } from "../../../../shared/helpers/cursor.js"
import {
  branches,
  dailySalesSummary,
  items,
  purchaseLines,
  salesLines,
  stockSnapshots,
} from "../uploads/model.js"
import type { CursorPaginationParams, PaginatedResult, ReportFilters } from "./dto.js"

function branchFilter(column: AnyColumn, filters: ReportFilters): SQL | undefined {
  return filters.branchId ? eq(column, filters.branchId) : undefined
}

function itemFilter(column: AnyColumn, filters: ReportFilters): SQL | undefined {
  return filters.item ? sql`${column} ilike ${"%" + filters.item + "%"}` : undefined
}

function dateRangeOverlap(fromCol: AnyColumn, toCol: AnyColumn, filters: ReportFilters): SQL[] {
  const clauses: SQL[] = []
  if (filters.dateFrom) clauses.push(lte(fromCol, filters.dateTo ?? filters.dateFrom))
  if (filters.dateTo) clauses.push(gte(toCol, filters.dateFrom ?? filters.dateTo))
  return clauses
}

// Bucket boundaries must match the tier labels the frontend's SCHEME_TIER_OPTIONS shows.
function schemeTierFilter(filters: ReportFilters): SQL | undefined {
  switch (filters.schemeTier) {
    case "none":
      return sql`${purchaseLines.schemePct} is null`
    case "lt5":
      return sql`${purchaseLines.schemePct} < 5`
    case "5to10":
      return sql`${purchaseLines.schemePct} >= 5 and ${purchaseLines.schemePct} < 10`
    case "10to20":
      return sql`${purchaseLines.schemePct} >= 10 and ${purchaseLines.schemePct} < 20`
    case "20to30":
      return sql`${purchaseLines.schemePct} >= 20 and ${purchaseLines.schemePct} < 30`
    case "30to50":
      return sql`${purchaseLines.schemePct} >= 30 and ${purchaseLines.schemePct} < 50`
    case "50to100":
      return sql`${purchaseLines.schemePct} >= 50 and ${purchaseLines.schemePct} <= 100`
    case "gte100":
      return sql`${purchaseLines.schemePct} > 100`
    default:
      return undefined
  }
}


type ItemWiseSalesCursor = { totalAmount: number; itemNameRaw: string }

export async function getItemWiseSales(filters: ReportFilters, pagination: CursorPaginationParams) {
  const filterWhere = and(
    branchFilter(salesLines.branchId, filters),
    itemFilter(salesLines.itemNameRaw, filters),
    ...dateRangeOverlap(salesLines.reportDateFrom, salesLines.reportDateTo, filters),
  )

  const grouped = db
    .select({
      itemNameRaw: salesLines.itemNameRaw,
      totalQty: sql<string>`coalesce(sum(${salesLines.qty}) filter (where ${salesLines.qty} > 0), 0)`.as("total_qty"),
      totalAmount: sql<string>`coalesce(sum(${salesLines.amount}) filter (where ${salesLines.amount} > 0), 0)`.as("total_amount"),
      returnQty: sql<string>`coalesce(abs(sum(${salesLines.qty}) filter (where ${salesLines.qty} < 0)), 0)`.as("return_qty"),
      returnAmount: sql<string>`coalesce(abs(sum(${salesLines.amount}) filter (where ${salesLines.amount} < 0)), 0)`.as("return_amount"),
    })
    .from(salesLines)
    .where(filterWhere)
    .groupBy(salesLines.itemNameRaw)
    .as("grouped")

  const cursor = decodeCursor<ItemWiseSalesCursor>(pagination.cursor)
  const dataWhere = cursor ? sql`(${grouped.totalAmount}, ${grouped.itemNameRaw}) < (${cursor.totalAmount}, ${cursor.itemNameRaw})` : undefined

  const [rows, countRows] = await Promise.all([
    db.select().from(grouped).where(dataWhere).orderBy(desc(grouped.totalAmount), grouped.itemNameRaw).limit(pagination.pageSize + 1),
    db.select({ count: sql<string>`count(*)` }).from(grouped),
  ])

  const { rows: page, hasNextPage, nextCursor } = buildPage(rows, pagination.pageSize, (r) => ({ totalAmount: Number(r.totalAmount), itemNameRaw: r.itemNameRaw }))

  return { rows: page, hasNextPage, nextCursor, total: Number(countRows[0]?.count ?? 0) } satisfies PaginatedResult<(typeof rows)[number]>
}

export async function getBranchSales(filters: ReportFilters) {
  const where = and(branchFilter(salesLines.branchId, filters), ...dateRangeOverlap(salesLines.reportDateFrom, salesLines.reportDateTo, filters))

  return db
    .select({
      branchId: salesLines.branchId,
      branchName: branches.name,
      totalAmount: sql<string>`coalesce(sum(${salesLines.amount}), 0)`,
    })
    .from(salesLines)
    .innerJoin(branches, eq(branches.id, salesLines.branchId))
    .where(where)
    .groupBy(salesLines.branchId, branches.name)
    .orderBy(desc(sql`sum(${salesLines.amount})`))
}

/**
 * Approximate GP: sales amount minus (sales qty * item's average cost price
 * from Stock). Only covers items that resolved to a matched item id — see
 * the item-matching caveat in `uploads/service.ts`.
 */
type GrossProfitCursor = { salesAmount: number; itemName: string }

export async function getGrossProfitByItem(filters: ReportFilters, pagination: CursorPaginationParams) {
  const filterWhere = and(
    branchFilter(salesLines.branchId, filters),
    itemFilter(salesLines.itemNameRaw, filters),
    ...dateRangeOverlap(salesLines.reportDateFrom, salesLines.reportDateTo, filters),
  )

  const costByItem = db
    .select({
      itemId: stockSnapshots.itemId,
      avgCostPrice: sql<string>`avg(${stockSnapshots.costPrice})`.as("avg_cost_price"),
    })
    .from(stockSnapshots)
    .where(filters.branchId ? eq(stockSnapshots.branchId, filters.branchId) : undefined)
    .groupBy(stockSnapshots.itemId)
    .as("cost_by_item")

  const grouped = db
    .select({
      itemName: salesLines.itemNameRaw,
      salesAmount: sql<string>`coalesce(sum(${salesLines.amount}), 0)`.as("sales_amount"),
      salesQty: sql<string>`coalesce(sum(${salesLines.qty}), 0)`.as("sales_qty"),
      avgCostPrice: costByItem.avgCostPrice,
    })
    .from(salesLines)
    .leftJoin(costByItem, eq(costByItem.itemId, salesLines.itemId))
    .where(filterWhere)
    .groupBy(salesLines.itemNameRaw, costByItem.avgCostPrice)
    .as("grouped")

  const cursor = decodeCursor<GrossProfitCursor>(pagination.cursor)
  const dataWhere = cursor ? sql`(${grouped.salesAmount}, ${grouped.itemName}) < (${cursor.salesAmount}, ${cursor.itemName})` : undefined

  const [rows, countRows] = await Promise.all([
    db.select().from(grouped).where(dataWhere).orderBy(desc(grouped.salesAmount), grouped.itemName).limit(pagination.pageSize + 1),
    db.select({ count: sql<string>`count(*)` }).from(grouped),
  ])

  const { rows: page, hasNextPage, nextCursor } = buildPage(rows, pagination.pageSize, (r) => ({ salesAmount: Number(r.salesAmount), itemName: r.itemName }))

  return { rows: page, hasNextPage, nextCursor, total: Number(countRows[0]?.count ?? 0) } satisfies PaginatedResult<(typeof rows)[number]>
}

type PurchaseSummaryCursor = { totalAmount: number; supplierGroup: string }

export async function getPurchaseSummary(filters: ReportFilters, pagination: CursorPaginationParams) {
  const filterWhere = and(
    branchFilter(purchaseLines.branchId, filters),
    itemFilter(purchaseLines.itemNameRaw, filters),
    ...dateRangeOverlap(purchaseLines.reportDateFrom, purchaseLines.reportDateTo, filters),
  )

  const grouped = db
    .select({
      supplierGroup: purchaseLines.supplierGroup,
      totalAmount: sql<string>`coalesce(sum(${purchaseLines.amount}), 0)`.as("total_amount"),
      totalQty: sql<string>`coalesce(sum(${purchaseLines.qty}), 0)`.as("total_qty"),
      totalFreeQty: sql<string>`coalesce(sum(${purchaseLines.freeQty}), 0)`.as("total_free_qty"),
    })
    .from(purchaseLines)
    .where(filterWhere)
    .groupBy(purchaseLines.supplierGroup)
    .as("grouped")

  const cursor = decodeCursor<PurchaseSummaryCursor>(pagination.cursor)
  const dataWhere = cursor ? sql`(${grouped.totalAmount}, ${grouped.supplierGroup}) < (${cursor.totalAmount}, ${cursor.supplierGroup})` : undefined

  const [rows, countRows] = await Promise.all([
    db.select().from(grouped).where(dataWhere).orderBy(desc(grouped.totalAmount), grouped.supplierGroup).limit(pagination.pageSize + 1),
    db.select({ count: sql<string>`count(*)` }).from(grouped),
  ])

  const { rows: page, hasNextPage, nextCursor } = buildPage(rows, pagination.pageSize, (r) => ({ totalAmount: Number(r.totalAmount), supplierGroup: r.supplierGroup }))

  return { rows: page, hasNextPage, nextCursor, total: Number(countRows[0]?.count ?? 0) } satisfies PaginatedResult<(typeof rows)[number]>
}

type PurchaseDetailCursor = { itemNameRaw: string; id: string }

export async function getPurchaseDetail(filters: ReportFilters, pagination: CursorPaginationParams) {
  // Purchase register rows carry no company field of their own — it's only reachable via the
  // (name-matched, best-effort) item link, so it's null wherever that item hasn't also matched a
  // Stock import. Left join so rows without a match still come back, just with company: null.
  const filterWhere = and(
    branchFilter(purchaseLines.branchId, filters),
    itemFilter(purchaseLines.itemNameRaw, filters),
    filters.company ? eq(items.company, filters.company) : undefined,
    schemeTierFilter(filters),
    ...dateRangeOverlap(purchaseLines.reportDateFrom, purchaseLines.reportDateTo, filters),
  )

  const cursor = decodeCursor<PurchaseDetailCursor>(pagination.cursor)
  const dataWhere = cursor
    ? and(filterWhere, sql`(${purchaseLines.itemNameRaw}, ${purchaseLines.id}) > (${cursor.itemNameRaw}, ${cursor.id})`)
    : filterWhere

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: purchaseLines.id,
        supplierGroup: purchaseLines.supplierGroup,
        itemNameRaw: purchaseLines.itemNameRaw,
        packSizeRaw: purchaseLines.packSizeRaw,
        qty: purchaseLines.qty,
        freeQty: purchaseLines.freeQty,
        rate: purchaseLines.rate,
        amount: purchaseLines.amount,
        schemePct: purchaseLines.schemePct,
        company: items.company,
      })
      .from(purchaseLines)
      .leftJoin(items, eq(items.id, purchaseLines.itemId))
      .where(dataWhere)
      // `id` is a tiebreaker — many lines share an item name across suppliers/batches,
      // and keyset pagination needs a fully-deterministic sort to seek on.
      .orderBy(purchaseLines.itemNameRaw, purchaseLines.id)
      .limit(pagination.pageSize + 1),
    db
      .select({ count: sql<string>`count(*)` })
      .from(purchaseLines)
      .leftJoin(items, eq(items.id, purchaseLines.itemId))
      .where(filterWhere),
  ])

  const { rows: page, hasNextPage, nextCursor } = buildPage(rows, pagination.pageSize, (r) => ({ itemNameRaw: r.itemNameRaw, id: r.id }))

  return { rows: page, hasNextPage, nextCursor, total: Number(countRows[0]?.count ?? 0) } satisfies PaginatedResult<(typeof rows)[number]>
}

type StockReportCursor = { itemName: string; id: string }

export async function getStockReport(filters: ReportFilters, pagination: CursorPaginationParams) {
  const clauses = [branchFilter(stockSnapshots.branchId, filters), itemFilter(stockSnapshots.itemName, filters)]
  if (filters.company) clauses.push(eq(stockSnapshots.company, filters.company))
  const filterWhere = and(...clauses)

  const cursor = decodeCursor<StockReportCursor>(pagination.cursor)
  const dataWhere = cursor
    ? and(filterWhere, sql`(${stockSnapshots.itemName}, ${stockSnapshots.id}) > (${cursor.itemName}, ${cursor.id})`)
    : filterWhere

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: stockSnapshots.id,
        itemCode: stockSnapshots.itemCode,
        itemName: stockSnapshots.itemName,
        unit: stockSnapshots.unit,
        currentStock: stockSnapshots.currentStock,
        costPrice: stockSnapshots.costPrice,
        value: stockSnapshots.value,
        company: stockSnapshots.company,
        batch: stockSnapshots.batch,
        expDate: stockSnapshots.expDate,
        supplier: stockSnapshots.supplier,
      })
      .from(stockSnapshots)
      .where(dataWhere)
      // `id` is a tiebreaker — many rows share an item name across batches,
      // and keyset pagination needs a fully-deterministic sort to seek on.
      .orderBy(stockSnapshots.itemName, stockSnapshots.id)
      .limit(pagination.pageSize + 1),
    db.select({ count: sql<string>`count(*)` }).from(stockSnapshots).where(filterWhere),
  ])

  const { rows: page, hasNextPage, nextCursor } = buildPage(rows, pagination.pageSize, (r) => ({ itemName: r.itemName, id: r.id }))

  return { rows: page, hasNextPage, nextCursor, total: Number(countRows[0]?.count ?? 0) } satisfies PaginatedResult<(typeof rows)[number]>
}

/** Items with sales in the period but zero current stock — reorder candidates. */
export async function getZeroOrderAlerts(filters: ReportFilters) {
  const where = and(branchFilter(salesLines.branchId, filters), ...dateRangeOverlap(salesLines.reportDateFrom, salesLines.reportDateTo, filters))

  const soldItems = db
    .select({
      itemId: salesLines.itemId,
      itemName: sql<string>`max(${salesLines.itemNameRaw})`.as("item_name"),
      soldQty: sql<string>`sum(${salesLines.qty})`.as("sold_qty"),
    })
    .from(salesLines)
    .where(and(where, sql`${salesLines.itemId} is not null`))
    .groupBy(salesLines.itemId)
    .as("sold_items")

  const stockByItem = db
    .select({
      itemId: stockSnapshots.itemId,
      currentStock: sql<string>`sum(${stockSnapshots.currentStock})`.as("current_stock"),
    })
    .from(stockSnapshots)
    .where(filters.branchId ? eq(stockSnapshots.branchId, filters.branchId) : undefined)
    .groupBy(stockSnapshots.itemId)
    .as("stock_by_item")

  return db
    .select({
      itemName: soldItems.itemName,
      currentStock: sql<string>`coalesce(${stockByItem.currentStock}, 0)`,
      soldQtyInPeriod: soldItems.soldQty,
    })
    .from(soldItems)
    .leftJoin(stockByItem, eq(stockByItem.itemId, soldItems.itemId))
    .where(sql`coalesce(${stockByItem.currentStock}, 0) <= 0`)
    .orderBy(desc(soldItems.soldQty))
}

export async function getExpiryReport(filters: ReportFilters, withinDays: number) {
  const clauses = [
    branchFilter(stockSnapshots.branchId, filters),
    sql`${stockSnapshots.expDate} is not null`,
    sql`${stockSnapshots.expDate} <= current_date + ${withinDays}::int`,
  ]

  return db
    .select({
      itemName: stockSnapshots.itemName,
      batch: stockSnapshots.batch,
      currentStock: stockSnapshots.currentStock,
      expDate: stockSnapshots.expDate,
      daysToExpiry: sql<number>`(${stockSnapshots.expDate} - current_date)::int`,
      value: stockSnapshots.value,
    })
    .from(stockSnapshots)
    .where(and(...clauses))
    .orderBy(stockSnapshots.expDate)
}

/** Items in stock with no matching sales line at all for this branch (ever imported) — non-moving candidates. */
export async function getNonMovingItems(filters: ReportFilters) {
  const clauses = [branchFilter(stockSnapshots.branchId, filters), sql`${stockSnapshots.itemId} is not null`]

  return db
    .select({
      itemName: stockSnapshots.itemName,
      currentStock: stockSnapshots.currentStock,
      value: stockSnapshots.value,
    })
    .from(stockSnapshots)
    .where(
      and(
        ...clauses,
        notExists(
          db
            .select({ one: sql`1` })
            .from(salesLines)
            .where(eq(salesLines.itemId, stockSnapshots.itemId)),
        ),
      ),
    )
    .orderBy(desc(stockSnapshots.value))
}

export async function getDailyCollection(filters: ReportFilters) {
  const clauses = [branchFilter(dailySalesSummary.branchId, filters)]
  if (filters.dateFrom) clauses.push(gte(dailySalesSummary.date, filters.dateFrom))
  if (filters.dateTo) clauses.push(lte(dailySalesSummary.date, filters.dateTo))

  return db
    .select({ date: dailySalesSummary.date, billValue: dailySalesSummary.billValue })
    .from(dailySalesSummary)
    .where(and(...clauses))
    .orderBy(dailySalesSummary.date)
}

export async function getCashInHand(filters: ReportFilters) {
  const where = and(
    branchFilter(salesLines.branchId, filters),
    eq(salesLines.partyGroup, "CASH"),
    ...dateRangeOverlap(salesLines.reportDateFrom, salesLines.reportDateTo, filters),
  )

  return db
    .select({
      branchId: salesLines.branchId,
      branchName: branches.name,
      cashTotal: sql<string>`coalesce(sum(${salesLines.amount}), 0)`,
    })
    .from(salesLines)
    .innerJoin(branches, eq(branches.id, salesLines.branchId))
    .where(where)
    .groupBy(salesLines.branchId, branches.name)
}

export async function getOutstanding(filters: ReportFilters) {
  const where = and(
    branchFilter(salesLines.branchId, filters),
    eq(salesLines.partyGroup, "CREDIT DUE BILL"),
    ...dateRangeOverlap(salesLines.reportDateFrom, salesLines.reportDateTo, filters),
  )

  return db
    .select({
      branchId: salesLines.branchId,
      branchName: branches.name,
      outstandingTotal: sql<string>`coalesce(sum(${salesLines.amount}), 0)`,
    })
    .from(salesLines)
    .innerJoin(branches, eq(branches.id, salesLines.branchId))
    .where(where)
    .groupBy(salesLines.branchId, branches.name)
}

export async function getTotalStockValue(filters: ReportFilters): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${stockSnapshots.value}), 0)` })
    .from(stockSnapshots)
    .where(branchFilter(stockSnapshots.branchId, filters))
  return Number(row?.total ?? 0)
}

function stockFilterClauses(filters: ReportFilters): SQL[] {
  const clauses = [branchFilter(stockSnapshots.branchId, filters), itemFilter(stockSnapshots.itemName, filters)].filter((c): c is SQL => c !== undefined)
  if (filters.company) clauses.push(eq(stockSnapshots.company, filters.company))
  return clauses
}

/** Total value + unique item count + a fixed quantity-bucket distribution — everything the Stock tab's KPI row and distribution chart need, computed server-side (not summed/bucketed from `getStockReport`, which is now just one page). */
export async function getStockSummary(filters: ReportFilters): Promise<{ totalValue: number; uniqueItemCount: number; levelCounts: { bucket: string; count: number }[] }> {
  const where = and(...stockFilterClauses(filters))

  const [totals, levels] = await Promise.all([
    db
      .select({
        totalValue: sql<string>`coalesce(sum(${stockSnapshots.value}), 0)`,
        uniqueItemCount: sql<string>`count(distinct ${stockSnapshots.itemName})`,
      })
      .from(stockSnapshots)
      .where(where),
    db
      .select({
        bucket: sql<string>`case
          when ${stockSnapshots.currentStock} <= 0 then 'Zero Stock'
          when ${stockSnapshots.currentStock} <= 5 then '1–5 units'
          when ${stockSnapshots.currentStock} <= 20 then '6–20 units'
          when ${stockSnapshots.currentStock} <= 50 then '21–50 units'
          else '50+ units'
        end`,
        count: sql<string>`count(*)`,
      })
      .from(stockSnapshots)
      .where(where)
      .groupBy(sql`1`),
  ])

  return {
    totalValue: Number(totals[0]?.totalValue ?? 0),
    uniqueItemCount: Number(totals[0]?.uniqueItemCount ?? 0),
    levelCounts: levels.map((row) => ({ bucket: row.bucket, count: Number(row.count) })),
  }
}

/** Top companies by stock value — a small, fixed-size aggregate, no pagination needed. */
export async function getStockValueByCompany(filters: ReportFilters): Promise<{ company: string; total: number }[]> {
  const where = and(...stockFilterClauses(filters), sql`${stockSnapshots.company} is not null`)

  const rows = await db
    .select({ company: stockSnapshots.company, total: sql<string>`coalesce(sum(${stockSnapshots.value}), 0)` })
    .from(stockSnapshots)
    .where(where)
    .groupBy(stockSnapshots.company)
    .orderBy(desc(sql`sum(${stockSnapshots.value})`))
    .limit(8)

  return rows.filter((row): row is { company: string; total: string } => row.company !== null).map((row) => ({ company: row.company, total: Number(row.total) }))
}

/** Grand total across all suppliers — for the dashboard summary tile, which needs the true total, not one page of `getPurchaseSummary`. */
export async function getTotalPurchaseValue(filters: ReportFilters): Promise<number> {
  const where = and(
    branchFilter(purchaseLines.branchId, filters),
    itemFilter(purchaseLines.itemNameRaw, filters),
    ...dateRangeOverlap(purchaseLines.reportDateFrom, purchaseLines.reportDateTo, filters),
  )
  const [row] = await db.select({ total: sql<string>`coalesce(sum(${purchaseLines.amount}), 0)` }).from(purchaseLines).where(where)
  return Number(row?.total ?? 0)
}

export async function listCompanies(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ company: items.company })
    .from(items)
    .where(sql`${items.company} is not null`)
    .orderBy(items.company)
  return rows.map((row) => row.company).filter((c): c is string => c !== null)
}
