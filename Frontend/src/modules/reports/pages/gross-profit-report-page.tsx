"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { CustomPageHeader, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { ReportFilterPanel } from "../components/filters"
import { useInitialFiltersFromUrl } from "../hooks/use-filters-from-url"
import { useGrossProfit } from "../hooks/use-reports"
import type { GrossProfitRow, ReportFilters } from "../types"

export function GrossProfitReportPage() {
  const t = useTranslations("Reports.grossProfit")
  const tCommon = useTranslations("Common")
  const initialFilters = useInitialFiltersFromUrl()
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const pagination = useCursorPagination()
  const { data, isLoading, isError } = useGrossProfit(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0 space-y-2">
        <CustomPageHeader title={t("title")} description={t("description")} />
        <ReportFilterPanel filters={filters} onFiltersChange={updateFilters} show={{ search: true, branch: true, company: true, dateRange: true }} />
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
        totalItems={data?.meta?.total ?? 0}
        emptyText={t("emptyText")}
        onRowsPerPageChange={pagination.setPageSize}
        cursorPagination={{
          page: pagination.page,
          totalPages: data?.meta?.totalPages,
          hasNextPage: data?.meta?.hasNextPage ?? false,
          hasPreviousPage: pagination.page > 1,
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
