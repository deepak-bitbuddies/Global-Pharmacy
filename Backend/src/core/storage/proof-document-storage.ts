import { downloadFile, uploadFile } from "./cloudinary-storage.js"

const FOLDER = "global-pharmacy/proofs"

/** Writes an expense entry's proof document, keyed by its entry id + upload time (timestamped so a re-upload before review never collides with a prior attempt). `storageKey` is what gets stored on the entry row and handed back to `readProofDocument` later. */
export async function saveProofDocument(entryId: string, buffer: Buffer, ext: string): Promise<{ storageKey: string }> {
  const publicId = `${entryId}-${Date.now()}${ext}`
  return uploadFile(buffer, FOLDER, publicId)
}

export async function readProofDocument(storageKey: string): Promise<Buffer> {
  return downloadFile(storageKey)
}
