import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { branches } from "../uploads/model.js"
import type { ReportFilters } from "./dto.js"
import type { PurchaseAnalysisFilters } from "../purchase-analysis/dto.js"

/**
 * A background export job — mirrors `import_batches`' processing/completed/failed shape, but
 * (unlike an import) a completed job also has a generated file sitting on disk (see
 * `core/storage/export-storage.ts`) that outlives the request that created it, hence `fileName`/
 * `storageKey` instead of just a row count. Lives here (rather than being duplicated per module)
 * since Reports got here first — `purchase-analysis/service.ts` reuses this same table/CRUD
 * (`createExportJob`/`updateExportJobStatus`/`findExportJob`/`listExportJobs` below) for its own
 * "Party Wise Analysis" export rather than standing up a second copy of this whole job lifecycle.
 */
export const exportJobs = pgTable("export_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportType: text("report_type").notNull(), // "stock" | "sales" | "purchase" | "day_wise_sale" | "purchase_analysis"
  // Null when the export wasn't scoped to a single branch (no branchId filter applied) — always
  // null for purchase-analysis, which isn't branch-scoped at all.
  branchId: uuid("branch_id").references(() => branches.id),
  // Snapshot of the filters used to produce this file — display context only, never re-read to regenerate.
  filters: jsonb("filters").$type<ReportFilters | PurchaseAnalysisFilters>().notNull(),
  status: text("status").notNull().default("processing"), // "processing" | "completed" | "failed"
  rowCount: integer("row_count").notNull().default(0),
  fileName: text("file_name"),
  storageKey: text("storage_key"),
  errorMessage: text("error_message"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
})

export type ExportJobDocument = typeof exportJobs.$inferSelect
export type NewExportJobDocument = typeof exportJobs.$inferInsert
