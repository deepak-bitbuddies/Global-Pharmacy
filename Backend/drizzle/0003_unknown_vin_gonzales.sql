ALTER TABLE "users" ADD COLUMN "branch_id" uuid;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "contact_first_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "contact_last_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "contact_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "contact_phone" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;