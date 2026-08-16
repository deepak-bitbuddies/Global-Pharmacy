import { and, desc, eq, gte, ilike, lte, notExists, or, sql, type AnyColumn, type SQL } from "drizzle-orm"

import { db } from "../../../../core/database/db.js"
import { buildPage, decodeCursor } from "../../../../shared/helpers/cursor.js"
import { InternalServerError } from "../../../../shared/errors/index.js"
import {
  branches,
  dailySalesSummary,
  items,
  purchaseLines,
  salesLines,
  stockSnapshots,
} from "../uploads/model.js"
import { exportJobs, type ExportJobDocument } from "./model.js"
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

// Bucket boundaries must match the tier labels the frontend's EXPIRY_TIER_OPTIONS shows, and the
// "Expiring ≤30 days" dashboard KPI's own 30-day threshold (`getExpiryReport`'s default `withinDays`).
function expiryTierFilter(filters: ReportFilters): SQL | undefined {
  switch (filters.expiryTier) {
    case "none":
      return sql`${stockSnapshots.expDate} is null`
    case "expired":
      return sql`${stockSnapshots.expDate} is not null and ${stockSnapshots.expDate} < current_date`
    case "lte30":
      return sql`${stockSnapshots.expDate} is not null and ${stockSnapshots.expDate} >= current_date and ${stockSnapshots.expDate} < current_date + 30`
    case "31to60":
      return sql`${stockSnapshots.expDate} is not null and ${stockSnapshots.expDate} >= current_date + 30 and ${stockSnapshots.expDate} < current_date + 60`
    case "61to90":
      return sql`${stockSnapshots.expDate} is not null and ${stockSnapshots.expDate} >= current_date + 60 and ${stockSnapshots.expDate} < current_date + 90`
    case "gt90":
      return sql`${stockSnapshots.expDate} is not null and ${stockSnapshots.expDate} >= current_date + 90`
    case "custom": {
      const clauses = [
        filters.expiryDateFrom ? gte(stockSnapshots.expDate, filters.expiryDateFrom) : undefined,
        filters.expiryDateTo ? lte(stockSnapshots.expDate, filters.expiryDateTo) : undefined,
      ].filter((c): c is SQL => c !== undefined)
      return clauses.length > 0 ? and(...clauses) : undefined
    }
    default:
      return undefined
  }
}


type ItemWiseSalesCursor = { totalAmount: number; itemNameRaw: string }

