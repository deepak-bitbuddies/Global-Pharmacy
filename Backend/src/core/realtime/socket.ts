import type { FastifyInstance } from "fastify"
import { Server as SocketIOServer } from "socket.io"

import { env } from "../config/env.js"

let io: SocketIOServer | null = null

export type ImportBatchUpdatePayload = {
  batchId: string
  branchId: string
  fileType: string
  status: "completed" | "failed"
  rowCount?: number
  errorMessage?: string
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
