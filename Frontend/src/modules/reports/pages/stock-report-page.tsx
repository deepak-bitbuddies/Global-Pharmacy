"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { CustomPageHeader, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { ExportReportButton } from "../components/export-report-button"
import { ReportFilterPanel } from "../components/filters"
import { useStockReport } from "../hooks/use-reports"
import type { ReportFilters, StockRow } from "../types"

export function StockReportPage() {
  const t = useTranslations("Reports.stock")
  const tCommon = useTranslations("Common")
  const [filters, setFilters] = useState<ReportFilters>({})
  const pagination = useCursorPagination()
  const { data, isLoading, isError } = useStockReport(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0 space-y-2">
        <CustomPageHeader title={t("title")} description={t("description")} actions={<ExportReportButton reportType="stock" filters={filters} />} />
        <ReportFilterPanel
          filters={filters}
          onFiltersChange={updateFilters}
          show={{
            search: true,
            branch: true,
            company: true,
            expiryTier: true,
            dateRange: true,
            supplier: true,
            stockRange: true,
          }}
          searchPlaceholder={t("searchPlaceholder")}
        />
      </div>

      <CustomTable<StockRow>
        fillHeight
        isError={isError}
        // enableColumnVisibility
        noWrap
        columns={[
          { key: "asOfDate", label: tCommon("date"), sortable: true },
          { key: "branchName", label: tCommon("branch") },
          { key: "itemCode", label: t("itemCode") },
          { key: "itemName", label: tCommon("item"), sortable: true },
          { key: "currentStock", label: t("stockColumn"), sortable: true },
          { key: "unit", label: tCommon("unit") },
          { key: "value", label: t("value"), sortable: true },
          { key: "expDate", label: t("expiry"), sortable: true },
          { key: "daysToExpiry", label: t("daysToExpiry"), sortable: true },
          { key: "company", label: tCommon("company") },
          { key: "batch", label: t("batch") },
          { key: "costPrice", label: t("costPrice") },
          { key: "mrp", label: t("mrp") },
          { key: "purchasePrice", label: t("purchasePrice") },
          { key: "salesPrice", label: t("salesPrice") },
          { key: "manufacturer", label: t("manufacturer") },
          { key: "mfgDateRaw", label: t("mfgDate") },
          { key: "supplier", label: t("supplier") },
          { key: "invNo", label: t("invNo") },
          { key: "invDate", label: t("invDate") },
          { key: "rackNo", label: t("rackNo") },
          { key: "salesSchemeDeal", label: t("salesSchemeDeal") },
          { key: "salesSchemeFree", label: t("salesSchemeFree") },
          { key: "purcSchemeDeal", label: t("purcSchemeDeal") },
          { key: "purcSchemeFree", label: t("purcSchemeFree") },
          { key: "recDate", label: t("recDate") },
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
          if (key === "daysToExpiry") return row.daysToExpiry === null ? "-" : row.daysToExpiry < 0 ? t("expired") : `${row.daysToExpiry}d`
          const moneyKeys: (keyof StockRow)[] = ["value", "costPrice", "mrp", "purchasePrice", "salesPrice"]
          const qtyKeys: (keyof StockRow)[] = ["salesSchemeDeal", "salesSchemeFree", "purcSchemeDeal", "purcSchemeFree"]
          if (moneyKeys.includes(key)) {
            const value = row[key] as number | null
            return value === null ? "-" : formatCurrency(value)
          }
          if (qtyKeys.includes(key)) {
            const value = row[key] as number | null
            return value === null ? "-" : formatNumber(value)
          }
          return row[key] ?? "-"
        }}
      />
    </div>
  )
}
