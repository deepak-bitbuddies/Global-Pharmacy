"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BuildingsIcon, PackageIcon, ShoppingCartIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { CustomInfoTooltip } from "@/components/ui"
import { TremorBarList, TremorCard, TremorDonutChart } from "@/components/ui/tremor"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { usePurchaseSummary, usePurchaseValueByCompany } from "../../hooks/use-reports"
import { buildReportUrl } from "../../utils/report-links"
import { SectionHeading } from "./section-heading"
import type { ReportFilters } from "../../types"

export function PurchaseTab({ filters }: { filters: ReportFilters }) {
  const t = useTranslations("Dashboard.purchase")
  const tCommon = useTranslations("Common")
  const tTabs = useTranslations("Dashboard.tabs")
  const router = useRouter()

  // Independent top-10/top-8 lookups, not a paginated listing — this section is chart-only.
  const { data: topData, isLoading: isTopSuppliersLoading } = usePurchaseSummary(filters, { pageSize: 10 })
  const { data: byCompany, isLoading: isByCompanyLoading } = usePurchaseValueByCompany(filters)

  const topSuppliers = useMemo(() => (topData?.data ?? []).map((row) => ({ name: row.supplierGroup, value: row.totalAmount })), [topData])
  const freeQtyBySupplier = useMemo(() => (topData?.data ?? []).map((row) => ({ name: row.supplierGroup, value: row.totalFreeQty })), [topData])
  const companyItems = useMemo(() => (byCompany ?? []).map((row) => ({ name: row.company, value: row.total })), [byCompany])

  return (
    <section id="purchase" className="scroll-mt-20 space-y-4">
      <SectionHeading icon={ShoppingCartIcon}>{tTabs("purchase")}</SectionHeading>

      <TremorCard className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCartIcon className="size-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">{t("topSuppliers")}</p>
          <CustomInfoTooltip content={t("topSuppliersDesc")} />
          <Link href={buildReportUrl("/reports/purchase", filters)} className="ml-auto shrink-0 text-xs font-medium text-primary hover:underline">
            {tCommon("viewDetails")} →
          </Link>
        </div>
        {isTopSuppliersLoading ? (
          <p className="text-xs text-muted-foreground">{tCommon("loading")}</p>
        ) : (
          <TremorBarList
            data={topSuppliers}
            valueFormatter={(value) => formatCurrency(value)}
            onItemClick={(item) => router.push(buildReportUrl("/reports/purchase", { ...filters, supplierGroup: item.name }))}
          />
        )}
      </TremorCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TremorCard className="space-y-3">
          <div className="flex items-center gap-2">
            <PackageIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">{t("freeQtyBySupplier")}</p>
            <CustomInfoTooltip content={t("freeQtyBySupplierDesc")} />
          </div>
          {isTopSuppliersLoading ? (
            <p className="text-xs text-muted-foreground">{tCommon("loading")}</p>
          ) : (
            <TremorBarList
              data={freeQtyBySupplier}
              valueFormatter={(value) => formatNumber(value)}
              onItemClick={(item) => router.push(buildReportUrl("/reports/purchase", { ...filters, supplierGroup: item.name }))}
            />
          )}
        </TremorCard>

        <TremorCard className="space-y-3">
          <div className="flex items-center gap-2">
            <BuildingsIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">{t("purchaseByCompany")}</p>
            <CustomInfoTooltip content={t("purchaseByCompanyDesc")} />
          </div>
          <TremorDonutChart
            data={companyItems}
            valueFormatter={(value) => formatCurrency(value)}
            isLoading={isByCompanyLoading}
            height={220}
            onSliceClick={(slice) => router.push(buildReportUrl("/reports/purchase", { ...filters, company: slice.name }))}
          />
        </TremorCard>
      </div>
    </section>
  )
}
