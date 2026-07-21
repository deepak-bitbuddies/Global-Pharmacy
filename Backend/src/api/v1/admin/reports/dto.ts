export type ReportFilters = {
  branchId?: string
  dateFrom?: string
  dateTo?: string
  company?: string
  item?: string
}

export type { CursorPaginationParams, PaginatedResult } from "../../../../shared/types/pagination.js"

export type ItemWiseSalesRowDto = {
  itemNameRaw: string
  totalQty: number
  totalAmount: number
  returnQty: number
  returnAmount: number
}

export type BranchSalesRowDto = {
  branchId: string
  branchName: string
  totalAmount: number
}

export type GrossProfitRowDto = {
  itemName: string
  salesAmount: number
  salesQty: number
  avgCostPrice: number | null
  estimatedCost: number | null
  estimatedGp: number | null
  estimatedGpPct: number | null
}

export type PurchaseSummaryRowDto = {
  supplierGroup: string
  totalAmount: number
  totalQty: number
  totalFreeQty: number
}

export type StockRowDto = {
  id: string
  itemCode: string | null
  itemName: string
  unit: string | null
  currentStock: number
  costPrice: number | null
  value: number | null
  company: string | null
  batch: string | null
  expDate: string | null
  supplier: string | null
}

export type ZeroOrderAlertRowDto = {
  itemName: string
  currentStock: number
  soldQtyInPeriod: number
}

export type ExpiryRowDto = {
  itemName: string
  batch: string | null
  currentStock: number
  expDate: string
  daysToExpiry: number
  value: number | null
}

export type NonMovingRowDto = {
  itemName: string
  currentStock: number
  value: number | null
  lastSoldDate: null // no per-line date available in the item-wise sales register; see caveat in service.ts
}

export type DailyCollectionRowDto = {
  date: string
  billValue: number
}

export type CashInHandRowDto = {
  branchId: string
  branchName: string
  cashTotal: number
}

export type OutstandingRowDto = {
  branchId: string
  branchName: string
  outstandingTotal: number
}

export type DashboardSummaryDto = {
  totalSales: number
  totalPurchase: number
  totalStockValue: number
  totalCollection: number
  cashInHand: number
  outstanding: number
  nearExpiryCount: number
  nonMovingCount: number
}

/** Aggregates for the Stock tab's KPI row + quantity-distribution chart — computed server-side since `getStockReport` is now paginated and can no longer be summed/bucketed client-side from a full fetch. */
export type StockSummaryDto = {
  totalValue: number
  uniqueItemCount: number
  levelCounts: { bucket: string; count: number }[]
}

export type StockByCompanyRowDto = {
  company: string
  total: number
}
