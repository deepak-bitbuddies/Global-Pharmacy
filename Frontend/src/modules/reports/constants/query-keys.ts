import type { CursorPaginationParams } from "@/types/pagination"
import type { ReportFilters } from "../types"

export const reportsQueryKeys = {
  branches: ["reports", "branches"] as const,
  companies: ["reports", "companies"] as const,
  dashboardSummary: (filters: ReportFilters) => ["reports", "dashboard-summary", filters] as const,
  itemWiseSales: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "item-wise-sales", filters, pagination] as const,
  branchSales: (filters: ReportFilters) => ["reports", "branch-sales", filters] as const,
  grossProfit: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "gross-profit", filters, pagination] as const,
  purchaseSummary: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "purchase-summary", filters, pagination] as const,
  purchaseDetail: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "purchase-detail", filters, pagination] as const,
  stock: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "stock", filters, pagination] as const,
  stockSummary: (filters: ReportFilters) => ["reports", "stock-summary", filters] as const,
  stockByCompany: (filters: ReportFilters) => ["reports", "stock-by-company", filters] as const,
  zeroOrderAlerts: (filters: ReportFilters) => ["reports", "zero-order-alerts", filters] as const,
  expiry: (filters: ReportFilters & { withinDays?: number }) => ["reports", "expiry", filters] as const,
  nonMoving: (filters: ReportFilters) => ["reports", "non-moving", filters] as const,
  dailyCollection: (filters: ReportFilters) => ["reports", "daily-collection", filters] as const,
  daySalesDetail: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "day-sales-detail", filters, pagination] as const,
  cashInHand: (filters: ReportFilters) => ["reports", "cash-in-hand", filters] as const,
  outstanding: (filters: ReportFilters) => ["reports", "outstanding", filters] as const,
  importBatches: (branchId?: string, fileType?: string) => ["reports", "import-batches", branchId, fileType] as const,
  uploadCycleStatus: (branchId?: string) => ["reports", "upload-cycle-status", branchId] as const,
}
