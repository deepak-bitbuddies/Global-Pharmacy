import { cookies } from "next/headers"

import type { AuthUser } from "@/store/auth-store"
import { ACCESS_TOKEN_COOKIE, SESSION_COOKIE } from "./constants"

export async function getSession(): Promise<AuthUser | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)?.value
  if (!raw) return null

  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

/** Server-only: the raw backend JWT, for attaching to backend requests. */
export async function getAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_TOKEN_COOKIE)?.value ?? null
}
