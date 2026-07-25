"use client"

import type { ReactNode } from "react"
import {
  ArrowsCounterClockwiseIcon,
  ChartLineUpIcon,
  ClockCountdownIcon,
  CreditCardIcon,
  CurrencyInrIcon,
  HandCoinsIcon,
  PackageIcon,
  ScalesIcon,
  ShoppingCartIcon,
  WalletIcon,
} from "@phosphor-icons/react"

import { TremorAreaChart, TremorBarChart, TremorCard, TremorStatCard, TremorTone } from "@/components/ui/tremor"
import { formatCurrency } from "@/utils/formatting"
import { useBranchSales, useDailyCollection, useDashboardSummary } from "../../hooks/use-reports"
import type { ReportFilters } from "../../types"

function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
}

function ChartPanel({
  title,
  icon: Icon,
  className,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  className?: string
  children: ReactNode
}) {
  return (
    <TremorCard className={`space-y-3 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      {children}
    </TremorCard>
  )
}

export function OverviewTab({ filters }: { filters: ReportFilters }) {
  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary(filters)
  const { data: dailyCollection, isLoading: isCollectionLoading } = useDailyCollection(filters)
  const { data: branchSales, isLoading: isBranchSalesLoading } = useBranchSales(filters)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <SectionTitle>Business Overview</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TremorStatCard label="Total Sales" value={formatCurrency(summary?.totalSales ?? 0)} icon={CurrencyInrIcon} tone={TremorTone.primary} loading={isSummaryLoading} />
          <TremorStatCard label="Total Purchase" value={formatCurrency(summary?.totalPurchase ?? 0)} icon={ShoppingCartIcon} tone={TremorTone.accent} loading={isSummaryLoading} />
          <TremorStatCard label="Stock Value" value={formatCurrency(summary?.totalStockValue ?? 0)} icon={PackageIcon} tone={TremorTone.primary} loading={isSummaryLoading} />
          <TremorStatCard label="Collection" value={formatCurrency(summary?.totalCollection ?? 0)} icon={WalletIcon} tone={TremorTone.success} loading={isSummaryLoading} />
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle>Finance &amp; Alerts</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TremorStatCard label="Cash in Hand" value={formatCurrency(summary?.cashInHand ?? 0)} icon={HandCoinsIcon} tone={TremorTone.primary} loading={isSummaryLoading} />
          <TremorStatCard label="Outstanding" value={formatCurrency(summary?.outstanding ?? 0)} icon={CreditCardIcon} tone={TremorTone.warning} loading={isSummaryLoading} />
          <TremorStatCard label="Near-Expiry Batches" value={summary?.nearExpiryCount ?? 0} icon={ClockCountdownIcon} tone={TremorTone.warning} loading={isSummaryLoading} />
          <TremorStatCard label="Non-Moving Items" value={summary?.nonMovingCount ?? 0} icon={ArrowsCounterClockwiseIcon} tone={TremorTone.danger} loading={isSummaryLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartPanel title="Daily Collection Trend" icon={ChartLineUpIcon} className="lg:col-span-2">
          <TremorAreaChart
            data={(dailyCollection ?? []).map((row) => ({ date: row.date, billValue: row.billValue }))}
            index="date"
            category="billValue"
            valueFormatter={(value) => formatCurrency(value)}
            isLoading={isCollectionLoading}
          />
        </ChartPanel>

        <ChartPanel title="Sales vs Purchase" icon={ScalesIcon}>
          <TremorBarChart
            data={[
              { label: "Sales", value: summary?.totalSales ?? 0 },
              { label: "Purchase", value: summary?.totalPurchase ?? 0 },
            ]}
            index="label"
            categories={["value"]}
            valueFormatter={(value) => formatCurrency(value)}
            isLoading={isSummaryLoading}
          />
        </ChartPanel>
      </div>

      <ChartPanel title="Branch-wise Sales" icon={PackageIcon}>
        <TremorBarChart
          data={(branchSales ?? []).map((row) => ({ branch: row.branchName, amount: row.totalAmount }))}
          index="branch"
          categories={["amount"]}
          valueFormatter={(value) => formatCurrency(value)}
          isLoading={isBranchSalesLoading}
          height={260}
        />
      </ChartPanel>
    </div>
  )
}
