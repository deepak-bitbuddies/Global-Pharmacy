"use client"

import { CustomDateRangeFilter } from "@/components/ui"

type ReportDateRangeFilterProps = {
  dateFrom?: string
  dateTo?: string
  onChange: (range: { dateFrom?: string; dateTo?: string }) => void
  /** Visible label above the picker. Omitted by default — the shared `CustomDateRangeFilter` UI component defaults to showing "Date range" on its own, so this must be explicitly passed (even as "") to suppress it; only pass this when a caller actually wants a visible label. */
  label?: string
}

/** Shared date-range filter — converts to/from the `dateFrom`/`dateTo` shape every `ReportFilters` object uses. */
export function ReportDateRangeFilter({ dateFrom, dateTo, onChange, label = "" }: ReportDateRangeFilterProps) {
  return (
    <CustomDateRangeFilter
      className="flex flex-col space-y-1"
      label={label}
      value={dateFrom && dateTo ? { start: dateFrom, end: dateTo } : undefined}
      onChange={(range) => onChange({ dateFrom: range?.start, dateTo: range?.end })}
    />
  )
}
