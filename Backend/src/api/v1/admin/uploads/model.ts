import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const branches = pgTable("branches", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  // Nullable: GSTIN is the reliable branch key (present on Sale/Purchase/
  // Day-Wise Sale letterheads), but the Stock export's letterhead has no
  // GSTIN at all — that file falls back to matching by name instead.
  gstin: text("gstin").unique(),
  phone: text("phone"),
  drugLicenseNo: text("drug_license_no"),
  // The branch's point of contact — also the person who logs in as this
  // branch's user (see `admin/branches/service.ts`, which creates a linked
  // `authUsers` row from these same fields at registration time).
  contactFirstName: text("contact_first_name").notNull(),
  contactLastName: text("contact_last_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type BranchDocument = typeof branches.$inferSelect
export type NewBranchDocument = typeof branches.$inferInsert

export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").unique(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    unit: text("unit"),
    company: text("company"),
    manufacturer: text("manufacturer"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("items_normalized_name_idx").on(table.normalizedName)],
)

export type ItemDocument = typeof items.$inferSelect
export type NewItemDocument = typeof items.$inferInsert

export const importBatches = pgTable(
  "import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
    fileType: text("file_type").notNull(), // "stock" | "sales" | "purchase" | "day_wise_sale"
    fileName: text("file_name").notNull(),
    // The single calendar date this batch represents (Stock's "as on" date, Sales/Purchase's
    // report date, now that both are enforced single-day) — null for Day-Wise Sale, which is
    // exempt from the dated pipeline and can span many days in one file. Backs the date-keyed
    // replace lookup and the Stock -> Purchase -> Sales sequence gate.
    date: date("date"),
    rowCount: integer("row_count").notNull().default(0),
    status: text("status").notNull().default("completed"), // "completed" | "failed"
    errorMessage: text("error_message"),
    importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("import_batches_branch_type_date_idx").on(table.branchId, table.fileType, table.date),
  ],
)

export type ImportBatchDocument = typeof importBatches.$inferSelect
export type NewImportBatchDocument = typeof importBatches.$inferInsert

export const stockSnapshots = pgTable(
  "stock_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
    itemId: uuid("item_id").references(() => items.id),
    importBatchId: uuid("import_batch_id")
      .notNull()
      .references(() => importBatches.id),
    asOfDate: date("as_of_date").notNull(),
    itemCode: text("item_code"),
    itemName: text("item_name").notNull(),
    unit: text("unit"),
    currentStock: numeric("current_stock", { precision: 14, scale: 2, mode: "number" }).notNull(),
    costPrice: numeric("cost_price", { precision: 14, scale: 4, mode: "number" }),
    value: numeric("value", { precision: 14, scale: 2, mode: "number" }),
    mrp: numeric("mrp", { precision: 14, scale: 2, mode: "number" }),
    purchasePrice: numeric("purchase_price", { precision: 14, scale: 2, mode: "number" }),
    salesPrice: numeric("sales_price", { precision: 14, scale: 2, mode: "number" }),
    company: text("company"),
    manufacturer: text("manufacturer"),
    batch: text("batch"),
    mfgDateRaw: text("mfg_date_raw"),
    expDate: date("exp_date"),
    supplier: text("supplier"),
    invNo: text("inv_no"),
    invDate: date("inv_date"),
    rackNo: text("rack_no"),
    // Previously unparsed columns from the Stock export's "Sales Scheme"/"Purc.Scheme" (each
    // split into Deal/Free sub-columns) and "Rec.Date" (physical receipt date, distinct from
    // Inv.Date/the invoice date).
    salesSchemeDeal: numeric("sales_scheme_deal", { precision: 14, scale: 2, mode: "number" }),
    salesSchemeFree: numeric("sales_scheme_free", { precision: 14, scale: 2, mode: "number" }),
    purcSchemeDeal: numeric("purc_scheme_deal", { precision: 14, scale: 2, mode: "number" }),
    purcSchemeFree: numeric("purc_scheme_free", { precision: 14, scale: 2, mode: "number" }),
    recDate: date("rec_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("stock_snapshots_branch_idx").on(table.branchId, table.asOfDate),
    index("stock_snapshots_exp_date_idx").on(table.expDate),
  ],
)

