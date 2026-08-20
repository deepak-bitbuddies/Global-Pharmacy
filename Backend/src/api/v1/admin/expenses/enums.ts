export const ExpenseType = {
  Expense: "expense",
  Credit: "credit",
  HandoverCash: "handover_cash",
  HandoverBank: "handover_bank",
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
