-- Human-assigned batch label (same value as pipeline `job.data.batchId`); clearer than "externalKey".
ALTER TABLE "Batch" RENAME COLUMN "externalKey" TO "batch_name";

ALTER INDEX "Batch_externalKey_key" RENAME TO "Batch_batch_name_key";
