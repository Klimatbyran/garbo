-- CreateTable
CREATE TABLE "RecoveredImage" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "picture_index" INTEGER NOT NULL,
    "page" INTEGER,
    "description" TEXT,
    "ocr_text" TEXT,
    "thumbnail" TEXT NOT NULL,
    "has_text" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveredImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecoveredImage_reportId_idx" ON "RecoveredImage"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "RecoveredImage_reportId_picture_index_key" ON "RecoveredImage"("reportId", "picture_index");

-- AddForeignKey
ALTER TABLE "RecoveredImage" ADD CONSTRAINT "RecoveredImage_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
