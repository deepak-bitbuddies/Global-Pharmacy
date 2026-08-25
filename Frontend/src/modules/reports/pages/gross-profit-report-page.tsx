"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { ButtonVariant, CustomButton, CustomPageHeader, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { ReportFilterPanel } from "../components/filters"
import { useInitialFiltersFromUrl } from "../hooks/use-filters-from-url"
import { useGrossProfit } from "../hooks/use-reports"
import { TopNDirection, type GrossProfitRow, type ReportFilters } from "../types"

export function GrossProfitReportPage() {
  const t = useTranslations("Reports.grossProfit")
  const tCommon = useTranslations("Common")
  const initialFilters = useInitialFiltersFromUrl()
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const pagination = useCursorPagination()

  // Arriving from a dashboard "Top N" widget link — show exactly that slice, nothing more, and no
  // page-by-page browsing (the point was "give me this exact list"), until the user backs out of
  // it via the banner below.
  const topN = filters.limit && filters.direction ? { limit: filters.limit, direction: filters.direction } : null
  const { data, isLoading, isError } = useGrossProfit(
    filters,
    { cursor: topN ? undefined : pagination.cursor, pageSize: topN?.limit ?? pagination.pageSize },
    topN?.direction,
  )

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  const clearTopN = () => updateFilters((prev) => ({ ...prev, limit: undefined, direction: undefined }))

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0 space-y-2">
        <CustomPageHeader title={t("title")} description={t("description")} />
        <ReportFilterPanel filters={filters} onFiltersChange={updateFilters} show={{ item: true, branch: true, company: true, dateRange: true }} />
        {topN && (
          <div className="flex items-center gap-3 rounded-app border border-default bg-muted-surface px-3 py-2 text-sm">
            <span className="text-foreground">
              {topN.direction === TopNDirection.Top ? t("showingTop", { count: topN.limit }) : t("showingBottom", { count: topN.limit })}
            </span>
            <CustomButton variant={ButtonVariant.ghost} className="ml-auto h-7 px-2 text-xs" onClick={clearTopN}>
              {t("showAll")}
            </CustomButton>
          </div>
        )}
      </div>

      <CustomTable<GrossProfitRow>
        fillHeight
        isError={isError}
        columns={[
          { key: "itemName", label: tCommon("item"), sortable: true },
          { key: "salesAmount", label: t("salesAmount"), sortable: true },
          { key: "salesQty", label: tCommon("qty"), sortable: true },
          { key: "avgCostPrice", label: t("avgCost") },
          { key: "estimatedGp", label: t("estGp"), sortable: true },
          { key: "estimatedGpPct", label: t("gpPct") },
        ]}
        data={data?.data ?? []}
        loading={isLoading}
        rowKey="itemName"
        itemId="itemName"
        totalItems={topN ? (data?.data.length ?? 0) : (data?.meta?.total ?? 0)}
        emptyText={t("emptyText")}
        onRowsPerPageChange={pagination.setPageSize}
        cursorPagination={{
          page: pagination.page,
          totalPages: topN ? 1 : data?.meta?.totalPages,
          hasNextPage: topN ? false : (data?.meta?.hasNextPage ?? false),
          hasPreviousPage: topN ? false : pagination.page > 1,
          onNext: () => pagination.goNext(data?.meta?.nextCursor ?? null),
          onPrevious: pagination.goPrevious,
        }}
        renderCustomCell={(row, key) => {
          if (key === "salesAmount" || key === "estimatedGp" || key === "avgCostPrice") return row[key] === null ? "-" : formatCurrency(row[key] as number)
          if (key === "salesQty") return formatNumber(row[key])
          if (key === "estimatedGpPct") return row[key] === null ? "-" : `${(row[key] as number).toFixed(1)}%`
          return row[key]
        }}
      />
    </div>
  )
}
