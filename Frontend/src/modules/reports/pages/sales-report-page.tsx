"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

import { CustomPageHeader, CustomTable } from "@/components/ui"
import { renderStatusCell, type StatusColorMap } from "@/components/ui/customTable/tableCellHelpers"
import { CustomColor } from "@/lib/types"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { ExportReportButton } from "../components/export-report-button"
import { ReportFilterPanel } from "../components/filters"
import { useInitialFiltersFromUrl } from "../hooks/use-filters-from-url"
import { useSalesDetail } from "../hooks/use-reports"
import { SalesCollectionMode, type ReportFilters, type SalesDetailRow } from "../types"

const COLLECTION_MODE_COLOR: StatusColorMap<SalesCollectionMode> = {
  [SalesCollectionMode.Cash]: CustomColor.success,
  [SalesCollectionMode.PaytmOnline]: CustomColor.accent,
  [SalesCollectionMode.CreditDue]: CustomColor.warning,
}

export function SalesReportPage() {
  const t = useTranslations("Reports.sales")
  const tCommon = useTranslations("Common")
  const initialFilters = useInitialFiltersFromUrl()
  const [filters, setFilters] = useState<ReportFilters>(initialFilters)
  const pagination = useCursorPagination()
  const { data, isLoading, isError } = useSalesDetail(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

  const collectionModeLabel: Record<SalesCollectionMode, string> = {
    [SalesCollectionMode.Cash]: t("modeCash"),
    [SalesCollectionMode.PaytmOnline]: t("modePaytmOnline"),
    [SalesCollectionMode.CreditDue]: t("modeCreditDue"),
  }

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0 space-y-2">
        <CustomPageHeader title={t("title")} description={t("description")} actions={<ExportReportButton reportType="sales" filters={filters} />} />
        <ReportFilterPanel
          filters={filters}
          onFiltersChange={updateFilters}
          show={{ item: true, branch: true, company: true, dateRange: true, amountRange: true, collectionMode: true }}
        />
      </div>

      <CustomTable<SalesDetailRow>
        fillHeight
        isError={isError}
        columns={[
          { key: "date", label: tCommon("date"), sortable: true },
          { key: "branchName", label: tCommon("branch") },
          { key: "itemNameRaw", label: tCommon("item"), sortable: true },
          { key: "company", label: tCommon("company") },
          { key: "qty", label: tCommon("qty") },
          { key: "unit", label: tCommon("unit") },
          { key: "rate", label: tCommon("rate") },
          { key: "amount", label: tCommon("amount"), sortable: true },
          { key: "collectionMode", label: t("mode") },
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
          if (key === "qty") return row.qty === null ? "-" : formatNumber(row.qty)
          if (key === "company") return row.company ?? "-"
          if (key === "collectionMode") return renderStatusCell(row.collectionMode, COLLECTION_MODE_COLOR, collectionModeLabel)
          return row[key] ?? "-"
        }}
      />
    </div>
  )
}
