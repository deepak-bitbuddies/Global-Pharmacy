import * as XLSX from "xlsx"

import { extractLetterhead, parseMargDateFullYear, parseMargNumber, type BranchHeader, type SheetRow } from "./parse-utils.js"
import { extractPartyGroupedRows, letterheadNameLine, parseQtyAndUnit } from "./party-grouped.js"

export type ParsedPurchaseRow = {
  supplierGroup: string
  itemNameRaw: string
  packSizeRaw: string | null
  qty: number | null
  freeQty: number | null
  rate: number | null
  amount: number
  pctContribution: number | null
}

export type ParsedPurchaseFile = {
  branch: BranchHeader
  reportDateFrom: string
  reportDateTo: string
  rows: ParsedPurchaseRow[]
}

export function parsePurchaseFile(buffer: Buffer): ParsedPurchaseFile {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: SheetRow[] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" })

  const branch = extractLetterhead(rows)

  const dateMatch = /FROM\s+(\d{2}-\d{2}-\d{4})-(\d{2}-\d{2}-\d{4})/i.exec(rows[6]?.[0] ?? "")
  const reportDateFrom = dateMatch ? parseMargDateFullYear(dateMatch[1]) : null
  const reportDateTo = dateMatch ? parseMargDateFullYear(dateMatch[2]) : null

  const grouped = extractPartyGroupedRows(rows, 10, letterheadNameLine(branch))

  const parsedRows: ParsedPurchaseRow[] = []
  for (const { group, cells } of grouped) {
    const amount = parseMargNumber(cells[3] ?? "")
    const rawNameAndQty = (cells[0] ?? "").trim()
    if (!rawNameAndQty || amount === null) continue

    const { namePack, qty } = splitTrailingQty(rawNameAndQty)
    const { qty: freeQty } = parseQtyAndUnit(cells[1] ?? "")

    parsedRows.push({
      supplierGroup: group,
      itemNameRaw: namePack,
      packSizeRaw: splitPackSize(namePack),
      qty,
      freeQty,
      rate: parseMargNumber(cells[2] ?? ""),
      amount,
      pctContribution: parseMargNumber(cells[4] ?? ""),
    })
  }

  return {
    branch,
    reportDateFrom: reportDateFrom ?? new Date().toISOString().slice(0, 10),
    reportDateTo: reportDateTo ?? new Date().toISOString().slice(0, 10),
    rows: parsedRows,
  }
}

/**
 * Purchase register (unlike Sale) has the purchase qty run into the same
 * cell as the item name/pack, at the very end (e.g.
 * " TROCAR CATH 08    1PCS                -2" → qty -2, or the "12:0"
 * strip:loose format like "AUGMENTIN 625 TAB  1*10              12:0").
 */
function splitTrailingQty(raw: string): { namePack: string; qty: number | null } {
  const match = /^(.*?)\s+(-?\d+(?:\.\d+)?(?::\d+(?:\.\d+)?)?)$/.exec(raw)
  if (!match) return { namePack: raw, qty: null }

  const [, namePack, qtyToken] = match
  const qty = Number(qtyToken.split(":")[0])
  return { namePack: namePack.trim(), qty: Number.isFinite(qty) ? qty : null }
}

function splitPackSize(raw: string): string | null {
  const match = /^(.*\S)\s{2,}(\S+)$/.exec(raw)
  return match ? match[2] : null
}
