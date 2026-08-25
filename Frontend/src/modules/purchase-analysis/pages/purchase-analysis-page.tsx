"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { CurrencyInrIcon, FileTextIcon, UsersIcon } from "@phosphor-icons/react"

import { CustomPageHeader, CustomTable, CustomTabs } from "@/components/ui"
import { TremorStatCard, TremorTone } from "@/components/ui/tremor"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { PurchaseAnalysisBatchHistory } from "../components/purchase-analysis-batch-history"
import { PurchaseAnalysisFilterPanel } from "../components/purchase-analysis-filters"
import { PurchaseAnalysisUpload } from "../components/purchase-analysis-upload"
import { usePurchaseAnalysisLines, usePurchaseAnalysisSummary } from "../hooks/use-purchase-analysis"
import type { PurchaseAnalysisFilters, PurchaseAnalysisRow } from "../types"

function PurchaseAnalysisDataTab({ filters, onFiltersChange }: { filters: PurchaseAnalysisFilters; onFiltersChange: (updater: (prev: PurchaseAnalysisFilters) => PurchaseAnalysisFilters) => void }) {
  const t = useTranslations("PurchaseAnalysis")
  const tCommon = useTranslations("Common")
  const pagination = useCursorPagination()
  const { data: summary, isLoading: isSummaryLoading } = usePurchaseAnalysisSummary(filters)
  const { data, isLoading, isError } = usePurchaseAnalysisLines(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })

  const updateFilters: typeof onFiltersChange = (updater) => {
    onFiltersChange(updater)
    pagination.reset()
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TremorStatCard
          label={t("totalAmount")}
          value={formatCurrency(summary?.totalAmount ?? 0)}
          icon={CurrencyInrIcon}
          tone={TremorTone.primary}
          loading={isSummaryLoading}
        />
        <TremorStatCard
          label={t("totalTaxAmount")}
          value={formatCurrency(summary?.totalTaxAmount ?? 0)}
          icon={CurrencyInrIcon}
          tone={TremorTone.accent}
          loading={isSummaryLoading}
        />
        <TremorStatCard
          label={t("billCount")}
          value={formatNumber(summary?.billCount ?? 0)}
          icon={FileTextIcon}
          tone={TremorTone.success}
          loading={isSummaryLoading}
        />
        <TremorStatCard
          label={t("partyCount")}
          value={formatNumber(summary?.partyCount ?? 0)}
          icon={UsersIcon}
          tone={TremorTone.warning}
          loading={isSummaryLoading}
        />
      </div>

      <PurchaseAnalysisFilterPanel filters={filters} onFiltersChange={updateFilters} />

      <CustomTable<PurchaseAnalysisRow>
        fillHeight
        isError={isError}
        columns={[
          { key: "billDate", label: tCommon("date"), sortable: true },
          { key: "partyName", label: t("party"), sortable: true },
          { key: "itemName", label: tCommon("item"), sortable: true },
          { key: "billNo", label: t("billNo") },
          { key: "batch", label: t("batchNo") },
          { key: "qty", label: tCommon("qty") },
          { key: "freeQty", label: t("freeQty") },
          { key: "rate", label: t("rate") },
          { key: "discount", label: t("discount") },
          { key: "amount", label: tCommon("amount"), sortable: true },
          { key: "gstPct", label: t("gstPct") },
          { key: "taxAmount", label: t("taxAmount") },
          { key: "companyName", label: tCommon("company") },
          { key: "areaName", label: t("area") },
          { key: "routeName", label: t("route") },
          { key: "type", label: t("type") },
        ]}
        data={data?.data ?? []}
        loading={isLoading}
        rowKey="id"
        itemId="id"
        totalItems={data?.meta?.total ?? 0}
        emptyText={t("emptyText")}
        onRowsPerPageChange={pagination.setPageSize}
        cursorPagination={{
          page: pagination.page,
          totalPages: data?.meta?.totalPages,
          hasNextPage: data?.meta?.hasNextPage ?? false,
          hasPreviousPage: pagination.page > 1,
          onNext: () => pagination.goNext(data?.meta?.nextCursor ?? null),
          onPrevious: pagination.goPrevious,
        }}
        renderCustomCell={(row, key) => {
          if (key === "amount" || key === "rate" || key === "discount" || key === "taxAmount") {
            const value = row[key]
            return value === null ? "-" : formatCurrency(value)
          }
          if (key === "qty" || key === "freeQty") return row[key] === null ? "-" : formatNumber(row[key] as number)
          if (key === "gstPct") return row.gstPct === null ? "-" : `${row.gstPct}%`
          return row[key as keyof PurchaseAnalysisRow] ?? "-"
        }}
      />
    </div>
  )
}

export function PurchaseAnalysisPage() {
  const t = useTranslations("PurchaseAnalysis")
  const [filters, setFilters] = useState<PurchaseAnalysisFilters>({})

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="shrink-0">
        <CustomPageHeader title={t("title")} description={t("description")} />
      </div>

      <div className="min-h-0 flex-1">
        <CustomTabs
          items={[
            { key: "data", label: t("dataTab"), content: <PurchaseAnalysisDataTab filters={filters} onFiltersChange={setFilters} /> },
            {
              key: "import",
              label: t("importTab"),
              content: (
                <div className="space-y-4">
                  <PurchaseAnalysisUpload />
                  <PurchaseAnalysisBatchHistory />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
