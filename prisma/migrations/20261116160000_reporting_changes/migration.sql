-- CreateEnum
CREATE TYPE "ReportingChangeType" AS ENUM (
  'ACQUISITION',
  'MERGER',
  'DIVESTMENT',
  'BOUNDARY_CHANGE',
  'METHODOLOGY_CHANGE',
  'COVERAGE_CHANGE',
  'RESTATEMENT',
  'ACTIVITY_CHANGE',
  'NOT_REPORTED',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "EmissionsScopeKey" AS ENUM (
  'SCOPE_1',
  'SCOPE_2',
  'SCOPE_1_AND_2',
  'SCOPE_3',
  'STATED_TOTAL'
);

-- CreateEnum
CREATE TYPE "ReportingChangeImpact" AS ENUM (
  'INCREASE',
  'DECREASE',
  'MIXED'
);

-- CreateTable
CREATE TABLE "reporting_changes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "ReportingChangeType" NOT NULL,
    "description" TEXT NOT NULL,
    "effectiveYear" TEXT,
    "affectedYears" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "affectedScopes" "EmissionsScopeKey"[] DEFAULT ARRAY[]::"EmissionsScopeKey"[],
    "affectedScope3Categories" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "impactDirection" "ReportingChangeImpact",
    "priorYearsRestated" BOOLEAN,
    "counterpartyName" TEXT,
    "counterpartyCompanyId" TEXT,
    "reportId" TEXT,
    "source" TEXT,

    CONSTRAINT "reporting_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_change_quotes" (
    "id" TEXT NOT NULL,
    "reportingChangeId" TEXT NOT NULL,
    "originalQuote" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceReference" TEXT,
    "sourcePageUrl" TEXT,

    CONSTRAINT "reporting_change_quotes_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN "reportingChangeId" TEXT;

-- AlterTable
ALTER TABLE "review_flag_dismissals" ADD COLUMN "reasonCode" TEXT;
ALTER TABLE "review_flag_dismissals" ADD COLUMN "reportingChangeId" TEXT;

-- CreateIndex
CREATE INDEX "reporting_changes_companyId_effectiveYear_idx" ON "reporting_changes"("companyId", "effectiveYear");

-- CreateIndex
CREATE INDEX "reporting_changes_companyId_reportId_idx" ON "reporting_changes"("companyId", "reportId");

-- CreateIndex
CREATE INDEX "reporting_changes_reportId_idx" ON "reporting_changes"("reportId");

-- CreateIndex
CREATE INDEX "reporting_changes_counterpartyCompanyId_idx" ON "reporting_changes"("counterpartyCompanyId");

-- CreateIndex
CREATE INDEX "reporting_change_quotes_reportingChangeId_idx" ON "reporting_change_quotes"("reportingChangeId");

-- CreateIndex
CREATE INDEX "review_flag_dismissals_reportingChangeId_idx" ON "review_flag_dismissals"("reportingChangeId");

-- AddForeignKey
ALTER TABLE "reporting_changes" ADD CONSTRAINT "reporting_changes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_changes" ADD CONSTRAINT "reporting_changes_counterpartyCompanyId_fkey" FOREIGN KEY ("counterpartyCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_changes" ADD CONSTRAINT "reporting_changes_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_change_quotes" ADD CONSTRAINT "reporting_change_quotes_reportingChangeId_fkey" FOREIGN KEY ("reportingChangeId") REFERENCES "reporting_changes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_reportingChangeId_fkey" FOREIGN KEY ("reportingChangeId") REFERENCES "reporting_changes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_flag_dismissals" ADD CONSTRAINT "review_flag_dismissals_reportingChangeId_fkey" FOREIGN KEY ("reportingChangeId") REFERENCES "reporting_changes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