export type StockSnapshotDocument = typeof stockSnapshots.$inferSelect
export type NewStockSnapshotDocument = typeof stockSnapshots.$inferInsert

export const salesLines = pgTable(
  "sales_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
    itemId: uuid("item_id").references(() => items.id),
    importBatchId: uuid("import_batch_id")
      .notNull()
      .references(() => importBatches.id),
    reportDateFrom: date("report_date_from").notNull(),
    reportDateTo: date("report_date_to").notNull(),
    partyGroup: text("party_group").notNull(),
    itemNameRaw: text("item_name_raw").notNull(),
    packSizeRaw: text("pack_size_raw"),
    qty: numeric("qty", { precision: 14, scale: 2, mode: "number" }),
    unit: text("unit"),
    rate: numeric("rate", { precision: 14, scale: 2, mode: "number" }),
    amount: numeric("amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
    pctContribution: numeric("pct_contribution", { precision: 6, scale: 2, mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("sales_lines_branch_date_idx").on(table.branchId, table.reportDateFrom, table.reportDateTo),
    index("sales_lines_party_group_idx").on(table.partyGroup),
  ],
)

export type SalesLineDocument = typeof salesLines.$inferSelect
export type NewSalesLineDocument = typeof salesLines.$inferInsert

export const purchaseLines = pgTable(
  "purchase_lines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
    itemId: uuid("item_id").references(() => items.id),
    importBatchId: uuid("import_batch_id")
      .notNull()
      .references(() => importBatches.id),
    reportDateFrom: date("report_date_from").notNull(),
    reportDateTo: date("report_date_to").notNull(),
    supplierGroup: text("supplier_group").notNull(),
    itemNameRaw: text("item_name_raw").notNull(),
    packSizeRaw: text("pack_size_raw"),
    qty: numeric("qty", { precision: 14, scale: 2, mode: "number" }),
    freeQty: numeric("free_qty", { precision: 14, scale: 2, mode: "number" }),
    rate: numeric("rate", { precision: 14, scale: 2, mode: "number" }),
    amount: numeric("amount", { precision: 14, scale: 2, mode: "number" }).notNull(),
    pctContribution: numeric("pct_contribution", { precision: 6, scale: 2, mode: "number" }),
    // Scheme % implied by the free qty received on this purchase line, e.g. 100 billed + 10 free = 9.09% —
    // distinct from `pctContribution` above, which is the line's % share of the party's total purchase amount.
    schemePct: numeric("scheme_pct", { precision: 6, scale: 2, mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("purchase_lines_branch_date_idx").on(table.branchId, table.reportDateFrom, table.reportDateTo),
  ],
)

export type PurchaseLineDocument = typeof purchaseLines.$inferSelect
export type NewPurchaseLineDocument = typeof purchaseLines.$inferInsert

export const dailySalesSummary = pgTable(
  "daily_sales_summary",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
    importBatchId: uuid("import_batch_id")
      .notNull()
      .references(() => importBatches.id),
    date: date("date").notNull(),
    billNoRange: text("bill_no_range"),
    billValue: numeric("bill_value", { precision: 14, scale: 2, mode: "number" }).notNull(),
    taxable: numeric("taxable", { precision: 14, scale: 2, mode: "number" }),
    taxPayable: numeric("tax_payable", { precision: 14, scale: 2, mode: "number" }),
    taxFree: numeric("tax_free", { precision: 14, scale: 2, mode: "number" }),
    exempted: numeric("exempted", { precision: 14, scale: 2, mode: "number" }),
    roundOff: numeric("round_off", { precision: 10, scale: 2, mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("daily_sales_summary_branch_date_idx").on(table.branchId, table.date)],
)

export type DailySalesSummaryDocument = typeof dailySalesSummary.$inferSelect
export type NewDailySalesSummaryDocument = typeof dailySalesSummary.$inferInsert
