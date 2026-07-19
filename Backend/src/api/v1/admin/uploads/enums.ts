export const FileType = {
  Stock: "stock",
  Sales: "sales",
  Purchase: "purchase",
  DayWiseSale: "day_wise_sale",
} as const

export type FileTypeValue = (typeof FileType)[keyof typeof FileType]
