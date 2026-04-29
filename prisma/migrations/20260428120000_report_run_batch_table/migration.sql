-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "externalKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Batch_externalKey_key" ON "Batch"("externalKey");

-- AlterTable
ALTER TABLE "ReportRun" ADD COLUMN "batch_db_id" TEXT;

-- Backfill Batch rows and FK from legacy batch_id (pipeline string)
INSERT INTO "Batch" ("id", "externalKey", "createdAt")
SELECT gen_random_uuid()::text, d."batch_id", CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "batch_id" AS batch_id FROM "ReportRun" WHERE "batch_id" IS NOT NULL) AS d;

UPDATE "ReportRun" AS r
SET "batch_db_id" = b."id"
FROM "Batch" AS b
WHERE r."batch_id" IS NOT NULL
  AND r."batch_id" = b."externalKey";

-- DropLegacy
DROP INDEX IF EXISTS "ReportRun_batch_id_idx";
ALTER TABLE "ReportRun" DROP COLUMN IF EXISTS "batch_id";

-- CreateIndex
CREATE INDEX "ReportRun_batch_db_id_idx" ON "ReportRun"("batch_db_id");

-- AddForeignKey
ALTER TABLE "ReportRun" ADD CONSTRAINT "ReportRun_batch_db_id_fkey" FOREIGN KEY ("batch_db_id") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
