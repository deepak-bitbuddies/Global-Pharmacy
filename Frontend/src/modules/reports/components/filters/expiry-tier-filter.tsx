"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import { CustomSelectFilter } from "@/components/ui"
import type { ExpiryTier } from "../../types"

export type ExpiryTierOption = { id: ExpiryTier; label: string }

/**
 * Shared Expiry tier option list + labels — used by both the dropdown (`ExpiryTierFilter`) and the
 * active-filter chip label lookup (`FilterChips`), so they can never drift apart. Fixed buckets,
 * not fetched — expiry is a continuous days-to-expiry number. Boundaries must match the backend's
 * expiryTierFilter in reports/repository.ts. `"custom"` doesn't filter by itself — selecting it
 * reveals a date-range picker (see `FilterModal`) that sets `expiryDateFrom`/`expiryDateTo`.
 */
export function useExpiryTierOptions(): ExpiryTierOption[] {
  const t = useTranslations("Reports.stock")

  return useMemo<ExpiryTierOption[]>(
    () => [
      { id: "expired", label: t("expiryTierExpired") },
      { id: "lte30", label: t("expiryTierLte30") },
      { id: "31to60", label: t("expiryTier31to60") },
      { id: "61to90", label: t("expiryTier61to90") },
      { id: "gt90", label: t("expiryTierGt90") },
      { id: "none", label: t("expiryTierNone") },
      { id: "custom", label: t("expiryTierCustom") },
    ],
    [t],
  )
}

type ExpiryTierFilterProps = {
  value?: ExpiryTier
  onChange: (expiryTier: ExpiryTier | undefined) => void
}

/** Shared Expiry filter dropdown (Stock Report). */
export function ExpiryTierFilter({ value, onChange }: ExpiryTierFilterProps) {
  const t = useTranslations("Reports.stock")
  const expiryTierOptions = useExpiryTierOptions()
  const selected = expiryTierOptions.find((option) => option.id === value)

  return (
    <CustomSelectFilter<ExpiryTierOption>
      ariaLabel={t("expiry")}
      data={expiryTierOptions}
      value={selected}
      onChange={(next) => {
        const option = Array.isArray(next) ? next[0] : next
        onChange(option?.id)
      }}
      displayKey="label"
      idKey="id"
      placeholder={t("expiryTierPlaceholder")}
    />
  )
}
