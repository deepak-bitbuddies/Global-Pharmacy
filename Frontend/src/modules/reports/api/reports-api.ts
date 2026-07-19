import { api } from "@/lib/axios"
import type {
  Branch,
  CashInHandRow,
  DailyCollectionRow,
  DashboardSummary,
  ExpiryRow,
  GrossProfitRow,
  ItemWiseSalesRow,
  NonMovingRow,
  OutstandingRow,
  PurchaseSummaryRow,
  ReportFilters,
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

export async function getDashboardSummary(filters: ReportFilters): Promise<DashboardSummary> {
  const { data } = await api.get<{ data: DashboardSummary }>(`${BASE}/dashboard/summary`, { params: filters })
  return data.data
}

export async function getItemWiseSales(filters: ReportFilters): Promise<ItemWiseSalesRow[]> {
  const { data } = await api.get<{ data: ItemWiseSalesRow[] }>(`${BASE}/sales/item-wise`, { params: filters })
  return data.data
}

export async function getBranchSales(filters: ReportFilters): Promise<{ branchId: string; branchName: string; totalAmount: number }[]> {
  const { data } = await api.get(`${BASE}/sales/by-branch`, { params: filters })
  return data.data
}

export async function getGrossProfit(filters: ReportFilters): Promise<GrossProfitRow[]> {
  const { data } = await api.get<{ data: GrossProfitRow[] }>(`${BASE}/sales/gross-profit`, { params: filters })
  return data.data
}

export async function getPurchaseSummary(filters: ReportFilters): Promise<PurchaseSummaryRow[]> {
  const { data } = await api.get<{ data: PurchaseSummaryRow[] }>(`${BASE}/purchase`, { params: filters })
  return data.data
}

export async function getStockReport(filters: ReportFilters): Promise<StockRow[]> {
  const { data } = await api.get<{ data: StockRow[] }>(`${BASE}/stock`, { params: filters })
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

export async function getCashInHand(filters: ReportFilters): Promise<CashInHandRow[]> {
  const { data } = await api.get<{ data: CashInHandRow[] }>(`${BASE}/finance/cash-in-hand`, { params: filters })
  return data.data
}

export async function getOutstanding(filters: ReportFilters): Promise<OutstandingRow[]> {
  const { data } = await api.get<{ data: OutstandingRow[] }>(`${BASE}/finance/outstanding`, { params: filters })
  return data.data
}
