import type { FastifyInstance } from "fastify"

import { uploadsRoutes } from "./uploads/index.js"
import { reportsRoutes } from "./reports/index.js"
import { branchesRoutes } from "./branches/index.js"
import { expensesRoutes } from "./expenses/index.js"

export async function registerAdminRoutes(fastify: FastifyInstance): Promise<void> {
  await fastify.register(uploadsRoutes, { prefix: "/api/v1/admin/uploads" })
  await fastify.register(reportsRoutes, { prefix: "/api/v1/admin/reports" })
  await fastify.register(branchesRoutes, { prefix: "/api/v1/admin/branches" })
  await fastify.register(expensesRoutes, { prefix: "/api/v1/admin/expenses" })
}
