import { and, desc, eq, gte, lte, notExists, sql, type AnyColumn, type SQL } from "drizzle-orm"

import { db } from "../../../../core/database/db.js"
import {
  branches,
  dailySalesSummary,
  items,
  purchaseLines,
  salesLines,
  stockSnapshots,
} from "../uploads/model.js"
import type { ReportFilters } from "./dto.js"

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

export async function getItemWiseSales(filters: ReportFilters) {
  const where = and(
    branchFilter(salesLines.branchId, filters),
    itemFilter(salesLines.itemNameRaw, filters),
    ...dateRangeOverlap(salesLines.reportDateFrom, salesLines.reportDateTo, filters),
  )

  return db
    .select({
      itemNameRaw: salesLines.itemNameRaw,
      totalQty: sql<string>`coalesce(sum(${salesLines.qty}) filter (where ${salesLines.qty} > 0), 0)`,
      totalAmount: sql<string>`coalesce(sum(${salesLines.amount}) filter (where ${salesLines.amount} > 0), 0)`,
      returnQty: sql<string>`coalesce(abs(sum(${salesLines.qty}) filter (where ${salesLines.qty} < 0)), 0)`,
      returnAmount: sql<string>`coalesce(abs(sum(${salesLines.amount}) filter (where ${salesLines.amount} < 0)), 0)`,
    })
    .from(salesLines)
    .where(where)
    .groupBy(salesLines.itemNameRaw)
    .orderBy(desc(sql`sum(${salesLines.amount})`))
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
export async function getGrossProfitByItem(filters: ReportFilters) {
  const where = and(
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

  return db
    .select({
      itemName: salesLines.itemNameRaw,
      salesAmount: sql<string>`coalesce(sum(${salesLines.amount}), 0)`,
      salesQty: sql<string>`coalesce(sum(${salesLines.qty}), 0)`,
      avgCostPrice: costByItem.avgCostPrice,
    })
    .from(salesLines)
    .leftJoin(costByItem, eq(costByItem.itemId, salesLines.itemId))
    .where(where)
    .groupBy(salesLines.itemNameRaw, costByItem.avgCostPrice)
    .orderBy(desc(sql`sum(${salesLines.amount})`))
}

export async function getPurchaseSummary(filters: ReportFilters) {
  const where = and(
    branchFilter(purchaseLines.branchId, filters),
    itemFilter(purchaseLines.itemNameRaw, filters),
    ...dateRangeOverlap(purchaseLines.reportDateFrom, purchaseLines.reportDateTo, filters),
  )

  return db
    .select({
      supplierGroup: purchaseLines.supplierGroup,
      totalAmount: sql<string>`coalesce(sum(${purchaseLines.amount}), 0)`,
      totalQty: sql<string>`coalesce(sum(${purchaseLines.qty}), 0)`,
      totalFreeQty: sql<string>`coalesce(sum(${purchaseLines.freeQty}), 0)`,
    })
    .from(purchaseLines)
    .where(where)
    .groupBy(purchaseLines.supplierGroup)
    .orderBy(desc(sql`sum(${purchaseLines.amount})`))
}

export async function getStockReport(filters: ReportFilters) {
  const clauses = [branchFilter(stockSnapshots.branchId, filters), itemFilter(stockSnapshots.itemName, filters)]
  if (filters.company) clauses.push(eq(stockSnapshots.company, filters.company))

  return db
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
    .where(and(...clauses))
    .orderBy(stockSnapshots.itemName)
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

export async function listCompanies(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ company: items.company })
    .from(items)
    .where(sql`${items.company} is not null`)
    .orderBy(items.company)
  return rows.map((row) => row.company).filter((c): c is string => c !== null)
}
