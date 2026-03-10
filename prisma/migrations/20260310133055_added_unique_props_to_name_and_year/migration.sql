/*
  Warnings:

  - A unique constraint covering the columns `[companyName,reportYear]` on the table `Report` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Report_companyName_reportYear_key" ON "Report"("companyName", "reportYear");
