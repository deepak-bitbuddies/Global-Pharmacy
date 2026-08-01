"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import { CustomSelectFilter } from "@/components/ui"
import type { SchemeTier } from "../../types"

type SchemeTierOption = { id: SchemeTier; label: string }

type SchemeTierFilterProps = {
  value?: SchemeTier
  onChange: (schemeTier: SchemeTier | undefined) => void
}

/**
 * Shared Scheme % filter dropdown (Purchase Report). Fixed tiers, not fetched — scheme % is a
 * continuous number so this needs preset buckets rather than one option per distinct value.
 * Boundaries must match the backend's schemeTierFilter in reports/repository.ts.
 */
export function SchemeTierFilter({ value, onChange }: SchemeTierFilterProps) {
  const t = useTranslations("Reports.purchase")

  const schemeTierOptions = useMemo<SchemeTierOption[]>(
    () => [
      { id: "none", label: t("schemeTierNone") },
      { id: "lt5", label: t("schemeTierLt5") },
      { id: "5to10", label: t("schemeTier5to10") },
      { id: "10to20", label: t("schemeTier10to20") },
      { id: "20to30", label: t("schemeTier20to30") },
      { id: "30to50", label: t("schemeTier30to50") },
      { id: "50to100", label: t("schemeTier50to100") },
      { id: "gte100", label: t("schemeTierGte100") },
    ],
    [t],
  )
  const selected = schemeTierOptions.find((option) => option.id === value)

  return (
    <CustomSelectFilter<SchemeTierOption>
      ariaLabel={t("schemePct")}
      data={schemeTierOptions}
      value={selected}
      onChange={(next) => {
        const option = Array.isArray(next) ? next[0] : next
        onChange(option?.id)
      }}
      displayKey="label"
      idKey="id"
      placeholder={t("schemePctPlaceholder")}
    />
  )
}
