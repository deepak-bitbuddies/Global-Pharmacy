"use client"

import { useEffect, useState } from "react"
import { useIsFetching, useIsMutating } from "@tanstack/react-query"

// Avoids a flash-of-loading-bar for requests that resolve near-instantly (e.g. served from a warm
// cache while silently revalidating) — only shows once something's actually been in flight for a
// beat, same reasoning `CustomTable`'s skeletons aren't shown for every render.
const SHOW_DELAY_MS = 150

/**
 * App-wide "something is loading" indicator — a thin bar sliding across the top of the viewport
 * whenever ANY React Query fetch or mutation is in flight, anywhere in the app. Mounted once
 * inside `QueryProvider` so every report/table/dashboard page gets this for free, instead of each
 * page wiring up its own `isFetching` handling — which is what was missing: `placeholderData:
 * keepPreviousData` (see `use-reports.ts` etc.) keeps `isLoading` false during a filter-driven
 * refetch, so a page that only checks `isLoading` shows no feedback at all while new data loads.
 */
export function QueryLoadingBar() {
  const fetching = useIsFetching()
  const mutating = useIsMutating()
  const isActive = fetching > 0 || mutating > 0
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setVisible(false)
      return
    }
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isActive])

  if (!visible) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden bg-transparent" role="status" aria-live="polite" aria-label="Loading">
      {/* A plain `bg-primary` fill reads as barely-there in dark mode, where `--primary` is a
          muted tone close in hue to the dark background — the glow (`box-shadow`) is what
          actually makes the bar legible against a dark background, not just the fill color. */}
      <div
        className="h-full w-2/5 rounded-full bg-primary"
        style={{ animation: "loading-bar-slide 1.1s ease-in-out infinite", boxShadow: "0 0 8px 1px var(--primary)" }}
      />
    </div>
  )
}
