import { eq } from "drizzle-orm"
import { db, connectDatabase, disconnectDatabase } from "../core/database/db.js"
import { importBatches, stockSnapshots } from "../api/v1/admin/uploads/model.js"

// One-off cleanup: removes the stale "stock.xls" test batch created before
// the branch-wide stock-replace fix existed, keeping the real upload.
const STALE_BATCH_ID = "802b604e-38ac-4560-82b6-2324969a23da"

async function main() {
  await connectDatabase()
  await db.delete(stockSnapshots).where(eq(stockSnapshots.importBatchId, STALE_BATCH_ID))
  await db.delete(importBatches).where(eq(importBatches.id, STALE_BATCH_ID))
  console.log("Deleted stale batch", STALE_BATCH_ID)
  await disconnectDatabase()
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
