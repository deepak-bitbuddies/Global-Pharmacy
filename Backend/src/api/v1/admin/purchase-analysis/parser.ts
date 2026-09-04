import { collapseWhitespace, parseMargDateFullMonthYear, parseMargNumber, type SheetRow } from "../uploads/parsers/parse-utils.js"

export type ParsedPurchaseAnalysisRow = {
  partyName: string
  itemName: string
  billNo: string
  billDate: string | null
  type: string | null
  pan: string | null
  branchName: string | null
  ifscCode: string | null
  batch: string | null
  qty: number | null
  freeQty: number | null
  rate: number | null
  scheme: number | null
  discount: number | null
  amount: number
  gstPct: number | null
  taxAmount: number | null
  mrp: number | null
  mrpAmt: number | null
  companyName: string | null
  areaName: string | null
  routeName: string | null
  saleType: string | null
  gstNo: string | null
}

export type ParsedPurchaseAnalysisFile = {
  shopName: string
  shopAddress: string | null
  periodFrom: string | null
  periodTo: string | null
  rows: ParsedPurchaseAnalysisRow[]
}

const HEADER_ROW_INDEX = 5
const DATA_START_INDEX = 6

/**
 * Every field this parser reads, looked up by its exact column header name rather than a fixed
 * position — Marg has already reshuffled this report's layout once (a July 2026 export had 24
 * columns in this order; an August 2026 export inserted "Month"/"Pin Code"/"Expriy Date" [sic] and
 * many more, growing it to 67, with the original columns scattered to new positions), so a
 * positional match silently mis-mapped or broke entirely on the second file. Only these named
 * columns are read; any extra columns a wider export carries are simply ignored.
 *
 * "Bank Acct No." is Marg's own label, but this shop's Marg setup actually records which branch
 * (e.g. "BHANDARI", "SARGAM", "RAJSAMAND") a bill belongs to there — never a real bank account
 * number in either export seen so far.
 */
const COLUMN_NAMES = {
  partyName: "Party Name",
  itemName: "Item Name",
  billNo: "Bill No#",
  date: "Date",
  type: "Type",
  pan: "PAN",
  branchName: "Bank Acct No.",
  ifscCode: "IFSC Code",
  batch: "Batch",
  qty: "Qty",
  freeQty: "Free Qty",
  rate: "Rate",
  scheme: "Scheme",
  discount: "Discount",
  amount: "Amount",
  gstPct: "GST %",
  taxAmount: "Tax Amount",
  mrp: "MRP",
  mrpAmt: "MRP Amt",
  companyName: "Company Name",
  areaName: "Area Name",
  routeName: "Route Name",
  saleType: "Sale Type",
  gstNo: "GST No.",
} as const

/** Column-name -> index map built from the header row — the whole point being that a column's position no longer matters, only its label does. */
function buildHeaderIndex(headerRow: SheetRow): Map<string, number> {
  const index = new Map<string, number>()
  headerRow.forEach((cell, i) => {
    const label = collapseWhitespace(cell)
    if (label && !index.has(label)) index.set(label, i)
  })
  return index
}

/**
 * Unlike the Party/Item Wise Sale export (a single header row per party group, items nested under
 * it), this report repeats the party AND item name on *every* row — including its own two tiers
 * of subtotal rows (an item subtotal where `Bill No#` reads "TOTAL", and a party subtotal where
 * `Item Name` reads "TOTAL"), plus a final grand-total row with blank/whitespace-only labels. That
 * means every real bill-line row is self-contained and independently identifiable — no running
 * "current group" state to track, just filter out the three kinds of non-detail rows.
 */
function isDetailRow(row: SheetRow, headerIndex: Map<string, number>): boolean {
  const partyName = (row[headerIndex.get(COLUMN_NAMES.partyName) ?? -1] ?? "").trim()
  const itemName = (row[headerIndex.get(COLUMN_NAMES.itemName) ?? -1] ?? "").trim()
  const billNo = (row[headerIndex.get(COLUMN_NAMES.billNo) ?? -1] ?? "").trim()
  return partyName !== "" && itemName !== "" && itemName !== "TOTAL" && billNo !== "" && billNo !== "TOTAL"
}

