"use client"

import { useMemo } from "react"
import { ShoppingCartIcon } from "@phosphor-icons/react"

import { CustomTable, TremorBarList, TremorCard } from "@/components/ui"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { usePurchaseSummary } from "../../hooks/use-reports"
import type { PurchaseSummaryRow, ReportFilters } from "../../types"

export function PurchaseTab({ filters }: { filters: ReportFilters }) {
  const { data, isLoading } = usePurchaseSummary(filters)

  const topSuppliers = useMemo(() => (data ?? []).slice(0, 10).map((row) => ({ name: row.supplierGroup, value: row.totalAmount })), [data])

  return (
    <div className="space-y-4">
      <TremorCard className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCartIcon className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Top Suppliers by Purchase</p>
        </div>
        <TremorBarList data={topSuppliers} valueFormatter={(value) => formatCurrency(value)} />
      </TremorCard>

      <CustomTable<PurchaseSummaryRow>
        columns={[
          { key: "supplierGroup", label: "Supplier", sortable: true },
          { key: "totalAmount", label: "Amount", sortable: true },
          { key: "totalQty", label: "Qty", sortable: true },
          { key: "totalFreeQty", label: "Free Qty" },
        ]}
        data={data ?? []}
        loading={isLoading}
        rowKey="supplierGroup"
        itemId="supplierGroup"
        totalItems={data?.length ?? 0}
        emptyText="No purchase data — import a Purchase Register file first."
        renderCustomCell={(row, key) => {
          if (key === "totalAmount") return formatCurrency(row[key])
          if (key === "totalQty" || key === "totalFreeQty") return formatNumber(row[key])
          return row[key]
        }}
      />
    </div>
  )
}
