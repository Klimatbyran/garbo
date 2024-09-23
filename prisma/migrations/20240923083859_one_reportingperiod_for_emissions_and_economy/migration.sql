/*
  Warnings:

  - A unique constraint covering the columns `[emissionsId]` on the table `ReportingPeriod` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[economyId]` on the table `ReportingPeriod` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod_emissionsId_key" ON "ReportingPeriod"("emissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod_economyId_key" ON "ReportingPeriod"("economyId");
