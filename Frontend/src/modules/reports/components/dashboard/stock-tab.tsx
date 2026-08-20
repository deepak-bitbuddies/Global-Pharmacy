"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowsCounterClockwiseIcon,
  BuildingsIcon,
  ClockCountdownIcon,
  GaugeIcon,
  ListBulletsIcon,
  PackageIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { CustomInfoTooltip } from "@/components/ui"
import { TremorBarChart, TremorBarList, TremorCard, TremorDonutChart, TremorStatCard, TremorTone } from "@/components/ui/tremor"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import {
  useExpiryReport,
  useNonMovingItems,
  useStockSummary,
  useStockValueByCompany,
  useTopStockByValue,
  useZeroOrderAlerts,
} from "../../hooks/use-reports"
import { buildReportUrl } from "../../utils/report-links"
import { SectionHeading } from "./section-heading"
import type { ReportFilters } from "../../types"

// Fixed status/severity colors — deliberately hardcoded, not the app theme's
// --danger/--warning/--success tokens, so risk color-coding on these charts
// stays the standard red/orange/amber/green regardless of app theming. Same
// hex in light and dark (status color is never themed).
const STATUS_CRITICAL = "#d03b3b"
const STATUS_SERIOUS = "#ec835a"
const STATUS_WARNING = "#fab219"
const STATUS_GOOD = "#0ca30c"
const STATUS_NEUTRAL = "#898781"

