import * as XLSX from "xlsx"

import { extractLetterhead, parseMargDateFullYear, parseMargNumber, type BranchHeader, type SheetRow } from "./parse-utils.js"
import { extractPartyGroupedRows, letterheadNameLine, parseQtyAndUnit } from "./party-grouped.js"

export type ParsedSalesRow = {
  partyGroup: string
  itemNameRaw: string
  packSizeRaw: string | null
  qty: number | null
  unit: string | null
  rate: number | null
  amount: number
  pctContribution: number | null
}

export type ParsedSalesFile = {
  branch: BranchHeader
  // Null when the "FROM dd-mm-yyyy-dd-mm-yyyy" header couldn't be parsed — callers must validate,
  // not silently default to today (a wrong silent date would corrupt the upload sequence gate).
  reportDateFrom: string | null
  reportDateTo: string | null
  rows: ParsedSalesRow[]
}

export function parseSalesFile(buffer: Buffer): ParsedSalesFile {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: SheetRow[] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" })

  const branch = extractLetterhead(rows)

  const dateMatch = /FROM\s+(\d{2}-\d{2}-\d{4})-(\d{2}-\d{2}-\d{4})/i.exec(rows[6]?.[0] ?? "")
  const reportDateFrom = dateMatch ? parseMargDateFullYear(dateMatch[1]) : null
  const reportDateTo = dateMatch ? parseMargDateFullYear(dateMatch[2]) : null

  const grouped = extractPartyGroupedRows(rows, 10, letterheadNameLine(branch))

  const parsedRows: ParsedSalesRow[] = []
  for (const { group, cells } of grouped) {
    const itemNameRaw = (cells[0] ?? "").trim()
    const amount = parseMargNumber(cells[3] ?? "")
    if (!itemNameRaw || amount === null) continue // not a real item line

    const { qty, unit } = parseQtyAndUnit(cells[1] ?? "")

    parsedRows.push({
      partyGroup: group,
      itemNameRaw,
      packSizeRaw: splitPackSize(itemNameRaw),
      qty,
      unit,
      rate: parseMargNumber(cells[2] ?? ""),
      amount,
      pctContribution: parseMargNumber(cells[4] ?? ""),
    })
  }

  return {
    branch,
    reportDateFrom,
    reportDateTo,
    rows: parsedRows,
  }
}

/**
 * Best-effort split of a run-together "<name>   <pack size>" cell (e.g.
 * "10-D I.V.          1*500ML" → pack "1*500ML"). Cosmetic only — matching
 * sales lines to stock items uses the untouched `itemNameRaw`, not this.
 */
function splitPackSize(raw: string): string | null {
  const match = /^(.*\S)\s{2,}(\S+)$/.exec(raw)
  return match ? match[2] : null
}
