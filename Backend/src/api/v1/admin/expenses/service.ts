import { NotFoundError, ValidationError } from "../../../../shared/errors/index.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import {
  createExpense as createExpenseRow,
  deleteExpense as deleteExpenseRow,
  findExpenseById,
  findExpenseWithBranchById,
  getExpenseSummary as getExpenseSummaryRows,
  listExpenses as listExpensesRows,
  updateExpense as updateExpenseRow,
} from "./repository.js"
import type {
  CreateExpenseDto,
  CursorPaginationParams,
  ExpenseDto,
  ExpenseFilters,
  ExpenseSummaryDto,
  PaginatedResult,
  UpdateExpenseDto,
} from "./dto.js"
import type { ExpenseDocument } from "./model.js"

const num = (value: string | number): number => Number(value)

/** Who's asking — passed into the update/delete paths so a `branch_user` can never touch another branch's row, not even to discover whether it exists. */
type RequestingUser = { role: string; branchId: string | null }

function toExpenseDto(row: ExpenseDocument & { branchName: string }): ExpenseDto {
  return {
    id: row.id,
    branchId: row.branchId,
    branchName: row.branchName,
    category: row.category,
    amount: num(row.amount),
    description: row.description,
    expenseDate: row.expenseDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

/** Throws if a `branch_user` is trying to reach a row that isn't theirs — `NotFoundError`, not `ForbiddenError`, so it can't be used to probe whether another branch's expense id exists. */
async function assertOwnership(id: string, user: RequestingUser): Promise<ExpenseDocument> {
  const existing = await findExpenseById(id)
  if (!existing) throw new NotFoundError("Expense not found")
  if (user.role === SystemRoleCode.BRANCH_USER && existing.branchId !== user.branchId) {
    throw new NotFoundError("Expense not found")
  }
  return existing
}

export async function createExpense(input: CreateExpenseDto): Promise<ExpenseDto> {
  if (!input.branchId) throw new ValidationError("A branch is required")

  const created = await createExpenseRow({
    branchId: input.branchId,
    category: input.category,
    amount: input.amount,
    description: input.description,
    expenseDate: input.expenseDate,
  })
  if (!created) throw new ValidationError("Could not create expense")

  const withBranch = await findExpenseWithBranchById(created.id)
  if (!withBranch) throw new ValidationError("Could not create expense")
  return toExpenseDto(withBranch)
}

export async function listExpenses(filters: ExpenseFilters, pagination: CursorPaginationParams): Promise<PaginatedResult<ExpenseDto>> {
  const { rows, ...page } = await listExpensesRows(filters, pagination)
  return { ...page, rows: rows.map(toExpenseDto) }
}

export async function expenseSummary(filters: ExpenseFilters): Promise<ExpenseSummaryDto> {
  const { totals, byCategory, byDate } = await getExpenseSummaryRows(filters)
  return {
    total: num(totals?.total ?? 0),
    count: Number(totals?.count ?? 0),
    byCategory: byCategory.map((row) => ({ category: row.category, total: num(row.total) })),
    byDate: byDate.map((row) => ({ date: row.date, total: num(row.total) })),
  }
}

export async function updateExpense(id: string, input: UpdateExpenseDto, user: RequestingUser): Promise<ExpenseDto> {
  await assertOwnership(id, user)

  await updateExpenseRow(id, input)
  const updated = await findExpenseWithBranchById(id)
  if (!updated) throw new NotFoundError("Expense not found")
  return toExpenseDto(updated)
}

export async function deleteExpense(id: string, user: RequestingUser): Promise<void> {
  await assertOwnership(id, user)
  await deleteExpenseRow(id)
}
