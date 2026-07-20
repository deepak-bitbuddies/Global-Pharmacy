import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

import { branches } from "../uploads/model.js"

export const authUsers = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  // Set for branch_user accounts created from branch registration
  // (`admin/branches/service.ts`); null for the super-admin and any other
  // non-branch-scoped account.
  branchId: uuid("branch_id").references(() => branches.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export type AuthUserDocument = typeof authUsers.$inferSelect
export type NewAuthUserDocument = typeof authUsers.$inferInsert
