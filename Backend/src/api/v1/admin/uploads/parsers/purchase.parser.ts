import { extractLetterhead, parseMargDateFullYear, parseMargNumber, type BranchHeader, type SheetRow } from "./parse-utils.js"
import { extractPartyGroupedRows, letterheadNameLine, parseQtyAndUnit, reconcileQty } from "./party-grouped.js"

export type ParsedPurchaseRow = {
  supplierGroup: string
  itemNameRaw: string
  packSizeRaw: string | null
  qty: number | null
  freeQty: number | null
  rate: number | null
  amount: number
  pctContribution: number | null
  schemePct: number | null
}

export type ParsedPurchaseFile = {
  branch: BranchHeader
  // Null when the "FROM dd-mm-yyyy-dd-mm-yyyy" header couldn't be parsed — callers must validate,
  // not silently default to today (a wrong silent date would corrupt the upload sequence gate).
  reportDateFrom: string | null
  reportDateTo: string | null
  rows: ParsedPurchaseRow[]
}

export function parsePurchaseFile(rows: SheetRow[]): ParsedPurchaseFile {
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

    const rate = parseMargNumber(cells[2] ?? "")
    const { namePack, qty: parsedQty } = splitTrailingQty(rawNameAndQty)
    const qty = reconcileQty(parsedQty, amount, rate)
    // Free qty has no `amount`/`rate` of its own to reconcile a dropped loose remainder against
    // (it's the bonus units, never separately billed) — best-effort strip count only, same
    // limitation `parseQtyAndUnit` has always had here.
    const { qty: freeQty } = parseQtyAndUnit(cells[1] ?? "")

    parsedRows.push({
      supplierGroup: group,
      itemNameRaw: namePack,
      packSizeRaw: splitPackSize(namePack),
      qty,
      freeQty,
      rate,
      amount,
      pctContribution: parseMargNumber(cells[4] ?? ""),
      schemePct: calculateSchemePct(qty, freeQty),
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
 * Purchase register (unlike Sale) has the purchase qty run into the same
 * cell as the item name/pack, at the very end (e.g.
 * " TROCAR CATH 08    1PCS                -2" → qty -2, or the "12:0"
 * strip:loose format like "AUGMENTIN 625 TAB  1*10              12:0").
 */
function splitTrailingQty(raw: string): { namePack: string; qty: { qty: number | null; hasLooseRemainder: boolean } } {
  const match = /^(.*?)\s+(-?\d+(?:\.\d+)?(?::\d+(?:\.\d+)?)?)$/.exec(raw)
  if (!match) return { namePack: raw, qty: { qty: null, hasLooseRemainder: false } }

  const [, namePack, qtyToken] = match
  const [stripPart, loosePart] = qtyToken.split(":")
  const qty = Number(stripPart)
  const hasLooseRemainder = loosePart !== undefined && Number(loosePart) !== 0
  return { namePack: namePack.trim(), qty: { qty: Number.isFinite(qty) ? qty : null, hasLooseRemainder } }
}

function splitPackSize(raw: string): string | null {
  const match = /^(.*\S)\s{2,}(\S+)$/.exec(raw)
  return match ? match[2] : null
}

/**
 * The scheme % implied by the free qty on a line, e.g. billing 100 units and
 * receiving 10 free is a "10% scheme" (free / billed qty), not free / total
 * received — that's the trade convention this is meant to match.
 */
function calculateSchemePct(qty: number | null, freeQty: number | null): number | null {
  if (!qty || qty <= 0 || !freeQty || freeQty <= 0) return null
  return Math.round((freeQty / qty) * 10000) / 100
}
