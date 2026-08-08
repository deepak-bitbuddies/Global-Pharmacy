import type { SystemRoleCode } from "../../../../shared/enums/index.js"
import type { FileTypeValue } from "./enums.js"

export type UploadFileDto = {
  fileType: FileTypeValue
  branchId: string
  fileName: string
  buffer: Buffer
  actorRole: SystemRoleCode
}

/** Instant ack for a single-file upload — the batch is created and returned right away with status "processing"; the actual outcome (rowCount, replaced-or-not) arrives later via socket + the history table, not synchronously. */
export type UploadAckDto = {
  batchId: string
  branchId: string
  branchName: string
  fileType: FileTypeValue
  fileName: string
}

export type ImportBatchListItemDto = {
  id: string
  branchId: string
  branchName: string
  fileType: FileTypeValue
  fileName: string
  rowCount: number
  status: string
  errorMessage: string | null
  importedAt: Date
}

export type UploadCycleStatusDto = {
  /** The branch's latest Stock date, whether or not its Purchase/Sales are done yet; null if Stock has never been uploaded. */
  openDate: string | null
  stockDone: boolean
  purchaseDone: boolean
  salesDone: boolean
}

export type BulkUploadFileInputDto = {
  fileName: string
  buffer: Buffer
}

/** Instant ack for a bulk upload — nothing has been validated yet at this point (that all happens in the background), so this is just a receipt. Per-file outcomes arrive via socket + the history table. */
export type BulkUploadAckDto = {
  receivedCount: number
}
