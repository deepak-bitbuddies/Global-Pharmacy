import { z } from "zod"

/** Same repeated-query-key normalization as every other module's multi-select filters (`?partyName=A&partyName=B`). Kept local rather than imported from `reports/schema.ts` — this module doesn't depend on another feature module's internals. */
const stringArrayFilter = (element: z.ZodString = z.string()) =>
  z.preprocess((value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]), z.array(element).min(1).optional())

export const purchaseAnalysisFiltersSchema = z.object({
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  partyName: stringArrayFilter(),
  itemName: stringArrayFilter(),
  company: stringArrayFilter(),
  type: stringArrayFilter(),
  area: stringArrayFilter(),
  route: stringArrayFilter(),
  search: z.string().optional(),
  amountFrom: z.coerce.number().optional(),
  amountTo: z.coerce.number().optional(),
  qtyFrom: z.coerce.number().optional(),
  qtyTo: z.coerce.number().optional(),
})

export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().positive().max(500).default(10),
})

export const purchaseAnalysisQuerySchema = purchaseAnalysisFiltersSchema.merge(cursorPaginationSchema)

export const idParamSchema = z.object({
  id: z.string().uuid(),
})
