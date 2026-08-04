import { NextResponse } from "next/server"

import { getAccessToken } from "@/lib/auth/session"

/**
 * The backend JWT lives in an httpOnly cookie (see `app/api/admin/[...path]/route.ts`), so the
 * browser can't attach it to a direct `socket.io-client` connection the way it can to REST calls
 * proxied through that route. This is the one place that hands the token to client-side JS, for
 * the sole purpose of the Socket.IO handshake (`useImportSocket`) — never stored, just used
 * immediately to open the connection.
 */
export async function GET() {
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
  }
  return NextResponse.json({ token })
}
