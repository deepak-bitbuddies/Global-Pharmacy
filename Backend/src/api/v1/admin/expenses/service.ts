import path from "node:path"

import { ForbiddenError, NotFoundError, ValidationError } from "../../../../shared/errors/index.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import { readProofDocument, saveProofDocument } from "../../../../core/storage/proof-document-storage.js"
import { readExportFile, saveExportFile } from "../../../../core/storage/export-storage.js"
import { emitExportJobProgress, emitExportJobUpdate } from "../../../../core/realtime/socket.js"
import { buildStyledXlsxBuffer } from "../../../../shared/helpers/xlsx-export.js"
import { createExportJob, findExportJob, listExportJobs, updateExportJobStatus } from "../reports/repository.js"
import type { ExportJobDocument } from "../reports/model.js"
import { ExpenseStatus, ExpenseType, ReviewAction } from "./enums.js"
import type { ExpenseStatusValue, ExpenseTypeValue, ReviewActionValue } from "./enums.js"
import {
  createExpense as createExpenseRow,
  deleteExpense as deleteExpenseRow,
  findExpenseById,
  findExpenseWithBranchById,
  getExpenseLedger as getExpenseLedgerRows,
  getExpenseSummary as getExpenseSummaryRows,
  reviewExpense as reviewExpenseRow,
  updateExpense as updateExpenseRow,
  updateExpenseProof,
} from "./repository.js"
import type { CreateExpenseDto, ExpenseDto, ExpenseExportJobDto, ExpenseFilters, ExpenseLedgerRowDto, ExpenseSummaryDto, UpdateExpenseDto } from "./dto.js"
import type { ExpenseDocument } from "./model.js"

const num = (value: string | number): number => Number(value)

// This module is only ever the one "report" — unlike Reports' four, no per-request discriminant needed.
const EXPENSES_REPORT_TYPE = "expenses"

/** Who's asking — passed into every path that touches an existing row, so a `branch_user` can never reach another branch's entry, not even to discover whether it exists. */
type RequestingUser = { role: string; branchId: string | null; id: string }

