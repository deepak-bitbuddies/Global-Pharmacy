"use client"

import { useMemo, useState } from "react"
import { ChartLineUpIcon } from "@phosphor-icons/react"

import { CustomSearchFilter, CustomTable } from "@/components/ui"
import { TremorBarList, TremorCard } from "@/components/ui/tremor"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { useItemWiseSales } from "../../hooks/use-reports"
import type { ItemWiseSalesRow, ReportFilters } from "../../types"

export function SalesTab({ filters }: { filters: ReportFilters }) {
  const [search, setSearch] = useState<string | undefined>(undefined)
  const pagination = useCursorPagination()
  const combinedFilters = useMemo<ReportFilters>(() => ({ ...filters, item: search || undefined }), [filters, search])

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
          <p className="text-sm font-semibold text-foreground">Top Items by Sales</p>
        </div>
        <TremorBarList data={topItems} valueFormatter={(value) => formatCurrency(value)} />
      </TremorCard>

      <div className="space-y-2">
        <CustomSearchFilter
          placeholder="Search item..."
          value={search}
          onChange={(value) => {
            setSearch(value || undefined)
            pagination.reset()
          }}
        />
        <CustomTable<ItemWiseSalesRow>
          columns={[
            { key: "itemNameRaw", label: "Item", sortable: true },
            { key: "totalQty", label: "Qty Sold", sortable: true },
            { key: "totalAmount", label: "Amount", sortable: true },
            { key: "returnQty", label: "Return Qty" },
            { key: "returnAmount", label: "Return Amount" },
          ]}
          data={data?.data ?? []}
          loading={isLoading}
          rowKey="itemNameRaw"
          itemId="itemNameRaw"
          totalItems={data?.meta.total ?? 0}
          emptyText="No sales data — import a Sales Register file first."
          onRowsPerPageChange={pagination.setPageSize}
          cursorPagination={{
            page: pagination.page,
            totalPages: data?.meta.totalPages,
            hasNextPage: data?.meta.hasNextPage ?? false,
            hasPreviousPage: pagination.page > 1,
            onNext: () => pagination.goNext(data?.meta.nextCursor ?? null),
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
