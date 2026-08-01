ALTER TABLE "import_batches" ADD COLUMN "date" date;--> statement-breakpoint
CREATE INDEX "import_batches_branch_type_date_idx" ON "import_batches" USING btree ("branch_id","file_type","date");