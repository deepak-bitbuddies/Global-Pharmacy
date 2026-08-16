import axios, { type AxiosError } from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
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
