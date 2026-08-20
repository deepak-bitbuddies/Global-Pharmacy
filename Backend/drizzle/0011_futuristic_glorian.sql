ALTER TABLE "expenses" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "type" text DEFAULT 'expense' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "status" text DEFAULT 'posted' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "recipient" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "proof_document_key" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "proof_document_name" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "reviewed_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "reviewed_at" timestamp with time zone;