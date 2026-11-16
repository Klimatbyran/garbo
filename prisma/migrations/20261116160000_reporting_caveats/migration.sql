-- CreateEnum
CREATE TYPE "ReportingCaveatType" AS ENUM (
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
CREATE TYPE "ReportingCaveatImpact" AS ENUM (
  'INCREASE',
  'DECREASE',
  'MIXED'
);

-- CreateTable
CREATE TABLE "reporting_caveats" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "ReportingCaveatType" NOT NULL,
    "description" TEXT NOT NULL,
    "effectiveYear" TEXT,
    "affectedYears" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "affectedScopes" "EmissionsScopeKey"[] DEFAULT ARRAY[]::"EmissionsScopeKey"[],
    "affectedScope3Categories" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "impactDirection" "ReportingCaveatImpact",
    "priorYearsRestated" BOOLEAN,
    "counterpartyName" TEXT,
    "counterpartyCompanyId" TEXT,
    "reportId" TEXT,
    "source" TEXT,

    CONSTRAINT "reporting_caveats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporting_caveat_quotes" (
    "id" TEXT NOT NULL,
    "reportingCaveatId" TEXT NOT NULL,
    "originalQuote" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sourceReference" TEXT,
    "sourcePageUrl" TEXT,

    CONSTRAINT "reporting_caveat_quotes_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Metadata" ADD COLUMN "reportingCaveatId" TEXT;

-- AlterTable
ALTER TABLE "review_flag_dismissals" ADD COLUMN "reasonCode" TEXT;
ALTER TABLE "review_flag_dismissals" ADD COLUMN "reportingCaveatId" TEXT;

-- CreateIndex
CREATE INDEX "reporting_caveats_companyId_effectiveYear_idx" ON "reporting_caveats"("companyId", "effectiveYear");

-- CreateIndex
CREATE INDEX "reporting_caveats_companyId_reportId_idx" ON "reporting_caveats"("companyId", "reportId");

-- CreateIndex
CREATE INDEX "reporting_caveats_reportId_idx" ON "reporting_caveats"("reportId");

-- CreateIndex
CREATE INDEX "reporting_caveats_counterpartyCompanyId_idx" ON "reporting_caveats"("counterpartyCompanyId");

-- CreateIndex
CREATE INDEX "reporting_caveat_quotes_reportingCaveatId_idx" ON "reporting_caveat_quotes"("reportingCaveatId");

-- CreateIndex
CREATE INDEX "review_flag_dismissals_reportingCaveatId_idx" ON "review_flag_dismissals"("reportingCaveatId");

-- AddForeignKey
ALTER TABLE "reporting_caveats" ADD CONSTRAINT "reporting_caveats_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_caveats" ADD CONSTRAINT "reporting_caveats_counterpartyCompanyId_fkey" FOREIGN KEY ("counterpartyCompanyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_caveats" ADD CONSTRAINT "reporting_caveats_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting_caveat_quotes" ADD CONSTRAINT "reporting_caveat_quotes_reportingCaveatId_fkey" FOREIGN KEY ("reportingCaveatId") REFERENCES "reporting_caveats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metadata" ADD CONSTRAINT "Metadata_reportingCaveatId_fkey" FOREIGN KEY ("reportingCaveatId") REFERENCES "reporting_caveats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_flag_dismissals" ADD CONSTRAINT "review_flag_dismissals_reportingCaveatId_fkey" FOREIGN KEY ("reportingCaveatId") REFERENCES "reporting_caveats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
