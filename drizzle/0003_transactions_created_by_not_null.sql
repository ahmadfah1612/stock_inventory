UPDATE "transactions" SET "created_by" = (SELECT "id" FROM "users" ORDER BY "created_at" LIMIT 1) WHERE "created_by" IS NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "created_by" SET NOT NULL;
