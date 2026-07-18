import { api } from "@/lib/axios"
import type { AuthUser } from "@/store/auth-store"

export interface LoginInput {
  email: string
  password: string
}

export async function login(input: LoginInput): Promise<{ user: AuthUser }> {
  const { data } = await api.post<{ user: AuthUser }>("/auth/login", input)
  return data
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout")
}
