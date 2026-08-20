import { z } from "zod"

import { ExpenseStatus, ExpenseType, ReviewAction } from "./enums.js"
import type { ExpenseStatusValue, ExpenseTypeValue, ReviewActionValue } from "./enums.js"

// Cast to a same-literal-type tuple (not `[string, ...string[]]`) so `z.enum` infers the real
// union instead of widening to plain `string` — that's what keeps `action`/`type`/`status` typed
// all the way through the controller into the service functions that expect the enum type.
const typeValues = Object.values(ExpenseType) as [ExpenseTypeValue, ...ExpenseTypeValue[]]
const statusValues = Object.values(ExpenseStatus) as [ExpenseStatusValue, ...ExpenseStatusValue[]]
const actionValues = Object.values(ReviewAction) as [ReviewActionValue, ...ReviewActionValue[]]

/**
 * Multi-select filter fields (branchId/type) arrive as a repeated query key
 * (`?type=expense&type=credit`), which Fastify's querystring parser only turns into an array once
 * there's more than one — a single selection arrives as a bare string, so it's normalized to a
 * 1-element array here before validating each entry. Same pattern as `reports/schema.ts`.
 */
const stringArrayFilter = <T extends z.ZodTypeAny>(element: T) =>
  z.preprocess((value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]), z.array(element).min(1).optional())

const createExpenseBaseSchema = z.object({
  branchId: z.string().uuid().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "A valid date is required"),
})

export const createExpenseSchema = z.discriminatedUnion("type", [
  createExpenseBaseSchema.extend({ type: z.literal(ExpenseType.Expense), category: z.string().min(1, "Category is required") }),
  createExpenseBaseSchema.extend({ type: z.literal(ExpenseType.Credit) }),
  createExpenseBaseSchema.extend({ type: z.literal(ExpenseType.HandoverCash), recipient: z.string().min(1, "Recipient is required") }),
  createExpenseBaseSchema.extend({ type: z.literal(ExpenseType.HandoverBank), recipient: z.string().min(1, "Recipient is required") }),
])

// Flat and fully optional — type isn't editable after creation, so there's no discriminant to
// branch validation on here; the service applies whichever of these fields are relevant to the
// row's actual (unchanging) type.
export const updateExpenseSchema = z.object({
  category: z.string().min(1).optional(),
  recipient: z.string().min(1).optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0").optional(),
  description: z.string().optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const expenseFiltersSchema = z.object({
  branchId: stringArrayFilter(z.string().uuid()),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: stringArrayFilter(z.enum(typeValues)),
  status: z.enum(statusValues).optional(),
  search: z.string().optional(),
})

export const reviewExpenseSchema = z.object({
  action: z.enum(actionValues),
  rejectionReason: z.string().optional(),
})

export const expenseIdParamSchema = z.object({
  id: z.string().uuid("Invalid expense id"),
})
