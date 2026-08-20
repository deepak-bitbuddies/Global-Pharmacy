import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

// Local disk, same reasoning as `export-storage.ts` — no object storage exists anywhere else in
// this codebase, and proof screenshots/documents are small enough that this is the simplest
// correct choice. No cleanup/retention job yet; files accumulate.
const PROOF_DIR = path.join(process.cwd(), "storage", "proofs")

/** Writes an expense entry's proof document, keyed by its entry id + upload time (timestamped so a re-upload before review never collides with a prior attempt). `storageKey` is what gets stored on the entry row and handed back to `readProofDocument` later. */
export async function saveProofDocument(entryId: string, buffer: Buffer, ext: string): Promise<{ storageKey: string }> {
  await mkdir(PROOF_DIR, { recursive: true })
  const storageKey = `${entryId}-${Date.now()}${ext}`
  await writeFile(path.join(PROOF_DIR, storageKey), buffer)
  return { storageKey }
}

export async function readProofDocument(storageKey: string): Promise<Buffer> {
  return readFile(path.join(PROOF_DIR, storageKey))
}
