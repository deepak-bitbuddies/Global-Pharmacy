"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { CustomPageHeader, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { ReportFilterPanel } from "../components/filters"
import { useInitialFiltersFromUrl } from "../hooks/use-filters-from-url"
import { useNonMovingDetail } from "../hooks/use-reports"
import type { NonMovingDetailRow, ReportFilters } from "../types"

export function NonMovingReportPage() {
  const t = useTranslations("Reports.nonMoving")
  const tCommon = useTranslations("Common")
  const initialFilters = useInitialFiltersFromUrl()
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const pagination = useCursorPagination()
  const { data, isLoading, isError } = useNonMovingDetail(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0 space-y-2">
        <CustomPageHeader title={t("title")} description={t("description")} />
        <ReportFilterPanel
          filters={filters}
          onFiltersChange={updateFilters}
          show={{ item: true, branch: true, company: true }}
        />
      </div>

      <CustomTable<NonMovingDetailRow>
        fillHeight
        isError={isError}
        columns={[
          { key: "branchName", label: tCommon("branch") },
          { key: "itemName", label: tCommon("item"), sortable: true },
          { key: "currentStock", label: t("stockColumn"), sortable: true },
          { key: "value", label: t("value"), sortable: true },
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
          if (key === "currentStock") return formatNumber(row.currentStock)
          if (key === "value") return row.value === null ? "-" : formatCurrency(row.value)
          return row[key] ?? "-"
        }}
      />
    </div>
  )
}