export async function getItemWiseSales(filters: ReportFilters, pagination: CursorPaginationParams) {
  // Sales register rows carry no company field of their own — same as Purchase, only reachable
  // via the (name-matched, best-effort) item link, so it's null wherever that item hasn't also
  // matched a Stock import. Left join so rows without a match still come back, just with
  // company: null. Grouping by it alongside itemNameRaw doesn't fragment rows: a given raw item
  // name always resolves to the same item (and therefore the same company).
  // Branch is now also part of the grouping key — without a branch filter, the same item sold
  // from multiple branches now returns one row per branch instead of a cross-branch total.
  const filterWhere = and(
    branchFilter(salesLines.branchId, filters),
    itemFilter(salesLines.itemNameRaw, filters),
    filters.company ? eq(items.company, filters.company) : undefined,
    ...dateRangeOverlap(salesLines.reportDateFrom, salesLines.reportDateTo, filters),
  )

  const grouped = db
    .select({
      itemNameRaw: salesLines.itemNameRaw,
      company: items.company,
      branchId: salesLines.branchId,
      branchName: branches.name,
      totalQty: sql<string>`coalesce(sum(${salesLines.qty}) filter (where ${salesLines.qty} > 0), 0)`.as("total_qty"),
      totalAmount: sql<string>`coalesce(sum(${salesLines.amount}) filter (where ${salesLines.amount} > 0), 0)`.as("total_amount"),
      returnQty: sql<string>`coalesce(abs(sum(${salesLines.qty}) filter (where ${salesLines.qty} < 0)), 0)`.as("return_qty"),
      returnAmount: sql<string>`coalesce(abs(sum(${salesLines.amount}) filter (where ${salesLines.amount} < 0)), 0)`.as("return_amount"),
    })
    .from(salesLines)
    .leftJoin(items, eq(items.id, salesLines.itemId))
    .innerJoin(branches, eq(branches.id, salesLines.branchId))
    .where(filterWhere)
    .groupBy(salesLines.itemNameRaw, items.company, salesLines.branchId, branches.name)
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

type SalesDetailCursor = { itemNameRaw: string; id: string }

/** Flat, unaggregated sales lines — same shape/pagination pattern as `getPurchaseDetail`, one row per line item instead of `getItemWiseSales`'s period-aggregated totals. */
export async function getSalesDetail(filters: ReportFilters, pagination: CursorPaginationParams) {
  const filterWhere = and(
    branchFilter(salesLines.branchId, filters),
    itemFilter(salesLines.itemNameRaw, filters),
    filters.company ? eq(items.company, filters.company) : undefined,
    filters.amountFrom !== undefined ? gte(salesLines.amount, filters.amountFrom) : undefined,
    filters.amountTo !== undefined ? lte(salesLines.amount, filters.amountTo) : undefined,
    ...dateRangeOverlap(salesLines.reportDateFrom, salesLines.reportDateTo, filters),
  )

  const cursor = decodeCursor<SalesDetailCursor>(pagination.cursor)
  const dataWhere = cursor
    ? and(filterWhere, sql`(${salesLines.itemNameRaw}, ${salesLines.id}) > (${cursor.itemNameRaw}, ${cursor.id})`)
    : filterWhere

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: salesLines.id,
        partyGroup: salesLines.partyGroup,
        itemNameRaw: salesLines.itemNameRaw,
        packSizeRaw: salesLines.packSizeRaw,
        qty: salesLines.qty,
        unit: salesLines.unit,
        rate: salesLines.rate,
        amount: salesLines.amount,
        company: items.company,
        branchId: salesLines.branchId,
        branchName: branches.name,
        date: salesLines.reportDateFrom,
      })
      .from(salesLines)
      .leftJoin(items, eq(items.id, salesLines.itemId))
      .innerJoin(branches, eq(branches.id, salesLines.branchId))
      .where(dataWhere)
      // `id` is a tiebreaker — many lines share an item name across parties/bills,
      // and keyset pagination needs a fully-deterministic sort to seek on.
      .orderBy(salesLines.itemNameRaw, salesLines.id)
      .limit(pagination.pageSize + 1),
    db
      .select({ count: sql<string>`count(*)` })
      .from(salesLines)
      .leftJoin(items, eq(items.id, salesLines.itemId))
      .where(filterWhere),
  ])

  const { rows: page, hasNextPage, nextCursor } = buildPage(rows, pagination.pageSize, (r) => ({ itemNameRaw: r.itemNameRaw, id: r.id }))

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
    filters.supplierGroup ? eq(purchaseLines.supplierGroup, filters.supplierGroup) : undefined,
    filters.amountFrom !== undefined ? gte(purchaseLines.amount, filters.amountFrom) : undefined,
    filters.amountTo !== undefined ? lte(purchaseLines.amount, filters.amountTo) : undefined,
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
        branchId: purchaseLines.branchId,
        branchName: branches.name,
        date: purchaseLines.reportDateFrom,
      })
      .from(purchaseLines)
      .leftJoin(items, eq(items.id, purchaseLines.itemId))
      .innerJoin(branches, eq(branches.id, purchaseLines.branchId))
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
  const filterWhere = and(...stockFilterClauses(filters))

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
        mrp: stockSnapshots.mrp,
        purchasePrice: stockSnapshots.purchasePrice,
        salesPrice: stockSnapshots.salesPrice,
        company: stockSnapshots.company,
        manufacturer: stockSnapshots.manufacturer,
        batch: stockSnapshots.batch,
        mfgDateRaw: stockSnapshots.mfgDateRaw,
        expDate: stockSnapshots.expDate,
        supplier: stockSnapshots.supplier,
        invNo: stockSnapshots.invNo,
        invDate: stockSnapshots.invDate,
        rackNo: stockSnapshots.rackNo,
        salesSchemeDeal: stockSnapshots.salesSchemeDeal,
        salesSchemeFree: stockSnapshots.salesSchemeFree,
        purcSchemeDeal: stockSnapshots.purcSchemeDeal,
        purcSchemeFree: stockSnapshots.purcSchemeFree,
        recDate: stockSnapshots.recDate,
        asOfDate: stockSnapshots.asOfDate,
        daysToExpiry: sql<number | null>`case when ${stockSnapshots.expDate} is null then null else (${stockSnapshots.expDate} - current_date)::int end`,
        branchId: stockSnapshots.branchId,
        branchName: branches.name,
      })
      .from(stockSnapshots)
      .innerJoin(branches, eq(branches.id, stockSnapshots.branchId))
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
    .where(and(filters.branchId ? eq(stockSnapshots.branchId, filters.branchId) : undefined, latestStockDateClause()))
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
    latestStockDateClause(),
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
  const clauses = [branchFilter(stockSnapshots.branchId, filters), latestStockDateClause(), sql`${stockSnapshots.itemId} is not null`]

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

