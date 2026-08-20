"use client"

import { useSearchParams } from "next/navigation"
import { SalesCollectionMode, type ExpiryTier, type ReportFilters, type SchemeTier } from "../types"

const STRING_KEYS = ["dateFrom", "dateTo"] as const satisfies (keyof ReportFilters)[]
const ARRAY_KEYS = ["branchId", "company", "item", "supplier", "supplierGroup"] as const satisfies (keyof ReportFilters)[]
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
  for (const key of ARRAY_KEYS) {
    // `getAll` returns every occurrence of a repeated key — matches how `buildReportUrl` writes
    // array filters (one `params.append` per selected value).
    const values = searchParams.getAll(key)
    if (values.length > 0) filters[key] = values
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

  const collectionModeValues = searchParams.getAll("collectionMode") as SalesCollectionMode[]
  const validCollectionModes = collectionModeValues.filter((value): value is SalesCollectionMode => Object.values(SalesCollectionMode).includes(value))
  if (validCollectionModes.length > 0) filters.collectionMode = validCollectionModes

  return filters
}
