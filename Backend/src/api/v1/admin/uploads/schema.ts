import { z } from "zod"

import { FileType } from "./enums.js"

export const uploadFileTypeSchema = z.object({
  fileType: z.enum([FileType.Stock, FileType.Sales, FileType.Purchase, FileType.DayWiseSale]),
})
