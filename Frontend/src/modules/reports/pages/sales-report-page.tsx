"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { CustomPageHeader, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { ReportFilterPanel } from "../components/filters"
import { useItemWiseSales } from "../hooks/use-reports"
import type { ItemWiseSalesRow, ReportFilters } from "../types"

export function SalesReportPage() {
  const t = useTranslations("Reports.sales")
  const tCommon = useTranslations("Common")
  const [filters, setFilters] = useState<ReportFilters>({})
  const pagination = useCursorPagination()
  const { data, isLoading } = useItemWiseSales(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

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

      <CustomTable<ItemWiseSalesRow>
        columns={[
          { key: "itemNameRaw", label: tCommon("item"), sortable: true },
          { key: "branchName", label: tCommon("branch") },
          { key: "company", label: tCommon("company") },
          { key: "totalQty", label: t("qtySold"), sortable: true },
          { key: "totalAmount", label: tCommon("amount"), sortable: true },
          { key: "returnQty", label: t("returnQty") },
          { key: "returnAmount", label: t("returnAmount") },
        ]}
        data={data?.data ?? []}
        loading={isLoading}
        rowKey="itemNameRaw"
        itemId="itemNameRaw"
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
          if (key === "totalAmount" || key === "returnAmount") return formatCurrency(row[key])
          if (key === "totalQty" || key === "returnQty") return formatNumber(row[key])
          if (key === "company") return row.company ?? "-"
          return row[key]
        }}
      />
    </div>
  )
}
