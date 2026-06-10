CREATE TABLE "ReportingQuality" (
    "id"                        TEXT NOT NULL,
    "companyReportId"           TEXT NOT NULL,
    "usesGhgProtocolCategories" BOOLEAN,
    "methodChanges"             JSONB NOT NULL DEFAULT '[]',
    "missingScopesExplained"    BOOLEAN,

    CONSTRAINT "ReportingQuality_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReportingQuality_companyReportId_key"
    ON "ReportingQuality"("companyReportId");

ALTER TABLE "ReportingQuality"
    ADD CONSTRAINT "ReportingQuality_companyReportId_fkey"
    FOREIGN KEY ("companyReportId") REFERENCES "CompanyReport"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
