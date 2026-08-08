"use client"

import { useTranslations } from "next-intl"

import { CustomSearchFilter } from "@/components/ui"
import type { ReportFilters } from "../../types"
import { FilterChips } from "./filter-chips"
import { FilterModal } from "./filter-modal"

export type ReportFilterFlags = {
  search?: boolean
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
}

type ReportFilterPanelProps = {
  filters: ReportFilters
  onFiltersChange: (updater: (prev: ReportFilters) => ReportFilters) => void
  /** Which filter controls to render — flip these per page instead of hand-wiring each filter. */
  show: ReportFilterFlags
  /** Overrides the search box's placeholder — e.g. Stock's search also matches code/batch/rack no, so it says so instead of the generic default. */
  searchPlaceholder?: string
}

/**
 * Single configurable filter panel shared by every report/dashboard page. Each page just
 * declares which filters it needs via `show`; this handles fetching, options, and wiring them
 * into `filters`/`onFiltersChange` identically everywhere instead of every page re-implementing
 * its own combination of Branch/Company/Scheme %/Expiry/Date range controls.
 *
 * Layout: the search box (if `show.search`) stays directly on the page; every other filter lives
 * behind a "Filters" button that opens `FilterModal` (staged edits, Apply/Cancel); active filters
 * show as removable chips via `FilterChips` underneath.
 */
export function ReportFilterPanel({ filters, onFiltersChange, show, searchPlaceholder }: ReportFilterPanelProps) {
  const tCommon = useTranslations("Common")

  const hasFilterModalContent =
    show.branch ||
    show.company ||
    show.schemeTier ||
    show.expiryTier ||
    show.dateRange ||
    show.supplier ||
    show.stockRange ||
    show.supplierGroup ||
    show.amountRange
  if (!show.search && !hasFilterModalContent) return null

  const activeCount = [
    show.branch && filters.branchId,
    show.company && filters.company,
    show.schemeTier && filters.schemeTier,
    show.expiryTier && filters.expiryTier,
    show.dateRange && filters.dateFrom && filters.dateTo,
    show.supplier && filters.supplier,
    show.stockRange && (filters.stockFrom !== undefined || filters.stockTo !== undefined),
    show.supplierGroup && filters.supplierGroup,
    show.amountRange && (filters.amountFrom !== undefined || filters.amountTo !== undefined),
  ].filter(Boolean).length

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {show.search && (
          <div className="min-w-0 flex-1">
            <CustomSearchFilter
              placeholder={searchPlaceholder ?? tCommon("searchItem")}
              value={filters.item}
              onChange={(value) => onFiltersChange((prev) => ({ ...prev, item: value || undefined }))}
              wrapperClassName="rounded-app border border-default bg-card transition-colors hover:bg-card"
            />
          </div>
        )}
        {hasFilterModalContent && (
          <div className="shrink-0">
            <FilterModal filters={filters} onFiltersChange={onFiltersChange} show={show} activeCount={activeCount} />
          </div>
        )}
      </div>
      <FilterChips filters={filters} onFiltersChange={onFiltersChange} show={show} />
    </div>
  )
}
