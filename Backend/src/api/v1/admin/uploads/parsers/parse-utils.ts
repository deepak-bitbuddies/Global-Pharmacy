export type SheetRow = string[]

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
}

/** Parses Marg's "DD-Mon-YY" dates (e.g. "13-Mar-26" → "2026-03-13"). Returns null if unparseable. */
export function parseMargDateShortYear(raw: string): string | null {
  const trimmed = raw.trim()
  const match = /^(\d{2})-([A-Za-z]{3})-(\d{2})$/.exec(trimmed)
  if (!match) return null
  const [, day, monRaw, yy] = match
  const mon = MONTHS[monRaw as keyof typeof MONTHS]
  if (!mon) return null
  return `20${yy}-${mon}-${day}`
}

/** Parses "DD-MM-YYYY" dates (e.g. "01-07-2026" → "2026-07-01"). Returns null if unparseable. */
export function parseMargDateFullYear(raw: string): string | null {
  const trimmed = raw.trim()
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(trimmed)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

/** Strips thousands separators and parses a decimal. Returns null for blank/dash placeholders. */
export function parseMargNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "")
  if (trimmed === "" || trimmed === "-" || /^-+$/.test(trimmed)) return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

/** Collapses internal whitespace runs to a single space and trims — used for item-name matching. */
export function collapseWhitespace(raw: string): string {
  return raw.replace(/\s+/g, " ").trim()
}

export function normalizeItemName(raw: string): string {
  return collapseWhitespace(raw).toUpperCase()
}

export type BranchHeader = {
  name: string
  address: string | null
  phone: string | null
  gstin: string | null
  drugLicenseNo: string | null
}

/**
 * Extracts the shop letterhead block Marg prints at the top of every report
 * (name+address on one line, then Phone/D.L.No./GSTIN each on their own
 * line). This is the only place branch identity appears — it's never a data
 * column. Works for the 5-line letterhead used by Sale/Purchase/Day-Wise
 * Sale exports; the Stock export only has a 1-line name+address header (see
 * `extractStockBranchHeader`).
 */
export function extractLetterhead(rows: SheetRow[]): BranchHeader {
  // Unlike the Stock export (name+address combined on one line), Sale/
  // Purchase/Day-Wise Sale print the shop name and address as two separate
  // lines: row 0 is the name only, row 1 is the address only.
  const name = collapseWhitespace(rows[0]?.[0] ?? "")
  const address = collapseWhitespace(rows[1]?.[0] ?? "") || null
  const phoneMatch = /Phone\s*:\s*(.+)/i.exec(rows[2]?.[0] ?? "")
  const dlMatch = /D\.L\.No\.\s*:\s*(.+)/i.exec(rows[3]?.[0] ?? "")
  const gstinMatch = /GSTIN\s*:\s*(.+)/i.exec(rows[4]?.[0] ?? "")

  return {
    name,
    address,
    phone: phoneMatch ? phoneMatch[1].trim() : null,
    gstin: gstinMatch ? gstinMatch[1].trim() : null,
    drugLicenseNo: dlMatch ? dlMatch[1].trim() : null,
  }
}

/** Stock export only has one letterhead line: "<name>   <address>" (row 0). */
export function extractStockBranchHeader(rows: SheetRow[]): Pick<BranchHeader, "name" | "address"> {
  return splitNameAndAddress(collapseWhitespace(rows[0]?.[0] ?? ""))
}

function splitNameAndAddress(line: string): { name: string; address: string | null } {
  // Marg pads the shop name with a long run of spaces before the address;
  // `collapseWhitespace` already reduced that run to one space by the time
  // we get here, so we can't split on whitespace width anymore. Every
  // sample address in these exports starts with a building/plot number
  // (e.g. "90,L-ROAD BHOPALPURA, UDAIPUR"), so split at the first digit
  // instead — simple and reliable for this data, though it would misfire on
  // a shop name that itself contains a digit.
  const firstDigitIndex = line.search(/\d/)
  if (firstDigitIndex <= 0) return { name: line, address: null }

  const name = line.slice(0, firstDigitIndex).trim()
  const address = line.slice(firstDigitIndex).trim()
  return { name: name || line, address: address || null }
}
