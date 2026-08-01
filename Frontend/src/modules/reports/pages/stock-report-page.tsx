"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { CustomPageHeader, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { ReportFilterPanel } from "../components/filters"
import { useStockReport } from "../hooks/use-reports"
import type { ReportFilters, StockRow } from "../types"

export function StockReportPage() {
  const t = useTranslations("Reports.stock")
  const tCommon = useTranslations("Common")
  const [filters, setFilters] = useState<ReportFilters>({})
  const pagination = useCursorPagination()
  const { data, isLoading } = useStockReport(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  return (
    <div className="space-y-4">
      <CustomPageHeader title={t("title")} description={t("description")} />

      <ReportFilterPanel
        filters={filters}
        onFiltersChange={updateFilters}
        show={{ search: true, branch: true, company: true, dateRange: true }}
        className="sm:grid-cols-1! md:grid-cols-3!"
      />

      <CustomTable<StockRow>
        columns={[
          { key: "asOfDate", label: tCommon("date"), sortable: true },
          { key: "itemName", label: tCommon("item"), sortable: true },
          { key: "currentStock", label: t("stockColumn"), sortable: true },
          { key: "unit", label: tCommon("unit") },
          { key: "value", label: t("value"), sortable: true },
          { key: "expDate", label: t("expiry"), sortable: true },
          { key: "company", label: tCommon("company") },
          { key: "batch", label: t("batch") },
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
          if (key === "value") return row.value === null ? "-" : formatCurrency(row.value)
          if (key === "currentStock") return formatNumber(row.currentStock)
          return row[key] ?? "-"
        }}
      />
    </div>
  )
}
