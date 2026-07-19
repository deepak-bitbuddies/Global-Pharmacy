import type { FastifyReply, FastifyRequest } from "fastify"

import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { uploadFileTypeSchema } from "./schema.js"
import { MissingFileError } from "./errors.js"
import { getImportBatches, importFile } from "./service.js"

export async function uploadFileHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const file = await request.file()
  if (!file) throw new MissingFileError()

  const fileTypeField = file.fields.fileType
  const rawFileType = !Array.isArray(fileTypeField) && fileTypeField?.type === "field" ? fileTypeField.value : undefined
  const { fileType } = validateSchema(uploadFileTypeSchema, { fileType: rawFileType })

  const buffer = await file.toBuffer()
  const result = await importFile({ fileType, fileName: file.filename, buffer })

  sendSuccess(reply, result, result.replaced ? "File re-imported (previous data replaced)" : "File imported successfully")
}

export async function listImportBatchesHandler(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const batches = await getImportBatches()
  sendSuccess(reply, batches)
}
