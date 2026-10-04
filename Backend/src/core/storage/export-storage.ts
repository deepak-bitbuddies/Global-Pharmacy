import { downloadFile, uploadFile } from "./cloudinary-storage.js"

const FOLDER = "global-pharmacy/exports"

/** Writes a completed export's bytes, keyed by its job id — `storageKey` (not the same as the display `fileName` shown to the user) is what gets stored on the job row and handed back to `readExportFile` later. */
export async function saveExportFile(jobId: string, buffer: Buffer): Promise<{ storageKey: string }> {
  return uploadFile(buffer, FOLDER, `${jobId}.xlsx`)
}

export async function readExportFile(storageKey: string): Promise<Buffer> {
  return downloadFile(storageKey)
}
