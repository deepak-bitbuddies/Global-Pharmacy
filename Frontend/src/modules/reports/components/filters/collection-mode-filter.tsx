"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import { CustomSelectFilter } from "@/components/ui"
import { SalesCollectionMode } from "../../types"

export type CollectionModeOption = { id: SalesCollectionMode; label: string }

/**
 * Shared Collection Mode option list + labels — used by both the dropdown (`CollectionModeFilter`)
 * and the active-filter chip label lookup (`FilterChips`), so they can never drift apart. Fixed
 * 3-value enum, not fetched — must match the backend's `classifyPartyGroup` buckets (reports/enums.ts).
 */
export function useCollectionModeOptions(): CollectionModeOption[] {
  const t = useTranslations("Reports.sales")

  return useMemo<CollectionModeOption[]>(
    () => [
      { id: SalesCollectionMode.Cash, label: t("modeCash") },
      { id: SalesCollectionMode.PaytmOnline, label: t("modePaytmOnline") },
      { id: SalesCollectionMode.CreditDue, label: t("modeCreditDue") },
    ],
    [t],
  )
}

type CollectionModeFilterProps = {
  value?: SalesCollectionMode[]
  onChange: (collectionMode: SalesCollectionMode[] | undefined) => void
}

/** Shared Collection Mode filter (Sales Register) — Cash / Paytm-Online / Credit-Due. */
export function CollectionModeFilter({ value, onChange }: CollectionModeFilterProps) {
  const t = useTranslations("Reports.sales")
  const options = useCollectionModeOptions()
  const selected = options.filter((option) => value?.includes(option.id))

  return (
    <CustomSelectFilter<CollectionModeOption>
      multiple
      ariaLabel={t("mode")}
      data={options}
      value={selected}
      onChange={(next) => onChange(next.length > 0 ? next.map((option) => option.id) : undefined)}
      displayKey="label"
      idKey="id"
      placeholder={t("modePlaceholder")}
    />
  )
}
