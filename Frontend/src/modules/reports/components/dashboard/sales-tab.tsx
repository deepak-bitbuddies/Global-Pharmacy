"use client"

import { useMemo, useState } from "react"
import { ChartLineUpIcon } from "@phosphor-icons/react"

import { CustomSearchFilter, CustomTable, TremorBarList, TremorCard } from "@/components/ui"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { useItemWiseSales } from "../../hooks/use-reports"
import type { ItemWiseSalesRow, ReportFilters } from "../../types"

export function SalesTab({ filters }: { filters: ReportFilters }) {
  const [search, setSearch] = useState<string | undefined>(undefined)
  const combinedFilters = useMemo<ReportFilters>(() => ({ ...filters, item: search || undefined }), [filters, search])
  const { data, isLoading } = useItemWiseSales(combinedFilters)

  const topItems = useMemo(() => (data ?? []).slice(0, 10).map((row) => ({ name: row.itemNameRaw, value: row.totalAmount })), [data])

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
        <CustomSearchFilter placeholder="Search item..." value={search} onChange={(value) => setSearch(value || undefined)} />
        <CustomTable<ItemWiseSalesRow>
          columns={[
            { key: "itemNameRaw", label: "Item", sortable: true },
            { key: "totalQty", label: "Qty Sold", sortable: true },
            { key: "totalAmount", label: "Amount", sortable: true },
            { key: "returnQty", label: "Return Qty" },
            { key: "returnAmount", label: "Return Amount" },
          ]}
          data={data ?? []}
          loading={isLoading}
          rowKey="itemNameRaw"
          itemId="itemNameRaw"
          totalItems={data?.length ?? 0}
          emptyText="No sales data — import a Sales Register file first."
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
