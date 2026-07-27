"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import type { CursorPaginationParams } from "@/types/pagination"
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
  getPurchaseDetail,
  getPurchaseSummary,
  getStockReport,
  getStockSummary,
  getStockValueByCompany,
  getZeroOrderAlerts,
} from "../api/reports-api"

export function useBranches() {
  return useQuery({ queryKey: reportsQueryKeys.branches, queryFn: getBranches })
}

export function useCompanies() {
  return useQuery({ queryKey: reportsQueryKeys.companies, queryFn: getCompanies })
}

// All hooks below feed filter- and/or pagination-driven dashboard widgets —
// `placeholderData: keepPreviousData` keeps the previous result on screen
// (with `isFetching` flipping true) while a filter/page change is in
// flight, instead of the widget blanking out to a loading state on every
// interaction.
export function useDashboardSummary(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.dashboardSummary(filters), queryFn: () => getDashboardSummary(filters), placeholderData: keepPreviousData })
}

export function useItemWiseSales(filters: ReportFilters, pagination: CursorPaginationParams) {
  return useQuery({ queryKey: reportsQueryKeys.itemWiseSales(filters, pagination), queryFn: () => getItemWiseSales(filters, pagination), placeholderData: keepPreviousData })
}

export function useBranchSales(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.branchSales(filters), queryFn: () => getBranchSales(filters), placeholderData: keepPreviousData })
}

export function useGrossProfit(filters: ReportFilters, pagination: CursorPaginationParams) {
  return useQuery({ queryKey: reportsQueryKeys.grossProfit(filters, pagination), queryFn: () => getGrossProfit(filters, pagination), placeholderData: keepPreviousData })
}

export function usePurchaseSummary(filters: ReportFilters, pagination: CursorPaginationParams) {
  return useQuery({ queryKey: reportsQueryKeys.purchaseSummary(filters, pagination), queryFn: () => getPurchaseSummary(filters, pagination), placeholderData: keepPreviousData })
}

export function usePurchaseDetail(filters: ReportFilters, pagination: CursorPaginationParams) {
  return useQuery({ queryKey: reportsQueryKeys.purchaseDetail(filters, pagination), queryFn: () => getPurchaseDetail(filters, pagination), placeholderData: keepPreviousData })
}

export function useStockReport(filters: ReportFilters, pagination: CursorPaginationParams) {
  return useQuery({ queryKey: reportsQueryKeys.stock(filters, pagination), queryFn: () => getStockReport(filters, pagination), placeholderData: keepPreviousData })
}

export function useStockSummary(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.stockSummary(filters), queryFn: () => getStockSummary(filters), placeholderData: keepPreviousData })
}

export function useStockValueByCompany(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.stockByCompany(filters), queryFn: () => getStockValueByCompany(filters), placeholderData: keepPreviousData })
}

export function useZeroOrderAlerts(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.zeroOrderAlerts(filters), queryFn: () => getZeroOrderAlerts(filters), placeholderData: keepPreviousData })
}

export function useExpiryReport(filters: ReportFilters & { withinDays?: number }) {
  return useQuery({ queryKey: reportsQueryKeys.expiry(filters), queryFn: () => getExpiryReport(filters), placeholderData: keepPreviousData })
}

export function useNonMovingItems(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.nonMoving(filters), queryFn: () => getNonMovingItems(filters), placeholderData: keepPreviousData })
}

export function useDailyCollection(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.dailyCollection(filters), queryFn: () => getDailyCollection(filters), placeholderData: keepPreviousData })
}

export function useCashInHand(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.cashInHand(filters), queryFn: () => getCashInHand(filters), placeholderData: keepPreviousData })
}

export function useOutstanding(filters: ReportFilters) {
  return useQuery({ queryKey: reportsQueryKeys.outstanding(filters), queryFn: () => getOutstanding(filters), placeholderData: keepPreviousData })
}