function addDaysIso(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

// Deliberately not translated: these labels are also used as matching keys against the
// backend's fixed English bucket strings (getStockSummary's SQL CASE) — translating them
// would break that lookup. Chart axis labels stay English regardless of app language.
// `filter` drives each bucket's "click a bar to drill into just this slice" destination — the
// `expiryTier` filter's own tiers (30/60/90/gt90 day boundaries) don't line up with these chart
// buckets (0/30/90/180), so the two middle buckets use a custom expiry-date range instead.
const EXPIRY_BUCKETS = [
  { label: "Expired", maxDays: 0, color: STATUS_CRITICAL, filter: { expiryTier: "expired" as const } },
  { label: "≤ 30 days", maxDays: 30, color: STATUS_SERIOUS, filter: { expiryTier: "lte30" as const } },
  {
    label: "31–90 days",
    maxDays: 90,
    color: STATUS_WARNING,
    filter: { expiryTier: "custom" as const, expiryDateFrom: addDaysIso(31), expiryDateTo: addDaysIso(90) },
  },
  {
    label: "91–180 days",
    maxDays: 180,
    color: STATUS_GOOD,
    filter: { expiryTier: "custom" as const, expiryDateFrom: addDaysIso(91), expiryDateTo: addDaysIso(180) },
  },
]

function expiryBucketIndex(daysToExpiry: number): number {
  return EXPIRY_BUCKETS.findIndex((bucket) => daysToExpiry <= bucket.maxDays)
}

// Must match the bucket labels the backend's getStockSummary computes via SQL CASE.
const STOCK_LEVEL_BUCKETS = [
  { label: "Zero Stock", color: STATUS_CRITICAL, filter: { stockTo: 0 } },
  { label: "1–5 units", color: STATUS_SERIOUS, filter: { stockFrom: 1, stockTo: 5 } },
  { label: "6–20 units", color: STATUS_WARNING, filter: { stockFrom: 6, stockTo: 20 } },
  { label: "21–50 units", color: STATUS_NEUTRAL, filter: { stockFrom: 21, stockTo: 50 } },
  { label: "50+ units", color: STATUS_GOOD, filter: { stockFrom: 51 } },
]

function ChartCard({
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
  children: React.ReactNode
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

export function StockTab({ filters }: { filters: ReportFilters }) {
  const t = useTranslations("Dashboard.stock")
  const tCommon = useTranslations("Common")
  const tTabs = useTranslations("Dashboard.tabs")
  const router = useRouter()

  const { data: stockSummary, isLoading: isSummaryLoading } = useStockSummary(filters)
  const { data: stockByCompanyData, isLoading: isByCompanyLoading } = useStockValueByCompany(filters)
  const { data: topByValueData, isLoading: isTopByValueLoading } = useTopStockByValue(filters)
  const { data: zeroOrder, isLoading: isZeroOrderLoading } = useZeroOrderAlerts(filters)
  const { data: expiry, isLoading: isExpiryLoading } = useExpiryReport({ ...filters, withinDays: 180 })
  const { data: nonMoving, isLoading: isNonMovingLoading } = useNonMovingItems(filters)

  // KPI headline numbers — computed server-side (`useStockSummary`) since the
  // detail table is now paginated and can no longer be summed client-side.
  const expiringSoonValue = useMemo(
    () => (expiry ?? []).filter((row) => row.daysToExpiry <= 30).reduce((sum, row) => sum + (row.value ?? 0), 0),
    [expiry],
  )
  const nonMovingValue = useMemo(() => (nonMoving ?? []).reduce((sum, row) => sum + (row.value ?? 0), 0), [nonMoving])
  const isKpiLoading = isSummaryLoading || isExpiryLoading || isNonMovingLoading || isZeroOrderLoading

  const stockByCompany = useMemo(() => (stockByCompanyData ?? []).map((row) => ({ name: row.company, value: row.total })), [stockByCompanyData])
  const topByValue = useMemo(() => (topByValueData ?? []).map((row) => ({ name: row.itemName, value: row.total })), [topByValueData])

  const stockLevelData = useMemo(() => {
    const countByBucket = new Map((stockSummary?.levelCounts ?? []).map((row) => [row.bucket, row.count]))
    return STOCK_LEVEL_BUCKETS.map((bucket) => ({ label: bucket.label, value: countByBucket.get(bucket.label) ?? 0 }))
  }, [stockSummary])

  const zeroOrderItems = useMemo(
    () =>
      (zeroOrder ?? [])
        .slice()
        .sort((a, b) => b.soldQtyInPeriod - a.soldQtyInPeriod)
        .slice(0, 12)
        .map((row) => ({ name: row.itemName, value: row.soldQtyInPeriod })),
    [zeroOrder],
  )

  const expiryBucketData = useMemo(() => {
    const totals = EXPIRY_BUCKETS.map(() => 0)
    for (const row of expiry ?? []) {
      const bucket = expiryBucketIndex(row.daysToExpiry)
      totals[bucket === -1 ? EXPIRY_BUCKETS.length - 1 : bucket] += row.value ?? 0
    }
    return EXPIRY_BUCKETS.map((bucket, i) => ({ label: bucket.label, value: totals[i] }))
  }, [expiry])

  const nonMovingItems = useMemo(
    () =>
      (nonMoving ?? [])
        .slice()
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
        .slice(0, 10)
        .map((row) => ({ name: row.itemName, value: row.value ?? 0 })),
    [nonMoving],
  )

  return (
    <section id="stock" className="scroll-mt-20 space-y-4">
      <SectionHeading icon={PackageIcon}>{tTabs("stock")}</SectionHeading>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <TremorStatCard
          label={t("stockValue")}
          value={formatCurrency(stockSummary?.totalValue ?? 0)}
          description={t("stockValueDesc")}
          icon={PackageIcon}
          tone={TremorTone.primary}
          loading={isKpiLoading}
          detailsHref={buildReportUrl("/reports/stock", { branchId: filters.branchId })}
        />
        <TremorStatCard
          label={t("uniqueItems")}
          value={formatNumber(stockSummary?.uniqueItemCount ?? 0)}
          description={t("uniqueItemsDesc")}
          icon={ListBulletsIcon}
          tone={TremorTone.accent}
          loading={isKpiLoading}
          detailsHref={buildReportUrl("/reports/stock", { branchId: filters.branchId })}
        />
        <TremorStatCard
          label={t("zeroOrderAlerts")}
          value={zeroOrder?.length ?? 0}
          description={t("zeroOrderAlertsDesc")}
          icon={WarningIcon}
          tone={TremorTone.danger}
          loading={isKpiLoading}
          detailsHref={buildReportUrl("/reports/stock", { branchId: filters.branchId, stockTo: 0 })}
        />
        <TremorStatCard
          label={t("expiringSoon")}
          value={formatCurrency(expiringSoonValue)}
          description={t("expiringSoonDesc")}
          icon={ClockCountdownIcon}
          tone={TremorTone.warning}
          loading={isKpiLoading}
          detailsHref={buildReportUrl("/reports/stock", { branchId: filters.branchId, expiryTier: "lte30" })}
        />
        <TremorStatCard
          label={t("nonMovingValue")}
          value={formatCurrency(nonMovingValue)}
          description={t("nonMovingValueDesc")}
          icon={ArrowsCounterClockwiseIcon}
          tone={TremorTone.danger}
          loading={isKpiLoading}
          detailsHref={buildReportUrl("/reports/non-moving", { branchId: filters.branchId })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title={t("stockValueByCompany")}
          description={t("stockValueByCompanyDesc")}
          detailsHref={buildReportUrl("/reports/stock", { branchId: filters.branchId })}
          icon={BuildingsIcon}
        >
          <TremorDonutChart
            data={stockByCompany}
            valueFormatter={(value) => formatCurrency(value)}
            isLoading={isByCompanyLoading}
            height={240}
            onSliceClick={(slice) => router.push(buildReportUrl("/reports/stock", { branchId: filters.branchId, company: [slice.name] }))}
          />
        </ChartCard>

        <ChartCard title={t("stockHealth")} description={t("stockHealthDesc")} icon={GaugeIcon}>
          <TremorBarChart
            data={stockLevelData}
            index="label"
            categories={["value"]}
            barColors={STOCK_LEVEL_BUCKETS.map((bucket) => bucket.color)}
            valueFormatter={(value) => formatNumber(value)}
            isLoading={isSummaryLoading}
            height={240}
            onBarClick={(point) => {
              const bucket = STOCK_LEVEL_BUCKETS.find((b) => b.label === point.label)
              if (bucket) router.push(buildReportUrl("/reports/stock", { branchId: filters.branchId, ...bucket.filter }))
            }}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title={t("zeroOrderReorder")}
          description={t("zeroOrderReorderDesc")}
          detailsHref={buildReportUrl("/reports/stock", { branchId: filters.branchId, stockTo: 0 })}
          icon={WarningIcon}
        >
          {isZeroOrderLoading ? (
            <p className="text-xs text-muted-foreground">{tCommon("loading")}</p>
          ) : (
            <TremorBarList
              data={zeroOrderItems}
              valueFormatter={(value) => formatNumber(value)}
              onItemClick={(item) => router.push(buildReportUrl("/reports/stock", { branchId: filters.branchId, stockTo: 0, item: [item.name] }))}
            />
          )}
        </ChartCard>

        <ChartCard title={t("expiryValueAtRisk")} description={t("expiryValueAtRiskDesc")} icon={ClockCountdownIcon}>
          <TremorBarChart
            data={expiryBucketData}
            index="label"
            categories={["value"]}
            barColors={EXPIRY_BUCKETS.map((bucket) => bucket.color)}
            valueFormatter={(value) => formatCurrency(value)}
            isLoading={isExpiryLoading}
            height={220}
            onBarClick={(point) => {
              const bucket = EXPIRY_BUCKETS.find((b) => b.label === point.label)
              if (bucket) router.push(buildReportUrl("/reports/stock", { branchId: filters.branchId, ...bucket.filter }))
            }}
          />
        </ChartCard>
      </div>

      <ChartCard
        title={t("nonMovingByValue")}
        description={t("nonMovingByValueDesc")}
        detailsHref={buildReportUrl("/reports/non-moving", { branchId: filters.branchId })}
        icon={ArrowsCounterClockwiseIcon}
      >
        {isNonMovingLoading ? (
          <p className="text-xs text-muted-foreground">{tCommon("loading")}</p>
        ) : (
          <TremorBarList
            data={nonMovingItems}
            valueFormatter={(value) => formatCurrency(value)}
            onItemClick={(item) => router.push(buildReportUrl("/reports/non-moving", { branchId: filters.branchId, item: [item.name] }))}
          />
        )}
      </ChartCard>

      <ChartCard
        title={t("topByValue")}
        description={t("topByValueDesc")}
        detailsHref={buildReportUrl("/reports/stock", { branchId: filters.branchId })}
        icon={PackageIcon}
      >
        {isTopByValueLoading ? (
          <p className="text-xs text-muted-foreground">{tCommon("loading")}</p>
        ) : (
          <TremorBarList
            data={topByValue}
            valueFormatter={(value) => formatCurrency(value)}
            onItemClick={(item) => router.push(buildReportUrl("/reports/stock", { branchId: filters.branchId, item: [item.name] }))}
          />
        )}
      </ChartCard>
    </section>
  )
}
