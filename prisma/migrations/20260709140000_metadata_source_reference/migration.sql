-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN "sourceReference" TEXT;

-- AlterTable
ALTER TABLE "ReportRunJob" ADD COLUMN "sourceReference" TEXT,
ADD COLUMN "extractionResult" JSONB;
