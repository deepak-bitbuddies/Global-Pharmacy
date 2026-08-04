"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { io } from "socket.io-client"

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000"

/**
 * Live-refreshes import data as bulk-upload background jobs finish, from any screen — mounted
 * once in `DashboardShell` rather than per-page. Fetches a short-lived token via `/api/socket-token`
 * (the browser never otherwise holds the raw backend JWT, see that route's comment) and, on every
 * `import-batch:update` event, invalidates the whole `["reports", ...]` query key prefix — covers
 * import-batch history, upload-cycle-status, and every report table in one shot.
 */
export function useImportSocket(): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    let socket: ReturnType<typeof io> | undefined
    let cancelled = false

    void (async () => {
      const response = await fetch("/api/socket-token")
      if (!response.ok || cancelled) return
      const { token } = (await response.json()) as { token: string }
      if (cancelled) return

      socket = io(SOCKET_URL, { auth: { token } })
      socket.on("import-batch:update", () => {
        queryClient.invalidateQueries({ queryKey: ["reports"] })
      })
    })()

    return () => {
      cancelled = true
      socket?.disconnect()
    }
  }, [queryClient])
}
