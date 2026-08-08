// Purchase-only filter (schemePct only exists on purchase_lines) — kept on the shared
// ReportFilters type regardless, same precedent as `company` above (Sales/Stock just ignore it).
export type SchemeTier = "none" | "lt5" | "5to10" | "10to20" | "20to30" | "30to50" | "50to100" | "gte100"

// Stock-only filter (expDate only exists on stock_snapshots) — same precedent as `schemeTier` above.
export type ExpiryTier = "expired" | "lte30" | "31to60" | "61to90" | "gt90" | "none" | "custom"

export type ReportFilters = {
  branchId?: string
  dateFrom?: string
  dateTo?: string
  company?: string
  item?: string
  schemeTier?: SchemeTier
  expiryTier?: ExpiryTier
  /** Only used when `expiryTier === "custom"` — a caller-chosen expiry-date range distinct from `dateFrom`/`dateTo` (which filter the report's own date, not expiry). */
  expiryDateFrom?: string
  expiryDateTo?: string
  // Stock-only filters — stockSnapshots columns, ignored by every other report.
  supplier?: string
  stockFrom?: number
  stockTo?: number
  // Purchase-only filter — purchaseLines.supplierGroup, the Purchase register's equivalent of Sales' partyGroup.
  supplierGroup?: string
  // Purchase/Sales amount range — purchaseLines.amount / salesLines.amount.
  amountFrom?: number
  amountTo?: number
}

export type { CursorPaginationParams, PaginatedResult } from "../../../../shared/types/pagination.js"

export type ItemWiseSalesRowDto = {
  itemNameRaw: string
  company: string | null
  branchId: string
  branchName: string
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

export type SalesDetailRowDto = {
  id: string
  partyGroup: string
  itemNameRaw: string
  packSizeRaw: string | null
  qty: number | null
  unit: string | null
  rate: number | null
  amount: number
  company: string | null
  branchId: string
  branchName: string
  date: string
}

export type PurchaseDetailRowDto = {
  id: string
  supplierGroup: string
  itemNameRaw: string
  packSizeRaw: string | null
  qty: number | null
  freeQty: number | null
  rate: number | null
  amount: number
  schemePct: number | null
  company: string | null
  branchId: string
  branchName: string
  date: string
}

export type StockRowDto = {
  id: string
  itemCode: string | null
  itemName: string
  unit: string | null
  currentStock: number
  costPrice: number | null
  value: number | null
  mrp: number | null
  purchasePrice: number | null
  salesPrice: number | null
  company: string | null
  manufacturer: string | null
  batch: string | null
  mfgDateRaw: string | null
  expDate: string | null
  supplier: string | null
  invNo: string | null
  invDate: string | null
  rackNo: string | null
  salesSchemeDeal: number | null
  salesSchemeFree: number | null
  purcSchemeDeal: number | null
  purcSchemeFree: number | null
  recDate: string | null
  asOfDate: string
  daysToExpiry: number | null
  branchId: string
  branchName: string
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

export type DaySalesDetailRowDto = {
  id: string
  date: string
  billNoRange: string | null
  billValue: number
  taxable: number | null
  taxPayable: number | null
  taxFree: number | null
  exempted: number | null
  roundOff: number | null
  branchId: string
  branchName: string
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