type DaySalesDetailCursor = { date: string; id: string }

/** Day-Wise Sale is exempt from the dated Stock->Purchase->Sales pipeline (one row per day, inherently multi-day) — this is its own itemized listing, not summed with anything else. */
export async function getDaySalesDetail(filters: ReportFilters, pagination: CursorPaginationParams) {
  const clauses = [branchFilter(dailySalesSummary.branchId, filters)]
  if (filters.dateFrom) clauses.push(gte(dailySalesSummary.date, filters.dateFrom))
  if (filters.dateTo) clauses.push(lte(dailySalesSummary.date, filters.dateTo))
  const filterWhere = and(...clauses)

  const cursor = decodeCursor<DaySalesDetailCursor>(pagination.cursor)
  const dataWhere = cursor
    ? and(filterWhere, sql`(${dailySalesSummary.date}, ${dailySalesSummary.id}) > (${cursor.date}, ${cursor.id})`)
    : filterWhere

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: dailySalesSummary.id,
        date: dailySalesSummary.date,
        billNoRange: dailySalesSummary.billNoRange,
        billValue: dailySalesSummary.billValue,
        taxable: dailySalesSummary.taxable,
        taxPayable: dailySalesSummary.taxPayable,
        taxFree: dailySalesSummary.taxFree,
        exempted: dailySalesSummary.exempted,
        roundOff: dailySalesSummary.roundOff,
        branchId: dailySalesSummary.branchId,
        branchName: branches.name,
      })
      .from(dailySalesSummary)
      .innerJoin(branches, eq(branches.id, dailySalesSummary.branchId))
      .where(dataWhere)
      // `id` is a tiebreaker — multiple rows can share a date, and keyset pagination
      // needs a fully-deterministic sort to seek on.
      .orderBy(dailySalesSummary.date, dailySalesSummary.id)
      .limit(pagination.pageSize + 1),
    db.select({ count: sql<string>`count(*)` }).from(dailySalesSummary).where(filterWhere),
  ])

  const { rows: page, hasNextPage, nextCursor } = buildPage(rows, pagination.pageSize, (r) => ({ date: r.date, id: r.id }))

  return { rows: page, hasNextPage, nextCursor, total: Number(countRows[0]?.count ?? 0) } satisfies PaginatedResult<(typeof rows)[number]>
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
  // "DUE BILLS" is the real party group Marg's Sales register uses for credit dues — this
  // previously matched "CREDIT DUE BILL", a string that never actually occurs in the data, so
  // Outstanding silently always came back as 0 regardless of what was actually owed.
  const where = and(
    branchFilter(salesLines.branchId, filters),
    eq(salesLines.partyGroup, "DUE BILLS"),
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
    .where(and(branchFilter(stockSnapshots.branchId, filters), latestStockDateClause()))
  return Number(row?.total ?? 0)
}

