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

import {
  CustomSearchFilter,
  CustomSelectFilter,
  CustomTable,
  TremorBarChart,
  TremorBarList,
  TremorCard,
  TremorDonutChart,
  TremorStatCard,
  TremorTone,
} from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import {
  useCompanies,
  useExpiryReport,
  useNonMovingItems,
  useStockReport,
  useStockSummary,
  useStockValueByCompany,
  useZeroOrderAlerts,
} from "../../hooks/use-reports"
import type { ReportFilters, StockRow } from "../../types"

type CompanyOption = { id: string; label: string }

const EXPIRY_BUCKETS = [
  { label: "Expired", maxDays: 0, color: "var(--danger)" },
  { label: "≤ 30 days", maxDays: 30, color: "var(--danger)" },
  { label: "31–90 days", maxDays: 90, color: "var(--warning)" },
  { label: "91–180 days", maxDays: 180, color: "var(--default)" },
]

function expiryBucketIndex(daysToExpiry: number): number {
  return EXPIRY_BUCKETS.findIndex((bucket) => daysToExpiry <= bucket.maxDays)
}

// Must match the bucket labels the backend's getStockSummary computes via SQL CASE.
const STOCK_LEVEL_BUCKETS = [
  { label: "Zero Stock", color: "var(--danger)" },
  { label: "1–5 units", color: "var(--danger)" },
  { label: "6–20 units", color: "var(--warning)" },
  { label: "21–50 units", color: "var(--default)" },
  { label: "50+ units", color: "var(--success)" },
]

function ChartCard({
  title,
  icon: Icon,
  className,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  className?: string
  children: React.ReactNode
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

export function StockTab({ filters }: { filters: ReportFilters }) {
  const [search, setSearch] = useState<string | undefined>(undefined)
  const [company, setCompany] = useState<string | undefined>(undefined)
  const pagination = useCursorPagination()
  const stockFilters = useMemo<ReportFilters>(() => ({ ...filters, item: search || undefined, company }), [filters, search, company])

  const { data: stock, isLoading: isStockLoading } = useStockReport(stockFilters, { cursor: pagination.cursor, pageSize: pagination.pageSize })
  const { data: stockSummary, isLoading: isSummaryLoading } = useStockSummary(stockFilters)
  const { data: stockByCompanyData, isLoading: isByCompanyLoading } = useStockValueByCompany(stockFilters)
  const { data: companies } = useCompanies()
  const { data: zeroOrder, isLoading: isZeroOrderLoading } = useZeroOrderAlerts(filters)
  const { data: expiry, isLoading: isExpiryLoading } = useExpiryReport({ ...filters, withinDays: 180 })
  const { data: nonMoving, isLoading: isNonMovingLoading } = useNonMovingItems(filters)

  const companyOptions = useMemo<CompanyOption[]>(() => (companies ?? []).map((c) => ({ id: c, label: c })), [companies])
  const selectedCompany = companyOptions.find((option) => option.id === company)

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
      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2">
        <CustomSearchFilter
          placeholder="Search item..."
          value={search}
          onChange={(value) => {
            setSearch(value || undefined)
            pagination.reset()
          }}
        />
        <CustomSelectFilter<CompanyOption>
          ariaLabel="Company"
          data={companyOptions}
          value={selectedCompany}
          onChange={(value) => {
            const option = Array.isArray(value) ? value[0] : value
            setCompany(option?.id)
            pagination.reset()
          }}
          displayKey="label"
          idKey="id"
          placeholder="All companies"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <TremorStatCard label="Stock Value" value={formatCurrency(stockSummary?.totalValue ?? 0)} icon={PackageIcon} tone={TremorTone.primary} loading={isKpiLoading} />
        <TremorStatCard label="Unique Items" value={formatNumber(stockSummary?.uniqueItemCount ?? 0)} icon={ListBulletsIcon} tone={TremorTone.accent} loading={isKpiLoading} />
        <TremorStatCard label="Zero-Order Alerts" value={zeroOrder?.length ?? 0} icon={WarningIcon} tone={TremorTone.danger} loading={isKpiLoading} />
        <TremorStatCard label="Expiring ≤30 days" value={formatCurrency(expiringSoonValue)} icon={ClockCountdownIcon} tone={TremorTone.warning} loading={isKpiLoading} />
        <TremorStatCard label="Non-Moving Value" value={formatCurrency(nonMovingValue)} icon={ArrowsCounterClockwiseIcon} tone={TremorTone.danger} loading={isKpiLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Stock Value by Company (Top 8)" icon={BuildingsIcon}>
          <TremorDonutChart data={stockByCompany} valueFormatter={(value) => formatCurrency(value)} isLoading={isByCompanyLoading} height={240} />
        </ChartCard>

        <ChartCard title="Stock Health — Quantity Distribution" icon={GaugeIcon}>
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
        <ChartCard title="Zero-Order Alerts — Top Reorder Candidates" icon={WarningIcon}>
          {isZeroOrderLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : <TremorBarList data={zeroOrderItems} valueFormatter={(value) => formatNumber(value)} />}
        </ChartCard>

        <ChartCard title="Expiry Value at Risk (180 days)" icon={ClockCountdownIcon}>
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

      <ChartCard title="Non-Moving Items (by value)" icon={ArrowsCounterClockwiseIcon}>
        {isNonMovingLoading ? <p className="text-xs text-muted-foreground">Loading…</p> : <TremorBarList data={nonMovingItems} valueFormatter={(value) => formatCurrency(value)} />}
      </ChartCard>

      <TremorCard className="space-y-3">
        <p className="text-sm font-semibold text-foreground">All Stock (detail)</p>
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
          data={stock?.data ?? []}
          loading={isStockLoading}
          rowKey="id"
          itemId="id"
          totalItems={stock?.meta.total ?? 0}
          emptyText="No stock data — import a Stock Register file first."
          onRowsPerPageChange={pagination.setPageSize}
          cursorPagination={{
            page: pagination.page,
            totalPages: stock?.meta.totalPages,
            hasNextPage: stock?.meta.hasNextPage ?? false,
            hasPreviousPage: pagination.page > 1,
            onNext: () => pagination.goNext(stock?.meta.nextCursor ?? null),
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
