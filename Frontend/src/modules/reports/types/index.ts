// Purchase-only filter (scheme % only exists on purchase lines) — kept on the shared
// ReportFilters type regardless, same precedent as `company` above.
export type SchemeTier = "none" | "lt5" | "5to10" | "10to20" | "20to30" | "30to50" | "50to100" | "gte100"

// Stock-only filter (expiry only exists on stock rows) — same precedent as `schemeTier` above.
export type ExpiryTier = "expired" | "lte30" | "31to60" | "61to90" | "gt90" | "none" | "custom"

export type ReportFilters = {
  branchId?: string
  dateFrom?: string
  dateTo?: string
  company?: string
  item?: string
  schemeTier?: SchemeTier
  expiryTier?: ExpiryTier
  /** Only used when `expiryTier === "custom"` — a separate expiry-date range from `dateFrom`/`dateTo` (which filter the report's own date, not expiry). */
  expiryDateFrom?: string
  expiryDateTo?: string
  // Stock-only filters.
  supplier?: string
  stockFrom?: number
  stockTo?: number
  // Purchase-only filter — Purchase's equivalent of Sales' party grouping.
  supplierGroup?: string
  // Purchase/Sales amount range.
  amountFrom?: number
  amountTo?: number
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
  daysToExpiry: number | null
  branchId: string
  branchName: string
}

export type SalesDetailRow = {
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

/** Instant ack for a single-file upload — the batch already exists (status "processing") by the time this comes back; the real outcome (rowCount, replaced-or-not) only ever shows up later as the matching row in `ImportBatch` history, driven live by the import socket. */
export type UploadAck = {
  batchId: string
  branchId: string
  branchName: string
  fileType: ImportFileType
  fileName: string
}

export type ImportBatch = {
  id: string
  branchId: string
  branchName: string
  fileType: ImportFileType
  fileName: string
  rowCount: number
  status: string
  errorMessage: string | null
  importedAt: string
}

export type UploadCycleStatus = {
  openDate: string | null
  stockDone: boolean
  purchaseDone: boolean
  salesDone: boolean
}

/** Instant ack for a bulk upload — nothing has been validated yet at this point (that's all backgrounded); per-file outcomes arrive via socket + the history table instead. */
export type BulkUploadAck = {
  receivedCount: number
}

/** `import-batch:update` socket payload — every processing/completed/failed transition for both upload paths. `batchId`/`fileType` are only null for a bulk file whose report type couldn't be identified at all (no history table row exists for it). */
export type ImportBatchUpdateEvent = {
  batchId: string | null
  branchId: string
  fileType: ImportFileType | null
  fileName: string
  status: "processing" | "completed" | "failed"
  rowCount?: number
  errorMessage?: string
}

/** `import-batch:progress` socket payload — high-frequency per-insert-chunk ticks for a batch already known to exist (never null). */
export type ImportBatchProgressEvent = {
  batchId: string
  branchId: string
  fileType: ImportFileType
  rowsProcessed: number
  totalRows: number
}

/** Same 4 values as `ImportFileType` — a report export and the file that produced its data are always the same "kind." */
export type ReportType = ImportFileType

/** A background report export — mirrors `ImportBatch`'s processing/completed/failed shape; `fileName` is only set once `status === "completed"`, and is what `downloadExportJob` needs. */
export type ExportJob = {
  id: string
  reportType: ReportType
  branchId: string | null
  filters: ReportFilters
  status: "processing" | "completed" | "failed"
  rowCount: number
  fileName: string | null
  errorMessage: string | null
  requestedAt: string
  completedAt: string | null
}

/** Instant ack for a new export job — same shape as `ExportJob`, just the moment it's created (`status: "processing"`). */
export type ExportJobAck = ExportJob

/** `export-job:update` socket payload. */
export type ExportJobUpdateEvent = {
  id: string
  reportType: ReportType
  branchId: string | null
  status: "processing" | "completed" | "failed"
  rowCount?: number
  errorMessage?: string
}

/** `export-job:progress` socket payload. */
export type ExportJobProgressEvent = {
  id: string
  reportType: ReportType
  branchId: string | null
  rowsProcessed: number
  totalRows: number
}
