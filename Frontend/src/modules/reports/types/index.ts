// Purchase-only filter (scheme % only exists on purchase lines) — kept on the shared
// ReportFilters type regardless, same precedent as `company` above.
export type SchemeTier = "none" | "lt5" | "5to10" | "10to20" | "20to30" | "30to50" | "50to100" | "gte100"

export type ReportFilters = {
  branchId?: string
  dateFrom?: string
  dateTo?: string
  company?: string
  item?: string
  schemeTier?: SchemeTier
}

export type { Branch } from "@/modules/branches"

export type ItemWiseSalesRow = {
  itemNameRaw: string
  company: string | null
  branchId: string
  branchName: string
  totalQty: number
  totalAmount: number
  returnQty: number
  returnAmount: number
}

export type BranchSalesRow = {
  branchId: string
  branchName: string
  totalAmount: number
}

export type GrossProfitRow = {
  itemName: string
  salesAmount: number
  salesQty: number
  avgCostPrice: number | null
  estimatedCost: number | null
  estimatedGp: number | null
  estimatedGpPct: number | null
}

export type PurchaseSummaryRow = {
  supplierGroup: string
  totalAmount: number
  totalQty: number
  totalFreeQty: number
}

export type PurchaseDetailRow = {
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

export type StockRow = {
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
  branchId: string
  branchName: string
}

export type ZeroOrderAlertRow = {
  itemName: string
  currentStock: number
  soldQtyInPeriod: number
}

export type ExpiryRow = {
  itemName: string
  batch: string | null
  currentStock: number
  expDate: string
  daysToExpiry: number
  value: number | null
}

export type NonMovingRow = {
  itemName: string
  currentStock: number
  value: number | null
}

export type DailyCollectionRow = {
  date: string
  billValue: number
}

export type DaySalesDetailRow = {
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

export type CashInHandRow = {
  branchId: string
  branchName: string
  cashTotal: number
}

export type OutstandingRow = {
  branchId: string
  branchName: string
  outstandingTotal: number
}

export type DashboardSummary = {
  totalSales: number
  totalPurchase: number
  totalStockValue: number
  totalCollection: number
  cashInHand: number
  outstanding: number
  nearExpiryCount: number
  nonMovingCount: number
}

export type ImportFileType = "stock" | "sales" | "purchase" | "day_wise_sale"

export type UploadResult = {
  branchId: string
  branchName: string
  fileType: ImportFileType
  fileName: string
  rowCount: number
  importedAt: string
  replaced: boolean
}

export type ImportBatch = {
  id: string
  branchId: string
  branchName: string
  fileType: ImportFileType
  fileName: string
  rowCount: number
  status: string
  importedAt: string
}

export type UploadCycleStatus = {
  openDate: string | null
  stockDone: boolean
  purchaseDone: boolean
  salesDone: boolean
}
