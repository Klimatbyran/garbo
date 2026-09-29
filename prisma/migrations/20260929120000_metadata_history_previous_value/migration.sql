-- Append-only metadata history: value before each change + immutable createdAt for ordering.
ALTER TABLE "Metadata" ADD COLUMN IF NOT EXISTS "previousValue" JSONB;
ALTER TABLE "Metadata" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill createdAt from updatedAt so existing rows sort sensibly in history timelines.
UPDATE "Metadata" SET "createdAt" = "updatedAt" WHERE "createdAt" IS DISTINCT FROM "updatedAt";
