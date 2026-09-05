"use client"

import { CustomSearchFilter } from "@/components/ui"
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
  /** Placeholder for the always-visible search box — each page passes its own tailored copy. */
  searchPlaceholder?: string
  /** Rendered at the right end of the search + Filters row — e.g. the Columns toggle. */
  trailingContent?: React.ReactNode
}

/**
 * Single configurable filter panel shared by every report/dashboard page. Each page just
 * declares which filters it needs via `show`; this handles fetching, options, and wiring them
 * into `filters`/`onFiltersChange` identically everywhere instead of every page re-implementing
 * its own combination of Item/Branch/Company/Scheme %/Expiry/Date range controls.
 *
 * Layout: a full-width search box (matches every column, not routed through `FilterModal`) sits
 * beside a "Filters" button for everything else — same row shape as Purchase Analysis' and Expense
 * Tracker's own filter bars. `FilterModal` stages edits behind Apply/Cancel; active filters show as
 * removable chips via `FilterChips` underneath — one chip per selected value.
 */
export function ReportFilterPanel({ filters, onFiltersChange, show, searchPlaceholder, trailingContent }: ReportFilterPanelProps) {
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
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-52 flex-1">
          <CustomSearchFilter
            value={filters.search ?? ""}
            onChange={(value) => onFiltersChange((prev) => ({ ...prev, search: value || undefined }))}
            placeholder={searchPlaceholder}
          />
        </div>
        {hasFilterModalContent && <FilterModal filters={filters} onFiltersChange={onFiltersChange} show={show} activeCount={activeCount} />}
        {trailingContent}
      </div>
      {hasFilterModalContent && <FilterChips filters={filters} onFiltersChange={onFiltersChange} show={show} />}
    </div>
  )
}
