import type { FastifyRequest } from "fastify"

import { SystemRoleCode } from "../enums/index.js"
import { ForbiddenError } from "../errors/index.js"

/** A `branch_user` can only ever see their own branch's data — whatever `branchId` they passed (or omitted) is overwritten server-side, never merely validated. */
export function scopeToUserBranch<T extends { branchId?: string }>(request: FastifyRequest, filters: T): T {
  if (request.user.role !== SystemRoleCode.BRANCH_USER) return filters
  if (!request.user.branchId) throw new ForbiddenError("This account isn't linked to a branch")
  return { ...filters, branchId: request.user.branchId }
}
