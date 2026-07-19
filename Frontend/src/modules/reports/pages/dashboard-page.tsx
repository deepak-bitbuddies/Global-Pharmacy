"use client"

import { useState } from "react"

import { CustomDateRangeFilter, CustomFilterBar, CustomPageHeader, CustomSelectFilter, CustomTabs } from "@/components/ui"
import { FinanceTab } from "../components/dashboard/finance-tab"
import { OverviewTab } from "../components/dashboard/overview-tab"
import { PurchaseTab } from "../components/dashboard/purchase-tab"
import { SalesTab } from "../components/dashboard/sales-tab"
import { StockTab } from "../components/dashboard/stock-tab"
import { useBranches } from "../hooks/use-reports"
import type { Branch, ReportFilters } from "../types"

export function ReportsDashboardPage() {
  const [filters, setFilters] = useState<ReportFilters>({})
  const { data: branches } = useBranches()

  const selectedBranch = branches?.find((branch) => branch.id === filters.branchId)

  return (
    <div className="space-y-4">
      <CustomPageHeader title="GPRS Dashboard" description="Consolidated view across all pharmacies — sales, purchase, stock, and finance." />

      <CustomFilterBar>
        <CustomSelectFilter<Branch>
          label="Branch"
          data={branches ?? []}
          value={selectedBranch}
          onChange={(value) => {
            const branch = Array.isArray(value) ? value[0] : value
            setFilters((prev) => ({ ...prev, branchId: branch?.id }))
          }}
          displayKey="name"
          idKey="id"
          placeholder="All branches"
        />
        <CustomDateRangeFilter
          className="flex flex-col space-y-1"
          label="Date range"
          value={filters.dateFrom && filters.dateTo ? { start: filters.dateFrom, end: filters.dateTo } : undefined}
          onChange={(range) => setFilters((prev) => ({ ...prev, dateFrom: range?.start, dateTo: range?.end }))}
        />
      </CustomFilterBar>

      <CustomTabs
        items={[
          { key: "overview", label: "Overview", content: <OverviewTab filters={filters} /> },
          { key: "sales", label: "Sales", content: <SalesTab filters={filters} /> },
          { key: "purchase", label: "Purchase", content: <PurchaseTab filters={filters} /> },
          { key: "stock", label: "Stock", content: <StockTab filters={filters} /> },
          { key: "finance", label: "Finance", content: <FinanceTab filters={filters} /> },
        ]}
      />
    </div>
  )
}
