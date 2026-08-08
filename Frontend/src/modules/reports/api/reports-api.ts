import { api } from "@/lib/axios"
import type { CursorPaginationParams, PaginatedResponse } from "@/types/pagination"
import type {
  Branch,
  CashInHandRow,
  DailyCollectionRow,
  DashboardSummary,
  DaySalesDetailRow,
  ExpiryRow,
  GrossProfitRow,
  ItemWiseSalesRow,
  NonMovingRow,
  OutstandingRow,
  PurchaseDetailRow,
  PurchaseSummaryRow,
  ReportFilters,
  SalesDetailRow,
  StockRow,
  ZeroOrderAlertRow,
} from "../types"

const BASE = "/admin/reports"

export async function getBranches(): Promise<Branch[]> {
  const { data } = await api.get<{ data: Branch[] }>(`${BASE}/branches`)
  return data.data
}

export async function getCompanies(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(`${BASE}/companies`)
  return data.data
}

export async function getSuppliers(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(`${BASE}/suppliers`)
  return data.data
}

export async function getSupplierGroups(): Promise<string[]> {
  const { data } = await api.get<{ data: string[] }>(`${BASE}/supplier-groups`)
  return data.data
}

export async function getDashboardSummary(filters: ReportFilters): Promise<DashboardSummary> {
  const { data } = await api.get<{ data: DashboardSummary }>(`${BASE}/dashboard/summary`, { params: filters })
  return data.data
}

export async function getItemWiseSales(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResponse<ItemWiseSalesRow>> {
  const { data } = await api.get<PaginatedResponse<ItemWiseSalesRow>>(`${BASE}/sales/item-wise`, { params: { ...filters, ...pagination } })
  return data
}

export async function getSalesDetail(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResponse<SalesDetailRow>> {
  const { data } = await api.get<PaginatedResponse<SalesDetailRow>>(`${BASE}/sales/detail`, { params: { ...filters, ...pagination } })
  return data
}

export async function getBranchSales(filters: ReportFilters): Promise<{ branchId: string; branchName: string; totalAmount: number }[]> {
  const { data } = await api.get(`${BASE}/sales/by-branch`, { params: filters })
  return data.data
}

export async function getGrossProfit(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResponse<GrossProfitRow>> {
  const { data } = await api.get<PaginatedResponse<GrossProfitRow>>(`${BASE}/sales/gross-profit`, { params: { ...filters, ...pagination } })
  return data
}

export async function getPurchaseSummary(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResponse<PurchaseSummaryRow>> {
  const { data } = await api.get<PaginatedResponse<PurchaseSummaryRow>>(`${BASE}/purchase`, { params: { ...filters, ...pagination } })
  return data
}

export async function getPurchaseDetail(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResponse<PurchaseDetailRow>> {
  const { data } = await api.get<PaginatedResponse<PurchaseDetailRow>>(`${BASE}/purchase/detail`, { params: { ...filters, ...pagination } })
  return data
}

export async function getStockReport(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResponse<StockRow>> {
  const { data } = await api.get<PaginatedResponse<StockRow>>(`${BASE}/stock`, { params: { ...filters, ...pagination } })
  return data
}

export async function getStockSummary(filters: ReportFilters): Promise<{ totalValue: number; uniqueItemCount: number; levelCounts: { bucket: string; count: number }[] }> {
  const { data } = await api.get(`${BASE}/stock/summary`, { params: filters })
  return data.data
}

export async function getStockValueByCompany(filters: ReportFilters): Promise<{ company: string; total: number }[]> {
  const { data } = await api.get(`${BASE}/stock/by-company`, { params: filters })
  return data.data
}

export async function getZeroOrderAlerts(filters: ReportFilters): Promise<ZeroOrderAlertRow[]> {
  const { data } = await api.get<{ data: ZeroOrderAlertRow[] }>(`${BASE}/stock/zero-order-alerts`, { params: filters })
  return data.data
}

export async function getExpiryReport(filters: ReportFilters & { withinDays?: number }): Promise<ExpiryRow[]> {
  const { data } = await api.get<{ data: ExpiryRow[] }>(`${BASE}/stock/expiry`, { params: filters })
  return data.data
}

export async function getNonMovingItems(filters: ReportFilters): Promise<NonMovingRow[]> {
  const { data } = await api.get<{ data: NonMovingRow[] }>(`${BASE}/stock/non-moving`, { params: filters })
  return data.data
}

export async function getDailyCollection(filters: ReportFilters): Promise<DailyCollectionRow[]> {
  const { data } = await api.get<{ data: DailyCollectionRow[] }>(`${BASE}/collection/daily`, { params: filters })
  return data.data
}

export async function getDaySalesDetail(filters: ReportFilters, pagination: CursorPaginationParams): Promise<PaginatedResponse<DaySalesDetailRow>> {
  const { data } = await api.get<PaginatedResponse<DaySalesDetailRow>>(`${BASE}/collection/detail`, { params: { ...filters, ...pagination } })
  return data
}

export async function getCashInHand(filters: ReportFilters): Promise<CashInHandRow[]> {
  const { data } = await api.get<{ data: CashInHandRow[] }>(`${BASE}/finance/cash-in-hand`, { params: filters })
  return data.data
}

export async function getOutstanding(filters: ReportFilters): Promise<OutstandingRow[]> {
  const { data } = await api.get<{ data: OutstandingRow[] }>(`${BASE}/finance/outstanding`, { params: filters })
  return data.data
}
