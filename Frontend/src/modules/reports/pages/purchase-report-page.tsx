"use client"

import { useState } from "react"

import { CustomFilterBar, CustomPageHeader, CustomSearchFilter, CustomSelectFilter, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { useBranches, usePurchaseDetail } from "../hooks/use-reports"
import type { Branch, PurchaseDetailRow, ReportFilters } from "../types"

export function PurchaseReportPage() {
  const [filters, setFilters] = useState<ReportFilters>({})
  const pagination = useCursorPagination()
  const { data, isLoading } = usePurchaseDetail(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })
  const { data: branches } = useBranches()

  const selectedBranch = branches?.find((branch) => branch.id === filters.branchId)

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  return (
    <div className="space-y-4">
      <CustomPageHeader title="Purchase Report" description="Item-wise purchase detail, including the scheme % implied by free quantity received on each line." />

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

      <CustomTable<PurchaseDetailRow>
        columns={[
          { key: "itemNameRaw", label: "Item", sortable: true },
          { key: "supplierGroup", label: "Supplier", sortable: true },
          { key: "qty", label: "Qty" },
          { key: "freeQty", label: "Free Qty" },
          { key: "rate", label: "Rate" },
          { key: "amount", label: "Amount", sortable: true },
          { key: "schemePct", label: "Scheme %" },
        ]}
        data={data?.data ?? []}
        loading={isLoading}
        rowKey="id"
        itemId="id"
        totalItems={data?.meta?.total ?? 0}
        emptyText="No purchase data — import a Purchase Register file first."
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
          if (key === "qty" || key === "freeQty") return row[key] === null ? "-" : formatNumber(row[key] as number)
          if (key === "schemePct") return row.schemePct === null ? "-" : `${row.schemePct.toFixed(2)}%`
          return row[key]
        }}
      />
    </div>
  )
}
