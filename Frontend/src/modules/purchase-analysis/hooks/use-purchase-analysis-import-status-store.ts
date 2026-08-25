import { create } from "zustand"

export type PurchaseAnalysisImportStatus = {
  batchId: string
  status: "processing" | "completed" | "failed"
  errorMessage?: string
}

type PurchaseAnalysisImportStatusState = {
  byFileName: Record<string, PurchaseAnalysisImportStatus>
  setStatus: (fileName: string, status: PurchaseAnalysisImportStatus) => void
}

/**
 * Own small status store, not `@/modules/reports/hooks/use-import-status-store` — that one's
 * `FileImportStatus.fileType` is typed to the Stock/Sales/Purchase/Day-Wise-Sale union, which
 * doesn't (and shouldn't) know about this module. Same "correlate a just-submitted upload back to
 * its live status by filename" idea, just scoped to this module's one file type.
 */
export const usePurchaseAnalysisImportStatusStore = create<PurchaseAnalysisImportStatusState>((set) => ({
  byFileName: {},
  setStatus: (fileName, status) => set((state) => ({ byFileName: { ...state.byFileName, [fileName]: status } })),
}))
