"use client"

import { useSearchParams } from "next/navigation"
import type { ExpiryTier, ReportFilters, SchemeTier } from "../types"

const STRING_KEYS = ["branchId", "dateFrom", "dateTo", "company", "item", "supplier", "supplierGroup"] as const satisfies (keyof ReportFilters)[]
const NUMBER_KEYS = ["stockFrom", "stockTo", "amountFrom", "amountTo"] as const satisfies (keyof ReportFilters)[]

/**
 * Reads the initial filter values a dashboard drill-down link left in the URL query string (see
 * `buildReportUrl`). Read once on mount — after that, filters live purely in the report page's own
 * local state, same as before this existed; navigating with the browser back button re-mounts the
 * page and re-reads the URL fresh.
 */
export function useInitialFiltersFromUrl(): ReportFilters {
  const searchParams = useSearchParams()
  const filters: ReportFilters = {}

  for (const key of STRING_KEYS) {
    const value = searchParams.get(key)
    if (value) filters[key] = value
  }
  for (const key of NUMBER_KEYS) {
    const raw = searchParams.get(key)
    if (raw !== null && raw !== "") {
      const value = Number(raw)
      if (!Number.isNaN(value)) filters[key] = value
    }
  }
  const schemeTier = searchParams.get("schemeTier")
  if (schemeTier) filters.schemeTier = schemeTier as SchemeTier
  const expiryTier = searchParams.get("expiryTier")
  if (expiryTier) filters.expiryTier = expiryTier as ExpiryTier

  return filters
}
