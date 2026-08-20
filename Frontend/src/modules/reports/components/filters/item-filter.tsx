"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import { CustomSelectFilter } from "@/components/ui"
import { useItems } from "../../hooks/use-reports"

type ItemOptionRow = { id: string; label: string }

type ItemFilterProps = {
  value?: string[]
  onChange: (item: string[] | undefined) => void
}

/** Shared Item filter — multi-select of exact item names (from the `items` table), replacing the old free-text search box. Same shape as `CompanyFilter`, backed by `useItems()`, deduped to distinct names since the filter matches by name only (company doesn't disambiguate for filtering purposes). */
export function ItemFilter({ value, onChange }: ItemFilterProps) {
  const tCommon = useTranslations("Common")
  const { data: items } = useItems()
  const options = useMemo<ItemOptionRow[]>(() => {
    const names = [...new Set((items ?? []).map((item) => item.name))]
    return names.map((name) => ({ id: name, label: name }))
  }, [items])
  const selected = options.filter((option) => value?.includes(option.id))

  return (
    <CustomSelectFilter<ItemOptionRow>
      multiple
      ariaLabel={tCommon("item")}
      data={options}
      value={selected}
      onChange={(next) => onChange(next.length > 0 ? next.map((option) => option.id) : undefined)}
      displayKey="label"
      idKey="id"
      placeholder={tCommon("allItems")}
    />
  )
}
