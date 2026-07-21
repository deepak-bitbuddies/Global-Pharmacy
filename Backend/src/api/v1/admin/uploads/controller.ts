import type { FastifyReply, FastifyRequest } from "fastify"

import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { ForbiddenError } from "../../../../shared/errors/index.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import { listImportBatchesQuerySchema, uploadFileTypeSchema } from "./schema.js"
import { MissingFileError } from "./errors.js"
import { getImportBatches, importFile } from "./service.js"

function readMultipartField(file: NonNullable<Awaited<ReturnType<FastifyRequest["file"]>>>, name: string): string | undefined {
  const field = file.fields[name]
  return !Array.isArray(field) && field?.type === "field" ? String(field.value) : undefined
}

/** A `branch_user` can only ever act on their own branch — whatever `branchId` was requested (or omitted) is overwritten server-side, never merely validated. */
function resolveBranchScope(request: FastifyRequest, requestedBranchId: string | undefined): string | undefined {
  if (request.user.role !== SystemRoleCode.BRANCH_USER) return requestedBranchId
  if (!request.user.branchId) throw new ForbiddenError("This account isn't linked to a branch")
  return request.user.branchId
}

export async function uploadFileHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const file = await request.file()
  if (!file) throw new MissingFileError()

  const { fileType, branchId: requestedBranchId } = validateSchema(uploadFileTypeSchema, {
    fileType: readMultipartField(file, "fileType"),
    branchId: readMultipartField(file, "branchId"),
  })

  const branchId = resolveBranchScope(request, requestedBranchId)

  const buffer = await file.toBuffer()
  const result = await importFile({ fileType, branchId: branchId!, fileName: file.filename, buffer })

  sendSuccess(reply, result, result.replaced ? "File re-imported (previous data replaced)" : "File imported successfully")
}

export async function listImportBatchesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { branchId: requestedBranchId } = validateSchema(listImportBatchesQuerySchema, request.query)
  const branchId = resolveBranchScope(request, requestedBranchId)
  const batches = await getImportBatches(branchId)
  sendSuccess(reply, batches)
}
