import type {
  BranchSalesRowDto,
  CashInHandRowDto,
  DailyCollectionRowDto,
  DashboardSummaryDto,
  ExpiryRowDto,
  GrossProfitRowDto,
  ItemWiseSalesRowDto,
  NonMovingRowDto,
  OutstandingRowDto,
  PurchaseSummaryRowDto,
  ReportFilters,
  StockRowDto,
  ZeroOrderAlertRowDto,
} from "./dto.js"
import {
  getBranchSales,
  getCashInHand,
  getDailyCollection,
  getExpiryReport,
  getGrossProfitByItem,
  getItemWiseSales,
  getNonMovingItems,
  getOutstanding,
  getPurchaseSummary,
  getStockReport,
  getTotalStockValue,
  getZeroOrderAlerts,
  listCompanies,
} from "./repository.js"

const num = (value: string | number | null): number => Number(value ?? 0)

export async function itemWiseSales(filters: ReportFilters): Promise<ItemWiseSalesRowDto[]> {
  const rows = await getItemWiseSales(filters)
  return rows.map((row) => ({
    itemNameRaw: row.itemNameRaw,
    totalQty: num(row.totalQty),
    totalAmount: num(row.totalAmount),
    returnQty: num(row.returnQty),
    returnAmount: num(row.returnAmount),
  }))
}

export async function branchSales(filters: ReportFilters): Promise<BranchSalesRowDto[]> {
  const rows = await getBranchSales(filters)
  return rows.map((row) => ({ branchId: row.branchId, branchName: row.branchName, totalAmount: num(row.totalAmount) }))
}

export async function grossProfitByItem(filters: ReportFilters): Promise<GrossProfitRowDto[]> {
  const rows = await getGrossProfitByItem(filters)
  return rows.map((row) => {
    const salesQty = num(row.salesQty)
    const salesAmount = num(row.salesAmount)
    const avgCostPrice = row.avgCostPrice === null ? null : num(row.avgCostPrice)
    const estimatedCost = avgCostPrice === null ? null : avgCostPrice * salesQty
    const estimatedGp = estimatedCost === null ? null : salesAmount - estimatedCost
    const estimatedGpPct = estimatedGp === null || salesAmount === 0 ? null : (estimatedGp / salesAmount) * 100

    return { itemName: row.itemName, salesAmount, salesQty, avgCostPrice, estimatedCost, estimatedGp, estimatedGpPct }
  })
}

export async function purchaseSummary(filters: ReportFilters): Promise<PurchaseSummaryRowDto[]> {
  const rows = await getPurchaseSummary(filters)
  return rows.map((row) => ({
    supplierGroup: row.supplierGroup,
    totalAmount: num(row.totalAmount),
    totalQty: num(row.totalQty),
    totalFreeQty: num(row.totalFreeQty),
  }))
}

export async function stockReport(filters: ReportFilters): Promise<StockRowDto[]> {
  const rows = await getStockReport(filters)
  return rows.map((row) => ({
    id: row.id,
    itemCode: row.itemCode,
    itemName: row.itemName,
    unit: row.unit,
    currentStock: num(row.currentStock),
    costPrice: row.costPrice === null ? null : num(row.costPrice),
    value: row.value === null ? null : num(row.value),
    company: row.company,
    batch: row.batch,
    expDate: row.expDate,
    supplier: row.supplier,
  }))
}

export async function zeroOrderAlerts(filters: ReportFilters): Promise<ZeroOrderAlertRowDto[]> {
  const rows = await getZeroOrderAlerts(filters)
  return rows.map((row) => ({ itemName: row.itemName, currentStock: num(row.currentStock), soldQtyInPeriod: num(row.soldQtyInPeriod) }))
}

export async function expiryReport(filters: ReportFilters, withinDays: number): Promise<ExpiryRowDto[]> {
  const rows = await getExpiryReport(filters, withinDays)
  return rows.map((row) => ({
    itemName: row.itemName,
    batch: row.batch,
    currentStock: num(row.currentStock),
    expDate: row.expDate as unknown as string,
    daysToExpiry: row.daysToExpiry,
    value: row.value === null ? null : num(row.value),
  }))
}

export async function nonMovingItems(filters: ReportFilters): Promise<NonMovingRowDto[]> {
  const rows = await getNonMovingItems(filters)
  return rows.map((row) => ({ itemName: row.itemName, currentStock: num(row.currentStock), value: row.value === null ? null : num(row.value), lastSoldDate: null }))
}

export async function dailyCollection(filters: ReportFilters): Promise<DailyCollectionRowDto[]> {
  const rows = await getDailyCollection(filters)
  return rows.map((row) => ({ date: row.date, billValue: num(row.billValue) }))
}

export async function cashInHand(filters: ReportFilters): Promise<CashInHandRowDto[]> {
  const rows = await getCashInHand(filters)
  return rows.map((row) => ({ branchId: row.branchId, branchName: row.branchName, cashTotal: num(row.cashTotal) }))
}

export async function outstanding(filters: ReportFilters): Promise<OutstandingRowDto[]> {
  const rows = await getOutstanding(filters)
  return rows.map((row) => ({ branchId: row.branchId, branchName: row.branchName, outstandingTotal: num(row.outstandingTotal) }))
}

export async function dashboardSummary(filters: ReportFilters): Promise<DashboardSummaryDto> {
  const [sales, purchase, stockValue, collection, cash, credit, expiry, nonMoving] = await Promise.all([
    getBranchSales(filters),
    getPurchaseSummary(filters),
    getTotalStockValue(filters),
    getDailyCollection(filters),
    getCashInHand(filters),
    getOutstanding(filters),
    getExpiryReport(filters, 30),
    getNonMovingItems(filters),
  ])

  return {
    totalSales: sales.reduce((sum, row) => sum + num(row.totalAmount), 0),
    totalPurchase: purchase.reduce((sum, row) => sum + num(row.totalAmount), 0),
    totalStockValue: stockValue,
    totalCollection: collection.reduce((sum, row) => sum + num(row.billValue), 0),
    cashInHand: cash.reduce((sum, row) => sum + num(row.cashTotal), 0),
    outstanding: credit.reduce((sum, row) => sum + num(row.outstandingTotal), 0),
    nearExpiryCount: expiry.length,
    nonMovingCount: nonMoving.length,
  }
}

export async function companies(): Promise<string[]> {
  return listCompanies()
}
