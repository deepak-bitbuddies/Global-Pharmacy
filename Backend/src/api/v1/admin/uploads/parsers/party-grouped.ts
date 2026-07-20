import type { BranchHeader, SheetRow } from "./parse-utils.js"

export type PartyGroupedRow = {
  group: string
  cells: string[]
}

export type PartyGroupedHeader = {
  branch: BranchHeader
  reportDateFrom: string | null
  reportDateTo: string | null
}

/**
 * Marg's "Party/Item Wise" Sale and Purchase registers repeat the shop
 * letterhead + column header every ~60 rows (print pagination artifacts)
 * and group data rows under single-cell "party" headers (payment type for
 * Sale, supplier for Purchase). This walks the raw rows once, drops the
 * pagination noise, and returns only the real party-grouped data rows.
 */
export function extractPartyGroupedRows(rows: SheetRow[], dataStartIndex: number, branchNameLine: string): PartyGroupedRow[] {
  const result: PartyGroupedRow[] = []
  let currentGroup: string | null = null

  for (let i = dataStartIndex; i < rows.length; i++) {
    const row = rows[i]
    const nonEmpty = row.map((cell) => cell.trim()).filter((cell) => cell !== "")
    if (nonEmpty.length === 0) continue

    const first = nonEmpty[0]
    if (isPaginationNoise(first, branchNameLine)) continue

    if (nonEmpty.length === 1) {
      currentGroup = first
      continue
    }

    if (currentGroup) {
      result.push({ group: currentGroup, cells: row })
    }
  }

  return result
}

function isPaginationNoise(first: string, branchNameLine: string): boolean {
  if (branchNameLine && first.startsWith(branchNameLine)) return true

  return (
    /^Continued\.\./i.test(first) ||
    /^Phone\s*:/i.test(first) ||
    /^D\.L\.No\.\s*:/i.test(first) ||
    /^GSTIN\s*:/i.test(first) ||
    /^Report For\s*:/i.test(first) ||
    /^Company\s*:/i.test(first) ||
    /^D\s+E\s+S\s+C\s+R\s+I\s+P\s+T\s+I\s+O\s+N/i.test(first) ||
    /^GRAND TOTAL/i.test(first) ||
    /^TOTAL\s*:/i.test(first) || // per-party-group subtotal row, printed once at the end of every group
    /^I am satisfied with/i.test(first) ||
    /^PARTY\s*\/\s*ITEM WISE/i.test(first)
  )
}

/**
 * Splits a Marg "<qty> <unit>" cell into numeric qty + unit text. Handles
 * plain qty ("  1 INJ", " 27 SYP"), strip:loose ("1:0 TAB."), the blank
 * placeholder ("  - SYP"), and negative qty on sales-return lines ("-37
 * PCS") — the negative-number alternative must come before the bare "-"
 * placeholder alternative, or "-37" greedily matches as just "-" leaving
 * "37" stuck in the unit text.
 */
export function parseQtyAndUnit(raw: string): { qty: number | null; unit: string | null } {
  const trimmed = raw.trim()
  const match = /^(-\d+(?:\.\d+)?(?::\d+(?:\.\d+)?)?|-|\d+(?:\.\d+)?(?::\d+(?:\.\d+)?)?)\s*(.*)$/.exec(trimmed)
  if (!match) return { qty: null, unit: trimmed || null }

  const [, qtyToken, unit] = match
  if (qtyToken === "-") return { qty: null, unit: unit || null }

  const qty = Number(qtyToken.split(":")[0])
  return { qty: Number.isFinite(qty) ? qty : null, unit: unit || null }
}

export function letterheadNameLine(branch: BranchHeader): string {
  // The repeated pagination block reprints the shop name on its own line
  // (row 0's original form) — address is a separate line, so match on the
  // name alone here, not name+address combined.
  return branch.name
}
