import { date, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { branches } from "../uploads/model.js"

/** A branch's own cash-in-hand spend — tea, breakfast, local transport, stationery, anything paid out of pocket rather than through Purchase/Sales. `category` is free text (not a fixed enum) so a branch can log anything; the frontend just suggests common presets. */
export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  branchId: uuid("branch_id").notNull().references(() => branches.id),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
  description: text("description"),
  expenseDate: date("expense_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type ExpenseDocument = typeof expenses.$inferSelect
export type NewExpenseDocument = typeof expenses.$inferInsert
