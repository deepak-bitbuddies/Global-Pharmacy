"use client"

import { useTranslations } from "next-intl"

import { CustomFilterField, CustomFilterModal } from "@/components/ui"
import type { ReportFilters } from "../../types"
import type { ReportFilterFlags } from "./report-filter-panel"
import { BranchFilter } from "./branch-filter"
import { CollectionModeFilter } from "./collection-mode-filter"
import { CompanyFilter } from "./company-filter"
import { ItemFilter } from "./item-filter"
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

/**
 * Every filter except search (that stays on the page, always visible via `ReportFilterPanel`)
 * lives here, laid out via the shared `CustomFilterModal` shell (staged draft, Apply/Cancel).
 */
export function FilterModal({ filters, onFiltersChange, show, activeCount }: FilterModalProps) {
  const tCommon = useTranslations("Common")
  const tPurchase = useTranslations("Reports.purchase")
  const tStock = useTranslations("Reports.stock")
  const tSales = useTranslations("Reports.sales")

  return (
    <CustomFilterModal<ReportFilters> filters={filters} activeCount={activeCount} onApply={(next) => onFiltersChange(() => next)}>
      {(draft, setDraft) => (
        <>
          {show.item && (
            <CustomFilterField label={tCommon("item")}>
              <ItemFilter value={draft.item} onChange={(item) => setDraft((prev) => ({ ...prev, item }))} />
            </CustomFilterField>
          )}
          {show.branch && (
            <CustomFilterField label={tCommon("branch")}>
              <BranchFilter value={draft.branchId} onChange={(branchId) => setDraft((prev) => ({ ...prev, branchId }))} />
            </CustomFilterField>
          )}
          {show.company && (
            <CustomFilterField label={tCommon("company")}>
              <CompanyFilter value={draft.company} onChange={(company) => setDraft((prev) => ({ ...prev, company }))} />
            </CustomFilterField>
          )}
          {show.schemeTier && (
            <CustomFilterField label={tPurchase("schemePct")}>
              <SchemeTierFilter value={draft.schemeTier} onChange={(schemeTier) => setDraft((prev) => ({ ...prev, schemeTier }))} />
            </CustomFilterField>
          )}
          {show.expiryTier && (
            <CustomFilterField label={tStock("expiry")}>
              <ExpiryTierFilter value={draft.expiryTier} onChange={(expiryTier) => setDraft((prev) => ({ ...prev, expiryTier }))} />
            </CustomFilterField>
          )}
          {show.expiryTier && draft.expiryTier === "custom" && (
            <CustomFilterField label={tStock("expiryTierCustom")}>
              <ReportDateRangeFilter
                label=""
                dateFrom={draft.expiryDateFrom}
                dateTo={draft.expiryDateTo}
                onChange={({ dateFrom, dateTo }) => setDraft((prev) => ({ ...prev, expiryDateFrom: dateFrom, expiryDateTo: dateTo }))}
              />
            </CustomFilterField>
          )}
          {show.dateRange && (
            <CustomFilterField label={tCommon("dateRange")}>
              <ReportDateRangeFilter
                label=""
                dateFrom={draft.dateFrom}
                dateTo={draft.dateTo}
                onChange={({ dateFrom, dateTo }) => setDraft((prev) => ({ ...prev, dateFrom, dateTo }))}
              />
            </CustomFilterField>
          )}
          {show.supplier && (
            <CustomFilterField label={tStock("supplier")}>
              <SupplierFilter value={draft.supplier} onChange={(supplier) => setDraft((prev) => ({ ...prev, supplier }))} />
            </CustomFilterField>
          )}
          {show.stockRange && (
            <CustomFilterField label={tStock("stockRange")}>
              <NumberRangeFilter
                from={draft.stockFrom}
                to={draft.stockTo}
                onChange={({ from, to }) => setDraft((prev) => ({ ...prev, stockFrom: from, stockTo: to }))}
                fromLabel={tStock("minStock")}
                toLabel={tStock("maxStock")}
              />
            </CustomFilterField>
          )}
          {show.supplierGroup && (
            <CustomFilterField label={tPurchase("supplier")}>
              <SupplierGroupFilter value={draft.supplierGroup} onChange={(supplierGroup) => setDraft((prev) => ({ ...prev, supplierGroup }))} />
            </CustomFilterField>
          )}
          {show.amountRange && (
            <CustomFilterField label={tCommon("amountRange")}>
              <NumberRangeFilter
                from={draft.amountFrom}
                to={draft.amountTo}
                onChange={({ from, to }) => setDraft((prev) => ({ ...prev, amountFrom: from, amountTo: to }))}
                fromLabel={tCommon("minAmount")}
                toLabel={tCommon("maxAmount")}
              />
            </CustomFilterField>
          )}
          {show.collectionMode && (
            <CustomFilterField label={tSales("mode")}>
              <CollectionModeFilter value={draft.collectionMode} onChange={(collectionMode) => setDraft((prev) => ({ ...prev, collectionMode }))} />
            </CustomFilterField>
          )}
        </>
      )}
    </CustomFilterModal>
  )
}