/** The shape `repository.ts`'s `ROW_SELECTION` actually selects (joined to branch, proof storage key omitted — only its display name is ever needed outside the storage layer). */
type JoinedRow = {
  id: string
  branchId: string
  branchName: string
  type: ExpenseTypeValue
  status: ExpenseStatusValue
  category: string | null
  recipient: string | null
  amount: string | number
  description: string | null
  expenseDate: string
  proofDocumentName: string | null
  rejectionReason: string | null
  reviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

function toExpenseDto(row: JoinedRow): ExpenseDto {
  return {
    id: row.id,
    branchId: row.branchId,
    branchName: row.branchName,
    type: row.type,
    status: row.status,
    category: row.category,
    recipient: row.recipient,
    amount: num(row.amount),
    description: row.description,
    expenseDate: row.expenseDate,
    proofDocumentName: row.proofDocumentName,
    rejectionReason: row.rejectionReason,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

const HANDOVER_TYPES = new Set<ExpenseTypeValue>([ExpenseType.HandoverCash, ExpenseType.HandoverBank])

/** Throws if a `branch_user` is trying to reach a row that isn't theirs — `NotFoundError`, not `ForbiddenError`, so it can't be used to probe whether another branch's entry id exists. */
async function assertOwnership(id: string, user: RequestingUser): Promise<ExpenseDocument> {
  const existing = await findExpenseById(id)
  if (!existing) throw new NotFoundError("Expense not found")
  if (user.role === SystemRoleCode.BRANCH_USER && existing.branchId !== user.branchId) {
    throw new NotFoundError("Expense not found")
  }
  return existing
}

/** Once a handover entry has been reviewed (approved or rejected), it's locked — editing/deleting it further would undermine the audit trail the approval was meant to establish. */
function assertNotReviewed(entry: ExpenseDocument): void {
  if (entry.status === ExpenseStatus.Approved || entry.status === ExpenseStatus.Rejected) {
    throw new ValidationError("This entry has already been reviewed and can no longer be changed")
  }
}

export async function createExpense(input: CreateExpenseDto, user: RequestingUser): Promise<ExpenseDto> {
  if (!input.branchId) throw new ValidationError("A branch is required")
  if (input.type === ExpenseType.OpeningBalance && user.role !== SystemRoleCode.SUPER_ADMIN) {
    throw new ForbiddenError("Only a super admin can record an opening balance")
  }

  const status = HANDOVER_TYPES.has(input.type) ? ExpenseStatus.Pending : ExpenseStatus.Posted
  const created = await createExpenseRow({
    branchId: input.branchId,
    type: input.type,
    category: input.category,
    recipient: input.type === ExpenseType.HandoverCash || input.type === ExpenseType.HandoverBank ? input.recipient : undefined,
    amount: input.amount,
    description: input.description,
    expenseDate: input.expenseDate,
    status,
  })
  if (!created) throw new ValidationError("Could not create expense")

  const withBranch = await findExpenseWithBranchById(created.id)
  if (!withBranch) throw new ValidationError("Could not create expense")
  return toExpenseDto(withBranch)
}

export async function expenseLedger(filters: ExpenseFilters): Promise<ExpenseLedgerRowDto[]> {
  const rows = await getExpenseLedgerRows(filters)
  return rows.map((row) => ({ ...toExpenseDto(row), balanceAfter: num(row.balanceAfter) }))
}

export async function expenseSummary(filters: ExpenseFilters): Promise<ExpenseSummaryDto> {
  const totals = await getExpenseSummaryRows(filters)
  const totalCollection = num(totals.totalCollection)
  const totalOpeningBalance = num(totals.totalOpeningBalance)
  const totalExpenses = num(totals.totalExpenses)
  const totalHandoverCash = num(totals.totalHandoverCash)
  const totalHandoverBank = num(totals.totalHandoverBank)
  return {
    totalCollection,
    totalOpeningBalance,
    totalExpenses,
    totalHandoverCash,
    totalHandoverBank,
    balance: totalCollection + totalOpeningBalance - totalExpenses - totalHandoverCash - totalHandoverBank,
    pendingApprovalCount: Number(totals.pendingApprovalCount),
  }
}

export async function updateExpense(id: string, input: UpdateExpenseDto, user: RequestingUser): Promise<ExpenseDto> {
  const existing = await assertOwnership(id, user)
  assertNotReviewed(existing)

  await updateExpenseRow(id, input)
  const updated = await findExpenseWithBranchById(id)
  if (!updated) throw new NotFoundError("Expense not found")
  return toExpenseDto(updated)
}

export async function deleteExpense(id: string, user: RequestingUser): Promise<void> {
  const existing = await assertOwnership(id, user)
  assertNotReviewed(existing)
  await deleteExpenseRow(id)
}

export async function attachExpenseProof(id: string, user: RequestingUser, buffer: Buffer, originalFileName: string): Promise<ExpenseDto> {
  const existing = await assertOwnership(id, user)
  if (!HANDOVER_TYPES.has(existing.type as ExpenseTypeValue)) throw new ValidationError("Only a handover/transfer entry can have a proof document attached")
  if (existing.status !== ExpenseStatus.Pending) throw new ValidationError("This entry has already been reviewed — its proof can no longer be changed")

  const ext = path.extname(originalFileName) || ""
  const { storageKey } = await saveProofDocument(id, buffer, ext)
  const updated = await updateExpenseProof(id, storageKey, originalFileName)
  const withBranch = updated ? await findExpenseWithBranchById(id) : null
  if (!withBranch) throw new NotFoundError("Expense not found")
  return toExpenseDto(withBranch)
}

export async function getExpenseProof(id: string, user: RequestingUser): Promise<{ buffer: Buffer; fileName: string }> {
  const existing = await assertOwnership(id, user)
  if (!existing.proofDocumentKey) throw new NotFoundError("No proof document has been attached to this entry yet")
  const buffer = await readProofDocument(existing.proofDocumentKey)
  return { buffer, fileName: existing.proofDocumentName ?? "proof" }
}

export async function reviewExpense(id: string, action: ReviewActionValue, user: RequestingUser, rejectionReason?: string): Promise<ExpenseDto> {
  if (user.role !== SystemRoleCode.SUPER_ADMIN) throw new ForbiddenError("Only a super admin can approve or reject an entry")

  const existing = await findExpenseById(id)
  if (!existing) throw new NotFoundError("Expense not found")
  if (existing.status !== ExpenseStatus.Pending) throw new ValidationError("This entry has already been reviewed")
  if (!existing.proofDocumentKey) throw new ValidationError("This entry has no proof document attached yet — it can't be reviewed")
  if (action === ReviewAction.Reject && !rejectionReason) throw new ValidationError("A reason is required to reject an entry")

  const status = action === ReviewAction.Approve ? ExpenseStatus.Approved : ExpenseStatus.Rejected
  const reviewed = await reviewExpenseRow(id, status, user.id, rejectionReason)
  if (!reviewed) throw new ValidationError("This entry was already reviewed by someone else")

  const withBranch = await findExpenseWithBranchById(id)
  if (!withBranch) throw new NotFoundError("Expense not found")
  return toExpenseDto(withBranch)
}

// ---- Background export — same "ack now, live status/progress over the socket" shape as every
// other import/export in this app, reusing Reports' `export_jobs` table/CRUD (see
// reports/model.ts) rather than standing up a second copy of this job lifecycle.

const EXPORT_CHUNK_SIZE = 2000

const EXPORT_COLUMNS: { key: string; label: string }[] = [
  { key: "expenseDate", label: "Date" },
  { key: "branchName", label: "Branch" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "category", label: "Category" },
  { key: "recipient", label: "Recipient" },
  { key: "amount", label: "Amount" },
  { key: "balanceAfter", label: "Balance After" },
  { key: "description", label: "Description" },
  { key: "proofDocumentName", label: "Proof Document" },
  { key: "rejectionReason", label: "Rejection Reason" },
]

/** Human-readable one-line summary of which filters produced an export — same purpose as Reports' `describeFilters`, just this module's own filter shape. */
function describeFilters(filters: ExpenseFilters): string {
  const parts: string[] = []
  if (filters.dateFrom && filters.dateTo) parts.push(`${filters.dateFrom} – ${filters.dateTo}`)
  if (filters.branchId?.length) parts.push(`${filters.branchId.length} branch(es)`)
  if (filters.type?.length) parts.push(filters.type.join(", "))
  if (filters.status) parts.push(filters.status)
  if (filters.search) parts.push(`Search "${filters.search}"`)
  return parts.length > 0 ? parts.join(" | ") : "All entries — no filters applied"
}

function toExportJobDto(job: ExportJobDocument): ExpenseExportJobDto {
  return {
    id: job.id,
    reportType: job.reportType,
    branchId: job.branchId,
    // This module's own listing/lookup calls are always scoped to `EXPENSES_REPORT_TYPE`, so a
    // job reaching here is always genuinely `ExpenseFilters`-shaped.
    filters: job.filters as ExpenseFilters,
    status: job.status,
    rowCount: job.rowCount,
    fileName: job.fileName,
    errorMessage: job.errorMessage,
    requestedAt: job.requestedAt,
    completedAt: job.completedAt,
  }
}

/** Maps in chunks purely to emit progress ticks (`export-job:progress`) on the way — same reason the other export pipelines' `mapWithProgress` does. */
function mapWithProgress(rows: ExpenseLedgerRowDto[], job: ExpenseExportJobDto): Record<string, unknown>[] {
  const mapped: Record<string, unknown>[] = []
  const total = rows.length
  for (let i = 0; i < total; i += EXPORT_CHUNK_SIZE) {
    for (const row of rows.slice(i, i + EXPORT_CHUNK_SIZE)) mapped.push(row)
    emitExportJobProgress({ id: job.id, reportType: job.reportType, branchId: job.branchId, rowsProcessed: mapped.length, totalRows: total })
  }
  if (total === 0) emitExportJobProgress({ id: job.id, reportType: job.reportType, branchId: job.branchId, rowsProcessed: 0, totalRows: 0 })
  return mapped
}

async function runExportPipeline(job: ExpenseExportJobDto, filters: ExpenseFilters): Promise<void> {
  try {
    // `expenseLedger` already returns the full filtered result set (capped, not paginated — see
    // `LEDGER_ROW_CAP`), exactly what an export needs; no separate unpaginated query to maintain.
    const rows = await expenseLedger(filters)
    const mappedRows = mapWithProgress(rows, job)

    const filterSummary = describeFilters(filters)
    const buffer = await buildStyledXlsxBuffer("Expense Tracker", filterSummary, EXPORT_COLUMNS, mappedRows)
    const fileName = `expense-tracker-${new Date().toISOString().slice(0, 10)}.xlsx`
    const { storageKey } = await saveExportFile(job.id, buffer)

    await updateExportJobStatus(job.id, { status: "completed", rowCount: mappedRows.length, fileName, storageKey })
    emitExportJobUpdate({ id: job.id, reportType: job.reportType, branchId: job.branchId, status: "completed", rowCount: mappedRows.length })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error while generating this export"
    await updateExportJobStatus(job.id, { status: "failed", errorMessage })
    emitExportJobUpdate({ id: job.id, reportType: job.reportType, branchId: job.branchId, status: "failed", errorMessage })
  }
}

export async function createExpensesExport(filters: ExpenseFilters, branchId: string | null): Promise<ExpenseExportJobDto> {
  const job = toExportJobDto(await createExportJob({ reportType: EXPENSES_REPORT_TYPE, branchId, filters }))
  emitExportJobUpdate({ id: job.id, reportType: job.reportType, branchId: job.branchId, status: "processing" })

  // Not awaited — same fire-and-forget shape as every other background export in this app.
  void runExportPipeline(job, filters)

  return job
}

export async function listExpensesExports(branchId?: string): Promise<ExpenseExportJobDto[]> {
  const jobs = await listExportJobs(branchId, EXPENSES_REPORT_TYPE)
  return jobs.map(toExportJobDto)
}

export async function getExpensesExportFileForDownload(id: string): Promise<{ buffer: Buffer; fileName: string }> {
  const job = await findExportJob(id)
  if (!job || job.status !== "completed" || !job.storageKey || !job.fileName) {
    throw new NotFoundError("Export not found, or it isn't ready to download yet")
  }
  return { buffer: await readExportFile(job.storageKey), fileName: job.fileName }
}
