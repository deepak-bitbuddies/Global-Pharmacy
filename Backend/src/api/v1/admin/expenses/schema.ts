import { z } from "zod"

export const createExpenseSchema = z.object({
  branchId: z.string().uuid().optional(),
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "A valid date is required"),
})

export const updateExpenseSchema = createExpenseSchema.omit({ branchId: true }).partial()

export const expenseFiltersSchema = z.object({
  branchId: z.string().uuid().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().optional(),
})

export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().positive().max(200).default(10),
})

export const listExpensesQuerySchema = expenseFiltersSchema.merge(cursorPaginationSchema)

export const expenseIdParamSchema = z.object({
  id: z.string().uuid("Invalid expense id"),
})
