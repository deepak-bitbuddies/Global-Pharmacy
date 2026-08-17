"use client"

import { useMemo, useState } from "react"
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

import { CustomInfoTooltip, CustomTable } from "@/components/ui"
import { TremorBarChart, TremorBarList, TremorCard, TremorDonutChart, TremorStatCard, TremorTone } from "@/components/ui/tremor"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { ReportFilterPanel } from "../filters"
import {
  useExpiryReport,
  useNonMovingItems,
  useStockReport,
  useStockSummary,
  useStockValueByCompany,
  useZeroOrderAlerts,
} from "../../hooks/use-reports"
import type { ReportFilters, StockRow } from "../../types"

// Fixed status/severity colors — deliberately hardcoded, not the app theme's
// --danger/--warning/--success tokens, so risk color-coding on these charts
// stays the standard red/orange/amber/green regardless of app theming. Same
// hex in light and dark (status color is never themed).
const STATUS_CRITICAL = "#d03b3b"
const STATUS_SERIOUS = "#ec835a"
const STATUS_WARNING = "#fab219"
const STATUS_GOOD = "#0ca30c"
const STATUS_NEUTRAL = "#898781"

// Deliberately not translated: these labels are also used as matching keys against the
// backend's fixed English bucket strings (getStockSummary's SQL CASE) — translating them
// would break that lookup. Chart axis labels stay English regardless of app language.
const EXPIRY_BUCKETS = [
  { label: "Expired", maxDays: 0, color: STATUS_CRITICAL },
  { label: "≤ 30 days", maxDays: 30, color: STATUS_SERIOUS },
  { label: "31–90 days", maxDays: 90, color: STATUS_WARNING },
  { label: "91–180 days", maxDays: 180, color: STATUS_GOOD },
]

function expiryBucketIndex(daysToExpiry: number): number {
  return EXPIRY_BUCKETS.findIndex((bucket) => daysToExpiry <= bucket.maxDays)
}

// Must match the bucket labels the backend's getStockSummary computes via SQL CASE.
const STOCK_LEVEL_BUCKETS = [
  { label: "Zero Stock", color: STATUS_CRITICAL },
  { label: "1–5 units", color: STATUS_SERIOUS },
  { label: "6–20 units", color: STATUS_WARNING },
  { label: "21–50 units", color: STATUS_NEUTRAL },
  { label: "50+ units", color: STATUS_GOOD },
]

