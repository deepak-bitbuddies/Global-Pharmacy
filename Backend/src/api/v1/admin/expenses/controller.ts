import type { FastifyReply, FastifyRequest } from "fastify"

import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { scopeToUserBranch } from "../../../../shared/helpers/scope-to-user-branch.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { createExpenseSchema, expenseIdParamSchema, expenseFiltersSchema, listExpensesQuerySchema, updateExpenseSchema } from "./schema.js"
import { createExpense, deleteExpense, expenseSummary, listExpenses, updateExpense } from "./service.js"

/** Builds the `meta` envelope for a cursor-paginated response — same shape as `reports/controller.ts`'s helper. */
function paginationMeta(page: { hasNextPage: boolean; nextCursor: string | null; total: number }, pageSize: number) {
  return { nextCursor: page.nextCursor, hasNextPage: page.hasNextPage, total: page.total, totalPages: Math.ceil(page.total / pageSize) }
}

export async function createExpenseHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = scopeToUserBranch(request, validateSchema(createExpenseSchema, request.body))
  sendSuccess(reply, await createExpense(input), "Expense recorded", 201)
}

export async function listExpensesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize, ...rest } = validateSchema(listExpensesQuerySchema, request.query)
  const filters = scopeToUserBranch(request, rest)
  const { rows, ...page } = await listExpenses(filters, { cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, paginationMeta(page, pageSize))
}

export async function expenseSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranch(request, validateSchema(expenseFiltersSchema, request.query))
  sendSuccess(reply, await expenseSummary(filters))
}

export async function updateExpenseHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(expenseIdParamSchema, request.params)
  const input = validateSchema(updateExpenseSchema, request.body)
  sendSuccess(reply, await updateExpense(id, input, request.user))
}

export async function deleteExpenseHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(expenseIdParamSchema, request.params)
  await deleteExpense(id, request.user)
  sendSuccess(reply, null, "Expense deleted")
}