/** Stock's item search matches name, code, batch, or rack no — Batch/Rack No used to be their own filter fields but folded into the one search box so users don't have to know which box to type a rack/batch number into. */
function stockItemFilter(filters: ReportFilters): SQL | undefined {
  if (!filters.item) return undefined
  const pattern = `%${filters.item}%`
  return or(
    ilike(stockSnapshots.itemName, pattern),
    ilike(stockSnapshots.itemCode, pattern),
    ilike(stockSnapshots.batch, pattern),
    ilike(stockSnapshots.rackNo, pattern),
  )
}

/**
 * Stock now accumulates one snapshot per uploaded date (only a same-date re-upload replaces),
 * instead of always holding just the single "current" snapshot for each item. Any query that reads
 * `stock_snapshots` without pinning down a date would silently sum/list the same physical stock
 * once per upload date — this is the fix: a correlated scalar subquery restricting to each branch's
 * *most recent* `asOfDate`, which is the only sensible meaning of "current stock" now. Every
 * consumer of `stock_snapshots` that doesn't have its own explicit date filter should use this.
 */
function latestStockDateClause(): SQL {
  return sql`${stockSnapshots.asOfDate} = (
    select max(latest.as_of_date) from stock_snapshots latest where latest.branch_id = ${stockSnapshots.branchId}
  )`
}

/**
 * An explicit `dateFrom`/`dateTo` (a plain range check — `asOfDate` is a single-day column, not a
 * from/to range like Sales/Purchase) is honored as-is, e.g. to look at a specific past date on the
 * Stock report page. With neither set, this defaults to `latestStockDateClause` instead of leaving
 * every historical date unrestricted.
 */
function stockFilterClauses(filters: ReportFilters): SQL[] {
  const clauses = [branchFilter(stockSnapshots.branchId, filters), stockItemFilter(filters), expiryTierFilter(filters)].filter(
    (c): c is SQL => c !== undefined,
  )
  if (filters.company) clauses.push(eq(stockSnapshots.company, filters.company))
  if (filters.supplier) clauses.push(eq(stockSnapshots.supplier, filters.supplier))
  if (filters.stockFrom !== undefined) clauses.push(gte(stockSnapshots.currentStock, filters.stockFrom))
  if (filters.stockTo !== undefined) clauses.push(lte(stockSnapshots.currentStock, filters.stockTo))
  if (filters.dateFrom) clauses.push(gte(stockSnapshots.asOfDate, filters.dateFrom))
  if (filters.dateTo) clauses.push(lte(stockSnapshots.asOfDate, filters.dateTo))
  if (!filters.dateFrom && !filters.dateTo) clauses.push(latestStockDateClause())
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

/** Unlike company, supplier is a per-batch/per-receipt fact (who a specific delivery came from), not a stable item attribute — no `items.supplier` column exists, so this sources straight from `stock_snapshots`. */
export async function listSuppliers(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ supplier: stockSnapshots.supplier })
    .from(stockSnapshots)
    .where(sql`${stockSnapshots.supplier} is not null`)
    .orderBy(stockSnapshots.supplier)
  return rows.map((row) => row.supplier).filter((s): s is string => s !== null)
}

/** Purchase register's own grouping column (its equivalent of Sales' `partyGroup`) — sourced directly, no item join involved. */
export async function listSupplierGroups(): Promise<string[]> {
  const rows = await db.selectDistinct({ supplierGroup: purchaseLines.supplierGroup }).from(purchaseLines).orderBy(purchaseLines.supplierGroup)
  return rows.map((row) => row.supplierGroup)
}

