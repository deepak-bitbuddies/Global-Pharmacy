"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"

import {
  ButtonVariant,
  CustomButton,
  CustomChip,
  CustomFilterField,
  CustomFilterModal,
  CustomSearchFilter,
  CustomSelectFilter,
} from "@/components/ui"
import { NumberRangeFilter, ReportDateRangeFilter } from "@/modules/reports/components/filters"
import {
  usePurchaseAnalysisAreas,
  usePurchaseAnalysisCompanies,
  usePurchaseAnalysisItems,
  usePurchaseAnalysisParties,
  usePurchaseAnalysisRoutes,
  usePurchaseAnalysisTypes,
} from "../hooks/use-purchase-analysis"
import type { PurchaseAnalysisFilters } from "../types"

type StringOption = { id: string; label: string }
const toOptions = (values: string[] | undefined): StringOption[] => (values ?? []).map((value) => ({ id: value, label: value }))

/** A generic "pick from every value that's ever appeared in this column" multi-select — the same shape repeated for Party/Item/Company/Type/Area/Route, so it's one small component instead of six near-identical ones. */
function DistinctValueFilter({
  options,
  value,
  onChange,
  placeholder,
  ariaLabel,
}: {
  options: string[] | undefined
  value: string[] | undefined
  onChange: (next: string[] | undefined) => void
  placeholder: string
  ariaLabel: string
}) {
  const opts = useMemo(() => toOptions(options), [options])
  const selected = opts.filter((option) => value?.includes(option.id))
  return (
    <CustomSelectFilter<StringOption>
      multiple
      ariaLabel={ariaLabel}
      data={opts}
      value={selected}
      onChange={(next) => onChange(next.length > 0 ? next.map((option) => option.id) : undefined)}
      displayKey="label"
      idKey="id"
      placeholder={placeholder}
    />
  )
}

type PurchaseAnalysisFilterPanelProps = {
  filters: PurchaseAnalysisFilters
  onFiltersChange: (updater: (prev: PurchaseAnalysisFilters) => PurchaseAnalysisFilters) => void
  /** Rendered at the right end of the search + Filters row — e.g. the Columns toggle. */
  trailingContent?: React.ReactNode
}

