import { sql } from "drizzle-orm"
import { db, connectDatabase, disconnectDatabase } from "../core/database/db.js"

async function main() {
  await connectDatabase()
  const batches = await db.execute(sql`
    select ib.id, ib.file_name, ib.row_count, ib.imported_at, b.name as branch_name
    from import_batches ib
    join branches b on b.id = ib.branch_id
    where ib.file_type = 'stock'
    order by ib.imported_at
  `)
  console.log("stock batches:", batches)

  const totalRows = await db.execute(sql`select count(*)::int as cnt, sum(value)::numeric as total from stock_snapshots`)
  console.log("stock_snapshots total:", totalRows[0])

  await disconnectDatabase()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
