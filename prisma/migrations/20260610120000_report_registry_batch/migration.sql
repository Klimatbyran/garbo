-- Link registry Report rows to Garbo Batch for Validate registry filtering.
-- batch_id is optional (nullable); existing and new rows without a batch stay NULL.

ALTER TABLE "Report" ADD COLUMN "batch_id" TEXT;
CREATE INDEX "Report_batch_id_idx" ON "Report"("batch_id");

ALTER TABLE "Report" ADD CONSTRAINT "Report_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "Batch"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
