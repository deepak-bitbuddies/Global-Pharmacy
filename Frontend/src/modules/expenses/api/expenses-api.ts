import { api } from "@/lib/axios"
import type { CursorPaginationParams, PaginatedResponse } from "@/types/pagination"
import type { CreateExpenseInput, Expense, ExpenseFilters, ExpenseSummary, UpdateExpenseInput } from "../types"

const BASE = "/admin/expenses"

export async function getExpenses(filters: ExpenseFilters, pagination: CursorPaginationParams): Promise<PaginatedResponse<Expense>> {
  const { data } = await api.get<PaginatedResponse<Expense>>(BASE, { params: { ...filters, ...pagination } })
  return data
}

export async function getExpenseSummary(filters: ExpenseFilters): Promise<ExpenseSummary> {
  const { data } = await api.get<{ data: ExpenseSummary }>(`${BASE}/summary`, { params: filters })
  return data.data
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { data } = await api.post<{ data: Expense }>(BASE, input)
  return data.data
}

export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
  const { data } = await api.patch<{ data: Expense }>(`${BASE}/${id}`, input)
  return data.data
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}
