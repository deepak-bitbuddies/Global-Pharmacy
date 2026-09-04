import type { CursorPaginationParams } from "@/types/pagination"
import type { PurchaseAnalysisFilters } from "../types"

export const purchaseAnalysisQueryKeys = {
  lines: (filters: PurchaseAnalysisFilters, pagination: CursorPaginationParams) => ["purchase-analysis", "lines", filters, pagination] as const,
  summary: (filters: PurchaseAnalysisFilters) => ["purchase-analysis", "summary", filters] as const,
  parties: ["purchase-analysis", "parties"] as const,
  items: ["purchase-analysis", "items"] as const,
  companies: ["purchase-analysis", "companies"] as const,
  branches: ["purchase-analysis", "branches"] as const,
  types: ["purchase-analysis", "types"] as const,
  areas: ["purchase-analysis", "areas"] as const,
  routes: ["purchase-analysis", "routes"] as const,
  batches: ["purchase-analysis", "batches"] as const,
  exportJobs: ["purchase-analysis", "export-jobs"] as const,
}
