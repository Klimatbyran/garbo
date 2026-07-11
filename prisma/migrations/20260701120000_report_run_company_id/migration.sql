-- Phase 3: stable company identity on archive rows (prefer internal id over wikidataId).
ALTER TABLE "ReportRun" ADD COLUMN "companyId" TEXT;
ALTER TABLE "ReportRunJob" ADD COLUMN "companyId" TEXT;

CREATE INDEX "ReportRun_companyId_idx" ON "ReportRun"("companyId");
CREATE INDEX "ReportRunJob_companyId_idx" ON "ReportRunJob"("companyId");
