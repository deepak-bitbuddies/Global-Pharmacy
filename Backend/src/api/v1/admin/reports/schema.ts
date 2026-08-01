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

export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().positive().max(200).default(10),
})

export const itemWiseSalesQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
export const stockReportQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
export const purchaseSummaryQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
export const purchaseDetailQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema).extend({
  schemeTier: z.enum(["none", "lt5", "5to10", "10to20", "20to30", "30to50", "50to100", "gte100"]).optional(),
})
export const grossProfitQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
export const daySalesDetailQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
