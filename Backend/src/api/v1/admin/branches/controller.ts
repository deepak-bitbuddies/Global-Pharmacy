import type { FastifyReply, FastifyRequest } from "fastify"

import { sendSuccess } from "../../../../shared/helpers/http-response.js"
import { validateSchema } from "../../../../shared/validators/validate-schema.js"
import { branchIdParamSchema, createBranchSchema, listBranchesQuerySchema, updateBranchSchema } from "./schema.js"
import { createBranch, deleteBranch, getBranches, updateBranch } from "./service.js"

export async function listBranchesHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { cursor, pageSize } = validateSchema(listBranchesQuerySchema, request.query)
  const { rows, hasNextPage, nextCursor, total } = await getBranches({ cursor, pageSize })
  sendSuccess(reply, rows, "Success", 200, { nextCursor, hasNextPage, total, totalPages: Math.ceil(total / pageSize) })
}

export async function createBranchHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const input = validateSchema(createBranchSchema, request.body)
  const branch = await createBranch(input)
  sendSuccess(reply, branch, "Branch registered successfully")
}

export async function updateBranchHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(branchIdParamSchema, request.params)
  const input = validateSchema(updateBranchSchema, request.body)
  const branch = await updateBranch(id, input)
  sendSuccess(reply, branch, "Branch updated successfully")
}

export async function deleteBranchHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const { id } = validateSchema(branchIdParamSchema, request.params)
  await deleteBranch(id)
  sendSuccess(reply, null, "Branch deleted successfully")
}
