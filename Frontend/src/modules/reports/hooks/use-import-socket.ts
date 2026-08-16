"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { io } from "socket.io-client"

import { customToast } from "@/components/ui"
import { useImportProgressStore } from "./use-import-progress-store"
import { useImportStatusStore } from "./use-import-status-store"
import type { ExportJobProgressEvent, ExportJobUpdateEvent, ImportBatchProgressEvent, ImportBatchUpdateEvent } from "../types"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000"

/**
 * Live-refreshes background job data — both bulk/single-file uploads and report exports — from any
 * screen, over one shared socket connection mounted once in `DashboardShell`. Fetches a short-lived
 * token via `/api/socket-token` (the browser never otherwise holds the raw backend JWT, see that
 * route's comment), then listens for four events:
 *
 * - `import-batch:update` — a status transition (processing/completed/failed). Invalidates the
 *   whole `["reports", ...]` query key prefix (covers import-batch history, upload-cycle-status,
 *   and every report table in one shot), clears any lingering progress bar for that batch, and
 *   records the transition by filename (`useImportStatusStore`) so the upload UI itself — which
 *   only knows filenames, not batch ids, right after submitting — can show live per-sheet status.
 *   A `batchId: null` update means a bulk file's report type couldn't be identified at all —
 *   there's no history row for it, so a toast is the only way the user hears about it.
 * - `import-batch:progress` — a high-frequency per-insert-chunk tick. Only updates the transient
 *   progress store (`useImportProgressStore`), never triggers a query invalidation — far too
 *   chatty for that at chunk frequency.
 * - `export-job:update` / `export-job:progress` — same processing/completed/failed shape and same
 *   progress store (keyed generically by job id either way, nothing import-specific about it) for
 *   background report exports. No filename-correlation needed here the way bulk import needs it —
 *   `useCreateExportJob`'s ack already returns the job's real id synchronously.
 */
export function useImportSocket(): void {
  const queryClient = useQueryClient()
  const setProgress = useImportProgressStore((state) => state.setProgress)
  const clearProgress = useImportProgressStore((state) => state.clearProgress)
  const setStatus = useImportStatusStore((state) => state.setStatus)

  useEffect(() => {
    let socket: ReturnType<typeof io> | undefined
    let cancelled = false

    void (async () => {
      const response = await fetch("/api/socket-token")
      if (!response.ok || cancelled) return
      const { token } = (await response.json()) as { token: string }
      if (cancelled) return

      socket = io(SOCKET_URL, { auth: { token } })

      socket.on("import-batch:update", (payload: ImportBatchUpdateEvent) => {
        queryClient.invalidateQueries({ queryKey: ["reports"] })
        if (payload.batchId) clearProgress(payload.batchId)
        setStatus(payload.fileName, { batchId: payload.batchId, fileType: payload.fileType, status: payload.status, errorMessage: payload.errorMessage })
        if (payload.batchId === null && payload.status === "failed") {
          customToast.danger(`${payload.fileName}: ${payload.errorMessage ?? "Could not process this file"}`)
        }
      })

      socket.on("import-batch:progress", (payload: ImportBatchProgressEvent) => {
        setProgress(payload.batchId, { rowsProcessed: payload.rowsProcessed, totalRows: payload.totalRows })
      })

      socket.on("export-job:update", (payload: ExportJobUpdateEvent) => {
        queryClient.invalidateQueries({ queryKey: ["reports", "export-jobs"] })
        clearProgress(payload.id)
      })

      socket.on("export-job:progress", (payload: ExportJobProgressEvent) => {
        setProgress(payload.id, { rowsProcessed: payload.rowsProcessed, totalRows: payload.totalRows })
      })
    })()

    return () => {
      cancelled = true
      socket?.disconnect()
    }
  }, [queryClient, setProgress, clearProgress, setStatus])
}
