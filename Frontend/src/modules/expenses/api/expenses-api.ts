import { api } from "@/lib/axios"
import type { CreateExpenseInput, Expense, ExpenseFilters, ExpenseLedgerRow, ExpenseSummary, ReviewAction, UpdateExpenseInput } from "../types"

const BASE = "/admin/expenses"

export async function getExpenseLedger(filters: ExpenseFilters): Promise<ExpenseLedgerRow[]> {
  const { data } = await api.get<{ data: ExpenseLedgerRow[] }>(BASE, { params: filters })
  return data.data
}

export async function getExpenseSummary(filters: ExpenseFilters): Promise<ExpenseSummary> {
  const { data } = await api.get<{ data: ExpenseSummary }>(`${BASE}/summary`, { params: filters })
  return data.data
}

export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const { data } = await api.post<{ data: Expense }>(BASE, input)
  return data.data
}

export async function updateExpense(id: string, input: UpdateExpenseInput): Promise<Expense> {
  const { data } = await api.patch<{ data: Expense }>(`${BASE}/${id}`, input)
  return data.data
}

export async function deleteExpense(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`)
}

export async function uploadExpenseProof(id: string, file: File): Promise<Expense> {
  const formData = new FormData()
  formData.append("file", file)
  const { data } = await api.post<{ data: Expense }>(`${BASE}/${id}/proof`, formData, { headers: { "Content-Type": "multipart/form-data" } })
  return data.data
}

/**
 * The proof's direct URL — for an `<img>`/`<iframe>` `src` or a download link, not an axios call.
 * It's same-origin (goes through the Next.js proxy at `/api/admin/...`, which attaches the
 * backend auth itself — see `app/api/admin/[...path]/route.ts`), so the browser sends the site's
 * own session cookie automatically and can fetch/render it natively without any JS round-trip
 * first. Awaiting a full blob download before even opening the preview modal was what made it
 * feel slow — this lets the modal open immediately and the browser stream/paint the file itself.
 */
export function getExpenseProofUrl(id: string): string {
  return api.getUri({ url: `${BASE}/${id}/proof` })
}

export async function reviewExpense(id: string, action: ReviewAction, rejectionReason?: string): Promise<Expense> {
  const { data } = await api.patch<{ data: Expense }>(`${BASE}/${id}/review`, { action, rejectionReason })
  return data.data
}
