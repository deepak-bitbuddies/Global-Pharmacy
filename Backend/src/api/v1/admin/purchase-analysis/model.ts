import { date, index, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

/**
 * A fully separate module from the Stock/Purchase/Sales upload pipeline — its own import batches,
 * its own line-item table, no Stock→Purchase→Sales sequencing gate, super_admin only end to end
 * (see routes.ts). Sourced from Marg's "Party/Item Wise Purchase Analysis" export, which is a
 * *different* report family from the Purchase Register (`uploads/model.ts`'s `purchaseLines`) —
 * bill-level detail (one row per bill line) grouped by party then item, richer per-line columns
 * (GST, MRP, area/route, bank/PAN details) that the Purchase Register doesn't carry at all.
 *
 * Deliberately not branch-scoped — unlike Stock/Sales/Purchase, this report doesn't map cleanly
 * onto an existing branch (its own letterhead names a shop that isn't one of this app's registered
 * branches), and only a super_admin ever touches this module anyway. It's imported and reviewed as
 * one flat dataset; the bill's own `bill_date` (not an upload-time branch pick) is the filterable
 * date dimension.
 */
export const purchaseAnalysisImportBatches = pgTable("purchase_analysis_import_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileName: text("file_name").notNull(),
  // The report's own "PERIOD : dd-mm-yyyy TO dd-mm-yyyy" line — informational (unlike Stock/
  // Sales/Purchase, this module has no date-keyed replace-on-reupload behavior).
  periodFrom: date("period_from"),
  periodTo: date("period_to"),
  rowCount: integer("row_count").notNull().default(0),
  status: text("status").notNull().default("completed"),
  errorMessage: text("error_message"),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
})

export type PurchaseAnalysisImportBatchDocument = typeof purchaseAnalysisImportBatches.$inferSelect
export type NewPurchaseAnalysisImportBatchDocument = typeof purchaseAnalysisImportBatches.$inferInsert

export const purchaseAnalysisLines = pgTable(
  "purchase_analysis_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    importBatchId: uuid("import_batch_id")
      .notNull()
      .references(() => purchaseAnalysisImportBatches.id),
    partyName: text("party_name").notNull(),
    itemName: text("item_name").notNull(),
    billNo: text("bill_no").notNull(),
    billDate: date("bill_date"),
    // "Purc" | "P/Re" (purchase return) | "Pric" (price adjustment) | possibly others — free text,
    // not an enum: this is Marg's own vocabulary, not a value this app defines or fully controls.
    type: text("type"),
    pan: text("pan"),
    // Marg labels this column "Bank Acct No." on the export, but this shop's Marg setup actually
    // records which of its branches (e.g. "BHANDARI", "SARGAM", "RAJSAMAND") a bill belongs to
    // here — never a real bank account number in any export seen so far. Named for what it
    // actually holds, not the misleading source label.
    branchName: text("branch_name"),
    ifscCode: text("ifsc_code"),
    batch: text("batch"),
    qty: numeric("qty", { precision: 14, scale: 2, mode: "number" }),
    freeQty: numeric("free_qty", { precision: 14, scale: 2, mode: "number" }),
    rate: numeric("rate", { precision: 14, scale: 2, mode: "number" }),
    scheme: numeric("scheme", { precision: 14, scale: 2, mode: "number" }),
    discount: numeric("discount", { precision: 14, scale: 2, mode: "number" }),
    amount: numeric("amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
    gstPct: numeric("gst_pct", { precision: 6, scale: 2, mode: "number" }),
    taxAmount: numeric("tax_amount", { precision: 14, scale: 2, mode: "number" }),
    mrp: numeric("mrp", { precision: 14, scale: 2, mode: "number" }),
    mrpAmt: numeric("mrp_amt", { precision: 14, scale: 2, mode: "number" }),
    companyName: text("company_name"),
    areaName: text("area_name"),
    routeName: text("route_name"),
    saleType: text("sale_type"),
    gstNo: text("gst_no"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("purchase_analysis_lines_date_idx").on(table.billDate),
    index("purchase_analysis_lines_party_idx").on(table.partyName),
    index("purchase_analysis_lines_item_idx").on(table.itemName),
    index("purchase_analysis_lines_batch_idx").on(table.importBatchId),
    index("purchase_analysis_lines_branch_idx").on(table.branchName),
  ],
)

export type PurchaseAnalysisLineDocument = typeof purchaseAnalysisLines.$inferSelect
export type NewPurchaseAnalysisLineDocument = typeof purchaseAnalysisLines.$inferInsert
