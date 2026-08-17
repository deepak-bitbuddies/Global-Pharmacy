"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { CustomPageHeader, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency } from "@/utils/formatting"
import { ExportReportButton } from "../components/export-report-button"
import { ReportFilterPanel } from "../components/filters"
import { useInitialFiltersFromUrl } from "../hooks/use-filters-from-url"
import { useDaySalesDetail } from "../hooks/use-reports"
import type { DaySalesDetailRow, ReportFilters } from "../types"

export function DaySalesReportPage() {
  const t = useTranslations("Reports.daySales")
  const tCommon = useTranslations("Common")
  const initialFilters = useInitialFiltersFromUrl()
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const pagination = useCursorPagination()
  const { data, isLoading, isError } = useDaySalesDetail(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0 space-y-2">
        <CustomPageHeader title={t("title")} description={t("description")} actions={<ExportReportButton reportType="day_wise_sale" filters={filters} />} />
        <ReportFilterPanel filters={filters} onFiltersChange={updateFilters} show={{ branch: true, dateRange: true }} />
      </div>

      <CustomTable<DaySalesDetailRow>
        fillHeight
        isError={isError}
        columns={[
          { key: "date", label: t("date"), sortable: true },
          { key: "branchName", label: tCommon("branch") },
          { key: "billNoRange", label: t("billNoRange") },
          { key: "billValue", label: t("billValue"), sortable: true },
          { key: "taxable", label: t("taxable") },
          { key: "taxPayable", label: t("taxPayable") },
          { key: "taxFree", label: t("taxFree") },
          { key: "exempted", label: t("exempted") },
          { key: "roundOff", label: t("roundOff") },
        ]}
        data={data?.data ?? []}
        loading={isLoading}
        rowKey="id"
        itemId="id"
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
          if (key === "billValue" || key === "taxable" || key === "taxPayable" || key === "taxFree" || key === "exempted" || key === "roundOff") {
            return row[key] === null ? "-" : formatCurrency(row[key] as number)
          }
          if (key === "billNoRange") return row.billNoRange ?? "-"
          return row[key]
        }}
      />
    </div>
  )
}
