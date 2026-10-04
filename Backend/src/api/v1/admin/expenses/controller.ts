import path from "node:path"

import type { FastifyReply, FastifyRequest } from "fastify"
import type { MultipartFile } from "@fastify/multipart"

import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { scopeToUserBranch, scopeToUserBranchList } from "../../../../shared/helpers/scope-to-user-branch.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { ValidationError } from "../../../../shared/errors/index.js"
import {
  createExpenseSchema,
  createExpensesExportSchema,
  expenseFiltersSchema,
  expenseIdParamSchema,
  listExpensesExportsQuerySchema,
  expensesExportIdParamSchema,
  reviewExpenseSchema,
  updateExpenseSchema,
} from "./schema.js"
import {
  attachExpenseProof,
  createExpense,
  createExpensesExport,
  deleteExpense,
  expenseLedger,
  expenseSummary,
  getExpenseProof,
  getExpensesExportFileForDownload,
  listExpensesExports,
  reviewExpense,
  updateExpense,
} from "./service.js"

export async function createExpenseHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = scopeToUserBranch(request, validateSchema(createExpenseSchema, request.body))
  sendSuccess(reply, await createExpense(input, request.user), "Entry recorded", 201)
}

export async function expenseLedgerHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(expenseFiltersSchema, request.query))
  sendSuccess(reply, await expenseLedger(filters))
}

export async function expenseSummaryHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(expenseFiltersSchema, request.query))
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

export async function uploadExpenseProofHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(expenseIdParamSchema, request.params)
  const file: MultipartFile | undefined = await request.file()
  if (!file) throw new ValidationError("No file was uploaded")
  const buffer = await file.toBuffer()
  sendSuccess(reply, await attachExpenseProof(id, request.user, buffer, file.filename), "Proof uploaded")
}

// Matches the proof picker's `accept="image/*,.pdf"` on the frontend — anything else was never
// accepted at upload time, so this is an exhaustive-enough map, not a general-purpose one.
const PROOF_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
}

export async function downloadExpenseProofHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(expenseIdParamSchema, request.params)
  const { buffer, fileName } = await getExpenseProof(id, request.user)
  // Without an explicit Content-Type, Fastify falls back to application/octet-stream for a raw
  // Buffer — the browser then has no way to know this is an image/PDF, so it force-downloads it
  // instead of letting the frontend preview it inline (or the download itself has the wrong
  // association and won't open). `inline` (vs `attachment`) is what lets an <img>/<iframe> render
  // it directly when fetched as a blob, while still carrying the real filename for the Download button.
  const contentType = PROOF_MIME_TYPES[path.extname(fileName).toLowerCase()] ?? "application/octet-stream"
  reply.header("Content-Type", contentType).header("Content-Disposition", `inline; filename="${fileName}"`).send(buffer)
}

// super_admin only — enforced at the route (extra `requireRole` on top of the group hook) and again in `reviewExpense` itself.
export async function reviewExpenseHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(expenseIdParamSchema, request.params)
  const { action, rejectionReason } = validateSchema(reviewExpenseSchema, request.body)
  sendSuccess(reply, await reviewExpense(id, action, request.user, rejectionReason), "Entry reviewed")
}

export async function createExpensesExportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const filters = scopeToUserBranchList(request, validateSchema(createExpensesExportSchema, request.body))
  // `export_jobs.branch_id` is a single nullable column (used only to filter the export-history
  // panel by branch) — kept populated for the common single-branch case, null for zero/multiple.
  const job = await createExpensesExport(filters, filters.branchId?.length === 1 ? filters.branchId[0] : null)
  sendSuccess(reply, job, "Export started — processing in background", 202)
}

export async function listExpensesExportsHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { branchId: requestedBranchId } = validateSchema(listExpensesExportsQuerySchema, request.query)
  const { branchId } = scopeToUserBranch(request, { branchId: requestedBranchId })
  sendSuccess(reply, await listExpensesExports(branchId))
}

export async function downloadExpensesExportHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(expensesExportIdParamSchema, request.params)
  const { buffer, fileName } = await getExpensesExportFileForDownload(id)
  reply
    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    .header("Content-Disposition", `attachment; filename="${fileName}"`)
    .send(buffer)
}
