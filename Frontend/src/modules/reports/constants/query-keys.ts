import type { ReportFilters } from "../types"

export const reportsQueryKeys = {
  branches: ["reports", "branches"] as const,
  companies: ["reports", "companies"] as const,
  dashboardSummary: (filters: ReportFilters) => ["reports", "dashboard-summary", filters] as const,
  itemWiseSales: (filters: ReportFilters) => ["reports", "item-wise-sales", filters] as const,
  branchSales: (filters: ReportFilters) => ["reports", "branch-sales", filters] as const,
  grossProfit: (filters: ReportFilters) => ["reports", "gross-profit", filters] as const,
  purchaseSummary: (filters: ReportFilters) => ["reports", "purchase-summary", filters] as const,
  stock: (filters: ReportFilters) => ["reports", "stock", filters] as const,
  zeroOrderAlerts: (filters: ReportFilters) => ["reports", "zero-order-alerts", filters] as const,
  expiry: (filters: ReportFilters & { withinDays?: number }) => ["reports", "expiry", filters] as const,
  nonMoving: (filters: ReportFilters) => ["reports", "non-moving", filters] as const,
  dailyCollection: (filters: ReportFilters) => ["reports", "daily-collection", filters] as const,
  cashInHand: (filters: ReportFilters) => ["reports", "cash-in-hand", filters] as const,
  outstanding: (filters: ReportFilters) => ["reports", "outstanding", filters] as const,
  importBatches: ["reports", "import-batches"] as const,
}
