-- AlterTable
ALTER TABLE "ReportRunJob" ADD COLUMN     "markdown" TEXT,
ADD COLUMN     "prompt" TEXT,
ADD COLUMN     "queryTexts" JSONB;
