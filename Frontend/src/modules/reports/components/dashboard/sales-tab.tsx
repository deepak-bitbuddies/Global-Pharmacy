"use client"

import { useMemo, useState } from "react"
import { ChartLineUpIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { CustomTable } from "@/components/ui"
import { TremorBarList, TremorCard } from "@/components/ui/tremor"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { ReportFilterPanel } from "../filters"
import { useItemWiseSales } from "../../hooks/use-reports"
import type { ItemWiseSalesRow, ReportFilters } from "../../types"

export function SalesTab({ filters }: { filters: ReportFilters }) {
  const t = useTranslations("Dashboard.sales")
  const tCommon = useTranslations("Common")
  // Only `item` is ever set here — kept as a full `ReportFilters` shape (all fields optional)
  // purely so it drops straight into `ReportFilterPanel` without a cast.
  const [localFilters, setLocalFilters] = useState<ReportFilters>({})
  const pagination = useCursorPagination()
  const combinedFilters = useMemo<ReportFilters>(() => ({ ...filters, ...localFilters }), [filters, localFilters])

  const updateLocalFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setLocalFilters(updater)
    pagination.reset()
  }

  // Independent of the table's own pagination — page 1 of the same
  // amount-DESC sort is already the true top 10, no separate endpoint needed.
  const { data: topData } = useItemWiseSales(combinedFilters, { pageSize: 10 })
  const { data, isLoading } = useItemWiseSales(combinedFilters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

  const topItems = useMemo(() => (topData?.data ?? []).map((row) => ({ name: row.itemNameRaw, value: row.totalAmount })), [topData])

  return (
    <div className="space-y-4">
      <TremorCard className="space-y-3">
        <div className="flex items-center gap-2">
          <ChartLineUpIcon className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">{t("topItemsBySales")}</p>
        </div>
        <TremorBarList data={topItems} valueFormatter={(value) => formatCurrency(value)} />
      </TremorCard>

      <div className="space-y-2">
        <ReportFilterPanel filters={localFilters} onFiltersChange={updateLocalFilters} show={{ search: true }} />
        <CustomTable<ItemWiseSalesRow>
          columns={[
            { key: "itemNameRaw", label: tCommon("item"), sortable: true },
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
            return row[key]
          }}
        />
      </div>
    </div>
  )
}
