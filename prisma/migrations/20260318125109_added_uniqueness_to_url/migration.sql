/*
  Warnings:

  - A unique constraint covering the columns `[url]` on the table `Report` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Report_companyName_reportYear_key";

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "companyName" DROP NOT NULL,
ALTER COLUMN "reportYear" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Report_url_key" ON "Report"("url");
