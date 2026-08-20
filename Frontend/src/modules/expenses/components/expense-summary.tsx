"use client"

import { useTranslations } from "next-intl"
import { BankIcon, HandCoinsIcon, HourglassMediumIcon, ScalesIcon, TrendDownIcon, TrendUpIcon } from "@phosphor-icons/react"

import { TremorStatCard, TremorTone } from "@/components/ui/tremor"
import { useAuthStore } from "@/providers"
import { formatCurrency } from "@/utils/formatting"
import { useExpenseSummary } from "../hooks/use-expenses"
import type { ExpenseFilters } from "../types"

export function ExpenseSummary({ filters }: { filters: ExpenseFilters }) {
  const t = useTranslations("ExpenseTracker")
  const role = useAuthStore((state) => state.user?.role)
  const { data: summary, isLoading } = useExpenseSummary(filters)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <TremorStatCard label={t("totalCollection")} value={formatCurrency(summary?.totalCollection ?? 0)} icon={TrendUpIcon} tone={TremorTone.success} loading={isLoading} />
      <TremorStatCard label={t("totalExpenses")} value={formatCurrency(summary?.totalExpenses ?? 0)} icon={TrendDownIcon} tone={TremorTone.danger} loading={isLoading} />
      <TremorStatCard label={t("currentBalance")} value={formatCurrency(summary?.balance ?? 0)} icon={ScalesIcon} tone={TremorTone.primary} loading={isLoading} />
      <TremorStatCard label={t("handedOverCash")} value={formatCurrency(summary?.totalHandoverCash ?? 0)} icon={HandCoinsIcon} tone={TremorTone.warning} loading={isLoading} />
      <TremorStatCard label={t("handedOverBank")} value={formatCurrency(summary?.totalHandoverBank ?? 0)} icon={BankIcon} tone={TremorTone.warning} loading={isLoading} />
      {role === "super_admin" && (
        <TremorStatCard label={t("pendingApprovals")} value={summary?.pendingApprovalCount ?? 0} icon={HourglassMediumIcon} tone={TremorTone.accent} loading={isLoading} />
      )}
    </div>
  )
}