// ---- Export (background jobs) — same filter-building helpers as the paginated reports above,
// just a flat capped fetch instead of cursor/count machinery. No page ever needs more than one of
// these rows loaded into memory at once (see `service.ts`'s chunked-progress loop), so a plain
// `.limit()` is enough; this cap exists purely as a safety net against an unbounded query.

const EXPORT_ROW_CAP = 50_000

export async function exportStockReport(filters: ReportFilters) {
  return db
    .select({
      id: stockSnapshots.id,
      itemCode: stockSnapshots.itemCode,
      itemName: stockSnapshots.itemName,
      unit: stockSnapshots.unit,
      currentStock: stockSnapshots.currentStock,
      costPrice: stockSnapshots.costPrice,
      value: stockSnapshots.value,
      mrp: stockSnapshots.mrp,
      purchasePrice: stockSnapshots.purchasePrice,
      salesPrice: stockSnapshots.salesPrice,
      company: stockSnapshots.company,
      manufacturer: stockSnapshots.manufacturer,
      batch: stockSnapshots.batch,
      mfgDateRaw: stockSnapshots.mfgDateRaw,
      expDate: stockSnapshots.expDate,
      supplier: stockSnapshots.supplier,
      invNo: stockSnapshots.invNo,
      invDate: stockSnapshots.invDate,
      rackNo: stockSnapshots.rackNo,
      salesSchemeDeal: stockSnapshots.salesSchemeDeal,
      salesSchemeFree: stockSnapshots.salesSchemeFree,
      purcSchemeDeal: stockSnapshots.purcSchemeDeal,
      purcSchemeFree: stockSnapshots.purcSchemeFree,
      recDate: stockSnapshots.recDate,
      asOfDate: stockSnapshots.asOfDate,
      daysToExpiry: sql<number | null>`case when ${stockSnapshots.expDate} is null then null else (${stockSnapshots.expDate} - current_date)::int end`,
      branchId: stockSnapshots.branchId,
      branchName: branches.name,
    })
    .from(stockSnapshots)
    .innerJoin(branches, eq(branches.id, stockSnapshots.branchId))
    .where(and(...stockFilterClauses(filters)))
    .orderBy(stockSnapshots.itemName, stockSnapshots.id)
    .limit(EXPORT_ROW_CAP)
}

export async function exportPurchaseDetail(filters: ReportFilters) {
  const filterWhere = and(
    branchFilter(purchaseLines.branchId, filters),
    itemFilter(purchaseLines.itemNameRaw, filters),
    filters.company ? eq(items.company, filters.company) : undefined,
    schemeTierFilter(filters),
    filters.supplierGroup ? eq(purchaseLines.supplierGroup, filters.supplierGroup) : undefined,
    filters.amountFrom !== undefined ? gte(purchaseLines.amount, filters.amountFrom) : undefined,
    filters.amountTo !== undefined ? lte(purchaseLines.amount, filters.amountTo) : undefined,
    ...dateRangeOverlap(purchaseLines.reportDateFrom, purchaseLines.reportDateTo, filters),
  )
  return db
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
      branchId: purchaseLines.branchId,
      branchName: branches.name,
      date: purchaseLines.reportDateFrom,
    })
    .from(purchaseLines)
    .leftJoin(items, eq(items.id, purchaseLines.itemId))
    .innerJoin(branches, eq(branches.id, purchaseLines.branchId))
    .where(filterWhere)
    .orderBy(purchaseLines.itemNameRaw, purchaseLines.id)
    .limit(EXPORT_ROW_CAP)
}

