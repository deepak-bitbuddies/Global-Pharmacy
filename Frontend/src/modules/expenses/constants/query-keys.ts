import type { ExpenseFilters } from "../types"

export const expensesQueryKeys = {
  all: ["expenses"] as const,
  ledger: (filters: ExpenseFilters) => ["expenses", "ledger", filters] as const,
  summary: (filters: ExpenseFilters) => ["expenses", "summary", filters] as const,
}
