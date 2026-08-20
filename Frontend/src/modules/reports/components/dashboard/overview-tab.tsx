"use client"

import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  ArrowsCounterClockwiseIcon,
  ChartLineUpIcon,
  ClockCountdownIcon,
  CurrencyInrIcon,
  PackageIcon,
  ScalesIcon,
  ShoppingCartIcon,
  WalletIcon,
} from "@phosphor-icons/react"

import { CustomInfoTooltip } from "@/components/ui"
import { TremorAreaChart, TremorBarChart, TremorCard, TremorStatCard, TremorTone } from "@/components/ui/tremor"
import { useAuthStore } from "@/providers"
import { formatCurrency } from "@/utils/formatting"
import { useBranchSales, useDailyCollection, useDashboardSummary } from "../../hooks/use-reports"
import { buildReportUrl } from "../../utils/report-links"
import { SectionHeading } from "./section-heading"
import { SalesCollectionMode, type ReportFilters } from "../../types"

function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
}

function ChartPanel({
  title,
  description,
  detailsHref,
  icon: Icon,
  className,
  children,
}: {
  title: string
  description?: string
  detailsHref?: string
  icon: React.ComponentType<{ className?: string }>
  className?: string
  children: ReactNode
}) {
  const tCommon = useTranslations("Common")
  return (
    <TremorCard className={`space-y-3 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <CustomInfoTooltip content={description} />}
        {detailsHref && (
          <Link href={detailsHref} className="ml-auto shrink-0 text-xs font-medium text-primary hover:underline">
            {tCommon("viewDetails")} →
          </Link>
        )}
      </div>
      {children}
    </TremorCard>
  )
}

export function OverviewTab({ filters }: { filters: ReportFilters }) {
  const t = useTranslations("Dashboard.overview")
  const tTabs = useTranslations("Dashboard.tabs")
  const router = useRouter()
  // A branch_user only ever has one branch, so a "Branch Wise Sales" breakdown would just be a
  // redundant single-bar chart repeating totalSales above — it's only meaningful for admins.
  const role = useAuthStore((state) => state.user?.role)
  const isBranchScoped = role === "branch_user"
  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary(filters)
  const { data: dailyCollection, isLoading: isCollectionLoading } = useDailyCollection(filters)
  const { data: branchSales, isLoading: isBranchSalesLoading } = useBranchSales(filters)

  const dateRange = { dateFrom: filters.dateFrom, dateTo: filters.dateTo }

  return (
    <section id="overview" className="scroll-mt-20 space-y-4">
      <SectionHeading icon={CurrencyInrIcon}>{tTabs("overview")}</SectionHeading>

      <div className="space-y-2">
        <SectionTitle>{t("businessOverview")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <TremorStatCard
            label={t("totalSales")}
            value={formatCurrency(summary?.totalSales ?? 0)}
            description={t("totalSalesDesc")}
            icon={CurrencyInrIcon}
            tone={TremorTone.primary}
            loading={isSummaryLoading}
            detailsHref={buildReportUrl("/reports/sales", { branchId: filters.branchId, ...dateRange })}
          />
          <TremorStatCard
            label={t("totalPurchase")}
            value={formatCurrency(summary?.totalPurchase ?? 0)}
            description={t("totalPurchaseDesc")}
            icon={ShoppingCartIcon}
            tone={TremorTone.accent}
            loading={isSummaryLoading}
            detailsHref={buildReportUrl("/reports/purchase", { branchId: filters.branchId, ...dateRange })}
          />
          <TremorStatCard
            label={t("stockValue")}
            value={formatCurrency(summary?.totalStockValue ?? 0)}
            description={t("stockValueDesc")}
            icon={PackageIcon}
            tone={TremorTone.primary}
            loading={isSummaryLoading}
            detailsHref={buildReportUrl("/reports/stock", { branchId: filters.branchId })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle>{t("collection")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <TremorStatCard
            label={t("cashCollection")}
            value={formatCurrency(summary?.cashCollection ?? 0)}
            description={t("cashCollectionDesc")}
            icon={WalletIcon}
            tone={TremorTone.success}
            loading={isSummaryLoading}
            detailsHref={buildReportUrl("/reports/sales", { branchId: filters.branchId, ...dateRange, collectionMode: [SalesCollectionMode.Cash] })}
          />
          <TremorStatCard
            label={t("paytmOnlineCollection")}
            value={formatCurrency(summary?.paytmOnlineCollection ?? 0)}
            description={t("paytmOnlineCollectionDesc")}
            icon={WalletIcon}
            tone={TremorTone.success}
            loading={isSummaryLoading}
            detailsHref={buildReportUrl("/reports/sales", {
              branchId: filters.branchId,
              ...dateRange,
              collectionMode: [SalesCollectionMode.PaytmOnline],
            })}
          />
          <TremorStatCard
            label={t("creditDueCollection")}
            value={formatCurrency(summary?.creditDueCollection ?? 0)}
            description={t("creditDueCollectionDesc")}
            icon={WalletIcon}
            tone={TremorTone.warning}
            loading={isSummaryLoading}
            detailsHref={buildReportUrl("/reports/sales", {
              branchId: filters.branchId,
              ...dateRange,
              collectionMode: [SalesCollectionMode.CreditDue],
            })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <SectionTitle>{t("financeAlerts")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <TremorStatCard
            label={t("nearExpiryBatches")}
            value={summary?.nearExpiryCount ?? 0}
            description={t("nearExpiryBatchesDesc")}
            icon={ClockCountdownIcon}
            tone={TremorTone.warning}
            loading={isSummaryLoading}
            detailsHref={buildReportUrl("/reports/stock", { branchId: filters.branchId, expiryTier: "lte30" })}
          />
          <TremorStatCard
            label={t("nonMovingItems")}
            value={summary?.nonMovingCount ?? 0}
            description={t("nonMovingItemsDesc")}
            icon={ArrowsCounterClockwiseIcon}
            tone={TremorTone.danger}
            loading={isSummaryLoading}
            detailsHref={buildReportUrl("/reports/non-moving", { branchId: filters.branchId })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartPanel
          title={t("dailyCollectionTrend")}
          description={t("dailyCollectionTrendDesc")}
          detailsHref={buildReportUrl("/reports/day-wise-sales", { branchId: filters.branchId, ...dateRange })}
          icon={ChartLineUpIcon}
          className="lg:col-span-2"
        >
          <TremorAreaChart
            data={(dailyCollection ?? []).map((row) => ({ date: row.date, billValue: row.billValue }))}
            index="date"
            category="billValue"
            valueFormatter={(value) => formatCurrency(value)}
            isLoading={isCollectionLoading}
          />
        </ChartPanel>

        <ChartPanel title={t("salesVsPurchase")} description={t("salesVsPurchaseDesc")} icon={ScalesIcon}>
          <TremorBarChart
            data={[
              { label: t("salesLabel"), value: summary?.totalSales ?? 0, type: "sales" },
              { label: t("purchaseLabel"), value: summary?.totalPurchase ?? 0, type: "purchase" },
            ]}
            index="label"
            categories={["value"]}
            valueFormatter={(value) => formatCurrency(value)}
            isLoading={isSummaryLoading}
            onBarClick={(point) =>
              router.push(buildReportUrl(point.type === "purchase" ? "/reports/purchase" : "/reports/sales", { branchId: filters.branchId, ...dateRange }))
            }
          />
        </ChartPanel>
      </div>

      {!isBranchScoped && (
        <ChartPanel
          title={t("branchWiseSales")}
          description={t("branchWiseSalesDesc")}
          detailsHref={buildReportUrl("/reports/sales", dateRange)}
          icon={PackageIcon}
        >
          <TremorBarChart
            data={(branchSales ?? []).map((row) => ({ branch: row.branchName, amount: row.totalAmount, branchId: row.branchId }))}
            index="branch"
            categories={["amount"]}
            valueFormatter={(value) => formatCurrency(value)}
            isLoading={isBranchSalesLoading}
            height={260}
            onBarClick={(point) => router.push(buildReportUrl("/reports/sales", { branchId: [point.branchId as string], ...dateRange }))}
          />
        </ChartPanel>
      )}
    </section>
  )
}
