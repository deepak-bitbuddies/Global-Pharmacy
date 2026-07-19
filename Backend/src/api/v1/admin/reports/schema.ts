import { z } from "zod"

export const reportFiltersSchema = z.object({
  branchId: z.string().uuid().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  company: z.string().optional(),
  item: z.string().optional(),
})

export const expiryQuerySchema = reportFiltersSchema.extend({
  withinDays: z.coerce.number().int().positive().default(30),
})
