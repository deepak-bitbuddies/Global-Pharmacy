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
  (error: AxiosError<{ message?: string; code?: string }>) => {
    // Session cookie missing/expired: bounce to login with a full reload so
    // the root layout re-reads the (now-absent) session cookie server-side.
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login"
    }

    const payload: ApiErrorPayload = {
      message:
        error.response?.data?.message ?? error.message ?? "Something went wrong. Please try again.",
      status: error.response?.status,
      code: error.response?.data?.code,
    }

    return Promise.reject(payload)
  }
)

export default api
