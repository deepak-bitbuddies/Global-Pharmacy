ALTER TABLE "purchase_analysis_import_batches" DROP CONSTRAINT "purchase_analysis_import_batches_branch_id_branches_id_fk";
--> statement-breakpoint
ALTER TABLE "purchase_analysis_lines" DROP CONSTRAINT "purchase_analysis_lines_branch_id_branches_id_fk";
--> statement-breakpoint
DROP INDEX "purchase_analysis_batches_branch_idx";--> statement-breakpoint
DROP INDEX "purchase_analysis_lines_branch_date_idx";--> statement-breakpoint
CREATE INDEX "purchase_analysis_lines_date_idx" ON "purchase_analysis_lines" USING btree ("bill_date");--> statement-breakpoint
ALTER TABLE "purchase_analysis_import_batches" DROP COLUMN "branch_id";--> statement-breakpoint
ALTER TABLE "purchase_analysis_lines" DROP COLUMN "branch_id";