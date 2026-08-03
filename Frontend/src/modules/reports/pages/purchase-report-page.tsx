"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { CustomPageHeader, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { ReportFilterPanel } from "../components/filters"
import { usePurchaseDetail } from "../hooks/use-reports"
import type { PurchaseDetailRow, ReportFilters } from "../types"

export function PurchaseReportPage() {
  const t = useTranslations("Reports.purchase")
  const tCommon = useTranslations("Common")
  const [filters, setFilters] = useState<ReportFilters>({})
  const pagination = useCursorPagination()
  const { data, isLoading } = usePurchaseDetail(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

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
        show={{ search: true, branch: true, company: true, schemeTier: true, dateRange: true }}
        className="sm:grid-cols-1! md:grid-cols-2! lg:grid-cols-4!"
      />

      <CustomTable<PurchaseDetailRow>
        columns={[
          { key: "date", label: tCommon("date"), sortable: true },
          { key: "branchName", label: tCommon("branch") },
          { key: "itemNameRaw", label: tCommon("item"), sortable: true },
          { key: "supplierGroup", label: t("supplier"), sortable: true },
          { key: "company", label: tCommon("company") },
          { key: "qty", label: tCommon("qty") },
          { key: "freeQty", label: t("freeQty") },
          { key: "rate", label: tCommon("rate") },
          { key: "amount", label: tCommon("amount"), sortable: true },
          { key: "schemePct", label: t("schemePct") },
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
          if (key === "rate" || key === "amount") return row[key] === null ? "-" : formatCurrency(row[key] as number)
          if (key === "qty" || key === "freeQty") return row[key] === null ? "-" : formatNumber(row[key] as number)
          if (key === "schemePct") return row.schemePct === null ? "-" : `${row.schemePct.toFixed(2)}%`
          if (key === "company") return row.company ?? "-"
          return row[key]
        }}
      />
    </div>
  )
}
