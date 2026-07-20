import type { FileTypeValue } from "./enums.js"

export type UploadFileDto = {
  fileType: FileTypeValue
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
