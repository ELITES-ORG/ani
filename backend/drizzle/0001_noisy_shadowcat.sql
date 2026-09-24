ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "middle_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suffix" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "municipality_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "barangay_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address_detail" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipalities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Crude split on the last space for a handful of test accounts only.
-- There are no real users yet. This is not a name-parsing strategy — do not
-- reuse it, extend it, or treat the result as authoritative.
UPDATE "users"
SET
  "first_name" = CASE
    WHEN position(' ' in trim("full_name")) = 0 THEN trim("full_name")
    ELSE left(trim("full_name"), length(trim("full_name")) - position(' ' in reverse(trim("full_name"))))
  END,
  "last_name" = CASE
    WHEN position(' ' in trim("full_name")) = 0 THEN trim("full_name")
    ELSE reverse(split_part(reverse(trim("full_name")), ' ', 1))
  END;
