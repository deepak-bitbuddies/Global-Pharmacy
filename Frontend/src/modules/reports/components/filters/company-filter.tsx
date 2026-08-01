"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import { CustomSelectFilter } from "@/components/ui"
import { useCompanies } from "../../hooks/use-reports"

type CompanyOption = { id: string; label: string }

type CompanyFilterProps = {
  value?: string
  onChange: (company: string | undefined) => void
}

/** Shared Company filter dropdown — wraps `useCompanies()` + the "All companies" select so every report/dashboard page wires it up identically. */
export function CompanyFilter({ value, onChange }: CompanyFilterProps) {
  const tCommon = useTranslations("Common")
  const { data: companies } = useCompanies()
  const companyOptions = useMemo<CompanyOption[]>(() => (companies ?? []).map((company) => ({ id: company, label: company })), [companies])
  const selectedCompany = companyOptions.find((option) => option.id === value)

  return (
    <CustomSelectFilter<CompanyOption>
      ariaLabel={tCommon("company")}
      data={companyOptions}
      value={selectedCompany}
      onChange={(next) => {
        const option = Array.isArray(next) ? next[0] : next
        onChange(option?.id)
      }}
      displayKey="label"
      idKey="id"
      placeholder={tCommon("allCompanies")}
    />
  )
}
