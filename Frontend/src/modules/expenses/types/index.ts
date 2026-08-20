export enum ExpenseType {
  Expense = "expense",
  Credit = "credit",
  HandoverCash = "handover_cash",
  HandoverBank = "handover_bank",
}

export enum ExpenseStatus {
  Posted = "posted",
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

export enum ReviewAction {
  Approve = "approve",
  Reject = "reject",
}

export type ExpenseFilters = {
  branchId?: string[]
  dateFrom?: string
  dateTo?: string
  type?: ExpenseType[]
  status?: ExpenseStatus
  // Free-text keyword search — matches category, recipient, or description.
  search?: string
}

export type Expense = {
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
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

/** One ledger row — `Expense` plus the running balance immediately after it, computed server-side. */
export type ExpenseLedgerRow = Expense & { balanceAfter: number }

type CreateExpenseBase = {
  // Only relevant when a super_admin is creating on behalf of a branch — a branch_user's is
  // always forced to their own branch server-side, this field is ignored for them either way.
  branchId?: string
  amount: number
  description?: string
  expenseDate: string
}

export type CreateExpenseInput =
  | (CreateExpenseBase & { type: ExpenseType.Expense; category: string })
  | (CreateExpenseBase & { type: ExpenseType.Credit })
  | (CreateExpenseBase & { type: ExpenseType.HandoverCash | ExpenseType.HandoverBank; recipient: string })

export type UpdateExpenseInput = {
  category?: string
  recipient?: string
  amount?: number
  description?: string
  expenseDate?: string
}

export type ExpenseSummary = {
  totalCollection: number
  totalExpenses: number
  totalHandoverCash: number
  totalHandoverBank: number
  balance: number
  pendingApprovalCount: number
}
