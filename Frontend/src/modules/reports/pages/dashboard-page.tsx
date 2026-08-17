"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"

import { CustomPageHeader, CustomSkeleton } from "@/components/ui"
import { useAuthStore } from "@/providers"
import { ReportFilterPanel } from "../components/filters"
import { DashboardSectionNav } from "../components/dashboard/dashboard-section-nav"
import type { ReportFilters } from "../types"

// Dynamically imported purely for bundle-splitting — each section's (Tremor/Recharts-heavy)
// code is a separate chunk fetched on page load rather than bloating the main bundle, even
// though all 5 sections now render together on one page instead of behind tabs.
const sectionLoading = <CustomSkeleton className="h-96 w-full" />
const OverviewTab = dynamic(() => import("../components/dashboard/overview-tab").then((m) => m.OverviewTab), { loading: () => sectionLoading })
const SalesTab = dynamic(() => import("../components/dashboard/sales-tab").then((m) => m.SalesTab), { loading: () => sectionLoading })
const PurchaseTab = dynamic(() => import("../components/dashboard/purchase-tab").then((m) => m.PurchaseTab), { loading: () => sectionLoading })
const StockTab = dynamic(() => import("../components/dashboard/stock-tab").then((m) => m.StockTab), { loading: () => sectionLoading })
const FinanceTab = dynamic(() => import("../components/dashboard/finance-tab").then((m) => m.FinanceTab), { loading: () => sectionLoading })

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

      <DashboardSectionNav
        labels={{
          overview: t("tabs.overview"),
          sales: t("tabs.sales"),
          purchase: t("tabs.purchase"),
          stock: t("tabs.stock"),
          finance: t("tabs.finance"),
        }}
      />

      <div className="space-y-8">
        <OverviewTab filters={filters} />
        <SalesTab filters={filters} />
        <PurchaseTab filters={filters} />
        <StockTab filters={filters} />
        <FinanceTab filters={filters} />
      </div>
    </div>
  )
}
