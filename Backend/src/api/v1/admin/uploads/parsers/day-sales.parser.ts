import * as XLSX from "xlsx"

import { extractLetterhead, parseMargDateFullYear, parseMargNumber, type BranchHeader, type SheetRow } from "./parse-utils.js"

export type ParsedDaySalesRow = {
  date: string
  billNoRange: string | null
  billValue: number
  taxable: number | null
  taxPayable: number | null
  taxFree: number | null
  exempted: number | null
  roundOff: number | null
}

export type ParsedDaySalesFile = {
  branch: BranchHeader
  rows: ParsedDaySalesRow[]
}

export function parseDaySalesFile(buffer: Buffer): ParsedDaySalesFile {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: SheetRow[] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" })

  const branch = extractLetterhead(rows)

  const parsedRows: ParsedDaySalesRow[] = []

  // Data starts at row 9 (row 8 is the column header). Ends at the
  // "Total : N" row, followed by the marketing footer line.
  for (let i = 9; i < rows.length; i++) {
    const row = rows[i]
    const rawDate = (row[0] ?? "").trim()
    const date = parseMargDateFullYear(rawDate)
    if (!date) continue // "Total : N" row or footer, neither parses as a date

    const billValue = parseMargNumber(row[2] ?? "")
    if (billValue === null) continue

    parsedRows.push({
      date,
      billNoRange: nullIfBlank(row[1]),
      billValue,
      taxable: parseMargNumber(row[3] ?? ""),
      taxPayable: parseMargNumber(row[4] ?? ""),
      taxFree: parseMargNumber(row[5] ?? ""),
      exempted: parseMargNumber(row[6] ?? ""),
      roundOff: parseMargNumber(row[7] ?? ""),
    })
  }

  return { branch, rows: parsedRows }
}

function nullIfBlank(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim()
  return trimmed === "" ? null : trimmed
}
