export type { CursorPaginationParams, PaginatedResult } from "../../../../shared/types/pagination.js"

export type ExpenseFilters = {
  branchId?: string
  dateFrom?: string
  dateTo?: string
  // Free-text keyword search — matches category or description, not an exact category match.
  search?: string
}

export type CreateExpenseDto = {
  // Optional here — a branch_user's is always forced to their own branch server-side
  // (`scopeToUserBranch`); only a super_admin actually needs to supply it.
  branchId?: string
  category: string
  amount: number
  description?: string
  expenseDate: string
}

// Branch isn't editable after creation — keeps ownership unambiguous, and a branch_user
// could otherwise reassign their own spend onto another branch.
export type UpdateExpenseDto = Partial<Omit<CreateExpenseDto, "branchId">>

export type ExpenseDto = {
  id: string
  branchId: string
  branchName: string
  category: string
  amount: number
  description: string | null
  expenseDate: string
  createdAt: Date
  updatedAt: Date
}

export type ExpenseSummaryDto = {
  total: number
  count: number
  byCategory: { category: string; total: number }[]
  byDate: { date: string; total: number }[]
}
