"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { FunnelIcon } from "@phosphor-icons/react"

import { ButtonVariant, CustomButton, CustomModal } from "@/components/ui"
import type { ReportFilters } from "../../types"
import type { ReportFilterFlags } from "./report-filter-panel"
import { BranchFilter } from "./branch-filter"
import { CompanyFilter } from "./company-filter"
import { SupplierFilter } from "./supplier-filter"
import { SupplierGroupFilter } from "./supplier-group-filter"
import { ReportDateRangeFilter } from "./date-range-filter"
import { NumberRangeFilter } from "./number-range-filter"
import { ExpiryTierFilter } from "./expiry-tier-filter"
import { SchemeTierFilter } from "./scheme-tier-filter"

type FilterModalProps = {
  filters: ReportFilters
  onFiltersChange: (updater: (prev: ReportFilters) => ReportFilters) => void
  show: ReportFilterFlags
  activeCount: number
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {children}
    </div>
  )
}

/**
 * Every filter except search (that stays on the page, always visible via `ReportFilterPanel`)
 * lives here: a "Filters" button that opens a modal, edited as a local draft and only committed
 * on Apply — Cancel discards it. The draft is re-seeded from the live `filters` right in the
 * button's click handler (not a `useEffect` sync), so reopening always starts from what's
 * actually applied.
 */
export function FilterModal({ filters, onFiltersChange, show, activeCount }: FilterModalProps) {
  const t = useTranslations()
  const tCommon = useTranslations("Common")
  const tPurchase = useTranslations("Reports.purchase")
  const tStock = useTranslations("Reports.stock")
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<ReportFilters>(filters)

  return (
    <>
      <CustomButton
        variant={ButtonVariant.primary}
        startContent={<FunnelIcon className="size-4" />}
        onClick={() => {
          setDraft(filters)
          setIsOpen(true)
        }}
      >
        {t("Filters")}
        {activeCount > 0 ? ` (${activeCount})` : ""}
      </CustomButton>

      <CustomModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={t("Filters")}
        negativeText={t("Cancel")}
        onNegativePress={() => setIsOpen(false)}
        positiveText={t("Apply")}
        onPositivePress={() => {
          onFiltersChange(() => draft)
          setIsOpen(false)
        }}
      >
        <div className="space-y-4">
          {show.branch && (
            <FilterField label={tCommon("branch")}>
              <BranchFilter value={draft.branchId} onChange={(branchId) => setDraft((prev) => ({ ...prev, branchId }))} />
            </FilterField>
          )}
          {show.company && (
            <FilterField label={tCommon("company")}>
              <CompanyFilter value={draft.company} onChange={(company) => setDraft((prev) => ({ ...prev, company }))} />
            </FilterField>
          )}
          {show.schemeTier && (
            <FilterField label={tPurchase("schemePct")}>
              <SchemeTierFilter value={draft.schemeTier} onChange={(schemeTier) => setDraft((prev) => ({ ...prev, schemeTier }))} />
            </FilterField>
          )}
          {show.expiryTier && (
            <FilterField label={tStock("expiry")}>
              <ExpiryTierFilter value={draft.expiryTier} onChange={(expiryTier) => setDraft((prev) => ({ ...prev, expiryTier }))} />
            </FilterField>
          )}
          {show.expiryTier && draft.expiryTier === "custom" && (
            <FilterField label={tStock("expiryTierCustom")}>
              <ReportDateRangeFilter
                label=""
                dateFrom={draft.expiryDateFrom}
                dateTo={draft.expiryDateTo}
                onChange={({ dateFrom, dateTo }) => setDraft((prev) => ({ ...prev, expiryDateFrom: dateFrom, expiryDateTo: dateTo }))}
              />
            </FilterField>
          )}
          {show.dateRange && (
            <FilterField label={tCommon("dateRange")}>
              <ReportDateRangeFilter
                label=""
                dateFrom={draft.dateFrom}
                dateTo={draft.dateTo}
                onChange={({ dateFrom, dateTo }) => setDraft((prev) => ({ ...prev, dateFrom, dateTo }))}
              />
            </FilterField>
          )}
          {show.supplier && (
            <FilterField label={tStock("supplier")}>
              <SupplierFilter value={draft.supplier} onChange={(supplier) => setDraft((prev) => ({ ...prev, supplier }))} />
            </FilterField>
          )}
          {show.stockRange && (
            <FilterField label={tStock("stockRange")}>
              <NumberRangeFilter
                from={draft.stockFrom}
                to={draft.stockTo}
                onChange={({ from, to }) => setDraft((prev) => ({ ...prev, stockFrom: from, stockTo: to }))}
                fromLabel={tStock("minStock")}
                toLabel={tStock("maxStock")}
              />
            </FilterField>
          )}
          {show.supplierGroup && (
            <FilterField label={tPurchase("supplier")}>
              <SupplierGroupFilter value={draft.supplierGroup} onChange={(supplierGroup) => setDraft((prev) => ({ ...prev, supplierGroup }))} />
            </FilterField>
          )}
          {show.amountRange && (
            <FilterField label={tCommon("amountRange")}>
              <NumberRangeFilter
                from={draft.amountFrom}
                to={draft.amountTo}
                onChange={({ from, to }) => setDraft((prev) => ({ ...prev, amountFrom: from, amountTo: to }))}
                fromLabel={tCommon("minAmount")}
                toLabel={tCommon("maxAmount")}
              />
            </FilterField>
          )}
        </div>
      </CustomModal>
    </>
  )
}
