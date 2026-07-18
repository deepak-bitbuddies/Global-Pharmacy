import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { ACCESS_TOKEN_COOKIE, SESSION_COOKIE } from "@/lib/auth/constants"

export async function POST() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  store.delete(ACCESS_TOKEN_COOKIE)
  return NextResponse.json({ success: true })
}
