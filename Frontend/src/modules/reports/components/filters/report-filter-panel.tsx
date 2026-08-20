"use client"

import type { ReportFilters } from "../../types"
import { FilterChips } from "./filter-chips"
import { FilterModal } from "./filter-modal"

export type ReportFilterFlags = {
  item?: boolean
  branch?: boolean
  company?: boolean
  schemeTier?: boolean
  expiryTier?: boolean
  dateRange?: boolean
  // Stock-only.
  supplier?: boolean
  stockRange?: boolean
  // Purchase-only.
  supplierGroup?: boolean
  // Purchase/Sales.
  amountRange?: boolean
  // Sales-only.
  collectionMode?: boolean
}

type ReportFilterPanelProps = {
  filters: ReportFilters
  onFiltersChange: (updater: (prev: ReportFilters) => ReportFilters) => void
  /** Which filter controls to render — flip these per page instead of hand-wiring each filter. */
  show: ReportFilterFlags
}

/**
 * Single configurable filter panel shared by every report/dashboard page. Each page just
 * declares which filters it needs via `show`; this handles fetching, options, and wiring them
 * into `filters`/`onFiltersChange` identically everywhere instead of every page re-implementing
 * its own combination of Item/Branch/Company/Scheme %/Expiry/Date range controls.
 *
 * Layout: every filter (including Item, a multi-select of exact item names) lives behind a
 * "Filters" button that opens `FilterModal` (staged edits, Apply/Cancel); active filters show as
 * removable chips via `FilterChips` underneath — one chip per selected value.
 */
export function ReportFilterPanel({ filters, onFiltersChange, show }: ReportFilterPanelProps) {
  const hasFilterModalContent =
    show.item ||
    show.branch ||
    show.company ||
    show.schemeTier ||
    show.expiryTier ||
    show.dateRange ||
    show.supplier ||
    show.stockRange ||
    show.supplierGroup ||
    show.amountRange ||
    show.collectionMode
  if (!hasFilterModalContent) return null

  const activeCount = [
    show.item && filters.item?.length,
    show.branch && filters.branchId?.length,
    show.company && filters.company?.length,
    show.schemeTier && filters.schemeTier,
    show.expiryTier && filters.expiryTier,
    show.dateRange && filters.dateFrom && filters.dateTo,
    show.supplier && filters.supplier?.length,
    show.stockRange && (filters.stockFrom !== undefined || filters.stockTo !== undefined),
    show.supplierGroup && filters.supplierGroup?.length,
    show.amountRange && (filters.amountFrom !== undefined || filters.amountTo !== undefined),
    show.collectionMode && filters.collectionMode?.length,
  ].filter(Boolean).length

  return (
    <div className="space-y-2">
      <FilterModal filters={filters} onFiltersChange={onFiltersChange} show={show} activeCount={activeCount} />
      <FilterChips filters={filters} onFiltersChange={onFiltersChange} show={show} />
    </div>
  )
}
