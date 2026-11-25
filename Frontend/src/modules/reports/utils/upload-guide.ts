import { addDaysToIsoDate } from "@/utils/formatting"
import { IMPORT_PROCESSING_STALE_MS } from "../constants/import"
import { ImportBatchStatus, ImportFileType, type ImportBatch, type UploadCycleStatus } from "../types"

export type UploadNextStep = {
  fileType: ImportFileType
  /** Null only before the branch's first-ever Stock upload, when any day can be the first. */
  date: string | null
  /** Set when the next step starts a new day — the day before it, now fully uploaded. */
  completedDate: string | null
}

/**
 * Same order the server's upload check enforces: the open day's Purchase, then its Sales, and
 * only after both does the next day's Stock become uploadable.
 */
export function getNextUploadStep(status: UploadCycleStatus): UploadNextStep {
  if (!status.openDate) return { fileType: ImportFileType.Stock, date: null, completedDate: null }
  if (!status.purchaseDone) return { fileType: ImportFileType.Purchase, date: status.openDate, completedDate: null }
  if (!status.salesDone) return { fileType: ImportFileType.Sales, date: status.openDate, completedDate: null }
  return { fileType: ImportFileType.Stock, date: addDaysToIsoDate(status.openDate, 1), completedDate: status.openDate }
}

export function isFileTypeDoneForOpenDay(status: UploadCycleStatus, fileType: ImportFileType): boolean {
  if (fileType === ImportFileType.Stock) return status.stockDone
  if (fileType === ImportFileType.Purchase) return status.purchaseDone
  if (fileType === ImportFileType.Sales) return status.salesDone
  return false
}

/** The import currently running for the branch, ignoring "processing" rows old enough to be abandoned. */
export function findRunningImport(batches: ImportBatch[], now: number): ImportBatch | undefined {
  return batches.find((batch) => batch.status === ImportBatchStatus.Processing && now - new Date(batch.importedAt).getTime() < IMPORT_PROCESSING_STALE_MS)
}
