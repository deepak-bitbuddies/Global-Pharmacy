import { createStore } from "zustand/vanilla"

// Mirrors the backend's `SystemRoleCode` (`shared/enums/user-role.enum.ts`) value-for-value — kept
// as a real TS enum here per this codebase's frontend convention (backend uses a const-object).
export enum SystemRoleCode {
  SuperAdmin = "super_admin",
  BranchUser = "branch_user",
  Rider = "rider",
  Customer = "customer",
}

export type AuthRole = `${SystemRoleCode}`

export interface AuthUser {
  id: string
  name: string
  email: string
  role: AuthRole
  branchId: string | null
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
