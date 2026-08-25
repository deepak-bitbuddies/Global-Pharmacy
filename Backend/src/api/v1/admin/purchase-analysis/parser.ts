import { collapseWhitespace, parseMargDateFullMonthYear, parseMargNumber, type SheetRow } from "../uploads/parsers/parse-utils.js"

export type ParsedPurchaseAnalysisRow = {
  partyName: string
  itemName: string
  billNo: string
  billDate: string | null
  type: string | null
  pan: string | null
  bankAcctNo: string | null
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
 * Unlike the Party/Item Wise Sale export (a single header row per party group, items nested under
 * it), this report repeats the party AND item name on *every* row — including its own two tiers
 * of subtotal rows (an item subtotal where `Bill No#` reads "TOTAL", and a party subtotal where
 * `Item Name` reads "TOTAL"), plus a final grand-total row with blank/whitespace-only labels. That
 * means every real bill-line row is self-contained and independently identifiable — no running
 * "current group" state to track, just filter out the three kinds of non-detail rows.
 */
function isDetailRow(row: SheetRow): boolean {
  const partyName = (row[0] ?? "").trim()
  const itemName = (row[1] ?? "").trim()
  const billNo = (row[2] ?? "").trim()
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

  // A defensive check, not a hard requirement — if a future export ever reorders columns this at
  // least fails loudly in dev rather than silently mis-mapping every field.
  const header = (rows[HEADER_ROW_INDEX] ?? []).map((cell) => collapseWhitespace(cell))
  const expectedHeader = [
    "Party Name",
    "Item Name",
    "Bill No#",
    "Date",
    "Type",
    "PAN",
    "Bank Acct No.",
    "IFSC Code",
    "Batch",
    "Qty",
    "Free Qty",
    "Rate",
    "Scheme",
    "Discount",
    "Amount",
  ]
  const headerMatches = expectedHeader.every((label, i) => header[i] === label)

  const parsedRows: ParsedPurchaseAnalysisRow[] = []
  if (headerMatches) {
    for (let i = DATA_START_INDEX; i < rows.length; i++) {
      const row = rows[i]
      if (!isDetailRow(row)) continue

      const amount = parseMargNumber(row[14] ?? "")
      if (amount === null) continue // not a real amount — skip rather than insert a bad row

      parsedRows.push({
        partyName: collapseWhitespace(row[0]),
        itemName: collapseWhitespace(row[1]),
        billNo: (row[2] ?? "").trim(),
        billDate: parseMargDateFullMonthYear(row[3] ?? ""),
        type: nullableText(row[4]),
        pan: nullableText(row[5]),
        bankAcctNo: nullableText(row[6]),
        ifscCode: nullableText(row[7]),
        batch: nullableText(row[8]),
        qty: parseMargNumber(row[9] ?? ""),
        freeQty: parseMargNumber(row[10] ?? ""),
        rate: parseMargNumber(row[11] ?? ""),
        scheme: parseMargNumber(row[12] ?? ""),
        discount: parseMargNumber(row[13] ?? ""),
        amount,
        gstPct: parseMargNumber(row[15] ?? ""),
        taxAmount: parseMargNumber(row[16] ?? ""),
        mrp: parseMargNumber(row[17] ?? ""),
        mrpAmt: parseMargNumber(row[18] ?? ""),
        companyName: nullableText(row[19]),
        areaName: nullableText(row[20]),
        routeName: nullableText(row[21]),
        saleType: nullableText(row[22]),
        gstNo: nullableText(row[23]),
      })
    }
  }

  return { shopName, shopAddress, periodFrom, periodTo, rows: parsedRows }
}
