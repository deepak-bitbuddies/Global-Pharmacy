"use client"

import { useMemo } from "react"
import { ShoppingCartIcon } from "@phosphor-icons/react"

import { CustomTable } from "@/components/ui"
import { TremorBarList, TremorCard } from "@/components/ui/tremor"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { usePurchaseSummary } from "../../hooks/use-reports"
import type { PurchaseSummaryRow, ReportFilters } from "../../types"

export function PurchaseTab({ filters }: { filters: ReportFilters }) {
  const pagination = useCursorPagination()

  // Independent of the table's own pagination — page 1 of the same
  // amount-DESC sort is already the true top 10, no separate endpoint needed.
  const { data: topData } = usePurchaseSummary(filters, { pageSize: 10 })
  const { data, isLoading } = usePurchaseSummary(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

  const topSuppliers = useMemo(() => (topData?.data ?? []).map((row) => ({ name: row.supplierGroup, value: row.totalAmount })), [topData])

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
        data={data?.data ?? []}
        loading={isLoading}
        rowKey="supplierGroup"
        itemId="supplierGroup"
        totalItems={data?.meta.total ?? 0}
        emptyText="No purchase data — import a Purchase Register file first."
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
          if (key === "totalAmount") return formatCurrency(row[key])
          if (key === "totalQty" || key === "totalFreeQty") return formatNumber(row[key])
          return row[key]
        }}
      />
    </div>
  )
}
