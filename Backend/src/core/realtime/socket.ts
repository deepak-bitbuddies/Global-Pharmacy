import type { FastifyInstance } from "fastify"
import { Server as SocketIOServer } from "socket.io"

import { env } from "../config/env.js"

let io: SocketIOServer | null = null

export type ImportBatchUpdatePayload = {
  // Null only for a bulk file whose report type couldn't be identified at all — there's no batch
  // row for it (nothing to attach one to), so this is the sole way the frontend hears about it.
  batchId: string | null
  branchId: string
  fileType: string | null
  fileName: string
  status: "processing" | "completed" | "failed"
  rowCount?: number
  errorMessage?: string
}

export type ImportBatchProgressPayload = {
  batchId: string
  branchId: string
  fileType: string
  rowsProcessed: number
  totalRows: number
}

export type ExportJobUpdatePayload = {
  id: string
  reportType: string
  branchId: string | null
  status: "processing" | "completed" | "failed"
  rowCount?: number
  errorMessage?: string
}

export type ExportJobProgressPayload = {
  id: string
  reportType: string
  branchId: string | null
  rowsProcessed: number
  totalRows: number
}

/**
 * Real-time push for the bulk-upload background committer (see `uploads/service.ts`) — currently
 * the only consumer. Auth: the handshake carries a short-lived JWT (the frontend mints one via
 * `GET /api/socket-token`, since the browser never otherwise holds the raw backend JWT — see
 * `app/api/admin/[...path]/route.ts`), verified the same way `requireAuth` verifies REST requests.
 * No per-branch rooms — broadcasts to every connected admin socket, which is fine at this app's
 * scale (a handful of admins, not a multi-tenant fleet).
 */
export function attachSocketServer(fastify: FastifyInstance): void {
  io = new SocketIOServer(fastify.server, {
    cors: { origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","), credentials: true },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) {
      next(new Error("Missing auth token"))
      return
    }
    try {
      fastify.jwt.verify(token)
      next()
    } catch {
      next(new Error("Invalid auth token"))
    }
  })
}

export function emitImportBatchUpdate(payload: ImportBatchUpdatePayload): void {
  io?.emit("import-batch:update", payload)
}

/** High-frequency (per insert-chunk) progress ticks — kept as a separate event from `import-batch:update` so listeners can treat them differently (e.g. never trigger a full query invalidation off of one). */
export function emitImportBatchProgress(payload: ImportBatchProgressPayload): void {
  io?.emit("import-batch:progress", payload)
}

/** Same processing/completed/failed shape as `emitImportBatchUpdate`, for background report exports (see `reports/service.ts`'s `runExportPipeline`). */
export function emitExportJobUpdate(payload: ExportJobUpdatePayload): void {
  io?.emit("export-job:update", payload)
}

export function emitExportJobProgress(payload: ExportJobProgressPayload): void {
  io?.emit("export-job:progress", payload)
}
