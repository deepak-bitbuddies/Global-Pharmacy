"use client"

import { useQuery } from "@tanstack/react-query"

import { reportsQueryKeys } from "../constants/query-keys"
import type { ReportFilters } from "../types"
import {
  getBranches,
  getBranchSales,
  getCashInHand,
  getCompanies,
  getDailyCollection,
  getDashboardSummary,
  getExpiryReport,
  getGrossProfit,
  getItemWiseSales,
  getNonMovingItems,
  getOutstanding,
  getPurchaseSummary,
  getStockReport,
  getZeroOrderAlerts,
} from "../api/reports-api"

export function useBranches() {
  return useQuery({ queryKey: reportsQueryKeys.branches, queryFn: getBranches })
}

export function useCompanies() {
  return useQuery({ queryKey: reportsQueryKeys.companies, queryFn: getCompanies })
}

export function useDashboardSummary(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.dashboardSummary(filters), queryFn: () => getDashboardSummary(filters) })
}

export function useItemWiseSales(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.itemWiseSales(filters), queryFn: () => getItemWiseSales(filters) })
}

export function useBranchSales(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.branchSales(filters), queryFn: () => getBranchSales(filters) })
}

export function useGrossProfit(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.grossProfit(filters), queryFn: () => getGrossProfit(filters) })
}

export function usePurchaseSummary(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.purchaseSummary(filters), queryFn: () => getPurchaseSummary(filters) })
}

export function useStockReport(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.stock(filters), queryFn: () => getStockReport(filters) })
}

export function useZeroOrderAlerts(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.zeroOrderAlerts(filters), queryFn: () => getZeroOrderAlerts(filters) })
}

export function useExpiryReport(filters: ReportFilters & { withinDays?: number }) {
  return useQuery({ queryKey: reportsQueryKeys.expiry(filters), queryFn: () => getExpiryReport(filters) })
}

export function useNonMovingItems(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.nonMoving(filters), queryFn: () => getNonMovingItems(filters) })
}

export function useDailyCollection(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.dailyCollection(filters), queryFn: () => getDailyCollection(filters) })
}

export function useCashInHand(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.cashInHand(filters), queryFn: () => getCashInHand(filters) })
}

export function useOutstanding(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.outstanding(filters), queryFn: () => getOutstanding(filters) })
}
