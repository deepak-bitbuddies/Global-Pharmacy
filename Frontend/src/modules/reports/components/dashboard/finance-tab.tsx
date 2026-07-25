"use client"

import { useMemo } from "react"
import { CreditCardIcon, HandCoinsIcon, ScalesIcon } from "@phosphor-icons/react"

import { CustomTable } from "@/components/ui"
import { TremorBarList, TremorCard } from "@/components/ui/tremor"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { useCashInHand, useGrossProfit, useOutstanding } from "../../hooks/use-reports"
import type { GrossProfitRow, ReportFilters } from "../../types"

export function FinanceTab({ filters }: { filters: ReportFilters }) {
  const { data: cashInHand, isLoading: isCashLoading } = useCashInHand(filters)
  const { data: outstanding, isLoading: isOutstandingLoading } = useOutstanding(filters)

  const pagination = useCursorPagination()
  // Independent of the table's own pagination — page 1 of the same
  // amount-DESC sort is already the true top 10, no separate endpoint needed.
  const { data: topGpData } = useGrossProfit(filters, { pageSize: 10 })
  const { data: grossProfit, isLoading: isGpLoading } = useGrossProfit(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

  const cashItems = useMemo(() => (cashInHand ?? []).map((row) => ({ name: row.branchName, value: row.cashTotal })), [cashInHand])
  const outstandingItems = useMemo(() => (outstanding ?? []).map((row) => ({ name: row.branchName, value: row.outstandingTotal })), [outstanding])
  const topGp = useMemo(
    () => (topGpData?.data ?? []).filter((row) => row.estimatedGp !== null).map((row) => ({ name: row.itemName, value: row.estimatedGp ?? 0 })),
    [topGpData],
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TremorCard className="space-y-3">
          <div className="flex items-center gap-2">
            <HandCoinsIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Cash in Hand by Branch</p>
          </div>
          {isCashLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : <TremorBarList data={cashItems} valueFormatter={(value) => formatCurrency(value)} />}
        </TremorCard>

        <TremorCard className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCardIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Outstanding by Branch</p>
          </div>
          {isOutstandingLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (
            <TremorBarList data={outstandingItems} valueFormatter={(value) => formatCurrency(value)} />
          )}
        </TremorCard>
      </div>

      <TremorCard className="space-y-3">
        <div className="flex items-center gap-2">
          <ScalesIcon className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Top Items by Gross Profit</p>
        </div>
        <TremorBarList data={topGp} valueFormatter={(value) => formatCurrency(value)} />
      </TremorCard>

      <CustomTable<GrossProfitRow>
        columns={[
          { key: "itemName", label: "Item", sortable: true },
          { key: "salesAmount", label: "Sales Amount", sortable: true },
          { key: "salesQty", label: "Qty", sortable: true },
          { key: "avgCostPrice", label: "Avg Cost" },
          { key: "estimatedGp", label: "Est. GP", sortable: true },
          { key: "estimatedGpPct", label: "GP %" },
        ]}
        data={grossProfit?.data ?? []}
        loading={isGpLoading}
        rowKey="itemName"
        itemId="itemName"
        totalItems={grossProfit?.meta.total ?? 0}
        emptyText="No gross profit data — import Sales and Stock files first."
        onRowsPerPageChange={pagination.setPageSize}
        cursorPagination={{
          page: pagination.page,
          totalPages: grossProfit?.meta.totalPages,
          hasNextPage: grossProfit?.meta.hasNextPage ?? false,
          hasPreviousPage: pagination.page > 1,
          onNext: () => pagination.goNext(grossProfit?.meta.nextCursor ?? null),
          onPrevious: pagination.goPrevious,
        }}
        renderCustomCell={(row, key) => {
          if (key === "salesAmount" || key === "estimatedGp" || key === "avgCostPrice") return row[key] === null ? "-" : formatCurrency(row[key] as number)
          if (key === "salesQty") return formatNumber(row[key])
          if (key === "estimatedGpPct") return row[key] === null ? "-" : `${(row[key] as number).toFixed(1)}%`
          return row[key]
        }}
      />
    </div>
  )
}
