-- Contract step of plan 0006. Apply only AFTER the release that stops reading
-- full_name is live — until then the deployed code still selects it, and
-- dropping it returns 500 on sign-in.
--
-- The previous release created accounts with full_name and no parts in the
-- minutes between the expand migration and its own deploy. Fill those in first,
-- with the same crude split as the expand migration, or SET NOT NULL below
-- fails on them.
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
  SELECT "id", regexp_replace(btrim(coalesce("full_name", '')), '\s+', ' ', 'g') AS n
  FROM "users"
  WHERE "first_name" IS NULL OR "last_name" IS NULL
) AS s
WHERE u."id" = s."id";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "full_name";