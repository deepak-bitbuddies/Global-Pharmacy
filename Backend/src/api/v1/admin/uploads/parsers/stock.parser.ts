import * as XLSX from "xlsx"

import {
  extractStockBranchHeader,
  parseMargDateShortYear,
  parseMargNumber,
  type SheetRow,
} from "./parse-utils.js"

export type ParsedStockRow = {
  itemCode: string
  itemName: string
  unit: string | null
  currentStock: number
  costPrice: number | null
  value: number | null
  mrp: number | null
  purchasePrice: number | null
  salesPrice: number | null
  company: string | null
  manufacturer: string | null
  batch: string | null
  mfgDateRaw: string | null
  expDate: string | null
  supplier: string | null
  invNo: string | null
  invDate: string | null
  rackNo: string | null
  salesSchemeDeal: number | null
  salesSchemeFree: number | null
  purcSchemeDeal: number | null
  purcSchemeFree: number | null
  recDate: string | null
}

export type ParsedStockFile = {
  branch: { name: string; address: string | null }
  // Null when "AS ON DATE dd-mm-yyyy" couldn't be parsed — callers must validate, not silently
  // default to today (a wrong silent date would corrupt the upload sequence gate).
  asOfDate: string | null
  rows: ParsedStockRow[]
}

const COL = {
  code: 0,
  productName: 1,
  unit: 2,
  currentStock: 3,
  salesSchemeDeal: 4,
  salesSchemeFree: 5,
  purcSchemeDeal: 6,
  purcSchemeFree: 7,
  costPrice: 8,
  value: 9,
  mrp: 10,
  purchasePrice: 11,
  salesPrice: 12,
  company: 13,
  manufacturer: 14,
  recDate: 15,
  batch: 16,
  mfg: 17,
  exp: 18,
  supplier: 19,
  invNo: 20,
  invDate: 21,
  rackNo: 22,
}

export function parseStockFile(buffer: Buffer): ParsedStockFile {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows: SheetRow[] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" })

  const branch = extractStockBranchHeader(rows)

  const asOfDateMatch = /AS ON DATE\s+(\d{2}-\d{2}-\d{4})/i.exec(rows[1]?.[0] ?? "")
  const asOfDate = asOfDateMatch ? isoFromDdMmYyyy(asOfDateMatch[1]) : null

  const parsedRows: ParsedStockRow[] = []

  // Data starts at row 4 (0: letterhead, 1: title, 2: header, 3: Deal/Free sub-header).
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i]
    const code = (row[COL.code] ?? "").trim()
    const name = (row[COL.productName] ?? "").trim()
    if (!code || !name) continue // blank separator row or the grand-total row

    parsedRows.push({
      itemCode: code,
      itemName: name,
      unit: nullIfBlank(row[COL.unit]),
      currentStock: parseMargNumber(row[COL.currentStock]) ?? 0,
      costPrice: parseMargNumber(row[COL.costPrice]),
      value: parseMargNumber(row[COL.value]),
      mrp: parseMargNumber(row[COL.mrp]),
      purchasePrice: parseMargNumber(row[COL.purchasePrice]),
      salesPrice: parseMargNumber(row[COL.salesPrice]),
      company: nullIfBlank(row[COL.company]),
      manufacturer: nullIfBlank(row[COL.manufacturer]),
      batch: nullIfBlank(row[COL.batch]),
      mfgDateRaw: nullIfBlank(row[COL.mfg]),
      expDate: parseMargDateShortYear(row[COL.exp] ?? ""),
      supplier: nullIfBlank(row[COL.supplier]),
      invNo: nullIfBlank(row[COL.invNo]),
      invDate: parseMargDateShortYear(row[COL.invDate] ?? ""),
      rackNo: nullIfBlank(row[COL.rackNo]),
      salesSchemeDeal: parseMargNumber(row[COL.salesSchemeDeal] ?? ""),
      salesSchemeFree: parseMargNumber(row[COL.salesSchemeFree] ?? ""),
      purcSchemeDeal: parseMargNumber(row[COL.purcSchemeDeal] ?? ""),
      purcSchemeFree: parseMargNumber(row[COL.purcSchemeFree] ?? ""),
      recDate: parseMargDateShortYear(row[COL.recDate] ?? ""),
    })
  }

  return { branch, asOfDate, rows: parsedRows }
}

function nullIfBlank(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim()
  return trimmed === "" ? null : trimmed
}

function isoFromDdMmYyyy(raw: string): string {
  const [day, month, year] = raw.split("-")
  return `${year}-${month}-${day}`
}
