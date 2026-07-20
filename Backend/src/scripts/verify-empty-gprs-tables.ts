import { sql } from "drizzle-orm"
import { db, connectDatabase, disconnectDatabase } from "../core/database/db.js"

async function main() {
  await connectDatabase()
  const tables = ["branches", "items", "import_batches", "stock_snapshots", "sales_lines", "purchase_lines", "daily_sales_summary"]
  for (const t of tables) {
    const [row] = await db.execute(sql.raw(`select count(*)::int as cnt from "${t}"`))
    console.log(t, row?.cnt)
  }
  await disconnectDatabase()
}
main()