function nullableText(raw: string | undefined): string | null {
  const trimmed = (raw ?? "").trim()
  return trimmed === "" ? null : trimmed
}

export function parsePurchaseAnalysisFile(rows: SheetRow[]): ParsedPurchaseAnalysisFile {
  const shopName = collapseWhitespace(rows[0]?.[0] ?? "")
  const shopAddress = nullableText(collapseWhitespace(rows[1]?.[0] ?? ""))

  const periodMatch = /PERIOD\s*:\s*(\d{2}-\d{2}-\d{4})\s*TO\s*(\d{2}-\d{2}-\d{4})/i.exec(rows[3]?.[0] ?? "")
  const periodFrom = periodMatch ? periodMatch[1].split("-").reverse().join("-") : null
  const periodTo = periodMatch ? periodMatch[2].split("-").reverse().join("-") : null

  const headerIndex = buildHeaderIndex(rows[HEADER_ROW_INDEX] ?? [])
  const cell = (row: SheetRow, name: string): string => {
    const i = headerIndex.get(name)
    return i === undefined ? "" : (row[i] ?? "")
  }

  // A defensive check, not a hard requirement — if a future export doesn't even carry these core
  // columns (wrong file entirely, or Marg reshuffles again in some incompatible way), this at
  // least fails loudly rather than silently inserting empty/mis-mapped rows.
  const headerMatches = [COLUMN_NAMES.partyName, COLUMN_NAMES.itemName, COLUMN_NAMES.billNo, COLUMN_NAMES.amount].every((name) => headerIndex.has(name))

  const parsedRows: ParsedPurchaseAnalysisRow[] = []
  if (headerMatches) {
    for (let i = DATA_START_INDEX; i < rows.length; i++) {
      const row = rows[i]
      if (!isDetailRow(row, headerIndex)) continue

      const amount = parseMargNumber(cell(row, COLUMN_NAMES.amount))
      if (amount === null) continue // not a real amount — skip rather than insert a bad row

      parsedRows.push({
        partyName: collapseWhitespace(cell(row, COLUMN_NAMES.partyName)),
        itemName: collapseWhitespace(cell(row, COLUMN_NAMES.itemName)),
        billNo: cell(row, COLUMN_NAMES.billNo).trim(),
        billDate: parseMargDateFullMonthYear(cell(row, COLUMN_NAMES.date)),
        type: nullableText(cell(row, COLUMN_NAMES.type)),
        pan: nullableText(cell(row, COLUMN_NAMES.pan)),
        branchName: nullableText(cell(row, COLUMN_NAMES.branchName)),
        ifscCode: nullableText(cell(row, COLUMN_NAMES.ifscCode)),
        batch: nullableText(cell(row, COLUMN_NAMES.batch)),
        qty: parseMargNumber(cell(row, COLUMN_NAMES.qty)),
        freeQty: parseMargNumber(cell(row, COLUMN_NAMES.freeQty)),
        rate: parseMargNumber(cell(row, COLUMN_NAMES.rate)),
        scheme: parseMargNumber(cell(row, COLUMN_NAMES.scheme)),
        discount: parseMargNumber(cell(row, COLUMN_NAMES.discount)),
        amount,
        gstPct: parseMargNumber(cell(row, COLUMN_NAMES.gstPct)),
        taxAmount: parseMargNumber(cell(row, COLUMN_NAMES.taxAmount)),
        mrp: parseMargNumber(cell(row, COLUMN_NAMES.mrp)),
        mrpAmt: parseMargNumber(cell(row, COLUMN_NAMES.mrpAmt)),
        companyName: nullableText(cell(row, COLUMN_NAMES.companyName)),
        areaName: nullableText(cell(row, COLUMN_NAMES.areaName)),
        routeName: nullableText(cell(row, COLUMN_NAMES.routeName)),
        saleType: nullableText(cell(row, COLUMN_NAMES.saleType)),
        gstNo: nullableText(cell(row, COLUMN_NAMES.gstNo)),
      })
    }
  }

  return { shopName, shopAddress, periodFrom, periodTo, rows: parsedRows }
}
