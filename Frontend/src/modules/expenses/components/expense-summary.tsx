"use client"

import { useTranslations } from "next-intl"
import { ChartLineUpIcon, HandCoinsIcon, ReceiptIcon } from "@phosphor-icons/react"

import { TremorStatCard, TremorTone } from "@/components/ui/tremor"
import { formatCurrency } from "@/utils/formatting"
import { useExpenseSummary } from "../hooks/use-expenses"
import type { ExpenseFilters } from "../types"

const todayIso = () => new Date().toISOString().slice(0, 10)

export function ExpenseSummary({ filters }: { filters: ExpenseFilters }) {
  const t = useTranslations("ExpenseTracker")
  const { data: summary, isLoading } = useExpenseSummary(filters)

  // Deliberately ignores the page's dateFrom/dateTo — "Today's Total" is meant to always answer
  // "how much today", so it shouldn't go blank just because someone filtered the table to a
  // different date range. Branch/search still apply, since those narrow *what* counts, not *when*.
  const today = todayIso()
  const { data: todaySummary, isLoading: isTodayLoading } = useExpenseSummary({ branchId: filters.branchId, search: filters.search, dateFrom: today, dateTo: today })

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <TremorStatCard label={t("totalExpenses")} value={formatCurrency(summary?.total ?? 0)} icon={HandCoinsIcon} tone={TremorTone.primary} loading={isLoading} />
      <TremorStatCard label={t("entryCount")} value={summary?.count ?? 0} icon={ReceiptIcon} tone={TremorTone.accent} loading={isLoading} />
      <TremorStatCard label={t("todayTotal")} value={formatCurrency(todaySummary?.total ?? 0)} icon={ChartLineUpIcon} tone={TremorTone.success} loading={isTodayLoading} />
    </div>
  )
}
