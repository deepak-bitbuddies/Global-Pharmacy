import { NextResponse, type NextRequest } from "next/server"

import { getAccessToken } from "@/lib/auth/session"

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000"

/**
 * Generic authenticated proxy for every `/api/v1/admin/*` backend route.
 * The backend JWT lives in an httpOnly cookie (see `login/route.ts`), so
 * client components can never attach it themselves — this is the one place
 * that reads it server-side and forwards it as a Bearer token, for both
 * JSON requests (reports) and multipart file uploads (imports).
 */
async function proxy(request: NextRequest, path: string[]): Promise<NextResponse> {
  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
  }

  const backendUrl = `${BACKEND_API_URL}/api/v1/admin/${path.join("/")}${request.nextUrl.search}`
  const contentType = request.headers.get("content-type") ?? ""
  const isMultipart = contentType.includes("multipart/form-data")

  const headers: HeadersInit = { Authorization: `Bearer ${token}` }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    // Re-serializing FormData lets `fetch` generate a fresh multipart
    // boundary — forwarding the raw body/content-type from the incoming
    // request would carry a stale boundary that no longer matches.
    if (isMultipart) {
      init.body = await request.formData()
    } else {
      const text = await request.text()
      // Only attach a body/Content-Type when there actually is one — DELETE
      // (and sometimes PATCH) requests often have none, and Fastify's JSON
      // body parser rejects an empty body sent with Content-Type: application/json.
      if (text) {
        init.body = text
        headers["Content-Type"] = "application/json"
      }
    }
  }

  let backendResponse: Response
  try {
    backendResponse = await fetch(backendUrl, init)
  } catch {
    return NextResponse.json({ success: false, message: "Could not reach the backend. Is it running?" }, { status: 502 })
  }

  // Binary responses (currently just report-export downloads) never come back as JSON — stream them
  // through untouched instead of trying to `.json()` them, forwarding the headers the browser needs
  // to actually save the file. Every other route still gets the exact envelope-unwrapping behavior
  // below, unaffected.
  const responseContentType = backendResponse.headers.get("content-type") ?? ""
  if (!responseContentType.includes("application/json")) {
    const headers = new Headers({ "Content-Type": responseContentType })
    const disposition = backendResponse.headers.get("content-disposition")
    if (disposition) headers.set("Content-Disposition", disposition)
    return new NextResponse(backendResponse.body, { status: backendResponse.status, headers })
  }

  const data = await backendResponse.json().catch(() => ({ success: false, message: backendResponse.statusText }))
  return NextResponse.json(data, { status: backendResponse.status })
}

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(request: NextRequest, { params }: RouteContext) {
  return proxy(request, (await params).path)
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  return proxy(request, (await params).path)
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return proxy(request, (await params).path)
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return proxy(request, (await params).path)
}
