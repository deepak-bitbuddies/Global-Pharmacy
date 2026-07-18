import { createStore } from "zustand/vanilla"

export type AuthRole = "super_admin" | "rider" | "customer"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: AuthRole
}

export interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
}

export type AuthStoreApi = ReturnType<typeof createAuthStore>

export function createAuthStore(initialUser: AuthUser | null = null) {
  return createStore<AuthState>()((set) => ({
    user: initialUser,
    isAuthenticated: initialUser !== null,
    setUser: (user) => set({ user, isAuthenticated: user !== null }),
  }))
}
