"use client"

import { useTranslations } from "next-intl"

import { CustomSelectFilter } from "@/components/ui"
import { useBranches } from "../../hooks/use-reports"
import type { Branch } from "../../types"

type BranchFilterProps = {
  value?: string[]
  onChange: (branchId: string[] | undefined) => void
}

/** Shared Branch filter — wraps `useBranches()` behind a multi-select so every report/dashboard page wires it up identically. */
export function BranchFilter({ value, onChange }: BranchFilterProps) {
  const tCommon = useTranslations("Common")
  const { data: branches } = useBranches()
  const selectedBranches = (branches ?? []).filter((branch) => value?.includes(branch.id))

  return (
    <CustomSelectFilter<Branch>
      multiple
      ariaLabel={tCommon("branch")}
      data={branches ?? []}
      value={selectedBranches}
      onChange={(next) => onChange(next.length > 0 ? next.map((branch) => branch.id) : undefined)}
      displayKey="name"
      idKey="id"
      placeholder={tCommon("allBranches")}
    />
  )
}
