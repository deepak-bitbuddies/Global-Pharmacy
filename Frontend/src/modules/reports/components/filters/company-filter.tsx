"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import { CustomSelectFilter } from "@/components/ui"
import { useCompanies } from "../../hooks/use-reports"

type CompanyOption = { id: string; label: string }

type CompanyFilterProps = {
  value?: string[]
  onChange: (company: string[] | undefined) => void
}

/** Shared Company filter — wraps `useCompanies()` behind a multi-select so every report/dashboard page wires it up identically. */
export function CompanyFilter({ value, onChange }: CompanyFilterProps) {
  const tCommon = useTranslations("Common")
  const { data: companies } = useCompanies()
  const companyOptions = useMemo<CompanyOption[]>(() => (companies ?? []).map((company) => ({ id: company, label: company })), [companies])
  const selected = companyOptions.filter((option) => value?.includes(option.id))

  return (
    <CustomSelectFilter<CompanyOption>
      multiple
      ariaLabel={tCommon("company")}
      data={companyOptions}
      value={selected}
      onChange={(next) => onChange(next.length > 0 ? next.map((option) => option.id) : undefined)}
      displayKey="label"
      idKey="id"
      placeholder={tCommon("allCompanies")}
    />
  )
}
