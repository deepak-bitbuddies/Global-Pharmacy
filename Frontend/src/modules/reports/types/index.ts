export type ReportFilters = {
  branchId?: string
  dateFrom?: string
  dateTo?: string
  company?: string
  item?: string
}

export type { Branch } from "@/modules/branches"

export type ItemWiseSalesRow = {
  itemNameRaw: string
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

export type StockRow = {
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
