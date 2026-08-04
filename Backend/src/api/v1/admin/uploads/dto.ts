import type { SystemRoleCode } from "../../../../shared/enums/index.js"
import type { FileTypeValue } from "./enums.js"

export type UploadFileDto = {
  fileType: FileTypeValue
  branchId: string
  fileName: string
  buffer: Buffer
  actorRole: SystemRoleCode
}

export type UploadResultDto = {
  branchId: string
  branchName: string
  fileType: FileTypeValue
  fileName: string
  rowCount: number
  importedAt: Date
  replaced: boolean
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

export type BulkUploadAcceptedDto = {
  fileName: string
  batchId: string
  fileType: FileTypeValue
  /** Null for Day-Wise Sale, which has no single date (see `import_batches.date`). */
  date: string | null
}

export type BulkUploadRejectedDto = {
  fileName: string
  reason: string
}

export type BulkUploadResultDto = {
  accepted: BulkUploadAcceptedDto[]
  rejected: BulkUploadRejectedDto[]
}
