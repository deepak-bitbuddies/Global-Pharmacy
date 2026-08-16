"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"

import { CustomPageHeader, CustomSkeleton, CustomTabs } from "@/components/ui"
import { useAuthStore } from "@/providers"
import { ReportFilterPanel } from "../components/filters"
import type { ReportFilters } from "../types"

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
  const t = useTranslations("Dashboard")
  const [filters, setFilters] = useState<ReportFilters>({})
  // A branch_user only ever has one branch — a branch picker offering that same single option
  // back to them is pointless, so it's admin-only here (same reasoning as hiding the "Branch
  // Wise Sales" chart in OverviewTab).
  const role = useAuthStore((state) => state.user?.role)

  return (
    <div className="space-y-4">
      <CustomPageHeader title={t("title")} description={t("description")} />
      <ReportFilterPanel filters={filters} onFiltersChange={setFilters} show={{ branch: role !== "branch_user", dateRange: true }} />

      <CustomTabs
        items={[
          { key: "overview", label: t("tabs.overview"), content: <OverviewTab filters={filters} /> },
          { key: "sales", label: t("tabs.sales"), content: <SalesTab filters={filters} /> },
          { key: "purchase", label: t("tabs.purchase"), content: <PurchaseTab filters={filters} /> },
          { key: "stock", label: t("tabs.stock"), content: <StockTab filters={filters} /> },
          { key: "finance", label: t("tabs.finance"), content: <FinanceTab filters={filters} /> },
        ]}
      />
    </div>
  )
}
