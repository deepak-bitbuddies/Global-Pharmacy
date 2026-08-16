ALTER TABLE "branches" ALTER COLUMN "contact_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "contact_first_name";--> statement-breakpoint
ALTER TABLE "branches" DROP COLUMN "contact_last_name";