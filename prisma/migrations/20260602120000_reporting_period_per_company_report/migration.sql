-- Require companyReportId; one period row per (CompanyReport, year).
-- Prerequisite: scripts/link-periods-to-company-reports.ts (no NULL companyReportId).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "ReportingPeriod" WHERE "companyReportId" IS NULL LIMIT 1
  ) THEN
    RAISE EXCEPTION
      'ReportingPeriod.companyReportId must be populated before this migration. Run scripts/link-periods-to-company-reports.ts';
  END IF;
END $$;

ALTER TABLE "ReportingPeriod" DROP CONSTRAINT "ReportingPeriod_companyReportId_fkey";

ALTER TABLE "ReportingPeriod" ALTER COLUMN "companyReportId" SET NOT NULL;

ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_companyReportId_fkey"
    FOREIGN KEY ("companyReportId") REFERENCES "CompanyReport"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX "ReportingPeriod_companyId_year_key";

CREATE UNIQUE INDEX "ReportingPeriod_companyReportId_year_key"
    ON "ReportingPeriod"("companyReportId", "year");

CREATE INDEX "ReportingPeriod_companyId_year_idx"
    ON "ReportingPeriod"("companyId", "year");
