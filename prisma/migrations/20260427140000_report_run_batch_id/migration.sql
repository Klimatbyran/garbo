-- AlterTable
ALTER TABLE "ReportRun" ADD COLUMN "batch_id" TEXT;

-- CreateIndex
CREATE INDEX "ReportRun_batch_id_idx" ON "ReportRun"("batch_id");
