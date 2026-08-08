// Manual dev-verification script — cross-checks parser output against known
// totals from the real sample Excel files. Not part of the app; run with
// `npx tsx src/scripts/verify-parsers.ts` after changing any parser.
import { readFileSync } from "node:fs"

import { readWorkbookRows } from "../api/v1/admin/uploads/parsers/parse-utils.js"
import { parseStockFile } from "../api/v1/admin/uploads/parsers/stock.parser.js"
import { parseSalesFile } from "../api/v1/admin/uploads/parsers/sales.parser.js"
import { parsePurchaseFile } from "../api/v1/admin/uploads/parsers/purchase.parser.js"
import { parseDaySalesFile } from "../api/v1/admin/uploads/parsers/day-sales.parser.js"

const FILES = {
  stock: "C:\\Users\\Deepak_Vyas\\Downloads\\STOCK 18-7-2026.xls",
  sales: "C:\\Users\\Deepak_Vyas\\Downloads\\SALE JULY 1-7-2026 TO 18-7-2026 ITEM WISE.XLS",
  purchase: "C:\\Users\\Deepak_Vyas\\Downloads\\PURCHASE 1-7-2026 TO 18-7-2026 ITEM WISE.XLS",
  daySales: "C:\\Users\\Deepak_Vyas\\Downloads\\DAY WISE SALE 1-7-2026 TO 18-7-2026.XLS",
}

console.log("\n########## STOCK ##########")
{
  const result = parseStockFile(readWorkbookRows(readFileSync(FILES.stock)))
  console.log("row count:", result.rows.length)
  console.log("SUM(value):", result.rows.reduce((s, r) => s + (r.value ?? 0), 0).toFixed(2), "(expected 1,844,243.28)")
}

console.log("\n########## SALES ##########")
{
  const result = parseSalesFile(readWorkbookRows(readFileSync(FILES.sales)))
  console.log("row count:", result.rows.length)
  console.log("SUM(amount):", result.rows.reduce((s, r) => s + r.amount, 0).toFixed(2), "(expected 865,704.84)")
  console.log("any TOTAL rows leaked?", result.rows.filter((r) => /^TOTAL\s*:/i.test(r.itemNameRaw)).length)
}

console.log("\n########## PURCHASE ##########")
{
  const result = parsePurchaseFile(readWorkbookRows(readFileSync(FILES.purchase)))
  console.log("row count:", result.rows.length)
  console.log("SUM(amount):", result.rows.reduce((s, r) => s + r.amount, 0).toFixed(2), "(expected 324,837.12)")
  console.log("any TOTAL rows leaked?", result.rows.filter((r) => /^TOTAL\s*:/i.test(r.itemNameRaw)).length)
}

console.log("\n########## DAY-WISE SALE ##########")
{
  const result = parseDaySalesFile(readWorkbookRows(readFileSync(FILES.daySales)))
  console.log("row count:", result.rows.length, "(expected 18)")
  console.log("SUM(billValue):", result.rows.reduce((s, r) => s + r.billValue, 0).toFixed(2), "(expected 963,435.00)")
}
