"use client"

import { useMemo, useState } from "react"

import { CustomFilterBar, CustomPageHeader, CustomSearchFilter, CustomSelectFilter, CustomTable } from "@/components/ui"
import { useCursorPagination } from "@/hooks/use-cursor-pagination"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { useBranches, useCompanies, usePurchaseDetail } from "../hooks/use-reports"
import type { Branch, PurchaseDetailRow, ReportFilters, SchemeTier } from "../types"

type CompanyOption = { id: string; label: string }
type SchemeTierOption = { id: SchemeTier; label: string }

// Fixed tiers — not fetched, scheme % is a continuous number so a dropdown needs preset
// buckets rather than one option per distinct value. Boundaries must match the backend's
// schemeTierFilter in reports/repository.ts.
const SCHEME_TIER_OPTIONS: SchemeTierOption[] = [
  { id: "none", label: "No Scheme" },
  { id: "lt5", label: "< 5%" },
  { id: "5to10", label: "5% – 10%" },
  { id: "10to20", label: "10% – 20%" },
  { id: "20to30", label: "20% – 30%" },
  { id: "30to50", label: "30% – 50%" },
  { id: "50to100", label: "50% – 100%" },
  { id: "gte100", label: "100%+" },
]

export function PurchaseReportPage() {
  const [filters, setFilters] = useState<ReportFilters>({})
  const pagination = useCursorPagination()
  const { data, isLoading } = usePurchaseDetail(filters, { cursor: pagination.cursor, pageSize: pagination.pageSize })
  const { data: branches } = useBranches()
  const { data: companies } = useCompanies()

  const companyOptions = useMemo<CompanyOption[]>(() => (companies ?? []).map((company) => ({ id: company, label: company })), [companies])
  const selectedCompany = companyOptions.find((option) => option.id === filters.company)
  const selectedBranch = branches?.find((branch) => branch.id === filters.branchId)
  const selectedSchemeTier = SCHEME_TIER_OPTIONS.find((option) => option.id === filters.schemeTier)

  const updateFilters = (updater: (prev: ReportFilters) => ReportFilters) => {
    setFilters(updater)
    pagination.reset()
  }

  return (
    <div className="space-y-4">
      <CustomPageHeader title="Purchase Report" description="Item-wise purchase detail, including the scheme % implied by free quantity received on each line." />

      <CustomSearchFilter
        placeholder="Search item..."
        value={filters.item}
        onChange={(value) => updateFilters((prev) => ({ ...prev, item: value || undefined }))}
      />
      <CustomFilterBar className="sm:grid-cols-1! md:grid-cols-3!">
        <CustomSelectFilter<Branch>
          ariaLabel="Branch"
          data={branches ?? []}
          value={selectedBranch}
          onChange={(value) => {
            const branch = Array.isArray(value) ? value[0] : value
            updateFilters((prev) => ({ ...prev, branchId: branch?.id }))
          }}
          displayKey="name"
          idKey="id"
          placeholder="All branches"
        />
        <CustomSelectFilter<CompanyOption>
          ariaLabel="Company"
          data={companyOptions}
          value={selectedCompany}
          onChange={(value) => {
            const option = Array.isArray(value) ? value[0] : value
            updateFilters((prev) => ({ ...prev, company: option?.id }))
          }}
          displayKey="label"
          idKey="id"
          placeholder="All companies"
        />
        <CustomSelectFilter<SchemeTierOption>
          ariaLabel="Scheme %"
          data={SCHEME_TIER_OPTIONS}
          value={selectedSchemeTier}
          onChange={(value) => {
            const option = Array.isArray(value) ? value[0] : value
            updateFilters((prev) => ({ ...prev, schemeTier: option?.id }))
          }}
          displayKey="label"
          idKey="id"
          placeholder="All scheme %"
        />
      </CustomFilterBar>

      <CustomTable<PurchaseDetailRow>
        columns={[
          { key: "itemNameRaw", label: "Item", sortable: true },
          { key: "supplierGroup", label: "Supplier", sortable: true },
          { key: "company", label: "Company" },
          { key: "qty", label: "Qty" },
          { key: "freeQty", label: "Free Qty" },
          { key: "rate", label: "Rate" },
          { key: "amount", label: "Amount", sortable: true },
          { key: "schemePct", label: "Scheme %" },
        ]}
        data={data?.data ?? []}
        loading={isLoading}
        rowKey="id"
        itemId="id"
        totalItems={data?.meta?.total ?? 0}
        emptyText="No purchase data — import a Purchase Register file first."
        onRowsPerPageChange={pagination.setPageSize}
        cursorPagination={{
          page: pagination.page,
          totalPages: data?.meta?.totalPages,
          hasNextPage: data?.meta?.hasNextPage ?? false,
          hasPreviousPage: pagination.page > 1,
          onNext: () => pagination.goNext(data?.meta?.nextCursor ?? null),
          onPrevious: pagination.goPrevious,
        }}
        renderCustomCell={(row, key) => {
          if (key === "rate" || key === "amount") return row[key] === null ? "-" : formatCurrency(row[key] as number)
          if (key === "qty" || key === "freeQty") return row[key] === null ? "-" : formatNumber(row[key] as number)
          if (key === "schemePct") return row.schemePct === null ? "-" : `${row.schemePct.toFixed(2)}%`
          if (key === "company") return row.company ?? "-"
          return row[key]
        }}
      />
    </div>
  )
}
