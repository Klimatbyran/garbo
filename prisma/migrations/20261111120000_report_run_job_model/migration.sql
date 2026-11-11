-- AlterTable
ALTER TABLE "ReportRunJob" ADD COLUMN "model" TEXT;

-- CreateIndex
CREATE INDEX "ReportRunJob_model_idx" ON "ReportRunJob"("model");