export function PurchaseAnalysisFilterPanel({ filters, onFiltersChange, trailingContent }: PurchaseAnalysisFilterPanelProps) {
  const t = useTranslations("PurchaseAnalysis")
  const tCommon = useTranslations("Common")
  const tGlobal = useTranslations()

  const { data: parties } = usePurchaseAnalysisParties()
  const { data: items } = usePurchaseAnalysisItems()
  const { data: companies } = usePurchaseAnalysisCompanies()
  const { data: types } = usePurchaseAnalysisTypes()
  const { data: areas } = usePurchaseAnalysisAreas()
  const { data: routes } = usePurchaseAnalysisRoutes()

  const activeCount = [
    filters.partyName?.length,
    filters.itemName?.length,
    filters.company?.length,
    filters.type?.length,
    filters.area?.length,
    filters.route?.length,
    filters.dateFrom && filters.dateTo,
    filters.amountFrom !== undefined || filters.amountTo !== undefined,
    filters.qtyFrom !== undefined || filters.qtyTo !== undefined,
  ].filter(Boolean).length

  function removeFromArray(key: "partyName" | "itemName" | "company" | "type" | "area" | "route", value: string) {
    onFiltersChange((prev) => {
      const next = (prev[key] ?? []).filter((v) => v !== value)
      return { ...prev, [key]: next.length > 0 ? next : undefined }
    })
  }

  const rangeLabel = (from: number | undefined, to: number | undefined): string => {
    if (from !== undefined && to !== undefined) return `${from} – ${to}`
    if (from !== undefined) return `≥ ${from}`
    return `≤ ${to}`
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-52 flex-1">
          <CustomSearchFilter
            value={filters.search ?? ""}
            onChange={(value) => onFiltersChange((prev) => ({ ...prev, search: value || undefined }))}
            placeholder={t("searchPlaceholder")}
          />
        </div>

        <CustomFilterModal<PurchaseAnalysisFilters> filters={filters} activeCount={activeCount} onApply={(next) => onFiltersChange(() => next)}>
          {(draft, setDraft) => (
            <>
              <CustomFilterField label={t("party")}>
                <DistinctValueFilter
                  options={parties}
                  value={draft.partyName}
                  onChange={(partyName) => setDraft((prev) => ({ ...prev, partyName }))}
                  placeholder={t("filterByParty")}
                  ariaLabel={t("party")}
                />
              </CustomFilterField>
              <CustomFilterField label={tCommon("item")}>
                <DistinctValueFilter
                  options={items}
                  value={draft.itemName}
                  onChange={(itemName) => setDraft((prev) => ({ ...prev, itemName }))}
                  placeholder={t("filterByItem")}
                  ariaLabel={tCommon("item")}
                />
              </CustomFilterField>
              <CustomFilterField label={tCommon("company")}>
                <DistinctValueFilter
                  options={companies}
                  value={draft.company}
                  onChange={(company) => setDraft((prev) => ({ ...prev, company }))}
                  placeholder={t("filterByCompany")}
                  ariaLabel={tCommon("company")}
                />
              </CustomFilterField>
              <CustomFilterField label={t("type")}>
                <DistinctValueFilter
                  options={types}
                  value={draft.type}
                  onChange={(type) => setDraft((prev) => ({ ...prev, type }))}
                  placeholder={t("filterByType")}
                  ariaLabel={t("type")}
                />
              </CustomFilterField>
              <CustomFilterField label={t("area")}>
                <DistinctValueFilter
                  options={areas}
                  value={draft.area}
                  onChange={(area) => setDraft((prev) => ({ ...prev, area }))}
                  placeholder={t("filterByArea")}
                  ariaLabel={t("area")}
                />
              </CustomFilterField>
              <CustomFilterField label={t("route")}>
                <DistinctValueFilter
                  options={routes}
                  value={draft.route}
                  onChange={(route) => setDraft((prev) => ({ ...prev, route }))}
                  placeholder={t("filterByRoute")}
                  ariaLabel={t("route")}
                />
              </CustomFilterField>
              <CustomFilterField label={tCommon("dateRange")}>
                <ReportDateRangeFilter
                  label=""
                  dateFrom={draft.dateFrom}
                  dateTo={draft.dateTo}
                  onChange={({ dateFrom, dateTo }) => setDraft((prev) => ({ ...prev, dateFrom, dateTo }))}
                />
              </CustomFilterField>
              <CustomFilterField label={tCommon("amountRange")}>
                <NumberRangeFilter
                  from={draft.amountFrom}
                  to={draft.amountTo}
                  onChange={({ from, to }) => setDraft((prev) => ({ ...prev, amountFrom: from, amountTo: to }))}
                  fromLabel={tCommon("minAmount")}
                  toLabel={tCommon("maxAmount")}
                />
              </CustomFilterField>
              <CustomFilterField label={t("qtyRange")}>
                <NumberRangeFilter
                  from={draft.qtyFrom}
                  to={draft.qtyTo}
                  onChange={({ from, to }) => setDraft((prev) => ({ ...prev, qtyFrom: from, qtyTo: to }))}
                  fromLabel={t("minQty")}
                  toLabel={t("maxQty")}
                />
              </CustomFilterField>
            </>
          )}
        </CustomFilterModal>

        {trailingContent}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(filters.partyName ?? []).map((value) => (
          <CustomChip key={`party:${value}`} onClose={() => removeFromArray("partyName", value)}>
            {t("party")}: {value}
          </CustomChip>
        ))}
        {(filters.itemName ?? []).map((value) => (
          <CustomChip key={`item:${value}`} onClose={() => removeFromArray("itemName", value)}>
            {tCommon("item")}: {value}
          </CustomChip>
        ))}
        {(filters.company ?? []).map((value) => (
          <CustomChip key={`company:${value}`} onClose={() => removeFromArray("company", value)}>
            {tCommon("company")}: {value}
          </CustomChip>
        ))}
        {(filters.type ?? []).map((value) => (
          <CustomChip key={`type:${value}`} onClose={() => removeFromArray("type", value)}>
            {t("type")}: {value}
          </CustomChip>
        ))}
        {(filters.area ?? []).map((value) => (
          <CustomChip key={`area:${value}`} onClose={() => removeFromArray("area", value)}>
            {t("area")}: {value}
          </CustomChip>
        ))}
        {(filters.route ?? []).map((value) => (
          <CustomChip key={`route:${value}`} onClose={() => removeFromArray("route", value)}>
            {t("route")}: {value}
          </CustomChip>
        ))}
        {filters.dateFrom && filters.dateTo && (
          <CustomChip onClose={() => onFiltersChange((prev) => ({ ...prev, dateFrom: undefined, dateTo: undefined }))}>
            {tCommon("dateRange")}: {filters.dateFrom} – {filters.dateTo}
          </CustomChip>
        )}
        {(filters.amountFrom !== undefined || filters.amountTo !== undefined) && (
          <CustomChip onClose={() => onFiltersChange((prev) => ({ ...prev, amountFrom: undefined, amountTo: undefined }))}>
            {tCommon("amountRange")}: {rangeLabel(filters.amountFrom, filters.amountTo)}
          </CustomChip>
        )}
        {(filters.qtyFrom !== undefined || filters.qtyTo !== undefined) && (
          <CustomChip onClose={() => onFiltersChange((prev) => ({ ...prev, qtyFrom: undefined, qtyTo: undefined }))}>
            {t("qtyRange")}: {rangeLabel(filters.qtyFrom, filters.qtyTo)}
          </CustomChip>
        )}
        {activeCount > 0 && (
          <CustomButton variant={ButtonVariant.ghost} className="h-8 px-2 text-xs" onClick={() => onFiltersChange(() => ({}))}>
            {tGlobal("ClearAllFilters")}
          </CustomButton>
        )}
      </div>
    </div>
  )
}
