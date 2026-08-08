import { create } from "zustand"

import type { ImportFileType } from "../types"

export type FileImportStatus = {
  batchId: string | null
  fileType: ImportFileType | null
  status: "processing" | "completed" | "failed"
  errorMessage?: string
}

type ImportStatusState = {
  byFileName: Record<string, FileImportStatus>
  setStatus: (fileName: string, status: FileImportStatus) => void
  clearFileNames: (fileNames: string[]) => void
}

/**
 * Correlates a just-submitted upload back to its live status by filename — the one thing the
 * upload UI (file-upload-slot, bulk-upload-modal) still has on hand right after submitting, since
 * the batch id itself isn't known until the background pipeline gets to that file (bulk) or is
 * already known synchronously (single-file, whose ack carries it directly). Once a status update
 * carries a real `batchId`, callers can look up its row-insert progress via `useImportProgressStore`.
 */
export const useImportStatusStore = create<ImportStatusState>((set) => ({
  byFileName: {},
  setStatus: (fileName, status) =>
    set((state) => ({ byFileName: { ...state.byFileName, [fileName]: status } })),
  clearFileNames: (fileNames) =>
    set((state) => {
      const next = { ...state.byFileName }
      for (const name of fileNames) delete next[name]
      return { byFileName: next }
    }),
}))
