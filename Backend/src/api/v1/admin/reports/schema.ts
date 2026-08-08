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
  pageSize: z.coerce.number().int().positive().max(500).default(10),
})

export const itemWiseSalesQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
export const salesDetailQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema).extend({
  amountFrom: z.coerce.number().optional(),
  amountTo: z.coerce.number().optional(),
})
export const stockReportQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema).extend({
  expiryTier: z.enum(["expired", "lte30", "31to60", "61to90", "gt90", "none", "custom"]).optional(),
  expiryDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiryDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  supplier: z.string().optional(),
  stockFrom: z.coerce.number().optional(),
  stockTo: z.coerce.number().optional(),
})
export const purchaseSummaryQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
export const purchaseDetailQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema).extend({
  schemeTier: z.enum(["none", "lt5", "5to10", "10to20", "20to30", "30to50", "50to100", "gte100"]).optional(),
  supplierGroup: z.string().optional(),
  amountFrom: z.coerce.number().optional(),
  amountTo: z.coerce.number().optional(),
})
export const grossProfitQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
export const daySalesDetailQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
