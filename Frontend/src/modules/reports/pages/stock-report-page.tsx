"use client"

import { useMemo, useState } from "react"

import { CustomFilterBar, CustomPageHeader, CustomSearchFilter, CustomSelectFilter, CustomTable } from "@/components/ui"
import { formatCurrency, formatNumber } from "@/utils/formatting"
import { useCompanies, useStockReport } from "../hooks/use-reports"
import type { ReportFilters, StockRow } from "../types"

type CompanyOption = { id: string; label: string }

export function StockReportPage() {
  const [filters, setFilters] = useState<ReportFilters>({})
  const { data, isLoading } = useStockReport(filters)
  const { data: companies } = useCompanies()

  const companyOptions = useMemo<CompanyOption[]>(() => (companies ?? []).map((company) => ({ id: company, label: company })), [companies])
  const selectedCompany = companyOptions.find((option) => option.id === filters.company)

  return (
    <div className="space-y-4">
      <CustomPageHeader title="Stock Report" description="Current stock by batch, across branches." />

      <CustomFilterBar>
        <CustomSearchFilter
          placeholder="Search item..."
          value={filters.item}
          onChange={(value) => setFilters((prev) => ({ ...prev, item: value || undefined }))}
        />
        <CustomSelectFilter<CompanyOption>
          // label="Company"
          data={companyOptions}
          value={selectedCompany}
          onChange={(value) => {
            const option = Array.isArray(value) ? value[0] : value
            setFilters((prev) => ({ ...prev, company: option?.id }))
          }}
          displayKey="label"
          idKey="id"
          placeholder="All companies"
        />
      </CustomFilterBar>

      <CustomTable<StockRow>
        columns={[
          { key: "itemName", label: "Item", sortable: true },
          { key: "currentStock", label: "Stock", sortable: true },
          { key: "unit", label: "Unit" },
          { key: "value", label: "Value", sortable: true },
          { key: "expDate", label: "Expiry", sortable: true },
          { key: "company", label: "Company" },
          { key: "batch", label: "Batch" },
        ]}
        data={data ?? []}
        loading={isLoading}
        rowKey="id"
        itemId="id"
        totalItems={data?.length ?? 0}
        emptyText="No stock data — import a Stock Register file first."
        renderCustomCell={(row, key) => {
          if (key === "value") return row.value === null ? "-" : formatCurrency(row.value)
          if (key === "currentStock") return formatNumber(row.currentStock)
          return row[key] ?? "-"
        }}
      />
    </div>
  )
}
