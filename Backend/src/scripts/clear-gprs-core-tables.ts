import { sql } from "drizzle-orm"
import { db, connectDatabase, disconnectDatabase } from "../core/database/db.js"

// One-off: wipes branches, import_batches, and items. CASCADE also clears
// the (expected-empty) stock_snapshots/sales_lines/purchase_lines/
// daily_sales_summary rows that still hold FK constraints into these three
// tables, since TRUNCATE blocks on constraint existence regardless of
// whether those tables actually have rows.
async function main() {
  await connectDatabase()
  await db.execute(sql`
    TRUNCATE TABLE
      "public"."branches",
      "public"."import_batches",
      "public"."items"
    CASCADE
  `)
  console.log("Cleared branches, import_batches, items (and any dependents via CASCADE)")
  await disconnectDatabase()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
