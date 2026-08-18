import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm"

import { db } from "../../../../core/database/db.js"
import { buildPage, decodeCursor } from "../../../../shared/helpers/cursor.js"
import { branches } from "../uploads/model.js"
import { expenses } from "./model.js"
import type { CursorPaginationParams, ExpenseFilters, PaginatedResult } from "./dto.js"

function expenseFilterClauses(filters: ExpenseFilters): SQL[] {
  const clauses: SQL[] = []
  if (filters.branchId) clauses.push(eq(expenses.branchId, filters.branchId))
  if (filters.search) {
    const pattern = `%${filters.search}%`
    clauses.push(or(ilike(expenses.category, pattern), ilike(expenses.description, pattern)) as SQL)
  }
  if (filters.dateFrom) clauses.push(gte(expenses.expenseDate, filters.dateFrom))
  if (filters.dateTo) clauses.push(lte(expenses.expenseDate, filters.dateTo))
  return clauses
}

export async function createExpense(input: {
  branchId: string
  category: string
  amount: number
  description?: string
  expenseDate: string
}) {
  const [row] = await db.insert(expenses).values(input).returning()
  return row ?? null
}

type ExpenseListCursor = { expenseDate: string; id: string }

export async function listExpenses(filters: ExpenseFilters, pagination: CursorPaginationParams) {
  const filterWhere = and(...expenseFilterClauses(filters))

  const cursor = decodeCursor<ExpenseListCursor>(pagination.cursor)
  // Both sides descend together (date DESC, id DESC as tiebreaker) so the uniform `<` stays
  // correct even when several expenses share the same date.
  const dataWhere = cursor
    ? and(filterWhere, sql`(${expenses.expenseDate}, ${expenses.id}) < (${cursor.expenseDate}, ${cursor.id})`)
    : filterWhere

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: expenses.id,
        branchId: expenses.branchId,
        branchName: branches.name,
        category: expenses.category,
        amount: expenses.amount,
        description: expenses.description,
        expenseDate: expenses.expenseDate,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .innerJoin(branches, eq(branches.id, expenses.branchId))
      .where(dataWhere)
      .orderBy(desc(expenses.expenseDate), desc(expenses.id))
      .limit(pagination.pageSize + 1),
    db.select({ count: sql<string>`count(*)` }).from(expenses).where(filterWhere),
  ])

  const { rows: page, hasNextPage, nextCursor } = buildPage(rows, pagination.pageSize, (r) => ({ expenseDate: r.expenseDate, id: r.id }))

  return { rows: page, hasNextPage, nextCursor, total: Number(countRows[0]?.count ?? 0) } satisfies PaginatedResult<(typeof rows)[number]>
}

export async function getExpenseSummary(filters: ExpenseFilters) {
  const where = and(...expenseFilterClauses(filters))

  const [[totals], byCategory, byDate] = await Promise.all([
    db.select({ total: sql<string>`coalesce(sum(${expenses.amount}), 0)`, count: sql<string>`count(*)` }).from(expenses).where(where),
    db
      .select({ category: expenses.category, total: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
      .from(expenses)
      .where(where)
      .groupBy(expenses.category)
      .orderBy(desc(sql`sum(${expenses.amount})`)),
    db
      .select({ date: expenses.expenseDate, total: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
      .from(expenses)
      .where(where)
      .groupBy(expenses.expenseDate)
      .orderBy(expenses.expenseDate),
  ])

  return { totals, byCategory, byDate }
}

export async function findExpenseById(id: string) {
  const [row] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1)
  return row ?? null
}

/** Same joined shape as `listExpenses`' rows, for a single id — used to build the response DTO right after a create/update. */
export async function findExpenseWithBranchById(id: string) {
  const [row] = await db
    .select({
      id: expenses.id,
      branchId: expenses.branchId,
      branchName: branches.name,
      category: expenses.category,
      amount: expenses.amount,
      description: expenses.description,
      expenseDate: expenses.expenseDate,
      createdAt: expenses.createdAt,
      updatedAt: expenses.updatedAt,
    })
    .from(expenses)
    .innerJoin(branches, eq(branches.id, expenses.branchId))
    .where(eq(expenses.id, id))
    .limit(1)
  return row ?? null
}

export async function updateExpense(
  id: string,
  input: Partial<{ category: string; amount: number; description: string | null; expenseDate: string }>,
) {
  const [row] = await db
    .update(expenses)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(expenses.id, id))
    .returning()
  return row ?? null
}

export async function deleteExpense(id: string): Promise<void> {
  await db.delete(expenses).where(eq(expenses.id, id))
}
