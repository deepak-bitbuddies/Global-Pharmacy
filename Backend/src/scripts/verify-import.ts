import { sql } from "drizzle-orm"
import { db, connectDatabase, disconnectDatabase } from "../core/database/db.js"

async function main() {
  await connectDatabase()

  const stock = await db.execute(sql`select count(*)::int as cnt, sum(value)::numeric as total, count(item_id)::int as linked from stock_snapshots`)
  console.log("stock_snapshots:", stock[0])

  const sales = await db.execute(sql`select count(*)::int as cnt, sum(amount)::numeric as total, count(item_id)::int as linked from sales_lines`)
  console.log("sales_lines:", sales[0])

  const purchase = await db.execute(sql`select count(*)::int as cnt, sum(amount)::numeric as total, count(item_id)::int as linked from purchase_lines`)
  console.log("purchase_lines:", purchase[0])

  const daySales = await db.execute(sql`select count(*)::int as cnt, sum(bill_value)::numeric as total from daily_sales_summary`)
  console.log("daily_sales_summary:", daySales[0])

  const branches = await db.execute(sql`select id, name, gstin, address from branches`)
  console.log("branches:", branches)

  const items = await db.execute(sql`select count(*)::int as cnt, count(code)::int as with_code from items`)
  console.log("items:", items[0])

  await disconnectDatabase()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
