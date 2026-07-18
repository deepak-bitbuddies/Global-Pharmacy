"use client"

import { createContext, useContext, useState } from "react"
import { useStore } from "zustand"

import {
  createAuthStore,
  type AuthState,
  type AuthStoreApi,
  type AuthUser,
} from "@/store/auth-store"

const AuthStoreContext = createContext<AuthStoreApi | null>(null)

export function AuthStoreProvider({
  initialUser,
  children,
}: {
  initialUser: AuthUser | null
  children: React.ReactNode
}) {
  const [store] = useState(() => createAuthStore(initialUser))

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  )
}

export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  const store = useContext(AuthStoreContext)
  if (!store) {
    throw new Error("useAuthStore must be used within AuthStoreProvider")
  }
  return useStore(store, selector)
}
