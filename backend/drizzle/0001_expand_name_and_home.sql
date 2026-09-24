ALTER TABLE "users" ALTER COLUMN "full_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "middle_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "suffix" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "municipality_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "barangay_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "address_detail" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_municipality_id_municipalities_id_fk" FOREIGN KEY ("municipality_id") REFERENCES "public"."municipalities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_barangay_id_barangays_id_fk" FOREIGN KEY ("barangay_id") REFERENCES "public"."barangays"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Crude split for a handful of test accounts only. There are no real users
-- yet. This is not a name-parsing strategy — do not reuse it, extend it, or
-- treat the result as authoritative.
--
-- Everything before the last space becomes the first name. Runs of whitespace
-- are collapsed first, so "  Maria  Santos " gives "Maria" / "Santos" rather
-- than a first name with a trailing space.
--
-- Guarded by first_name IS NULL so the contract migration can run it again to
-- catch accounts the previous release created after this one was applied.
UPDATE "users" AS u
SET
  "first_name" = CASE
    WHEN position(' ' in s.n) = 0 THEN s.n
    ELSE left(s.n, length(s.n) - position(' ' in reverse(s.n)))
  END,
  "last_name" = CASE
    WHEN position(' ' in s.n) = 0 THEN s.n
    ELSE reverse(split_part(reverse(s.n), ' ', 1))
  END
FROM (
  SELECT "id", regexp_replace(btrim("full_name"), '\s+', ' ', 'g') AS n
  FROM "users"
  WHERE "first_name" IS NULL AND "full_name" IS NOT NULL
) AS s
WHERE u."id" = s."id";
