"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

import { CustomDateRangeFilter, CustomFilterBar, CustomPageHeader, CustomSelectFilter, CustomSkeleton, CustomTabs } from "@/components/ui"
import { useBranches } from "../hooks/use-reports"
import type { Branch, ReportFilters } from "../types"

// Dynamically imported: each tab (and the recharts-based Tremor charts it
// pulls in) is only fetched when the user actually opens that tab, instead
// of all 5 tabs' code loading upfront on first visit to the dashboard.
const tabLoading = <CustomSkeleton className="h-96 w-full" />
const OverviewTab = dynamic(() => import("../components/dashboard/overview-tab").then((m) => m.OverviewTab), { loading: () => tabLoading })
const SalesTab = dynamic(() => import("../components/dashboard/sales-tab").then((m) => m.SalesTab), { loading: () => tabLoading })
const PurchaseTab = dynamic(() => import("../components/dashboard/purchase-tab").then((m) => m.PurchaseTab), { loading: () => tabLoading })
const StockTab = dynamic(() => import("../components/dashboard/stock-tab").then((m) => m.StockTab), { loading: () => tabLoading })
const FinanceTab = dynamic(() => import("../components/dashboard/finance-tab").then((m) => m.FinanceTab), { loading: () => tabLoading })

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
