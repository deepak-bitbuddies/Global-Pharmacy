import { NextResponse, type NextRequest } from "next/server"

import { PUBLIC_PATHS, SESSION_COOKIE } from "@/lib/auth/constants"

export default function proxy(request: NextRequest) {
  const isAuthenticated = Boolean(request.cookies.get(SESSION_COOKIE)?.value)
  const isPublicPath = PUBLIC_PATHS.includes(request.nextUrl.pathname)

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