function ChartCard({
  title,
  description,
  icon: Icon,
  className,
  children,
}: {
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  className?: string
  children: React.ReactNode
}) {
  return (
    <TremorCard className={`space-y-3 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && <CustomInfoTooltip content={description} />}
      </div>
      {children}
    </TremorCard>
  )
}

export function StockTab({ filters }: { filters: ReportFilters }) {
  const t = useTranslations("Dashboard.stock")
  const tCommon = useTranslations("Common")
  // Only `item`/`company` are ever set here — kept as a full `ReportFilters` shape (all fields
  // optional) purely so it drops straight into `ReportFilterPanel` without a cast.
  const [localFilters, setLocalFilters] = useState<ReportFilters>({})
  const pagination = useCursorPagination()
  const stockFilters = useMemo<ReportFilters>(() => ({ ...filters, ...localFilters }), [filters, localFilters])

  const updateLocalFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setLocalFilters(updater)
    pagination.reset()
  }

  const { data: stock, isLoading: isStockLoading } = useStockReport(stockFilters, { cursor: pagination.cursor, pageSize: pagination.pageSize })
  const { data: stockSummary, isLoading: isSummaryLoading } = useStockSummary(stockFilters)
  const { data: stockByCompanyData, isLoading: isByCompanyLoading } = useStockValueByCompany(stockFilters)
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
    <div className="space-y-4">
      <ReportFilterPanel filters={localFilters} onFiltersChange={updateLocalFilters} show={{ search: true, company: true }} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <TremorStatCard
          label={t("stockValue")}
          value={formatCurrency(stockSummary?.totalValue ?? 0)}
          description={t("stockValueDesc")}
          icon={PackageIcon}
          tone={TremorTone.primary}
          loading={isKpiLoading}
        />
        <TremorStatCard
          label={t("uniqueItems")}
          value={formatNumber(stockSummary?.uniqueItemCount ?? 0)}
          description={t("uniqueItemsDesc")}
          icon={ListBulletsIcon}
          tone={TremorTone.accent}
          loading={isKpiLoading}
        />
        <TremorStatCard
          label={t("zeroOrderAlerts")}
          value={zeroOrder?.length ?? 0}
          description={t("zeroOrderAlertsDesc")}
          icon={WarningIcon}
          tone={TremorTone.danger}
          loading={isKpiLoading}
        />
        <TremorStatCard
          label={t("expiringSoon")}
          value={formatCurrency(expiringSoonValue)}
          description={t("expiringSoonDesc")}
          icon={ClockCountdownIcon}
          tone={TremorTone.warning}
          loading={isKpiLoading}
        />
        <TremorStatCard
          label={t("nonMovingValue")}
          value={formatCurrency(nonMovingValue)}
          description={t("nonMovingValueDesc")}
          icon={ArrowsCounterClockwiseIcon}
          tone={TremorTone.danger}
          loading={isKpiLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={t("stockValueByCompany")} description={t("stockValueByCompanyDesc")} icon={BuildingsIcon}>
          <TremorDonutChart data={stockByCompany} valueFormatter={(value) => formatCurrency(value)} isLoading={isByCompanyLoading} height={240} />
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
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={t("zeroOrderReorder")} description={t("zeroOrderReorderDesc")} icon={WarningIcon}>
          {isZeroOrderLoading ? <p className="text-xs text-muted-foreground">{tCommon("loading")}</p> : <TremorBarList data={zeroOrderItems} valueFormatter={(value) => formatNumber(value)} />}
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
          />
        </ChartCard>
      </div>

      <ChartCard title={t("nonMovingByValue")} description={t("nonMovingByValueDesc")} icon={ArrowsCounterClockwiseIcon}>
        {isNonMovingLoading ? <p className="text-xs text-muted-foreground">{tCommon("loading")}</p> : <TremorBarList data={nonMovingItems} valueFormatter={(value) => formatCurrency(value)} />}
      </ChartCard>

      <TremorCard className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{t("allStockDetail")}</p>
          <CustomInfoTooltip content={t("allStockDetailDesc")} />
        </div>
        <CustomTable<StockRow>
          columns={[
            { key: "itemName", label: tCommon("item"), sortable: true },
            { key: "currentStock", label: t("stockColumn"), sortable: true },
            { key: "unit", label: tCommon("unit") },
            { key: "value", label: t("value"), sortable: true },
            { key: "expDate", label: t("expiry"), sortable: true },
            { key: "company", label: tCommon("company") },
            { key: "batch", label: t("batch") },
          ]}
          data={stock?.data ?? []}
          loading={isStockLoading}
          rowKey="id"
          itemId="id"
          totalItems={stock?.meta?.total ?? 0}
          emptyText={t("emptyText")}
          onRowsPerPageChange={pagination.setPageSize}
          cursorPagination={{
            page: pagination.page,
            totalPages: stock?.meta?.totalPages,
            hasNextPage: stock?.meta?.hasNextPage ?? false,
            hasPreviousPage: pagination.page > 1,
            onNext: () => pagination.goNext(stock?.meta?.nextCursor ?? null),
            onPrevious: pagination.goPrevious,
          }}
          renderCustomCell={(row, key) => {
            if (key === "value") return row.value === null ? "-" : formatCurrency(row.value)
            if (key === "currentStock") return formatNumber(row.currentStock)
            return row[key] ?? "-"
          }}
        />
      </TremorCard>
    </div>
  )
}
