-- AlterTable
ALTER TABLE "Report"
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "s3Url" TEXT,
ADD COLUMN     "s3Key" TEXT,
ADD COLUMN     "s3Bucket" TEXT,
ADD COLUMN     "sha256" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Report_sourceUrl_key" ON "Report"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Report_sha256_key" ON "Report"("sha256");

