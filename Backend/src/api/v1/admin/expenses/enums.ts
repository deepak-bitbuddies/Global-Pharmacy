export const ExpenseType = {
  Expense: "expense",
  Credit: "credit",
  HandoverCash: "handover_cash",
  HandoverBank: "handover_bank",
  // super_admin-only (enforced in service.ts's createExpense, hidden from the type picker for
  // anyone else on the frontend) — sets/boosts a branch's starting cash position. Posted
  // immediately like Expense/Credit (no approval, no proof), but adds to the running balance like
  // Credit rather than subtracting like Expense.
  OpeningBalance: "opening_balance",
} as const
export type ExpenseTypeValue = (typeof ExpenseType)[keyof typeof ExpenseType]

export const ExpenseStatus = {
  Posted: "posted",
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
} as const
export type ExpenseStatusValue = (typeof ExpenseStatus)[keyof typeof ExpenseStatus]

export const ReviewAction = {
  Approve: "approve",
  Reject: "reject",
} as const
export type ReviewActionValue = (typeof ReviewAction)[keyof typeof ReviewAction]