export async function exportSalesDetail(filters: ReportFilters) {
  const filterWhere = and(
    branchFilter(salesLines.branchId, filters),
    itemFilter(salesLines.itemNameRaw, filters),
    filters.company ? eq(items.company, filters.company) : undefined,
    filters.amountFrom !== undefined ? gte(salesLines.amount, filters.amountFrom) : undefined,
    filters.amountTo !== undefined ? lte(salesLines.amount, filters.amountTo) : undefined,
    ...dateRangeOverlap(salesLines.reportDateFrom, salesLines.reportDateTo, filters),
  )
  return db
    .select({
      id: salesLines.id,
      partyGroup: salesLines.partyGroup,
      itemNameRaw: salesLines.itemNameRaw,
      packSizeRaw: salesLines.packSizeRaw,
      qty: salesLines.qty,
      unit: salesLines.unit,
      rate: salesLines.rate,
      amount: salesLines.amount,
      company: items.company,
      branchId: salesLines.branchId,
      branchName: branches.name,
      date: salesLines.reportDateFrom,
    })
    .from(salesLines)
    .leftJoin(items, eq(items.id, salesLines.itemId))
    .innerJoin(branches, eq(branches.id, salesLines.branchId))
    .where(filterWhere)
    .orderBy(salesLines.itemNameRaw, salesLines.id)
    .limit(EXPORT_ROW_CAP)
}

export async function exportDaySalesDetail(filters: ReportFilters) {
  const clauses = [branchFilter(dailySalesSummary.branchId, filters)]
  if (filters.dateFrom) clauses.push(gte(dailySalesSummary.date, filters.dateFrom))
  if (filters.dateTo) clauses.push(lte(dailySalesSummary.date, filters.dateTo))
  return db
    .select({
      id: dailySalesSummary.id,
      date: dailySalesSummary.date,
      billNoRange: dailySalesSummary.billNoRange,
      billValue: dailySalesSummary.billValue,
      taxable: dailySalesSummary.taxable,
      taxPayable: dailySalesSummary.taxPayable,
      taxFree: dailySalesSummary.taxFree,
      exempted: dailySalesSummary.exempted,
      roundOff: dailySalesSummary.roundOff,
      branchId: dailySalesSummary.branchId,
      branchName: branches.name,
    })
    .from(dailySalesSummary)
    .innerJoin(branches, eq(branches.id, dailySalesSummary.branchId))
    .where(and(...clauses))
    .orderBy(dailySalesSummary.date, dailySalesSummary.id)
    .limit(EXPORT_ROW_CAP)
}

// ---- export_jobs CRUD ----

export async function createExportJob(input: { reportType: string; branchId: string | null; filters: ReportFilters }): Promise<ExportJobDocument> {
  const [job] = await db.insert(exportJobs).values(input).returning()
  if (!job) throw new InternalServerError("Failed to record export job")
  return job
}

export type ExportJobStatusUpdate =
  | { status: "completed"; rowCount: number; fileName: string; storageKey: string }
  | { status: "failed"; errorMessage: string }

export async function updateExportJobStatus(id: string, update: ExportJobStatusUpdate): Promise<void> {
  await db
    .update(exportJobs)
    .set({ ...update, completedAt: new Date() })
    .where(eq(exportJobs.id, id))
}

/** Most recent 20 for the branch/type — the inline history panel next to each report's Export button, not a full audit log. */
export async function listExportJobs(branchId?: string, reportType?: string): Promise<ExportJobDocument[]> {
  const clauses = [branchId ? eq(exportJobs.branchId, branchId) : undefined, reportType ? eq(exportJobs.reportType, reportType) : undefined].filter(
    (c): c is SQL => c !== undefined,
  )
  const query = db.select().from(exportJobs)
  return (clauses.length > 0 ? query.where(and(...clauses)) : query).orderBy(desc(exportJobs.requestedAt)).limit(20)
}

export async function findExportJob(id: string): Promise<ExportJobDocument | null> {
  const [job] = await db.select().from(exportJobs).where(eq(exportJobs.id, id)).limit(1)
  return job ?? null
}
