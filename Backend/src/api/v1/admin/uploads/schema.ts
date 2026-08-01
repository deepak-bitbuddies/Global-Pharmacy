import { z } from "zod"

import { FileType } from "./enums.js"

export const uploadFileTypeSchema = z.object({
  fileType: z.enum([FileType.Stock, FileType.Sales, FileType.Purchase, FileType.DayWiseSale]),
  branchId: z.string().uuid("A branch must be selected"),
})

export const listImportBatchesQuerySchema = z.object({
  branchId: z.string().uuid().optional(),
  fileType: z.enum([FileType.Stock, FileType.Sales, FileType.Purchase, FileType.DayWiseSale]).optional(),
})

export const cycleStatusQuerySchema = z.object({
  branchId: z.string().uuid("A branch must be selected"),
})
