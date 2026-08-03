ALTER TABLE "stock_snapshots" ADD COLUMN "sales_scheme_deal" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "stock_snapshots" ADD COLUMN "sales_scheme_free" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "stock_snapshots" ADD COLUMN "purc_scheme_deal" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "stock_snapshots" ADD COLUMN "purc_scheme_free" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "stock_snapshots" ADD COLUMN "rec_date" date;