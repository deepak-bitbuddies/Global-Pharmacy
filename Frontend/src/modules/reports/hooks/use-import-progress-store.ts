import { create } from "zustand"

export type ImportProgress = { rowsProcessed: number; totalRows: number }

type ImportProgressState = {
  progress: Record<string, ImportProgress>
  setProgress: (batchId: string, progress: ImportProgress) => void
  clearProgress: (batchId: string) => void
}

/**
 * Transient, push-only progress ticks from `import-batch:progress` (see `use-import-socket.ts`) —
 * not server data fetched via React Query, just live UI state keyed by batch id, so a plain global
 * Zustand store (rather than the query cache) is the right home for it.
 */
export const useImportProgressStore = create<ImportProgressState>((set) => ({
  progress: {},
  setProgress: (batchId, progress) =>
    set((state) => ({ progress: { ...state.progress, [batchId]: progress } })),
  clearProgress: (batchId) =>
    set((state) => {
      if (!(batchId in state.progress)) return state
      const next = { ...state.progress }
      delete next[batchId]
      return { progress: next }
    }),
}))
