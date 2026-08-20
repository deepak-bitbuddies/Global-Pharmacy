import type { FastifyInstance } from "fastify"

import { requireAuth, requireRole } from "../../../../core/auth/guards.js"
import { SystemRoleCode } from "../../../../shared/enums/index.js"
import {
  createExpenseHandler,
  deleteExpenseHandler,
  downloadExpenseProofHandler,
  expenseLedgerHandler,
  expenseSummaryHandler,
  reviewExpenseHandler,
  updateExpenseHandler,
  uploadExpenseProofHandler,
} from "./controller.js"

// Branch cash ledger — a branch_user manages their own branch's entries, a super_admin can
// see/manage across every branch and is the only role that can approve/reject a handover/transfer.
// No reason for customer/delivery_boy accounts to reach this.
export async function expensesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook("preHandler", requireAuth)
  fastify.addHook("preHandler", requireRole(SystemRoleCode.BRANCH_USER, SystemRoleCode.SUPER_ADMIN))

  fastify.post("/", createExpenseHandler)
  fastify.get("/", expenseLedgerHandler)
  fastify.get("/summary", expenseSummaryHandler)
  fastify.patch("/:id", updateExpenseHandler)
  fastify.delete("/:id", deleteExpenseHandler)
  fastify.post("/:id/proof", uploadExpenseProofHandler)
  fastify.get("/:id/proof", downloadExpenseProofHandler)
  fastify.patch("/:id/review", { preHandler: requireRole(SystemRoleCode.SUPER_ADMIN) }, reviewExpenseHandler)
}
