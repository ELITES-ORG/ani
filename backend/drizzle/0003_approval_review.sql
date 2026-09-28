CREATE TYPE "public"."account_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."vendor_status" ADD VALUE 'rejected' BEFORE 'suspended';--> statement-breakpoint
-- Every account that exists before ADR 0020 is approved: nobody using Ani
-- today is locked out. Only accounts created from here on start pending.
ALTER TABLE "users" ADD COLUMN "approval_status" "account_approval_status" DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "approval_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_approval_status_idx" ON "users" USING btree ("approval_status");