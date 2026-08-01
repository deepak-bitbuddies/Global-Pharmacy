import type { FileTypeValue } from "./enums.js"

export type UploadFileDto = {
  fileType: FileTypeValue
  branchId: string
  fileName: string
  buffer: Buffer
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
  importedAt: Date
}

export type UploadCycleStatusDto = {
  /** The branch's latest Stock date, whether or not its Purchase/Sales are done yet; null if Stock has never been uploaded. */
  openDate: string | null
  stockDone: boolean
  purchaseDone: boolean
  salesDone: boolean
}
