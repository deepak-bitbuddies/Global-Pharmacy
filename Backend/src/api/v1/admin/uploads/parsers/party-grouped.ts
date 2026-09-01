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
 *
 * The strip:loose form's loose count (e.g. the "3" in "0:3", 3 loose tablets
 * out of a part-sold strip) is deliberately NOT folded into `qty` here — this
 * export gives no reliable per-item strip size to convert it with. `qty` is
 * just the strip count; `hasLooseRemainder` flags that a nonzero loose count
 * was dropped, so a caller that also has `amount`/`rate` in scope can
 * reconstruct the true fractional qty via `reconcileQty` below instead of
 * silently truncating a part-strip sale/purchase to 0.
 */
export function parseQtyAndUnit(raw: string): { qty: number | null; unit: string | null; hasLooseRemainder: boolean } {
  const trimmed = raw.trim()
  const match = /^(-\d+(?:\.\d+)?(?::\d+(?:\.\d+)?)?|-|\d+(?:\.\d+)?(?::\d+(?:\.\d+)?)?)\s*(.*)$/.exec(trimmed)
  if (!match) return { qty: null, unit: trimmed || null, hasLooseRemainder: false }

  const [, qtyToken, unit] = match
  if (qtyToken === "-") return { qty: null, unit: unit || null, hasLooseRemainder: false }

  const [stripPart, loosePart] = qtyToken.split(":")
  const qty = Number(stripPart)
  const hasLooseRemainder = loosePart !== undefined && Number(loosePart) !== 0
  return { qty: Number.isFinite(qty) ? qty : null, unit: unit || null, hasLooseRemainder }
}

/**
 * Reconstructs the true qty when `parseQtyAndUnit`/a strip:loose split dropped a nonzero loose
 * remainder — `amount / rate` reconciles to the same fraction as loose-units/strip-size in every
 * sampled case (verified against real imports: e.g. a "0:3"-out-of-a-10-pack line and its
 * `amount / rate` both land on 0.30), without needing this export's unreliable pack-size text.
 * Falls back to the strip-only qty when there's nothing to reconcile against (`rate` null/0) or
 * nothing to fix (no loose remainder was dropped).
 */
export function reconcileQty(parsed: { qty: number | null; hasLooseRemainder: boolean }, amount: number, rate: number | null): number | null {
  if (!parsed.hasLooseRemainder || !rate) return parsed.qty
  return Math.round((amount / rate) * 100) / 100
}

export function letterheadNameLine(branch: BranchHeader): string {
  // The repeated pagination block reprints the shop name on its own line
  // (row 0's original form) — address is a separate line, so match on the
  // name alone here, not name+address combined.
  return branch.name
}
