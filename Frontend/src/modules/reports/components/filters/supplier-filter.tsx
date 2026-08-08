"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import { CustomSelectFilter } from "@/components/ui"
import { useSuppliers } from "../../hooks/use-reports"

type SupplierOption = { id: string; label: string }

type SupplierFilterProps = {
  value?: string
  onChange: (supplier: string | undefined) => void
}

/** Shared Supplier filter dropdown (Stock only — Supplier is a per-batch/per-receipt fact, not something Sales/Purchase carry) — same shape as `CompanyFilter`, backed by `useSuppliers()`. */
export function SupplierFilter({ value, onChange }: SupplierFilterProps) {
  const tStock = useTranslations("Reports.stock")
  const { data: suppliers } = useSuppliers()
  const options = useMemo<SupplierOption[]>(() => (suppliers ?? []).map((supplier) => ({ id: supplier, label: supplier })), [suppliers])
  const selected = options.find((option) => option.id === value)

  return (
    <CustomSelectFilter<SupplierOption>
      ariaLabel={tStock("supplier")}
      data={options}
      value={selected}
      onChange={(next) => {
        const option = Array.isArray(next) ? next[0] : next
        onChange(option?.id)
      }}
      displayKey="label"
      idKey="id"
      placeholder={tStock("allSuppliers")}
    />
  )
}
