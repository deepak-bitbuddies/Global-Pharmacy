import type { CursorPaginationParams } from "@/types/pagination"
import type { ExpenseFilters } from "../types"

export const expensesQueryKeys = {
  all: ["expenses"] as const,
  list: (filters: ExpenseFilters, pagination: CursorPaginationParams) => ["expenses", "list", filters, pagination] as const,
  summary: (filters: ExpenseFilters) => ["expenses", "summary", filters] as const,
}
