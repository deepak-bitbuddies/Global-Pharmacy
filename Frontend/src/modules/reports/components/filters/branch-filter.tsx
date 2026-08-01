"use client"

import { useTranslations } from "next-intl"

import { CustomSelectFilter } from "@/components/ui"
import { useBranches } from "../../hooks/use-reports"
import type { Branch } from "../../types"

type BranchFilterProps = {
  value?: string
  onChange: (branchId: string | undefined) => void
}

/** Shared Branch filter dropdown — wraps `useBranches()` + the "All branches" select so every report/dashboard page wires it up identically. */
export function BranchFilter({ value, onChange }: BranchFilterProps) {
  const tCommon = useTranslations("Common")
  const { data: branches } = useBranches()
  const selectedBranch = branches?.find((branch) => branch.id === value)

  return (
    <CustomSelectFilter<Branch>
      ariaLabel={tCommon("branch")}
      data={branches ?? []}
      value={selectedBranch}
      onChange={(next) => {
        const branch = Array.isArray(next) ? next[0] : next
        onChange(branch?.id)
      }}
      displayKey="name"
      idKey="id"
      placeholder={tCommon("allBranches")}
    />
  )
}
