"use client"

import { useState } from "react"
import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Report/branch data only changes when someone imports a new file or
        // edits a branch — treating it as stale immediately (the previous
        // default) forced a network round-trip on every single component
        // mount, including switching back to a dashboard tab you'd already
        // loaded seconds ago. 30s keeps data reasonably fresh while letting
        // `refetchOnMount`'s default (only refetch if actually stale) skip
        // redundant refetches for data that's already sitting in the cache.
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (isServer) {
    return makeQueryClient()
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
