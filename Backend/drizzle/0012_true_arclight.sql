CREATE TABLE "purchase_analysis_import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"period_from" date,
	"period_to" date,
	"row_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"error_message" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_analysis_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"import_batch_id" uuid NOT NULL,
	"party_name" text NOT NULL,
	"item_name" text NOT NULL,
	"bill_no" text NOT NULL,
	"bill_date" date,
	"type" text,
	"pan" text,
	"bank_acct_no" text,
	"ifsc_code" text,
	"batch" text,
	"qty" numeric(14, 2),
	"free_qty" numeric(14, 2),
	"rate" numeric(14, 2),
	"scheme" numeric(14, 2),
	"discount" numeric(14, 2),
	"amount" numeric(14, 2) NOT NULL,
	"gst_pct" numeric(6, 2),
	"tax_amount" numeric(14, 2),
	"mrp" numeric(14, 2),
	"mrp_amt" numeric(14, 2),
	"company_name" text,
	"area_name" text,
	"route_name" text,
	"sale_type" text,
	"gst_no" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_analysis_import_batches" ADD CONSTRAINT "purchase_analysis_import_batches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_analysis_lines" ADD CONSTRAINT "purchase_analysis_lines_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_analysis_lines" ADD CONSTRAINT "purchase_analysis_lines_import_batch_id_purchase_analysis_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."purchase_analysis_import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "purchase_analysis_batches_branch_idx" ON "purchase_analysis_import_batches" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "purchase_analysis_lines_branch_date_idx" ON "purchase_analysis_lines" USING btree ("branch_id","bill_date");--> statement-breakpoint
CREATE INDEX "purchase_analysis_lines_party_idx" ON "purchase_analysis_lines" USING btree ("party_name");--> statement-breakpoint
CREATE INDEX "purchase_analysis_lines_item_idx" ON "purchase_analysis_lines" USING btree ("item_name");--> statement-breakpoint
CREATE INDEX "purchase_analysis_lines_batch_idx" ON "purchase_analysis_lines" USING btree ("import_batch_id");