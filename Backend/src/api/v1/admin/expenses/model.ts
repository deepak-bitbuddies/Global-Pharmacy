import { date, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { branches } from "../uploads/model.js"
import type { ExpenseStatusValue, ExpenseTypeValue } from "./enums.js"

/**
 * A branch's own cash-in-hand ledger — not just spend, but every way cash moves through a
 * branch's hand: money added ("credit"), spend ("expense" — tea, breakfast, local transport,
 * stationery, anything paid out of pocket), and money handed off to the authorised person, either
 * physically ("handover_cash") or via bank/UPI ("handover_bank"). The two handover types require
 * a proof document and super_admin approval before they're considered settled — see `status`.
 * `category` is free text (not a fixed enum) so a branch can log anything; the frontend just
 * suggests common presets, and only applies to `type: "expense"`.
 */
export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  // "expense" | "credit" | "handover_cash" | "handover_bank"
  type: text("type").notNull().default("expense").$type<ExpenseTypeValue>(),
  // "posted" (expense/credit — final the moment it's created) | "pending" | "approved" | "rejected"
  // (the latter three only apply to handover_cash/handover_bank, which need super_admin review).
  status: text("status").notNull().default("posted").$type<ExpenseStatusValue>(),
  category: text("category"),
  // Who a handover_cash/handover_bank entry was paid to — null for expense/credit.
  recipient: text("recipient"),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  description: text("description"),
  expenseDate: date("expense_date").notNull(),
  // Set once a proof screenshot/document is uploaded for a handover entry (see
  // `core/storage/proof-document-storage.ts`) — null until then, and required before it can be reviewed.
  proofDocumentKey: text("proof_document_key"),
  proofDocumentName: text("proof_document_name"),
  rejectionReason: text("rejection_reason"),
  reviewedByUserId: uuid("reviewed_by_user_id"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type ExpenseDocument = typeof expenses.$inferSelect
export type NewExpenseDocument = typeof expenses.$inferInsert
