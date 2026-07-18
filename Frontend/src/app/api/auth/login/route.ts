import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import {
  ACCESS_TOKEN_COOKIE,
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
} from "@/lib/auth/constants"
import type { BackendEnvelope } from "@/lib/backend"
import type { AuthUser } from "@/store/auth-store"

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000"

interface LoginResponseData {
  token: string
  user: AuthUser
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim() : ""
  const password = typeof body?.password === "string" ? body.password : ""

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 },
    )
  }

  let backendResponse: Response
  try {
    backendResponse = await fetch(`${BACKEND_API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })
  } catch {
    return NextResponse.json(
      { message: "Could not reach the backend. Is it running?" },
      { status: 502 },
    )
  }

  if (!backendResponse.ok) {
    const errorBody = await backendResponse
      .json()
      .catch(() => ({ message: "Login failed" }))
    return NextResponse.json(
      { message: errorBody.message ?? "Login failed" },
      { status: backendResponse.status },
    )
  }

  const { data } = (await backendResponse.json()) as BackendEnvelope<LoginResponseData>
  const { token, user } = data!

  const store = await cookies()
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: SESSION_COOKIE_MAX_AGE,
  }
  store.set(SESSION_COOKIE, JSON.stringify(user), cookieOptions)
  store.set(ACCESS_TOKEN_COOKIE, token, cookieOptions)

  return NextResponse.json({ user })
}
