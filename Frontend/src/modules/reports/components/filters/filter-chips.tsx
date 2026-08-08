"use client"

import { useTranslations } from "next-intl"

import { ButtonVariant, CustomButton, CustomChip } from "@/components/ui"
import { useBranches } from "../../hooks/use-reports"
import type { ReportFilterFlags } from "./report-filter-panel"
import { useExpiryTierOptions } from "./expiry-tier-filter"
import { useSchemeTierOptions } from "./scheme-tier-filter"
import type { ReportFilters } from "../../types"

type FilterChipsProps = {
  filters: ReportFilters
  onFiltersChange: (updater: (prev: ReportFilters) => ReportFilters) => void
  show: ReportFilterFlags
}

type Chip = { key: string; label: string; onRemove: () => void }

/** "500 – 1000" when both bounds are set, "≥ 500" / "≤ 1000" when only one is. */
function rangeLabel(from: number | undefined, to: number | undefined): string {
  if (from !== undefined && to !== undefined) return `${from} – ${to}`
  if (from !== undefined) return `≥ ${from}`
  return `≤ ${to}`
}

/** Removable chips for every *active* filter except search (already visible/editable in its own box) — plus a "Clear all" that also resets search, matching the modal's Apply committing the same shape. */
export function FilterChips({ filters, onFiltersChange, show }: FilterChipsProps) {
  const t = useTranslations()
  const tCommon = useTranslations("Common")
  const tPurchase = useTranslations("Reports.purchase")
  const tStock = useTranslations("Reports.stock")
  const { data: branches } = useBranches()
  const schemeTierOptions = useSchemeTierOptions()
  const expiryTierOptions = useExpiryTierOptions()

  const chips: Chip[] = []

  if (show.branch && filters.branchId) {
    const branchName = branches?.find((branch) => branch.id === filters.branchId)?.name ?? filters.branchId
    chips.push({
      key: "branch",
      label: `${tCommon("branch")}: ${branchName}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, branchId: undefined })),
    })
  }

  if (show.company && filters.company) {
    chips.push({
      key: "company",
      label: `${tCommon("company")}: ${filters.company}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, company: undefined })),
    })
  }

  if (show.schemeTier && filters.schemeTier) {
    const label = schemeTierOptions.find((option) => option.id === filters.schemeTier)?.label ?? filters.schemeTier
    chips.push({
      key: "schemeTier",
      label: `${tPurchase("schemePct")}: ${label}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, schemeTier: undefined })),
    })
  }

  if (show.expiryTier && filters.expiryTier) {
    const isCustomWithRange = filters.expiryTier === "custom" && filters.expiryDateFrom && filters.expiryDateTo
    const label = isCustomWithRange
      ? `${filters.expiryDateFrom} – ${filters.expiryDateTo}`
      : (expiryTierOptions.find((option) => option.id === filters.expiryTier)?.label ?? filters.expiryTier)
    chips.push({
      key: "expiryTier",
      label: `${tStock("expiry")}: ${label}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, expiryTier: undefined, expiryDateFrom: undefined, expiryDateTo: undefined })),
    })
  }

  if (show.dateRange && filters.dateFrom && filters.dateTo) {
    chips.push({
      key: "dateRange",
      label: `${tCommon("dateRange")}: ${filters.dateFrom} – ${filters.dateTo}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, dateFrom: undefined, dateTo: undefined })),
    })
  }

  if (show.supplier && filters.supplier) {
    chips.push({
      key: "supplier",
      label: `${tStock("supplier")}: ${filters.supplier}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, supplier: undefined })),
    })
  }

  if (show.stockRange && (filters.stockFrom !== undefined || filters.stockTo !== undefined)) {
    chips.push({
      key: "stockRange",
      label: `${tStock("stockRange")}: ${rangeLabel(filters.stockFrom, filters.stockTo)}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, stockFrom: undefined, stockTo: undefined })),
    })
  }

  if (show.supplierGroup && filters.supplierGroup) {
    chips.push({
      key: "supplierGroup",
      label: `${tPurchase("supplier")}: ${filters.supplierGroup}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, supplierGroup: undefined })),
    })
  }

  if (show.amountRange && (filters.amountFrom !== undefined || filters.amountTo !== undefined)) {
    chips.push({
      key: "amountRange",
      label: `${tCommon("amountRange")}: ${rangeLabel(filters.amountFrom, filters.amountTo)}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, amountFrom: undefined, amountTo: undefined })),
    })
  }

  const hasAnyActiveFilter = chips.length > 0 || Boolean(filters.item)
  if (!hasAnyActiveFilter) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <CustomChip key={chip.key} onClose={chip.onRemove}>
          {chip.label}
        </CustomChip>
      ))}
      <CustomButton variant={ButtonVariant.ghost} className="h-8 px-2 text-xs" onClick={() => onFiltersChange(() => ({}))}>
        {t("ClearAllFilters")}
      </CustomButton>
    </div>
  )
}
