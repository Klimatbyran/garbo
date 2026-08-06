-- CreateTable
CREATE TABLE "report_types" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "report_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_types_slug_key" ON "report_types"("slug");

-- AlterTable
ALTER TABLE "Report" ADD COLUMN "reportTypeId" TEXT;

-- CreateIndex
CREATE INDEX "Report_reportTypeId_idx" ON "Report"("reportTypeId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportTypeId_fkey" FOREIGN KEY ("reportTypeId") REFERENCES "report_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
