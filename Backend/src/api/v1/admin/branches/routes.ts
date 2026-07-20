import type { FastifyInstance } from "fastify"

import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import { createBranchHandler, deleteBranchHandler, listBranchesHandler, updateBranchHandler } from "./controller.js"

// Branch management (create/edit/delete/list-all) is super_admin-only — a
// branch_user has no reason to call this module; their own branch comes
// from the already-scoped `admin/reports/branches` endpoint instead.
export async function branchesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", requireAuth)
  fastify.addHook("preHandler", requireRole(SystemRoleCode.SUPER_ADMIN))

  fastify.get("/", listBranchesHandler)
  fastify.post("/", createBranchHandler)
  fastify.patch("/:id", updateBranchHandler)
  fastify.delete("/:id", deleteBranchHandler)
}
