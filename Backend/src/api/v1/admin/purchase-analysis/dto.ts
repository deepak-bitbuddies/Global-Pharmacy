export type { CursorPaginationParams, PaginatedResult } from "../../../../shared/types/pagination.js"

export type PurchaseAnalysisFilters = {
  dateFrom?: string
  dateTo?: string
  partyName?: string[]
  itemName?: string[]
  company?: string[]
  type?: string[]
  area?: string[]
  route?: string[]
  // Free-text — matches bill no. or item name (a quick "find this bill/item" box, distinct from
  // the exact-match multi-selects above).
  search?: string
  amountFrom?: number
  amountTo?: number
  qtyFrom?: number
  qtyTo?: number
}

export type PurchaseAnalysisRowDto = {
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
  discount: number | null
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

export type PurchaseAnalysisSummaryDto = {
  totalAmount: number
  totalTaxAmount: number
  totalQty: number
  billCount: number
  partyCount: number
}

export type PurchaseAnalysisImportBatchDto = {
  id: string
  fileName: string
  periodFrom: string | null
  periodTo: string | null
  rowCount: number
  status: string
  errorMessage: string | null
  importedAt: string
}

/** Instant response the upload request itself returns — the real outcome (completed/failed, real rowCount) arrives later via socket + the batch list, same "ack now, live status after" shape as `uploads`' `UploadAckDto`. */
export type PurchaseAnalysisUploadAckDto = {
  batchId: string
  fileName: string
}
