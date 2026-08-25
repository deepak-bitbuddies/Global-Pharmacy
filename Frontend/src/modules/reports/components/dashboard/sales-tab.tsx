"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowsCounterClockwiseIcon, BuildingsIcon, ChartLineUpIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { CustomInfoTooltip } from "@/components/ui"
import { TremorBarList, TremorCard, TremorDonutChart } from "@/components/ui/tremor"
import { formatCurrency } from "@/utils/formatting"
import { useItemWiseSales, useSalesValueByCompany, useTopReturns } from "../../hooks/use-reports"
import { buildReportUrl } from "../../utils/report-links"
import { SectionHeading } from "./section-heading"
import { TopNSelect } from "./top-n-select"
import { DEFAULT_TOP_N, type ReportFilters } from "../../types"

export function SalesTab({ filters }: { filters: ReportFilters }) {
  const t = useTranslations("Dashboard.sales")
  const tCommon = useTranslations("Common")
  const tTabs = useTranslations("Dashboard.tabs")
  const router = useRouter()

  // Each widget's "how many, from which end" choice is independent — picking Bottom 20 on
  // Returns shouldn't change what Top Items by Sales is showing.
  const [topItemsN, setTopItemsN] = useState(DEFAULT_TOP_N)
  const [topReturnsN, setTopReturnsN] = useState(DEFAULT_TOP_N)
  const [byCompanyN, setByCompanyN] = useState(DEFAULT_TOP_N)

  const { data: topData, isLoading: isTopItemsLoading } = useItemWiseSales(filters, { pageSize: topItemsN.limit }, topItemsN.direction)
  const { data: topReturns, isLoading: isReturnsLoading } = useTopReturns(filters, topReturnsN)
  const { data: byCompany, isLoading: isByCompanyLoading } = useSalesValueByCompany(filters, byCompanyN)

  const topItems = useMemo(() => (topData?.data ?? []).map((row) => ({ name: row.itemNameRaw, value: row.totalAmount })), [topData])
  const returnItems = useMemo(() => (topReturns ?? []).map((row) => ({ name: row.itemNameRaw, value: row.returnAmount })), [topReturns])
  const companyItems = useMemo(() => (byCompany ?? []).map((row) => ({ name: row.company, value: row.total })), [byCompany])

  return (
    <section id="sales" className="scroll-mt-20 space-y-4">
      <SectionHeading icon={ChartLineUpIcon}>{tTabs("sales")}</SectionHeading>

      <TremorCard className="space-y-3">
        <div className="flex items-center gap-2">
          <ChartLineUpIcon className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">{t("topItemsBySales")}</p>
          <CustomInfoTooltip content={t("topItemsBySalesDesc")} />
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <TopNSelect value={topItemsN} onChange={setTopItemsN} />
            <Link href={buildReportUrl("/reports/sales", filters)} className="text-xs font-medium text-primary hover:underline">
              {tCommon("viewDetails")} →
            </Link>
          </div>
        </div>
        {isTopItemsLoading ? (
          <p className="text-xs text-muted-foreground">{tCommon("loading")}</p>
        ) : (
          <TremorBarList
            data={topItems}
            valueFormatter={(value) => formatCurrency(value)}
            onItemClick={(item) => router.push(buildReportUrl("/reports/sales", { ...filters, item: [item.name] }))}
          />
        )}
      </TremorCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TremorCard className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowsCounterClockwiseIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">{t("topReturns")}</p>
            <CustomInfoTooltip content={t("topReturnsDesc")} />
            <div className="ml-auto shrink-0">
              <TopNSelect value={topReturnsN} onChange={setTopReturnsN} />
            </div>
          </div>
          {isReturnsLoading ? (
            <p className="text-xs text-muted-foreground">{tCommon("loading")}</p>
          ) : (
            <TremorBarList
              data={returnItems}
              valueFormatter={(value) => formatCurrency(value)}
              onItemClick={(item) => router.push(buildReportUrl("/reports/sales", { ...filters, item: [item.name] }))}
            />
          )}
        </TremorCard>

        <TremorCard className="space-y-3">
          <div className="flex items-center gap-2">
            <BuildingsIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">{t("salesByCompany")}</p>
            <CustomInfoTooltip content={t("salesByCompanyDesc")} />
            <div className="ml-auto shrink-0">
              <TopNSelect value={byCompanyN} onChange={setByCompanyN} />
            </div>
          </div>
          <TremorDonutChart
            data={companyItems}
            valueFormatter={(value) => formatCurrency(value)}
            isLoading={isByCompanyLoading}
            height={220}
            onSliceClick={(slice) => router.push(buildReportUrl("/reports/sales", { ...filters, company: [slice.name] }))}
          />
        </TremorCard>
      </div>
    </section>
  )
}
