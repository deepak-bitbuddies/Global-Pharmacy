"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CursorPaginationParams } from "@/types/pagination"
import { purchaseAnalysisQueryKeys } from "../constants/query-keys"
import {
  createPurchaseAnalysisExportJob,
  deletePurchaseAnalysisBatch,
  getPurchaseAnalysisAreas,
  getPurchaseAnalysisBatches,
  getPurchaseAnalysisBranches,
  getPurchaseAnalysisCompanies,
  getPurchaseAnalysisExportJobs,
  getPurchaseAnalysisItems,
  getPurchaseAnalysisLines,
  getPurchaseAnalysisParties,
  getPurchaseAnalysisRoutes,
  getPurchaseAnalysisSummary,
  getPurchaseAnalysisTypes,
  uploadPurchaseAnalysisFile,
} from "../api/purchase-analysis-api"
import type { PurchaseAnalysisExportJob, PurchaseAnalysisFilters } from "../types"

export function usePurchaseAnalysisLines(filters: PurchaseAnalysisFilters, pagination: CursorPaginationParams) {
  return useQuery({
    queryKey: purchaseAnalysisQueryKeys.lines(filters, pagination),
    queryFn: () => getPurchaseAnalysisLines(filters, pagination),
    placeholderData: keepPreviousData,
  })
}

export function usePurchaseAnalysisSummary(filters: PurchaseAnalysisFilters) {
  return useQuery({
    queryKey: purchaseAnalysisQueryKeys.summary(filters),
    queryFn: () => getPurchaseAnalysisSummary(filters),
    placeholderData: keepPreviousData,
  })
}

export function usePurchaseAnalysisParties() {
  return useQuery({ queryKey: purchaseAnalysisQueryKeys.parties, queryFn: getPurchaseAnalysisParties })
}

export function usePurchaseAnalysisItems() {
  return useQuery({ queryKey: purchaseAnalysisQueryKeys.items, queryFn: getPurchaseAnalysisItems })
}

export function usePurchaseAnalysisCompanies() {
  return useQuery({ queryKey: purchaseAnalysisQueryKeys.companies, queryFn: getPurchaseAnalysisCompanies })
}

export function usePurchaseAnalysisBranches() {
  return useQuery({ queryKey: purchaseAnalysisQueryKeys.branches, queryFn: getPurchaseAnalysisBranches })
}

export function usePurchaseAnalysisTypes() {
  return useQuery({ queryKey: purchaseAnalysisQueryKeys.types, queryFn: getPurchaseAnalysisTypes })
}

export function usePurchaseAnalysisAreas() {
  return useQuery({ queryKey: purchaseAnalysisQueryKeys.areas, queryFn: getPurchaseAnalysisAreas })
}

export function usePurchaseAnalysisRoutes() {
  return useQuery({ queryKey: purchaseAnalysisQueryKeys.routes, queryFn: getPurchaseAnalysisRoutes })
}

export function usePurchaseAnalysisBatches() {
  return useQuery({ queryKey: purchaseAnalysisQueryKeys.batches, queryFn: getPurchaseAnalysisBatches })
}

/** Invalidates every filter-option list + the batch history on success — a fresh import can introduce new parties/items/companies/etc. that the dropdowns need to pick up. */
export function useUploadPurchaseAnalysisFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadPurchaseAnalysisFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-analysis"] })
    },
  })
}

export function useDeletePurchaseAnalysisBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePurchaseAnalysisBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-analysis"] })
    },
  })
}

/** Recent export jobs for the inline history panel — kept live by `useImportSocket`'s `export-job:update` listener invalidating this same query key. */
export function usePurchaseAnalysisExportJobs() {
  return useQuery({ queryKey: purchaseAnalysisQueryKeys.exportJobs, queryFn: getPurchaseAnalysisExportJobs })
}

export function useCreatePurchaseAnalysisExportJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (filters: PurchaseAnalysisFilters) => createPurchaseAnalysisExportJob(filters),
    // Same "write the processing job into the cache directly" reasoning as Reports' identical
    // `useCreateExportJob` — the history popover opens synchronously right after this resolves, so
    // only invalidating risks it opening before the refetch lands.
    onSuccess: (job) => {
      queryClient.setQueryData<PurchaseAnalysisExportJob[]>(purchaseAnalysisQueryKeys.exportJobs, (existing) => [job, ...(existing ?? [])])
    },
  })
}
