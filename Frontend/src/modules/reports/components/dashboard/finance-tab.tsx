"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PercentIcon, ScalesIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { CustomInfoTooltip } from "@/components/ui"
import { TremorBarList, TremorCard } from "@/components/ui/tremor"
import { formatCurrency } from "@/utils/formatting"
import { useGrossProfit, useTopGrossProfitPercent } from "../../hooks/use-reports"
import { buildReportUrl } from "../../utils/report-links"
import { SectionHeading } from "./section-heading"
import type { ReportFilters } from "../../types"

export function FinanceTab({ filters }: { filters: ReportFilters }) {
  const t = useTranslations("Dashboard.finance")
  const tCommon = useTranslations("Common")
  const tTabs = useTranslations("Dashboard.tabs")
  const router = useRouter()

  // Independent top-10/top-8 lookups, not a paginated listing — this section is chart-only.
  const { data: topGpData, isLoading: isTopGpLoading } = useGrossProfit(filters, { pageSize: 10 })
  const { data: topGpPctData, isLoading: isTopGpPctLoading } = useTopGrossProfitPercent(filters)

  const topGp = useMemo(
    () => (topGpData?.data ?? []).filter((row) => row.estimatedGp !== null).map((row) => ({ name: row.itemName, value: row.estimatedGp ?? 0 })),
    [topGpData],
  )
  const topGpPct = useMemo(
    () => (topGpPctData ?? []).filter((row) => row.estimatedGpPct !== null).map((row) => ({ name: row.itemName, value: row.estimatedGpPct ?? 0 })),
    [topGpPctData],
  )

  return (
    <section id="finance" className="scroll-mt-20 space-y-4">
      <SectionHeading icon={ScalesIcon}>{tTabs("finance")}</SectionHeading>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TremorCard className="space-y-3">
          <div className="flex items-center gap-2">
            <ScalesIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">{t("topItemsByGp")}</p>
            <CustomInfoTooltip content={t("topItemsByGpDesc")} />
            <Link href={buildReportUrl("/reports/gross-profit", filters)} className="ml-auto shrink-0 text-xs font-medium text-primary hover:underline">
              {tCommon("viewDetails")} →
            </Link>
          </div>
          {isTopGpLoading ? (
            <p className="text-xs text-muted-foreground">{tCommon("loading")}</p>
          ) : (
            <TremorBarList
              data={topGp}
              valueFormatter={(value) => formatCurrency(value)}
              onItemClick={(item) => router.push(buildReportUrl("/reports/gross-profit", { ...filters, item: [item.name] }))}
            />
          )}
        </TremorCard>

        <TremorCard className="space-y-3">
          <div className="flex items-center gap-2">
            <PercentIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">{t("topItemsByGpPct")}</p>
            <CustomInfoTooltip content={t("topItemsByGpPctDesc")} />
          </div>
          {isTopGpPctLoading ? (
            <p className="text-xs text-muted-foreground">{tCommon("loading")}</p>
          ) : (
            <TremorBarList
              data={topGpPct}
              valueFormatter={(value) => `${value.toFixed(1)}%`}
              onItemClick={(item) => router.push(buildReportUrl("/reports/gross-profit", { ...filters, item: [item.name] }))}
            />
          )}
        </TremorCard>
      </div>
    </section>
  )
}
