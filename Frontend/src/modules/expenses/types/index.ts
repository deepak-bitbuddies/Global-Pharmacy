export type ExpenseFilters = {
  branchId?: string
  dateFrom?: string
  dateTo?: string
  // Free-text keyword search — matches category or description, not an exact category match.
  search?: string
}

export type Expense = {
  id: string
  branchId: string
  branchName: string
  category: string
  amount: number
  description: string | null
  expenseDate: string
  createdAt: string
  updatedAt: string
}

export type CreateExpenseInput = {
  // Only relevant when a super_admin is creating on behalf of a branch — a branch_user's is
  // always forced to their own branch server-side, this field is ignored for them either way.
  branchId?: string
  category: string
  amount: number
  description?: string
  expenseDate: string
}

export type UpdateExpenseInput = Partial<Omit<CreateExpenseInput, "branchId">>

export type ExpenseSummary = {
  total: number
  count: number
  byCategory: { category: string; total: number }[]
  byDate: { date: string; total: number }[]
}
