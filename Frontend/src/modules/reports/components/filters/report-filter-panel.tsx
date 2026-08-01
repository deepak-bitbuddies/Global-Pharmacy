"use client"

import { useTranslations } from "next-intl"

import { CustomFilterBar, CustomSearchFilter } from "@/components/ui"
import type { ReportFilters } from "../../types"
import { BranchFilter } from "./branch-filter"
import { CompanyFilter } from "./company-filter"
import { ReportDateRangeFilter } from "./date-range-filter"
import { SchemeTierFilter } from "./scheme-tier-filter"

export type ReportFilterFlags = {
  search?: boolean
  branch?: boolean
  company?: boolean
  schemeTier?: boolean
  dateRange?: boolean
}

type ReportFilterPanelProps = {
  filters: ReportFilters
  onFiltersChange: (updater: (prev: ReportFilters) => ReportFilters) => void
  /** Which filter controls to render — flip these per page instead of hand-wiring each filter. */
  show: ReportFilterFlags
  /** Forwarded to the underlying `CustomFilterBar` — e.g. a grid-cols override for 3+ filters. */
  className?: string
}

/**
 * Single configurable filter panel shared by every report/dashboard page. Each page just
 * declares which filters it needs via `show`; this handles fetching, options, layout, and
 * wiring them into `filters`/`onFiltersChange` identically everywhere instead of every page
 * re-implementing its own combination of Branch/Company/Scheme %/Date range controls.
 */
export function ReportFilterPanel({ filters, onFiltersChange, show, className }: ReportFilterPanelProps) {
  const tCommon = useTranslations("Common")

  const hasFilterBarContent = show.branch || show.company || show.schemeTier || show.dateRange
  if (!show.search && !hasFilterBarContent) return null

  return (
    <div className="space-y-4">
      {show.search && (
        <CustomSearchFilter
          placeholder={tCommon("searchItem")}
          value={filters.item}
          onChange={(value) => onFiltersChange((prev) => ({ ...prev, item: value || undefined }))}
        />
      )}
      {hasFilterBarContent && (
        <CustomFilterBar className={className}>
          {show.branch && <BranchFilter value={filters.branchId} onChange={(branchId) => onFiltersChange((prev) => ({ ...prev, branchId }))} />}
          {show.company && <CompanyFilter value={filters.company} onChange={(company) => onFiltersChange((prev) => ({ ...prev, company }))} />}
          {show.schemeTier && (
            <SchemeTierFilter value={filters.schemeTier} onChange={(schemeTier) => onFiltersChange((prev) => ({ ...prev, schemeTier }))} />
          )}
          {show.dateRange && (
            <ReportDateRangeFilter
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              onChange={({ dateFrom, dateTo }) => onFiltersChange((prev) => ({ ...prev, dateFrom, dateTo }))}
            />
          )}
        </CustomFilterBar>
      )}
    </div>
  )
}
