import type { CursorPaginationParams } from "@/types/pagination"
import type { ReportFilters, TopNSelection } from "../types"

export const reportsQueryKeys = {
  branches: ["reports", "branches"] as const,
  items: ["reports", "items"] as const,
  companies: ["reports", "companies"] as const,
  suppliers: ["reports", "suppliers"] as const,
  supplierGroups: ["reports", "supplier-groups"] as const,
  dashboardSummary: (filters: ReportFilters) => ["reports", "dashboard-summary", filters] as const,
  itemWiseSales: (filters: ReportFilters, pagination: CursorPaginationParams, direction?: TopNSelection["direction"]) =>
    ["reports", "item-wise-sales", filters, pagination, direction] as const,
  salesDetail: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "sales-detail", filters, pagination] as const,
  branchSales: (filters: ReportFilters) => ["reports", "branch-sales", filters] as const,
  grossProfit: (filters: ReportFilters, pagination: CursorPaginationParams, direction?: TopNSelection["direction"]) =>
    ["reports", "gross-profit", filters, pagination, direction] as const,
  topGrossProfitPercent: (filters: ReportFilters, topN?: TopNSelection) => ["reports", "gross-profit-top-pct", filters, topN] as const,
  topReturns: (filters: ReportFilters, topN?: TopNSelection) => ["reports", "top-returns", filters, topN] as const,
  salesByCompany: (filters: ReportFilters, topN?: TopNSelection) => ["reports", "sales-by-company", filters, topN] as const,
  purchaseSummary: (filters: ReportFilters, pagination: CursorPaginationParams, direction?: TopNSelection["direction"]) =>
    ["reports", "purchase-summary", filters, pagination, direction] as const,
  purchaseDetail: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "purchase-detail", filters, pagination] as const,
  purchaseByCompany: (filters: ReportFilters, topN?: TopNSelection) => ["reports", "purchase-by-company", filters, topN] as const,
  stock: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "stock", filters, pagination] as const,
  stockSummary: (filters: ReportFilters) => ["reports", "stock-summary", filters] as const,
  stockByCompany: (filters: ReportFilters) => ["reports", "stock-by-company", filters] as const,
  topStockByValue: (filters: ReportFilters, topN?: TopNSelection) => ["reports", "top-stock-by-value", filters, topN] as const,
  zeroOrderAlerts: (filters: ReportFilters) => ["reports", "zero-order-alerts", filters] as const,
  expiry: (filters: ReportFilters & { withinDays?: number }) => ["reports", "expiry", filters] as const,
  nonMoving: (filters: ReportFilters) => ["reports", "non-moving", filters] as const,
  nonMovingDetail: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "non-moving-detail", filters, pagination] as const,
  dailyCollection: (filters: ReportFilters) => ["reports", "daily-collection", filters] as const,
  daySalesDetail: (filters: ReportFilters, pagination: CursorPaginationParams) => ["reports", "day-sales-detail", filters, pagination] as const,
  importBatches: (branchId?: string, fileType?: string) => ["reports", "import-batches", branchId, fileType] as const,
  uploadCycleStatus: (branchId?: string) => ["reports", "upload-cycle-status", branchId] as const,
  exportJobs: (reportType?: string, branchId?: string) => ["reports", "export-jobs", reportType, branchId] as const,
}
