"use client"

import { useState } from "react"

import { CustomPageHeader, CustomSearchFilter, CustomTable } from "@/components/ui"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { useItemWiseSales } from "../hooks/use-reports"
import type { ItemWiseSalesRow, ReportFilters } from "../types"

export function SalesReportPage() {
  const [filters, setFilters] = useState<ReportFilters>({})
  const { data, isLoading } = useItemWiseSales(filters)

  return (
    <div className="space-y-4">
      <CustomPageHeader
        title="Item-wise Sales"
        description="Sales by item for the imported period. The Sale Register is period-aggregated by Marg, not per-day — use the dashboard's Daily Collection chart for the day-by-day trend."
      />

      {/* <CustomFilterBar> */}
      <CustomSearchFilter
        placeholder="Search item..."
        value={filters.item}
        onChange={(value) => setFilters((prev) => ({ ...prev, item: value || undefined }))}
      />
      {/* </CustomFilterBar> */}

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
  )
}
