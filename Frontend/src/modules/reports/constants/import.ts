import { ImportFileType } from "../types"

/** The three files that make up one day, in the order a branch uploads them. Day-Wise Sale sits outside this sequence. */
export const DAILY_UPLOAD_SEQUENCE = [ImportFileType.Stock, ImportFileType.Purchase, ImportFileType.Sales] as const

/**
 * A batch still "processing" after this long is treated as abandoned (e.g. the server restarted
 * mid-import and never marked it finished) — otherwise one stuck row would lock the Import page
 * for that branch forever.
 */
export const IMPORT_PROCESSING_STALE_MS = 15 * 60 * 1000
