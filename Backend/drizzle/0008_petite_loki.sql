ALTER TABLE "branches" ADD COLUMN "contact_name" text;--> statement-breakpoint
UPDATE "branches" SET "contact_name" = trim(concat("contact_first_name", ' ', "contact_last_name"));