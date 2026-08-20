import axios, { type AxiosError } from "axios"

/**
 * Axios's own default array serialization writes `key[]=a&key[]=b` — the backend's Zod
 * `stringArrayFilter` preprocessing (and Fastify's querystring parser under it) only recognizes a
 * repeated bare key, `key=a&key=b` (same format `buildReportUrl`'s manual `URLSearchParams` already
 * uses for dashboard drill-down links). Without this, every array-valued filter sent through `api`
 * (branchId, company, item, supplier, supplierGroup, collectionMode, ...) silently arrives as
 * `undefined` server-side — the request succeeds, just unfiltered.
 */
function serializeParams(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry === undefined || entry === null) continue
        searchParams.append(key, String(entry))
      }
      continue
    }
    searchParams.append(key, String(value))
  }
  return searchParams.toString()
}

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: serializeParams,
})

export interface ApiErrorPayload {
  message: string
  status?: number
  code?: string
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; code?: string }>) => {
    // Session cookie missing/expired: bounce to login with a full reload so
    // the root layout re-reads the (now-absent) session cookie server-side.
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login"
    }

    // A `responseType: "blob"` request (e.g. downloading a completed export) still gets its error
    // body back as a Blob, not parsed JSON — read it as text so the real backend message survives
    // instead of silently falling back to the generic one below.
    let data: unknown = error.response?.data
    if (data instanceof Blob) {
      try {
        data = JSON.parse(await data.text())
      } catch {
        // leave `data` as the unreadable Blob — falls through to the generic message below
      }
    }
    const errorData = data as { message?: string; code?: string } | undefined

    const payload: ApiErrorPayload = {
      message: errorData?.message ?? error.message ?? "Something went wrong. Please try again.",
      status: error.response?.status,
      code: errorData?.code,
    }

    return Promise.reject(payload)
  }
)

export default api
