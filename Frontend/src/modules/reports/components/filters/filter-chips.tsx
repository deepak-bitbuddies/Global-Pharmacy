"use client"

import { useTranslations } from "next-intl"

import { ButtonVariant, CustomButton, CustomChip } from "@/components/ui"
import { useBranches } from "../../hooks/use-reports"
import type { ReportFilterFlags } from "./report-filter-panel"
import { useCollectionModeOptions } from "./collection-mode-filter"
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

/** Removable chips for every *active* filter value — multi-select fields (Item/Branch/Company/Supplier/Supplier Group) get one chip per selected value — plus a "Clear all". */
export function FilterChips({ filters, onFiltersChange, show }: FilterChipsProps) {
  const t = useTranslations()
  const tCommon = useTranslations("Common")
  const tPurchase = useTranslations("Reports.purchase")
  const tStock = useTranslations("Reports.stock")
  const tSales = useTranslations("Reports.sales")
  const { data: branches } = useBranches()
  const schemeTierOptions = useSchemeTierOptions()
  const expiryTierOptions = useExpiryTierOptions()
  const collectionModeOptions = useCollectionModeOptions()

  const chips: Chip[] = []

  /** Removes a single value from an array filter — clears the key entirely once the array empties, instead of leaving a stray `[]`. */
  function removeFromArray(key: "branchId" | "company" | "supplier" | "supplierGroup" | "item", value: string) {
    onFiltersChange((prev) => {
      const next = (prev[key] ?? []).filter((v) => v !== value)
      return { ...prev, [key]: next.length > 0 ? next : undefined }
    })
  }

  if (show.item) {
    for (const item of filters.item ?? []) {
      chips.push({ key: `item:${item}`, label: `${tCommon("item")}: ${item}`, onRemove: () => removeFromArray("item", item) })
    }
  }

  if (show.branch) {
    for (const branchId of filters.branchId ?? []) {
      const branchName = branches?.find((branch) => branch.id === branchId)?.name ?? branchId
      chips.push({ key: `branch:${branchId}`, label: `${tCommon("branch")}: ${branchName}`, onRemove: () => removeFromArray("branchId", branchId) })
    }
  }

  if (show.company) {
    for (const company of filters.company ?? []) {
      chips.push({ key: `company:${company}`, label: `${tCommon("company")}: ${company}`, onRemove: () => removeFromArray("company", company) })
    }
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

  if (show.supplier) {
    for (const supplier of filters.supplier ?? []) {
      chips.push({ key: `supplier:${supplier}`, label: `${tStock("supplier")}: ${supplier}`, onRemove: () => removeFromArray("supplier", supplier) })
    }
  }

  if (show.stockRange && (filters.stockFrom !== undefined || filters.stockTo !== undefined)) {
    chips.push({
      key: "stockRange",
      label: `${tStock("stockRange")}: ${rangeLabel(filters.stockFrom, filters.stockTo)}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, stockFrom: undefined, stockTo: undefined })),
    })
  }

  if (show.supplierGroup) {
    for (const supplierGroup of filters.supplierGroup ?? []) {
      chips.push({ key: `supplierGroup:${supplierGroup}`, label: `${tPurchase("supplier")}: ${supplierGroup}`, onRemove: () => removeFromArray("supplierGroup", supplierGroup) })
    }
  }

  if (show.amountRange && (filters.amountFrom !== undefined || filters.amountTo !== undefined)) {
    chips.push({
      key: "amountRange",
      label: `${tCommon("amountRange")}: ${rangeLabel(filters.amountFrom, filters.amountTo)}`,
      onRemove: () => onFiltersChange((prev) => ({ ...prev, amountFrom: undefined, amountTo: undefined })),
    })
  }

  if (show.collectionMode) {
    for (const mode of filters.collectionMode ?? []) {
      const label = collectionModeOptions.find((option) => option.id === mode)?.label ?? mode
      chips.push({
        key: `collectionMode:${mode}`,
        label: `${tSales("mode")}: ${label}`,
        onRemove: () =>
          onFiltersChange((prev) => {
            const next = (prev.collectionMode ?? []).filter((v) => v !== mode)
            return { ...prev, collectionMode: next.length > 0 ? next : undefined }
          }),
      })
    }
  }

  if (chips.length === 0) return null

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
