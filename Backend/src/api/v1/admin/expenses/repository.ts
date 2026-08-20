import { and, asc, desc, eq, gte, ilike, inArray, lte, ne, or, sql, type SQL } from "drizzle-orm"

import { db } from "../../../../core/database/db.js"
import { branches } from "../uploads/model.js"
import { expenses } from "./model.js"
import { ExpenseStatus, ExpenseType } from "./enums.js"
import type { ExpenseStatusValue, ExpenseTypeValue } from "./enums.js"
import type { ExpenseFilters } from "./dto.js"

function expenseFilterClauses(filters: ExpenseFilters): SQL[] {
  const clauses: SQL[] = []
  if (filters.branchId?.length) clauses.push(inArray(expenses.branchId, filters.branchId))
  if (filters.type?.length) clauses.push(inArray(expenses.type, filters.type))
  if (filters.status) clauses.push(eq(expenses.status, filters.status))
  if (filters.search) {
    const pattern = `%${filters.search}%`
    clauses.push(or(ilike(expenses.category, pattern), ilike(expenses.recipient, pattern), ilike(expenses.description, pattern)) as SQL)
  }
  if (filters.dateFrom) clauses.push(gte(expenses.expenseDate, filters.dateFrom))
  if (filters.dateTo) clauses.push(lte(expenses.expenseDate, filters.dateTo))
  return clauses
}

// A rejected entry is excluded from every balance/total — the cash never actually left (or the
// "credit" never actually landed), it was just logged and then turned down.
const NOT_REJECTED = ne(expenses.status, ExpenseStatus.Rejected)

const ROW_SELECTION = {
  id: expenses.id,
  branchId: expenses.branchId,
  branchName: branches.name,
  type: expenses.type,
  status: expenses.status,
  category: expenses.category,
  recipient: expenses.recipient,
  amount: expenses.amount,
  description: expenses.description,
  expenseDate: expenses.expenseDate,
  proofDocumentName: expenses.proofDocumentName,
  rejectionReason: expenses.rejectionReason,
  reviewedAt: expenses.reviewedAt,
  createdAt: expenses.createdAt,
  updatedAt: expenses.updatedAt,
}

export async function createExpense(input: {
  branchId: string
  type: ExpenseTypeValue
  category?: string
  recipient?: string
  amount: number
  description?: string
  expenseDate: string
  status: ExpenseStatusValue
}) {
  const [row] = await db.insert(expenses).values(input).returning()
  return row ?? null
}

/** A defensive cap, not a real pagination boundary — branch cash entries are low-volume (a few a day, one branch); this exists purely as a safety net against unbounded growth, mirroring `EXPORT_ROW_CAP`'s precedent in reports. */
const LEDGER_ROW_CAP = 2000

/**
 * The full ledger for the filtered scope, each row carrying the running balance immediately after
 * it — a windowed cumulative sum only means what it says over the *entire* ordered result set,
 * which is why this returns everything rather than paginating (keyset paging would restart the sum
 * from zero on every page). The window itself must accumulate oldest-first, so that's computed in
 * an inner subquery; the outer query then re-sorts newest-first, since that's how a ledger reads —
 * each row's `balanceAfter` was already fixed by the inner ascending order, so reversing display
 * order afterwards doesn't touch its meaning.
 */
export async function getExpenseLedger(filters: ExpenseFilters) {
  const where = and(...expenseFilterClauses(filters))

  const ordered = db
    .select({
      ...ROW_SELECTION,
      balanceAfter: sql<string>`sum(
        case when ${expenses.type} = ${ExpenseType.Credit} then ${expenses.amount} else -${expenses.amount} end
      ) filter (where ${expenses.status} != ${ExpenseStatus.Rejected}) over (order by ${expenses.expenseDate}, ${expenses.id} rows unbounded preceding)`.as(
        "balance_after",
      ),
    })
    .from(expenses)
    .innerJoin(branches, eq(branches.id, expenses.branchId))
    .where(where)
    .orderBy(asc(expenses.expenseDate), asc(expenses.id))
    .limit(LEDGER_ROW_CAP)
    .as("ordered")

  return db.select().from(ordered).orderBy(desc(ordered.expenseDate), desc(ordered.id))
}

export async function getExpenseSummary(filters: ExpenseFilters) {
  const where = and(...expenseFilterClauses(filters), NOT_REJECTED)

  const [[row]] = await Promise.all([
    db
      .select({
        totalCollection: sql<string>`coalesce(sum(${expenses.amount}) filter (where ${expenses.type} = ${ExpenseType.Credit}), 0)`,
        totalExpenses: sql<string>`coalesce(sum(${expenses.amount}) filter (where ${expenses.type} = ${ExpenseType.Expense}), 0)`,
        totalHandoverCash: sql<string>`coalesce(sum(${expenses.amount}) filter (where ${expenses.type} = ${ExpenseType.HandoverCash}), 0)`,
        totalHandoverBank: sql<string>`coalesce(sum(${expenses.amount}) filter (where ${expenses.type} = ${ExpenseType.HandoverBank}), 0)`,
        pendingApprovalCount: sql<string>`count(*) filter (where ${expenses.status} = ${ExpenseStatus.Pending})`,
      })
      .from(expenses)
      .where(where),
  ])

  return row ?? { totalCollection: "0", totalExpenses: "0", totalHandoverCash: "0", totalHandoverBank: "0", pendingApprovalCount: "0" }
}

export async function findExpenseById(id: string) {
  const [row] = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1)
  return row ?? null
}

/** Same joined shape as `getExpenseLedger`'s rows (minus the running balance), for a single id — used to build the response DTO right after a create/update/review. */
export async function findExpenseWithBranchById(id: string) {
  const [row] = await db
    .select(ROW_SELECTION)
    .from(expenses)
    .innerJoin(branches, eq(branches.id, expenses.branchId))
    .where(eq(expenses.id, id))
    .limit(1)
  return row ?? null
}

export async function updateExpense(
  id: string,
  input: Partial<{ category: string; recipient: string; amount: number; description: string | null; expenseDate: string }>,
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

export async function updateExpenseProof(id: string, proofDocumentKey: string, proofDocumentName: string) {
  const [row] = await db.update(expenses).set({ proofDocumentKey, proofDocumentName, updatedAt: new Date() }).where(eq(expenses.id, id)).returning()
  return row ?? null
}

/** `AND status = Pending` makes a double-review a no-op instead of a race — whichever request lands first wins, the second updates zero rows. */
export async function reviewExpense(
  id: string,
  status: typeof ExpenseStatus.Approved | typeof ExpenseStatus.Rejected,
  reviewerUserId: string,
  rejectionReason?: string,
) {
  const [row] = await db
    .update(expenses)
    .set({ status, reviewedByUserId: reviewerUserId, reviewedAt: new Date(), rejectionReason: rejectionReason ?? null, updatedAt: new Date() })
    .where(and(eq(expenses.id, id), eq(expenses.status, ExpenseStatus.Pending)))
    .returning()
  return row ?? null
}
