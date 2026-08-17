import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

// Local disk, at this app's single-server scale — no object storage exists anywhere else in the
// codebase to reuse, and the generated files (capped at EXPORT_ROW_CAP rows) are small enough that
// this is the simplest correct choice. No cleanup/retention job yet; files accumulate.
const EXPORT_DIR = path.join(process.cwd(), "storage", "exports")

/** Writes a completed export's bytes to disk, keyed by its job id — `storageKey` (not the same as the display `fileName` shown to the user) is what gets stored on the job row and handed back to `readExportFile` later. */
export async function saveExportFile(jobId: string, buffer: Buffer): Promise<{ storageKey: string }> {
  await mkdir(EXPORT_DIR, { recursive: true })
  const storageKey = `${jobId}.xlsx`
  await writeFile(path.join(EXPORT_DIR, storageKey), buffer)
  return { storageKey }
}

export async function readExportFile(storageKey: string): Promise<Buffer> {
  return readFile(path.join(EXPORT_DIR, storageKey))
}
