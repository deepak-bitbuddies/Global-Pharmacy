import type { FastifyReply, FastifyRequest } from "fastify"
import type { MultipartFile } from "@fastify/multipart"

import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { ForbiddenError } from "../../../../shared/errors/index.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import { bulkUploadBranchSchema, cycleStatusQuerySchema, listImportBatchesQuerySchema, uploadFileTypeSchema } from "./schema.js"
import { MissingFileError } from "./errors.js"
import { bulkImportFiles, getImportBatches, getUploadCycleStatus, importFile } from "./service.js"

function readMultipartField(file: MultipartFile, name: string): string | undefined {
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
  const result = await importFile({ fileType, branchId: branchId!, fileName: file.filename, buffer, actorRole: request.user.role as SystemRoleCode })

  sendSuccess(reply, result, "File received — processing", 202)
}

/** Multi-file bulk import — `super_admin` only (enforced in `routes.ts`), so there's no per-file role check to make here; each file's type is auto-detected from its own content instead of a client-supplied `fileType`. */
export async function bulkUploadFileHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const files: { fileName: string; buffer: Buffer }[] = []
  let branchId: string | undefined

  for await (const file of request.files()) {
    branchId = readMultipartField(file, "branchId") ?? branchId
    files.push({ fileName: file.filename, buffer: await file.toBuffer() })
  }

  if (files.length === 0) throw new MissingFileError()
  const { branchId: validBranchId } = validateSchema(bulkUploadBranchSchema, { branchId })

  const result = await bulkImportFiles(validBranchId, files)
  sendSuccess(reply, result, `${result.receivedCount} file(s) received — processing in the background`, 202)
}

export async function listImportBatchesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { branchId: requestedBranchId, fileType } = validateSchema(listImportBatchesQuerySchema, request.query)
  const branchId = resolveBranchScope(request, requestedBranchId)
  const batches = await getImportBatches(branchId, fileType)
  sendSuccess(reply, batches)
}

export async function uploadCycleStatusHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { branchId: requestedBranchId } = validateSchema(cycleStatusQuerySchema, request.query)
  const branchId = resolveBranchScope(request, requestedBranchId)
  sendSuccess(reply, await getUploadCycleStatus(branchId!))
}
