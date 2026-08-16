import { integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { branches } from "../uploads/model.js"
import type { ReportFilters } from "./dto.js"

/**
 * A background report export — mirrors `import_batches`' processing/completed/failed shape, but
 * (unlike an import) a completed job also has a generated file sitting on disk (see
 * `core/storage/export-storage.ts`) that outlives the request that created it, hence `fileName`/
 * `storageKey` instead of just a row count.
 */
export const exportJobs = pgTable("export_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportType: text("report_type").notNull(), // "stock" | "sales" | "purchase" | "day_wise_sale" — same values as uploads' FileType
  // Null when the export wasn't scoped to a single branch (no branchId filter applied).
  branchId: uuid("branch_id").references(() => branches.id),
  // Snapshot of the ReportFilters used to produce this file — display context only, never re-read to regenerate.
  filters: jsonb("filters").$type<ReportFilters>().notNull(),
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
