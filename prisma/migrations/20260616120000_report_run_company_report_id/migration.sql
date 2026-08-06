-- Link queue-archive runs to Garbo CompanyReport shells for Validate overview matching.
ALTER TABLE "ReportRun" ADD COLUMN "company_report_id" TEXT;

CREATE INDEX "ReportRun_company_report_id_idx" ON "ReportRun"("company_report_id");
