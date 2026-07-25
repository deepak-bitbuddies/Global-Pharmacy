"use client"

import { useState } from "react"

import { CustomFilterBar, CustomPageHeader, CustomSearchFilter, CustomSelectFilter, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { useBranches, useItemWiseSales } from "../hooks/use-reports"
import type { Branch, ItemWiseSalesRow, ReportFilters } from "../types"

export function SalesReportPage() {
  const [filters, setFilters] = useState<ReportFilters>({})
  const pagination = useCursorPagination()
  const { data, isLoading } = useItemWiseSales(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })
  const { data: branches } = useBranches()

  const selectedBranch = branches?.find((branch) => branch.id === filters.branchId)

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  return (
    <div className="space-y-4">
      <CustomPageHeader
        title="Item-wise Sales"
        description="Sales by item for the imported period. The Sale Register is period-aggregated by Marg, not per-day — use the dashboard's Daily Collection chart for the day-by-day trend."
      />

      <CustomFilterBar>
        <CustomSearchFilter
          placeholder="Search item..."
          value={filters.item}
          onChange={(value) => updateFilters((prev) => ({ ...prev, item: value || undefined }))}
        />
        <CustomSelectFilter<Branch>
          ariaLabel="Branch"
          data={branches ?? []}
          value={selectedBranch}
          onChange={(value) => {
            const branch = Array.isArray(value) ? value[0] : value
            updateFilters((prev) => ({ ...prev, branchId: branch?.id }))
          }}
          displayKey="name"
          idKey="id"
          placeholder="All branches"
        />
      </CustomFilterBar>

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
        totalItems={data?.meta?.total ?? 0}
        emptyText="No sales data — import a Sales Register file first."
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
  )
}
