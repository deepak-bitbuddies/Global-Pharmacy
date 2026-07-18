import { getAccessToken } from "@/lib/auth/session"

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:4000"

/**
 * Wire shape of every Fastify backend response (see
 * Backend/src/shared/helpers/http-response.ts and
 * Backend/src/core/exceptions/global-error-handler.ts) — success responses
 * carry `data`, error responses carry `errors` instead. `message` is always
 * present at the top level either way.
 */
export interface BackendEnvelope<T> {
  success: boolean
  message: string
  data?: T
  errors?: unknown[]
  meta?: Record<string, unknown>
}

export class BackendRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = "BackendRequestError"
  }
}

async function fetchBackendEnvelope<T>(
  path: string,
  init: RequestInit = {},
): Promise<BackendEnvelope<T>> {
  const token = await getAccessToken()

  const method = init.method?.toUpperCase() ?? "GET"
  const hasBody = init.body !== undefined
  const shouldSetContentType = hasBody || !["GET", "DELETE", "HEAD", "OPTIONS"].includes(method)

  const response = await fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers: {
      ...(shouldSetContentType ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
    cache: "no-store",
  })

  const body = await response
    .json()
    .catch(() => ({ success: false, message: response.statusText }) as BackendEnvelope<T>)

  if (!response.ok || !body.success) {
    throw new BackendRequestError(
      body.message ?? "Backend request failed",
      response.status,
    )
  }

  return body
}

/**
 * Server-only helper for calling the real Fastify backend from Route
 * Handlers / Server Components / Server Actions. Attaches the caller's JWT
 * (read from the httpOnly access_token cookie) automatically — never call
 * this from a Client Component. Automatically unwraps the backend's
 * `{success,message,data}` envelope so callers just get `T` back.
 */
export async function backendFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const body = await fetchBackendEnvelope<T>(path, init)
  return body.data as T
}

/**
 * Same contract as `backendFetch`, but also surfaces the envelope's `meta`
 * (e.g. `{ total, page, pageSize }` on a paginated list endpoint) — plain
 * `backendFetch` intentionally drops `meta` since most callers (single-entity
 * reads/writes) don't need it. Use this instead of hand-parsing the envelope
 * whenever a Route Handler proxies a paginated list endpoint.
 */
export async function backendFetchWithMeta<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; meta?: Record<string, unknown> }> {
  const body = await fetchBackendEnvelope<T>(path, init)
  return { data: body.data as T, meta: body.meta }
}
