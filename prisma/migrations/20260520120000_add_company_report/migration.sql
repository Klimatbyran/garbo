-- Add CompanyReport table and nullable companyReportId on ReportingPeriod.
--
-- This is a non-breaking, additive migration. The app continues to function with
-- companyReportId = NULL on all existing rows. A separate data migration script
-- (scripts/link-periods-to-company-reports.ts) populates the FK for existing rows.
--
-- @@unique([companyId, year]) on ReportingPeriod is kept in this migration.
-- It is replaced by @@unique([companyReportId, year]) in PR 2 once all rows
-- have companyReportId set and the write path has been updated.

-- CreateTable
CREATE TABLE "CompanyReport" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "registryReportId" TEXT,
    "reportYear" TEXT,
    "reportPublicationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: one CompanyReport per (company, report).
-- Postgres allows multiple NULLs in unique constraints (synthetic shells per company).
CREATE UNIQUE INDEX "CompanyReport_companyId_registryReportId_key" ON "CompanyReport"("companyId", "registryReportId");

-- AddForeignKey: CompanyReport -> Company
ALTER TABLE "CompanyReport" ADD CONSTRAINT "CompanyReport_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("wikidataId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CompanyReport -> Report (nullable; SET NULL if Report row is deleted)
ALTER TABLE "CompanyReport" ADD CONSTRAINT "CompanyReport_registryReportId_fkey"
    FOREIGN KEY ("registryReportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: add nullable companyReportId to ReportingPeriod
ALTER TABLE "ReportingPeriod" ADD COLUMN "companyReportId" TEXT;

-- AddForeignKey: ReportingPeriod -> CompanyReport (nullable; SET NULL on delete)
ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_companyReportId_fkey"
    FOREIGN KEY ("companyReportId") REFERENCES "CompanyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
