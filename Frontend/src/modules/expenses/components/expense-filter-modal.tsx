"use client"

import { useTranslations } from "next-intl"

import { CustomFilterField, CustomFilterModal, CustomSelectFilter } from "@/components/ui"
import { BranchFilter, ReportDateRangeFilter } from "@/modules/reports/components/filters"
import { ExpenseType } from "../types"
import type { ExpenseFilters } from "../types"

type ExpenseFilterModalProps = {
  filters: ExpenseFilters
  onFiltersChange: (updater: (prev: ExpenseFilters) => ExpenseFilters) => void
  isSuperAdmin: boolean
  activeCount: number
}

/** Every filter except search (that stays on the page, always visible) lives here — same shared `CustomFilterModal` shell (staged draft, Apply/Cancel, responsive 2-column grid) the Reports module uses, so both feel and behave identically. */
export function ExpenseFilterModal({ filters, onFiltersChange, isSuperAdmin, activeCount }: ExpenseFilterModalProps) {
  const t = useTranslations("ExpenseTracker")
  const tCommon = useTranslations("Common")

  const typeOptions = [
    { id: ExpenseType.Expense, label: t("typeExpense") },
    { id: ExpenseType.Credit, label: t("typeCredit") },
    { id: ExpenseType.HandoverCash, label: t("typeHandoverCash") },
    { id: ExpenseType.HandoverBank, label: t("typeHandoverBank") },
  ]

  return (
    <CustomFilterModal<ExpenseFilters> filters={filters} activeCount={activeCount} onApply={(next) => onFiltersChange(() => next)}>
      {(draft, setDraft) => (
        <>
          {isSuperAdmin && (
            <CustomFilterField label={t("branch")}>
              <BranchFilter value={draft.branchId} onChange={(branchId) => setDraft((prev) => ({ ...prev, branchId }))} />
            </CustomFilterField>
          )}
          <CustomFilterField label={t("type")}>
            <CustomSelectFilter
              multiple
              data={typeOptions}
              value={typeOptions.filter((option) => draft.type?.includes(option.id))}
              onChange={(items) => setDraft((prev) => ({ ...prev, type: items.length > 0 ? items.map((item) => item.id) : undefined }))}
              displayKey="label"
              idKey="id"
              placeholder={t("filterByType")}
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
        </>
      )}
    </CustomFilterModal>
  )
}
