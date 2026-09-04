-- "Bank Acct No." is Marg's own column label, but this shop's Marg setup actually records which
-- branch a bill belongs to there (e.g. "BHANDARI", "SARGAM") — never a real bank account number in
-- any export seen so far. Renamed to reflect what it actually holds. Every row currently has NULL
-- here (no export imported so far has populated it), so this is a plain rename, no data migration.
ALTER TABLE "purchase_analysis_lines" RENAME COLUMN "bank_acct_no" TO "branch_name";
--> statement-breakpoint
CREATE INDEX "purchase_analysis_lines_branch_idx" ON "purchase_analysis_lines" USING btree ("branch_name");
