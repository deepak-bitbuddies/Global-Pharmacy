import { z } from "zod"

import { FileType } from "../uploads/enums.js"
import { SalesCollectionMode } from "./enums.js"

/**
 * Multi-select filter fields (branchId/company/item/supplier/supplierGroup) arrive as a repeated
 * query key (`?company=A&company=B`), which Fastify's querystring parser only turns into an array
 * once there's more than one — a single selection arrives as a bare string, so it's normalized to
 * a 1-element array here before validating each entry.
 */
const stringArrayFilter = (element: z.ZodString = z.string()) =>
  z.preprocess((value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]), z.array(element).min(1).optional())

export const reportFiltersSchema = z.object({
  branchId: stringArrayFilter(z.string().uuid()),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  company: stringArrayFilter(),
  item: stringArrayFilter(),
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
  collectionMode: z.preprocess(
    (value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]),
    z.array(z.enum([SalesCollectionMode.Cash, SalesCollectionMode.PaytmOnline, SalesCollectionMode.CreditDue])).min(1).optional(),
  ),
})
export const stockReportQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema).extend({
  expiryTier: z.enum(["expired", "lte30", "31to60", "61to90", "gt90", "none", "custom"]).optional(),
  expiryDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiryDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  supplier: stringArrayFilter(),
  stockFrom: z.coerce.number().optional(),
  stockTo: z.coerce.number().optional(),
})
// Same filter surface as Stock (it's built from the same `stockFilterClauses` helper).
export const nonMovingDetailQuerySchema = stockReportQuerySchema
export const purchaseSummaryQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
export const purchaseDetailQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema).extend({
  schemeTier: z.enum(["none", "lt5", "5to10", "10to20", "20to30", "30to50", "50to100", "gte100"]).optional(),
  supplierGroup: stringArrayFilter(),
  amountFrom: z.coerce.number().optional(),
  amountTo: z.coerce.number().optional(),
})
export const grossProfitQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)
export const daySalesDetailQuerySchema = reportFiltersSchema.merge(cursorPaginationSchema)

const reportTypeSchema = z.enum([FileType.Stock, FileType.Sales, FileType.Purchase, FileType.DayWiseSale])

/** Export can be requested for any of the four report types, so this is every optional filter field any of them use, unioned onto one schema — a field that doesn't apply to the requested `reportType` is simply ignored (same as `ReportFilters` already being one flat shared type across all four). */
export const createExportSchema = z
  .object({ reportType: reportTypeSchema })
  .merge(reportFiltersSchema)
  .extend({
    expiryTier: z.enum(["expired", "lte30", "31to60", "61to90", "gt90", "none", "custom"]).optional(),
    expiryDateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    expiryDateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    supplier: stringArrayFilter(),
    stockFrom: z.coerce.number().optional(),
    stockTo: z.coerce.number().optional(),
    schemeTier: z.enum(["none", "lt5", "5to10", "10to20", "20to30", "30to50", "50to100", "gte100"]).optional(),
    supplierGroup: stringArrayFilter(),
    amountFrom: z.coerce.number().optional(),
    amountTo: z.coerce.number().optional(),
  })

export const listExportJobsQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  reportType: reportTypeSchema.optional(),
})

export const exportIdParamSchema = z.object({
  id: z.string().uuid(),
})
