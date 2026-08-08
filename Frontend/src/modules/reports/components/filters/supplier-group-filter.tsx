"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import { CustomSelectFilter } from "@/components/ui"
import { useSupplierGroups } from "../../hooks/use-reports"

type SupplierGroupOption = { id: string; label: string }

type SupplierGroupFilterProps = {
  value?: string
  onChange: (supplierGroup: string | undefined) => void
}

/** Shared Supplier Group filter dropdown (Purchase only — its equivalent of Sales' party grouping) — same shape as `CompanyFilter`, backed by `useSupplierGroups()`. */
export function SupplierGroupFilter({ value, onChange }: SupplierGroupFilterProps) {
  const tPurchase = useTranslations("Reports.purchase")
  const tCommon = useTranslations("Common")
  const { data: supplierGroups } = useSupplierGroups()
  const options = useMemo<SupplierGroupOption[]>(() => (supplierGroups ?? []).map((group) => ({ id: group, label: group })), [supplierGroups])
  const selected = options.find((option) => option.id === value)

  return (
    <CustomSelectFilter<SupplierGroupOption>
      ariaLabel={tPurchase("supplier")}
      data={options}
      value={selected}
      onChange={(next) => {
        const option = Array.isArray(next) ? next[0] : next
        onChange(option?.id)
      }}
      displayKey="label"
      idKey="id"
      placeholder={tCommon("allSupplierGroups")}
    />
  )
}
