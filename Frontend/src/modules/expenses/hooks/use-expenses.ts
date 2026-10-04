"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { expensesQueryKeys } from "../constants/query-keys"
import {
  createExpense,
  createExpensesExportJob,
  deleteExpense,
  getExpenseLedger,
  getExpenseSummary,
  getExpensesExportJobs,
  reviewExpense,
  updateExpense,
  uploadExpenseProof,
} from "../api/expenses-api"
import type { ExpenseExportJob, ExpenseFilters, ReviewAction, UpdateExpenseInput } from "../types"

export function useExpenseLedger(filters: ExpenseFilters) {
  return useQuery({
    queryKey: expensesQueryKeys.ledger(filters),
    queryFn: () => getExpenseLedger(filters),
    placeholderData: keepPreviousData,
  })
}

export function useExpenseSummary(filters: ExpenseFilters) {
  return useQuery({ queryKey: expensesQueryKeys.summary(filters), queryFn: () => getExpenseSummary(filters), placeholderData: keepPreviousData })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExpenseInput }) => updateExpense(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
  })
}

export function useUploadExpenseProof() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => uploadExpenseProof(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
  })
}

export function useReviewExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, rejectionReason }: { id: string; action: ReviewAction; rejectionReason?: string }) =>
      reviewExpense(id, action, rejectionReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: expensesQueryKeys.all }),
  })
}

/**
 * Recent export jobs for the inline history panel — kept live by `useImportSocket`'s
 * `export-job:update` listener invalidating this same query key. `refetchInterval` is a safety net
 * on top of that: a missed/late socket event (e.g. the backend reconnecting right after a deploy)
 * would otherwise leave a completed job stuck showing "Processing" forever, since there'd be
 * nothing else to trigger a refetch. Only polls while a job is actually still processing, and stops
 * itself the moment none are.
 */
export function useExpensesExportJobs() {
  return useQuery({
    queryKey: expensesQueryKeys.exportJobs,
    queryFn: getExpensesExportJobs,
    refetchInterval: (query) => (query.state.data?.some((job) => job.status === "processing") ? 3000 : false),
  })
}

export function useCreateExpensesExportJob() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (filters: ExpenseFilters) => createExpensesExportJob(filters),
    // Same "write the processing job into the cache directly" reasoning as Purchase Analysis' and
    // Reports' identical hooks — the history popover opens synchronously right after this resolves,
    // so only invalidating risks it opening before the refetch lands.
    onSuccess: (job) => {
      queryClient.setQueryData<ExpenseExportJob[]>(expensesQueryKeys.exportJobs, (existing) => [job, ...(existing ?? [])])
    },
  })
}
