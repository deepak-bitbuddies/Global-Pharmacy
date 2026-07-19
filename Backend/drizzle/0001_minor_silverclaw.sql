CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"gstin" text NOT NULL,
	"phone" text,
	"drug_license_no" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "branches_gstin_unique" UNIQUE("gstin")
);
--> statement-breakpoint
CREATE TABLE "daily_sales_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"import_batch_id" uuid NOT NULL,
	"date" date NOT NULL,
	"bill_no_range" text,
	"bill_value" numeric(14, 2) NOT NULL,
	"taxable" numeric(14, 2),
	"tax_payable" numeric(14, 2),
	"tax_free" numeric(14, 2),
	"exempted" numeric(14, 2),
	"round_off" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"file_type" text NOT NULL,
	"file_name" text NOT NULL,
	"row_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"error_message" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"unit" text,
	"company" text,
	"manufacturer" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "purchase_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"item_id" uuid,
	"import_batch_id" uuid NOT NULL,
	"report_date_from" date NOT NULL,
	"report_date_to" date NOT NULL,
	"supplier_group" text NOT NULL,
	"item_name_raw" text NOT NULL,
	"pack_size_raw" text,
	"qty" numeric(14, 2),
	"free_qty" numeric(14, 2),
	"rate" numeric(14, 2),
	"amount" numeric(14, 2) NOT NULL,
	"pct_contribution" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"item_id" uuid,
	"import_batch_id" uuid NOT NULL,
	"report_date_from" date NOT NULL,
	"report_date_to" date NOT NULL,
	"party_group" text NOT NULL,
	"item_name_raw" text NOT NULL,
	"pack_size_raw" text,
	"qty" numeric(14, 2),
	"unit" text,
	"rate" numeric(14, 2),
	"amount" numeric(14, 2) NOT NULL,
	"pct_contribution" numeric(6, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"item_id" uuid,
	"import_batch_id" uuid NOT NULL,
	"as_of_date" date NOT NULL,
	"item_code" text,
	"item_name" text NOT NULL,
	"unit" text,
	"current_stock" numeric(14, 2) NOT NULL,
	"cost_price" numeric(14, 4),
	"value" numeric(14, 2),
	"mrp" numeric(14, 2),
	"purchase_price" numeric(14, 2),
	"sales_price" numeric(14, 2),
	"company" text,
	"manufacturer" text,
	"batch" text,
	"mfg_date_raw" text,
	"exp_date" date,
	"supplier" text,
	"inv_no" text,
	"inv_date" date,
	"rack_no" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_sales_summary" ADD CONSTRAINT "daily_sales_summary_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_sales_summary" ADD CONSTRAINT "daily_sales_summary_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_lines" ADD CONSTRAINT "sales_lines_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_lines" ADD CONSTRAINT "sales_lines_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_lines" ADD CONSTRAINT "sales_lines_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_snapshots" ADD CONSTRAINT "stock_snapshots_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_snapshots" ADD CONSTRAINT "stock_snapshots_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_snapshots" ADD CONSTRAINT "stock_snapshots_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_sales_summary_branch_date_idx" ON "daily_sales_summary" USING btree ("branch_id","date");--> statement-breakpoint
CREATE INDEX "items_normalized_name_idx" ON "items" USING btree ("normalized_name");--> statement-breakpoint
CREATE INDEX "purchase_lines_branch_date_idx" ON "purchase_lines" USING btree ("branch_id","report_date_from","report_date_to");--> statement-breakpoint
CREATE INDEX "sales_lines_branch_date_idx" ON "sales_lines" USING btree ("branch_id","report_date_from","report_date_to");--> statement-breakpoint
CREATE INDEX "sales_lines_party_group_idx" ON "sales_lines" USING btree ("party_group");--> statement-breakpoint
CREATE INDEX "stock_snapshots_branch_idx" ON "stock_snapshots" USING btree ("branch_id","as_of_date");--> statement-breakpoint
CREATE INDEX "stock_snapshots_exp_date_idx" ON "stock_snapshots" USING btree ("exp_date");