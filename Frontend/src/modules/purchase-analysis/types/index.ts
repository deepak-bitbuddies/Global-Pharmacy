export type PurchaseAnalysisFilters = {
  dateFrom?: string
  dateTo?: string
  partyName?: string[]
  itemName?: string[]
  company?: string[]
  type?: string[]
  area?: string[]
  route?: string[]
  search?: string
  amountFrom?: number
  amountTo?: number
  qtyFrom?: number
  qtyTo?: number
}

export type PurchaseAnalysisRow = {
  id: string
  partyName: string
  itemName: string
  billNo: string
  billDate: string | null
  type: string | null
  pan: string | null
  bankAcctNo: string | null
  ifscCode: string | null
  batch: string | null
  qty: number | null
  freeQty: number | null
  rate: number | null
  scheme: number | null
  schemePct: number | null
  discount: number | null
  discountPct: number | null
  amount: number
  gstPct: number | null
  taxAmount: number | null
  mrp: number | null
  mrpAmt: number | null
  companyName: string | null
  areaName: string | null
  routeName: string | null
  saleType: string | null
  gstNo: string | null
}

export type PurchaseAnalysisSummary = {
  totalAmount: number
  totalTaxAmount: number
  totalQty: number
  billCount: number
  partyCount: number
}

export type PurchaseAnalysisImportBatch = {
  id: string
  fileName: string
  periodFrom: string | null
  periodTo: string | null
  rowCount: number
  status: string
  errorMessage: string | null
  importedAt: string
}

/** Instant response the upload request returns — the real outcome arrives later via socket + the batch list. */
export type PurchaseAnalysisUploadAck = {
  batchId: string
  fileName: string
}

/** `purchase-analysis-batch:update` socket payload. */
export type PurchaseAnalysisBatchUpdateEvent = {
  batchId: string
  fileName: string
  status: "processing" | "completed" | "failed"
  rowCount?: number
  errorMessage?: string
}

/** `purchase-analysis-batch:progress` socket payload — high-frequency per-insert-chunk ticks. */
export type PurchaseAnalysisBatchProgressEvent = {
  batchId: string
  rowsProcessed: number
  totalRows: number
}
