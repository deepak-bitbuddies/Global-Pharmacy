import { ExpenseType } from "./enums.js"
import type { ExpenseStatusValue, ExpenseTypeValue } from "./enums.js"

export type { CursorPaginationParams, PaginatedResult } from "../../../../shared/types/pagination.js"

export type ExpenseType = ExpenseTypeValue
export type ExpenseStatus = ExpenseStatusValue

export type ExpenseFilters = {
  branchId?: string[]
  dateFrom?: string
  dateTo?: string
  type?: ExpenseType[]
  status?: ExpenseStatus
  // Free-text keyword search — matches category, recipient, or description.
  search?: string
}

type CreateExpenseBase = {
  // Optional here — a branch_user's is always forced to their own branch server-side
  // (`scopeToUserBranch`); only a super_admin actually needs to supply it.
  branchId?: string
  amount: number
  description?: string
  expenseDate: string
}

export type CreateExpenseDto =
  | (CreateExpenseBase & { type: typeof ExpenseType.Expense; category: string })
  | (CreateExpenseBase & { type: typeof ExpenseType.Credit })
  | (CreateExpenseBase & { type: typeof ExpenseType.HandoverCash | typeof ExpenseType.HandoverBank; recipient: string })

// type/branch aren't editable after creation — switching type would orphan proof/approval state,
// same precedent as branch not being editable. Flat rather than mirroring the create union: the
// service already knows the row's real type and only persists whichever fields apply to it.
export type UpdateExpenseDto = {
  category?: string
  recipient?: string
  amount?: number
  description?: string
  expenseDate?: string
}

export type ExpenseDto = {
  id: string
  branchId: string
  branchName: string
  type: ExpenseType
  status: ExpenseStatus
  category: string | null
  recipient: string | null
  amount: number
  description: string | null
  expenseDate: string
  proofDocumentName: string | null
  rejectionReason: string | null
  reviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/** One ledger row — `ExpenseDto` plus the running balance immediately after this entry, computed server-side over the full ordered result set (see `getExpenseLedger`). */
export type ExpenseLedgerRowDto = ExpenseDto & { balanceAfter: number }

export type ExpenseSummaryDto = {
  totalCollection: number
  totalExpenses: number
  totalHandoverCash: number
  totalHandoverBank: number
  balance: number
  pendingApprovalCount: number
}
