"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { CursorPaginationParams } from "@/types/pagination"
import { expensesQueryKeys } from "../constants/query-keys"
import { createExpense, deleteExpense, getExpenses, getExpenseSummary, updateExpense } from "../api/expenses-api"
import type { ExpenseFilters, UpdateExpenseInput } from "../types"

export function useExpenses(filters: ExpenseFilters, pagination: CursorPaginationParams) {
  return useQuery({
    queryKey: expensesQueryKeys.list(filters, pagination),
    queryFn: () => getExpenses(filters, pagination),
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
