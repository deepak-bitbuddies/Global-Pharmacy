"use client"

import { useMemo, useState } from "react"

import { CustomFilterBar, CustomPageHeader, CustomSearchFilter, CustomSelectFilter, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { useBranches, useCompanies, useStockReport } from "../hooks/use-reports"
import type { Branch, ReportFilters, StockRow } from "../types"

type CompanyOption = { id: string; label: string }

export function StockReportPage() {
  const [filters, setFilters] = useState<ReportFilters>({})
  const pagination = useCursorPagination()
  const { data, isLoading } = useStockReport(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })
  const { data: companies } = useCompanies()
  const { data: branches } = useBranches()

  const companyOptions = useMemo<CompanyOption[]>(() => (companies ?? []).map((company) => ({ id: company, label: company })), [companies])
  const selectedCompany = companyOptions.find((option) => option.id === filters.company)
  const selectedBranch = branches?.find((branch) => branch.id === filters.branchId)

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  return (
    <div className="space-y-4">
      <CustomPageHeader title="Stock Report" description="Current stock by batch, across branches." />

      <CustomSearchFilter
        placeholder="Search item..."
        value={filters.item}
        onChange={(value) => updateFilters((prev) => ({ ...prev, item: value || undefined }))}
      />
      <CustomFilterBar>
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
        <CustomSelectFilter<CompanyOption>
          ariaLabel="Company"
          data={companyOptions}
          value={selectedCompany}
          onChange={(value) => {
            const option = Array.isArray(value) ? value[0] : value
            updateFilters((prev) => ({ ...prev, company: option?.id }))
          }}
          displayKey="label"
          idKey="id"
          placeholder="All companies"
        />
      </CustomFilterBar>

      <CustomTable<StockRow>
        columns={[
          { key: "itemName", label: "Item", sortable: true },
          { key: "currentStock", label: "Stock", sortable: true },
          { key: "unit", label: "Unit" },
          { key: "value", label: "Value", sortable: true },
          { key: "expDate", label: "Expiry", sortable: true },
          { key: "company", label: "Company" },
          { key: "batch", label: "Batch" },
        ]}
        data={data?.data ?? []}
        loading={isLoading}
        rowKey="id"
        itemId="id"
        totalItems={data?.meta?.total ?? 0}
        emptyText="No stock data — import a Stock Register file first."
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
          if (key === "value") return row.value === null ? "-" : formatCurrency(row.value)
          if (key === "currentStock") return formatNumber(row.currentStock)
          return row[key] ?? "-"
        }}
      />
    </div>
  )
}
